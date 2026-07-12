import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getRarityStyle } from "@/lib/rarity";

interface OddsTier {
  tier: string;
  quota: number;
  issued: number;
  remaining: number;
  pullRate: number;
}

interface CollectionOddsModalProps {
  open: boolean;
  onClose: () => void;
  /** Live rarity stats from the API; falls back to the seeded quota table. */
  stats?: { totalIssued?: number; tiers?: OddsTier[] } | null;
}

const DEFAULT_TIERS: OddsTier[] = [
  { tier: "Core",      quota: 55000, issued: 0, remaining: 55000, pullRate: 55.0 },
  { tier: "Rising",    quota: 25000, issued: 0, remaining: 25000, pullRate: 25.0 },
  { tier: "Elite",     quota: 12000, issued: 0, remaining: 12000, pullRate: 12.0 },
  { tier: "Icon",      quota: 5500,  issued: 0, remaining: 5500,  pullRate: 5.5  },
  { tier: "Legendary", quota: 2000,  issued: 0, remaining: 2000,  pullRate: 2.0  },
  { tier: "Mythic",    quota: 500,   issued: 0, remaining: 500,   pullRate: 0.5  },
];

/** The "Collection Odds" / pull-rate panel. */
export function CollectionOddsModal({ open, onClose, stats }: CollectionOddsModalProps) {
  const tiers = stats?.tiers ?? DEFAULT_TIERS;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="rarity-odds-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
            className="w-full max-w-md surface-flat overflow-hidden rounded-t-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pt-6 pb-5">
              <div>
                <div className="type-eyebrow text-[0.66rem] text-primary">2026 Edition · Pull Rates</div>
                <h2 className="mt-1.5 font-display text-2xl font-black uppercase leading-none tracking-tight text-white">
                  Collection Odds
                </h2>
                <p className="mt-2 font-condensed text-xs font-medium uppercase tracking-wide text-white/45">
                  {(stats?.totalIssued ?? 0).toLocaleString()} of 100,000 claimed
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-white transition-colors hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Pull-rate table */}
            <div className="divide-y divide-white/[0.06] px-6">
              {tiers.map((row) => {
                const style = getRarityStyle(row.tier);
                const pct = Math.min(100, (row.issued / row.quota) * 100);
                return (
                  <div key={row.tier} className="flex items-center gap-3 py-3">
                    <span
                      className="w-[86px] shrink-0 rounded-md py-1 text-center font-condensed text-xs font-bold uppercase tracking-wide"
                      style={{ background: style.color, color: "#0a0a0f" }}
                    >
                      {row.tier}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${pct.toFixed(1)}%`, background: style.color }} />
                      </div>
                      <div className="mt-1 flex justify-between font-condensed text-[10px] uppercase tracking-wide text-white/35">
                        <span>{row.issued.toLocaleString()} claimed</span>
                        <span>{row.remaining.toLocaleString()} left</span>
                      </div>
                    </div>
                    <span className="w-14 shrink-0 text-right font-condensed text-lg font-bold leading-none" style={{ color: style.color }}>
                      {row.pullRate.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Edition note + dismiss */}
            <div className="px-6 pb-6 pt-4">
              <p className="text-xs leading-relaxed text-white/45">
                Every card is numbered 1–100,000 and permanently minted to the 2026 Edition — the founding drop. Rarer tier, fewer cards.
              </p>
              <button
                onClick={onClose}
                className="mt-5 h-11 w-full rounded-xl bg-surface-2 font-condensed text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-surface-3"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
