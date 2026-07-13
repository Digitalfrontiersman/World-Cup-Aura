import { Link } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useGetRarityStats } from "@/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

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

// /odds — the collection pull-rate breakdown, as a real page in the app's aesthetic.
export default function Odds() {
  const rarityStatsQuery = useGetRarityStats({ query: { staleTime: 60_000 } } as never);
  const stats = rarityStatsQuery.data as { totalIssued?: number; tiers?: OddsTier[] } | undefined;
  const tiers = stats?.tiers ?? DEFAULT_TIERS;
  const totalIssued = stats?.totalIssued ?? 0;
  const claimedPct = Math.min(100, (totalIssued / 100000) * 100);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* Near-black base with a soft warm spotlight, matching the landing */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, #0d0d16 0%, #08080e 52%, #050509 100%)" }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(55% 40% at 50% 18%, hsl(42 78% 55% / 0.10) 0%, transparent 68%)" }}
      />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-2xl px-5 pt-28 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to cards
        </Link>

        {/* Header */}
        <header className="mt-8">
          <span className="type-eyebrow text-primary">2026 Edition · Pull Rates</span>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,4.25rem)] font-bold uppercase leading-[0.9] tracking-tight text-white">
            Collection <span className="gold-text-static">odds</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Every Aura Card is numbered 1–100,000 and minted to the founding 2026 Edition. Rarer tier, fewer cards. Here's
            how the drop breaks down.
          </p>

          {/* Overall claimed meter */}
          <div className="mt-6 surface-card rounded-2xl p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="label-stat text-muted-foreground">Claimed so far</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-numeral text-3xl leading-none text-white">{totalIssued.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">/ 100,000</span>
                </div>
              </div>
              <span className="font-numeral text-2xl leading-none text-primary">{claimedPct.toFixed(1)}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(1, claimedPct).toFixed(1)}%` }} />
            </div>
          </div>
        </header>

        {/* Pull-rate table */}
        <div className="mt-8 surface-card overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
            <span className="label-stat text-muted-foreground">Tier</span>
            <span className="label-stat text-muted-foreground">Pull rate</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {tiers.map((row) => {
              const pct = Math.min(100, (row.issued / row.quota) * 100);
              // Only the two rarest tiers carry the gold accent — everything else
              // stays monochrome so the page reads as one cohesive palette.
              const premium = row.tier === "Legendary" || row.tier === "Mythic";
              return (
                <div key={row.tier} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex w-28 shrink-0 items-center gap-2 font-condensed text-sm font-semibold uppercase tracking-wide text-white">
                    {premium && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    {row.tier}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${premium ? "bg-primary" : "bg-white/25"}`}
                        style={{ width: `${Math.max(0.5, pct).toFixed(1)}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between font-condensed text-[10px] uppercase tracking-wide text-white/30">
                      <span>{row.issued.toLocaleString()} claimed</span>
                      <span>{row.remaining.toLocaleString()} left</span>
                    </div>
                  </div>
                  <span className={`w-16 shrink-0 text-right font-numeral text-xl leading-none ${premium ? "text-primary" : "text-white/85"}`}>
                    {row.pullRate.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">Ready to roll your tier?</p>
          <Link href="/">
            <Button className="h-12 px-7 text-base font-bold uppercase tracking-[0.06em]">
              <Sparkles className="mr-2 h-4 w-4" /> Create your Aura Card
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
