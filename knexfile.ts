import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

const baseConfig: Knex.Config = {
  client: "mysql2",
  connection: {
    host: firstDefined(process.env.DB_HOST, process.env.MYSQLHOST),
    port: Number(firstDefined(process.env.DB_PORT, process.env.MYSQLPORT) ?? 3306),
    database: firstDefined(process.env.DB_NAME, process.env.MYSQLDATABASE),
    user: firstDefined(process.env.DB_USER, process.env.MYSQLUSER),
    password: firstDefined(process.env.DB_PASSWORD, process.env.MYSQLPASSWORD),
  },
  migrations: {
    directory: "./src/database/migrations",
    extension: "ts",
  },
  seeds: {
    directory: "./src/database/seeds",
    extension: "ts",
  },
};

const config: Record<string, Knex.Config> = {
  development: baseConfig,
  production: baseConfig,
};

export default config;
