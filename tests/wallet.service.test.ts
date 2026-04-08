jest.mock("../src/config/database", () => ({
  db: {
    transaction: async (callback: (trx: object) => Promise<unknown>) => callback({}),
  },
}));

import { WalletService } from "../src/services/wallet.service";
import { BadRequestError, ConflictError, NotFoundError } from "../src/utils/errors";

describe("WalletService", () => {
  it("funds a wallet successfully", async () => {
    const walletRepository = {
      findWalletByUserId: jest.fn(),
      getWalletTransactions: jest.fn(),
      findWalletByUserIdForUpdate: jest.fn().mockResolvedValue({
        id: "wallet-1",
        userId: "user-1",
        walletNumber: "1234567890",
        balanceMinor: 0,
        currency: "NGN",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      incrementWalletBalance: jest.fn().mockResolvedValue({
        id: "wallet-1",
        userId: "user-1",
        walletNumber: "1234567890",
        balanceMinor: 50000,
        currency: "NGN",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      createWalletTransaction: jest.fn().mockResolvedValue(undefined),
    };

    const service = new WalletService(walletRepository as never);
    const result = await service.fundWallet("user-1", { amount: 500 });

    expect(result.balanceMinor).toBe(50000);
    expect(walletRepository.createWalletTransaction).toHaveBeenCalledTimes(1);
    expect(walletRepository.incrementWalletBalance).toHaveBeenCalledWith("wallet-1", 50000, {});
  });

  it("prevents withdrawing above current balance", async () => {
    const walletRepository = {
      findWalletByUserIdForUpdate: jest.fn().mockResolvedValue({
        id: "wallet-1",
        userId: "user-1",
        walletNumber: "1234567890",
        balanceMinor: 1000,
        currency: "NGN",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const service = new WalletService(walletRepository as never);

    await expect(service.withdrawFunds("user-1", { amount: 50 })).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects negative withdrawal amounts", async () => {
    const service = new WalletService({} as never);

    await expect(service.withdrawFunds("user-1", { amount: -50 })).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects transfers to the same wallet", async () => {
    const wallet = {
      id: "wallet-1",
      userId: "user-1",
      walletNumber: "1234567890",
      balanceMinor: 100000,
      currency: "NGN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const walletRepository = {
      findWalletByUserId: jest.fn().mockResolvedValue(wallet),
      findWalletByWalletNumber: jest.fn().mockResolvedValue(wallet),
    };

    const service = new WalletService(walletRepository as never);

    await expect(
      service.transferFunds("user-1", { recipientWalletNumber: "1234567890", amount: 100 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects transfers when recipient wallet does not exist", async () => {
    const walletRepository = {
      findWalletByUserId: jest.fn().mockResolvedValue({
        id: "wallet-1",
        userId: "user-1",
        walletNumber: "1234567890",
        balanceMinor: 100000,
        currency: "NGN",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findWalletByWalletNumber: jest.fn().mockResolvedValue(null),
    };

    const service = new WalletService(walletRepository as never);

    await expect(
      service.transferFunds("user-1", { recipientWalletNumber: "0987654321", amount: 100 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("transfers funds by decrementing sender and incrementing recipient within a transaction", async () => {
    const senderWallet = {
      id: "wallet-1",
      userId: "user-1",
      walletNumber: "1234567890",
      balanceMinor: 100000,
      currency: "NGN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const recipientWallet = {
      id: "wallet-2",
      userId: "user-2",
      walletNumber: "0987654321",
      balanceMinor: 10000,
      currency: "NGN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const walletRepository = {
      findWalletByUserId: jest.fn().mockResolvedValue(senderWallet),
      findWalletByWalletNumber: jest.fn().mockResolvedValue(recipientWallet),
      findWalletsByIdsForUpdate: jest.fn().mockResolvedValue([senderWallet, recipientWallet]),
      createWalletTransaction: jest.fn().mockResolvedValue(undefined),
      decrementWalletBalance: jest.fn().mockResolvedValue({
        ...senderWallet,
        balanceMinor: 80000,
      }),
      incrementWalletBalance: jest.fn().mockResolvedValue({
        ...recipientWallet,
        balanceMinor: 30000,
      }),
    };

    const service = new WalletService(walletRepository as never);
    const result = await service.transferFunds("user-1", {
      recipientWalletNumber: "0987654321",
      amount: 200,
    });

    expect(result.balanceMinor).toBe(80000);
    expect(walletRepository.createWalletTransaction).toHaveBeenCalledTimes(2);
    expect(walletRepository.decrementWalletBalance).toHaveBeenCalledWith("wallet-1", 20000, {});
    expect(walletRepository.incrementWalletBalance).toHaveBeenCalledWith("wallet-2", 20000, {});
  });
});
