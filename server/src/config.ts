import 'dotenv/config';
import { LAMPORTS_PER_SOL } from '@rps/shared';

const num = (v: string | undefined, fallback: number) => {
  const n = v === undefined ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (v: string | undefined, fallback: boolean) =>
  v === undefined ? fallback : v === 'true' || v === '1';

export const config = {
  port: num(process.env.PORT, 4000),
  /** Allowed browser origin(s) for CORS: a single origin, comma-separated list, or "*". */
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',

  /** When true, deposits/withdrawals are simulated (faucet) — no real chain. */
  demoMode: bool(process.env.DEMO_MODE, true),

  solanaRpc: process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com',
  /** base58-encoded 64-byte secret key of the custodial hot wallet (real mode). */
  platformSecret: process.env.PLATFORM_SECRET ?? '',

  faucetLamports: num(process.env.FAUCET_LAMPORTS, LAMPORTS_PER_SOL), // 1 SOL
  minBetLamports: num(process.env.MIN_BET_LAMPORTS, LAMPORTS_PER_SOL / 100), // 0.01 SOL
  maxBetLamports: num(process.env.MAX_BET_LAMPORTS, 10 * LAMPORTS_PER_SOL), // 10 SOL

  /** Max clock skew accepted on login signatures (ms). */
  loginMaxAgeMs: num(process.env.LOGIN_MAX_AGE_MS, 5 * 60 * 1000),

  dataFile: process.env.DATA_FILE ?? `${__dirname}/../data/db.json`,
};

export type Config = typeof config;
