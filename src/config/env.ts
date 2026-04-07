import dotenv from "dotenv";

dotenv.config();

function toNumber(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 3000),
  dbHost: process.env.DB_HOST ?? "127.0.0.1",
  dbPort: toNumber(process.env.DB_PORT, 3306),
  dbName: process.env.DB_NAME ?? "demo_wallet",
  dbUser: process.env.DB_USER ?? "root",
  dbPassword: process.env.DB_PASSWORD ?? "",
  adjutorBaseUrl: process.env.ADJUTOR_BASE_URL ?? "https://adjutor.lendsqr.com",
  adjutorApiKey: process.env.ADJUTOR_API_KEY ?? "",
  adjutorTimeoutMs: toNumber(process.env.ADJUTOR_TIMEOUT_MS, 5000),
} as const;
