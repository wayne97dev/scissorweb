'use client';

import { useEffect, useRef } from 'react';
import { COMMIT_WINDOW_MS, REVEAL_WINDOW_MS, type Pick, type Seat } from '@rps/shared';
import { useApp } from '@/lib/store';
import { fmtSol, pickEmoji, shortKey } from '@/lib/format';
import { confettiBurst } from '@/lib/confetti';
import { Countdown } from './Countdown';
import { HandPicker } from './HandPicker';
import { HandArt } from './HandArt';
import { Identicon } from './Identicon';
import { FairnessPanel } from './FairnessPanel';

interface HandView {
  emoji: string;
  pick?: Pick;
  faceDown?: boolean;
  locked?: boolean;
  pulse?: boolean;
  slam?: 'left' | 'right';
  winner?: boolean;
  loser?: boolean;
  status: string;
}

export function GameTable() {
  const { activeGame: g, record, mySeat, mySecretPick, makePick, cancelGame, leaveGame } = useApp();
  const firedRef = useRef<string | null>(null);

  const themSeat: Seat = mySeat === 'creator' ? 'joiner' : 'creator';
  const meKey = mySeat ? (mySeat === 'creator' ? g?.creator : g?.joiner) : g?.creator;
  const themKey = mySeat ? (themSeat === 'creator' ? g?.creator : g?.joiner) : g?.joiner;
  const won = !!(g?.status === 'settled' && record && record.outcome !== 'tie' && record.outcome === mySeat);

  useEffect(() => {
    if (g?.status === 'settled' && record && record.gameId !== firedRef.current) {
      firedRef.current = record.gameId;
      if (won) confettiBurst();
    }
  }, [g?.status, record, won]);

  if (!g) return null;

  const iCommitted = mySeat ? g.committed[mySeat] : false;
  const showPicker = g.status === 'committing' && !iCommitted && !!mySeat;

  function viewFor(side: 'me' | 'them'): HandView {
    const effSeat: Seat = side === 'me' ? (mySeat ?? 'creator') : themSeat;
    const isMe = side === 'me';
    const committed = g!.committed[effSeat];
    const reveal = record ? record.reveals[effSeat] : null;
    const slam: 'left' | 'right' | undefined =
      g!.status === 'settled' ? (isMe ? 'left' : 'right') : undefined;

    if (g!.status === 'open') {
      return isMe
        ? { emoji: '✊', faceDown: true, status: 'Ready' }
        : { emoji: '🪑', faceDown: true, status: 'Waiting for opponent…' };
    }

    if (g!.status === 'committing' || g!.status === 'revealing') {
      if (isMe) {
        return mySecretPick
          ? { emoji: pickEmoji(mySecretPick), pick: mySecretPick, status: '🔒 Locked in' }
          : committed
            ? { emoji: '🔒', locked: true, status: '🔒 Locked in' }
            : { emoji: '✊', faceDown: true, status: 'Make your choice' };
      }
      return committed
        ? { emoji: '🔒', locked: true, status: '🔒 Locked in' }
        : { emoji: '🔒', locked: true, pulse: true, status: `${shortKey(themKey ?? '')} is choosing…` };
    }

    // settled
    const outcome = record?.outcome;
    const winnerSeat = outcome && outcome !== 'tie';
    const isWinner = winnerSeat && outcome === effSeat;
    const isLoser = winnerSeat && outcome !== effSeat;
    if (reveal) {
      return {
        emoji: pickEmoji(reveal.pick),
        pick: reveal.pick,
        slam,
        winner: isWinner,
        loser: isLoser,
        status: isMe ? `You played ${reveal.pick}` : `Played ${reveal.pick}`,
      };
    }
    if (record?.forfeitBy === effSeat) return { emoji: '⏱️', slam, loser: true, status: 'Timed out' };
    if (record?.noContest) return { emoji: '⏱️', slam, status: 'No move' };
    return { emoji: '🔒', slam, locked: true, winner: isWinner, status: isWinner ? 'Won by forfeit' : '—' };
  }

  const me = viewFor('me');
  const them = viewFor('them');

  let banner: { text: string; tone: string; sub: string } | null = null;
  if (g.status === 'settled' && record) {
    const lost = record.outcome !== 'tie' && record.outcome !== mySeat && !!mySeat;
    if (record.noContest) banner = { text: 'No contest', tone: 'text-tie', sub: 'Nobody played — stakes refunded.' };
    else if (record.outcome === 'tie') banner = { text: 'Draw', tone: 'text-tie', sub: 'Same move — stakes refunded.' };
    else if (won)
      banner = {
        text: 'You win',
        tone: 'text-win',
        sub: g.isPractice ? 'Practice round.' : `+◎ ${fmtSol(g.betLamports)} · pot ◎ ${fmtSol(g.betLamports * 2)}`,
      };
    else if (lost)
      banner = { text: 'You lose', tone: 'text-lose', sub: g.isPractice ? 'Practice round.' : `−◎ ${fmtSol(g.betLamports)}` };
    else
      banner = {
        text: record.outcome === 'creator' ? 'Creator wins' : 'Joiner wins',
        tone: 'text-slate-200',
        sub: 'Spectated round.',
      };
    if (record.forfeitBy)
      banner.sub = record.forfeitBy === mySeat ? 'You ran out of time (forfeit).' : 'Opponent forfeited.';
  }

  const phaseLabel =
    g.status === 'open'
      ? 'Waiting for opponent'
      : g.status === 'committing'
        ? 'Choose your move'
        : g.status === 'revealing'
          ? 'Revealing…'
          : 'Round complete';

  return (
    <div className="mx-auto max-w-4xl animate-fade-up space-y-4 py-2">
      <div className="panel overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <span className="chip">{g.isPractice ? '🤖 Practice' : '⚔️ Ranked duel'}</span>
          <div className="text-center">
            <div className="label">Stake</div>
            <div className="font-display text-sm font-bold text-slate-100">◎ {fmtSol(g.betLamports)}</div>
          </div>
          <span className={`chip ${g.status === 'settled' ? banner?.tone : 'text-brand-300'}`}>{phaseLabel}</span>
        </div>

        {/* stage */}
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-3 py-8 sm:gap-5 sm:px-8">
          <div className="pointer-events-none absolute inset-x-12 top-[42%] hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent sm:block" />

          {/* my side */}
          <div className="flex flex-col items-center gap-3">
            <Nameplate name={mySeat ? 'You' : 'Creator'} seed={meKey ?? ''} highlight={won} stake={g.betLamports} />
            {showPicker ? <HandPicker onLock={makePick} /> : <BigHand {...me} />}
            <StatusLine text={me.status} />
          </div>

          {/* center */}
          <div className="flex min-w-[110px] flex-col items-center gap-2 self-center">
            {(g.status === 'committing' || g.status === 'revealing') && g.deadline ? (
              <Countdown deadline={g.deadline} totalMs={g.status === 'committing' ? COMMIT_WINDOW_MS : REVEAL_WINDOW_MS} />
            ) : g.status === 'settled' ? (
              <div className={`animate-pop-in font-display text-5xl ${banner?.tone}`}>
                {record?.outcome === 'tie' ? '=' : won ? '✓' : mySeat ? '✕' : '•'}
              </div>
            ) : (
              <div className="grid h-24 w-24 animate-pulse-soft place-items-center rounded-full border border-white/10 text-3xl text-slate-600">
                ⏳
              </div>
            )}
            <span className="font-display text-xs font-bold tracking-[0.2em] text-white/20">VS</span>
          </div>

          {/* opponent side */}
          <div className="flex flex-col items-center gap-3">
            <Nameplate
              name="Opponent"
              seed={themKey ?? ''}
              waiting={g.status === 'open'}
              highlight={g.status === 'settled' && record?.outcome === themSeat}
              stake={g.betLamports}
            />
            <BigHand {...them} />
            <StatusLine text={them.status} />
          </div>
        </div>

        {/* footer / banner */}
        <div className="border-t border-white/[0.06] px-5 py-4">
          {g.status === 'open' && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-slate-400">
                Your ◎ {fmtSol(g.betLamports)} game is live in the lobby — anyone can join.
              </p>
              <button className="btn-danger" onClick={cancelGame}>
                Cancel game
              </button>
            </div>
          )}
          {banner && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`animate-rise-fade font-display text-3xl font-extrabold ${banner.tone}`}>{banner.text}</div>
              <div className="text-sm text-slate-400">{banner.sub}</div>
              <button className="btn-brand mt-1" onClick={leaveGame}>
                Back to lobby
              </button>
            </div>
          )}
        </div>
      </div>

      <FairnessPanel game={g} record={record} />
    </div>
  );
}

function Nameplate({
  name,
  seed,
  waiting,
  highlight,
  stake,
}: {
  name: string;
  seed: string;
  waiting?: boolean;
  highlight?: boolean;
  stake?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`rounded-full p-0.5 ${highlight ? 'bg-gradient-to-br from-win to-brand-500' : ''}`}>
        {waiting ? (
          <div className="grid h-11 w-11 animate-pulse-soft place-items-center rounded-full border border-dashed border-white/15 text-slate-600">
            ?
          </div>
        ) : (
          <Identicon seed={seed} size={44} />
        )}
      </div>
      <div className="text-center leading-tight">
        <div className="text-xs font-semibold text-slate-200">{name}</div>
        <div className="text-[10px] text-slate-500">{waiting ? 'open seat' : shortKey(seed)}</div>
      </div>
      {stake !== undefined && (
        <div className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-500/[0.07] px-2 py-0.5 text-[10px] font-semibold text-brand-300">
          <span className="text-[8px]">◆</span> ◎ {fmtSol(stake)}
        </div>
      )}
    </div>
  );
}

function StatusLine({ text }: { text: string }) {
  return <div className="h-4 text-center text-xs text-slate-400">{text}</div>;
}

function BigHand({ emoji, pick, faceDown, locked, pulse, slam, winner, loser }: HandView) {
  return (
    <div
      className={[
        'relative grid h-28 w-28 place-items-center overflow-hidden rounded-3xl border text-6xl transition sm:h-32 sm:w-32',
        winner ? 'border-win/60 bg-win/10 shadow-glow-win' : 'border-white/10 bg-white/[0.03]',
        slam === 'left' ? 'animate-slam-left' : slam === 'right' ? 'animate-slam-right' : '',
        pulse ? 'animate-pulse-soft' : '',
        faceDown ? 'opacity-70' : '',
        loser ? 'opacity-60 grayscale' : '',
      ].join(' ')}
    >
      {pick ? (
        <HandArt pick={pick} emojiSize="3.5rem" className="absolute inset-0 h-full w-full" />
      ) : (
        <span className={locked ? 'opacity-60' : ''}>{emoji}</span>
      )}
    </div>
  );
}
