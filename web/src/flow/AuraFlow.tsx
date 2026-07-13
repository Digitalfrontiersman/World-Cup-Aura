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
      {/* Deep base — a subtle radial so the near-black has depth, not a flat slab */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: step === "landing"
            ? "radial-gradient(120% 90% at 50% 0%, #0d0d16 0%, #08080e 52%, #050509 100%)"
            : "#07070c",
        }}
      />

      {/* Stadium photo — kept for the rest of the flow, but NOT the landing (clean spotlight) */}
      {step !== "landing" && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: "url('/pitch-bg.png')", opacity: step === "result" ? 0.34 : 0.08 }}
        />
      )}

      {/* Living aurora field, rarity-tinted on result — suppressed on the clean landing */}
      {step !== "landing" && <AuroraBackground color={step === "result" ? resultTint : undefined} />}

      {/* Landing spotlight: one soft warm glow up top so the card stack reads as lit */}
      {step === "landing" && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: "radial-gradient(55% 45% at 50% 30%, hsl(42 78% 55% / 0.10) 0%, transparent 68%)" }}
        />
      )}

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

      {/* Top bar */}
      <Navbar onHome={actions.goHome} />

      <main
        className={`relative z-10 mx-auto w-full min-h-[100dvh] flex flex-col pt-28 pb-12 px-4 transition-[max-width] duration-500 ease-in-out ${step === "result" ? "max-w-4xl" : step === "landing" ? "max-w-md md:max-w-6xl" : "max-w-md"}`}
        style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
      >
        <AnimatePresence mode="wait">
          {step === "landing" && <LandingStep key="landing" />}
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

      {/* Footer on landing + result — full-width, end to end */}
      {(step === "landing" || step === "result") && (
        <div className="relative z-10 w-full">
          <Footer />
        </div>
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
