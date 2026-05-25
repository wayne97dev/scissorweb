'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { solToLamports } from '@rps/shared';
import { useApp } from '@/lib/store';
import { fmtSol } from '@/lib/format';
import { Modal } from './Modal';

export function CashierModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { balance, custody, faucet, withdraw, verifyDeposit, setToast } = useApp();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [amount, setAmount] = useState('0.5');
  const [busy, setBusy] = useState(false);

  const demo = custody?.demoMode ?? true;

  async function onDeposit() {
    const sol = Number(amount);
    if (!Number.isFinite(sol) || sol <= 0) return setToast({ kind: 'error', message: 'Enter a valid amount' });
    if (!custody?.platformAddress) return setToast({ kind: 'error', message: 'Deposits are disabled' });
    if (!wallet.publicKey || !wallet.sendTransaction) {
      return setToast({ kind: 'error', message: 'Connect a wallet to deposit' });
    }
    try {
      setBusy(true);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(custody.platformAddress),
          lamports: solToLamports(sol),
        })
      );
      const sig = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      verifyDeposit(sig);
      setToast({ kind: 'success', message: 'Deposit submitted — crediting…' });
    } catch (err) {
      setToast({ kind: 'error', message: `Deposit failed: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  function onWithdraw() {
    const sol = Number(amount);
    if (!Number.isFinite(sol) || sol <= 0) return setToast({ kind: 'error', message: 'Enter a valid amount' });
    const lamports = solToLamports(sol);
    if (lamports > balance.balance) return setToast({ kind: 'error', message: 'Amount exceeds balance' });
    withdraw(lamports);
  }

  return (
    <Modal open={open} onClose={onClose} title="Cashier">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3">
          <span className="label">Balance</span>
          <span className="font-semibold text-slate-100">
            ◎ {fmtSol(balance.balance)}{' '}
            {balance.locked > 0 && (
              <span className="text-xs text-tie">(◎ {fmtSol(balance.locked)} in play)</span>
            )}
          </span>
        </div>

        <div>
          <label className="label">Amount (SOL)</label>
          <input
            className="input mt-1"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {demo ? (
          <div className="space-y-3">
            <button className="btn-brand w-full" onClick={faucet}>
              Get {fmtSol(custody?.faucetLamports ?? 1e9)} demo SOL (Faucet)
            </button>
            <button className="btn-ghost w-full" onClick={onWithdraw}>
              Withdraw (simulated)
            </button>
            <p className="text-[11px] text-slate-500">
              Demo mode: deposits come from the faucet and withdrawals are simulated. Set
              <code className="mx-1 rounded bg-white/10 px-1">DEMO_MODE=false</code> on the server for real
              devnet custody.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button className="btn-brand w-full" onClick={onDeposit} disabled={busy}>
              {busy ? 'Depositing…' : 'Deposit from wallet'}
            </button>
            <button className="btn-ghost w-full" onClick={onWithdraw}>
              Withdraw to wallet
            </button>
            <p className="text-[11px] text-slate-500">
              Devnet custodial mode. Deposits transfer SOL to the platform wallet and credit your balance
              after on-chain confirmation.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
