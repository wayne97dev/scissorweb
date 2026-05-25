import { EventEmitter } from 'events';
import {
  COMMIT_WINDOW_MS,
  REVEAL_WINDOW_MS,
  computeCommitment,
  decideWinner,
  isValidPick,
  type FairnessRecord,
  type Outcome,
  type Pick,
  type PublicGame,
  type Seat,
} from '@rps/shared';
import { store, type GameRow } from './store';
import { consumeLocked, credit, ensureUser, lockBet, unlockBet } from './ledger';
import { randomId } from './rng';

export const BOT_ID = 'practice-bot';

export class GameError extends Error {}

class GameEngine extends EventEmitter {
  private timers = new Map<string, NodeJS.Timeout>();

  // ---- views ----------------------------------------------------------------

  toPublic(g: GameRow): PublicGame {
    return {
      id: g.id,
      status: g.status,
      betLamports: g.betLamports,
      creator: g.creator,
      joiner: g.joiner,
      createdAt: g.createdAt,
      committed: { creator: !!g.commitCreator, joiner: !!g.commitJoiner },
      revealed: { creator: !!g.revealCreator, joiner: !!g.revealJoiner },
      deadline: g.deadline,
      isPractice: g.isPractice,
    };
  }

  toRecord(g: GameRow): FairnessRecord {
    return {
      gameId: g.id,
      creator: g.creator,
      joiner: g.joiner ?? '',
      betLamports: g.betLamports,
      commitments: { creator: g.commitCreator ?? '', joiner: g.commitJoiner ?? '' },
      reveals: { creator: g.revealCreator, joiner: g.revealJoiner },
      outcome: (g.outcome ?? 'tie') as Outcome,
      winner: g.winner,
      settledAt: g.settledAt ?? 0,
      forfeitBy: g.forfeitBy,
      noContest: g.noContest,
    };
  }

  getGame(id: string): GameRow | undefined {
    return store.db.games[id];
  }

  listOpenGames(): PublicGame[] {
    return Object.values(store.db.games)
      .filter((g) => g.status === 'open' && !g.isPractice)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((g) => this.toPublic(g));
  }

  seatOf(g: GameRow, pubkey: string): Seat | null {
    if (g.creator === pubkey) return 'creator';
    if (g.joiner === pubkey) return 'joiner';
    return null;
  }

  // ---- lifecycle ------------------------------------------------------------

  createGame(creator: string, betLamports: number, isPractice: boolean): GameRow {
    const g: GameRow = {
      id: randomId(),
      status: 'open',
      betLamports,
      creator,
      joiner: null,
      createdAt: Date.now(),
      isPractice,
      commitCreator: null,
      commitJoiner: null,
      revealCreator: null,
      revealJoiner: null,
      outcome: null,
      winner: null,
      forfeitBy: null,
      noContest: false,
      settledAt: null,
      deadline: null,
    };
    if (!isPractice) lockBet(creator, betLamports);
    store.db.games[g.id] = g;
    store.save();
    this.emit('game:update', g.id);
    if (!isPractice) this.emit('lobby:update');
    return g;
  }

  cancelGame(id: string, by: string) {
    const g = this.mustGame(id);
    if (g.status !== 'open') throw new GameError('GAME_NOT_OPEN');
    if (g.creator !== by) throw new GameError('NOT_CREATOR');
    if (!g.isPractice) unlockBet(g.creator, g.betLamports);
    g.status = 'cancelled';
    g.deadline = null;
    store.save();
    this.emit('game:update', g.id);
    this.emit('lobby:update');
  }

  joinGame(id: string, joiner: string) {
    const g = this.mustGame(id);
    if (g.status !== 'open') throw new GameError('GAME_NOT_OPEN');
    if (g.creator === joiner) throw new GameError('CANNOT_JOIN_OWN_GAME');
    if (!g.isPractice) {
      ensureUser(joiner);
      lockBet(joiner, g.betLamports);
    }
    g.joiner = joiner;
    g.status = 'committing';
    g.deadline = Date.now() + COMMIT_WINDOW_MS;
    store.save();
    this.setTimer(g, COMMIT_WINDOW_MS, () => this.onCommitTimeout(g.id));
    this.emit('game:update', g.id);
    this.emit('lobby:update');
  }

  commit(id: string, by: string, commitment: string) {
    const g = this.mustGame(id);
    if (g.status !== 'committing') throw new GameError('NOT_COMMIT_PHASE');
    const seat = this.seatOf(g, by);
    if (!seat) throw new GameError('NOT_A_PLAYER');
    if (!/^[0-9a-f]{64}$/i.test(commitment)) throw new GameError('BAD_COMMITMENT');
    if (seat === 'creator') {
      if (g.commitCreator) throw new GameError('ALREADY_COMMITTED');
      g.commitCreator = commitment.toLowerCase();
    } else {
      if (g.commitJoiner) throw new GameError('ALREADY_COMMITTED');
      g.commitJoiner = commitment.toLowerCase();
    }
    if (g.commitCreator && g.commitJoiner) {
      g.status = 'revealing';
      g.deadline = Date.now() + REVEAL_WINDOW_MS;
      this.setTimer(g, REVEAL_WINDOW_MS, () => this.onRevealTimeout(g.id));
    }
    store.save();
    this.emit('game:update', g.id);
  }

  reveal(id: string, by: string, pick: Pick, key: string) {
    const g = this.mustGame(id);
    if (g.status !== 'revealing') throw new GameError('NOT_REVEAL_PHASE');
    const seat = this.seatOf(g, by);
    if (!seat) throw new GameError('NOT_A_PLAYER');
    if (!isValidPick(pick)) throw new GameError('BAD_PICK');
    const commitment = seat === 'creator' ? g.commitCreator : g.commitJoiner;
    if (!commitment) throw new GameError('NOTHING_COMMITTED');
    // The crux of provable fairness: the reveal must match the locked-in hash.
    if (computeCommitment(g.id, pick, key) !== commitment) {
      throw new GameError('REVEAL_DOES_NOT_MATCH_COMMITMENT');
    }
    if (seat === 'creator') g.revealCreator = { pick, key };
    else g.revealJoiner = { pick, key };

    if (g.revealCreator && g.revealJoiner) {
      const outcome = decideWinner(g.revealCreator.pick, g.revealJoiner.pick);
      if (outcome === 'tie') this.settleTie(g);
      else this.settleWinner(g, outcome, null);
    } else {
      store.save();
      this.emit('game:update', g.id);
    }
  }

  // ---- timeouts -------------------------------------------------------------

  private onCommitTimeout(id: string) {
    const g = this.getGame(id);
    if (!g || g.status !== 'committing') return;
    const c = !!g.commitCreator;
    const j = !!g.commitJoiner;
    if (c && !j) this.settleWinner(g, 'creator', 'joiner');
    else if (j && !c) this.settleWinner(g, 'joiner', 'creator');
    else this.settleNoContest(g);
  }

  private onRevealTimeout(id: string) {
    const g = this.getGame(id);
    if (!g || g.status !== 'revealing') return;
    const c = !!g.revealCreator;
    const j = !!g.revealJoiner;
    if (c && !j) this.settleWinner(g, 'creator', 'joiner');
    else if (j && !c) this.settleWinner(g, 'joiner', 'creator');
    else this.settleNoContest(g);
  }

  // ---- settlement (0% house edge) -------------------------------------------

  private settleWinner(g: GameRow, winnerSeat: Seat, forfeitBy: Seat | null) {
    const winner = winnerSeat === 'creator' ? g.creator : g.joiner!;
    if (!g.isPractice) {
      consumeLocked(g.creator, g.betLamports);
      consumeLocked(g.joiner!, g.betLamports);
      credit(winner, g.betLamports * 2); // winner takes the whole pot, no rake
    }
    g.outcome = winnerSeat;
    g.winner = winner;
    g.forfeitBy = forfeitBy;
    g.noContest = false;
    this.finalize(g);
  }

  private settleTie(g: GameRow) {
    if (!g.isPractice) {
      unlockBet(g.creator, g.betLamports);
      unlockBet(g.joiner!, g.betLamports);
    }
    g.outcome = 'tie';
    g.winner = null;
    g.forfeitBy = null;
    g.noContest = false;
    this.finalize(g);
  }

  private settleNoContest(g: GameRow) {
    if (!g.isPractice) {
      unlockBet(g.creator, g.betLamports);
      if (g.joiner) unlockBet(g.joiner, g.betLamports);
    }
    g.outcome = 'tie';
    g.winner = null;
    g.forfeitBy = null;
    g.noContest = true;
    this.finalize(g);
  }

  private finalize(g: GameRow) {
    g.status = 'settled';
    g.settledAt = Date.now();
    g.deadline = null;
    this.clearTimer(g.id);
    store.save();
    this.emit('game:update', g.id);
    this.emit('settled', g.id);
  }

  // ---- timers ---------------------------------------------------------------

  private setTimer(g: GameRow, ms: number, cb: () => void) {
    this.clearTimer(g.id);
    this.timers.set(g.id, setTimeout(cb, ms));
  }

  private clearTimer(id: string) {
    const t = this.timers.get(id);
    if (t) {
      clearTimeout(t);
      this.timers.delete(id);
    }
  }

  private mustGame(id: string): GameRow {
    const g = store.db.games[id];
    if (!g) throw new GameError('GAME_NOT_FOUND');
    return g;
  }
}

export const engine = new GameEngine();
