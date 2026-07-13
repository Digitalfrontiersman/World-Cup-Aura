import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Crown, ChevronRight } from "lucide-react";
import { NATION_FLAGS } from "../lib/nations";
import { matchPlayer, type MatchInput } from "../lib/playerMatch";

const POSITION_LABEL: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface AuraCardBackProps {
  /** The card, including `rarity` so GOAT/star mirrors are gated. */
  card: MatchInput;
  /** Rarity tier used for border/glow styling to mirror the front face. */
  rarity: string;
}

/**
 * The back of the Aura Card, revealed on flip: the football player the user most
 * resembles ("You mirror"). GOAT/star mirrors get an ultra-rare ribbon. Sized to
 * fill its flip container (w-full h-full).
 */
export function AuraCardBack({ card, rarity }: AuraCardBackProps) {
  const match = useMemo(() => matchPlayer(card), [card]);
  const [imgFailed, setImgFailed] = useState(false);

  const { player, score, reasons } = match;
  const flagCode = NATION_FLAGS[player.nation];
  const showPhoto = Boolean(player.photoUrl) && !imgFailed;
  const eliteLabel =
    player.eliteTier === "goat" ? "GOAT-tier mirror" : player.eliteTier === "star" ? "Superstar mirror" : null;

  return (
    <div
      className={`w-full h-full relative rounded-2xl overflow-hidden glass-panel border-[3px] rarity-glow-${rarity} rarity-border-${rarity} flex flex-col`}
      style={{ background: "linear-gradient(160deg, #12100A 0%, #060505 100%)" }}
      data-testid="aura-card-back"
    >
      {/* subtle carbon texture, matching the front */}
      <div className="absolute inset-0 opacity-[0.12] bg-[url('/carbon-fibre.png')] mix-blend-overlay z-0" />

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 type-eyebrow text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          You mirror
        </div>
        <div className="type-eyebrow text-white/40 text-[0.62rem]">Resemblance</div>
      </div>

      {/* Elite ribbon */}
      {eliteLabel && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative z-10 mx-4 mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary"
        >
          <Crown className="h-3.5 w-3.5" />
          {eliteLabel}
        </motion.div>
      )}

      {/* Player identity */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-4 text-center">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/40 bg-black/50 flex items-center justify-center shadow-xl">
            {showPhoto ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="h-full w-full object-cover object-top"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="text-3xl font-display font-black text-primary/90">
                {initials(player.name)}
              </span>
            )}
          </div>
          {flagCode && (
            <img
              src={`https://flagcdn.com/w40/${flagCode}.png`}
              alt={player.nation}
              className="absolute -bottom-1 -right-1 h-5 w-7 rounded-sm border border-black/60 object-cover"
            />
          )}
        </div>

        <h3 className="mt-3 text-2xl font-condensed font-bold uppercase leading-tight tracking-wide text-white line-clamp-2">
          {player.name}
        </h3>
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
          {POSITION_LABEL[player.position] ?? player.position} · {player.nation}
        </p>

        {/* Match meter */}
        <div className="mt-3 w-full max-w-[220px]">
          <div className="flex items-end justify-center gap-1">
            <span className="font-condensed text-4xl font-bold leading-none text-primary">{score}</span>
            <span className="mb-1 text-sm font-black text-primary">%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/40">resemblance match</p>
        </div>
      </div>

      {/* Reasons */}
      <div className="relative z-10 mt-auto px-4 pb-4 pt-3">
        <ul className="space-y-1 rounded-xl border border-white/10 bg-black/40 p-3">
          {reasons.slice(0, 3).map((reason, i) => (
            <li key={i} className="flex gap-1 text-[11px] leading-snug text-gray-300">
              <ChevronRight className="mt-px h-3 w-3 shrink-0 text-primary/70" />
              <span className="line-clamp-2">{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
