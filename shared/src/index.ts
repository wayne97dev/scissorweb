import { sha256 } from 'js-sha256';

/** The three possible throws. */
export type Pick = 'rock' | 'paper' | 'scissors';
export const PICKS: Pick[] = ['rock', 'paper', 'scissors'];

/** Lifecycle of a single 1v1 game (best-of-one round). */
export type GameStatus =
  | 'open' // created, waiting for an opponent to join
  | 'committing' // both players in, waiting for both hashed picks
  | 'revealing' // both committed, waiting for both reveals
  | 'settled' // outcome decided, balances moved, record published
  | 'cancelled'; // cancelled before anyone joined (creator's bet returned)

/** Who won the round. "creator" / "joiner" map to the two seats. */
export type Outcome = 'creator' | 'joiner' | 'tie';
export type Seat = 'creator' | 'joiner';

/** 1 SOL = 1e9 lamports. We store all money as integer lamports. */
export const LAMPORTS_PER_SOL = 1_000_000_000;

/** Commit/reveal timers (ms). Kept here so client & server agree. */
export const COMMIT_WINDOW_MS = 30_000;
export const REVEAL_WINDOW_MS = 30_000;

/**
 * Canonical preimage that gets hashed for a player's commitment.
 *
 * It binds the secret pick to BOTH the game id and the player's secret
 * client key, so a commitment cannot be replayed in another game and the
 * pick cannot be changed after the hash is locked in. The format is shown
 * verbatim in the fairness panel so anyone can reproduce it.
 */
export function commitmentPreimage(gameId: string, pick: Pick, clientKey: string): string {
  return `rps-v1|game:${gameId}|pick:${pick}|key:${clientKey}`;
}

/** SHA256 hex of the canonical preimage — this is what gets locked in. */
export function computeCommitment(gameId: string, pick: Pick, clientKey: string): string {
  return sha256(commitmentPreimage(gameId, pick, clientKey));
}

/**
 * Verify a revealed (pick, key) against a previously published commitment.
 * This is the function a third party runs to audit a finished round.
 */
export function verifyReveal(
  commitment: string,
  gameId: string,
  pick: Pick,
  clientKey: string
): boolean {
  if (!isValidPick(pick)) return false;
  return computeCommitment(gameId, pick, clientKey) === commitment.toLowerCase();
}

export function isValidPick(x: unknown): x is Pick {
  return x === 'rock' || x === 'paper' || x === 'scissors';
}

/** What each throw beats. */
const BEATS: Record<Pick, Pick> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

/**
 * Pure RPS resolution. Returns which seat wins given each seat's pick.
 */
export function decideWinner(creatorPick: Pick, joinerPick: Pick): Outcome {
  if (creatorPick === joinerPick) return 'tie';
  return BEATS[creatorPick] === joinerPick ? 'creator' : 'joiner';
}

/**
 * Convert a byte array to lowercase hex. Randomness itself lives in
 * environment-specific helpers (server uses node:crypto, browser uses Web
 * Crypto) so this package stays pure and bundles cleanly everywhere.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

export const solToLamports = (sol: number): number => Math.round(sol * LAMPORTS_PER_SOL);
export const lamportsToSol = (lamports: number): number => lamports / LAMPORTS_PER_SOL;

/**
 * Canonical login message signed by the wallet (or guest key) to prove control
 * of a pubkey. Shared so client and server build/verify byte-identical strings.
 */
export function buildLoginMessage(pubkey: string, nonce: string, issued: number): string {
  return [
    'Duel RPS — sign in',
    'This signature proves you control this wallet. It is free and sends no transaction.',
    `pubkey: ${pubkey}`,
    `nonce: ${nonce}`,
    `issued: ${issued}`,
  ].join('\n');
}

/**
 * The public, auditable record published after a round settles. Anyone can
 * take this and recompute both commitments to confirm neither side changed
 * their pick mid-game.
 */
export interface FairnessRecord {
  gameId: string;
  creator: string; // pubkey / identity
  joiner: string;
  betLamports: number;
  commitments: { creator: string; joiner: string };
  reveals: {
    creator: { pick: Pick; key: string } | null;
    joiner: { pick: Pick; key: string } | null;
  };
  outcome: Outcome;
  winner: string | null; // pubkey of winner, null on tie
  settledAt: number;
  forfeitBy: Seat | null; // set if someone failed to commit/reveal in time
  noContest: boolean; // true when nobody played and both stakes were refunded
}

/** Re-verify a published record end-to-end. Used by the client verifier. */
export function auditRecord(rec: FairnessRecord): {
  creatorOk: boolean;
  joinerOk: boolean;
  outcomeOk: boolean;
} {
  const c = rec.reveals.creator;
  const j = rec.reveals.joiner;
  const creatorOk = c ? verifyReveal(rec.commitments.creator, rec.gameId, c.pick, c.key) : false;
  const joinerOk = j ? verifyReveal(rec.commitments.joiner, rec.gameId, j.pick, j.key) : false;
  let outcomeOk = true;
  if (rec.forfeitBy === null && c && j) {
    outcomeOk = decideWinner(c.pick, j.pick) === rec.outcome;
  }
  return { creatorOk, joinerOk, outcomeOk };
}

/** Public (no secrets) view of a game for the lobby & in-progress UI. */
export interface PublicGame {
  id: string;
  status: GameStatus;
  betLamports: number;
  creator: string;
  joiner: string | null;
  createdAt: number;
  /** Seat-level progress flags (no secrets leaked). */
  committed: { creator: boolean; joiner: boolean };
  revealed: { creator: boolean; joiner: boolean };
  deadline: number | null; // epoch ms for the current phase, if any
  isPractice: boolean;
}
