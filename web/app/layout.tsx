import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { Background } from '@/components/Background';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://duelpvp.net';
const DESCRIPTION =
  '1v1 Rock Paper Scissors on Solana. 0% house edge, winner takes the pot. Provably fair.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Duel · Rock Paper Scissors',
  description: DESCRIPTION,
  openGraph: {
    title: 'Duel · Rock Paper Scissors',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Duel',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Duel — 1v1 Rock Paper Scissors on Solana' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Duel · Rock Paper Scissors',
    description: DESCRIPTION,
    images: ['/og.png'],
    site: '@rockscisspaper',
    creator: '@rockscisspaper',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <Background />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
