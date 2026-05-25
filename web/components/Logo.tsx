export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="duel-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="0.5" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#duel-lg)" />
      <rect x="2" y="2" width="44" height="44" rx="13" fill="black" fillOpacity="0.06" />
      <path
        d="M15 13 L24 24 L15 35"
        stroke="#04060a"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
      <path
        d="M33 13 L24 24 L33 35"
        stroke="#04060a"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <div className="leading-none">
        <div className="font-display text-base font-bold tracking-tight text-slate-50">Duel</div>
        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Rock·Paper·Scissors
        </div>
      </div>
    </div>
  );
}
