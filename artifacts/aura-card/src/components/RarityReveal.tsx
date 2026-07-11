import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const soundFired = useRef(false);

  useEffect(() => {
    if (!soundFired.current && isHighTier) {
      soundFired.current = true;
      const t = setTimeout(() => playRevealSound(rarity), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [rarity, isHighTier]);

  // Extra drama fires for any tier mismatch (up or down) as well as high-tier pulls.
  useEffect(() => {
    if (!isMismatch && !isHighTier) return;

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

      if (isUpgrade) {
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 120,
            origin: { x: 0.5, y: 0.5 },
            colors,
            startVelocity: 35,
            gravity: 0.85,
          });
        }, 400);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [rarity, isMismatch, isUpgrade, isHighTier]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onDismiss}
    >
      {/* Dark scrim */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

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

      {/* Badge */}
      <motion.div
        className="relative flex flex-col items-center gap-3 select-none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.1 }}
      >
        {/* Tier ring */}
        <motion.div
          className="rounded-full flex items-center justify-center"
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
          transition={{ delay: 0.35 }}
        >
          {isUpgrade ? "UPGRADED RARITY" : diff === "downgrade" ? "YOUR TRUE RARITY" : "YOUR RARITY"}
        </motion.p>

        {/* Tier name */}
        <motion.p
          className="font-black text-5xl tracking-wide uppercase"
          style={{ color: style.color, textShadow: `0 0 32px ${style.glow}` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.25 }}
        >
          {style.label}
        </motion.p>

        {/* Edition number */}
        {editionNumber != null && (
          <motion.p
            className="text-white/50 text-sm font-semibold tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
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
            transition={{ delay: 0.6 }}
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
            className="flex items-center gap-1 text-[10px] font-bold tracking-wider"
            style={{ color: style.color, opacity: 0.75 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ delay: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            ⛓ Seeded on Solana ↗
          </motion.a>
        )}

        {/* Dismiss hint */}
        <motion.p
          className="mt-4 text-white/30 text-xs tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          TAP TO CONTINUE
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
