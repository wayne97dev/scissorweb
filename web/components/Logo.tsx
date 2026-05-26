export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Duel logo"
      width={size}
      height={size}
      draggable={false}
      className={`rounded-[24%] bg-white object-contain ring-1 ring-white/10 ${className}`}
    />
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
