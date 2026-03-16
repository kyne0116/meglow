import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;
const HEX_PATTERN = /^[0-9a-f]+$/i;
const SALT_HEX_LENGTH = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  const parts = encodedHash.split('$');
  if (parts.length !== 3) {
    return false;
  }

  const [algorithm, salt, hash] = parts;

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false;
  }
  if (salt.length !== SALT_HEX_LENGTH || !HEX_PATTERN.test(salt)) {
    return false;
  }
  if (hash.length % 2 !== 0 || !HEX_PATTERN.test(hash)) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);

  return timingSafeEqual(actual, expected);
}
