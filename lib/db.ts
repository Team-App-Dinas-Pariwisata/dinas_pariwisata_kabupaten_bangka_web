import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

const globalForDb = globalThis as unknown as { appekrafDb?: Pool };

function buildOptions(): PoolOptions {
  return {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "dinas_pariwisata",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
    queueLimit: 0,
    charset: "utf8mb4",
    dateStrings: true,
    decimalNumbers: true,
  };
}

export function db(): Pool {
  if (!globalForDb.appekrafDb) {
    globalForDb.appekrafDb = mysql.createPool(buildOptions());
  }
  return globalForDb.appekrafDb;
}
