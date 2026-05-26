'use client';

import Link from 'next/link';
import { useApp } from '@/lib/store';
import { loadOrCreateGuest } from '@/lib/identity';
import { WalletButton } from './WalletButton';

const FEATURES = [
  { icon: '🎯', label: '0% house edge' },
  { icon: '🛡️', label: 'Provably fair' },
  { icon: '⚡', label: 'Instant SOL settle' },
  { icon: '🤖', label: 'Practice vs bot' },
];

const STEPS = [
  { n: '01', icon: '🔒', title: 'Commit', text: 'Both picks are hashed with a secret key and locked in — nobody can peek.' },
  { n: '02', icon: '🎴', title: 'Reveal', text: 'Keys are exchanged, the winner is decided, the whole pot is paid out.' },
  { n: '03', icon: '🛡️', title: 'Verify', text: 'Keys + picks are published so anyone can recompute the hashes.' },
];

export function AuthGate() {
  const { loginWith, connected } = useApp();

  return (
    <div className="animate-fade-up">
      {/* hero */}
      <section className="grid items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div>
          <span className="chip-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            True 1v1 · no house in between
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-slate-50 sm:text-5xl xl:text-6xl text-balance">
            Rock Paper Scissors,
            <br />
            <span className="gradient-text-anim">winner takes the pot.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-slate-400 text-balance">
            Stake SOL, get matched 1v1, and play a provably-fair round. The house takes nothing —
            <span className="text-slate-200"> 100% RTP</span>. Picks are hashed and locked before reveal,
            then published so anyone can verify.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <span key={f.label} className="chip">
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <WalletButton />
            <button className="btn-ghost" onClick={() => loginWith(loadOrCreateGuest())}>
              👤 Play as Guest
            </button>
            <span className={`text-xs ${connected ? 'text-brand-400' : 'text-tie'}`}>
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
              {connected ? 'Server online' : 'Connecting…'}
            </span>
          </div>

          <Link
            href="/whitepaper"
            className="mt-5 inline-block text-sm text-slate-500 underline-offset-2 transition hover:text-brand-300 hover:underline"
          >
            New to Duel? Read the whitepaper →
          </Link>
        </div>

        {/* floating hands stage */}
        <div className="relative mx-auto hidden h-[360px] w-full max-w-md lg:block">
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
          <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
          <div className="absolute left-[14%] top-[18%] animate-float text-7xl drop-shadow-[0_10px_30px_rgba(45,212,191,0.35)]">
            ✊
          </div>
          <div className="absolute right-[12%] top-[30%] animate-float-slow text-7xl drop-shadow-[0_10px_30px_rgba(139,92,246,0.35)]">
            ✋
          </div>
          <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 animate-float text-7xl drop-shadow-[0_10px_30px_rgba(245,196,81,0.30)] [animation-delay:-3s]">
            ✌️
          </div>
          <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center">
            <span className="font-display text-2xl font-bold text-white/15">VS</span>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="panel card-hover p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className="font-mono text-xs text-slate-600">{s.n}</span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-100">{s.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
