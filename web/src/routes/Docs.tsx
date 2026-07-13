import { Link } from "wouter";
import {
  Sparkles,
  Workflow,
  IdCard,
  ShieldCheck,
  Radio,
  TrendingUp,
  Boxes,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

const NAV = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "flow", label: "How it works", icon: Workflow },
  { id: "card", label: "The Aura Card", icon: IdCard },
  { id: "onchain", label: "On-chain (Solana)", icon: ShieldCheck },
  { id: "txodds", label: "Live data · TxOdds", icon: Radio },
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
  index,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  index: string;
  icon: (typeof NAV)[number]["icon"];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-white/[0.06] pt-10">
      <div className="mb-5 flex items-center gap-3">
        <span className="font-numeral text-sm leading-none text-primary">{index}</span>
        <span className="h-px w-8 bg-primary/40" />
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-[0.95rem] leading-relaxed text-white/70">{children}</div>
    </section>
  );
}

export default function Docs() {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-background text-white">
      {/* Near-black base with a soft warm spotlight, matching the landing */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, #0d0d16 0%, #08080e 52%, #050509 100%)" }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(50% 32% at 50% 12%, hsl(42 78% 55% / 0.09) 0%, transparent 68%)" }}
      />

      <Navbar />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-28 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-1">
            <p className="mb-3 px-3 type-eyebrow text-[0.62rem] text-white/35">Documentation</p>
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
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <span className="type-eyebrow text-primary">Field Guide</span>
            </div>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,4.25rem)] font-bold uppercase leading-[0.9] tracking-tight text-white">
              The technical <span className="gold-text-static">field guide</span>
            </h1>
            <p className="mt-5 text-[0.98rem] leading-relaxed text-white/60">
              Turn a selfie and a 30-second quiz into a collectible Aura Card: an AI portrait, six stats, a rarity roll
              that's <span className="text-white/80">verifiable on Solana</span>, and a live market read powered by real
              TxOdds data.
            </p>
          </div>

          <div className="space-y-10">
            <Section id="overview" index="01" icon={Sparkles} title="Overview">
              <p>
                Aura Cards is a fan-engagement app. You take a selfie, answer a short quiz, and get a generated{" "}
                <b>Aura Card</b>: a stylized portrait with stats, a rarity tier, a matchday prophecy, and the pro
                footballer you most resemble. Cards can be saved, shared, and minted as Solana NFTs.
              </p>
              <p>
                Two things make it more than a filter: the rarity roll is <b>provably fair on-chain</b>, and the card
                carries a <b>live market read</b> from real World Cup betting data.
              </p>
            </Section>

            <Section id="flow" index="02" icon={Workflow} title="How it works">
              <ol className="list-decimal space-y-2 pl-5 marker:text-primary/60">
                <li>
                  <b>Selfie to portrait.</b> Your photo is restyled by OpenAI <Code>gpt-image-1</Code> into an Aura Card
                  portrait.
                </li>
                <li>
                  <b>Quiz to aura.</b> A few questions map to six stats, a rarity tier (server-enforced quotas), and a
                  prophecy.
                </li>
                <li>
                  <b>Reveal.</b> The card animates in with tier-based effects and your look-alike footballer.
                </li>
                <li>
                  <b>Save · Share · Mint.</b> Share a permanent <Code>/card/:slug</Code> link, or mint the card as a
                  Solana NFT.
                </li>
              </ol>
            </Section>

            <Section id="card" index="03" icon={IdCard} title="The Aura Card">
              <p>
                Every card scores six stats (<b>speed, clutch, iq, chaos, loyalty, banter</b>), plus an overall aura and
                power. Rarity runs{" "}
                <span className="text-white/80">Core → Rising → Elite → Icon → Legendary → Mythic</span>, with higher
                tiers gated by quota so the top end stays scarce.
              </p>
              <p>
                <b>Player resemblance</b> matches your six stats against a curated dataset of pro footballers and
                surfaces the closest one, with a short reason for the match.
              </p>
            </Section>

            <Section id="onchain" index="04" icon={ShieldCheck} title="On-chain (Solana)">
              <p>
                <b>Verifiable rarity (VRF).</b> Each card's randomness is seeded by an on-chain Solana slot-hash VRF and
                written as a memo, so the rarity roll isn't "trust us": it carries a{" "}
                <span className="text-emerald-400/90">verified on-chain</span> badge anyone can check via the
                transaction signature.
              </p>
              <p>
                <b>Sponsored minting.</b> Minting is frictionless: a treasury wallet sponsors fees and mints a Metaplex
                NFT directly to the recipient, so users need no balance of their own.
              </p>
            </Section>

            <Section id="txodds" index="05" icon={Radio} title="Live data · TxOdds / TxLINE">
              <p>
                The live World Cup ticker and market data come from the <b>TxOdds / TxLINE</b> feed. What's distinctive
                is the sign-up: instead of a shared API key, the app <b>subscribes on-chain</b>. A Solana transaction
                (Token-2022 ATA, then <Code>subscribe</Code> on the oracle program, then a signed token activation)
                proves entitlement, and the activated token is cached server-side.
              </p>
              <Pre>{`GET /api/worldcup/fixtures        → live fixtures (ticker)
GET /api/worldcup/odds/:nation    → 1X2 market read for a nation`}</Pre>
              <p className="text-sm text-white/50">
                Data types available: fixtures, StablePrice odds, live scores, and on-chain validation proofs.
              </p>
            </Section>

            <Section id="odds-aura" index="06" icon={TrendingUp} title="Odds-driven aura">
              <p>
                The card's <b>Live Market Read</b> takes the TxLINE StablePrice{" "}
                <Code>1X2_PARTICIPANT_RESULT</Code> market for your nation's fixture and turns the de-margined win
                probability into an <b>aura stance</b>:
              </p>
              <ul className="space-y-1.5 pl-1">
                <li>
                  <span className="font-semibold text-emerald-400">Frontrunner</span>: the market backs your nation
                  (≥45% implied).
                </li>
                <li>
                  <span className="font-semibold text-blue-400">Contender</span>: a real shot (≥28%).
                </li>
                <li>
                  <span className="font-semibold text-rose-400">Dark Horse</span>: the market doubts them, and that's
                  the fuel.
                </li>
              </ul>
              <p>
                So the live betting market literally shapes how your card reads: real data as a direct input, not just a
                decorative ticker.
              </p>
            </Section>

            <Section id="stack" index="07" icon={Boxes} title="Tech stack">
              <ul className="space-y-1.5 pl-1">
                <li>
                  <b>Frontend:</b> React 19 + Vite, Tailwind v4, wouter, TanStack Query, framer-motion.
                </li>
                <li>
                  <b>Backend:</b> Express 5 (single esbuild bundle), rate-limited and helmet-secured.
                </li>
                <li>
                  <b>Data:</b> PostgreSQL (Neon) via Drizzle; OpenAPI → Orval codegen for typed client + Zod schemas.
                </li>
                <li>
                  <b>Chain:</b> Solana web3.js, Anchor, Metaplex, wallet-adapter.
                </li>
                <li>
                  <b>Infra:</b> Docker + nginx + TLS, self-hosted.
                </li>
              </ul>
            </Section>

            <Section id="faq" index="08" icon={HelpCircle} title="FAQ">
              <p>
                <b>Do I need a wallet or crypto?</b> No. Generating, saving, and sharing are free, and minting is
                sponsored.
              </p>
              <p>
                <b>Is this mainnet?</b> The chain features run on Solana <b>devnet</b> for the demo.
              </p>
              <p>
                <b>Where does player data come from?</b> A curated in-app dataset; the resemblance is authored, not
                scraped. TxOdds supplies match odds/scores, not player stats.
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
