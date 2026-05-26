import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { config } from './config';
import { store } from './store';
import { credit, debit } from './ledger';

let connection: Connection | null = null;
let platform: Keypair | null = null;

function getConnection(): Connection {
  if (!connection) connection = new Connection(config.solanaRpc, 'confirmed');
  return connection;
}

function getPlatform(): Keypair {
  if (platform) return platform;
  if (!config.platformSecret) {
    throw new Error('PLATFORM_SECRET not set — required when DEMO_MODE=false');
  }
  platform = Keypair.fromSecretKey(bs58.decode(config.platformSecret));
  return platform;
}

export function custodyInfo() {
  return {
    demoMode: config.demoMode,
    rpc: config.solanaRpc,
    platformAddress: config.demoMode || !config.platformSecret ? null : getPlatform().publicKey.toBase58(),
    faucetLamports: config.faucetLamports,
  };
}

/** DEMO faucet: credit play-money so the game is instantly testable. */
export function faucet(pubkey: string): number {
  if (!config.demoMode) throw new Error('FAUCET_DISABLED');
  credit(pubkey, config.faucetLamports);
  return config.faucetLamports;
}

/**
 * Verify an on-chain deposit and credit the user's balance.
 * The transaction must be a confirmed transfer FROM `expectedFrom` whose net
 * effect increases the platform wallet's balance. Each signature is credited
 * at most once.
 */
export async function verifyAndCreditDeposit(
  signature: string,
  expectedFrom: string
): Promise<number> {
  if (config.demoMode) throw new Error('DEPOSITS_DISABLED_IN_DEMO');
  if (store.db.deposits[signature]) throw new Error('DEPOSIT_ALREADY_CREDITED');

  const conn = getConnection();
  const platformPk = getPlatform().publicKey;

  // The client confirms before calling us, but the tx can still take a moment
  // to be queryable — retry a few times before giving up.
  let tx = null as Awaited<ReturnType<typeof conn.getTransaction>>;
  for (let attempt = 0; attempt < 6; attempt++) {
    tx = await conn.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (tx) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (!tx || !tx.meta) throw new Error('TX_NOT_FOUND_OR_UNCONFIRMED');
  if (tx.meta.err) throw new Error('TX_FAILED');

  const keys = tx.transaction.message.getAccountKeys();
  const feePayer = keys.get(0)?.toBase58();
  if (feePayer !== expectedFrom) throw new Error('SENDER_MISMATCH');

  // Platform's balance delta == lamports received (sender pays the fee).
  let platformIdx = -1;
  for (let i = 0; i < keys.length; i++) {
    if (keys.get(i)?.equals(platformPk)) {
      platformIdx = i;
      break;
    }
  }
  if (platformIdx < 0) throw new Error('PLATFORM_NOT_IN_TX');

  const received = tx.meta.postBalances[platformIdx] - tx.meta.preBalances[platformIdx];
  if (received <= 0) throw new Error('NO_FUNDS_RECEIVED');

  store.db.deposits[signature] = {
    signature,
    pubkey: expectedFrom,
    lamports: received,
    at: Date.now(),
  };
  credit(expectedFrom, received);
  store.save();
  return received;
}

/**
 * Send a withdrawal of `lamports` to `toPubkey`. Debits the ledger first; on
 * send failure the balance is restored. Returns the transaction signature.
 */
export async function withdraw(toPubkey: string, lamports: number): Promise<string> {
  // Debit first so a balance can't be double-spent during the async send.
  debit(toPubkey, lamports);

  if (config.demoMode) {
    // No real chain in demo mode — record a synthetic signature.
    const sig = `demo-withdraw-${Date.now()}`;
    store.db.withdrawals[sig] = {
      id: sig,
      pubkey: toPubkey,
      lamports,
      signature: sig,
      status: 'sent',
      at: Date.now(),
    };
    store.save();
    return sig;
  }

  try {
    const conn = getConnection();
    const from = getPlatform();
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: new PublicKey(toPubkey),
        lamports,
      })
    );
    const sig = await sendAndConfirmTransaction(conn, tx, [from], { commitment: 'confirmed' });
    store.db.withdrawals[sig] = {
      id: sig,
      pubkey: toPubkey,
      lamports,
      signature: sig,
      status: 'sent',
      at: Date.now(),
    };
    store.save();
    return sig;
  } catch (err) {
    credit(toPubkey, lamports); // refund on failure
    throw err;
  }
}

export { LAMPORTS_PER_SOL };
