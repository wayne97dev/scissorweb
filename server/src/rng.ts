import { randomBytes } from 'crypto';
import { bytesToHex } from '@rps/shared';

/** Random hex string of `byteLength` bytes (server-side, node:crypto). */
export function randomHex(byteLength: number): string {
  return bytesToHex(Uint8Array.from(randomBytes(byteLength)));
}

/** Secret client key for a commitment. */
export const randomClientKey = () => randomHex(32);

/** Short id for a game. */
export const randomId = () => randomHex(8);

/** Login challenge nonce. */
export const randomNonce = () => randomHex(16);
