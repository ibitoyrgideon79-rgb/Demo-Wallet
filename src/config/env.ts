import dotenv from "dotenv";

dotenv.config();

function toNumber(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 3000),
  dbHost: firstDefined(process.env.DB_HOST, process.env.MYSQLHOST) ?? "127.0.0.1",
  dbPort: toNumber(firstDefined(process.env.DB_PORT, process.env.MYSQLPORT), 3306),
  dbName: firstDefined(process.env.DB_NAME, process.env.MYSQLDATABASE) ?? "demo_wallet",
  dbUser: firstDefined(process.env.DB_USER, process.env.MYSQLUSER) ?? "root",
  dbPassword: firstDefined(process.env.DB_PASSWORD, process.env.MYSQLPASSWORD) ?? "",
  adjutorBaseUrl: process.env.ADJUTOR_BASE_URL ?? "https://adjutor.lendsqr.com",
  adjutorApiKey: process.env.ADJUTOR_API_KEY ?? "",
  adjutorTimeoutMs: toNumber(process.env.ADJUTOR_TIMEOUT_MS, 5000),
} as const;
