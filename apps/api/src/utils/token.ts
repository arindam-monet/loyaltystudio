import { randomBytes } from 'crypto';

/**
 * Generate a random token of specified length
 * @param length Length of the token in bytes (output will be twice this length as hex)
 * @returns Random token string
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}
