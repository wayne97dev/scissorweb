'use client';

import { useState } from 'react';
import { auditRecord, type FairnessRecord, type PublicGame } from '@rps/shared';
import { VerifyModal } from './VerifyModal';

function Mono({ value, className = '' }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-slate-600">—</span>;
  return (
    <button
      className={`group inline-flex max-w-full items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-slate-200 ${className}`}
      title="Click to copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* ignore */
        }
      }}
    >
      <span className="truncate">{value.length > 22 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value}</span>
      <span className="opacity-0 transition group-hover:opacity-60">{copied ? '✓' : '⧉'}</span>
    </button>
  );
}

export function FairnessPanel({ game, record }: { game: PublicGame; record: FairnessRecord | null }) {
  const [open, setOpen] = useState(false);
  const [verify, setVerify] = useState(false);
  const audit = record ? auditRecord(record) : null;
  const allOk = audit ? audit.creatorOk && audit.joinerOk && audit.outcomeOk : false;
  const hasBothReveals = !!(record && record.reveals.creator && record.reveals.joiner);
  const settled = game.status === 'settled';

  let badge: { cls: string; text: string } | null = null;
  if (record) {
    if (record.noContest) badge = { cls: 'text-tie', text: 'no contest' };
    else if (record.forfeitBy) badge = { cls: 'text-tie', text: 'forfeit · no reveal' };
    else if (hasBothReveals) badge = allOk ? { cls: 'text-win', text: 'verified ✓' } : { cls: 'text-lose', text: 'mismatch' };
    else badge = { cls: 'text-tie', text: 'no reveal' };
  }

  return (
    <div className="panel p-4">
      <button
        className="flex w-full items-center justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-brand-400">🛡️</span>
          <span className="font-display text-sm font-semibold text-slate-100">Provable fairness</span>
          {badge && <span className={`chip ${badge.cls}`}>{badge.text}</span>}
        </div>
        <span className="text-slate-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 text-sm">
          <p className="text-xs leading-relaxed text-slate-400">
            Each pick is hashed with a secret client key and locked in before anyone reveals. After the
            round, both keys and picks are published, so anyone can recompute the hashes and confirm
            neither side changed their pick mid-game.
          </p>

          <div className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
            <div className="label">Commitment formula</div>
            <code className="mt-1 block break-all font-mono text-[11px] text-brand-400">
              sha256(&quot;rps-v1|game:{game.id}|pick:&lt;pick&gt;|key:&lt;clientKey&gt;&quot;)
            </code>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SeatBlock
              title="Creator"
              committed={game.committed.creator}
              commitment={record?.commitments.creator ?? ''}
              reveal={record?.reveals.creator ?? null}
              ok={audit?.creatorOk}
              settled={settled}
            />
            <SeatBlock
              title="Joiner"
              committed={game.committed.joiner}
              commitment={record?.commitments.joiner ?? ''}
              reveal={record?.reveals.joiner ?? null}
              ok={audit?.joinerOk}
              settled={settled}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              {record
                ? 'Round published. Verify independently below.'
                : 'Keys and picks are revealed once the round settles.'}
            </p>
            <button className="btn-ghost" onClick={() => setVerify(true)}>
              Open verifier
            </button>
          </div>
        </div>
      )}

      <VerifyModal open={verify} onClose={() => setVerify(false)} initial={record} />
    </div>
  );
}

function SeatBlock({
  title,
  committed,
  commitment,
  reveal,
  ok,
  settled,
}: {
  title: string;
  committed: boolean;
  commitment: string;
  reveal: { pick: string; key: string } | null;
  ok?: boolean;
  settled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200">{title}</span>
        {reveal ? (
          ok ? (
            <span className="chip text-win">hash ✓</span>
          ) : (
            <span className="chip text-lose">hash ✕</span>
          )
        ) : settled ? (
          <span className="chip text-tie">no reveal</span>
        ) : (
          <span className={`chip ${committed ? 'text-brand-400' : 'text-slate-500'}`}>
            {committed ? 'locked' : 'waiting'}
          </span>
        )}
      </div>
      <Row k="commitment" v={<Mono value={commitment} />} />
      <Row k="pick" v={reveal ? <span className="text-slate-200">{reveal.pick}</span> : <span className="text-slate-600">hidden</span>} />
      <Row k="key" v={reveal ? <Mono value={reveal.key} /> : <span className="text-slate-600">hidden</span>} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-[11px] text-slate-500">{k}</span>
      {v}
    </div>
  );
}
