'use client';

import Link from 'next/link';
import { useApp } from '@/lib/store';
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
        <Link href="/whitepaper" className="mt-2 inline-block text-slate-500 underline-offset-2 transition hover:text-brand-300 hover:underline">
          Read the whitepaper →
        </Link>
      </footer>
    </>
  );
}
