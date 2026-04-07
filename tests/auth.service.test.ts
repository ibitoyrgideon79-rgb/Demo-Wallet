import { AuthService } from "../src/services/auth.service";
import { BadRequestError, UnauthorizedError } from "../src/utils/errors";

describe("AuthService", () => {
  it("logs in a user and returns a token", async () => {
    const userRepository = {
      findUserByEmail: jest.fn().mockResolvedValue({
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

    const authRepository = {
      createAuthToken: jest.fn().mockResolvedValue(undefined),
      findAuthTokenByHash: jest.fn(),
      touchAuthToken: jest.fn(),
      deleteAuthTokenByHash: jest.fn(),
    };

    const service = new AuthService(userRepository as never, authRepository as never);
    const result = await service.login({ email: "ADA@example.com", bvn: "12345678901" });

    expect(result.user.email).toBe("ada@example.com");
    expect(result.token).toContain("demo_");
    expect(authRepository.createAuthToken).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid login credentials", async () => {
    const userRepository = {
      findUserByEmail: jest.fn().mockResolvedValue(null),
    };

    const service = new AuthService(userRepository as never, {} as never);

    await expect(service.login({ email: "ada@example.com", bvn: "12345678901" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("rejects missing login fields", async () => {
    const service = new AuthService({} as never, {} as never);

    await expect(service.login({ email: "", bvn: "" })).rejects.toBeInstanceOf(BadRequestError);
  });
});
