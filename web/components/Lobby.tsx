'use client';

import { useState } from 'react';
import { solToLamports, type PublicGame } from '@rps/shared';
import { useApp } from '@/lib/store';
import { fmtSol, shortKey } from '@/lib/format';
import { Identicon } from './Identicon';

const QUICK = [0.05, 0.1, 0.5, 1];

export function Lobby() {
  const { lobby, balance, pubkey, myGame, createGame, joinGame, returnToGame, setToast } = useApp();
  const [bet, setBet] = useState('0.1');

  const betNum = Number(bet);
  const betLamports = Number.isFinite(betNum) ? solToLamports(betNum) : 0;
  const betValid = betLamports >= solToLamports(0.01) && betLamports <= solToLamports(10);
  const totalPot = lobby.reduce((s, g) => s + g.betLamports * 2, 0);

  function onCreate(isPractice: boolean) {
    if (!betValid) return setToast({ kind: 'error', message: 'Bet must be between 0.01 and 10 SOL' });
    if (!isPractice && betLamports > balance.balance) {
      return setToast({ kind: 'error', message: 'Not enough balance — open the Cashier' });
    }
    createGame(betNum, isPractice);
  }

  function onJoin(g: PublicGame) {
    if (g.creator === pubkey) return setToast({ kind: 'error', message: "That's your own game" });
    if (g.betLamports > balance.balance) {
      return setToast({ kind: 'error', message: 'Not enough balance to join — open the Cashier' });
    }
    joinGame(g);
  }

  return (
    <div className="animate-fade-up space-y-5 py-2">
      {/* return to your active game */}
      {myGame && (
        <button
          onClick={returnToGame}
          className="card-hover flex w-full items-center justify-between gap-3 rounded-2xl border border-brand-500/40 bg-brand-500/[0.08] p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-400" />
            </span>
            <div>
              <div className="text-sm font-semibold text-brand-300">You&rsquo;re in a game</div>
              <div className="text-xs text-slate-400">
                stake ◎ {fmtSol(myGame.betLamports)} ·{' '}
                {myGame.status === 'open' ? 'waiting for opponent' : 'round in progress'}
              </div>
            </div>
          </div>
          <span className="btn-brand pointer-events-none">Return to game →</span>
        </button>
      )}

      {/* header + stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-50">Lobby</h1>
          <p className="mt-1 text-sm text-slate-500">Create a duel or join an open one. Winner takes 2×.</p>
        </div>
        <div className="flex gap-2">
          <Stat label="Open games" value={String(lobby.length)} />
          <Stat label="Pots staked" value={`◎ ${fmtSol(totalPot)}`} />
          <Stat label="Your balance" value={`◎ ${fmtSol(balance.balance)}`} accent />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* create */}
        <div className="panel h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-100">Create a game</h2>
          <p className="mt-1 text-xs text-slate-500">Set your stake — your opponent matches it.</p>

          <label className="label mt-4 block">Your stake</label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">◎</span>
            <input
              className="input pl-8 text-base font-semibold"
              type="number"
              min="0.01"
              step="0.01"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                className={`chip transition ${
                  bet === String(q) ? 'border-brand-500/40 text-brand-300' : 'hover:bg-white/[0.08]'
                }`}
                onClick={() => setBet(String(q))}
              >
                ◎ {q}
              </button>
            ))}
          </div>

          {/* pot preview */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-500/[0.06] px-4 py-3">
            <div>
              <div className="label text-brand-300/70">Pot if you win</div>
              <div className="font-display text-xl font-bold text-brand-300">
                ◎ {betValid ? fmtSol(betLamports * 2) : '—'}
              </div>
            </div>
            <span className="chip-brand">2× · 0% rake</span>
          </div>

          <button className="btn-brand mt-4 w-full text-[15px]" onClick={() => onCreate(false)}>
            Create Game
          </button>

          <div className="my-4 flex items-center gap-3 text-[11px] text-slate-600">
            <span className="hairline" /> or
            <span className="hairline" />
          </div>
          <button className="btn-ghost w-full" onClick={() => onCreate(true)}>
            🤖 Practice vs Bot · no stakes
          </button>
        </div>

        {/* open games */}
        <div className="panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Open games</h2>
            <span className="chip">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-400" />
              {lobby.length} live
            </span>
          </div>

          {lobby.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-white/10 py-16 text-center">
              <div className="flex gap-2 text-4xl">
                <span className="animate-float">✊</span>
                <span className="animate-float-slow">✋</span>
                <span className="animate-float [animation-delay:-2s]">✌️</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">No open games yet</p>
              <p className="text-xs text-slate-600">Create one, or warm up against the bot.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {lobby.map((g, i) => {
                const mine = g.creator === pubkey;
                const tooPoor = g.betLamports > balance.balance;
                return (
                  <li
                    key={g.id}
                    className="card-hover flex animate-rise-fade items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Identicon seed={g.creator} size={40} />
                      <div className="leading-tight">
                        <div className="text-sm font-medium text-slate-200">{shortKey(g.creator)}</div>
                        <div className="text-[11px] text-slate-500">
                          stake ◎ {fmtSol(g.betLamports)} · pot{' '}
                          <span className="text-brand-300">◎ {fmtSol(g.betLamports * 2)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      className={mine ? 'btn-ghost' : 'btn-brand'}
                      disabled={mine || tooPoor}
                      title={mine ? 'Your game' : tooPoor ? 'Insufficient balance' : 'Join'}
                      onClick={() => onJoin(g)}
                    >
                      {mine ? 'Yours' : tooPoor ? 'Low balance' : 'Join'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-slate-600">
            Live games from everyone connected. Your stake is escrowed until the round settles.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="panel-soft min-w-[104px] px-4 py-2.5">
      <div className="label">{label}</div>
      <div className={`mt-0.5 font-display text-base font-bold ${accent ? 'text-brand-300' : 'text-slate-100'}`}>
        {value}
      </div>
    </div>
  );
}
