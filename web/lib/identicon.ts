import type { CSSProperties } from 'react';

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic gradient style derived from a seed (e.g. pubkey). */
export function identiconStyle(seed: string): CSSProperties {
  const h = hashStr(seed);
  const hue1 = h % 360;
  const hue2 = (hue1 + 50 + ((h >> 9) % 130)) % 360;
  const angle = (h >> 3) % 360;
  return {
    backgroundImage: `linear-gradient(${angle}deg, hsl(${hue1} 78% 60%), hsl(${hue2} 70% 46%))`,
  };
}

export function initials(seed: string): string {
  return seed.slice(0, 2).toUpperCase();
}
