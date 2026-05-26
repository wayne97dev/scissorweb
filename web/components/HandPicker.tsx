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
                'group relative aspect-[4/5] w-full cursor-pointer select-none overflow-hidden rounded-2xl border outline-none transition duration-200',
                sel
                  ? 'border-brand-500/70 bg-brand-500/10 shadow-glow'
                  : 'border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] hover:-translate-y-1 hover:border-white/25 hover:shadow-lift',
              ].join(' ')}
            >
              {/* top sheen */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
              <HandArt
                pick={p}
                emojiSize="3.25rem"
                className={`h-full w-full p-3 pb-7 transition group-hover:scale-105 ${sel ? 'scale-105' : ''}`}
              />
              {sel && (
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
              )}
            </div>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                sel ? 'text-brand-300' : 'text-slate-500'
              }`}
            >
              {pickLabel(p)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
