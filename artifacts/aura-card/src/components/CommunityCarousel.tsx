import { useState, useEffect } from "react";
import { useListAuraCards } from "@workspace/api-client-react";
import type { CommunityCard } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { CardDetailModal } from "./CardDetailModal";
import { NATION_FLAGS } from "../lib/nations";
import { rarityColor } from "../lib/rarity";

const LEGENDARY_GLOW = "0 0 16px rgba(251,191,36,0.65), 0 0 32px rgba(251,191,36,0.3)";
const MYTHIC_GLOW = "0 0 16px rgba(251,113,133,0.7), 0 0 32px rgba(251,113,133,0.35)";

interface CardTileProps {
  card: CommunityCard;
  onClick: () => void;
}

function CardTile({ card, onClick }: CardTileProps) {
  const cardRarityColor = rarityColor(card.rarity);
  const isLegendary = card.rarity === "Legendary";
  const isMythic = card.rarity === "Mythic";
  const flagCode = NATION_FLAGS[card.nation];

  let boxShadow = `0 0 10px ${cardRarityColor}22`;
  if (isLegendary) boxShadow = LEGENDARY_GLOW;
  if (isMythic) boxShadow = MYTHIC_GLOW;

  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 w-[72px] rounded-lg overflow-hidden border bg-black/40 cursor-pointer focus:outline-none active:scale-95 transition-transform duration-100"
      style={{
        aspectRatio: "2/3",
        borderColor: (isLegendary || isMythic) ? cardRarityColor : "rgba(255,255,255,0.12)",
        boxShadow,
      }}
      aria-label={`${card.name} — ${card.rarity}`}
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, #0a0a0f 0%, ${cardRarityColor}33 100%)` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Rarity glow shimmer for Legendary/Mythic */}
      {(isLegendary || isMythic) && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 40%, ${cardRarityColor}44 50%, transparent 60%)`,
            backgroundSize: "200% 200%",
          }}
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Rarity badge */}
      <div
        className="absolute top-1 right-1 px-1 py-px rounded text-[7px] font-black uppercase tracking-wider border"
        style={{
          color: cardRarityColor,
          borderColor: `${cardRarityColor}55`,
          backgroundColor: `${cardRarityColor}22`,
        }}
      >
        {card.rarity}
      </div>

      {flagCode && (
        <img
          src={`https://flagcdn.com/w20/${flagCode}.png`}
          alt={card.nation}
          className="absolute top-1 left-1 w-4 h-auto rounded-sm opacity-90"
          loading="lazy"
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
        <p className="text-white text-[8px] font-black uppercase tracking-wide truncate leading-tight">
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
          <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-primary/50 mb-2.5">
            Community Cards
          </p>

          {/* Marquee container */}
          <div className="relative overflow-hidden w-full">
            {/* Left + right fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

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
                animation: `aura-marquee ${durationSec}s linear infinite`,
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
