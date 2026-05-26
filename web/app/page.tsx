'use client';

import Link from 'next/link';
import { useApp } from '@/lib/store';
import { XIcon, X_URL } from '@/components/XIcon';
import { Toast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { AuthGate } from '@/components/AuthGate';
import { Lobby } from '@/components/Lobby';
import { GameTable } from '@/components/GameTable';

export default function Page() {
  const { authed, activeGame } = useApp();

  return (
    <>
      <Toast />
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {!authed ? <AuthGate /> : activeGame ? <GameTable /> : <Lobby />}
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-center text-[11px] text-slate-600">
        <div>0% house edge · winner takes the whole pot · picks hashed &amp; verifiable · built on Solana</div>
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link href="/whitepaper" className="text-slate-500 underline-offset-2 transition hover:text-brand-300 hover:underline">
            Read the whitepaper →
          </Link>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-white"
          >
            <XIcon size={12} /> @rockscisspaper
          </a>
        </div>
      </footer>
    </>
  );
}
