import { useParams, Link } from "wouter";
import { useGetAuraCard } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Loader2, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleSparks, HaloRing, getRarityEffect } from "@/components/RarityEffects";

const RARITY_STYLES: Record<string, { color: string; border: string; glow: string; bg: string }> = {
  Core:      { color: "#cbd5e1", border: "rgba(203,213,225,0.55)", glow: "rgba(203,213,225,0.12)", bg: "rgba(203,213,225,0.1)" },
  Rising:    { color: "#60a5fa", border: "rgba(96,165,250,0.55)",  glow: "rgba(96,165,250,0.25)",  bg: "rgba(96,165,250,0.1)"  },
  Elite:     { color: "#22d3ee", border: "rgba(34,211,238,0.55)",  glow: "rgba(34,211,238,0.3)",   bg: "rgba(34,211,238,0.1)"  },
  Icon:      { color: "#c084fc", border: "rgba(192,132,252,0.55)", glow: "rgba(192,132,252,0.3)",  bg: "rgba(192,132,252,0.1)" },
  Legendary: { color: "#fbbf24", border: "rgba(251,191,36,0.55)",  glow: "rgba(251,191,36,0.35)",  bg: "rgba(251,191,36,0.1)"  },
  Mythic:    { color: "#fb7185", border: "rgba(251,113,133,0.6)",  glow: "rgba(251,113,133,0.35)", bg: "rgba(251,113,133,0.1)" },
  // Legacy compat
  Common: { color: "#cbd5e1", border: "rgba(203,213,225,0.55)", glow: "rgba(203,213,225,0.12)", bg: "rgba(203,213,225,0.1)" },
  Rare:   { color: "#60a5fa", border: "rgba(96,165,250,0.55)",  glow: "rgba(96,165,250,0.25)",  bg: "rgba(96,165,250,0.1)"  },
  Epic:   { color: "#c084fc", border: "rgba(192,132,252,0.55)", glow: "rgba(192,132,252,0.3)",  bg: "rgba(192,132,252,0.1)" },
};

function getRarityStyle(rarity: string) {
  return RARITY_STYLES[rarity] ?? RARITY_STYLES.Core;
}

export default function CardPreview() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useGetAuraCard(slug ?? "");

  const rarity = data?.card.rarity ?? "Core";
  const style = getRarityStyle(rarity);
  const fx = getRarityEffect(rarity);

  const homeUrl = import.meta.env.BASE_URL;

  if (isLoading) {
    return (
      <div className="min-h-dvh w-full bg-[#050816] flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-400" />
        <p className="text-gray-400 font-medium">Loading card…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-dvh w-full bg-[#050816] flex flex-col items-center justify-center gap-6 text-white px-6 text-center">
        <p className="text-2xl font-bold">Card not found</p>
        <p className="text-gray-400">This link may have expired or the card doesn't exist.</p>
        <Link href={homeUrl}>
          <Button className="h-12 px-8 bg-yellow-400 text-black font-bold hover:bg-yellow-300">
            Reveal Your Aura
          </Button>
        </Link>
      </div>
    );
  }

  const { card, imageDataUrl, vrfTxSig } = data;

  return (
    <div className="min-h-dvh w-full bg-[#050816] relative overflow-hidden flex flex-col items-center pb-12">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] blur-[150px] rounded-full"
          style={{ backgroundColor: style.glow }}
        />
        <div
          className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] blur-[150px] rounded-full"
          style={{ backgroundColor: style.glow, opacity: 0.6 }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-5 pt-10 flex flex-col items-center gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-1"
        >
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-black uppercase tracking-widest"
            style={{
              color: style.color,
              borderColor: style.border,
              backgroundColor: style.bg,
              textShadow: fx.glowColor ? `0 0 8px ${fx.glowColor}` : undefined,
              boxShadow: fx.glowColor
                ? `0 0 12px ${fx.glowColor}55`
                : undefined,
            }}
          >
            <Star className="h-3 w-3 fill-current" />
            {card.rarity} {card.archetype}
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mt-2">
            {card.name}
          </h1>
          <p className="text-sm text-gray-400 font-medium">{card.nation} · {card.rank}</p>
        </motion.div>

        {/* Card with tier effects */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
          className="w-full relative"
        >
          {/* Flames for Legendary / Mythic */}
          {fx.flames && (
            <div
              className="absolute -inset-10 z-[-1] pointer-events-none mix-blend-screen"
              style={{ opacity: rarity === "Mythic" ? 0.9 : 0.65 }}
            >
              <img
                src="/flames.png"
                alt=""
                className="w-full h-full object-cover animate-pulse"
                style={{ animationDuration: rarity === "Mythic" ? "1.5s" : "2.5s" }}
              />
            </div>
          )}

          {/* Halo ring for Mythic */}
          {fx.halo && <HaloRing color={fx.glowColor!} />}

          {/* Particle sparks for Icon / Legendary / Mythic */}
          {fx.particles > 0 && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <ParticleSparks count={Math.min(fx.particles, 18)} color={fx.glowColor!} />
            </div>
          )}

          <div
            className={`w-full rounded-2xl overflow-hidden shadow-2xl border-[3px] rarity-glow-${rarity} rarity-border-${rarity}`}
            style={{
              boxShadow: fx.glowShadow !== "none"
                ? fx.glowShadow
                : `0 0 40px ${style.glow}, 0 20px 60px rgba(0,0,0,0.8)`,
            }}
          >
            <img
              src={imageDataUrl}
              alt={`${card.name}'s Aura Card`}
              className="w-full h-auto block"
            />
          </div>
        </motion.div>

        {card.prophecy && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full rounded-2xl bg-black/50 border border-white/10 p-4 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Matchday Prophecy</p>
            <p className="text-white/90 text-sm italic leading-relaxed">"{card.prophecy}"</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full grid grid-cols-3 gap-2"
        >
          {[
            { label: "Aura", value: card.aura },
            { label: "Power", value: card.power },
            { label: "Speed", value: card.stats.speed },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-black/50 border border-white/10 p-3 text-center"
            >
              <p className="text-2xl font-black" style={{ color: style.color }}>{value}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{label}</p>
            </div>
          ))}
        </motion.div>

        {vrfTxSig && (
          <motion.a
            href={`https://explorer.solana.com/tx/${vrfTxSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-500/80 hover:text-emerald-400 transition-colors"
          >
            ✓ Verified on Solana
            <span className="text-[10px] opacity-60">↗</span>
          </motion.a>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-3 pt-2"
        >
          <p className="text-center text-sm text-gray-500 font-medium">Think your card can beat this?</p>
          <Link href={homeUrl}>
            <Button
              className="w-full h-14 text-base font-black uppercase tracking-wider rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${style.color}dd, ${style.color}99)`,
                color: "#000",
              }}
            >
              <Zap className="mr-2 h-5 w-5" />
              Reveal Your Aura
            </Button>
          </Link>
          <p className="text-center text-[11px] text-gray-600 uppercase font-bold tracking-widest">
            World Cup Aura Card
          </p>
        </motion.div>
      </div>
    </div>
  );
}
