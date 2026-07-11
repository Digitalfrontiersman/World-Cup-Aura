import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
 * a streaming pseudo-signature, and a stepped status list. Purely visual - the
 * real result replaces it when the mint mutation resolves.
 */
export function MintingCinematic() {
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
    const t = setInterval(() => setHash(randomHex(64)), 110);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-black/60 p-5 space-y-4"
      data-testid="mint-cinematic"
    >
      {/* Pulsing on-chain core with orbiting nodes */}
      <div className="relative h-24 flex items-center justify-center">
        <motion.div
          className="absolute w-16 h-16 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.55), transparent 70%)" }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {[0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-primary/40"
            style={{ width: 48 + ring * 26, height: 48 + ring * 26 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6 + ring * 3, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"
              style={{ boxShadow: "0 0 8px rgba(251,191,36,0.9)" }}
            />
          </motion.div>
        ))}
        <ShieldCheck className="relative h-6 w-6 text-primary" />
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
            <div
              key={s.label}
              className={`flex items-center gap-2 text-xs transition-colors ${
                done || active ? "text-white" : "text-gray-600"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{s.label}</span>
              {done ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
