export interface FundWalletInput {
  amount: number;
  description?: string;
}

export interface TransferFundsInput {
  recipientWalletNumber: string;
  amount: number;
  description?: string;
}

export interface WithdrawFundsInput {
  amount: number;
  description?: string;
}
