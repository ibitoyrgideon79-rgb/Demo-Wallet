import { createHash, randomBytes } from "crypto";

import type { UserModel } from "../models/user.model";
import { AuthRepository } from "../repositories/auth.repository";
import { UserRepository } from "../repositories/user.repository";
import type { LoginInput } from "../types/auth.types";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { generateId } from "../utils/ids";

export interface AuthResult {
  user: UserModel;
  token: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email?.trim().toLowerCase();
    const bvn = input.bvn?.trim();

    if (!email || !bvn) {
      throw new BadRequestError("Email and BVN are required");
    }

    const user = await this.userRepository.findUserByEmail(email);

    if (!user || user.bvn !== bvn) {
      throw new UnauthorizedError("Invalid login credentials");
    }

    const token = await this.issueToken(user.id);

    return { user, token };
  }

  async issueToken(userId: string): Promise<string> {
    const token = `demo_${randomBytes(32).toString("hex")}`;
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.authRepository.createAuthToken({
      id: generateId(),
      userId,
      tokenHash,
      expiresAt,
    });

    return token;
  }

  async authenticate(token: string): Promise<{ userId: string }> {
    if (!token) {
      throw new UnauthorizedError("Missing auth token");
    }

    const tokenHash = this.hashToken(token);
    const storedToken = await this.authRepository.findAuthTokenByHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError("Invalid auth token");
    }

    if (storedToken.expiresAt && storedToken.expiresAt.getTime() < Date.now()) {
      await this.authRepository.deleteAuthTokenByHash(tokenHash);
      throw new UnauthorizedError("Auth token has expired");
    }

    await this.authRepository.touchAuthToken(tokenHash);

    return { userId: storedToken.userId };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
