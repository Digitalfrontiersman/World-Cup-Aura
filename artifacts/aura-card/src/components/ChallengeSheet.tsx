import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppUrl } from "@/lib/utils";
import { trackShareAuraCard } from "@/lib/analytics";

interface ChallengeSheetProps {
  open: boolean;
  onClose: () => void;
  cardDataUrl: string | null;
  rarity: string;
  archetype: string;
  rank: string;
  shareUrl?: string | null;
  mintExplorerUrl?: string | null;
}

export function ChallengeSheet({ open, onClose, cardDataUrl, rarity, archetype, rank, shareUrl: shareUrlProp, mintExplorerUrl }: ChallengeSheetProps) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const appUrl = getAppUrl() + window.location.pathname;
  const shareUrl = shareUrlProp || mintExplorerUrl || appUrl;
  const shareMessage = `I just got my World Cup Aura Card — ${rarity} ${archetype} with ${rank} rank. Bet yours can't top it 👊 Get yours: ${shareUrl}`;
  const encodedMsg = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(shareUrl);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      trackShareAuraCard("challenge_copy_link");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      trackShareAuraCard("challenge_native_share");
      await navigator.share({ title: "My World Cup Aura Card", text: shareMessage, url: shareUrl });
    } catch {
      /* user dismissed */
    }
  };

  const platforms = [
    {
      label: "WhatsApp",
      emoji: "💬",
      color: "#25D366",
      border: "none",
      href: `https://wa.me/?text=${encodedMsg}`,
    },
    {
      label: "X / Twitter",
      emoji: "𝕏",
      color: "#1a1a1a",
      border: "1px solid rgba(255,255,255,0.2)",
      href: `https://twitter.com/intent/tweet?text=${encodedMsg}`,
    },
    {
      label: "Facebook",
      emoji: "f",
      color: "#1877F2",
      border: "none",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMsg}`,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#0D1117] border-t border-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.7)] overflow-hidden"
            style={{ maxHeight: "92dvh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92dvh - 32px)" }}>
              {/* Headline */}
              <div className="text-center mb-4 mt-2">
                <h2 className="text-2xl font-display font-black text-white uppercase tracking-wide leading-tight">
                  🔥 Think your card<br />can beat mine?
                </h2>
                <p className="text-sm text-gray-400 mt-1">Show the world what you're made of</p>
              </div>

              {/* Full card preview */}
              <div className="flex justify-center mb-5">
                {cardDataUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                  >
                    <div
                      className="relative rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(255,215,0,0.18),0_8px_32px_rgba(0,0,0,0.7)]"
                      style={{ width: "min(70vw, 240px)" }}
                    >
                      <img
                        src={cardDataUrl}
                        alt="Your Aura Card"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5"
                    style={{ width: "min(70vw, 240px)", aspectRatio: "2/3" }}
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    <span className="text-xs text-gray-500">Loading card…</span>
                  </div>
                )}
              </div>

              {/* Pre-written message */}
              <div className="bg-black/50 rounded-2xl border border-white/10 p-4 mb-5 text-sm text-gray-300 leading-relaxed">
                {shareMessage}
              </div>

              {/* Platform share buttons */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {platforms.map((p) => (
                  <a
                    key={p.label}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShareAuraCard(`challenge_${p.label.toLowerCase().replace(/[\s/]/g, "_")}`)}
                    className="flex flex-col items-center gap-2 py-3 rounded-2xl border border-white/10 bg-black/40 hover:border-white/30 transition-colors"
                  >
                    <span
                      className="flex items-center justify-center h-10 w-10 rounded-full text-white font-black text-lg"
                      style={{ backgroundColor: p.color, border: p.border }}
                    >
                      {p.emoji}
                    </span>
                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">{p.label}</span>
                  </a>
                ))}
              </div>

              {/* Copy link + More row */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="h-12 bg-black/50 border-white/20 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-black/70 hover:border-white/40"
                >
                  {copied ? <Check className="mr-2 h-4 w-4 text-green-400" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy link"}
                </Button>

                {"share" in navigator && (
                  <Button
                    onClick={handleNativeShare}
                    className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider rounded-xl"
                  >
                    <Share2 className="mr-2 h-4 w-4" /> More
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
