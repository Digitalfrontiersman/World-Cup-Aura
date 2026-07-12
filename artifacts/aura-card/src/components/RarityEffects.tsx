import { useMemo, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { rarityColor } from "../lib/rarity";

export type RarityTier = "Core" | "Rising" | "Elite" | "Icon" | "Legendary" | "Mythic";

export interface RarityEffect {
  glowColor: string | null;
  glowShadow: string;
  particles: number;
  flames: boolean;
  halo: boolean;
  shimmerDuration: string;
  shimmerOpacity: number;
  borderPulse: boolean;
  holoFoil: boolean;
}

export const RARITY_EFFECTS: Record<string, RarityEffect> = {
  Core: {
    glowColor: null,
    glowShadow: "none",
    particles: 0,
    flames: false,
    halo: false,
    shimmerDuration: "0s",
    shimmerOpacity: 0,
    borderPulse: false,
    holoFoil: false,
  },
  Rising: {
    glowColor: "#60a5fa",
    glowShadow: "0 0 30px rgba(96,165,250,0.35), 0 20px 50px rgba(0,0,0,0.8)",
    particles: 0,
    flames: false,
    halo: false,
    shimmerDuration: "9s",
    shimmerOpacity: 0.3,
    borderPulse: false,
    holoFoil: false,
  },
  Elite: {
    glowColor: "#22d3ee",
    glowShadow: "0 0 35px rgba(34,211,238,0.5), 0 20px 50px rgba(0,0,0,0.8)",
    particles: 0,
    flames: false,
    halo: false,
    shimmerDuration: "5s",
    shimmerOpacity: 0.5,
    borderPulse: true,
    holoFoil: false,
  },
  Icon: {
    glowColor: "#c084fc",
    glowShadow: "0 0 40px rgba(192,132,252,0.55), 0 20px 50px rgba(0,0,0,0.8)",
    particles: 14,
    flames: false,
    halo: false,
    shimmerDuration: "4s",
    shimmerOpacity: 0.6,
    borderPulse: false,
    holoFoil: true,
  },
  Legendary: {
    glowColor: "#fbbf24",
    glowShadow: "0 0 55px rgba(251,191,36,0.6), 0 20px 50px rgba(0,0,0,0.8)",
    particles: 22,
    flames: true,
    halo: false,
    shimmerDuration: "3s",
    shimmerOpacity: 0.7,
    borderPulse: false,
    holoFoil: true,
  },
  Mythic: {
    glowColor: "#fb7185",
    glowShadow: "0 0 70px rgba(251,113,133,0.7), 0 20px 50px rgba(0,0,0,0.8)",
    particles: 36,
    flames: true,
    halo: true,
    shimmerDuration: "2s",
    shimmerOpacity: 0.85,
    borderPulse: false,
    holoFoil: true,
  },
  // Legacy compat
  Common: {
    glowColor: null,
    glowShadow: "none",
    particles: 0,
    flames: false,
    halo: false,
    shimmerDuration: "0s",
    shimmerOpacity: 0,
    borderPulse: false,
    holoFoil: false,
  },
  Rare: {
    glowColor: "#60a5fa",
    glowShadow: "0 0 30px rgba(96,165,250,0.35), 0 20px 50px rgba(0,0,0,0.8)",
    particles: 0,
    flames: false,
    halo: false,
    shimmerDuration: "9s",
    shimmerOpacity: 0.3,
    borderPulse: false,
    holoFoil: false,
  },
  Epic: {
    glowColor: "#c084fc",
    glowShadow: "0 0 40px rgba(192,132,252,0.55), 0 20px 50px rgba(0,0,0,0.8)",
    particles: 14,
    flames: false,
    halo: false,
    shimmerDuration: "4s",
    shimmerOpacity: 0.6,
    borderPulse: false,
    holoFoil: true,
  },
};

export function getRarityEffect(rarity: string): RarityEffect {
  return RARITY_EFFECTS[rarity] ?? RARITY_EFFECTS.Core;
}

// Deterministic particle layout so values don't jump on re-render
function buildParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 4 + ((i * 97) % 92),
    delay: ((i * 0.37) % 3).toFixed(2),
    duration: (2 + ((i * 0.71) % 2)).toFixed(2),
    size: 2 + ((i * 1.5) % 4),
    opacity: 0.5 + ((i * 0.13) % 0.5),
  }));
}

interface ParticleSparksProps {
  count: number;
  color: string;
}

export function ParticleSparks({ count, color }: ParticleSparksProps) {
  const particles = useMemo(() => buildParticles(count), [count]);

  if (count === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-[5]">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle-float absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "0%",
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

interface HaloRingProps {
  color: string;
}

export function HaloRing({ color }: HaloRingProps) {
  const hex = color.replace("#", "");
  const filterId = `halo-glow-${hex}`;

  return (
    <div className="absolute inset-0 pointer-events-none halo-spin" style={{ zIndex: -1 }}>
      <svg
        viewBox="0 0 300 450"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer halo ring */}
        <ellipse
          cx="150"
          cy="225"
          rx="158"
          ry="50"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray="14 7"
          opacity="0.75"
          filter={`url(#${filterId})`}
        />
        {/* Inner halo ring */}
        <ellipse
          cx="150"
          cy="225"
          rx="148"
          ry="40"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="6 10"
          opacity="0.4"
          filter={`url(#${filterId})`}
        />
      </svg>
    </div>
  );
}

// Total reveal duration in ms - tied to the keyframe times below
const REVEAL_DURATION_MS = 1900;

interface RarityRevealOverlayProps {
  rarity: string;
  onComplete: () => void;
}

/**
 * Full-screen overlay that plays once on fresh card generation.
 * Sequence (1.9 s total):
 *   0 ms     - backdrop fades in, burst lines fire
 *  200 ms    - tier name scales up from small at centre (card is still flipping)
 *  700 ms    - tier name at full size, holds
 * 1100 ms    - badge on card pulses (handled externally via badgePulseAt prop)
 * 1100 ms    - tier name starts "settling": shrinks + translates toward the
 *              top-right corner of the viewport (where the badge lives on card)
 * 1700 ms    - backdrop fades out
 * 1900 ms    - onComplete() called, overlay unmounts
 */
export function RarityRevealOverlay({ rarity, onComplete }: RarityRevealOverlayProps) {
  const color = rarityColor(rarity);
  const effect = getRarityEffect(rarity);
  const reduceMotion = useReducedMotion() ?? false;

  // Call onComplete after the full animation duration
  useEffect(() => {
    const timer = setTimeout(onComplete, REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Under reduced-motion: a calm centred fade with no scale-pop or fly-to-corner.
  const reducedTierNameVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: [0, 1, 1, 0] as number[],
      transition: {
        duration: REVEAL_DURATION_MS / 1000,
        times: [0, 0.15, 0.8, 1],
        ease: "easeInOut" as const,
      },
    },
  };

  // Backdrop: fade-in then fade-out
  const backdropVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: [0, 1, 1, 0] as number[],
      transition: {
        duration: REVEAL_DURATION_MS / 1000,
        times: [0, 0.1, 0.85, 1],
        ease: "easeInOut" as const,
      },
    },
  };

  // Tier name: centre pop-in → hold → shrink+fly to top-right badge position
  // x=+42vw, y=-38vh roughly maps to the badge at top-right of the card
  const tierNameVariants = {
    initial: { scale: 0.25, opacity: 0, x: 0, y: 30 },
    animate: {
      scale:   [0.25,  1.18,  1.0,   0.10] as number[],
      opacity: [0,     1,     1,     0   ] as number[],
      x:       [0,     0,     0,     "42vw"] as (number | string)[],
      y:       [30,    0,     0,     "-37vh"] as (number | string)[],
      transition: {
        duration: (REVEAL_DURATION_MS - 100) / 1000,
        times: [0, 0.18, 0.55, 1],
        ease: "easeInOut" as const,
        delay: 0.1,
      },
    },
  };

  // Burst lines: quick flash then gone
  const burstVariants = {
    initial: { opacity: 0, scale: 0.6 },
    animate: {
      opacity: [0, 0.7, 0] as number[],
      scale:   [0.6, 1.1, 1.4] as number[],
      transition: { duration: 0.7, delay: 0.15, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      variants={backdropVariants}
      initial="initial"
      animate="animate"
    >
      {/* Radial glow backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: effect.glowColor
            ? `radial-gradient(ellipse at center, ${effect.glowColor}28 0%, #000000ee 55%)`
            : "rgba(0,0,0,0.92)",
        }}
      />

      {/* Burst lines radiating from centre */}
      {effect.glowColor && !reduceMotion && (
        <motion.div
          className="absolute inset-0"
          variants={burstVariants}
          initial="initial"
          animate="animate"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="absolute origin-left"
              style={{
                width: "40vw",
                height: "1.5px",
                left: "50%",
                top: "50%",
                marginTop: "-0.75px",
                background: `linear-gradient(to right, ${color}cc, transparent)`,
                transform: `rotate(${i * 36}deg)`,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Tier name - big centre reveal → settles to top-right badge location */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-2 select-none"
        variants={reduceMotion ? reducedTierNameVariants : tierNameVariants}
        initial="initial"
        animate="animate"
      >
        <p
          className="text-[0.6em] font-black uppercase tracking-[0.4em] opacity-70"
          style={{ color, fontSize: "clamp(0.55rem, 1.5vw, 0.85rem)" }}
        >
          Rarity Revealed
        </p>
        <h2
          className="font-black uppercase leading-none"
          style={{
            color,
            fontSize: "clamp(3rem, 10vw, 5.5rem)",
            letterSpacing: "0.12em",
            textShadow: effect.glowColor
              ? `0 0 40px ${effect.glowColor}, 0 0 80px ${effect.glowColor}66`
              : undefined,
          }}
        >
          {rarity}
        </h2>
        {/* Mini badge shape - matches the card badge so the "landing" looks intentional */}
        <div
          className="px-3 py-1 rounded border-2 text-xs font-black uppercase tracking-widest"
          style={{
            color,
            borderColor: color,
            boxShadow: effect.glowColor ? `0 0 14px ${effect.glowColor}88` : undefined,
          }}
        >
          {rarity}
        </div>
      </motion.div>
    </motion.div>
  );
}
