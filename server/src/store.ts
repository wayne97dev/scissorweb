import fs from 'fs';
import path from 'path';
import type { GameStatus, Outcome, Pick, Seat } from '@rps/shared';
import { config } from './config';

export interface UserRow {
  pubkey: string;
  balance: number; // spendable lamports
  locked: number; // lamports committed to in-flight games
  createdAt: number;
}

export interface RevealData {
  pick: Pick;
  key: string;
}

export interface GameRow {
  id: string;
  status: GameStatus;
  betLamports: number;
  creator: string;
  joiner: string | null;
  createdAt: number;
  isPractice: boolean;

  commitCreator: string | null;
  commitJoiner: string | null;
  revealCreator: RevealData | null;
  revealJoiner: RevealData | null;

  outcome: Outcome | null;
  winner: string | null;
  forfeitBy: Seat | null;
  noContest: boolean;
  settledAt: number | null;
  deadline: number | null;
}

export interface DepositRow {
  signature: string;
  pubkey: string;
  lamports: number;
  at: number;
}

export interface WithdrawalRow {
  id: string;
  pubkey: string;
  lamports: number;
  signature: string | null;
  status: 'pending' | 'sent' | 'failed';
  at: number;
}

interface DBShape {
  users: Record<string, UserRow>;
  games: Record<string, GameRow>;
  deposits: Record<string, DepositRow>;
  withdrawals: Record<string, WithdrawalRow>;
}

const empty = (): DBShape => ({ users: {}, games: {}, deposits: {}, withdrawals: {} });

/**
 * Tiny persistence layer: keeps everything in memory and writes through to a
 * JSON file (debounced). Plenty for a devnet MVP; swap for Postgres for prod.
 */
class Store {
  db: DBShape = empty();
  private file: string;
  private writeTimer: NodeJS.Timeout | null = null;

  constructor(file: string) {
    this.file = file;
    this.load();
  }

  private readInto(file: string): boolean {
    if (!fs.existsSync(file)) return false;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<DBShape>;
    this.db = { ...empty(), ...parsed };
    return true;
  }

  private load() {
    try {
      this.readInto(this.file);
      this.recoverInFlightGames();
    } catch (err) {
      // Main file missing/corrupt — try the rolling backup before giving up.
      console.error('[store] main load failed, trying backup:', err);
      try {
        if (this.readInto(this.file + '.bak')) {
          this.recoverInFlightGames();
          console.warn('[store] recovered ledger from .bak');
        } else {
          this.db = empty();
        }
      } catch (err2) {
        console.error('[store] backup load failed, starting fresh:', err2);
        this.db = empty();
      }
    }
  }

  /**
   * Timers don't survive a restart, so any game that was still in flight is
   * abandoned: each seat that had its bet locked gets it returned to balance,
   * then the game is marked a no-contest cancellation.
   */
  private recoverInFlightGames() {
    for (const g of Object.values(this.db.games)) {
      const inFlight = g.status === 'open' || g.status === 'committing' || g.status === 'revealing';
      if (!inFlight) continue;
      if (!g.isPractice) {
        this.refundLocked(g.creator, g.betLamports);
        if (g.joiner) this.refundLocked(g.joiner, g.betLamports);
      }
      g.status = 'cancelled';
      g.noContest = true;
      g.deadline = null;
    }
  }

  private refundLocked(pubkey: string, lamports: number) {
    const u = this.db.users[pubkey];
    if (!u) return;
    const release = Math.min(u.locked, lamports);
    u.locked -= release;
    u.balance += release;
  }

  /** Atomic write: temp file + rename, keeping the previous version as .bak. */
  private writeNow() {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2));
      if (fs.existsSync(this.file)) {
        try {
          fs.copyFileSync(this.file, this.file + '.bak');
        } catch {
          /* best-effort backup */
        }
      }
      fs.renameSync(tmp, this.file); // atomic on the same filesystem
    } catch (err) {
      console.error('[store] write failed:', err);
    }
  }

  save() {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.writeNow();
    }, 150);
  }

  flush() {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.writeNow();
  }
}

export const store = new Store(config.dataFile);
