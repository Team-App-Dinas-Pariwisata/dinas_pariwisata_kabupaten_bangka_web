import { createSign } from "node:crypto";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type Snapshot<T = unknown> = {
  val(): T;
  exists(): boolean;
};

type TransactionResult<T = unknown> = {
  snapshot: Snapshot<T>;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function databaseUrl() {
  const value = process.env.FIREBASE_DATABASE_URL?.trim().replace(/\/+$/, "");
  if (!value) throw new Error("FIREBASE_DATABASE_URL belum dikonfigurasi.");
  return value;
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function serviceAccountAccessToken() {
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
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Autentikasi service account Firebase gagal (${response.status}): ${detail.slice(0, 300)}`);
  }
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Firebase OAuth tidak mengembalikan access_token.");
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(300, Number(data.expires_in ?? 3600) - 120) * 1000,
  };
  return data.access_token;
}

function encodedPath(path: string) {
  return path.split("/").filter(Boolean).map((segment) => encodeURIComponent(segment)).join("/");
}

async function request(path: string, init: RequestInit = {}, options?: { etag?: boolean }) {
  const legacyToken = process.env.FIREBASE_DATABASE_AUTH_TOKEN?.trim();
  const accessToken = legacyToken ? null : await serviceAccountAccessToken();
  if (!legacyToken && !accessToken) {
    throw new Error("Kredensial Firebase belum lengkap. Isi FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY, atau FIREBASE_DATABASE_AUTH_TOKEN.");
  }

  const query = legacyToken
    ? `?auth=${encodeURIComponent(legacyToken)}`
    : `?access_token=${encodeURIComponent(accessToken!)}`;
  const url = `${databaseUrl()}/${encodedPath(path)}.json${query}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  if (options?.etag) headers.set("X-Firebase-ETag", "true");

  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Firebase Realtime Database request gagal (${response.status}): ${detail.slice(0, 500)}`) as Error & { status?: number; etag?: string | null };
    error.status = response.status;
    error.etag = response.headers.get("etag");
    throw error;
  }
  return response;
}

function snapshot<T>(value: T): Snapshot<T> {
  return { val: () => value, exists: () => value !== null && value !== undefined };
}

class FirebaseRestRef {
  constructor(private readonly path: string) {}

  async get() {
    const response = await request(this.path);
    return snapshot(await response.json());
  }

  async set(value: unknown) {
    await request(this.path, { method: "PUT", body: JSON.stringify(value ?? null) });
  }

  async update(value: Record<string, unknown>) {
    await request(this.path, { method: "PATCH", body: JSON.stringify(value) });
  }

  async remove() {
    await request(this.path, { method: "DELETE" });
  }

  async transaction(updateFn: (current: unknown) => unknown): Promise<TransactionResult> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const getResponse = await request(this.path, {}, { etag: true });
      const etag = getResponse.headers.get("etag");
      const current = await getResponse.json();
      const next = updateFn(current);
      if (next === undefined) return { snapshot: snapshot(current) };

      try {
        const putResponse = await request(this.path, {
          method: "PUT",
          headers: etag ? { "If-Match": etag } : undefined,
          body: JSON.stringify(next),
        });
        return { snapshot: snapshot(await putResponse.json()) };
      } catch (error) {
        if ((error as { status?: number }).status === 412) continue;
        throw error;
      }
    }
    throw new Error(`Transaksi Firebase gagal karena konflik berulang pada path ${this.path}.`);
  }
}

class FirebaseRestDatabase {
  ref(path = "") {
    return new FirebaseRestRef(path.replace(/^\/+|\/+$/g, ""));
  }
}

const database = new FirebaseRestDatabase();

export function firebaseRealtimeDatabase() {
  return database;
}
