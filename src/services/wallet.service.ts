import { db } from "../config/database";
import type { WalletTransactionModel } from "../models/wallet-transaction.model";
import type { WalletModel } from "../models/wallet.model";
import { WalletRepository } from "../repositories/wallet.repository";
import type { FundWalletInput, TransferFundsInput, WithdrawFundsInput } from "../types/wallet.types";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import { generateId } from "../utils/ids";
import { toMinorUnits } from "../utils/money";

export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) {}

  async getWalletForUser(userId: string): Promise<WalletModel> {
    const wallet = await this.walletRepository.findWalletByUserId(userId);

    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    return wallet;
  }

  async getWalletTransactions(userId: string): Promise<WalletTransactionModel[]> {
    const wallet = await this.getWalletForUser(userId);
    return this.walletRepository.getWalletTransactions(wallet.id);
  }

  async fundWallet(userId: string, input: FundWalletInput): Promise<WalletModel> {
    const amountMinor = toMinorUnits(input.amount);
    const description = input.description?.trim() || "Wallet funding";

    return db.transaction(async (trx) => {
      const wallet = await this.walletRepository.findWalletByUserIdForUpdate(userId, trx);

      if (!wallet) {
        throw new NotFoundError("Wallet not found");
      }

      const updatedWallet = await this.walletRepository.updateWalletBalance(
        wallet.id,
        wallet.balanceMinor + amountMinor,
        trx,
      );

      await this.walletRepository.createWalletTransaction(
        {
          id: generateId(),
          walletId: wallet.id,
          transactionReference: generateId(),
          type: "funding",
          amountMinor,
          balanceBeforeMinor: wallet.balanceMinor,
          balanceAfterMinor: updatedWallet.balanceMinor,
          description,
        },
        trx,
      );

      return updatedWallet;
    });
  }

  async withdrawFunds(userId: string, input: WithdrawFundsInput): Promise<WalletModel> {
    const amountMinor = toMinorUnits(input.amount);
    const description = input.description?.trim() || "Wallet withdrawal";

    return db.transaction(async (trx) => {
      const wallet = await this.walletRepository.findWalletByUserIdForUpdate(userId, trx);

      if (!wallet) {
        throw new NotFoundError("Wallet not found");
      }

      if (wallet.balanceMinor < amountMinor) {
        throw new BadRequestError("Insufficient wallet balance");
      }

      const updatedWallet = await this.walletRepository.updateWalletBalance(
        wallet.id,
        wallet.balanceMinor - amountMinor,
        trx,
      );

      await this.walletRepository.createWalletTransaction(
        {
          id: generateId(),
          walletId: wallet.id,
          transactionReference: generateId(),
          type: "withdrawal",
          amountMinor,
          balanceBeforeMinor: wallet.balanceMinor,
          balanceAfterMinor: updatedWallet.balanceMinor,
          description,
        },
        trx,
      );

      return updatedWallet;
    });
  }

  async transferFunds(userId: string, input: TransferFundsInput): Promise<WalletModel> {
    const recipientWalletNumber = input.recipientWalletNumber?.trim();
    const amountMinor = toMinorUnits(input.amount);
    const description = input.description?.trim() || "Wallet transfer";

    if (!recipientWalletNumber) {
      throw new BadRequestError("Recipient wallet number is required");
    }

    return db.transaction(async (trx) => {
      const senderWallet = await this.walletRepository.findWalletByUserIdForUpdate(userId, trx);

      if (!senderWallet) {
        throw new NotFoundError("Sender wallet not found");
      }

      const recipientWallet = await this.walletRepository.findWalletByWalletNumberForUpdate(
        recipientWalletNumber,
        trx,
      );

      if (!recipientWallet) {
        throw new NotFoundError("Recipient wallet not found");
      }

      if (senderWallet.id === recipientWallet.id) {
        throw new ConflictError("You cannot transfer to your own wallet");
      }

      if (senderWallet.balanceMinor < amountMinor) {
        throw new BadRequestError("Insufficient wallet balance");
      }

      const transactionReference = generateId();

      const updatedSenderWallet = await this.walletRepository.updateWalletBalance(
        senderWallet.id,
        senderWallet.balanceMinor - amountMinor,
        trx,
      );

      const updatedRecipientWallet = await this.walletRepository.updateWalletBalance(
        recipientWallet.id,
        recipientWallet.balanceMinor + amountMinor,
        trx,
      );

      await this.walletRepository.createWalletTransaction(
        {
          id: generateId(),
          walletId: senderWallet.id,
          transactionReference,
          type: "transfer_out",
          amountMinor,
          balanceBeforeMinor: senderWallet.balanceMinor,
          balanceAfterMinor: updatedSenderWallet.balanceMinor,
          counterpartyWalletId: recipientWallet.id,
          description,
        },
        trx,
      );

      await this.walletRepository.createWalletTransaction(
        {
          id: generateId(),
          walletId: recipientWallet.id,
          transactionReference,
          type: "transfer_in",
          amountMinor,
          balanceBeforeMinor: recipientWallet.balanceMinor,
          balanceAfterMinor: updatedRecipientWallet.balanceMinor,
          counterpartyWalletId: senderWallet.id,
          description,
        },
        trx,
      );

      return updatedSenderWallet;
    });
  }
}
