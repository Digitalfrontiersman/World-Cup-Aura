// The flow orchestrator — assembles the persistent chrome (background layers,
// navbar, footer), the step switch, the community wall, the capture clone,
// remix overlays, and all the sheets/modals. Each step reads its own slice from
// useAuraFlow(); this file just decides what's on screen for the current step.

import { AnimatePresence } from "framer-motion";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CommunityWall } from "@/components/CommunityWall";
import { ChallengeSheet } from "@/components/ChallengeSheet";
import { ShareSheet } from "@/components/ShareSheet";
import { ShipCardSheet } from "@/components/ShipCardSheet";
import { RarityReveal } from "@/components/RarityReveal";
import { rarityColor } from "@/lib/rarity";
import { getAppUrl } from "@/lib/utils";
import { useAuraFlow } from "./AuraFlowProvider";
import { LandingStep } from "./steps/LandingStep";
import { PhotoStep } from "./steps/PhotoStep";
import { QuizStep } from "./steps/QuizStep";
import { ScannerStep } from "./steps/ScannerStep";
import { ResultStep } from "./steps/ResultStep";
import { CaptureClone, RemixForgeOverlay, RemixPickerOverlay } from "./steps/Overlays";

export function AuraFlow() {
  const { state, actions, mintResult, communityWallRef } = useAuraFlow();
  const { step, result, serverRarity, cardSlug, editionNumber, vrfTxSig, showRarityReveal, shareAssets } = state;

  const resultTint = rarityColor(serverRarity ?? result?.rarity ?? "Core");
  const shareUrl = cardSlug ? `${getAppUrl()}${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${cardSlug}` : null;

  return (
    <div className="min-h-[100dvh] w-full bg-background relative overflow-hidden font-sans text-foreground">
      {/* Top bar (fixed) — shared across every step */}
      <Navbar onHome={actions.goHome} />

      {step === "landing" ? (
        /* The landing is a full-bleed cinematic scroll page that owns its own
           backgrounds, sections and footer — it escapes the narrow flow column. */
        <LandingStep />
      ) : (
        <>
          {/* Deep base — a subtle radial so the near-black has depth, not a flat slab */}
          <div className="absolute inset-0 z-0" style={{ background: "#07070c" }} />

          {/* Stadium photo — dim texture behind the flow */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-700"
            style={{ backgroundImage: "url('/pitch-bg.png')", opacity: step === "result" ? 0.34 : 0.08 }}
          />

          {/* Living aurora field, rarity-tinted on result */}
          <AuroraBackground color={step === "result" ? resultTint : undefined} />

          {/* Reveal spotlight */}
          {step === "result" && (
            <div className="absolute inset-0 z-0 pointer-events-none mix-blend-screen transition-opacity duration-700" style={{ background: `radial-gradient(60% 46% at 50% 40%, ${resultTint}2e 0%, transparent 70%)` }} />
          )}

          {/* Vignette */}
          <div
            className="absolute inset-0 z-0 pointer-events-none transition-[background] duration-700"
            style={{
              background: step === "result"
                ? "radial-gradient(120% 95% at 50% 12%, rgba(7,7,12,0) 0%, rgba(7,7,12,0.35) 58%, rgba(7,7,12,0.8) 100%)"
                : "radial-gradient(120% 90% at 50% 8%, rgba(7,7,12,0) 0%, rgba(7,7,12,0.55) 62%, rgba(7,7,12,0.92) 100%)",
            }}
          />

          <main
            className={`relative z-10 mx-auto w-full min-h-[100dvh] flex flex-col pt-28 pb-12 px-4 transition-[max-width] duration-500 ease-in-out ${step === "result" ? "max-w-4xl" : "max-w-md"}`}
            style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
          >
            <AnimatePresence mode="wait">
              {step === "photo" && <PhotoStep key="photo" />}
              {step === "quiz" && <QuizStep key="quiz" />}
              {step === "scanner" && <ScannerStep key="scanner" />}
              {step === "result" && result && <ResultStep key="result" />}
            </AnimatePresence>
          </main>

          {/* Community wall below the result */}
          {step === "result" && result && (
            <div ref={communityWallRef} className="w-full pt-8 border-t border-white/5">
              <CommunityWall baseUrl={`${import.meta.env.BASE_URL}`} />
            </div>
          )}

          {/* Footer on result — full-width, end to end */}
          {step === "result" && (
            <div className="relative z-10 w-full">
              <Footer />
            </div>
          )}
        </>
      )}

      {/* Remix overlays + off-screen capture clone */}
      <RemixForgeOverlay />
      <CaptureClone />
      <RemixPickerOverlay />

      {/* Sheets / modals */}
      <ChallengeSheet
        open={state.challengeOpen}
        onClose={() => actions.setSheet("challengeOpen", false)}
        cardDataUrl={shareAssets.just}
        rarity={result?.rarity ?? ""}
        archetype={result?.archetype ?? ""}
        rank={result?.rank ?? ""}
        shareUrl={shareUrl}
        mintExplorerUrl={mintResult?.explorerUrl ?? null}
      />

      <ShareSheet
        open={state.shareOpen}
        onClose={() => actions.setSheet("shareOpen", false)}
        slides={[
          { id: "just", label: "Just the Card", description: "Clean PNG for Discord & Twitter", dataUrl: shareAssets.just },
          { id: "prophecy", label: "Card + Prophecy", description: "Perfect for Instagram & WhatsApp", dataUrl: shareAssets.prophecy },
          { id: "story", label: "Story Format", description: "9:16 for Reels & TikTok", dataUrl: shareAssets.story },
        ]}
        caption={result ? `I just unlocked my Aura Card! ${result.rarity} ${result.archetype}, Aura Level ${result.aura}. Try to beat it! 👊` : "Check out my Aura Card!"}
        shareUrl={shareUrl ?? mintResult?.explorerUrl ?? getAppUrl() + window.location.pathname}
      />

      <ShipCardSheet open={state.shipOpen} onClose={() => actions.setSheet("shipOpen", false)} cardSlug={result?.id ?? null} cardName={result?.name ?? null} />

      {/* Rarity reveal overlay */}
      <AnimatePresence>
        {showRarityReveal && serverRarity && (
          <RarityReveal rarity={serverRarity} predictedRarity={result?.rarity ?? null} editionNumber={editionNumber} vrfTxSig={vrfTxSig} onDismiss={() => actions.setSheet("showRarityReveal", false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
