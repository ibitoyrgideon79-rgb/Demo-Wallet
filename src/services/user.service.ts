import { randomInt } from "crypto";
import type { Knex } from "knex";

import { db } from "../config/database";
import type { UserModel } from "../models/user.model";
import type { WalletModel } from "../models/wallet.model";
import { UserRepository } from "../repositories/user.repository";
import { WalletRepository } from "../repositories/wallet.repository";
import type { RegisterUserInput } from "../types/auth.types";
import { generateId } from "../utils/ids";
import { BadRequestError, ConflictError } from "../utils/errors";
import { BlacklistService } from "./blacklist.service";

export interface RegisterUserResult {
  user: UserModel;
  wallet: WalletModel;
}

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly blacklistService: BlacklistService,
  ) {}

  async registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
    const sanitizedInput = this.sanitizeRegisterInput(input);

    await this.ensureUserDoesNotExist(sanitizedInput);
    await this.blacklistService.ensureUserIsNotBlacklisted(sanitizedInput.bvn);
    await this.blacklistService.ensureUserIsNotBlacklisted(sanitizedInput.email);
    await this.blacklistService.ensureUserIsNotBlacklisted(sanitizedInput.phoneNumber);

    try {
      return await db.transaction(async (trx) => {
        const user = await this.userRepository.createUser(
          {
            id: generateId(),
            ...sanitizedInput,
          },
          trx,
        );

        const wallet = await this.createWalletForUser(user.id, trx);

        return { user, wallet };
      });
    } catch (error) {
      const maybeDatabaseError = error as { code?: string };

      if (maybeDatabaseError.code === "ER_DUP_ENTRY") {
        throw new ConflictError("User with provided details already exists");
      }

      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserModel | null> {
    return this.userRepository.findUserById(userId);
  }

  private sanitizeRegisterInput(input: RegisterUserInput): RegisterUserInput {
    const sanitizedInput = {
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      email: input.email?.trim().toLowerCase(),
      phoneNumber: input.phoneNumber?.trim(),
      bvn: input.bvn?.trim(),
    };

    if (
      !sanitizedInput.firstName ||
      !sanitizedInput.lastName ||
      !sanitizedInput.email ||
      !sanitizedInput.phoneNumber ||
      !sanitizedInput.bvn
    ) {
      throw new BadRequestError("All registration fields are required");
    }

    if (!/^\d{11}$/.test(sanitizedInput.bvn)) {
      throw new BadRequestError("BVN must be 11 digits");
    }

    return sanitizedInput;
  }

  private async ensureUserDoesNotExist(input: RegisterUserInput): Promise<void> {
    const [userByEmail, userByPhoneNumber, userByBvn] = await Promise.all([
      this.userRepository.findUserByEmail(input.email),
      this.userRepository.findUserByPhoneNumber(input.phoneNumber),
      this.userRepository.findUserByBvn(input.bvn),
    ]);

    if (userByEmail) {
      throw new ConflictError("Email is already registered");
    }

    if (userByPhoneNumber) {
      throw new ConflictError("Phone number is already registered");
    }

    if (userByBvn) {
      throw new ConflictError("BVN is already registered");
    }
  }

  private async createWalletForUser(userId: string, trx: Knex.Transaction): Promise<WalletModel> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.walletRepository.createWallet(
          {
            id: generateId(),
            userId,
            walletNumber: this.generateWalletNumber(),
            currency: "NGN",
          },
          trx,
        );
      } catch (error) {
        const maybeDatabaseError = error as { code?: string };

        if (maybeDatabaseError.code === "ER_DUP_ENTRY") {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictError("Unable to generate a unique wallet number");
  }

  private generateWalletNumber(): string {
    return Array.from({ length: 10 }, () => randomInt(0, 10).toString()).join("");
  }
}
