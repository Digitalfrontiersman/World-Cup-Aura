import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRarityEffect } from "@/components/RarityEffects";
import { STYLE_VARIANTS, STYLE_LABELS } from "../types";
import { useAuraFlow } from "../AuraFlowProvider";

// ── Off-screen capture clone ────────────────────────────────────────────────
// Fixed 400×600px, no backdrop-blur / flex / 3D transforms. html2canvas reads
// this div (via captureRef); the live 3D card is never captured.
export function CaptureClone() {
  const { state, effectiveRarity, rarityStyle, captureRef } = useAuraFlow();
  const { step, result, transformStatus, transformedImage, photo, editionNumber, vrfTxSig } = state;
  if (step !== "result" || !result) return null;

  return (
    <div aria-hidden="true" style={{ position: "fixed", left: -9999, top: 0, width: 400, pointerEvents: "none", zIndex: -1 }}>
      <div
        ref={captureRef}
        style={{
          fontFamily: "'Clash Display', 'Satoshi', system-ui, sans-serif",
          width: 400,
          height: 600,
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          background: "linear-gradient(145deg, #111A15 0%, #050806 100%)",
          border: `3px solid ${rarityStyle.border}`,
          boxShadow: getRarityEffect(effectiveRarity).glowShadow,
        }}
      >
        {/* Portrait image - top 55% = 330px */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 330, overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          {transformStatus === "success" && transformedImage ? (
            <img src={transformedImage} alt="Player" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.25) saturate(1.1)" }} />
          ) : photo ? (
            <img src={photo} alt="Player" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.25) saturate(1.1) grayscale(0.5)", opacity: 0.4 }} />
          ) : null}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0A0D10 0%, rgba(10,13,16,0.2) 50%, rgba(0,0,0,0.4) 100%)" }} />
          <div style={{ position: "absolute", bottom: 8, right: 12, textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Power Level</div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 30, color: "white", lineHeight: 1 }}>{result.power}</div>
          </div>
        </div>

        {/* Score badge (top left) */}
        <div style={{ position: "absolute", top: 16, left: 12, zIndex: 30, textAlign: "center" }}>
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 60, lineHeight: 1, letterSpacing: "-0.01em", color: "#F6DFA0" }}>{result.aura}</div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "white", letterSpacing: "0.2em", marginTop: 4, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "0 4px", border: "1px solid rgba(255,255,255,0.1)" }}>Aura</div>
        </div>

        {/* Nation + rarity (top right) */}
        <div style={{ position: "absolute", top: 16, right: 12, zIndex: 30 }}>
          <div style={{ display: "block", textAlign: "center", marginBottom: 6, padding: "6px 12px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 900, textTransform: "uppercase", color: "white", background: "rgba(0,0,0,0.8)" }}>{result.nation}</div>
          <div style={{ display: "block", textAlign: "center", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: rarityStyle.color, border: `1px solid ${rarityStyle.border}`, background: rarityStyle.bg }}>{effectiveRarity}</div>
        </div>

        {/* Bottom content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 270, padding: "12px 16px", overflow: "hidden", zIndex: 30 }}>
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.2 }}>{result.name}</div>
            <div style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(251,191,36,0.2)", color: "rgb(251,191,36)", border: "1px solid rgba(251,191,36,0.3)" }}>{result.archetype}</div>
          </div>

          <div style={{ marginBottom: 6, padding: "8px 4px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.7)", fontSize: 0 }}>
            {[
              { label: "PAC", value: result.stats.speed },
              { label: "SHO", value: result.stats.clutch },
              { label: "PAS", value: result.stats.iq },
              { label: "DRI", value: result.stats.chaos },
              { label: "DEF", value: result.stats.loyalty },
              { label: "PHY", value: result.stats.banter },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "inline-block", width: "33.33%", textAlign: "center", padding: "4px 0", verticalAlign: "top" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", fontSize: 10, color: "rgb(209,213,219)", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8, lineHeight: 1.4, marginBottom: 6 }}>"{result.prophecy}"</div>

          <div style={{ paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 0 }}>
            <span style={{ display: "inline-block", width: "40%", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#34d399", verticalAlign: "middle", textAlign: "left" }}>{result.rank}</span>
            <span style={{ display: "inline-block", width: "30%", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: effectiveRarity === "Mythic" ? "#FFD700" : rarityStyle.color, verticalAlign: "middle", textAlign: "center" }}>
              {editionNumber != null ? `#${editionNumber.toLocaleString()} / 100,000` : ""}
            </span>
            <span style={{ display: "inline-block", width: "30%", verticalAlign: "middle", textAlign: "right" }}>
              {vrfTxSig && <span style={{ display: "block", fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "rgba(52,211,153,0.8)", lineHeight: 1.3 }}>Verified</span>}
              <span style={{ display: "block", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", lineHeight: 1.3 }}>{result.id}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Remix forge overlay (while 3 portraits generate) ─────────────────────────
export function RemixForgeOverlay() {
  const { state } = useAuraFlow();
  const { remixForging, step, remixResolvedCount } = state;
  return (
    <AnimatePresence>
      {remixForging && step === "result" && (
        <motion.div key="remix-forge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 20 }} transition={{ type: "spring", bounce: 0.3 }} className="w-72 bg-[#0a0d12] border border-orange-500/40 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
            <div className="relative">
              <Loader2 className="h-10 w-10 text-orange-400 animate-spin" />
              <div className="absolute inset-0 blur-xl bg-orange-500/30 rounded-full" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-display font-black text-white uppercase tracking-widest">Forging 3 Portraits…</p>
              <p className="text-2xl font-display font-black text-orange-400">
                {remixResolvedCount} <span className="text-white/40 text-base">of 3 ready</span>
              </p>
            </div>
            <div className="flex gap-2 w-full">
              {STYLE_VARIANTS.map((v, i) => (
                <div key={v} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i < remixResolvedCount ? "bg-orange-400" : "bg-white/10"}`} />
              ))}
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{STYLE_VARIANTS.map((v) => STYLE_LABELS[v])[remixResolvedCount] ?? "All done!"}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Remix picker overlay (choose one of 3 portraits) ─────────────────────────
export function RemixPickerOverlay() {
  const { state, actions } = useAuraFlow();
  const { remixPickerOpen, remixVariants, remixSelectedIndex, remixResolvedCount } = state;
  return (
    <AnimatePresence>
      {remixPickerOpen && (
        <motion.div key="remix-picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center bg-black/80 backdrop-blur-sm" onClick={actions.cancelRemix}>
          <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0.22, duration: 0.55 }} className="w-full max-w-lg bg-[#0a0d12] border border-orange-500/30 rounded-t-3xl sm:rounded-2xl p-6 space-y-6 shadow-[0_-20px_80px_rgba(0,0,0,0.8)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-black text-white uppercase tracking-wider">Choose Your Portrait</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tap a style, then confirm</p>
              </div>
              <button onClick={actions.cancelRemix} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {STYLE_VARIANTS.map((variant, i) => {
                const img = remixVariants[i];
                const isSelected = remixSelectedIndex === i;
                const isFailed = !img && remixResolvedCount === 3;
                return (
                  <button
                    key={variant}
                    disabled={!img}
                    onClick={() => { if (img) actions.setRemixSelectedIndex(i); }}
                    className={`relative flex flex-col items-center gap-2 rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${isSelected && img ? "border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.6)] scale-[1.03]" : "border-white/10 hover:border-white/30"}`}
                  >
                    <div className="w-full aspect-[2/3] bg-black/60 relative">
                      {img ? (
                        <img src={img} alt={STYLE_LABELS[variant]} className="w-full h-full object-cover object-top" />
                      ) : isFailed ? (
                        <div className="w-full h-full flex items-center justify-center"><Sparkles className="h-6 w-6 text-gray-600" /></div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Loader2 className="h-6 w-6 text-orange-400 animate-spin" /></div>
                      )}
                      {isSelected && img && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center shadow-lg">
                          <Check className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </div>
                    <span className={`pb-2 text-[10px] font-black uppercase tracking-widest ${isSelected && img ? "text-orange-300" : "text-gray-400"}`}>{STYLE_LABELS[variant]}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={actions.cancelRemix} className="h-12 bg-black/60 border-gray-700 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-black/80">Keep Current</Button>
              <Button onClick={actions.confirmRemix} disabled={!remixVariants[remixSelectedIndex]} className="h-12 bg-orange-500 hover:bg-orange-400 text-white font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 shadow-[0_0_20px_rgba(251,146,60,0.4)]">
                <Check className="mr-2 h-4 w-4" /> Use This One
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
