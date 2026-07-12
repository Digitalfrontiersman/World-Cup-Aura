import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, ShieldCheck, Radio, Link2 } from "lucide-react";

const STEPS = [
  { icon: ShieldCheck, label: "Signing with sponsor treasury" },
  { icon: Radio, label: "Broadcasting to Solana devnet" },
  { icon: Link2, label: "Confirming on-chain" },
];

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

/**
 * Plays while a mint is in flight: a pulsing on-chain core with orbiting nodes,
 * a streaming pseudo-signature, a progress meter and a stepped status list.
 * Purely visual - the real result replaces it when the mint mutation resolves.
 */
export function MintingCinematic() {
  const reduceMotion = useReducedMotion() ?? false;
  const [stepIdx, setStepIdx] = useState(0);
  const [hash, setHash] = useState(() => randomHex(64));

  useEffect(() => {
    const t = setInterval(
      () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1)),
      1600,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const t = setInterval(() => setHash(randomHex(64)), 110);
    return () => clearInterval(t);
  }, [reduceMotion]);

  // Progress creeps toward the current step and never quite completes - the real
  // success state (rendered by the parent) is what lands it at 100%.
  const progress = Math.min(96, 12 + ((stepIdx + 1) / STEPS.length) * 82);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-black/60 p-5 space-y-4"
      data-testid="mint-cinematic"
    >
      {/* Ambient top sheen */}
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.12), transparent 70%)" }}
      />

      <div className="relative flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
          Minting your NFT
        </p>
      </div>

      {/* Pulsing on-chain core with orbiting nodes */}
      <div className="relative h-24 flex items-center justify-center">
        <motion.div
          className="absolute w-16 h-16 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.55), transparent 70%)" }}
          animate={reduceMotion ? { opacity: 0.85 } : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {[0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-primary/40"
            style={{ width: 48 + ring * 26, height: 48 + ring * 26 }}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={reduceMotion ? undefined : { duration: 6 + ring * 3, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"
              style={{ boxShadow: "0 0 8px rgba(251,191,36,0.9)" }}
            />
          </motion.div>
        ))}
        <ShieldCheck className="relative h-6 w-6 text-primary" />
      </div>

      {/* Progress meter */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-amber-300 to-primary"
          initial={{ width: "8%" }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
        {!reduceMotion && (
          <motion.div
            className="absolute inset-y-0 w-1/3"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Streaming pseudo-signature */}
      <p className="font-mono text-[10px] leading-snug text-primary/50 break-all text-center">
        {hash}
      </p>

      {/* Stepped status */}
      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              className={`flex items-center gap-2.5 text-xs transition-colors ${
                done || active ? "text-white" : "text-gray-600"
              }`}
              animate={active && !reduceMotion ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
              transition={active && !reduceMotion ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  done
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                    : active
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-white/10 bg-white/5 text-gray-600"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span className="flex-1">{s.label}</span>
              {active ? (
                <Loader2 className={`h-3.5 w-3.5 text-primary ${reduceMotion ? "" : "animate-spin"}`} />
              ) : done ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
