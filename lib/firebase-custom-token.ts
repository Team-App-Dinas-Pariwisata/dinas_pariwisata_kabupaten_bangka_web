import { createSign } from "node:crypto";
import type { AppRole } from "./session";

const FIREBASE_CUSTOM_TOKEN_AUDIENCE =
  "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

export function createFirebaseCustomToken(input: {
  userId: number;
  role: AppRole;
}) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!clientEmail || !privateKey) {
    throw new Error("FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY wajib diisi untuk login Flutter Firebase-direct.");
  }

  const now = Math.floor(Date.now() / 1000);
  const uid = `db-user-${input.userId}`;
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: FIREBASE_CUSTOM_TOKEN_AUDIENCE,
    iat: now,
    exp: now + 3600,
    uid,
    claims: {
      role: input.role,
      db_id: String(input.userId),
    },
  }));

  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${base64Url(signer.sign(privateKey))}`;
}
