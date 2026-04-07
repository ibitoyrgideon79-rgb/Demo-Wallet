export type WalletTransactionType =
  | "funding"
  | "transfer_in"
  | "transfer_out"
  | "withdrawal";

export interface WalletTransactionModel {
  id: string;
  walletId: string;
  transactionReference: string;
  type: WalletTransactionType;
  amountMinor: number;
  balanceBeforeMinor: number;
  balanceAfterMinor: number;
  counterpartyWalletId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
