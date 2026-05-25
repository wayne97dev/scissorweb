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

  private load() {
    try {
      if (fs.existsSync(this.file)) {
        const raw = fs.readFileSync(this.file, 'utf8');
        const parsed = JSON.parse(raw) as Partial<DBShape>;
        this.db = { ...empty(), ...parsed };
        this.recoverInFlightGames();
      }
    } catch (err) {
      console.error('[store] failed to load, starting fresh:', err);
      this.db = empty();
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

  save() {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      try {
        fs.mkdirSync(path.dirname(this.file), { recursive: true });
        fs.writeFileSync(this.file, JSON.stringify(this.db, null, 2));
      } catch (err) {
        console.error('[store] write failed:', err);
      }
    }, 150);
  }

  flush() {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.db, null, 2));
    } catch (err) {
      console.error('[store] flush failed:', err);
    }
  }
}

export const store = new Store(config.dataFile);
