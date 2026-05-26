import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoMark } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Duel · Whitepaper',
  description: 'How Duel works: provably-fair, no-house-edge 1v1 Rock Paper Scissors on Solana.',
};

const TICKER = '$DUEL';

const TOC = [
  ['overview', 'Overview'],
  ['two-layers', 'Two layers'],
  ['how-a-duel-works', 'How a duel works'],
  ['the-money', 'The money'],
  ['provable-fairness', 'Provable fairness'],
  ['custody', 'Custody & balances'],
  ['token', `The ${TICKER} token`],
  ['tournaments', 'Tournaments'],
  ['roadmap', 'Roadmap & status'],
  ['trust-risk', 'Trust & risk'],
];

export default function Whitepaper() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      {/* header */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-80">
          <LogoMark size={32} />
          <div className="leading-none">
            <div className="font-display text-base font-bold text-slate-50">Duel</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">Whitepaper</div>
          </div>
        </Link>
        <Link href="/" className="btn-ghost">
          ← Back to app
        </Link>
      </div>

      {/* hero */}
      <header className="mb-10">
        <span className="chip-brand">v1 · litepaper</span>
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
          Provably-fair, <span className="gradient-text">no-house-edge</span> 1v1 Rock Paper Scissors on
          Solana.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
          Duel is a real-time player-versus-player game. Two players stake the same amount, play one
          provably-fair round, and the winner takes the whole pot. The house takes nothing from the
          round — <span className="text-slate-200">100% RTP</span>. This document explains exactly what
          you stake, what you win, how fairness is guaranteed, and how the {TICKER} token fits in.
        </p>
      </header>

      {/* TOC */}
      <nav className="panel mb-10 p-4">
        <div className="label mb-2">Contents</div>
        <ol className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {TOC.map(([id, label], i) => (
            <li key={id}>
              <a href={`#${id}`} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-brand-300">
                <span className="font-mono text-xs text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-12">
        <Section id="overview" n="01" title="Overview">
          <P>
            Duel turns Rock Paper Scissors into a fair, head-to-head wager. You create a game and set
            your stake, or join an open one. Once two players are matched, each secretly picks a move.
            Both picks are cryptographically locked in <em>before</em> either is revealed, so neither
            side — and not even the platform — can change a pick after seeing the other.
          </P>
          <P>
            The defining property is simple: <Strong>the round itself makes nobody any money</Strong>.
            There is no rake, no fee, no edge skimmed from the pot. Every lamport that goes in comes
            back out to a player. This is what &ldquo;0% house edge&rdquo; and &ldquo;100% RTP&rdquo;
            mean here.
          </P>
        </Section>

        <Section id="two-layers" n="02" title="Two layers, one mantra">
          <P>
            The most important thing to understand is that Duel has{' '}
            <Strong>two completely separate economic layers</Strong>. Confusing them is the #1 source of
            questions, so we make it explicit:
          </P>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card title="① The Duel (the game)" accent="brand">
              <Li>Player vs player, pot-based.</Li>
              <Li>Both players stake the same amount.</Li>
              <Li>Winner takes the whole pot (2× the stake).</Li>
              <Li>
                <Strong className="text-brand-300">0% house edge.</Strong> The platform takes nothing.
              </Li>
              <Li>Your winnings come 100% from your opponent&rsquo;s stake.</Li>
            </Card>
            <Card title={`② The ${TICKER} token`} accent="iris">
              <Li>Launched on pump.fun.</Li>
              <Li>A share of trading fees flows to the Duel Treasury.</Li>
              <Li>Treasury funds tournaments, prizes, buybacks, ops.</Li>
              <Li>
                <Strong className="text-iris-400">Never touches a 1v1 pot.</Strong>
              </Li>
              <Li>This is how the project sustains itself (not from rake).</Li>
            </Card>
          </div>
          <Callout tone="brand" title="So, what do players win?">
            In a normal 1v1 duel you win <Strong>your opponent&rsquo;s stake</Strong> — you get your
            own stake back plus theirs, i.e. 2× your stake. You do <em>not</em> win token fees. Token
            fees are a separate pool that funds <em>tournaments and prizes</em>.
          </Callout>
        </Section>

        <Section id="how-a-duel-works" n="03" title="How a duel works">
          <Steps
            steps={[
              ['Create or join', 'You set a stake and create a game, or join an open one in the lobby. Both players must have the stake available in their balance.'],
              ['Escrow', 'When you create/join, your stake is moved from your spendable balance into escrow for that game. Neither side can spend it elsewhere while the round is live.'],
              ['Commit', 'Each player secretly picks rock, paper or scissors. The client hashes (pick + a secret key) and sends only the hash. Both hashes are locked in before anything is revealed.'],
              ['Reveal', 'Once both hashes are locked, each side reveals its pick + key. The server checks each reveal against the committed hash — a changed pick is rejected.'],
              ['Settle', 'The winner is computed (rock>scissors>paper>rock). The whole pot is credited to the winner. A tie refunds both. The full record is published for anyone to verify.'],
            ]}
          />
          <Callout tone="neutral" title="Timeouts & forfeits">
            Each phase has a countdown. If a player fails to commit or reveal in time, they forfeit and
            the opponent takes the pot. If neither plays, it&rsquo;s a no-contest and both stakes are
            refunded. Honest clients reveal automatically the instant both sides have committed.
          </Callout>
        </Section>

        <Section id="the-money" n="04" title="The money: what you stake, what you win">
          <P>
            You play with your <Strong>balance</Strong> (see Custody below). In the current demo, balance
            is play-money from a faucet; with real custody enabled it is SOL you deposited.
          </P>
          <div className="my-4 overflow-hidden rounded-xl border border-white/10">
            <div className="bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200">
              Worked example — you stake ◎0.10, opponent stakes ◎0.10 (pot ◎0.20)
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/[0.06]">
                <Tr k="You win" v="−0.10 stake, +0.20 pot = net +◎0.10 (you doubled your stake)" tone="win" />
                <Tr k="You lose" v="−◎0.10 (your stake goes to the winner)" tone="lose" />
                <Tr k="Tie" v="both stakes refunded → net ◎0.00" tone="tie" />
                <Tr k="House takes" v="◎0.00 — always" tone="brand" />
              </tbody>
            </table>
          </div>
          <P>
            The pot is exactly the sum of the two equal stakes. The winner receives all of it. There is
            no commission, listing fee, or spread. That is the entire money model of a duel.
          </P>
        </Section>

        <Section id="provable-fairness" n="05" title="Provable fairness">
          <P>
            RPS only works if neither side can see the other&rsquo;s move first. Duel guarantees this
            with a <Strong>commit-reveal</Strong> scheme. Each player&rsquo;s commitment is:
          </P>
          <pre className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-ink-900/70 p-3 font-mono text-[12px] text-brand-300">
            sha256(&quot;rps-v1|game:&lt;gameId&gt;|pick:&lt;pick&gt;|key:&lt;clientKey&gt;&quot;)
          </pre>
          <P>
            The <code className="rounded bg-white/10 px-1 text-brand-300">clientKey</code> is a random
            secret generated in your browser. Before the reveal, the server only ever sees the hash — it
            cannot derive your pick. After the round, both keys and picks are published, so{' '}
            <Strong>anyone</Strong> can recompute both hashes and confirm neither side changed its pick
            mid-game. Binding the hash to the <code className="rounded bg-white/10 px-1">gameId</code>{' '}
            stops a commitment from being replayed in another game.
          </P>
          <Callout tone="brand" title="Verify it yourself">
            Every finished round shows a Provable Fairness panel with both commitments, picks and keys,
            plus a built-in verifier that recomputes the SHA-256 hashes entirely in your browser. You
            can also paste any published record into the verifier to audit it independently.
          </Callout>
        </Section>

        <Section id="custody" n="06" title="Custody & balances">
          <P>
            Duel is currently <Strong>custodial</Strong>: the platform holds balances and settles rounds
            off-chain for instant, gas-free play. You deposit SOL to your balance, play, and withdraw
            what you have. Identity is your Solana wallet (or a local guest key); you prove control with
            a signed message — no one can act on your balance without your signature.
          </P>
          <Callout tone="warn" title="Honest trust note">
            The <em>outcome</em> of every round is provably fair and independently verifiable. The{' '}
            <em>custody</em> of funds, however, is trust-based — you trust the platform to hold and pay
            out balances correctly. Fully trustless on-chain escrow is on the roadmap. Today&rsquo;s
            build runs in demo mode (play-money) on devnet.
          </Callout>
        </Section>

        <Section id="token" n="07" title={`The ${TICKER} token`}>
          <P>
            Because duels are 0% rake, Duel doesn&rsquo;t earn from the rounds. Instead it is funded by{' '}
            <Strong>{TICKER}</Strong>, launched on <Strong>pump.fun</Strong>. A share of the
            token&rsquo;s trading fees is routed to the <Strong>Duel Treasury</Strong>, which is used for:
          </P>
          <ul className="mt-3 space-y-1.5">
            <Li>Tournament prize pools (the main use — see below).</Li>
            <Li>Community events and rewards.</Li>
            <Li>Token buybacks to support the ecosystem.</Li>
            <Li>Operating and infrastructure costs.</Li>
          </ul>
          <Callout tone="iris" title="Key boundary">
            Token fees <Strong>never</Strong> enter a 1v1 pot. A duel is settled purely between the two
            players. The token economy lives alongside the game, funding prizes and operations — not
            individual matchups. <span className="text-slate-500">({TICKER} is a placeholder ticker; the
            final symbol is set at launch.)</span>
          </Callout>
        </Section>

        <Section id="tournaments" n="08" title="Tournaments (planned)">
          <P>
            Tournaments are how the token economy reaches players. Instead of free giveaways, the
            Treasury <Strong>seeds a prize pool</Strong> (funded by token fees) and players compete in a
            bracket of RPS duels. The tagline from day one: <em>&ldquo;double or lose your
            prize.&rdquo;</em> Advance to grow your prize, or lose it and you&rsquo;re out.
          </P>
          <P>
            Entry can be free (fully fee-funded) or staked, depending on the event. This turns trading-
            fee revenue into recurring, skill-based prize competitions rather than one-off airdrops.
          </P>
        </Section>

        <Section id="roadmap" n="09" title="Roadmap & status">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/[0.06]">
                <Phase tag="Live" tone="win" phase="Phase 0 — Demo" desc="1v1 duels, commit-reveal, in-app verifier, practice vs bot. Play-money on devnet." />
                <Phase tag="Next" tone="brand" phase="Phase 1 — Real SOL" desc="Enable custodial SOL deposits & withdrawals (devnet → mainnet)." />
                <Phase tag="Planned" tone="iris" phase={`Phase 2 — ${TICKER} token`} desc="pump.fun launch + Treasury fee routing." />
                <Phase tag="Planned" tone="iris" phase="Phase 3 — Tournaments" desc="Fee-funded prize pools, bracket play." />
                <Phase tag="Planned" tone="iris" phase="Phase 4 — SPL betting" desc={`Stake with ${TICKER} and other SPL tokens, not just SOL.`} />
                <Phase tag="Later" tone="neutral" phase="Phase 5 — On-chain escrow" desc="Trustless custody: stakes & settlement in a Solana program." />
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="trust-risk" n="10" title="Trust & risk">
          <ul className="space-y-2 text-sm text-slate-400">
            <Li><Strong>Demo / devnet:</Strong> the current build uses play-money and has no real monetary value. Balances and games reset on backend restarts.</Li>
            <Li><Strong>Custodial trust:</Strong> the platform holds balances. Only the game outcome is provably fair; custody is trust-based until on-chain escrow ships.</Li>
            <Li><Strong>Regulatory:</Strong> wagering games are restricted in some jurisdictions. You are responsible for compliance with local law and any age requirements. Not available where prohibited.</Li>
            <Li><Strong>Token risk:</Strong> {TICKER} is a volatile asset, not an investment or a security. Prizes and fee revenue depend on trading activity and are not guaranteed.</Li>
            <Li><Strong>No advice:</Strong> nothing here is financial, legal, or tax advice.</Li>
          </ul>
        </Section>
      </div>

      <footer className="mt-14 border-t border-white/[0.06] pt-6 text-center text-xs text-slate-600">
        Duel · 0% house edge · winner takes the pot · picks hashed &amp; verifiable · built on Solana
        <div className="mt-3">
          <Link href="/" className="btn-brand">
            Play now
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ---------- presentational helpers ---------- */

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-xs text-brand-400">{n}</span>
        <h2 className="font-display text-xl font-bold text-slate-50">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-slate-400">{children}</p>;
}

function Strong({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <strong className={`font-semibold text-slate-200 ${className}`}>{children}</strong>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-slate-400">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500/70" />
      <span>{children}</span>
    </li>
  );
}

function Card({ title, accent, children }: { title: string; accent: 'brand' | 'iris'; children: React.ReactNode }) {
  const border = accent === 'brand' ? 'border-brand-500/25' : 'border-iris-500/25';
  return (
    <div className={`rounded-2xl border ${border} bg-white/[0.02] p-4`}>
      <h3 className="mb-2 font-display text-sm font-semibold text-slate-100">{title}</h3>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

function Callout({ tone, title, children }: { tone: 'brand' | 'iris' | 'warn' | 'neutral'; title: string; children: React.ReactNode }) {
  const map = {
    brand: 'border-brand-500/30 bg-brand-500/[0.06]',
    iris: 'border-iris-500/30 bg-iris-500/[0.06]',
    warn: 'border-tie/30 bg-tie/[0.06]',
    neutral: 'border-white/10 bg-white/[0.03]',
  } as const;
  return (
    <div className={`mt-4 rounded-xl border p-4 ${map[tone]}`}>
      <div className="mb-1 text-sm font-semibold text-slate-100">{title}</div>
      <div className="text-sm leading-relaxed text-slate-400">{children}</div>
    </div>
  );
}

function Steps({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="space-y-3">
      {steps.map(([title, desc], i) => (
        <li key={title} className="flex gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand-500/30 bg-brand-500/10 font-mono text-xs font-bold text-brand-300">
            {i + 1}
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-200">{title}</div>
            <div className="text-sm leading-relaxed text-slate-400">{desc}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Tr({ k, v, tone }: { k: string; v: string; tone: 'win' | 'lose' | 'tie' | 'brand' }) {
  const color = { win: 'text-win', lose: 'text-lose', tie: 'text-tie', brand: 'text-brand-300' }[tone];
  return (
    <tr>
      <td className={`whitespace-nowrap px-4 py-2.5 align-top font-semibold ${color}`}>{k}</td>
      <td className="px-4 py-2.5 text-slate-400">{v}</td>
    </tr>
  );
}

function Phase({ tag, tone, phase, desc }: { tag: string; tone: 'win' | 'brand' | 'iris' | 'neutral'; phase: string; desc: string }) {
  const color = { win: 'text-win', brand: 'text-brand-300', iris: 'text-iris-400', neutral: 'text-slate-400' }[tone];
  return (
    <tr>
      <td className="whitespace-nowrap px-4 py-3 align-top">
        <span className={`chip ${color}`}>{tag}</span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-semibold text-slate-200">{phase}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </td>
    </tr>
  );
}
