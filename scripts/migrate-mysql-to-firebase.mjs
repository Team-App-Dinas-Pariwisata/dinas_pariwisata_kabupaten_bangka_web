import mysql from "mysql2/promise";
import { createSign } from "node:crypto";

let cachedAccessToken = null;

function required(name, value) {
  if (!value?.trim()) throw new Error(`${name} belum diisi.`);
  return value.trim();
}

function databaseUrl() {
  return required("FIREBASE_DATABASE_URL", process.env.FIREBASE_DATABASE_URL).replace(/\/+$/, "");
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) return cachedAccessToken.token;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!clientEmail || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(privateKey))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Autentikasi Firebase gagal (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  if (!data.access_token) throw new Error("Firebase OAuth tidak mengembalikan access_token.");
  cachedAccessToken = { token: data.access_token, expiresAt: Date.now() + (Number(data.expires_in ?? 3600) - 120) * 1000 };
  return data.access_token;
}

async function firebasePut(path, value) {
  const legacyToken = process.env.FIREBASE_DATABASE_AUTH_TOKEN?.trim();
  const token = legacyToken ? null : await accessToken();
  if (!legacyToken && !token) throw new Error("Isi FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY, atau FIREBASE_DATABASE_AUTH_TOKEN.");
  const query = legacyToken
    ? `?auth=${encodeURIComponent(legacyToken)}`
    : `?access_token=${encodeURIComponent(token)}`;
  const encoded = path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  const response = await fetch(`${databaseUrl()}/${encoded}.json${query}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value ?? null),
  });
  if (!response.ok) throw new Error(`Firebase PUT ${path} gagal (${response.status}): ${(await response.text()).slice(0, 500)}`);
}

function mysqlConfig() {
  return {
    host: required("LEGACY_DB_HOST", process.env.LEGACY_DB_HOST ?? process.env.DB_HOST),
    port: Number(process.env.LEGACY_DB_PORT ?? process.env.DB_PORT ?? 3306),
    user: required("LEGACY_DB_USER", process.env.LEGACY_DB_USER ?? process.env.DB_USER),
    password: process.env.LEGACY_DB_PASSWORD ?? process.env.DB_PASSWORD ?? "",
    database: required("LEGACY_DB_NAME", process.env.LEGACY_DB_NAME ?? process.env.DB_NAME),
    dateStrings: true,
    decimalNumbers: true,
    multipleStatements: false,
  };
}

function firebaseKey(value) {
  return String(value).replace(/[.#$\[\]/]/g, "_");
}

function clean(value) {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace("T", " ");
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  return value;
}

async function main() {
  if (process.env.MIGRATION_CONFIRM !== "YES") {
    throw new Error("Migrasi dibatalkan. Set MIGRATION_CONFIRM=YES setelah memastikan project Firebase tujuan sudah benar.");
  }

  const connection = await mysql.createConnection(mysqlConfig());
  try {
    const [tableRows] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const tableNameField = Object.keys(tableRows[0] ?? {}).find((key) => key.startsWith("Tables_in_"));
    if (!tableNameField) throw new Error("Daftar tabel MySQL tidak dapat dibaca.");
    const tables = tableRows.map((row) => String(row[tableNameField]));
    const counters = {};
    const migrationStats = {};
    console.log(`Ditemukan ${tables.length} tabel MySQL.`);

    for (const table of tables) {
      const safeTable = table.replace(/`/g, "``");
      const [pkRows] = await connection.query(`SHOW KEYS FROM \`${safeTable}\` WHERE Key_name = 'PRIMARY'`);
      const primaryColumns = pkRows.sort((a, b) => Number(a.Seq_in_index) - Number(b.Seq_in_index)).map((row) => String(row.Column_name));
      const [rows] = await connection.query(`SELECT * FROM \`${safeTable}\``);
      const node = {};
      let maxNumericId = 0;

      rows.forEach((source, index) => {
        const row = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, clean(value)]));
        let key;
        if (row.id !== undefined && row.id !== null && Number.isSafeInteger(Number(row.id))) {
          key = String(Number(row.id));
          maxNumericId = Math.max(maxNumericId, Number(row.id));
        } else if (primaryColumns.length) {
          key = primaryColumns.map((column) => firebaseKey(row[column] ?? "null")).join("_");
        } else key = String(index + 1);
        node[key] = row;
      });

      await firebasePut(table, node);
      if (maxNumericId > 0) counters[table] = maxNumericId;
      migrationStats[table] = rows.length;
      console.log(`✓ ${table}: ${rows.length} baris`);
    }

    await firebasePut("__meta/counters", counters);
    await firebasePut("__meta/migration", { source: "mysql", migrated_at: new Date().toISOString(), tables: migrationStats });
    console.log("Migrasi selesai. Counter numeric ID dan metadata migrasi sudah dibuat.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Migrasi gagal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
