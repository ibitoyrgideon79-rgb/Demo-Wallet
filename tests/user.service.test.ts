jest.mock("../src/config/database", () => ({
  db: {
    transaction: async (callback: (trx: object) => Promise<unknown>) => callback({}),
  },
}));

import { UserService } from "../src/services/user.service";
import { ConflictError, ForbiddenError } from "../src/utils/errors";

describe("UserService", () => {
  it("registers a new user and wallet", async () => {
    const userRepository = {
      findUserByEmail: jest.fn().mockResolvedValue(null),
      findUserByPhoneNumber: jest.fn().mockResolvedValue(null),
      findUserByBvn: jest.fn().mockResolvedValue(null),
      createUser: jest.fn().mockResolvedValue({
        id: "user-1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phoneNumber: "08000000000",
        bvn: "12345678901",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const walletRepository = {
      createWallet: jest.fn().mockResolvedValue({
        id: "wallet-1",
        userId: "user-1",
        walletNumber: "1234567890",
        balanceMinor: 0,
        currency: "NGN",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const blacklistService = {
      ensureUserIsNotBlacklisted: jest.fn().mockResolvedValue(undefined),
    };

    const service = new UserService(
      userRepository as never,
      walletRepository as never,
      blacklistService as never,
    );

    const result = await service.registerUser({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ADA@example.com",
      phoneNumber: "08000000000",
      bvn: "12345678901",
    });

    expect(result.user.id).toBe("user-1");
    expect(result.wallet.walletNumber).toBe("1234567890");
    expect(blacklistService.ensureUserIsNotBlacklisted).toHaveBeenCalledTimes(3);
  });

  it("rejects duplicate email registration", async () => {
    const userRepository = {
      findUserByEmail: jest.fn().mockResolvedValue({ id: "existing-user" }),
      findUserByPhoneNumber: jest.fn().mockResolvedValue(null),
      findUserByBvn: jest.fn().mockResolvedValue(null),
    };

    const service = new UserService(userRepository as never, {} as never, {} as never);

    await expect(
      service.registerUser({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phoneNumber: "08000000000",
        bvn: "12345678901",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects blacklisted users", async () => {
    const userRepository = {
      findUserByEmail: jest.fn().mockResolvedValue(null),
      findUserByPhoneNumber: jest.fn().mockResolvedValue(null),
      findUserByBvn: jest.fn().mockResolvedValue(null),
    };

    const blacklistService = {
      ensureUserIsNotBlacklisted: jest.fn().mockRejectedValue(new ForbiddenError("blocked")),
    };

    const service = new UserService(userRepository as never, {} as never, blacklistService as never);

    await expect(
      service.registerUser({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phoneNumber: "08000000000",
        bvn: "12345678901",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
