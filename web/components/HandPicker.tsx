'use client';

import { useState } from 'react';
import { PICKS, type Pick } from '@rps/shared';
import { pickLabel } from '@/lib/format';
import { HandArt } from './HandArt';

/** Two-step picker: tap a card to select, then "Lock in" to commit. */
export function HandPicker({ onLock }: { onLock: (p: Pick) => void }) {
  const [selected, setSelected] = useState<Pick | null>(null);

  return (
    <div className="grid w-full max-w-[360px] grid-cols-3 gap-2.5 sm:gap-3">
      {PICKS.map((p) => {
        const sel = selected === p;
        return (
          <div key={p} className="flex flex-col items-center gap-1.5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(p)}
              className={[
                'group relative aspect-square w-full cursor-pointer select-none overflow-hidden rounded-2xl border outline-none transition duration-200',
                sel
                  ? 'border-brand-500/70 ring-2 ring-brand-500/40 shadow-glow'
                  : 'border-white/10 hover:-translate-y-1 hover:border-white/30 hover:shadow-lift',
              ].join(' ')}
            >
              <HandArt
                pick={p}
                emojiSize="3rem"
                className={`absolute inset-0 h-full w-full transition duration-300 ${
                  sel ? 'scale-105' : 'group-hover:scale-105'
                }`}
              />
              {/* bottom scrim so the button/label stay legible over the art */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              {sel && (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[11px] font-bold text-ink-975">
                  ✓
                </span>
              )}
              {sel ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLock(p);
                  }}
                  className="absolute inset-x-2 bottom-2 animate-fade-up rounded-lg bg-brand-500 px-2 py-1.5 text-xs font-bold text-ink-975 shadow transition hover:bg-brand-400"
                >
                  Lock in
                </button>
              ) : (
                <span className="absolute inset-x-0 bottom-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white/80">
                  {pickLabel(p)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
