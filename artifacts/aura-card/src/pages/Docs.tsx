import { Link } from "wouter";
import {
  ArrowLeft,
  Sparkles,
  Workflow,
  IdCard,
  ShieldCheck,
  Radio,
  TrendingUp,
  Boxes,
  HelpCircle,
} from "lucide-react";

const NAV = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "flow", label: "How it works", icon: Workflow },
  { id: "card", label: "The Aura Card", icon: IdCard },
  { id: "onchain", label: "On-chain (Solana)", icon: ShieldCheck },
  { id: "txodds", label: "Live data — TxOdds", icon: Radio },
  { id: "odds-aura", label: "Odds-driven aura", icon: TrendingUp },
  { id: "stack", label: "Tech stack", icon: Boxes },
  { id: "faq", label: "FAQ", icon: HelpCircle },
] as const;

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.82em] text-primary/90">
      {children}
    </code>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[0.8rem] leading-relaxed text-white/80">
      {children}
    </pre>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: (typeof NAV)[number]["icon"];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/[0.06] pt-10">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-[0.95rem] leading-relaxed text-white/70">
        {children}
      </div>
    </section>
  );
}

export default function Docs() {
  return (
    <div className="min-h-dvh w-full bg-background text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="World Cup Aura home"
          >
            <img
              src={`${import.meta.env.BASE_URL}football.png`}
              alt=""
              className="h-7 w-7 object-contain"
            />
            <span className="font-display text-sm font-black uppercase tracking-tight">
              World Cup <span className="text-primary">Aura</span>
            </span>
            <span className="ml-1 hidden rounded-md border border-white/10 px-1.5 py-0.5 font-condensed text-[10px] font-semibold uppercase tracking-wide text-white/50 sm:inline">
              Docs
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-condensed text-xs font-semibold uppercase tracking-wide text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-3 px-3 type-eyebrow text-[0.62rem] text-white/35">
              Documentation
            </p>
            {NAV.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <Icon className="h-4 w-4 opacity-70" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 max-w-2xl">
          {/* Hero */}
          <div className="mb-10">
            <p className="type-eyebrow text-primary/70">World Cup Aura</p>
            <h1 className="mt-2 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
              The technical field guide
            </h1>
            <p className="mt-4 text-[0.98rem] leading-relaxed text-white/60">
              Turn a selfie and a 30-second quiz into a collectible World Cup
              Aura Card — AI portrait, six stats, a rarity roll that's{" "}
              <span className="text-white/80">verifiable on Solana</span>, and a
              live market read powered by real TxOdds data.
            </p>
          </div>

          <div className="space-y-10">
            <Section id="overview" icon={Sparkles} title="Overview">
              <p>
                World Cup Aura is a fan-engagement app. You take a selfie, answer
                a short quiz, and get a generated <b>Aura Card</b> — a stylized
                portrait with stats, a rarity tier, a matchday prophecy, and the
                pro footballer you most resemble. Cards can be saved, shared,
                and minted as Solana NFTs.
              </p>
              <p>
                Two things make it more than a filter: the rarity roll is{" "}
                <b>provably fair on-chain</b>, and the card carries a{" "}
                <b>live market read</b> from real World Cup betting data.
              </p>
            </Section>

            <Section id="flow" icon={Workflow} title="How it works">
              <ol className="list-decimal space-y-2 pl-5 marker:text-primary/60">
                <li>
                  <b>Selfie → portrait.</b> Your photo is restyled by OpenAI{" "}
                  <Code>gpt-image-1</Code> into an Aura Card portrait.
                </li>
                <li>
                  <b>Quiz → aura.</b> A few questions map to six stats, a rarity
                  tier (server-enforced quotas), and a prophecy.
                </li>
                <li>
                  <b>Reveal.</b> The card animates in with tier-based effects and
                  your look-alike footballer.
                </li>
                <li>
                  <b>Save · Share · Mint.</b> Share a permanent{" "}
                  <Code>/card/:slug</Code> link, or mint the card as a Solana
                  NFT.
                </li>
              </ol>
            </Section>

            <Section id="card" icon={IdCard} title="The Aura Card">
              <p>
                Every card scores six stats — <b>speed, clutch, iq, chaos,
                loyalty, banter</b> — plus an overall aura and power. Rarity runs{" "}
                <span className="text-white/80">
                  Core → Rising → Elite → Icon → Legendary → Mythic
                </span>
                , with higher tiers gated by quota so the top end stays scarce.
              </p>
              <p>
                <b>Player resemblance</b> matches your six stats against a curated
                dataset of pro footballers and surfaces the closest one — with a
                short reason for the match.
              </p>
            </Section>

            <Section id="onchain" icon={ShieldCheck} title="On-chain (Solana)">
              <p>
                <b>Verifiable rarity (VRF).</b> Each card's randomness is seeded
                by an on-chain Solana slot-hash VRF and written as a memo, so the
                rarity roll isn't "trust us" — it carries a{" "}
                <span className="text-emerald-400/90">verified on-chain</span>{" "}
                badge anyone can check via the transaction signature.
              </p>
              <p>
                <b>Sponsored minting.</b> Minting is frictionless — a treasury
                wallet sponsors fees and mints a Metaplex NFT directly to the
                recipient, so users need no balance of their own.
              </p>
            </Section>

            <Section id="txodds" icon={Radio} title="Live data — TxOdds / TxLINE">
              <p>
                The live World Cup ticker and market data come from the{" "}
                <b>TxOdds / TxLINE</b> feed. What's distinctive is the sign-up:
                instead of a shared API key, the app <b>subscribes on-chain</b> —
                a Solana transaction (Token-2022 ATA →{" "}
                <Code>subscribe</Code> on the oracle program → signed token
                activation) proves entitlement, and the activated token is cached
                server-side.
              </p>
              <Pre>{`GET /api/worldcup/fixtures        → live fixtures (ticker)
GET /api/worldcup/odds/:nation    → 1X2 market read for a nation`}</Pre>
              <p className="text-sm text-white/50">
                Data types available: fixtures, StablePrice odds, live scores,
                and on-chain validation proofs.
              </p>
            </Section>

            <Section id="odds-aura" icon={TrendingUp} title="Odds-driven aura">
              <p>
                The card's <b>Live Market Read</b> takes the TxLINE StablePrice{" "}
                <Code>1X2_PARTICIPANT_RESULT</Code> market for your nation's
                fixture and turns the de-margined win probability into an{" "}
                <b>aura stance</b>:
              </p>
              <ul className="space-y-1.5 pl-1">
                <li>
                  <span className="font-semibold text-emerald-400">
                    Frontrunner
                  </span>{" "}
                  — the market backs your nation (≥45% implied).
                </li>
                <li>
                  <span className="font-semibold text-blue-400">Contender</span>{" "}
                  — a real shot (≥28%).
                </li>
                <li>
                  <span className="font-semibold text-rose-400">Dark Horse</span>{" "}
                  — the market doubts them, and that's the fuel.
                </li>
              </ul>
              <p>
                So the live betting market literally shapes how your card reads —
                real data as a direct input, not just a decorative ticker.
              </p>
            </Section>

            <Section id="stack" icon={Boxes} title="Tech stack">
              <ul className="space-y-1.5 pl-1">
                <li>
                  <b>Frontend</b> — React 19 + Vite, Tailwind v4, wouter, TanStack
                  Query, framer-motion.
                </li>
                <li>
                  <b>Backend</b> — Express 5 (single esbuild bundle), rate-limited
                  and helmet-secured.
                </li>
                <li>
                  <b>Data</b> — PostgreSQL (Neon) via Drizzle; OpenAPI → Orval
                  codegen for typed client + Zod schemas.
                </li>
                <li>
                  <b>Chain</b> — Solana web3.js, Anchor, Metaplex, wallet-adapter.
                </li>
                <li>
                  <b>Infra</b> — Docker + nginx + TLS, self-hosted.
                </li>
              </ul>
            </Section>

            <Section id="faq" icon={HelpCircle} title="FAQ">
              <p>
                <b>Do I need a wallet or crypto?</b> No — generating, saving, and
                sharing are free, and minting is sponsored.
              </p>
              <p>
                <b>Is this mainnet?</b> The chain features run on Solana{" "}
                <b>devnet</b> for the demo.
              </p>
              <p>
                <b>Where does player data come from?</b> A curated in-app dataset
                — the resemblance is authored, not scraped. TxOdds supplies match
                odds/scores, not player stats.
              </p>
            </Section>
          </div>

          <div className="mt-14 border-t border-white/[0.06] pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-black uppercase tracking-wide text-primary-foreground transition hover:brightness-105"
            >
              <Sparkles className="h-4 w-4" /> Reveal your aura
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
