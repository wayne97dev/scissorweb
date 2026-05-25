'use client';

import { useEffect } from 'react';
import { useApp } from '@/lib/store';

export function Toast() {
  const { toast, setToast } = useApp();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  if (!toast) return null;

  const tone =
    toast.kind === 'error'
      ? 'border-lose/40 bg-lose/10 text-lose'
      : toast.kind === 'success'
        ? 'border-win/40 bg-win/10 text-win'
        : 'border-brand/40 bg-brand/10 text-brand-400';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={`pointer-events-auto max-w-md animate-fade-up rounded-xl border px-4 py-2.5 text-sm font-medium shadow-panel backdrop-blur ${tone}`}
        onClick={() => setToast(null)}
        role="alert"
      >
        {toast.message}
      </div>
    </div>
  );
}
