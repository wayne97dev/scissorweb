import nacl from 'tweetnacl';
import bs58 from 'bs58';

const STORAGE_KEY = 'rps.guest.v1';

export type IdentityKind = 'guest' | 'wallet';

export interface Identity {
  pubkey: string;
  kind: IdentityKind;
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
}

interface StoredGuest {
  pubkey: string;
  secret: string; // base64 of the 64-byte secret key
}

export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Load the persisted guest identity, creating one on first use. */
export function loadOrCreateGuest(): Identity {
  let stored: StoredGuest | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as StoredGuest;
  } catch {
    /* ignore */
  }

  let kp: nacl.SignKeyPair;
  if (stored?.secret) {
    kp = nacl.sign.keyPair.fromSecretKey(fromBase64(stored.secret));
  } else {
    kp = nacl.sign.keyPair();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ pubkey: bs58.encode(kp.publicKey), secret: toBase64(kp.secretKey) })
      );
    } catch {
      /* ignore */
    }
  }

  return {
    pubkey: bs58.encode(kp.publicKey),
    kind: 'guest',
    signMessage: async (msg) => nacl.sign.detached(msg, kp.secretKey),
  };
}

export function makeWalletIdentity(
  pubkey: string,
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>
): Identity {
  return { pubkey, kind: 'wallet', signMessage };
}
