import type { Knex } from "knex";

import { db } from "../config/database";
import type { UserModel } from "../models/user.model";

type DbExecutor = Knex | Knex.Transaction;

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bvn: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRepositoryInput {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bvn: string;
}

export class UserRepository {
  private readonly tableName = "users";

  private mapRowToModel(row: UserRow): UserModel {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phoneNumber: row.phone_number,
      bvn: row.bvn,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async createUser(
    input: CreateUserRepositoryInput,
    executor: DbExecutor = db,
  ): Promise<UserModel> {
    await executor<UserRow>(this.tableName).insert({
      id: input.id,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone_number: input.phoneNumber,
      bvn: input.bvn,
    });

    const createdUser = await executor<UserRow>(this.tableName)
      .where({ id: input.id })
      .first();

    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    return this.mapRowToModel(createdUser);
  }

  async findUserById(id: string, executor: DbExecutor = db): Promise<UserModel | null> {
    const user = await executor<UserRow>(this.tableName)
      .where({ id })
      .first();

    return user ? this.mapRowToModel(user) : null;
  }

  async findUserByEmail(email: string, executor: DbExecutor = db): Promise<UserModel | null> {
    const user = await executor<UserRow>(this.tableName)
      .where({ email })
      .first();

    return user ? this.mapRowToModel(user) : null;
  }

  async findUserByPhoneNumber(
    phoneNumber: string,
    executor: DbExecutor = db,
  ): Promise<UserModel | null> {
    const user = await executor<UserRow>(this.tableName)
      .where({ phone_number: phoneNumber })
      .first();

    return user ? this.mapRowToModel(user) : null;
  }

  async findUserByBvn(bvn: string, executor: DbExecutor = db): Promise<UserModel | null> {
    const user = await executor<UserRow>(this.tableName)
      .where({ bvn })
      .first();

    return user ? this.mapRowToModel(user) : null;
  }
}
