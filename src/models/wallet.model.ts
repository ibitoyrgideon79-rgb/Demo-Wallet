export interface WalletModel {
  id: string;
  userId: string;
  walletNumber: string;
  balanceMinor: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
