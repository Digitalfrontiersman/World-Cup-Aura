import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Check, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackShareAuraCard } from "@/lib/analytics";

export interface ShareSlide {
  id: string;
  label: string;
  description: string;
  dataUrl: string | null;
}

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  slides: ShareSlide[];
  caption: string;
  shareUrl: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 220 : -220, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -220 : 220, opacity: 0 }),
};

export function ShareSheet({ open, onClose, slides, caption, shareUrl }: ShareSheetProps) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImg, setCopiedImg] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Always open on slide 1 (Just the Card)
  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  const slide = slides[Math.min(idx, slides.length - 1)];

  const goTo = (nextIdx: number) => {
    setDir(nextIdx > idx ? 1 : -1);
    setIdx(nextIdx);
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (dx < -40 && idx < slides.length - 1) goTo(idx + 1);
    else if (dx > 40 && idx > 0) goTo(idx - 1);
  };

  const handleDownload = () => {
    const dataUrl = slide?.dataUrl;
    if (!dataUrl) return;
    trackShareAuraCard("download");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `AuraCard-${slide.id}.png`;
    a.click();
  };

  const handleCopyImage = async () => {
    const dataUrl = slide?.dataUrl;
    if (!dataUrl) return;
    try {
      const blob = dataUrlToBlob(dataUrl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      trackShareAuraCard("copy_image");
      setCopiedImg(true);
      setTimeout(() => setCopiedImg(false), 2000);
    } catch {
      handleDownload();
    }
  };

  const handleNativeShare = async () => {
    const dataUrl = slide?.dataUrl;
    if (!dataUrl) return;
    try {
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], `AuraCard-${slide.id}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        trackShareAuraCard("native_share_file");
        await navigator.share({ files: [file], title: "My World Cup Aura Card", text: caption });
      } else if (navigator.share) {
        trackShareAuraCard("native_share_url");
        await navigator.share({ title: "My World Cup Aura Card", text: caption, url: shareUrl });
      } else {
        handleDownload();
      }
    } catch {
      /* dismissed */
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackShareAuraCard("copy_link");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch { /* ignore */ }
  };

  const encodedCaption = encodeURIComponent(caption);
  const captionWithUrl = `${caption} ${shareUrl}`;
  const encodedCaptionWithUrl = encodeURIComponent(captionWithUrl);
  const encodedUrl = encodeURIComponent(shareUrl);

  const socials = [
    {
      label: "X / Twitter",
      emoji: "𝕏",
      color: "#1a1a1a",
      border: "1px solid rgba(255,255,255,0.2)",
      href: `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      emoji: "💬",
      color: "#25D366",
      border: "none",
      href: `https://wa.me/?text=${encodedCaptionWithUrl}`,
    },
    {
      label: "Facebook",
      emoji: "f",
      color: "#1877F2",
      border: "none",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`,
    },
  ];

  const hasNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#0D1117] border-t border-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.7)]"
            style={{ maxHeight: "92dvh" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-5 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92dvh - 32px)" }}>
              <div className="text-center mb-3 mt-1">
                <h2 className="text-xl font-display font-black text-white uppercase tracking-wide">Share Your Card</h2>
                <p className="text-xs text-gray-500 mt-0.5">Swipe to choose a format</p>
              </div>

              {/* Carousel */}
              <div
                className="relative overflow-hidden mb-2"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.div
                    key={idx}
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", damping: 32, stiffness: 320 }}
                    className="flex flex-col items-center gap-2 py-1"
                  >
                    <div
                      className="flex items-center justify-center w-full rounded-2xl bg-black/30"
                      style={{ height: 224 }}
                    >
                      {slide?.dataUrl ? (
                        <img
                          src={slide.dataUrl}
                          alt={slide?.label}
                          className="max-h-full max-w-full rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)] object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <Loader2 className="h-7 w-7 animate-spin" />
                          <span className="text-xs">Generating…</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-white font-bold text-sm">{slide?.label}</p>
                      <p className="text-gray-500 text-xs">{slide?.description}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dot indicators */}
              <div className="flex justify-center gap-2 mb-4">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`transition-all duration-200 rounded-full ${
                      i === idx ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/25 hover:bg-white/40"
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className={`grid gap-2 mb-3 ${hasNativeShare ? "grid-cols-2" : "grid-cols-2"}`}>
                <Button
                  onClick={handleDownload}
                  disabled={!slide?.dataUrl}
                  className="h-11 bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wider rounded-xl text-xs"
                >
                  <Download className="mr-1.5 h-4 w-4" /> Download
                </Button>

                <Button
                  onClick={handleCopyImage}
                  disabled={!slide?.dataUrl}
                  variant="outline"
                  className="h-11 bg-black/50 border-white/20 text-white font-bold uppercase tracking-wider rounded-xl text-xs hover:bg-black/70 hover:border-white/40"
                >
                  {copiedImg ? (
                    <Check className="mr-1.5 h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" />
                  )}
                  {copiedImg ? "Copied!" : "Copy Image"}
                </Button>

                {hasNativeShare && (
                  <Button
                    onClick={handleNativeShare}
                    disabled={!slide?.dataUrl}
                    className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider rounded-xl text-xs"
                  >
                    <Share2 className="mr-1.5 h-4 w-4" /> Share…
                  </Button>
                )}

                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className={`h-11 bg-black/50 border-white/20 text-white font-bold uppercase tracking-wider rounded-xl text-xs hover:bg-black/70 hover:border-white/40 ${!hasNativeShare ? "col-span-2" : ""}`}
                >
                  {copiedLink ? (
                    <Check className="mr-1.5 h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="mr-1.5 h-4 w-4" />
                  )}
                  {copiedLink ? "Link Copied!" : "Copy Link"}
                </Button>
              </div>

              {/* Social platform buttons */}
              <div className="grid grid-cols-3 gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackShareAuraCard(s.label.toLowerCase().replace(/[\s/]/g, "_"))}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border border-white/10 bg-black/40 hover:border-white/30 transition-colors"
                  >
                    <span
                      className="flex items-center justify-center h-9 w-9 rounded-full text-white font-black text-base"
                      style={{ backgroundColor: s.color, border: s.border }}
                    >
                      {s.emoji}
                    </span>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide">{s.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
