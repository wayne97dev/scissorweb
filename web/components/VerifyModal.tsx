'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  commitmentPreimage,
  computeCommitment,
  decideWinner,
  type FairnessRecord,
  type Pick,
} from '@rps/shared';
import { Modal } from './Modal';

export function VerifyModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: FairnessRecord | null;
}) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) setText(initial ? JSON.stringify(initial, null, 2) : '');
  }, [open, initial]);

  const parsed = useMemo<{ rec: FairnessRecord | null; error: string | null }>(() => {
    if (!text.trim()) return { rec: null, error: null };
    try {
      return { rec: JSON.parse(text) as FairnessRecord, error: null };
    } catch (e) {
      return { rec: null, error: (e as Error).message };
    }
  }, [text]);

  const rec = parsed.rec;

  return (
    <Modal open={open} onClose={onClose} title="Independent verifier" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Paste any published round below. This recomputes each commitment from the revealed pick + key —
          entirely in your browser — and checks it against the locked-in hash.
        </p>
        <textarea
          className="input h-40 resize-y font-mono text-[11px]"
          value={text}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a FairnessRecord JSON…"
        />
        {parsed.error && <p className="text-xs text-lose">Invalid JSON: {parsed.error}</p>}

        {rec && (
          <div className="space-y-3">
            <SeatVerify
              title="Creator"
              gameId={rec.gameId}
              commitment={rec.commitments?.creator}
              reveal={rec.reveals?.creator ?? null}
            />
            <SeatVerify
              title="Joiner"
              gameId={rec.gameId}
              commitment={rec.commitments?.joiner}
              reveal={rec.reveals?.joiner ?? null}
            />
            <OutcomeVerify rec={rec} />
          </div>
        )}
      </div>
    </Modal>
  );
}

function SeatVerify({
  title,
  gameId,
  commitment,
  reveal,
}: {
  title: string;
  gameId: string;
  commitment?: string;
  reveal: { pick: Pick; key: string } | null;
}) {
  if (!reveal) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
        <div className="font-semibold text-slate-200">{title}</div>
        <div className="text-slate-500">No reveal (forfeit or no-contest).</div>
      </div>
    );
  }
  const preimage = commitmentPreimage(gameId, reveal.pick, reveal.key);
  const recomputed = computeCommitment(gameId, reveal.pick, reveal.key);
  const ok = recomputed === (commitment ?? '').toLowerCase();
  return (
    <div className={`rounded-xl border p-3 text-xs ${ok ? 'border-win/30 bg-win/[0.04]' : 'border-lose/30 bg-lose/[0.04]'}`}>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-semibold text-slate-200">
          {title} — {reveal.pick}
        </span>
        <span className={ok ? 'text-win' : 'text-lose'}>{ok ? 'MATCH ✓' : 'MISMATCH ✕'}</span>
      </div>
      <Field label="preimage" value={preimage} />
      <Field label="sha256(preimage)" value={recomputed} />
      <Field label="committed hash" value={commitment ?? '—'} />
    </div>
  );
}

function OutcomeVerify({ rec }: { rec: FairnessRecord }) {
  const c = rec.reveals?.creator;
  const j = rec.reveals?.joiner;
  if (!c || !j) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
        Outcome: <span className="text-slate-200">{rec.outcome}</span>
        {rec.forfeitBy && <> · forfeit by {rec.forfeitBy}</>}
      </div>
    );
  }
  const recomputed = decideWinner(c.pick, j.pick);
  const ok = recomputed === rec.outcome;
  return (
    <div className={`rounded-xl border p-3 text-xs ${ok ? 'border-win/30 bg-win/[0.04]' : 'border-lose/30 bg-lose/[0.04]'}`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-300">
          {c.pick} vs {j.pick} → recomputed winner: <span className="font-semibold text-slate-100">{recomputed}</span>
        </span>
        <span className={ok ? 'text-win' : 'text-lose'}>{ok ? 'OUTCOME ✓' : 'OUTCOME ✕'}</span>
      </div>
      <div className="mt-1 text-slate-500">declared outcome: {rec.outcome}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-0.5">
      <span className="text-slate-500">{label}: </span>
      <span className="break-all font-mono text-[10.5px] text-slate-300">{value}</span>
    </div>
  );
}
