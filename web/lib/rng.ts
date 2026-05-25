import { bytesToHex } from '@rps/shared';

/** Random hex string (browser Web Crypto). */
export function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export const randomClientKey = () => randomHex(32);
