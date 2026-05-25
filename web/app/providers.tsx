'use client';

import React, { useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { clusterApiUrl } from '@solana/web3.js';
import { AppProvider, useApp } from '@/lib/store';
import { makeWalletIdentity } from '@/lib/identity';

/** Logs in to the game backend whenever a Solana wallet connects. */
function WalletAuthBridge() {
  const { publicKey, signMessage, connected } = useWallet();
  const { loginWith, identity } = useApp();

  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;
    const pk = publicKey.toBase58();
    if (identity?.kind === 'wallet' && identity.pubkey === pk) return;
    loginWith(makeWalletIdentity(pk, (msg) => signMessage(msg)));
  }, [connected, publicKey, signMessage, identity, loginWith]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('devnet'),
    []
  );
  // Empty list: modern wallets (Phantom, Solflare, …) auto-register via the
  // Wallet Standard, so we don't need to bundle individual adapters.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppProvider>
            <WalletAuthBridge />
            {children}
          </AppProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
