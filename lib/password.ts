import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PREFIX = "scrypt";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [prefix, salt, storedHash] = stored.split("$");
  if (prefix !== PREFIX || !salt || !storedHash) return false;

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
