import { useState } from "react";
import { useListAuraCards } from "@workspace/api-client-react";
import type { CommunityCard } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Loader2, Users, Layers, ThumbsUp, MessageSquare } from "lucide-react";
import { CardDetailModal } from "./CardDetailModal";
import { NATION_FLAGS } from "../lib/nations";
import { rarityColor } from "../lib/rarity";

const LEGENDARY_GLOW = "0 0 20px rgba(251,191,36,0.7), 0 0 40px rgba(251,191,36,0.35)";
const MYTHIC_GLOW = "0 0 20px rgba(251,113,133,0.75), 0 0 45px rgba(251,113,133,0.4)";

const TOTAL_EDITION_SIZE = 100_000;

function CardSkeleton() {
  return (
    <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
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

  return (
    <section className="w-full max-w-xl mx-auto px-4 pb-16">
      {/* Header with live counter */}
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-black uppercase tracking-widest text-primary">
          Community Cards
        </h2>
        {!isLoading && cards.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            {cards.length} recent
          </span>
        )}
      </div>

      {/* Edition counter banner */}
      {totalIssued > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-black/40 border border-white/10">
          <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[11px] font-bold text-white/70">
            <span className="text-primary font-black">{totalIssued.toLocaleString()}</span>
            {" "}of{" "}
            <span className="text-white font-black">{TOTAL_EDITION_SIZE.toLocaleString()}</span>
            {" "}cards claimed
          </span>
          <div className="ml-auto h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              style={{ width: `${Math.min(100, (totalIssued / TOTAL_EDITION_SIZE) * 100).toFixed(2)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
            {remaining.toLocaleString()} left
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
          <Loader2 className="h-6 w-6 mb-2 opacity-40" />
          <p className="text-xs font-bold uppercase tracking-widest">
            Be the first to generate a card!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {cards.map((card, i) => {
            const cardRarityColor = rarityColor(card.rarity);
            const isLegendary = card.rarity === "Legendary";
            const isMythic = card.rarity === "Mythic";
            const flagCode = NATION_FLAGS[card.nation];
            const hasActivity = card.voteScore !== 0 || card.commentCount > 0;

            let boxShadow = `0 0 12px ${cardRarityColor}22`;
            if (isLegendary) boxShadow = LEGENDARY_GLOW;
            if (isMythic) boxShadow = MYTHIC_GLOW;

            return (
              <motion.button
                key={card.slug}
                onClick={() => setSelectedCard(card)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.3 }}
                className="group relative flex flex-col rounded-xl overflow-hidden border bg-black/40 hover:scale-[1.03] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left"
                style={{
                  borderColor: (isLegendary || isMythic) ? cardRarityColor : "rgba(255,255,255,0.1)",
                  boxShadow,
                }}
                aria-label={`${card.name} - ${card.rarity} ${card.archetype}`}
              >
                <div className="aspect-[2/3] relative overflow-hidden">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, #0a0a0f 0%, ${cardRarityColor}33 100%)` }}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        {card.archetype}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  {/* Mythic/Legendary animated border shimmer */}
                  {(isLegendary || isMythic) && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, transparent 40%, ${cardRarityColor}33 50%, transparent 60%)`,
                        backgroundSize: "200% 200%",
                      }}
                      animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  )}

                  <div
                    className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border"
                    style={{
                      color: cardRarityColor,
                      borderColor: `${cardRarityColor}66`,
                      backgroundColor: `${cardRarityColor}22`,
                    }}
                  >
                    {card.rarity}
                  </div>

                  {flagCode && (
                    <img
                      src={`https://flagcdn.com/w20/${flagCode}.png`}
                      alt={card.nation}
                      className="absolute top-1.5 left-1.5 w-5 h-auto rounded-sm opacity-90"
                      loading="lazy"
                    />
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-white text-[9px] font-black uppercase tracking-wide truncate leading-tight">
                      {card.name}
                    </p>
                    {card.editionNumber != null && (
                      <p className="text-[8px] font-mono text-gray-400 truncate">
                        #{card.editionNumber.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Activity badges */}
                {hasActivity && (
                  <div className="flex items-center gap-1.5 px-1.5 py-1 bg-black/60">
                    {card.voteScore !== 0 && (
                      <span
                        className={`flex items-center gap-0.5 text-[8px] font-black ${
                          card.voteScore > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        <ThumbsUp className="h-2.5 w-2.5" />
                        {card.voteScore > 0 ? `+${card.voteScore}` : card.voteScore}
                      </span>
                    )}
                    {card.commentCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[8px] font-black text-gray-400">
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
