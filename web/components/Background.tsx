const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Fixed, decorative backdrop: aurora blobs + grid + grain. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base wash */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_75%_-10%,rgba(45,212,191,0.10),transparent_60%),radial-gradient(900px_600px_at_5%_0%,rgba(139,92,246,0.10),transparent_55%)]" />

      {/* aurora blobs */}
      <div className="absolute -left-32 top-[-10%] h-[520px] w-[520px] rounded-full bg-brand-500/20 blur-[120px] animate-aurora" />
      <div className="absolute right-[-12%] top-[6%] h-[460px] w-[460px] rounded-full bg-iris-500/20 blur-[130px] animate-aurora [animation-delay:-7s]" />
      <div className="absolute bottom-[-18%] left-[30%] h-[480px] w-[480px] rounded-full bg-sky-500/10 blur-[140px] animate-aurora [animation-delay:-14s]" />

      {/* grid */}
      <div className="absolute inset-0 bg-grid-faint bg-grid [mask-image:radial-gradient(80%_60%_at_50%_0%,black,transparent)]" />

      {/* grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }}
      />

      {/* bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-975 to-transparent" />
    </div>
  );
}
