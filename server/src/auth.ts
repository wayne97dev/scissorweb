import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { buildLoginMessage } from '@rps/shared';
import { config } from './config';
import { randomNonce } from './rng';

export interface LoginPayload {
  pubkey: string;
  message: string;
  signature: string; // base64 of the 64-byte ed25519 signature
}

export interface VerifyResult {
  ok: boolean;
  error?: string;
}

function parseMessage(message: string): { pubkey?: string; nonce?: string; issued?: number } {
  const pubkey = /^pubkey: (.+)$/m.exec(message)?.[1];
  const nonce = /^nonce: (.+)$/m.exec(message)?.[1];
  const issuedStr = /^issued: (\d+)$/m.exec(message)?.[1];
  return { pubkey, nonce, issued: issuedStr ? Number(issuedStr) : undefined };
}

export function verifyLogin(payload: LoginPayload, expectedNonce: string): VerifyResult {
  const { pubkey, message, signature } = payload;
  if (!pubkey || !message || !signature) return { ok: false, error: 'MISSING_FIELDS' };

  const fields = parseMessage(message);
  if (fields.pubkey !== pubkey) return { ok: false, error: 'PUBKEY_MISMATCH' };
  if (!fields.nonce || fields.nonce !== expectedNonce) return { ok: false, error: 'BAD_NONCE' };
  if (!fields.issued) return { ok: false, error: 'BAD_ISSUED' };

  const age = Date.now() - fields.issued;
  if (age < -60_000 || age > config.loginMaxAgeMs) return { ok: false, error: 'STALE_LOGIN' };

  // Rebuild the canonical message and require an exact match, so nothing extra
  // can be smuggled into the signed bytes.
  if (buildLoginMessage(pubkey, fields.nonce, fields.issued) !== message) {
    return { ok: false, error: 'MESSAGE_TAMPERED' };
  }

  let pubkeyBytes: Uint8Array;
  let sigBytes: Uint8Array;
  try {
    pubkeyBytes = bs58.decode(pubkey);
    sigBytes = Uint8Array.from(Buffer.from(signature, 'base64'));
  } catch {
    return { ok: false, error: 'DECODE_FAILED' };
  }
  if (pubkeyBytes.length !== 32 || sigBytes.length !== 64) {
    return { ok: false, error: 'BAD_KEY_OR_SIG_LENGTH' };
  }

  const msgBytes = new TextEncoder().encode(message);
  const ok = nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
  return ok ? { ok: true } : { ok: false, error: 'BAD_SIGNATURE' };
}

export function makeNonce(): string {
  return randomNonce();
}
