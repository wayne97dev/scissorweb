'use client';

import { useState } from 'react';
import { TOKEN_MINT, TICKER, hasToken, dexscreenerUrl, pumpfunUrl } from '@/lib/token';

/** CA + Dexscreener / pump.fun links. Renders nothing until TOKEN_MINT is set. */
export function TokenBar() {
  const [copied, setCopied] = useState(false);
  if (!hasToken()) return null;

  const short = `${TOKEN_MINT.slice(0, 4)}…${TOKEN_MINT.slice(-4)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(TOKEN_MINT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="panel flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="chip-brand font-bold">{TICKER}</span>
        <button
          onClick={copy}
          title="Copy contract address"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 transition hover:text-slate-200"
        >
          <span className="text-slate-600">CA</span>
          {short}
          <span className="opacity-60">{copied ? '✓' : '⧉'}</span>
        </button>
      </div>
      <div className="flex gap-2">
        <a href={dexscreenerUrl()} target="_blank" rel="noopener noreferrer" className="btn-ghost">
          📈 Dexscreener
        </a>
        <a href={pumpfunUrl()} target="_blank" rel="noopener noreferrer" className="btn-brand">
          Buy {TICKER}
        </a>
      </div>
    </div>
  );
}
