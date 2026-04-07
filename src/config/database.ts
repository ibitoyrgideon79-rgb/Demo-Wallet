import knex, { type Knex } from "knex";

import { env } from "./env";

const databaseConfig: Knex.Config = {
  client: "mysql2",
  connection: {
    host: env.dbHost,
    port: env.dbPort,
    database: env.dbName,
    user: env.dbUser,
    password: env.dbPassword,
  },
};

export const db = knex(databaseConfig);
