import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary();
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("phone_number", 20).notNullable().unique();
    table.string("bvn", 11).notNullable().unique();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("wallets", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable().unique();
    table.string("wallet_number", 10).notNullable().unique();
    table.bigInteger("balance_minor").notNullable().defaultTo(0);
    table.string("currency", 3).notNullable().defaultTo("NGN");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");
  });

  await knex.schema.createTable("auth_tokens", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable();
    table.string("token_hash", 255).notNullable().unique();
    table.timestamp("expires_at").nullable();
    table.timestamp("last_used_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.index(["user_id"]);
  });

  await knex.schema.createTable("wallet_transactions", (table) => {
    table.uuid("id").primary();
    table.uuid("wallet_id").notNullable();
    table.string("transaction_reference", 100).notNullable();
    table.enu("type", ["funding", "transfer_in", "transfer_out", "withdrawal"]).notNullable();
    table.bigInteger("amount_minor").notNullable();
    table.bigInteger("balance_before_minor").notNullable();
    table.bigInteger("balance_after_minor").notNullable();
    table.uuid("counterparty_wallet_id").nullable();
    table.string("description", 255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("wallet_id").references("id").inTable("wallets").onDelete("CASCADE");
    table.foreign("counterparty_wallet_id").references("id").inTable("wallets").onDelete("SET NULL");

    table.index(["wallet_id"]);
    table.index(["transaction_reference"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wallet_transactions");
  await knex.schema.dropTableIfExists("auth_tokens");
  await knex.schema.dropTableIfExists("wallets");
  await knex.schema.dropTableIfExists("users");
}
