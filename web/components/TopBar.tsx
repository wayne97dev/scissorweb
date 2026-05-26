'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useApp } from '@/lib/store';
import { fmtSol, shortKey } from '@/lib/format';
import { CashierModal } from './CashierModal';
import { Logo } from './Logo';
import { Identicon } from './Identicon';
import { XIcon, X_URL } from './XIcon';
import { hasToken, dexscreenerUrl, TICKER } from '@/lib/token';

export function TopBar() {
  const { authed, pubkey, identity, balance, custody, connected, activeGame, leaveGame, logout } = useApp();
  const wallet = useWallet();
  const [cashier, setCashier] = useState(false);

  const rpc = custody?.rpc ?? '';
  const netLabel = custody?.demoMode
    ? 'Demo'
    : /devnet/i.test(rpc)
      ? 'Devnet'
      : /mainnet/i.test(rpc)
        ? 'Mainnet'
        : 'Live';

  async function onLogout() {
    try {
      if (wallet.connected) await wallet.disconnect();
    } catch {
      /* ignore */
    }
    logout();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-975/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => activeGame && leaveGame()}
          className="transition hover:opacity-80"
          aria-label="Home"
        >
          <Logo />
        </button>

        <div className="flex items-center gap-2">
          {hasToken() && (
            <a
              href={dexscreenerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              title={`${TICKER} on Dexscreener`}
              className="chip-brand hidden font-bold transition hover:bg-brand-500/20 sm:inline-flex"
            >
              {TICKER} 📈
            </a>
          )}
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Duel on X"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <XIcon size={15} />
          </a>
          {authed ? (
          <div className="flex items-center gap-2">
            <span
              className={`chip hidden md:inline-flex ${custody?.demoMode ? 'text-tie' : netLabel === 'Mainnet' ? 'text-win' : 'text-brand-300'}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {netLabel}
            </span>

            <button
              onClick={() => setCashier(true)}
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 transition hover:border-brand-500/40 hover:bg-brand-500/5"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500/15 text-xs text-brand-300">
                ◎
              </span>
              <span className="leading-tight text-left">
                <span className="block text-sm font-bold tabular text-slate-100">
                  {fmtSol(balance.balance)}
                </span>
                {balance.locked > 0 && (
                  <span className="block text-[10px] text-tie">◎ {fmtSol(balance.locked)} in play</span>
                )}
              </span>
              <span className="ml-1 text-[11px] font-semibold text-brand-300 opacity-70 group-hover:opacity-100">
                +
              </span>
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-1 pl-1.5 pr-2">
              <Identicon seed={pubkey ?? ''} size={26} />
              <div className="hidden leading-tight sm:block">
                <span className="block text-xs font-medium text-slate-200">{shortKey(pubkey ?? '')}</span>
                <span className="block text-[10px] text-slate-500">
                  {identity?.kind === 'wallet' ? 'Wallet' : 'Guest'}
                </span>
              </div>
              <button
                className="ml-1 grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-lose"
                title="Sign out"
                onClick={onLogout}
              >
                ↩
              </button>
            </div>
          </div>
        ) : (
          <span className={`chip ${connected ? 'text-brand-300' : 'text-tie'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {connected ? 'Server online' : 'Connecting…'}
          </span>
        )}
        </div>
      </div>
      <CashierModal open={cashier} onClose={() => setCashier(false)} />
    </header>
  );
}
