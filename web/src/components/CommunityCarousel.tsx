import { useState, useEffect } from "react";
import { useListAuraCards } from "@/api";
import type { CommunityCard } from "@/api";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CardDetailModal } from "./CardDetailModal";
import { NATION_FLAGS } from "../lib/nations";
import { rarityColor } from "../lib/rarity";

// Top tiers earn a solid tier-colored frame; the rest a neutral hairline.
const FRAMED_TIERS = new Set(["Legendary", "Mythic", "Icon", "Elite"]);

interface CardTileProps {
  card: CommunityCard;
  onClick: () => void;
}

function CardTile({ card, onClick }: CardTileProps) {
  const cardRarityColor = rarityColor(card.rarity);
  const framed = FRAMED_TIERS.has(card.rarity);
  const flagCode = NATION_FLAGS[card.nation];

  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 w-[72px] rounded-lg overflow-hidden border bg-surface-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 transition-transform duration-100"
      style={{
        aspectRatio: "2/3",
        borderColor: framed ? cardRarityColor : "hsl(var(--card-border))",
        borderWidth: framed ? "1.5px" : "1px",
      }}
      aria-label={`${card.name} - ${card.rarity}`}
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-surface-2" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />

      {/* Rarity tier chip — flat, meaningful color coding */}
      <div
        className="absolute top-1 right-1 px-1 py-px rounded text-[7px] font-black uppercase tracking-[0.06em]"
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
          className="absolute top-1 left-1 w-4 h-auto rounded-sm"
          loading="lazy"
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
        <p className="text-white text-[8px] font-black uppercase tracking-[0.02em] truncate leading-tight">
          {card.name}
        </p>
      </div>
    </button>
  );
}

interface CommunityCarouselProps {
  baseUrl: string;
  /**
   * When false the component force-closes any open CardDetailModal.
   * Pass `active={step === "scanner"}` so the modal is dismissed the moment
   * the AI result arrives and the scanner step exits.
   */
  active?: boolean;
}

export function CommunityCarousel({ baseUrl, active = true }: CommunityCarouselProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { data } = useListAuraCards({ query: { staleTime: 60_000 } } as never);
  const [selectedCard, setSelectedCard] = useState<CommunityCard | null>(null);

  // When the parent marks this carousel inactive (result arrived), close any
  // open card detail modal so the transition to the result screen is clean.
  useEffect(() => {
    if (!active) {
      setSelectedCard(null);
    }
  }, [active]);

  const cards = data?.cards ?? [];

  if (cards.length === 0) return null;

  const loopCards = [...cards, ...cards, ...cards];
  const CARD_W = 72;
  const GAP = 8;
  const singlePassWidth = cards.length * (CARD_W + GAP);
  const durationSec = cards.length * 3.5;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full mt-auto pt-6 pb-2"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="h-3 w-1 bg-primary rounded-full" aria-hidden />
            <p className="type-eyebrow text-[0.62rem] text-muted-foreground">
              Community Cards
            </p>
          </div>

          {/* Marquee container */}
          <div className="relative overflow-hidden w-full">
            {/* Left + right fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <style>{`
              @keyframes aura-marquee {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-${singlePassWidth}px); }
              }
            `}</style>

            <div
              className="flex"
              style={{
                gap: `${GAP}px`,
                animation: reduceMotion ? undefined : `aura-marquee ${durationSec}s linear infinite`,
                width: `${loopCards.length * (CARD_W + GAP)}px`,
              }}
            >
              {loopCards.map((card, i) => (
                <CardTile
                  key={`${card.slug}-${i}`}
                  card={card}
                  onClick={() => setSelectedCard(card)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          baseUrl={baseUrl}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
