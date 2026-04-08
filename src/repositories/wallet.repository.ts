import type { Knex } from "knex";

import { db } from "../config/database";
import type { WalletModel } from "../models/wallet.model";
import type {
  WalletTransactionModel,
  WalletTransactionType
} from "../models/wallet-transaction.model";

type DbExecutor = Knex | Knex.Transaction;

interface WalletRow {
  id: string;
  user_id: string;
  wallet_number: string;
  balance_minor: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

interface WalletTransactionRow {
  id: string;
  wallet_id: string;
  transaction_reference: string;
  type: WalletTransactionType;
  amount_minor: number;
  balance_before_minor: number;
  balance_after_minor: number;
  counterparty_wallet_id: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWalletRepositoryInput {
  id: string;
  userId: string;
  walletNumber: string;
  currency: string;
}

export interface CreateWalletTransactionRepositoryInput {
  id: string;
  walletId: string;
  transactionReference: string;
  type: WalletTransactionType;
  amountMinor: number;
  balanceBeforeMinor: number;
  balanceAfterMinor: number;
  counterpartyWalletId?: string | null;
  description?: string | null;
}

export class WalletRepository {
  private readonly walletTableName = "wallets";
  private readonly walletTransactionTableName = "wallet_transactions";

  private mapWalletRowToModel(row: WalletRow): WalletModel {
    return {
      id: row.id,
      userId: row.user_id,
      walletNumber: row.wallet_number,
      balanceMinor: Number(row.balance_minor),
      currency: row.currency,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapWalletTransactionRowToModel(
    row: WalletTransactionRow
  ): WalletTransactionModel {
    return {
      id: row.id,
      walletId: row.wallet_id,
      transactionReference: row.transaction_reference,
      type: row.type,
      amountMinor: Number(row.amount_minor),
      balanceBeforeMinor: Number(row.balance_before_minor),
      balanceAfterMinor: Number(row.balance_after_minor),
      counterpartyWalletId: row.counterparty_wallet_id,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  async createWallet(
    input: CreateWalletRepositoryInput,
    executor: DbExecutor = db
  ): Promise<WalletModel> {
    await executor<WalletRow>(this.walletTableName).insert({
      id: input.id,
      user_id: input.userId,
      wallet_number: input.walletNumber,
      currency: input.currency
    });

    const createdWallet = await executor<WalletRow>(this.walletTableName)
      .where({ id: input.id })
      .first();

    if (!createdWallet) {
      throw new Error("Failed to create wallet");
    }

    return this.mapWalletRowToModel(createdWallet);
  }

  async findWalletById(
    id: string,
    executor: DbExecutor = db
  ): Promise<WalletModel | null> {
    const wallet = await executor<WalletRow>(this.walletTableName)
      .where({ id })
      .first();

    return wallet ? this.mapWalletRowToModel(wallet) : null;
  }

  async findWalletByUserId(
    userId: string,
    executor: DbExecutor = db
  ): Promise<WalletModel | null> {
    const wallet = await executor<WalletRow>(this.walletTableName)
      .where({ user_id: userId })
      .first();

    return wallet ? this.mapWalletRowToModel(wallet) : null;
  }

  async findWalletByWalletNumber(
    walletNumber: string,
    executor: DbExecutor = db
  ): Promise<WalletModel | null> {
    const wallet = await executor<WalletRow>(this.walletTableName)
      .where({ wallet_number: walletNumber })
      .first();

    return wallet ? this.mapWalletRowToModel(wallet) : null;
  }

  async findWalletByUserIdForUpdate(
    userId: string,
    trx: Knex.Transaction
  ): Promise<WalletModel | null> {
    const wallet = await trx<WalletRow>(this.walletTableName)
      .where({ user_id: userId })
      .forUpdate()
      .first();

    return wallet ? this.mapWalletRowToModel(wallet) : null;
  }

  async findWalletByWalletNumberForUpdate(
    walletNumber: string,
    trx: Knex.Transaction
  ): Promise<WalletModel | null> {
    const wallet = await trx<WalletRow>(this.walletTableName)
      .where({ wallet_number: walletNumber })
      .forUpdate()
      .first();

    return wallet ? this.mapWalletRowToModel(wallet) : null;
  }

  async findWalletsByIdsForUpdate(
    walletIds: string[],
    trx: Knex.Transaction
  ): Promise<WalletModel[]> {
    const rows = await trx<WalletRow>(this.walletTableName)
      .whereIn("id", walletIds)
      .orderBy("id", "asc")
      .forUpdate();

    return rows.map((row) => this.mapWalletRowToModel(row));
  }

  async updateWalletBalance(
    walletId: string,
    balanceMinor: number,
    executor: DbExecutor = db
  ): Promise<WalletModel> {
    await executor<WalletRow>(this.walletTableName)
      .where({ id: walletId })
      .update({
        balance_minor: balanceMinor,
        updated_at: executor.fn.now()
      });

    const updatedWallet = await executor<WalletRow>(this.walletTableName)
      .where({ id: walletId })
      .first();

    if (!updatedWallet) {
      throw new Error("Failed to update wallet balance");
    }

    return this.mapWalletRowToModel(updatedWallet);
  }

  async incrementWalletBalance(
    walletId: string,
    amountMinor: number,
    executor: DbExecutor = db
  ): Promise<WalletModel> {
    await executor<WalletRow>(this.walletTableName)
      .where({ id: walletId })
      .increment("balance_minor", amountMinor)
      .update({
        updated_at: executor.fn.now()
      });

    const updatedWallet = await executor<WalletRow>(this.walletTableName)
      .where({ id: walletId })
      .first();

    if (!updatedWallet) {
      throw new Error("Failed to increment wallet balance");
    }

    return this.mapWalletRowToModel(updatedWallet);
  }

  async decrementWalletBalance(
    walletId: string,
    amountMinor: number,
    executor: DbExecutor = db
  ): Promise<WalletModel> {
    await executor<WalletRow>(this.walletTableName)
      .where({ id: walletId })
      .decrement("balance_minor", amountMinor)
      .update({
        updated_at: executor.fn.now()
      });

    const updatedWallet = await executor<WalletRow>(this.walletTableName)
      .where({ id: walletId })
      .first();

    if (!updatedWallet) {
      throw new Error("Failed to decrement wallet balance");
    }

    return this.mapWalletRowToModel(updatedWallet);
  }

  async createWalletTransaction(
    input: CreateWalletTransactionRepositoryInput,
    executor: DbExecutor = db
  ): Promise<WalletTransactionModel> {
    await executor<WalletTransactionRow>(this.walletTransactionTableName).insert({
      id: input.id,
      wallet_id: input.walletId,
      transaction_reference: input.transactionReference,
      type: input.type,
      amount_minor: input.amountMinor,
      balance_before_minor: input.balanceBeforeMinor,
      balance_after_minor: input.balanceAfterMinor,
      counterparty_wallet_id: input.counterpartyWalletId ?? null,
      description: input.description ?? null
    });

    const createdTransaction = await executor<WalletTransactionRow>(
      this.walletTransactionTableName
    )
      .where({ id: input.id })
      .first();

    if (!createdTransaction) {
      throw new Error("Failed to create wallet transaction");
    }

    return this.mapWalletTransactionRowToModel(createdTransaction);
  }

  async getWalletTransactions(
    walletId: string,
    executor: DbExecutor = db
  ): Promise<WalletTransactionModel[]> {
    const rows = await executor<WalletTransactionRow>(
      this.walletTransactionTableName
    )
      .where({ wallet_id: walletId })
      .orderBy("created_at", "desc");

    return rows.map((row) => this.mapWalletTransactionRowToModel(row));
  }
}
