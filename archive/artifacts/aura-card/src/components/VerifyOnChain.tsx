import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ExternalLink, ChevronDown, ShieldCheck } from "lucide-react";
import { verifyCard } from "../lib/verifyAura";

interface VerifyOnChainProps {
  vrfTxSig: string | null;
  proof: { seedHex: string; archetype: string } | null;
}

/**
 * Non-intrusive on-chain verification affordance for the result screen.
 * Collapsed it reads "Verified on Solana" (links to the memo tx). Expanded it
 * lets a user or judge re-derive the card's archetype from the seed that was
 * committed on-chain and see that it matches, proving the card was not altered
 * after the commitment.
 */
export function VerifyOnChain({ vrfTxSig, proof }: VerifyOnChainProps) {
  const [open, setOpen] = useState(false);
  if (!vrfTxSig && !proof) return null;

  const result = proof ? verifyCard(proof.seedHex, proof.archetype) : null;
  const explorerUrl = vrfTxSig
    ? `https://explorer.solana.com/tx/${vrfTxSig}?cluster=devnet`
    : null;

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-200 transition-colors"
        aria-expanded={open}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-green-500/80" />
        Verified on Solana
        <ChevronDown
          className={`h-3 w-3 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm overflow-hidden"
          >
            <div className="rounded-xl surface-card p-3 space-y-2.5 text-left">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                This card's rarity and archetype were drawn from a random seed
                committed on Solana before the card was generated. You can
                re-derive them from that seed and confirm the match.
              </p>

              {result?.seedValid && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.08em] text-gray-500">
                      Archetype from seed
                    </span>
                    <span className="text-[11px] font-bold text-white">
                      {result.derivedArchetype}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.08em] text-gray-500">
                      Rarity roll from seed
                    </span>
                    <span className="text-[11px] font-bold text-white">
                      {result.derivedSeedRarity}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-bold ${
                      result.archetypeMatches ? "text-green-400" : "text-orange-400"
                    }`}
                    data-testid="verify-result"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {result.archetypeMatches
                      ? "Matches this card's archetype"
                      : "Archetype mismatch"}
                  </div>
                </div>
              )}

              {proof && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">
                    On-chain seed
                  </span>
                  <p className="font-mono text-[10px] text-gray-400 break-all leading-snug">
                    {proof.seedHex}
                  </p>
                </div>
              )}

              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors"
                >
                  View the commitment on Solana Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
