import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Camera,
  Upload,
  User,
  ChevronRight,
  ChevronDown,
  ScanFace,
  Gem,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { CommunityCarousel } from "@/components/CommunityCarousel";
import { useGetRarityStats } from "@/api";
import { useAuraFlow } from "../AuraFlowProvider";

/* ─── Odds teaser data (mirrors /odds; falls back until stats load) ─────── */
interface OddsTier {
  tier: string;
  quota: number;
  issued: number;
  remaining: number;
  pullRate: number;
}
const DEFAULT_TIERS: OddsTier[] = [
  { tier: "Core", quota: 55000, issued: 0, remaining: 55000, pullRate: 55.0 },
  { tier: "Rising", quota: 25000, issued: 0, remaining: 25000, pullRate: 25.0 },
  { tier: "Elite", quota: 12000, issued: 0, remaining: 12000, pullRate: 12.0 },
  { tier: "Icon", quota: 5500, issued: 0, remaining: 5500, pullRate: 5.5 },
  { tier: "Legendary", quota: 2000, issued: 0, remaining: 2000, pullRate: 2.0 },
  { tier: "Mythic", quota: 500, issued: 0, remaining: 500, pullRate: 0.5 },
];

const STEPS = [
  {
    icon: ScanFace,
    title: "Take your selfie",
    body: "Snap a photo or upload one. Our AI forges your face into a cinematic collectible portrait.",
  },
  {
    icon: Gem,
    title: "Reveal your rarity",
    body: "Answer a quick quiz, then watch a provably-fair on-chain roll set your tier, from Core to Mythic.",
  },
  {
    icon: ShieldCheck,
    title: "Mint on Solana",
    body: "Claim your numbered edition forever. Share it, challenge friends, or ship the physical card.",
  },
];

/* ─── Scroll-reveal wrapper ─────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ChapterLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-numeral text-base leading-none text-primary">{index}</span>
      <span className="h-px w-10 bg-primary/40" />
      <span className="type-eyebrow text-white/50">{title}</span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="surface-flat rounded-xl px-4 py-3.5">
      <div className="font-numeral text-2xl leading-none text-white md:text-3xl">{value}</div>
      <div className="label-stat mt-1.5 text-white/45">{label}</div>
    </div>
  );
}

export function LandingStep() {
  const { actions } = useAuraFlow();
  const rarityStatsQuery = useGetRarityStats({ query: { staleTime: 60_000 } } as never);
  const stats = rarityStatsQuery.data as { totalIssued?: number; tiers?: OddsTier[] } | undefined;
  const tiers = stats?.tiers ?? DEFAULT_TIERS;
  const totalIssued = stats?.totalIssued ?? 0;

  return (
    <div className="relative w-full">
      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative w-full overflow-hidden">
        {/* Layered cinematic background */}
        <div
          className="absolute inset-0 z-0"
          style={{ background: "radial-gradient(125% 90% at 50% 0%, #10101c 0%, #08080e 54%, #050509 100%)" }}
        />
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: "radial-gradient(52% 42% at 68% 32%, hsl(42 78% 55% / 0.13) 0%, transparent 66%)" }}
        />
        {/* Faint grid for texture */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(80% 60% at 50% 30%, #000 0%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(80% 60% at 50% 30%, #000 0%, transparent 80%)",
          }}
        />
        {/* Fade into the next section */}
        <div className="absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 pb-24 pt-32 md:grid-cols-2 md:gap-8 md:pt-28">
          {/* Copy */}
          <motion.div
            className="order-2 text-center md:order-1 md:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display font-bold uppercase leading-[0.84] tracking-tight text-white text-[clamp(2.9rem,8vw,5.75rem)]">
              Unleash
              <br />
              Your <span className="gold-text-static">Aura</span>
            </h1>

            <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/60 md:mx-0 md:text-lg">
              Turn your selfie into a legendary fan card. Pick your nation, reveal your power level. Minted forever on
              Solana.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:max-w-md">
              <Button
                onClick={actions.start}
                size="lg"
                className="h-14 w-full text-base font-black uppercase tracking-[0.06em]"
              >
                <Camera className="mr-1" /> Take Selfie
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={actions.requestUpload} variant="outline" className="h-12">
                  <Upload className="mr-1 h-4 w-4" /> Upload
                </Button>
                <Button onClick={actions.start} variant="outline" className="h-12">
                  <User className="mr-1 h-4 w-4" /> Sample
                </Button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 md:justify-start">
              <span className="text-xs text-white/40">Part of an exclusive 100,000-card collection.</span>
              <Link
                href="/odds"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary/85 underline underline-offset-2 transition-colors hover:text-primary"
              >
                See the odds <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>

          {/* Floating card trio */}
          <div className="relative order-1 flex h-[320px] w-full items-center justify-center md:order-2 md:h-[540px]">
            <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-primary/16 blur-[120px]" />

            <motion.div
              className="absolute h-60 w-44 overflow-hidden rounded-xl border border-white/10 bg-surface-1 shadow-2xl"
              style={{ transformOrigin: "bottom center" }}
              initial={{ opacity: 0, rotate: 0, x: 0, scale: 0.8 }}
              animate={{ opacity: 1, rotate: -16, x: -104, scale: 0.86, y: [0, -12, 0] }}
              transition={{
                opacity: { delay: 0.35, duration: 0.5 },
                rotate: { delay: 0.35, type: "spring", bounce: 0.5 },
                x: { delay: 0.35, type: "spring", bounce: 0.5 },
                scale: { delay: 0.35, type: "spring", bounce: 0.5 },
                y: { delay: 1, duration: 5, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <img src="/card-action-1.png" alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </motion.div>

            <motion.div
              className="absolute h-60 w-44 overflow-hidden rounded-xl border border-white/10 bg-surface-1 shadow-2xl"
              style={{ transformOrigin: "bottom center" }}
              initial={{ opacity: 0, rotate: 0, x: 0, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 16, x: 104, scale: 0.86, y: [0, -12, 0] }}
              transition={{
                opacity: { delay: 0.5, duration: 0.5 },
                rotate: { delay: 0.5, type: "spring", bounce: 0.5 },
                x: { delay: 0.5, type: "spring", bounce: 0.5 },
                scale: { delay: 0.5, type: "spring", bounce: 0.5 },
                y: { delay: 1.4, duration: 5.5, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <img src="/hero-action.png" alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </motion.div>

            <motion.div
              className="glass-panel card-shine relative z-10 h-80 w-56 overflow-hidden rounded-xl border-primary/60 shadow-[0_28px_70px_-14px_rgba(0,0,0,0.85)]"
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -3, y: [0, -16, 0] }}
              transition={{
                opacity: { duration: 0.5 },
                scale: { type: "spring", bounce: 0.5 },
                rotate: { type: "spring", bounce: 0.5 },
                y: { delay: 0.8, duration: 4.5, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <img
                src="/card-action-2.png"
                alt="Aura Card"
                className="h-full w-full object-cover object-top contrast-125"
              />
              <div className="holo-overlay" />
              <div className="absolute left-3 top-3 z-20 text-center drop-shadow-xl">
                <div className="gold-text-gradient font-display text-5xl font-black leading-none">94</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">Aura</div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
                <div className="font-display text-lg font-black uppercase leading-tight tracking-wide text-white">
                  Mythic Champion
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-primary">Legendary Striker</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <span className="type-eyebrow text-[0.6rem] text-white/30">Scroll</span>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="h-4 w-4 text-white/30" />
          </motion.span>
        </motion.div>
      </section>

      {/* ══════════════════════ MARQUEE ══════════════════════ */}
      <div className="relative w-full overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-5">
        <div className="flex w-max animate-wc-ticker whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-8 pr-8" aria-hidden={dup === 1}>
              {["Unleash Your Aura", "100,000 Cards", "Six Rarity Tiers", "Minted On Solana"].map((word, i) => (
                <span key={i} className="flex items-center gap-8">
                  <span className="font-display text-3xl font-bold uppercase tracking-tight text-white/[0.09] md:text-5xl">
                    {word}
                  </span>
                  <span className="text-2xl text-primary/70 md:text-3xl">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════ 01 · THE COLLECTION ══════════════════════ */}
      <section className="relative mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
        <Reveal>
          <ChapterLabel index="01" title="The Collection" />
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold uppercase leading-[0.95] tracking-tight text-white">
              A 100,000-piece <span className="gold-text-static">fan collection.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col justify-center">
            <p className="text-base leading-relaxed text-white/60">
              Every Aura Card is numbered 1–100,000 and minted to the founding 2026 Edition. Six rarity tiers, from
              everyday <span className="text-white/80">Core</span> to one-in-two-hundred{" "}
              <span className="text-primary">Mythic</span>. Each one a unique on-chain collectible.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat value={totalIssued > 0 ? totalIssued.toLocaleString() : "100K"} label="Minted" />
              <Stat value="6" label="Rarity Tiers" />
              <Stat value="Solana" label="On-Chain" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-12">
          <CommunityCarousel baseUrl={import.meta.env.BASE_URL} />
        </Reveal>
      </section>

      {/* ══════════════════════ 02 · HOW IT WORKS ══════════════════════ */}
      <section className="relative w-full border-y border-white/[0.05] bg-white/[0.012]">
        <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
          <Reveal>
            <ChapterLabel index="02" title="How It Works" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-8 max-w-2xl font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold uppercase leading-[0.95] tracking-tight text-white">
              Three steps to your card.
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="surface-card group relative h-full overflow-hidden rounded-2xl p-7">
                  <span className="pointer-events-none absolute -right-2 -top-3 font-numeral text-7xl leading-none text-white/[0.05]">
                    0{i + 1}
                  </span>
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="relative mt-5 font-display text-xl font-bold uppercase tracking-tight text-white">
                    {s.title}
                  </h3>
                  <p className="relative mt-2.5 text-sm leading-relaxed text-white/55">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ 03 · THE ODDS ══════════════════════ */}
      <section className="relative mx-auto w-full max-w-3xl px-5 py-24 md:py-32">
        <Reveal>
          <ChapterLabel index="03" title="The Odds" />
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-8 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold uppercase leading-[0.95] tracking-tight text-white">
            Rarer tier, <span className="gold-text-static">fewer cards.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 surface-card overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
            <span className="label-stat text-muted-foreground">Tier</span>
            <span className="label-stat text-muted-foreground">Pull rate</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {tiers.map((row) => {
              const premium = row.tier === "Legendary" || row.tier === "Mythic";
              return (
                <div key={row.tier} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="flex w-28 shrink-0 items-center gap-2 font-condensed text-sm font-semibold uppercase tracking-wide text-white">
                    {premium && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    {row.tier}
                  </span>
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${premium ? "bg-primary" : "bg-white/25"}`}
                      style={{ width: `${Math.max(2, row.pullRate).toFixed(1)}%` }}
                    />
                  </div>
                  <span
                    className={`w-14 shrink-0 text-right font-numeral text-lg leading-none ${premium ? "text-primary" : "text-white/85"}`}
                  >
                    {row.pullRate.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-6 text-center md:text-left">
          <Link
            href="/odds"
            className="inline-flex items-center gap-1.5 font-condensed text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:text-primary/80"
          >
            See the full odds <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>

      {/* ══════════════════════ FINAL CTA ══════════════════════ */}
      <section className="relative w-full overflow-hidden border-t border-white/[0.06]">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: "radial-gradient(60% 80% at 50% 100%, hsl(42 78% 55% / 0.12) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-28 text-center md:py-36">
          <Reveal>
            <p className="type-eyebrow text-primary">Your card is waiting</p>
            <h2 className="mx-auto mt-5 font-display font-bold uppercase leading-[0.88] tracking-tight text-white text-[clamp(2.4rem,7vw,4.75rem)]">
              Ready to unleash
              <br />
              your <span className="gold-text-static">aura</span>?
            </h2>
            <div className="mt-9 flex justify-center">
              <Button
                onClick={actions.start}
                size="lg"
                className="h-14 px-9 text-base font-black uppercase tracking-[0.06em]"
              >
                <Camera className="mr-1" /> Take Selfie
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
