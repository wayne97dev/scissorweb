import { PICKS, computeCommitment, type Pick } from '@rps/shared';
import { engine, BOT_ID } from './engine';
import { randomClientKey } from './rng';

interface BotMemory {
  pick: Pick;
  key: string;
  commitScheduled: boolean;
  revealScheduled: boolean;
}

const memory = new Map<string, BotMemory>();

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pickRandom = (): Pick => PICKS[Math.floor(Math.random() * PICKS.length)];

/** Called when a human starts a practice game; the bot joins after a beat. */
export function scheduleBotJoin(gameId: string) {
  setTimeout(() => {
    const g = engine.getGame(gameId);
    if (g && g.status === 'open' && g.isPractice) {
      try {
        engine.joinGame(gameId, BOT_ID);
      } catch {
        /* human cancelled meanwhile */
      }
    }
  }, rand(600, 1400));
}

function ensureMemory(gameId: string): BotMemory {
  let m = memory.get(gameId);
  if (!m) {
    m = { pick: pickRandom(), key: randomClientKey(), commitScheduled: false, revealScheduled: false };
    memory.set(gameId, m);
  }
  return m;
}

engine.on('game:update', (gameId: string) => {
  const g = engine.getGame(gameId);
  if (!g || !g.isPractice || g.joiner !== BOT_ID) return;

  if (g.status === 'committing' && !g.commitJoiner) {
    const m = ensureMemory(gameId);
    if (m.commitScheduled) return;
    m.commitScheduled = true;
    setTimeout(() => {
      const cur = engine.getGame(gameId);
      if (cur?.status === 'committing' && !cur.commitJoiner) {
        try {
          engine.commit(gameId, BOT_ID, computeCommitment(gameId, m.pick, m.key));
        } catch {
          /* ignore */
        }
      }
    }, rand(1200, 3500));
  } else if (g.status === 'revealing' && !g.revealJoiner) {
    const m = ensureMemory(gameId);
    if (m.revealScheduled) return;
    m.revealScheduled = true;
    setTimeout(() => {
      const cur = engine.getGame(gameId);
      if (cur?.status === 'revealing' && !cur.revealJoiner) {
        try {
          engine.reveal(gameId, BOT_ID, m.pick, m.key);
        } catch {
          /* ignore */
        }
      }
    }, rand(500, 1200));
  } else if (g.status === 'settled' || g.status === 'cancelled') {
    memory.delete(gameId);
  }
});
