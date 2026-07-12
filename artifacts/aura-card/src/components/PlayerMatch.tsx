import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
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

interface PlayerMatchProps {
  card: MatchInput;
}

/**
 * "You play like" panel for the result screen. Matches the user's card to the
 * football player they most resemble and explains why. The player photo falls
 * back to a flag + initials monogram when no image is available.
 */
export function PlayerMatch({ card }: PlayerMatchProps) {
  const match = useMemo(() => matchPlayer(card), [card]);
  const [imgFailed, setImgFailed] = useState(false);

  const { player, score, reasons } = match;
  const flagCode = NATION_FLAGS[player.nation];
  const showPhoto = Boolean(player.photoUrl) && !imgFailed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="w-full rounded-xl surface-card border-primary/25 p-4 space-y-3"
      data-testid="player-match"
    >
      <div className="flex items-center gap-1.5 type-eyebrow text-[0.68rem] text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        You play like
      </div>

      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40 bg-black/50 flex items-center justify-center">
            {showPhoto ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="text-lg font-black text-primary/90">
                {initials(player.name)}
              </span>
            )}
          </div>
          {flagCode && (
            <img
              src={`https://flagcdn.com/w40/${flagCode}.png`}
              alt={player.nation}
              className="absolute -bottom-1 -right-1 w-6 h-4 rounded-sm border border-black/60 object-cover"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-display font-black text-white truncate">
            {player.name}
          </p>
          <p className="text-xs text-gray-400">
            {POSITION_LABEL[player.position] ?? player.position} · {player.nation}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-2xl font-display font-black text-primary leading-none">
            {score}%
          </p>
          <p className="text-[9px] uppercase tracking-wider text-gray-500">match</p>
        </div>
      </div>

      <ul className="space-y-1">
        {reasons.map((reason, i) => (
          <li
            key={i}
            className="text-[12px] text-gray-300 leading-snug flex gap-1"
          >
            <ChevronRight className="mt-px h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
