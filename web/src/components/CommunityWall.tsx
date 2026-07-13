import { useState } from "react";
import { useListAuraCards } from "@/api";
import type { CommunityCard } from "@/api";
import { motion } from "framer-motion";
import { Loader2, ThumbsUp, MessageSquare } from "lucide-react";
import { CardDetailModal } from "./CardDetailModal";
import { NATION_FLAGS } from "../lib/nations";
import { rarityColor } from "../lib/rarity";

const TOTAL_EDITION_SIZE = 100_000;

// Top tiers earn a solid tier-colored frame; everyone else gets a neutral
// hairline so the grid reads like a clean sticker sheet, not a glowing soup.
const FRAMED_TIERS = new Set(["Legendary", "Mythic", "Icon", "Elite"]);

function CardSkeleton() {
  return (
    <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
  );
}

interface CommunityWallProps {
  baseUrl: string;
}

export function CommunityWall({ baseUrl }: CommunityWallProps) {
  const { data, isLoading } = useListAuraCards({
    query: { refetchInterval: 30_000 } as never,
  });

  const [selectedCard, setSelectedCard] = useState<CommunityCard | null>(null);

  const cards = data?.cards ?? [];
  const totalIssued = data?.totalIssued ?? 0;
  const remaining = Math.max(0, TOTAL_EDITION_SIZE - totalIssued);
  const claimedPct = Math.min(100, (totalIssued / TOTAL_EDITION_SIZE) * 100);

  return (
    <section className="w-full max-w-xl mx-auto px-4 pb-16">
      {/* Section header — solid gold rule + label, no glow */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="h-4 w-1 bg-primary rounded-full" aria-hidden />
        <h2 className="type-eyebrow text-foreground">Community Cards</h2>
        {!isLoading && cards.length > 0 && (
          <span className="ml-auto text-[11px] font-semibold text-muted-foreground tabular-nums">
            {cards.length} recent
          </span>
        )}
      </div>

      {/* Edition counter — flat panel, single accent, no gradient wash */}
      {totalIssued > 0 && (
        <div className="mb-5 px-3.5 py-3 rounded-xl surface-card">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-semibold text-foreground/80">
              <span className="text-foreground font-black tabular-nums">{totalIssued.toLocaleString()}</span>
              <span className="text-muted-foreground"> / {TOTAL_EDITION_SIZE.toLocaleString()} claimed</span>
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
              {remaining.toLocaleString()} left
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${claimedPct.toFixed(2)}%` }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 mb-2 opacity-40" />
          <p className="type-eyebrow">
            Be the first to generate a card
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {cards.map((card, i) => {
            const cardRarityColor = rarityColor(card.rarity);
            const framed = FRAMED_TIERS.has(card.rarity);
            const flagCode = NATION_FLAGS[card.nation];
            const hasActivity = card.voteScore !== 0 || card.commentCount > 0;

            return (
              <motion.button
                key={card.slug}
                onClick={() => setSelectedCard(card)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.3 }}
                className="group relative flex flex-col rounded-lg overflow-hidden border bg-surface-1 hover:-translate-y-0.5 transition-transform duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background text-left"
                style={{
                  borderColor: framed ? cardRarityColor : "hsl(var(--card-border))",
                  borderWidth: framed ? "1.5px" : "1px",
                }}
                aria-label={`${card.name} - ${card.rarity} ${card.archetype}`}
              >
                <div className="aspect-[2/3] relative overflow-hidden">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover object-top group-hover:scale-[1.04] transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center bg-surface-2"
                    >
                      <span className="type-eyebrow text-[0.6rem] text-white/40">
                        {card.archetype}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />

                  {/* Rarity tier chip — meaningful color coding, flat */}
                  <div
                    className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.08em]"
                    style={{
                      color: "#0a0a0f",
                      backgroundColor: cardRarityColor,
                    }}
                  >
                    {card.rarity}
                  </div>

                  {flagCode && (
                    <img
                      src={`https://flagcdn.com/w20/${flagCode}.png`}
                      alt={card.nation}
                      className="absolute top-1.5 left-1.5 w-5 h-auto rounded-sm"
                      loading="lazy"
                    />
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-white text-[10px] font-black uppercase tracking-[0.02em] truncate leading-tight">
                      {card.name}
                    </p>
                    {card.editionNumber != null && (
                      <p className="text-[8px] font-mono text-white/50 truncate">
                        #{card.editionNumber.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Activity strip */}
                {hasActivity && (
                  <div className="flex items-center gap-2 px-1.5 py-1 border-t border-card-border bg-surface-2">
                    {card.voteScore !== 0 && (
                      <span
                        className={`flex items-center gap-0.5 text-[9px] font-black tabular-nums ${
                          card.voteScore > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        <ThumbsUp className="h-2.5 w-2.5" />
                        {card.voteScore > 0 ? `+${card.voteScore}` : card.voteScore}
                      </span>
                    )}
                    {card.commentCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] font-black tabular-nums text-muted-foreground">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {card.commentCount}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Card detail modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          baseUrl={baseUrl}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </section>
  );
}
