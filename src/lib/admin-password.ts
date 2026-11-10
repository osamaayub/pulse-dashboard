import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const COST = 1 << 15;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const MAX_MEMORY = 64 * 1024 * 1024;
let dummyHashPromise: Promise<string> | undefined;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N: COST, r: 8, p: 1, maxmem: MAX_MEMORY }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt);
  return `scrypt$${COST}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyAdminPassword(password: string, encoded: string | null | undefined) {
  const encodedHash = encoded ?? await (dummyHashPromise ??= hashAdminPassword("nonexistent-admin-password"));
  const [algorithm, cost, saltValue, keyValue, extra] = encodedHash.split("$");
  if (algorithm !== "scrypt" || cost !== String(COST) || !saltValue || !keyValue || extra !== undefined) return false;
  const salt = Buffer.from(saltValue, "base64url");
  const expected = Buffer.from(keyValue, "base64url");
  if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected);
}
