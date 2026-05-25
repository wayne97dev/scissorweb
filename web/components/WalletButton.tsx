'use client';

import dynamic from 'next/dynamic';

// Loaded client-only: the wallet button reads localStorage for the last-used wallet.
export const WalletButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false, loading: () => <button className="btn-ghost" disabled>Connect Wallet</button> }
);
