'use client';

import type { Pick } from '@rps/shared';
import { pickEmoji, pickLabel } from '@/lib/format';

export function HandButton({
  pick,
  selected,
  disabled,
  dimmed,
  onClick,
}: {
  pick: Pick;
  selected?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'group relative flex aspect-square w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border transition duration-200',
        selected
          ? 'border-brand-500/70 bg-brand-500/10 shadow-glow'
          : 'border-white/10 bg-white/[0.03] hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07] hover:shadow-lift',
        disabled && !selected ? 'cursor-not-allowed' : 'cursor-pointer',
        dimmed ? 'opacity-30' : '',
      ].join(' ')}
    >
      {/* hover sheen */}
      <span className="pointer-events-none absolute inset-x-0 -top-1/2 h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
      <span className="text-4xl leading-none drop-shadow transition duration-200 group-hover:scale-110 group-active:scale-95 sm:text-5xl">
        {pickEmoji(pick)}
      </span>
      <span
        className={`text-[11px] font-semibold uppercase tracking-wide ${
          selected ? 'text-brand-300' : 'text-slate-400 group-hover:text-slate-200'
        }`}
      >
        {pickLabel(pick)}
      </span>
    </button>
  );
}
