import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link2, ArrowUpRight } from "lucide-react";
import confetti from "canvas-confetti";

const RARITY_STYLES: Record<string, { color: string; glow: string; bg: string; label: string }> = {
  Core:      { color: "#cbd5e1", glow: "rgba(203,213,225,0.7)",  bg: "rgba(203,213,225,0.12)", label: "CORE" },
  Rising:    { color: "#60a5fa", glow: "rgba(96,165,250,0.8)",   bg: "rgba(96,165,250,0.15)",  label: "RISING" },
  Elite:     { color: "#22d3ee", glow: "rgba(34,211,238,0.8)",   bg: "rgba(34,211,238,0.15)",  label: "ELITE" },
  Icon:      { color: "#c084fc", glow: "rgba(192,132,252,0.8)",  bg: "rgba(192,132,252,0.15)", label: "ICON" },
  Legendary: { color: "#fbbf24", glow: "rgba(251,191,36,0.9)",   bg: "rgba(251,191,36,0.15)",  label: "LEGENDARY" },
  Mythic:    { color: "#fb7185", glow: "rgba(251,113,133,0.95)", bg: "rgba(251,113,133,0.16)", label: "MYTHIC" },
};

const RARITY_ORDER = ["Core", "Rising", "Elite", "Icon", "Legendary", "Mythic"];

// Reveal intensity ladder. 0 = restrained (Core), 3 = spectacular (Legendary/Mythic).
// Legacy tier names map to their modern equivalents.
const TIER_INTENSITY: Record<string, number> = {
  Core: 0, Rising: 1, Elite: 1, Icon: 2, Legendary: 3, Mythic: 3,
  Common: 0, Rare: 1, Epic: 2,
};

function tierDiff(predicted: string | null, actual: string): "upgrade" | "downgrade" | "same" | "none" {
  if (!predicted) return "none";
  if (predicted === actual) return "same";
  const predIdx = RARITY_ORDER.indexOf(predicted);
  const actIdx = RARITY_ORDER.indexOf(actual);
  return actIdx > predIdx ? "upgrade" : "downgrade";
}

function playRevealSound(rarity: string): void {
  try {
    const ctx = new AudioContext();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (rarity === "Mythic") {
      // Multi-layered dramatic rise for Mythic
      const freqs = [220, 330, 440, 660, 880];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq * 0.5, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.4 + i * 0.08);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.12 + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6 + i * 0.1);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + 1.8 + i * 0.1);
      });

      // Impact hit
      const hit = ctx.createOscillator();
      const hitGain = ctx.createGain();
      hit.type = "sawtooth";
      hit.frequency.setValueAtTime(80, ctx.currentTime);
      hit.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      hitGain.gain.setValueAtTime(0.5, ctx.currentTime);
      hitGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      hit.connect(hitGain);
      hitGain.connect(masterGain);
      hit.start(ctx.currentTime);
      hit.stop(ctx.currentTime + 0.4);
    } else if (rarity === "Legendary") {
      // Triumphant ascending chord for Legendary
      const chord = [261.63, 329.63, 392.0, 523.25];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * 0.75, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.25 + i * 0.05);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1 + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + 1.5);
      });
    }
  } catch {
    // Web Audio API may be blocked in some environments - silently skip
  }
}

/** Rising spark field anchored beneath the badge - used for Icon+ tiers. */
function SparkField({ color, count }: { color: string; count: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 53) % 100,
        size: 2 + ((i * 1.7) % 4),
        delay: ((i * 0.29) % 2.4).toFixed(2),
        duration: (2.4 + ((i * 0.6) % 2.2)).toFixed(2),
        opacity: 0.4 + ((i * 0.11) % 0.5),
      })),
    [count],
  );
  return (
    <div className="absolute pointer-events-none overflow-hidden" style={{ width: 360, height: 360 }}>
      {parts.map((p) => (
        <span
          key={p.id}
          className="particle-float absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: 0,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}, 0 0 ${p.size * 4}px ${color}88`,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

interface RarityRevealProps {
  rarity: string;
  predictedRarity: string | null;
  editionNumber: number | null;
  vrfTxSig?: string | null;
  onDismiss: () => void;
}

export function RarityReveal({ rarity, predictedRarity, editionNumber, vrfTxSig, onDismiss }: RarityRevealProps) {
  const style = RARITY_STYLES[rarity] ?? RARITY_STYLES.Core;
  const diff = tierDiff(predictedRarity, rarity);
  // "mismatch" covers any deviation (upgrade OR downgrade) from the predicted tier.
  const isMismatch = diff === "upgrade" || diff === "downgrade";
  const isUpgrade = diff === "upgrade";
  const isHighTier = rarity === "Legendary" || rarity === "Mythic";
  const reduceMotion = useReducedMotion() ?? false;

  const intensity = TIER_INTENSITY[rarity] ?? 0;
  const isEpic = intensity >= 3;
  const showRays = intensity >= 1 && !reduceMotion;
  const showParticles = intensity >= 2 && !reduceMotion;
  const showShockwave = intensity >= 2 && !reduceMotion;

  const soundFired = useRef(false);

  // Epic tiers earn their reveal with a brief charge-up before the payoff.
  const [phase, setPhase] = useState<"charge" | "reveal">(isEpic && !reduceMotion ? "charge" : "reveal");
  const revealed = phase === "reveal";

  useEffect(() => {
    if (phase !== "charge") return undefined;
    const t = setTimeout(() => setPhase("reveal"), 720);
    return () => clearTimeout(t);
  }, [phase]);

  // Sound fires on the payoff beat (after the charge, if any).
  useEffect(() => {
    if (!revealed || soundFired.current || !isHighTier) return undefined;
    soundFired.current = true;
    const t = setTimeout(() => playRevealSound(rarity), reduceMotion ? 0 : 140);
    return () => clearTimeout(t);
  }, [revealed, rarity, isHighTier, reduceMotion]);

  // Confetti fires for any tier mismatch (up or down) as well as high-tier pulls.
  // Skipped entirely under reduced-motion.
  useEffect(() => {
    if (reduceMotion || !revealed) return undefined;
    if (!isMismatch && !isHighTier) return undefined;

    const t = setTimeout(() => {
      const colors = isHighTier
        ? rarity === "Mythic"
          ? ["#fb7185", "#f43f5e", "#ffffff", "#fbbf24"]
          : ["#fbbf24", "#f59e0b", "#ffffff", "#fff7ed"]
        : isUpgrade
          ? ["#c084fc", "#a855f7", "#ffffff"]
          : ["#94a3b8", "#64748b", "#ffffff"]; // downgrade - muted silver burst

      const burst = (origin: { x: number; y: number }) =>
        confetti({
          particleCount: isUpgrade ? 60 : 35,
          spread: 80,
          origin,
          colors,
          startVelocity: 28,
          gravity: 0.9,
          scalar: 0.9,
        });

      burst({ x: 0.3, y: 0.4 });
      burst({ x: 0.7, y: 0.4 });

      if (isUpgrade || isEpic) {
        setTimeout(() => {
          confetti({
            particleCount: isEpic ? 110 : 80,
            spread: isEpic ? 150 : 120,
            origin: { x: 0.5, y: 0.5 },
            colors,
            startVelocity: 35,
            gravity: 0.85,
          });
        }, 400);
      }
    }, 120);

    return () => clearTimeout(t);
  }, [revealed, rarity, isMismatch, isUpgrade, isHighTier, isEpic, reduceMotion]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onDismiss}
    >
      {/* Dark scrim - deeper vignette for epic tiers */}
      <div
        className="absolute inset-0"
        style={{
          background: isEpic
            ? `radial-gradient(ellipse at center, ${style.glow.replace(/[\d.]+\)$/, "0.18)")} 0%, rgba(0,0,0,0.92) 60%)`
            : "rgba(0,0,0,0.85)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Rotating light rays behind the badge (Rising+ tiers) */}
      {showRays && revealed && (
        <motion.div
          className="absolute"
          style={{
            width: 640,
            height: 640,
            background: `repeating-conic-gradient(from 0deg, ${style.color}22 0deg, transparent 7deg 18deg)`,
            maskImage: "radial-gradient(circle, transparent 22%, black 40%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 22%, black 40%, transparent 72%)",
            opacity: intensity >= 3 ? 0.9 : 0.5,
          }}
          initial={{ rotate: 0, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 360, scale: 1, opacity: intensity >= 3 ? 0.9 : 0.5 }}
          transition={{
            rotate: { duration: intensity >= 3 ? 16 : 26, repeat: Infinity, ease: "linear" },
            scale: { duration: 0.8, ease: "easeOut" },
            opacity: { duration: 0.6 },
          }}
        />
      )}

      {/* Charge-up: converging ring that implodes into the reveal (epic only) */}
      <AnimatePresence>
        {isEpic && !revealed && (
          <motion.div
            className="absolute rounded-full"
            style={{ border: `2px solid ${style.color}`, boxShadow: `0 0 40px ${style.glow}` }}
            initial={{ width: 680, height: 680, opacity: 0 }}
            animate={{ width: 168, height: 168, opacity: [0, 0.9, 1] }}
            exit={{ width: 130, height: 130, opacity: 0 }}
            transition={{ duration: 0.72, ease: "easeIn" }}
          />
        )}
      </AnimatePresence>

      {/* Payoff flash for epic tiers */}
      {isEpic && revealed && !reduceMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, #ffffff 0%, ${style.color} 40%, transparent 70%)` }}
          initial={{ opacity: 0.75 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      )}

      {/* Expanding shockwave rings on the payoff beat */}
      {showShockwave && revealed && (
        <>
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{ border: `2px solid ${style.color}` }}
              initial={{ width: 130, height: 130, opacity: 0.65 }}
              animate={{ width: 540, height: 540, opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.05 + i * 0.28, ease: "easeOut" }}
            />
          ))}
        </>
      )}

      {/* Rising spark field (Icon+ tiers) */}
      {showParticles && revealed && (
        <SparkField color={style.color} count={intensity >= 3 ? 26 : 14} />
      )}

      {/* Ambient glow behind badge */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`,
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 1, 0.6], scale: [0.3, 1.4, 1.2] }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Badge - mounts on the payoff beat so epic charge lands cleanly */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="relative flex flex-col items-center gap-3 select-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            {/* Tier ring */}
            <motion.div
              className="relative rounded-full flex items-center justify-center"
              style={{
                width: 160,
                height: 160,
                border: `4px solid ${style.color}`,
                background: style.bg,
                boxShadow: `0 0 48px 16px ${style.glow}, 0 0 96px 32px ${style.glow}44`,
              }}
              animate={{
                boxShadow: [
                  `0 0 48px 16px ${style.glow}, 0 0 96px 32px ${style.glow}44`,
                  `0 0 80px 28px ${style.glow}, 0 0 140px 56px ${style.glow}66`,
                  `0 0 48px 16px ${style.glow}, 0 0 96px 32px ${style.glow}44`,
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Rotating conic accent ring for Icon+ tiers */}
              {intensity >= 2 && !reduceMotion && (
                <motion.span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: -8,
                    background: `conic-gradient(from 0deg, transparent 0deg, ${style.color} 60deg, transparent 120deg)`,
                    maskImage: "radial-gradient(circle, transparent 68%, black 70%, black 74%, transparent 76%)",
                    WebkitMaskImage: "radial-gradient(circle, transparent 68%, black 70%, black 74%, transparent 76%)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: intensity >= 3 ? 3.5 : 6, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span
                className="font-black text-4xl tracking-tight"
                style={{ color: style.color, textShadow: `0 0 20px ${style.glow}` }}
              >
                {style.label.slice(0, 1)}
              </span>
            </motion.div>

            {/* "YOUR RARITY" label */}
            <motion.p
              className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {isUpgrade ? "UPGRADED RARITY" : diff === "downgrade" ? "YOUR TRUE RARITY" : "YOUR RARITY"}
            </motion.p>

            {/* Tier name */}
            <motion.p
              className="font-black text-5xl tracking-wide uppercase"
              style={{ color: style.color, textShadow: `0 0 32px ${style.glow}` }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
            >
              {style.label}
            </motion.p>

            {/* Edition number */}
            {editionNumber != null && (
              <motion.p
                className="text-white/50 text-sm font-semibold tracking-widest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                #{editionNumber.toLocaleString()}
              </motion.p>
            )}

            {/* Mismatch banner - shows for any deviation from the predicted tier */}
            {isMismatch && (
              <motion.div
                className="mt-1 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                style={{ background: style.bg, border: `1px solid ${style.color}55`, color: style.color }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {isUpgrade ? "⬆ Tier Upgrade!" : "⬇ Unexpected Draw"}
              </motion.div>
            )}

            {/* On-chain verification line */}
            {vrfTxSig && (
              <motion.a
                href={`https://explorer.solana.com/tx/${vrfTxSig}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold tracking-[0.08em]"
                style={{ color: style.color, opacity: 0.75 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                transition={{ delay: 0.7 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Link2 className="h-3 w-3" /> Seeded on Solana <ArrowUpRight className="h-3 w-3" />
              </motion.a>
            )}

            {/* Dismiss hint */}
            <motion.p
              className="mt-4 text-white/30 text-xs tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              TAP TO CONTINUE
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
