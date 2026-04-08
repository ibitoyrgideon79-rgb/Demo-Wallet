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
    const transactionReference = generateId();

    return db.transaction(async (trx) => {
      const wallet = await this.walletRepository.findWalletByUserIdForUpdate(userId, trx);

      if (!wallet) {
        throw new NotFoundError("Wallet not found");
      }

      const balanceAfterMinor = wallet.balanceMinor + amountMinor;

      await this.walletRepository.createWalletTransaction(
        {
          id: generateId(),
          walletId: wallet.id,
          transactionReference,
          type: "funding",
          amountMinor,
          balanceBeforeMinor: wallet.balanceMinor,
          balanceAfterMinor,
          description,
        },
        trx,
      );

      const updatedWallet = await this.walletRepository.incrementWalletBalance(wallet.id, amountMinor, trx);

      return updatedWallet;
    });
  }

  async withdrawFunds(userId: string, input: WithdrawFundsInput): Promise<WalletModel> {
    const amountMinor = toMinorUnits(input.amount);
    const description = input.description?.trim() || "Wallet withdrawal";
    const transactionReference = generateId();

    return db.transaction(async (trx) => {
      const wallet = await this.walletRepository.findWalletByUserIdForUpdate(userId, trx);

      if (!wallet) {
        throw new NotFoundError("Wallet not found");
      }

      if (wallet.balanceMinor < amountMinor) {
        throw new BadRequestError("Insufficient wallet balance");
      }
      const balanceAfterMinor = wallet.balanceMinor - amountMinor;

      await this.walletRepository.createWalletTransaction(
        {
          id: generateId(),
          walletId: wallet.id,
          transactionReference,
          type: "withdrawal",
          amountMinor,
          balanceBeforeMinor: wallet.balanceMinor,
          balanceAfterMinor,
          description,
        },
        trx,
      );

      const updatedWallet = await this.walletRepository.decrementWalletBalance(wallet.id, amountMinor, trx);

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
      const senderWallet = await this.walletRepository.findWalletByUserId(userId, trx);

      if (!senderWallet) {
        throw new NotFoundError("Sender wallet not found");
      }

      const recipientWallet = await this.walletRepository.findWalletByWalletNumber(
        recipientWalletNumber,
        trx,
      );

      if (!recipientWallet) {
        throw new NotFoundError("Recipient wallet not found");
      }

      if (senderWallet.id === recipientWallet.id) {
        throw new ConflictError("You cannot transfer to your own wallet");
      }

      const lockedWallets = await this.walletRepository.findWalletsByIdsForUpdate(
        [senderWallet.id, recipientWallet.id].sort(),
        trx,
      );

      const lockedSenderWallet = lockedWallets.find((wallet) => wallet.id === senderWallet.id);
      const lockedRecipientWallet = lockedWallets.find((wallet) => wallet.id === recipientWallet.id);

      if (!lockedSenderWallet || !lockedRecipientWallet) {
        throw new NotFoundError("Wallet not found during transfer");
      }

      if (lockedSenderWallet.balanceMinor < amountMinor) {
        throw new BadRequestError("Insufficient wallet balance");
      }

      const transactionReference = generateId();
      const senderBalanceAfterMinor = lockedSenderWallet.balanceMinor - amountMinor;
      const recipientBalanceAfterMinor = lockedRecipientWallet.balanceMinor + amountMinor;

      await this.walletRepository.createWalletTransaction(
        {
          id: generateId(),
          walletId: lockedSenderWallet.id,
          transactionReference,
          type: "transfer_out",
          amountMinor,
          balanceBeforeMinor: lockedSenderWallet.balanceMinor,
          balanceAfterMinor: senderBalanceAfterMinor,
          counterpartyWalletId: lockedRecipientWallet.id,
          description,
        },
        trx,
      );

      await this.walletRepository.createWalletTransaction(
        {
          id: generateId(),
          walletId: lockedRecipientWallet.id,
          transactionReference,
          type: "transfer_in",
          amountMinor,
          balanceBeforeMinor: lockedRecipientWallet.balanceMinor,
          balanceAfterMinor: recipientBalanceAfterMinor,
          counterpartyWalletId: lockedSenderWallet.id,
          description,
        },
        trx,
      );

      const updatedSenderWallet = await this.walletRepository.decrementWalletBalance(
        lockedSenderWallet.id,
        amountMinor,
        trx,
      );

      await this.walletRepository.incrementWalletBalance(lockedRecipientWallet.id, amountMinor, trx);

      return updatedSenderWallet;
    });
  }
}
