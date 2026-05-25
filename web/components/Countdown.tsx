'use client';

import { useEffect, useState } from 'react';

/** Circular countdown ring showing seconds left until `deadline` (epoch ms). */
export function Countdown({
  deadline,
  totalMs,
  size = 104,
}: {
  deadline: number;
  totalMs: number;
  size?: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 80);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, deadline - now);
  const frac = Math.max(0, Math.min(1, remaining / totalMs));
  const secs = Math.ceil(remaining / 1000);

  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - frac);
  const urgent = remaining < 4000;

  return (
    <div
      className={`relative grid place-items-center ${urgent ? 'animate-pulse-soft' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="cd-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={urgent ? '#fb7185' : '#5eead4'} />
            <stop offset="1" stopColor={urgent ? '#f43f5e' : '#8b5cf6'} />
          </linearGradient>
          <filter id="cd-glow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#cd-grad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          filter="url(#cd-glow)"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-display text-2xl font-bold tabular ${urgent ? 'text-lose' : 'text-slate-50'}`}>
          {secs}
        </span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-slate-500">sec</span>
      </div>
    </div>
  );
}
