import { identiconStyle, initials } from '@/lib/identicon';

export function Identicon({
  seed,
  size = 36,
  className = '',
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const bot = seed === 'practice-bot';
  const style = { width: size, height: size, fontSize: size * 0.36 };

  if (bot) {
    return (
      <div
        className={`grid place-items-center rounded-full bg-iris-500/20 ring-1 ring-iris-400/40 ${className}`}
        style={style}
      >
        <span style={{ fontSize: size * 0.5 }}>🤖</span>
      </div>
    );
  }

  return (
    <div
      className={`grid place-items-center rounded-full font-bold text-black/75 ring-1 ring-white/20 ${className}`}
      style={{ ...identiconStyle(seed), ...style }}
    >
      {seed ? initials(seed) : '?'}
    </div>
  );
}
