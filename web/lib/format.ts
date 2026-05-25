import { lamportsToSol } from '@rps/shared';

export function fmtSol(lamports: number, maxFrac = 4): string {
  const sol = lamportsToSol(lamports);
  return sol.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export function shortKey(pubkey: string, head = 4, tail = 4): string {
  if (pubkey === 'practice-bot') return 'Practice Bot';
  if (pubkey.length <= head + tail + 1) return pubkey;
  return `${pubkey.slice(0, head)}…${pubkey.slice(-tail)}`;
}

export function pickEmoji(pick: 'rock' | 'paper' | 'scissors'): string {
  return pick === 'rock' ? '✊' : pick === 'paper' ? '✋' : '✌️';
}

export function pickLabel(pick: 'rock' | 'paper' | 'scissors'): string {
  return pick[0].toUpperCase() + pick.slice(1);
}
