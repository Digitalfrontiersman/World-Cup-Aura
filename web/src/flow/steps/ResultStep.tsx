import { motion } from "framer-motion";
import {
  Download, Share2, Swords, RotateCcw, Trophy, Sparkles, Loader2, Check, Copy, ExternalLink, Flame, Layers, Package, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ParticleSparks, HaloRing, RarityRevealOverlay, getRarityEffect } from "@/components/RarityEffects";
import { VerifyOnChain } from "@/components/VerifyOnChain";
import { AuraCardBack } from "@/components/AuraCardBack";
import { MintingCinematic } from "@/components/MintingCinematic";
import { WalletConnect } from "@/components/WalletConnect";
import { CountUp } from "@/components/CountUp";
import { rarityColor, getRarityStyle } from "@/lib/rarity";
import { getWalletAddress } from "@/lib/solanaWallet";
import { MAX_REMIXES } from "../types";
import { useAuraFlow } from "../AuraFlowProvider";

export function ResultStep() {
  const flow = useAuraFlow();
  const { state, actions, effectiveRarity, rarityStyle, remixFocusMode, recipient, mintReady, mintError, mintResult, prefersReducedMotion, walletConnected, cardRef, communityWallRef, motion: m, mintStatusQuery, mintMutation } = flow;
  const {
    result, isFlipped, backMounted, isFirstReveal, transformedImage, transformStatus, transformErrorKind,
    capacityCountdown, editionNumber, serverRarity, vrfTxSig, vrfProof, recipientInput, useTempWallet, copied, photo,
    remixCount, remixForging, remixResolvedCount, shareGenerating,
  } = state;

  if (!result) return null;

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.35, duration: 0.8 }}
      className="flex-1 flex flex-col items-center pb-12 w-full pt-4 overflow-y-auto"
    >
      {isFirstReveal && <RarityRevealOverlay rarity={result.rarity} onComplete={actions.completeReveal} />}

      <div className="text-center mb-5 flex flex-col items-center gap-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="type-eyebrow inline-flex items-center gap-2 text-[0.72rem]"
          style={{ color: rarityColor(effectiveRarity) }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: rarityColor(effectiveRarity) }} />
          Aura Analyzed
        </motion.div>
        <motion.h2 initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, type: "spring" }} className="type-display text-white uppercase drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
          {result.rank}
        </motion.h2>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-condensed text-[11px] uppercase tracking-wide text-white/60 backdrop-blur-sm">
          Top {Math.max(1, 100 - result.aura)}% of fans globally
        </motion.div>
      </div>

      {/* Card with 3D tilt */}
      <motion.div className="card-container-3d relative flex justify-center" onMouseMove={m.onMouseMove} onMouseLeave={m.onMouseLeave} style={{ rotateX: m.rotateX, rotateY: m.rotateY }}>
        {(() => {
          const fx = getRarityEffect(effectiveRarity);
          return (
            <>
              {fx.flames && (
                <div className="absolute -inset-16 z-[-1] pointer-events-none mix-blend-screen" style={{ opacity: effectiveRarity === "Mythic" ? 0.95 : 0.7 }}>
                  <img src="/flames.png" alt="" className="w-full h-full object-cover animate-pulse" style={{ animationDuration: effectiveRarity === "Mythic" ? "1.5s" : "2.5s" }} />
                </div>
              )}
              {fx.halo && <HaloRing color={fx.glowColor!} />}
              {fx.particles > 0 && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                  <ParticleSparks count={fx.particles} color={fx.glowColor!} />
                </div>
              )}
            </>
          );
        })()}

        <motion.div
          className="relative"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.1, 0.1, 1] }}
          style={{ width: "clamp(280px, 80vw, 360px)", aspectRatio: "2 / 3", transformStyle: "preserve-3d" }}
        >
          <div
            ref={cardRef}
            className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden glass-panel border-[3px] card-3d-inner rarity-glow-${effectiveRarity} rarity-border-${effectiveRarity}`}
            style={{
              background: "linear-gradient(145deg, #111A15 0%, #050806 100%)",
              boxShadow: getRarityEffect(effectiveRarity).glowShadow,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              pointerEvents: isFlipped ? "none" : "auto",
            }}
          >
            <motion.div aria-hidden className="holo-foil absolute inset-0 z-30 pointer-events-none" style={{ ["--holo-x"]: m.holoX, ["--holo-y"]: m.holoY } as unknown as React.CSSProperties} />
            {getRarityEffect(effectiveRarity).holoFoil && (
              <div className="absolute inset-0 mix-blend-color-dodge z-20 pointer-events-none" style={{ backgroundImage: "url('/holo-foil.png')", backgroundSize: "cover", opacity: getRarityEffect(effectiveRarity).shimmerOpacity * 0.7 }} />
            )}
            {getRarityEffect(effectiveRarity).shimmerOpacity > 0 && (
              <div className="holo-overlay" style={{ opacity: getRarityEffect(effectiveRarity).shimmerOpacity, ["--holo-duration" as string]: getRarityEffect(effectiveRarity).shimmerDuration }} />
            )}

            <div className="absolute inset-0 opacity-[0.15] bg-[url('/carbon-fibre.png')] mix-blend-overlay z-0"></div>

            {/* Top image */}
            <div className="absolute top-0 inset-x-0 h-[55%] overflow-hidden z-10 border-b border-white/10">
              {transformStatus === "success" && transformedImage ? (
                <div role="img" aria-label="Player" className="w-full h-full filter contrast-125 saturate-110" style={{ backgroundImage: `url(${transformedImage})`, backgroundSize: "cover", backgroundPosition: "top center", backgroundRepeat: "no-repeat" }} />
              ) : (
                <>
                  <div role="img" aria-label="Player" className="w-full h-full filter contrast-125 saturate-110 opacity-40 grayscale" style={{ backgroundImage: `url(${photo || "/avatar-1.png"})`, backgroundSize: "cover", backgroundPosition: "top center", backgroundRepeat: "no-repeat" }} />
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/75 px-4 text-center" data-testid="transform-status-overlay">
                    {transformStatus === "loading" ? (
                      <>
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <p className="text-xs font-bold uppercase tracking-widest text-white/90">Forging your hero portrait…</p>
                      </>
                    ) : transformErrorKind === "capacity" && capacityCountdown !== null ? (
                      <>
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <p className="text-xs font-bold uppercase tracking-wide text-white/90 leading-snug">Studio is busy - retrying in {capacityCountdown}s…</p>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-7 w-7 text-primary" />
                        <p className="text-xs font-bold uppercase tracking-wide text-white/90 leading-snug">
                          {transformErrorKind === "capacity" ? "Studio is full - please try again in a moment." : "Portrait couldn't be generated - your card stats are saved."}
                        </p>
                        <Button onClick={actions.retryTransform} className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider rounded-lg text-xs" data-testid="button-retry-transform">
                          <RotateCcw className="mr-2 h-4 w-4" /> Tap to Try Again
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D10] via-[#0A0D10]/20 to-black/40" />

              <div className={`absolute bottom-2 right-3 text-right transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                <div className="text-[10px] text-white/80 font-bold uppercase tracking-widest drop-shadow-md">Power Level</div>
                <div className="text-3xl font-numeral text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"><CountUp to={result.power} /></div>
              </div>
            </div>

            {/* Score badge */}
            <div className={`absolute top-4 left-3 z-30 text-center drop-shadow-2xl transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <div className="text-6xl font-numeral leading-none gold-text-gradient tracking-tight"><CountUp to={result.aura} /></div>
              <div className="text-[11px] font-bold uppercase text-white tracking-[0.2em] mt-1 drop-shadow-md rounded px-1 border border-white/10 bg-black/40 backdrop-blur-sm">Aura</div>
            </div>

            {/* Nation + rarity badges */}
            <div className={`absolute top-4 right-3 z-30 flex flex-col items-end gap-1.5 transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <div className="px-3 py-1.5 rounded border border-white/20 text-sm font-black uppercase text-white shadow-xl flex items-center gap-2 bg-black/60 backdrop-blur-md max-w-[120px] truncate">{result.nation}</div>
              <motion.div
                className="px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-widest shadow-xl border-2 backdrop-blur-md"
                style={{
                  color: rarityStyle.color,
                  borderColor: rarityStyle.border,
                  backgroundColor: rarityStyle.bg,
                  textShadow: getRarityEffect(effectiveRarity).glowColor ? `0 0 8px ${getRarityEffect(effectiveRarity).glowColor}` : undefined,
                  boxShadow: getRarityEffect(effectiveRarity).glowColor ? `0 0 10px ${getRarityEffect(effectiveRarity).glowColor}55, inset 0 0 8px ${getRarityEffect(effectiveRarity).glowColor}22` : undefined,
                }}
                animate={isFirstReveal ? { scale: [1, 1, 2.2, 1.1, 1], opacity: [1, 1, 1, 1, 1] } : { scale: 1 }}
                transition={isFirstReveal ? { duration: 0.5, delay: 1.15, ease: "easeOut" } : {}}
              >
                {effectiveRarity}
              </motion.div>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 inset-x-0 min-h-[45%] p-4 flex flex-col justify-end z-30">
              <div className="text-center mb-2">
                <h3 className="text-3xl font-condensed font-bold text-white uppercase tracking-wide leading-tight drop-shadow-lg line-clamp-2">{result.name}</h3>
                <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 max-w-full truncate transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>{result.archetype}</div>
              </div>

              <div className={`grid grid-cols-3 gap-y-2 gap-x-2 mb-2 p-3 rounded-xl border border-white/10 shadow-inner bg-black/40 backdrop-blur-md transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                {[
                  { label: "PAC", value: result.stats.speed },
                  { label: "SHO", value: result.stats.clutch },
                  { label: "PAS", value: result.stats.iq },
                  { label: "DRI", value: result.stats.chaos },
                  { label: "DEF", value: result.stats.loyalty },
                  { label: "PHY", value: result.stats.banter },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center justify-center relative">
                    <span className="text-xl font-condensed font-bold text-white leading-none drop-shadow-md"><CountUp to={stat.value} duration={1.5} /></span>
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className={`text-center text-[11px] text-gray-300 font-medium italic border-t border-white/10 pt-3 leading-snug line-clamp-2 sm:line-clamp-3 transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>"{result.prophecy}"</div>

              <div className={`flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10 transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent truncate">
                  <Trophy className="h-3 w-3 shrink-0" />
                  {result.rank}
                </span>
                {editionNumber != null && (
                  <span
                    className="text-[9px] font-black uppercase tracking-widest shrink-0"
                    style={effectiveRarity === "Mythic" ? { background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } : { color: rarityStyle.color }}
                  >
                    #{editionNumber.toLocaleString()} / 100,000
                  </span>
                )}
                <span className="flex flex-col items-end shrink-0">
                  {vrfTxSig && <span className="text-[8px] font-bold text-emerald-500/70 tracking-wider leading-tight uppercase">Verified</span>}
                  <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase leading-tight">{result.id}</span>
                </span>
              </div>
            </div>
          </div>

          {backMounted && (
            <div
              className="absolute inset-0 w-full h-full cursor-pointer"
              style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", pointerEvents: isFlipped ? "auto" : "none", boxShadow: getRarityEffect(effectiveRarity).glowShadow }}
              onClick={() => actions.setFlipped(false)}
              aria-hidden={!isFlipped}
            >
              <AuraCardBack card={{ stats: result.stats, nation: result.nation, archetype: result.archetype, rarity: effectiveRarity }} rarity={effectiveRarity} />
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Flip toggle */}
      <button
        type="button"
        onClick={() => { actions.setBackMounted(true); actions.setFlipped(!isFlipped); }}
        className={`mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/20 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{ width: "clamp(280px, 80vw, 360px)", justifyContent: "center" }}
        data-testid="button-flip-card"
      >
        <RotateCcw className="h-4 w-4" />
        {isFlipped ? "Back to your card" : "Reveal your lookalike"}
      </button>

      {/* Action buttons */}
      <div className={`transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="grid grid-cols-2 gap-3 mt-5 relative z-20" style={{ width: "clamp(280px, 80vw, 360px)" }}>
          <Button onClick={actions.download} className="h-14 bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-[0.06em] rounded-xl">
            <Download className="mr-2 h-5 w-5" /> Save
          </Button>
          <Button onClick={() => actions.setSheet("shareOpen", true)} disabled={transformStatus !== "success" || shareGenerating} className="h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-[0.06em] rounded-xl disabled:opacity-50">
            {transformStatus === "loading" || shareGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />}
            Share
          </Button>
          <Button onClick={actions.remix} disabled={remixCount >= MAX_REMIXES || transformStatus === "loading" || remixForging} variant="outline" className="h-12 relative surface-flat text-white font-bold uppercase tracking-[0.06em] rounded-xl hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed">
            {remixForging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 text-primary animate-spin" />
                <span>{remixResolvedCount} of 3 ready…</span>
              </>
            ) : (
              <>
                <Flame className="mr-2 h-4 w-4 text-primary" />
                Remix
                <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 rounded ${remixCount >= MAX_REMIXES ? "bg-white/10 text-gray-400" : "bg-primary/15 text-primary border border-primary/30"}`}>{MAX_REMIXES - remixCount} left</span>
              </>
            )}
          </Button>
          <Button onClick={actions.resetToLanding} variant="outline" className="h-12 surface-flat text-white font-bold uppercase tracking-[0.06em] rounded-xl hover:border-primary/50">
            <RotateCcw className="mr-2 h-4 w-4" /> Retry
          </Button>
          <Button onClick={() => actions.setSheet("challengeOpen", true)} variant="outline" className="col-span-2 h-12 surface-flat text-primary font-bold uppercase tracking-[0.06em] rounded-xl hover:border-primary">
            <Swords className="mr-2 h-4 w-4" /> Challenge a friend
          </Button>
          <Button onClick={() => actions.setSheet("shipOpen", true)} className="col-span-2 h-14 bg-gradient-to-br from-amber-300 via-primary to-amber-500 text-black font-black uppercase tracking-[0.06em] rounded-xl hover:brightness-110">
            <Package className="mr-2 h-5 w-5" /> Ship the physical card
            <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[11px] font-black">$4.99</span>
          </Button>
        </motion.div>
      </div>

      {/* Collectible secured */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-5 p-5 rounded-2xl surface-card space-y-4" style={{ width: "clamp(280px, 80vw, 360px)" }}>
        <div className="flex items-center gap-2 text-primary">
          <Trophy size={20} className="fill-primary" />
          <h3 className="font-display font-black text-lg uppercase tracking-[0.04em]">Collectible Secured</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-300 surface-flat p-4 rounded-xl">
          <div className="flex flex-col"><span className="label-stat text-gray-500 mb-1">Card ID</span> <span className="font-mono text-white/90">{result.id}</span></div>
          <div className="flex flex-col">
            <span className="label-stat text-gray-500 mb-1">Rarity</span>
            <span className="font-black text-sm" style={{ color: getRarityStyle(serverRarity ?? result.rarity).color }}>{serverRarity ?? result.rarity}</span>
          </div>
        </div>
        {editionNumber != null && (
          <div className={`transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.3 }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 border border-primary/20">
              <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs font-bold text-white/70">
                Card <span className="text-primary font-black">#{editionNumber.toLocaleString()}</span> of <span className="text-white font-black">100,000</span>
              </span>
            </motion.div>
          </div>
        )}

        {(vrfTxSig || vrfProof) && <VerifyOnChain vrfTxSig={vrfTxSig} proof={vrfProof} />}

        {mintResult ? (
          <motion.div className="space-y-3" data-testid="mint-success" initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            <div className="surface-card relative overflow-hidden rounded-2xl p-5 text-center">
              <motion.div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40" initial={prefersReducedMotion ? false : { scale: 0.4, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.1 }}>
                <Check size={26} className="text-primary" strokeWidth={3} />
              </motion.div>
              <div className="type-eyebrow mt-3 text-primary">Minted</div>
              <p className="mt-1 text-sm text-muted-foreground">Your Aura Card is now a live NFT on Solana devnet</p>
            </div>

            <div className="surface-card rounded-xl p-3 space-y-1">
              <span className="type-eyebrow text-muted-foreground">Mint address</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-white break-all flex-1" data-testid="text-mint-address">{mintResult.mintAddress}</span>
                <button onClick={actions.copyMint} className="shrink-0 text-muted-foreground hover:text-white transition-colors" aria-label="Copy mint address" data-testid="button-copy-mint">
                  {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <div className="surface-card rounded-xl p-3 space-y-1">
              <span className="type-eyebrow text-muted-foreground">Owner wallet</span>
              <p className="font-mono text-[11px] text-white/70 break-all" data-testid="text-mint-recipient">{mintResult.recipient}</p>
            </div>
            <a href={mintResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-12 rounded-xl surface-card text-white font-bold uppercase tracking-[0.06em] text-sm hover:border-primary/50 transition-colors" data-testid="link-explorer">
              <ExternalLink className="h-4 w-4" /> View on Explorer
            </a>
          </motion.div>
        ) : mintMutation.isPending ? (
          <MintingCinematic />
        ) : (
          <>
            <div className="surface-flat p-3 rounded-lg space-y-2.5" data-testid="mint-recipient-option">
              <span className="label-stat text-gray-500">Send the NFT to</span>
              <WalletConnect />
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[9px] uppercase tracking-widest text-gray-600">or paste an address</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <Input
                value={useTempWallet ? getWalletAddress() : recipientInput}
                onChange={(e) => actions.setRecipientInput(e.target.value)}
                disabled={useTempWallet || walletConnected || mintMutation.isPending}
                placeholder="Paste your Solana wallet address"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                className="h-10 bg-black/60 border-gray-700 text-white font-mono text-xs"
                data-testid="input-recipient"
              />
              <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer select-none">
                <input type="checkbox" checked={useTempWallet} onChange={(e) => actions.setUseTempWallet(e.target.checked)} disabled={walletConnected || mintMutation.isPending} className="accent-primary h-3.5 w-3.5" data-testid="checkbox-temp-wallet" />
                I don't have a wallet - use a temporary in-app one
              </label>
              <p className="text-[10px] text-gray-500 leading-relaxed">Minting is free - the app's sponsor wallet covers all devnet fees.</p>
            </div>

            <Button onClick={actions.mint} disabled={mintMutation.isPending || !mintReady || !recipient} className="w-full h-14 text-primary-foreground font-bold uppercase tracking-[0.06em] rounded-xl border-0 bg-primary hover:brightness-[1.06]" data-testid="button-mint">
              {mintMutation.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Minting NFT…</> : <><Sparkles className="mr-2 h-5 w-5" /> Mint as NFT (free)</>}
            </Button>

            {!mintStatusQuery.isLoading && !mintReady && <p className="text-xs text-gray-400 text-center" data-testid="text-mint-unavailable">Sponsored minting is temporarily unavailable. Please check back soon.</p>}
            {mintError && <p className="text-xs text-destructive text-center" data-testid="text-mint-error">{mintError}</p>}
          </>
        )}
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="flex flex-col items-center gap-1.5 mt-6 cursor-pointer select-none"
        onClick={() => communityWallRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") communityWallRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
        aria-label="See everyone's cards"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">See what others got</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="h-5 w-5 text-primary/60" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
