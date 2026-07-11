import { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Download, Share2, Swords, RotateCcw, Camera, Upload, User, ChevronRight, ChevronDown, Trophy, Zap, ScanLine, Sparkles, Loader2, Check, Copy, ExternalLink, Flame, Layers, X } from "lucide-react";
import { ParticleSparks, HaloRing, RarityRevealOverlay, getRarityEffect } from "@/components/RarityEffects";
import { ChallengeSheet } from "@/components/ChallengeSheet";
import { ShareSheet } from "@/components/ShareSheet";
import { CommunityWall } from "@/components/CommunityWall";
import { CommunityCarousel } from "@/components/CommunityCarousel";
import { RarityReveal } from "@/components/RarityReveal";
import { VerifyOnChain } from "@/components/VerifyOnChain";
import { PlayerMatch } from "@/components/PlayerMatch";
import { WalletConnect } from "@/components/WalletConnect";
import { AuroraBackground } from "@/components/AuroraBackground";
import { MintingCinematic } from "@/components/MintingCinematic";
import { rarityColor } from "@/lib/rarity";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { NATION_FLAGS, FLAG_NATIONS } from "../lib/nations";
import { calculateAuraScore } from "../lib/scoring";
import { getAppUrl } from "../lib/utils";
import { getWalletAddress } from "../lib/solanaWallet";
import { trackStep, trackPurchase, trackViewContent, trackGenerateAuraCard, trackShareAuraCard } from "../lib/analytics";
import { useGetMintStatus, useMintAuraCard, useSaveAuraCard, useGetRarityStats, useUpdateAuraCardImage } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas-pro";
import confetti from "canvas-confetti";

type Step = "landing" | "photo" | "quiz" | "scanner" | "result";


class TransformError extends Error {
  constructor(
    public readonly kind: "capacity" | "ai_error",
    message: string,
  ) {
    super(message);
    this.name = "TransformError";
  }
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

const QUIZ_STEP_NAMES = [
  "Your Name",
  "Your Nation",
  "Matchday Energy",
  "Greatest Weapon",
  "Fan Flaw",
  "Belief Level",
  "Walkout Vibe",
] as const;

// Animated counter component for numbers
function CountUp({ to, duration = 2 }: { to: number, duration?: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = to / (duration * 60); // 60fps
    const handle = setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        clearInterval(handle);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(handle);
  }, [to, duration]);

  return <span>{count}</span>;
}

const RARITY_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  // New canonical tier names
  Core:      { color: "#cbd5e1", border: "rgba(203,213,225,0.55)", bg: "rgba(203,213,225,0.12)" },
  Rising:    { color: "#60a5fa", border: "rgba(96,165,250,0.55)",  bg: "rgba(96,165,250,0.15)"  },
  Elite:     { color: "#22d3ee", border: "rgba(34,211,238,0.55)",  bg: "rgba(34,211,238,0.15)"  },
  Icon:      { color: "#c084fc", border: "rgba(192,132,252,0.55)", bg: "rgba(192,132,252,0.15)" },
  Legendary: { color: "#fbbf24", border: "rgba(251,191,36,0.55)",  bg: "rgba(251,191,36,0.15)"  },
  Mythic:    { color: "#fb7185", border: "rgba(251,113,133,0.6)",  bg: "rgba(251,113,133,0.16)" },
  // Legacy names for backward compat
  Common: { color: "#cbd5e1", border: "rgba(203,213,225,0.55)", bg: "rgba(203,213,225,0.12)" },
  Rare:   { color: "#60a5fa", border: "rgba(96,165,250,0.55)",  bg: "rgba(96,165,250,0.15)"  },
  Epic:   { color: "#c084fc", border: "rgba(192,132,252,0.55)", bg: "rgba(192,132,252,0.15)" },
};
const getRarityStyle = (rarity: string) => RARITY_STYLES[rarity] || RARITY_STYLES.Core;

type Gender = "Woman" | "Man";

const GENDER_LABELS: Gender[] = ["Woman", "Man"];

function getAuraTier(aura: number): string {
  if (aura <= 33) return "Street Warrior";
  if (aura <= 50) return "Rising Star";
  if (aura <= 67) return "Club Legend";
  if (aura <= 83) return "National Hero";
  if (aura <= 93) return "World Class";
  return "Mythic Champion";
}

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [photo, setPhoto] = useState<string | null>(null);
  // When the landing "Upload" button routes into the photo step, remember to
  // auto-open the file picker so the button does what it says.
  const [photoIntent, setPhotoIntent] = useState<"upload" | null>(null);
  const [gender, setGender] = useState<Gender | null>(() => {
    try {
      const stored = localStorage.getItem("aura:gender");
      return (GENDER_LABELS.includes(stored as Gender) ? stored : null) as Gender | null;
    } catch {
      return null;
    }
  });
  const [quizState, setQuizState] = useState({
    name: "",
    nation: "",
    energy: "",
    weapon: "",
    flaw: "",
    confidence: 50,
    walkout: ""
  });
  const [quizStep, setQuizStep] = useState(0);
  const [quizDirection, setQuizDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [transformStatus, setTransformStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [transformErrorKind, setTransformErrorKind] = useState<"capacity" | "ai_error" | null>(null);
  const [capacityCountdown, setCapacityCountdown] = useState<number | null>(null);
  const capacityRetryUsedRef = useRef(false);
  const [scanMsgIndex, setScanMsgIndex] = useState(0);

  const [recipientInput, setRecipientInput] = useState("");
  const [useTempWallet, setUseTempWallet] = useState(false);
  const { publicKey: connectedWalletKey, connected: walletConnected } = useWallet();
  const [copied, setCopied] = useState(false);
  const [remixCount, setRemixCount] = useState(0);
  const [remixForging, setRemixForging] = useState(false);
  const [remixResolvedCount, setRemixResolvedCount] = useState(0);
  const [remixVariants, setRemixVariants] = useState<(string | null)[]>([null, null, null]);
  const [remixPickerOpen, setRemixPickerOpen] = useState(false);
  const [remixSelectedIndex, setRemixSelectedIndex] = useState(0);
  const remixFocusMode = remixPickerOpen || remixForging;
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareAssets, setShareAssets] = useState<{ just: string | null; prophecy: string | null; story: string | null }>({ just: null, prophecy: null, story: null });
  const [shareGenerating, setShareGenerating] = useState(false);

  // Rarity reveal - true only on a fresh card generation, never on revisit/share
  const [isFirstReveal, setIsFirstReveal] = useState(false);
  const handleRevealComplete = useCallback(() => setIsFirstReveal(false), []);

  const [cardSlug, setCardSlug] = useState<string | null>(null);
  const [serverRarity, setServerRarity] = useState<string | null>(null);
  const [editionNumber, setEditionNumber] = useState<number | null>(null);
  const [vrfTxSig, setVrfTxSig] = useState<string | null>(null);

  const effectiveRarity = serverRarity ?? result?.rarity ?? "Core";
  const rarityStyle = getRarityStyle(effectiveRarity);
  const [rarityOddsOpen, setRarityOddsOpen] = useState(false);
  const [showRarityReveal, setShowRarityReveal] = useState(false);
  // Track which card slugs have already shown the reveal (persisted in localStorage
  // so a page refresh does not replay the animation for an already-seen card).
  const revealedSlugsRef = useRef<Set<string>>(
    (() => {
      try {
        const raw = localStorage.getItem("aura:revealedSlugs");
        return new Set<string>(raw ? JSON.parse(raw) : []);
      } catch {
        return new Set<string>();
      }
    })()
  );

  const mintStatusQuery = useGetMintStatus();
  const rarityStatsQuery = useGetRarityStats({ query: { staleTime: 60_000 } } as never);
  const mintMutation = useMintAuraCard();
  const mintResult = mintMutation.data ?? null;
  const saveCardMutation = useSaveAuraCard();
  const updateCardImageMutation = useUpdateAuraCardImage();

  const cardRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const communityWallRef = useRef<HTMLDivElement>(null);
  const vrfSlugRef = useRef<string | null>(null);
  const remixVrfSlugsRef = useRef<(string | null)[]>([null, null, null]);
  // The VRF seed committed on-chain, tracked in parallel with the slug so the
  // result screen can re-derive (and prove) the card's archetype from it.
  const vrfSeedRef = useRef<string | null>(null);
  const remixVrfSeedsRef = useRef<(string | null)[]>([null, null, null]);
  const [vrfProof, setVrfProof] = useState<{ seedHex: string; archetype: string } | null>(null);
  const { toast } = useToast();

  // Camera capture state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera isn't available on this device. Please upload a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setPhoto(null);
      setCameraActive(true);
    } catch {
      setCameraError("Camera access was blocked. Allow camera permission or upload a photo instead.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror so the still matches the selfie preview the user sees
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/png"));
    stopCamera();
  };

  // Attach the live stream once the video element is mounted
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Stop the camera when leaving the photo step or unmounting
  useEffect(() => {
    if (step !== "photo") stopCamera();
  }, [step]);

  // Preload all flag images while the user is still on the landing screen
  useEffect(() => {
    FLAG_NATIONS.forEach(nation => {
      const code = NATION_FLAGS[nation];
      const img = new Image();
      img.src = `https://flagcdn.com/w80/${code}.png`;
    });
  }, []);

  // Fire a funnel event each time the user reaches a new step.
  // quiz_start fires when the quiz step first becomes active;
  // quiz_complete and mint events are fired at the callsite instead.
  useEffect(() => {
    const stepEventMap: Record<typeof step, string> = {
      landing: "aura_step_landing",
      photo: "aura_step_photo",
      quiz: "aura_step_quiz_start",
      scanner: "aura_step_scanning",
      result: "aura_step_result",
    };
    trackStep(stepEventMap[step]);
  }, [step]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // 3D Card Hover state
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const rotateX = useTransform(cardY, [-100, 100], [10, -10]);
  const rotateY = useTransform(cardX, [-100, 100], [-10, 10]);
  // Holographic foil highlight position, following the pointer/gyro across the card.
  const holoX = useTransform(cardX, [-150, 150], ["0%", "100%"]);
  const holoY = useTransform(cardY, [-150, 150], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    cardX.set(x);
    cardY.set(y);
  };

  const handleMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

  // Best-effort gyroscope tilt on the result card (mostly Android mobile). No iOS
  // permission prompt is triggered; if orientation is unavailable the card simply
  // stays put and pointer tilt still works on desktop.
  useEffect(() => {
    if (step !== "result") return;
    const handle = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const gx = Math.max(-30, Math.min(30, e.gamma)); // left-right
      const gy = Math.max(-30, Math.min(30, e.beta - 45)); // front-back, centred
      cardX.set((gx / 30) * 60);
      cardY.set((gy / 30) * 60);
    };
    window.addEventListener("deviceorientation", handle);
    return () => window.removeEventListener("deviceorientation", handle);
  }, [step, cardX, cardY]);

  const scanMessages = [
    "Scanning fan aura...",
    "Detecting delusion...",
    "Measuring loyalty...",
    "Calculating power level...",
    "Forging your final form...",
    "Igniting aura core...",
    "Finalizing legend..."
  ];

  useEffect(() => {
    if (step !== "scanner") return;
    setScanMsgIndex(0);
    const interval = setInterval(() => {
      setScanMsgIndex((i) => (i + 1) % scanMessages.length);
    }, 8500); // spread across 60s
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== "quiz") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextQuizStep();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevQuizStep();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step, quizStep, quizState]);

  const srcToBase64 = (src: string): Promise<string> =>
    fetch(src)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );

  // gpt-image-1 edits typically take ~60-70s; give each attempt headroom so a
  // slow-but-successful generation isn't aborted prematurely.
  const TRANSFORM_TIMEOUT_MS = 120000;
  const TRANSFORM_MAX_ATTEMPTS = 4;

  // Requests the AI portrait, retrying on rate limiting (429) and transient
  // server/network errors with exponential backoff. Throws a TransformError
  // with kind="capacity" when every attempt was rejected due to the server
  // being at capacity (429), or kind="ai_error" for all other failures.
  const requestTransform = async (
    finalResult: any,
    styleVariant?: "realistic" | "comic" | "fantasy",
  ): Promise<{ image: string; vrfSlug?: string; vrfSeedHex?: string; vrfSlot?: number; vrfArchetype?: string; vrfProphecy?: string; vrfStatDeltas?: Record<string, number> }> => {
    const base64 = photo ? await srcToBase64(photo) : null;
    if (!base64) throw new TransformError("ai_error", "No photo to transform");

    let lastError: unknown = null;
    let allCapacity = true; // stays true only if every retryable failure is 429

    for (let attempt = 0; attempt < TRANSFORM_MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TRANSFORM_TIMEOUT_MS);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/aura/transform`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            image: base64,
            nation: finalResult.nation,
            archetype: finalResult.archetype,
            energy: quizState.energy,
            walkout: quizState.walkout,
            weapon: quizState.weapon,
            ...(styleVariant ? { styleVariant } : {}),
            ...(gender ? { gender } : {}),
            auraTier: getAuraTier(finalResult.aura ?? 50),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const image: string | null = data.image ?? null;
          if (image) return {
            image,
            vrfSlug: data.vrfSlug as string | undefined,
            vrfSeedHex: data.vrfSeedHex as string | undefined,
            vrfSlot: data.vrfSlot as number | undefined,
            vrfArchetype: data.vrfArchetype as string | undefined,
            vrfProphecy: data.vrfProphecy as string | undefined,
            vrfStatDeltas: data.vrfStatDeltas as Record<string, number> | undefined,
          };
          allCapacity = false;
          lastError = new Error("Transform returned no image");
        } else if (res.status === 429) {
          // Only treat as capacity when the server explicitly says so.
          let body: Record<string, unknown> = {};
          try { body = await res.json(); } catch { /* ignore */ }
          if (body.reason === "capacity_rejected") {
            // Server at capacity - retryable; keep allCapacity = true.
            lastError = new Error(`Transform rejected (capacity)`);
          } else {
            // Other rate-limit (e.g. per-IP limiter) - not a capacity issue.
            allCapacity = false;
            lastError = new Error(`Transform rejected (429)`);
          }
        } else if (res.status >= 500) {
          // Transient upstream failure - retryable but not a capacity issue.
          allCapacity = false;
          lastError = new Error(`Transform failed (${res.status})`);
        } else {
          // Client error (400/413/etc.) - retrying won't help.
          allCapacity = false;
          throw new TransformError("ai_error", `Transform rejected (${res.status})`);
        }
      } catch (err) {
        if (err instanceof TransformError) throw err;
        // AbortError (timeout) and network failures are retryable but not capacity.
        allCapacity = false;
        lastError = err;
      } finally {
        clearTimeout(timeout);
      }

      if (attempt < TRANSFORM_MAX_ATTEMPTS - 1) {
        const backoff = Math.min(8000, 1000 * 2 ** attempt) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }

    const kind = allCapacity ? "capacity" : "ai_error";
    throw new TransformError(kind, String(lastError ?? "Transform failed"));
  };

  const retryTransform = async () => {
    if (!result || !photo) return;
    setCapacityCountdown(null);
    setTransformStatus("loading");
    setTransformErrorKind(null);
    try {
      const transformResult = await requestTransform(result);
      setTransformedImage(transformResult.image);
      if (transformResult.vrfSlug) vrfSlugRef.current = transformResult.vrfSlug;
      if (transformResult.vrfSeedHex) vrfSeedRef.current = transformResult.vrfSeedHex;
      setTransformStatus("success");
    } catch (err) {
      setTransformedImage(null);
      setTransformStatus("error");
      setTransformErrorKind(err instanceof TransformError ? err.kind : "ai_error");
    }
  };

  // Auto-retry once with a visible countdown when the server is at capacity.
  // The one-shot guard (capacityRetryUsedRef) prevents this from looping if
  // the retry itself also hits capacity - in that case the permanent error UI shows.
  useEffect(() => {
    if (transformStatus !== "error" || transformErrorKind !== "capacity") {
      setCapacityCountdown(null);
      return;
    }
    // Only auto-retry once per generation attempt.
    if (capacityRetryUsedRef.current) return;
    capacityRetryUsedRef.current = true;
    let remaining = 5;
    setCapacityCountdown(remaining);
    const iv = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(iv);
        setCapacityCountdown(null);
        retryTransform();
      } else {
        setCapacityCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(iv);
    // retryTransform reference is stable within a render; deps on status/kind is sufficient
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformStatus, transformErrorKind]);

  const MAX_REMIXES = 2;

  const STYLE_VARIANTS: Array<"realistic" | "comic" | "fantasy"> = ["realistic", "comic", "fantasy"];
  const STYLE_LABELS: Record<string, string> = {
    realistic: "Cinematic",
    comic: "Comic Art",
    fantasy: "Fantasy",
  };

  const handleRemix = async () => {
    if (!result || !photo || remixCount >= MAX_REMIXES || transformStatus === "loading" || remixForging) return;
    setRemixCount(c => c + 1);
    setRemixForging(true);
    setRemixResolvedCount(0);
    setRemixVariants([null, null, null]);
    setRemixSelectedIndex(0);

    const settled = [null as string | null, null as string | null, null as string | null];

    const promises = STYLE_VARIANTS.map((variant, i) =>
      requestTransform(result, variant)
        .then((tr) => {
          settled[i] = tr.image;
          remixVrfSlugsRef.current[i] = tr.vrfSlug ?? null;
          remixVrfSeedsRef.current[i] = tr.vrfSeedHex ?? null;
          setRemixResolvedCount(c => c + 1);
          setRemixVariants([...settled]);
        })
        .catch(() => {
          settled[i] = null;
          setRemixResolvedCount(c => c + 1);
          setRemixVariants([...settled]);
        })
    );

    await Promise.allSettled(promises);

    setRemixForging(false);
    // Open picker if at least one variation succeeded
    if (settled.some(Boolean)) {
      setRemixSelectedIndex(settled.findIndex(Boolean));
      setRemixPickerOpen(true);
    } else {
      toast({ title: "Remix failed", description: "None of the 3 portrait variations could be generated. Try again.", variant: "destructive" });
    }
  };

  const handleRemixConfirm = () => {
    const chosen = remixVariants[remixSelectedIndex];
    if (chosen) {
      setTransformedImage(chosen);
      setTransformStatus("success");
    }
    setRemixPickerOpen(false);
  };

  const handleRemixCancel = () => {
    setRemixPickerOpen(false);
  };

  const runScan = async (finalResult: any) => {
    trackStep("aura_step_quiz_complete");
    setStep("scanner");
    capacityRetryUsedRef.current = false;
    setTransformStatus("loading");
    setTransformErrorKind(null);
    setTransformedImage(null);
    let transformed: string | null = null;
    let errorKind: "capacity" | "ai_error" = "ai_error";
    try {
      const transformResult = await requestTransform(finalResult);
      transformed = transformResult.image;
      if (transformResult.vrfSlug) {
        vrfSlugRef.current = transformResult.vrfSlug;
      }
      if (transformResult.vrfSeedHex) {
        vrfSeedRef.current = transformResult.vrfSeedHex;
      }
    } catch (err) {
      errorKind = err instanceof TransformError ? err.kind : "ai_error";
    }
    setTransformedImage(transformed);
    setTransformStatus(transformed ? "success" : "error");
    if (!transformed) setTransformErrorKind(errorKind);
    if (transformed) trackGenerateAuraCard();
    setResult(finalResult);
    setIsFirstReveal(true);
    setStep("result");
    
    // Epic confetti blast
    setTimeout(() => {
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", "#FFA500", "#FF4500"]
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", "#FFA500", "#FF4500"]
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }, 500);
  };

  const handleStart = () => {
    trackViewContent();
    setStep("photo");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhoto(url);
    }
  };

  // Revoke the previous blob: URL whenever the photo changes or the component
  // unmounts, so uploaded selfies don't leak object URLs across retakes.
  // (data:/path photos from the camera and sample avatars are no-ops here.)
  useEffect(() => {
    return () => {
      if (photo && photo.startsWith("blob:")) URL.revokeObjectURL(photo);
    };
  }, [photo]);

  // Best-effort: if the user chose "Upload" on the landing screen, open the file
  // picker once the photo step mounts. If the browser blocks the programmatic
  // click (lost user-activation), they simply see the Upload button - no regression.
  useEffect(() => {
    if (step === "photo" && photoIntent === "upload") {
      fileInputRef.current?.click();
      setPhotoIntent(null);
    }
  }, [step, photoIntent]);

  // When a real wallet connects, use it as the mint destination automatically.
  useEffect(() => {
    if (walletConnected && connectedWalletKey) {
      setRecipientInput(connectedWalletKey.toBase58());
      setUseTempWallet(false);
    }
  }, [walletConnected, connectedWalletKey]);

  const useSampleAvatar = (num: number) => {
    setPhoto(`/avatar-${num}.png`);
  };

  const nextQuizStep = () => {
    if (quizStep === 0 && !quizState.name.trim()) return;
    if (quizStep === 1 && !quizState.nation) return;
    if (quizStep === 2 && !quizState.energy) return;
    if (quizStep === 3 && !quizState.weapon) return;
    if (quizStep === 4 && !quizState.flaw) return;
    if (quizStep === 6 && !quizState.walkout) return;

    setQuizDirection(1);
    if (quizStep < 6) {
      setQuizStep(q => q + 1);
    } else {
      const finalResult = calculateAuraScore(quizState);
      runScan(finalResult);
    }
  };

  const prevQuizStep = () => {
    if (quizStep > 0) {
      setQuizDirection(-1);
      setQuizStep(q => q - 1);
    }
  };

  const navToStep = (target: number) => {
    if (target < quizStep) {
      setQuizDirection(-1);
      setQuizStep(target);
    }
  };

  // Auto-advance for single-select questions; passes updated state directly
  // to calculateAuraScore on the final step so the setter batch doesn't matter.
  const selectAndAdvance = (field: string, value: string) => {
    const newState = { ...quizState, [field]: value };
    setQuizState(newState);
    setQuizDirection(1);
    if (quizStep < 6) {
      setQuizStep(q => q + 1);
    } else {
      const finalResult = calculateAuraScore(newState);
      runScan(finalResult);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -80) nextQuizStep();
    else if (dx > 80) prevQuizStep();
  };

  const captureCard = async (): Promise<HTMLCanvasElement> => {
    if (!captureRef.current) throw new Error("Card is not ready to capture yet.");
    await document.fonts.ready;
    return await html2canvas(captureRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      width: 400,
      height: 600,
    });
  };

  const handleDownload = async () => {
    const canvas = await captureCard();
    const image = canvas.toDataURL("image/png");
    trackShareAuraCard("download_result");
    const link = document.createElement("a");
    link.href = image;
    link.download = `AuraCard-${result?.id || "draft"}.png`;
    link.click();
  };

  const captureCardDataUrl = async (): Promise<string> => {
    const canvas = await captureCard();
    return canvas.toDataURL("image/png");
  };

  // Fire the rarity reveal once per card after the save mutation returns
  // the server-assigned tier.  Uses a localStorage-backed Set so a hard refresh
  // doesn't replay the animation for a card that has already been revealed.
  useEffect(() => {
    if (!serverRarity || !cardSlug) return;
    if (revealedSlugsRef.current.has(cardSlug)) return;

    revealedSlugsRef.current.add(cardSlug);
    try {
      localStorage.setItem(
        "aura:revealedSlugs",
        JSON.stringify([...revealedSlugsRef.current].slice(-200))
      );
    } catch { /* quota - ignore */ }

    setShowRarityReveal(true);
  }, [serverRarity, cardSlug]);

  // Pre-render all three share formats after the AI portrait is ready.
  // Runs whenever transformStatus transitions to "success" on the result screen
  // (including after a remix). The 600ms delay lets card entrance animations settle.
  useEffect(() => {
    if (transformStatus !== "success" || step !== "result" || !result) return;
    setShareAssets({ just: null, prophecy: null, story: null });
    setCardSlug(null);

    const go = async () => {
      if (!captureRef.current) return;
      setShareGenerating(true);
      try {
        // First capture: used only for the API payload (rarity/edition not yet known from server)
        const initialCapture = await captureCard();
        const justDataUrlForApi = initialCapture.toDataURL("image/png");

        // Await the save so we have both the server-assigned rarity and edition number
        // before building share assets
        let base = initialCapture;
        try {
          const res = await saveCardMutation.mutateAsync({ data: { card: result, imageDataUrl: justDataUrlForApi, ...(vrfSlugRef.current ? { vrfSlug: vrfSlugRef.current } : {}) } });
          // Flush state updates synchronously so the capture div re-renders with both
          // the correct server rarity and the edition stamp before we take the final screenshot
          flushSync(() => {
            setCardSlug(res.slug);
            setServerRarity(res.rarity);
            setEditionNumber(res.editionNumber);
            if (res.vrfTxSig) setVrfTxSig(res.vrfTxSig);
            if (vrfSeedRef.current) {
              setVrfProof({ seedHex: vrfSeedRef.current, archetype: String((result as { archetype?: string }).archetype ?? "") });
            }
          });
          // Re-capture with the server-assigned rarity and edition stamp now visible in the DOM
          base = await captureCard();
          // Update the stored image in the DB so the community wall shows the
          // correct final card (with edition stamp + server-assigned rarity badge)
          try {
            await updateCardImageMutation.mutateAsync({
              slug: res.slug,
              data: { imageDataUrl: base.toDataURL("image/png") },
            });
          } catch {
            // Non-critical - community wall will show the pre-stamp version
          }
        } catch {
          // Save failed - share assets will be built without server rarity/edition stamp,
          // slug/rarity will fall back to client-side values
        }


        // --- Slide 1: Just the card ---
        const justDataUrl = base.toDataURL("image/png");

        // --- Slide 2: Card + prophecy overlay ---
        const pc = document.createElement("canvas");
        pc.width = base.width;
        pc.height = base.height;
        const pctx = pc.getContext("2d")!;
        pctx.drawImage(base, 0, 0);

        const W = pc.width, H = pc.height;
        if (result.prophecy) {
          const grd = pctx.createLinearGradient(0, H * 0.56, 0, H);
          grd.addColorStop(0, "rgba(0,0,0,0)");
          grd.addColorStop(1, "rgba(0,0,0,0.9)");
          pctx.fillStyle = grd;
          pctx.fillRect(0, H * 0.56, W, H * 0.44);

          const fontSize = Math.max(14, Math.floor(W * 0.046));
          pctx.font = `italic ${fontSize}px Georgia, serif`;
          pctx.fillStyle = "rgba(255,255,255,0.93)";
          pctx.textAlign = "center";

          const words = result.prophecy.split(" ");
          const maxLineW = W * 0.84;
          const lineH = fontSize * 1.45;
          let line = "";
          const lines: string[] = [];
          for (const word of words) {
            const test = line + word + " ";
            if (pctx.measureText(test).width > maxLineW && line) {
              lines.push(line.trim());
              line = word + " ";
            } else {
              line = test;
            }
          }
          if (line.trim()) lines.push(line.trim());

          const textBlockH = lines.length * lineH;
          let ty = H * 0.82 - textBlockH / 2 + fontSize;
          for (const l of lines) {
            pctx.fillText(l, W / 2, ty);
            ty += lineH;
          }
        }
        const prophecyDataUrl = pc.toDataURL("image/png");

        // --- Slide 3: 9:16 Story format ---
        const SW = 1080, SH = 1920;
        const sc = document.createElement("canvas");
        sc.width = SW;
        sc.height = SH;
        const sctx = sc.getContext("2d")!;

        const bgGrd = sctx.createLinearGradient(0, 0, 0, SH);
        bgGrd.addColorStop(0, "#050816");
        bgGrd.addColorStop(0.45, "#0c1a2e");
        bgGrd.addColorStop(1, "#050816");
        sctx.fillStyle = bgGrd;
        sctx.fillRect(0, 0, SW, SH);

        const glowGrd = sctx.createRadialGradient(SW / 2, SH / 2, 0, SW / 2, SH / 2, SW * 0.7);
        glowGrd.addColorStop(0, "rgba(251,191,36,0.1)");
        glowGrd.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = glowGrd;
        sctx.fillRect(0, 0, SW, SH);

        const cardAspect = base.width / base.height;
        const cW = SW * 0.8;
        const cH = cW / cardAspect;
        const cX = (SW - cW) / 2;
        const cY = (SH - cH) / 2;

        sctx.shadowColor = "rgba(251,191,36,0.4)";
        sctx.shadowBlur = 64;
        sctx.drawImage(base, cX, cY, cW, cH);
        sctx.shadowBlur = 0;
        sctx.shadowColor = "transparent";

        const fanName = (result.name || "Fan").toUpperCase();
        sctx.textAlign = "center";
        sctx.fillStyle = "rgba(251,191,36,0.95)";
        sctx.font = `900 ${Math.floor(SW * 0.056)}px sans-serif`;
        sctx.fillText(fanName, SW / 2, cY - SW * 0.04);

        sctx.fillStyle = "rgba(255,255,255,0.4)";
        sctx.font = `${Math.floor(SW * 0.036)}px sans-serif`;
        sctx.fillText("MY WORLD CUP AURA CARD", SW / 2, cY + cH + SW * 0.065);

        const storyDataUrl = sc.toDataURL("image/png");

        setShareAssets({ just: justDataUrl, prophecy: prophecyDataUrl, story: storyDataUrl });
      } catch (err) {
        console.error("Share asset generation failed:", err);
      } finally {
        setShareGenerating(false);
      }
    };

    const timer = setTimeout(go, 600);
    return () => clearTimeout(timer);
  }, [transformStatus, step, result, transformedImage]);

  const recipient = (useTempWallet ? getWalletAddress() : recipientInput).trim();
  const mintReady = mintStatusQuery.data?.ready ?? false;
  const mintError = mintMutation.error
    ? (mintMutation.error.data?.error ??
      mintMutation.error.message ??
      "Minting failed. Please try again.")
    : null;

  const handleMint = async () => {
    if (!result) return;
    if (!recipient) {
      toast({
        title: "Wallet address needed",
        description: "Paste a Solana wallet address or use the temporary in-app wallet.",
        variant: "destructive",
      });
      return;
    }
    trackStep("aura_step_mint_start");
    try {
      const image = await captureCardDataUrl();
      const card = {
        id: result.id,
        name: result.name,
        nation: result.nation,
        aura: result.aura,
        power: result.power,
        rank: result.rank,
        rarity: result.rarity,
        archetype: result.archetype,
        prophecy: result.prophecy,
        stats: result.stats,
      };
      await mintMutation.mutateAsync({ data: { image, recipient, card } });
      trackStep("aura_step_mint_success");
      trackPurchase();
      toast({ title: "NFT minted!", description: "Your Aura Card is now in your wallet on Solana devnet." });
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#3b82f6", "#fbbf24"],
      });
    } catch (err) {
      const apiMessage =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : undefined;
      const message =
        apiMessage ??
        (err instanceof Error ? err.message : "Minting failed. Please try again.");
      toast({ title: "Mint failed", description: message, variant: "destructive" });
    }
  };

  const handleCopyMint = async () => {
    if (!mintResult) return;
    try {
      await navigator.clipboard.writeText(mintResult.mintAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures
    }
  };


  const renderQuizQuestion = () => {
    switch (quizStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">What should we call you on your card?</h2>
            <Input 
              value={quizState.name} 
              onChange={e => setQuizState({...quizState, name: e.target.value})}
              onKeyDown={e => { if (e.key === "Enter") nextQuizStep(); }}
              placeholder="Your Name / Nickname"
              className="text-xl h-14 bg-black/50 border-primary/50 text-white placeholder:text-gray-500"
              autoFocus
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-display font-bold text-white">Which nation has your heart?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {FLAG_NATIONS.map(n => {
                const code = NATION_FLAGS[n];
                const selected = quizState.nation === n;
                return (
                  <button
                    key={n}
                    onClick={() => selectAndAdvance("nation", n)}
                    className={`flex flex-col items-center rounded-xl overflow-hidden border-2 transition-all duration-150 bg-black/50 hover:bg-black/70 focus:outline-none ${selected ? "border-primary shadow-[0_0_12px_rgba(251,191,36,0.6)]" : "border-white/10 hover:border-white/30"}`}
                  >
                    <div className="card-shine w-full relative" style={{ aspectRatio: "3/2" }}>
                      <img
                        src={`https://flagcdn.com/w160/${code}.png`}
                        alt={n}
                        width={160}
                        height={107}
                        className="w-full h-full object-cover"
                        loading="eager"
                        draggable={false}
                      />
                      <div className="holo-overlay" />
                    </div>
                    <span className="w-full text-center text-white text-xs py-1.5 px-1 leading-tight font-medium truncate">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">What is your matchday energy?</h2>
            <div className="grid gap-3">
              {["Calm Assassin", "Chaos Mode", "Tactical Genius", "Savage Believer", "Spiritual Supporter", "Delusional Champion"].map(opt => (
                <Button 
                  key={opt} 
                  variant={quizState.energy === opt ? "default" : "outline"}
                  className={`h-14 text-lg justify-start ${quizState.energy === opt ? 'bg-primary text-primary-foreground' : 'bg-black/40 border-gray-700 text-white hover:bg-black/60 hover:border-primary/50'}`}
                  onClick={() => selectAndAdvance("energy", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">Pick your greatest football weapon</h2>
            <div className="grid grid-cols-2 gap-3">
              {["Pure Aura", "Vision", "Speed", "Clutch Energy", "Trash Talk", "Loyalty", "Football IQ", "Chaos"].map(opt => (
                <Button 
                  key={opt} 
                  variant={quizState.weapon === opt ? "default" : "outline"}
                  className={`h-14 text-sm sm:text-base ${quizState.weapon === opt ? 'bg-primary text-primary-foreground' : 'bg-black/40 border-gray-700 text-white hover:bg-black/60 hover:border-primary/50'}`}
                  onClick={() => selectAndAdvance("weapon", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">What is your biggest fan flaw?</h2>
            <div className="grid gap-3">
              {[
                "I blame the referee immediately",
                "I become unbearable when we win",
                "I say \"this is our year\" every year",
                "I get superstitious and irrational",
                "I talk too much before the match",
                "I lose faith, then come back instantly"
              ].map(opt => (
                <Button 
                  key={opt} 
                  variant={quizState.flaw === opt ? "default" : "outline"}
                  className={`h-auto py-3 px-4 text-left whitespace-normal font-normal ${quizState.flaw === opt ? 'bg-primary text-primary-foreground font-medium' : 'bg-black/40 border-gray-700 text-white hover:bg-black/60 hover:border-primary/50'}`}
                  onClick={() => selectAndAdvance("flaw", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-display font-bold text-white">How confident are you that your team can win it all?</h2>
            <div
              className="pt-8 pb-4 px-2"
              onTouchStart={e => e.stopPropagation()}
              onTouchEnd={e => e.stopPropagation()}
            >
              <Slider 
                value={[quizState.confidence]} 
                min={1} 
                max={100} 
                step={1}
                onValueChange={v => setQuizState({...quizState, confidence: v[0]})} 
                className="[&>[role=slider]]:h-6 [&>[role=slider]]:w-6 [&>[role=slider]]:bg-primary [&>[role=slider]]:border-none"
              />
            </div>
            <div className="text-center space-y-2">
              <div className="text-5xl font-display font-bold aura-text-gradient">{quizState.confidence}%</div>
              <div className="text-xl text-primary font-medium">
                {quizState.confidence <= 25 ? "Protect your heart" : 
                 quizState.confidence <= 50 ? "Cautiously faithful" : 
                 quizState.confidence <= 75 ? "Dangerously hopeful" : 
                 quizState.confidence <= 90 ? "Elite belief" : 
                 "Delusion or destiny?"}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">Choose your walkout vibe</h2>
            <div className="grid gap-3">
              {["Final boss energy", "Locked in and silent", "Pure national pride", "Main character mode", "Villain arc activated", "Crowd control"].map(opt => (
                <Button 
                  key={opt} 
                  variant={quizState.walkout === opt ? "default" : "outline"}
                  className={`h-14 text-lg justify-start ${quizState.walkout === opt ? 'bg-primary text-primary-foreground' : 'bg-black/40 border-gray-700 text-white hover:bg-black/60 hover:border-primary/50'}`}
                  onClick={() => selectAndAdvance("walkout", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background relative overflow-hidden font-sans select-none text-foreground">
      {/* Deep base color so the app reads as a refined dark product, not a photo */}
      <div className="absolute inset-0 z-0" style={{ background: "#07070c" }} />

      {/* Subtle stadium texture, kept faint so it never competes with content */}
      <div
        className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-700${step === "landing" ? " landing-bg-pan" : ""}`}
        style={{
          backgroundImage: step === "landing"
            ? "url('/landing-action-bg.png')"
            : "url('/pitch-bg.png')",
          opacity: step === "landing" ? 0.14 : 0.08,
        }}
      />

      {/* Living aurora field (tinted by the card's rarity on the result screen) */}
      <AuroraBackground
        color={
          step === "result"
            ? rarityColor(serverRarity ?? (result?.rarity as string) ?? "Core")
            : undefined
        }
      />

      {/* Vignette: darken edges + bottom so content floats and the palette stays deep */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 8%, rgba(7,7,12,0) 0%, rgba(7,7,12,0.55) 62%, rgba(7,7,12,0.92) 100%)",
        }}
      />

      {/* Persistent wallet connect - always accessible, top-right */}
      <div
        className="absolute right-3 z-40"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <WalletConnect compact />
      </div>

      <main className={`relative z-10 mx-auto w-full min-h-[100dvh] flex flex-col pt-8 pb-12 px-4 transition-[max-width] duration-500 ease-in-out ${step === 'result' ? 'max-w-4xl' : step === 'landing' ? 'max-w-md md:max-w-6xl' : 'max-w-md'}`} style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        
        <AnimatePresence mode="wait">
          {/* LANDING */}
          {step === "landing" && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:content-center py-4"
            >
              {/* Copy block - mobile: 1st; desktop: col-1 row-1 */}
              <motion.div
                className="space-y-4 relative text-center md:text-left md:col-start-1 md:row-start-1"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-primary/40 text-primary text-sm font-bold uppercase tracking-wider mb-1 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Zap size={16} className="text-accent fill-accent" />
                  <span>The Ultimate Fan Experience</span>
                </motion.div>
                <h1
                  className="text-5xl md:text-7xl font-display font-black tracking-tight text-white uppercase italic leading-none pb-1"
                  style={{ textShadow: "0 2px 6px rgba(0,0,0,1), 0 4px 20px rgba(0,0,0,0.9)" }}
                >
                  Unleash Your <br/>
                  <span
                    style={{
                      color: "#FFD700",
                      textShadow: "0 0 1px #000, 0 2px 0px #000, 0 3px 8px rgba(0,0,0,1), 0 6px 24px rgba(0,0,0,0.95), 0 12px 40px rgba(0,0,0,0.7)",
                    }}
                  >World Cup Aura</span>
                </h1>
                <p
                  className="text-white text-lg max-w-[290px] mx-auto md:mx-0 md:max-w-sm font-medium"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,1), 0 3px 12px rgba(0,0,0,0.9)" }}
                >
                  Turn your selfie into a legendary fan card. Pick your nation. Reveal your power level.
                </p>
              </motion.div>

              {/* Card stack - mobile: 2nd; desktop: col-2 spanning both rows */}
              <div className="relative w-full flex items-center justify-center h-[300px] md:h-[460px] overflow-hidden md:col-start-2 md:row-start-1 md:row-span-2">
                {/* Aura glow behind the stack */}
                <motion.div
                  className="absolute w-56 h-56 rounded-full bg-primary/40 blur-[90px] pointer-events-none"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Left back card */}
                <motion.div
                  className="absolute w-40 h-56 glass-panel rounded-xl overflow-hidden shadow-2xl border-secondary/40"
                  style={{ transformOrigin: "bottom center" }}
                  initial={{ opacity: 0, rotate: 0, x: 0, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: -16, x: -88, scale: 0.86, y: [0, -10, 0] }}
                  transition={{
                    opacity: { delay: 0.35, duration: 0.5 },
                    rotate: { delay: 0.35, type: "spring", bounce: 0.5 },
                    x: { delay: 0.35, type: "spring", bounce: 0.5 },
                    scale: { delay: 0.35, type: "spring", bounce: 0.5 },
                    y: { delay: 1, duration: 5, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <img src="/card-action-1.png" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </motion.div>

                {/* Right back card */}
                <motion.div
                  className="absolute w-40 h-56 glass-panel rounded-xl overflow-hidden shadow-2xl border-accent/40"
                  style={{ transformOrigin: "bottom center" }}
                  initial={{ opacity: 0, rotate: 0, x: 0, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 16, x: 88, scale: 0.86, y: [0, -10, 0] }}
                  transition={{
                    opacity: { delay: 0.5, duration: 0.5 },
                    rotate: { delay: 0.5, type: "spring", bounce: 0.5 },
                    x: { delay: 0.5, type: "spring", bounce: 0.5 },
                    scale: { delay: 0.5, type: "spring", bounce: 0.5 },
                    y: { delay: 1.4, duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <img src="/hero-action.png" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </motion.div>

                {/* Center hero card */}
                <motion.div
                  className="relative w-52 h-72 glass-panel rounded-xl overflow-hidden card-shine shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_40px_rgba(34,197,94,0.45)] border-primary/60 z-10"
                  initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: -3, y: [0, -14, 0] }}
                  transition={{
                    opacity: { duration: 0.5 },
                    scale: { type: "spring", bounce: 0.5 },
                    rotate: { type: "spring", bounce: 0.5 },
                    y: { delay: 0.8, duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <img src="/card-action-2.png" alt="Aura Card" className="w-full h-full object-cover object-top filter contrast-125" />
                  <div className="holo-overlay" />
                  {/* Score badge */}
                  <div className="absolute top-3 left-3 z-20 text-center drop-shadow-xl">
                    <div className="text-4xl font-display font-black leading-none gold-text-gradient">94</div>
                    <div className="text-[9px] font-bold uppercase text-white/80 tracking-widest">Aura</div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className="text-white text-base font-display font-black uppercase tracking-wide leading-tight">Mythic Champion</div>
                    <div className="text-primary text-[10px] uppercase font-bold tracking-widest">Legendary Striker</div>
                  </div>
                </motion.div>
              </div>

              {/* CTA buttons - mobile: 3rd; desktop: col-1 row-2 */}
              <motion.div
                className="w-full space-y-3 md:col-start-1 md:row-start-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, type: "spring", bounce: 0.3 }}
              >
                <p className="text-xs text-gray-400 text-center md:text-left uppercase tracking-widest">Unlock Your World Cup Aura Fan Card Now</p>
                <Button onClick={handleStart} className="w-full h-14 text-lg font-black uppercase tracking-wider rounded-xl text-black bg-gradient-to-br from-amber-300 via-primary to-amber-500 border-0 shadow-[0_10px_40px_-8px_hsl(var(--primary)/0.7)] hover:brightness-110">
                  <Camera className="mr-2" /> Take Selfie
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => { setPhotoIntent("upload"); handleStart(); }} variant="outline" className="h-14 bg-black/60 border-gray-700 text-white hover:bg-black/80 hover:border-primary/50">
                    <Upload className="mr-2 h-5 w-5" /> Upload
                  </Button>
                  <Button onClick={handleStart} variant="outline" className="h-14 bg-black/60 border-gray-700 text-white hover:bg-black/80 hover:border-primary/50">
                    <User className="mr-2 h-5 w-5" /> Sample
                  </Button>
                </div>

                {/* Edition collection teaser */}
                <div className="flex items-center justify-center md:justify-start gap-1.5 pt-1">
                  <Layers className="h-3 w-3 text-gray-500 shrink-0" />
                  <span className="text-[11px] text-gray-500">
                    Part of an exclusive 100,000-card collection.{" "}
                  </span>
                  <button
                    onClick={() => setRarityOddsOpen(true)}
                    className="text-[11px] text-primary/80 hover:text-primary underline underline-offset-2 font-semibold transition-colors focus:outline-none"
                  >
                    See the odds →
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* PHOTO STEP */}
          {step === "photo" && (
            <motion.div 
              key="photo"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col space-y-8 pt-4"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-wide">Player Portrait</h2>
                <p className="text-gray-400 font-medium">Snap a selfie or upload a photo for your card.</p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

                <div className="relative w-64 h-80 rounded-2xl overflow-hidden glass-panel border-2 border-primary/50 shadow-[0_0_40px_rgba(255,215,0,0.15)] flex items-center justify-center transition-all">
                  {cameraActive ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                  ) : photo ? (
                    <img src={photo} alt="Player portrait preview" className="w-full h-full object-cover filter contrast-110" />
                  ) : (
                    <div className="text-center space-y-4 p-6">
                      <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
                        <Camera size={36} />
                      </div>
                      <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Take a selfie or upload</p>
                    </div>
                  )}
                </div>

                {cameraActive ? (
                  <div className="mt-8 w-full grid grid-cols-2 gap-3">
                    <Button onClick={capturePhoto} className="h-14 text-base font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                      <Camera className="mr-2 h-5 w-5" /> Capture
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="h-14 bg-black/60 border-gray-700 text-white hover:bg-black/80 hover:border-primary/50">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 w-full grid grid-cols-2 gap-3">
                    <Button onClick={startCamera} className="h-14 text-base font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                      <Camera className="mr-2 h-5 w-5" /> {photo ? "Retake" : "Take Selfie"}
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-14 bg-black/60 border-gray-700 text-white hover:bg-black/80 hover:border-primary/50">
                      <Upload className="mr-2 h-5 w-5" /> Upload
                    </Button>
                  </div>
                )}

                {cameraError && (
                  <p className="mt-4 text-sm text-center text-red-400 font-medium max-w-[260px]">{cameraError}</p>
                )}

                {!photo && !cameraActive && (
                  <div className="mt-8 w-full space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-gray-800"></div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Or use sample</div>
                      <div className="flex-1 h-px bg-gray-800"></div>
                    </div>
                    <div className="flex justify-center gap-6">
                      {[1, 2, 3].map(num => (
                        <button key={num} onClick={() => useSampleAvatar(num)} className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-700 hover:border-primary hover:scale-110 transition-all shadow-lg">
                          <img src={`/avatar-${num}.png`} alt={`Avatar ${num}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Gender toggle */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Depict me as</p>
                <div className="flex rounded-xl overflow-hidden border border-gray-700 bg-black/40">
                  {GENDER_LABELS.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        const next = gender === g ? null : g;
                        setGender(next);
                        try { next ? localStorage.setItem("aura:gender", next) : localStorage.removeItem("aura:gender"); } catch {}
                      }}
                      className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-all ${
                        gender === g
                          ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                disabled={!photo || cameraActive} 
                onClick={() => setStep("quiz")}
                className="w-full h-16 text-lg font-bold uppercase tracking-wider bg-white text-black hover:bg-gray-200 rounded-xl disabled:opacity-50 shadow-xl"
              >
                Continue to Aura Scan <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            </motion.div>
          )}

          {/* QUIZ STEP */}
          {step === "quiz" && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col pt-4"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Scrubber: 7 clickable segments */}
              <div className="flex items-center gap-1.5 mb-10">
                {Array.from({ length: 7 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => navToStep(i)}
                    disabled={i >= quizStep}
                    aria-label={`Go to step ${i + 1}`}
                    className={`flex-1 rounded-full transition-all duration-300 focus:outline-none ${
                      i === quizStep
                        ? 'h-2 bg-primary shadow-[0_0_8px_rgba(255,215,0,0.7)]'
                        : i < quizStep
                        ? 'h-2 bg-primary/50 hover:bg-primary/75 cursor-pointer'
                        : 'h-1.5 bg-gray-700 cursor-default opacity-40'
                    }`}
                  />
                ))}
              </div>

              {/* Step label - animates with each step */}
              <AnimatePresence mode="wait" custom={quizDirection}>
                <motion.p
                  key={quizStep}
                  custom={quizDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-6"
                >
                  {quizStep + 1} / 7 - {QUIZ_STEP_NAMES[quizStep]}
                </motion.p>
              </AnimatePresence>

              {/* Question content - animated per step */}
              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait" custom={quizDirection}>
                  <motion.div
                    key={quizStep}
                    custom={quizDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="w-full"
                  >
                    {renderQuizQuestion()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom actions */}
              <div className="mt-8 pt-6 space-y-3">
                {/* Explicit-confirm button - only for name (0), nation (1), confidence (5) */}
                {[0, 1, 5].includes(quizStep) && (
                  <Button 
                    onClick={nextQuizStep}
                    className="w-full h-16 text-lg font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
                  >
                    Continue <ChevronRight className="ml-2" />
                  </Button>
                )}
                {/* Back button for all steps except first */}
                {quizStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={prevQuizStep}
                    className="w-full h-10 text-gray-500 hover:text-white text-sm"
                  >
                    ← Back
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* SCANNER STEP */}
          {step === "scanner" && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center relative overflow-hidden"
            >
              {/* HUD Background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none mix-blend-screen">
                <img src="/scanner-hud.png" alt="" className="w-full max-w-[400px] animate-spin-slow" style={{ animationDuration: '30s' }} />
              </div>

              {/* Main scanning content - centred vertically in the upper portion */}
              <div className="flex flex-col items-center justify-center flex-1 space-y-8 pt-8 pb-4 w-full z-10">
                <div className="relative w-56 h-72 rounded-xl overflow-hidden border-2 border-primary/30 shadow-[0_0_50px_rgba(255,215,0,0.2)]">
                  {photo && <img src={photo} alt="" className="w-full h-full object-cover filter contrast-125 grayscale-[0.5]" />}
                  <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
                  
                  {/* Scanning Laser Line */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(255,215,0,1)] z-10"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
                    animate={{ top: ["-100%", "100%", "-100%"] }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  />

                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <ScanLine size={56} className="text-primary drop-shadow-[0_0_10px_rgba(255,215,0,1)] animate-pulse" />
                  </div>
                </div>

                <div className="space-y-5 w-full max-w-[300px] relative z-20 glass-panel p-5 rounded-2xl border-primary/30">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={scanMsgIndex}
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      className="text-xl font-display font-black text-primary text-center uppercase tracking-widest drop-shadow-md"
                    >
                      {scanMessages[scanMsgIndex]}
                    </motion.div>
                  </AnimatePresence>
                  
                  <div className="space-y-3">
                    <div className="w-full bg-black/80 h-3 rounded-full overflow-hidden border border-gray-700 shadow-inner relative">
                      {/* Tick marks */}
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMTAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIvPjwvc3ZnPg==')] opacity-50 z-10" />
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent via-primary to-secondary relative z-0"
                        initial={{ width: "2%" }}
                        animate={{ width: "98%" }}
                        transition={{ duration: 60, ease: "linear" }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-primary/80 font-mono font-bold uppercase tracking-widest">
                      <span>Init: 0x4F8A</span>
                      <span className="animate-pulse">Forging...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community carousel - hidden on very short viewports so the HUD always fits,
                  and force-closed when the result arrives via active=false */}
              <div className="[@media(max-height:639px)]:hidden w-full">
                <CommunityCarousel
                  baseUrl={`${import.meta.env.BASE_URL}`}
                  active={step === "scanner"}
                />
              </div>
            </motion.div>
          )}

          {/* RESULT CARD */}
          {step === "result" && result && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 1 }}
              className="flex-1 flex flex-col items-center pb-12 w-full pt-4 perspective-1000 overflow-y-auto"
            >
              {/* Rarity reveal overlay - plays once on fresh card generation */}
              {isFirstReveal && result && (
                <RarityRevealOverlay
                  rarity={result.rarity}
                  onComplete={handleRevealComplete}
                />
              )}

              <div className="text-center mb-8 space-y-1">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-primary font-bold tracking-widest uppercase text-sm"
                >
                  Aura Analyzed
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="text-4xl font-display font-black text-white uppercase tracking-wider"
                >
                  {result.rank}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-xs text-gray-400 max-w-[280px] mx-auto mt-2"
                >
                  Top {Math.max(1, 100 - result.aura)}% of fans globally
                </motion.div>
              </div>

              {/* The Card Container with 3D Tilt */}
              <motion.div 
                className="card-container-3d relative flex justify-center"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY }}
              >
                {(() => {
                  const fx = getRarityEffect(effectiveRarity);
                  return (
                    <>
                      {/* Flames behind the card (Legendary + Mythic) */}
                      {fx.flames && (
                        <div
                          className="absolute -inset-16 z-[-1] pointer-events-none mix-blend-screen"
                          style={{ opacity: effectiveRarity === "Mythic" ? 0.95 : 0.7 }}
                        >
                          <img
                            src="/flames.png"
                            alt=""
                            className="w-full h-full object-cover animate-pulse"
                            style={{ animationDuration: effectiveRarity === "Mythic" ? "1.5s" : "2.5s" }}
                          />
                        </div>
                      )}

                      {/* Halo ring (Mythic only) */}
                      {fx.halo && <HaloRing color={fx.glowColor!} />}

                      {/* Particle sparks floating around the card (Icon / Legendary / Mythic) */}
                      {fx.particles > 0 && (
                        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                          <ParticleSparks count={fx.particles} color={fx.glowColor!} />
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Actual Card - flip-in on first reveal */}
                <motion.div
                  initial={isFirstReveal ? { rotateY: 80 } : false}
                  animate={{ rotateY: 0 }}
                  transition={{ duration: 0.55, ease: [0.2, 0.1, 0.1, 1] }}
                  style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
                >
                <div 
                  ref={cardRef}
                  className={`aspect-[2/3] relative rounded-2xl overflow-hidden glass-panel border-[3px] card-3d-inner rarity-glow-${effectiveRarity} rarity-border-${effectiveRarity}`}
                  style={{
                    width: 'clamp(280px, 80vw, 360px)',
                    background: 'linear-gradient(145deg, #111A15 0%, #050806 100%)',
                    boxShadow: getRarityEffect(result.rarity).glowShadow,
                  }}
                >
                  {/* Pointer/gyro-driven holographic foil sheen (all rarities) */}
                  <motion.div
                    aria-hidden
                    className="holo-foil absolute inset-0 z-30 pointer-events-none"
                    style={{ ["--holo-x"]: holoX, ["--holo-y"]: holoY } as unknown as React.CSSProperties}
                  />
                  {/* Holo foil overlay (for Icon, Legendary, Mythic) */}
                  {getRarityEffect(effectiveRarity).holoFoil && (
                    <div
                      className="absolute inset-0 mix-blend-color-dodge z-20 pointer-events-none"
                      style={{
                        backgroundImage: "url('/holo-foil.png')",
                        backgroundSize: 'cover',
                        opacity: getRarityEffect(effectiveRarity).shimmerOpacity * 0.7,
                      }}
                    />
                  )}
                  {/* Animated shimmer sweep (skip for Core) */}
                  {getRarityEffect(effectiveRarity).shimmerOpacity > 0 && (
                    <div
                      className="holo-overlay"
                      style={{
                        opacity: getRarityEffect(effectiveRarity).shimmerOpacity,
                        ['--holo-duration' as string]: getRarityEffect(effectiveRarity).shimmerDuration,
                      }}
                    />
                  )}

                  {/* Card Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.15] bg-[url('/carbon-fibre.png')] mix-blend-overlay z-0"></div>
                  
                  {/* Top Image Section */}
                  <div className="absolute top-0 inset-x-0 h-[55%] overflow-hidden z-10 border-b border-white/10">
                    {transformStatus === "success" && transformedImage ? (
                      <div
                        role="img"
                        aria-label="Player"
                        className="w-full h-full filter contrast-125 saturate-110"
                        style={{
                          backgroundImage: `url(${transformedImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "top center",
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    ) : (
                      <>
                        <div
                          role="img"
                          aria-label="Player"
                          className="w-full h-full filter contrast-125 saturate-110 opacity-40 grayscale"
                          style={{
                            backgroundImage: `url(${photo || "/avatar-1.png"})`,
                            backgroundSize: "cover",
                            backgroundPosition: "top center",
                            backgroundRepeat: "no-repeat",
                          }}
                        />
                        <div
                          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/75 px-4 text-center"
                          data-testid="transform-status-overlay"
                        >
                          {transformStatus === "loading" ? (
                            <>
                              <Loader2 className="h-7 w-7 animate-spin text-primary" />
                              <p className="text-xs font-bold uppercase tracking-widest text-white/90">
                                Forging your hero portrait…
                              </p>
                            </>
                          ) : transformErrorKind === "capacity" && capacityCountdown !== null ? (
                            <>
                              <Loader2 className="h-7 w-7 animate-spin text-primary" />
                              <p className="text-xs font-bold uppercase tracking-wide text-white/90 leading-snug">
                                Studio is busy - retrying in {capacityCountdown}s…
                              </p>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-7 w-7 text-primary" />
                              <p className="text-xs font-bold uppercase tracking-wide text-white/90 leading-snug">
                                {transformErrorKind === "capacity"
                                  ? "Studio is full - please try again in a moment."
                                  : "Portrait couldn't be generated - your card stats are saved."}
                              </p>
                              <Button
                                onClick={() => { capacityRetryUsedRef.current = false; retryTransform(); }}
                                className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider rounded-lg text-xs"
                                data-testid="button-retry-transform"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" /> Tap to Try Again
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D10] via-[#0A0D10]/20 to-black/40" />
                    
                    {/* Power Level overlay on image */}
                    <div className={`absolute bottom-2 right-3 text-right transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                      <div className="text-[10px] text-white/80 font-bold uppercase tracking-widest drop-shadow-md">Power Level</div>
                      <div className="text-3xl font-display font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        <CountUp to={result.power} />
                      </div>
                    </div>
                  </div>

                  {/* Score Badge (Top Left) */}
                  <div className={`absolute top-4 left-3 z-30 text-center drop-shadow-2xl transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                    <div className="text-6xl font-display font-black leading-none gold-text-gradient tracking-tighter">
                      <CountUp to={result.aura} />
                    </div>
                    <div className="text-[11px] font-bold uppercase text-white tracking-[0.2em] mt-1 drop-shadow-md rounded px-1 border border-white/10 bg-black/40 backdrop-blur-sm">Aura</div>
                  </div>

                  {/* Nation/Flag + Rarity Badges (Top Right) */}
                  <div className={`absolute top-4 right-3 z-30 flex flex-col items-end gap-1.5 transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                    <div className="px-3 py-1.5 rounded border border-white/20 text-sm font-black uppercase text-white shadow-xl flex items-center gap-2 bg-black/60 backdrop-blur-md max-w-[120px] truncate">
                      {result.nation}
                    </div>
                    {/* Rarity badge - always visible, prominently styled per tier.
                        Pulses large when the reveal overlay's tier name settles here. */}
                    <motion.div
                      className="px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-widest shadow-xl border-2 backdrop-blur-md"
                      style={{
                        color: rarityStyle.color,
                        borderColor: rarityStyle.border,
                        backgroundColor: rarityStyle.bg,
                        textShadow: getRarityEffect(result.rarity).glowColor
                          ? `0 0 8px ${getRarityEffect(result.rarity).glowColor}` : undefined,
                        boxShadow: getRarityEffect(result.rarity).glowColor
                          ? `0 0 10px ${getRarityEffect(result.rarity).glowColor}55, inset 0 0 8px ${getRarityEffect(result.rarity).glowColor}22`
                          : undefined,
                      }}
                      animate={isFirstReveal
                        ? { scale: [1, 1, 2.2, 1.1, 1], opacity: [1, 1, 1, 1, 1] }
                        : { scale: 1 }}
                      transition={isFirstReveal
                        ? { duration: 0.5, delay: 1.15, ease: "easeOut" }
                        : {}}
                    >
                      {effectiveRarity}
                    </motion.div>
                  </div>

                  {/* Card Content - Bottom Half */}
                  <div className="absolute bottom-0 inset-x-0 min-h-[45%] p-4 flex flex-col justify-end z-30">
                    <div className="text-center mb-2">
                      <h3 className="text-3xl font-display font-black text-white uppercase tracking-wider leading-tight drop-shadow-lg line-clamp-2">
                        {result.name}
                      </h3>
                      <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 max-w-full truncate transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                        {result.archetype}
                      </div>
                    </div>

                    <div className={`grid grid-cols-3 gap-y-2 gap-x-2 mb-2 p-3 rounded-xl border border-white/10 shadow-inner bg-black/40 backdrop-blur-md transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                      {[
                        { label: "PAC", value: result.stats.speed },
                        { label: "SHO", value: result.stats.clutch },
                        { label: "PAS", value: result.stats.iq },
                        { label: "DRI", value: result.stats.chaos },
                        { label: "DEF", value: result.stats.loyalty },
                        { label: "PHY", value: result.stats.banter }
                      ].map(stat => (
                        <div key={stat.label} className="flex flex-col items-center justify-center relative">
                          <span className="text-xl font-display font-black text-white leading-none drop-shadow-md"><CountUp to={stat.value} duration={1.5} /></span>
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{stat.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className={`text-center text-[11px] text-gray-300 font-medium italic border-t border-white/10 pt-3 leading-snug line-clamp-2 sm:line-clamp-3 transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                      "{result.prophecy}"
                    </div>

                    {/* Rank + Edition Stamp + Card ID Footer */}
                    <div className={`flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10 transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent truncate">
                        <Trophy className="h-3 w-3 shrink-0" />
                        {result.rank}
                      </span>
                      {editionNumber != null && (
                        <span
                          className="text-[9px] font-black uppercase tracking-widest shrink-0"
                          style={
                            result.rarity === "Mythic"
                              ? {
                                  background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)",
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                  backgroundClip: "text",
                                }
                              : { color: rarityStyle.color }
                          }
                        >
                          #{editionNumber.toLocaleString()} / 100,000
                        </span>
                      )}
                      <span className="flex flex-col items-end shrink-0">
                        {vrfTxSig && (
                          <span className="text-[8px] font-bold text-emerald-500/70 tracking-wider leading-tight">⛓ Verified</span>
                        )}
                        <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase leading-tight">{result.id}</span>
                      </span>
                    </div>
                  </div>
                </div>
                </motion.div>
              </motion.div>

              {/* Action Buttons */}
              <div className={`transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="grid grid-cols-2 gap-3 mt-10 relative z-20"
                style={{ width: 'clamp(280px, 80vw, 360px)' }}
              >
                <Button onClick={handleDownload} className="h-14 bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  <Download className="mr-2 h-5 w-5" /> Save
                </Button>
                <Button
                  onClick={() => setShareOpen(true)}
                  disabled={transformStatus !== "success" || shareGenerating}
                  className="h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(255,215,0,0.3)] disabled:opacity-50"
                >
                  {(transformStatus === "loading" || shareGenerating) ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Share2 className="mr-2 h-5 w-5" />
                  )}
                  Share
                </Button>
                {/* Remix button - up to MAX_REMIXES uses */}
                <Button
                  onClick={handleRemix}
                  disabled={remixCount >= MAX_REMIXES || transformStatus === "loading" || remixForging}
                  variant="outline"
                  className="h-12 relative bg-black/60 border-orange-500/50 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-black/80 hover:border-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {remixForging ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 text-orange-400 animate-spin" />
                      <span>{remixResolvedCount} of 3 ready…</span>
                    </>
                  ) : (
                    <>
                      <Flame className="mr-2 h-4 w-4 text-orange-400" />
                      Remix
                      <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full ${remixCount >= MAX_REMIXES ? 'bg-gray-700 text-gray-400' : 'bg-orange-500/30 text-orange-300 border border-orange-500/40'}`}>
                        {MAX_REMIXES - remixCount} left
                      </span>
                    </>
                  )}
                </Button>
                <Button onClick={() => { setStep("landing"); setQuizStep(0); setPhoto(null); setTransformedImage(null); setTransformStatus("idle"); mintMutation.reset(); setRecipientInput(""); setUseTempWallet(false); setRemixCount(0); setRemixForging(false); setRemixPickerOpen(false); setRemixVariants([null, null, null]); setShareAssets({ just: null, prophecy: null, story: null }); setShareOpen(false); setServerRarity(null); setEditionNumber(null); setShowRarityReveal(false); setIsFirstReveal(false); setVrfTxSig(null); setVrfProof(null); vrfSlugRef.current = null; vrfSeedRef.current = null; remixVrfSlugsRef.current = [null, null, null]; remixVrfSeedsRef.current = [null, null, null]; }} variant="outline" className="h-12 bg-black/60 border-gray-700 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-black/80 hover:border-primary/50">
                  <RotateCcw className="mr-2 h-4 w-4" /> Retry
                </Button>
                <Button onClick={() => setChallengeOpen(true)} variant="outline" className="col-span-2 h-12 bg-black/60 border-primary/40 text-primary font-bold uppercase tracking-wider rounded-xl hover:bg-black/80 hover:border-primary">
                  <Swords className="mr-2 h-4 w-4" /> Challenge a friend
                </Button>
              </motion.div>
              </div>

              {/* Collectible Ready Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-8 p-5 rounded-2xl glass-panel border border-primary/20 space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                style={{ width: 'clamp(280px, 80vw, 360px)' }}
              >
                <div className="flex items-center gap-2 text-primary drop-shadow-md">
                  <Trophy size={20} className="fill-primary" />
                  <h3 className="font-display font-black text-lg uppercase tracking-wider">Collectible Secured</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-300 bg-black/60 p-4 rounded-xl border border-white/5">
                  <div className="flex flex-col"><span className="text-gray-500 mb-1 font-bold uppercase tracking-widest text-[9px]">Card ID</span> <span className="font-mono text-white/90">{result.id}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500 mb-1 font-bold uppercase tracking-widest text-[9px]">Rarity</span>
                    <span className="font-black text-sm" style={{ color: getRarityStyle(serverRarity ?? result.rarity).color }}>
                      {serverRarity ?? result.rarity}
                    </span>
                  </div>
                </div>
                {editionNumber != null && (
                  <div className={`transition-opacity duration-200 ${remixFocusMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", bounce: 0.3 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 border border-primary/20"
                  >
                    <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs font-bold text-white/70">
                      Card{" "}
                      <span className="text-primary font-black">#{editionNumber.toLocaleString()}</span>
                      {" "}of{" "}
                      <span className="text-white font-black">100,000</span>
                    </span>
                  </motion.div>
                  </div>
                )}

                {result && (
                  <PlayerMatch
                    card={{
                      stats: result.stats,
                      nation: result.nation,
                      archetype: result.archetype,
                    }}
                  />
                )}

                {(vrfTxSig || vrfProof) && (
                  <VerifyOnChain vrfTxSig={vrfTxSig} proof={vrfProof} />
                )}

                {mintResult ? (
                  <div className="space-y-3" data-testid="mint-success">
                    <div className="flex items-center gap-2 text-primary text-sm font-bold">
                      <Check size={16} /> Minted to your wallet on Solana devnet
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
                      <span className="text-gray-500 text-xs">Mint address</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white break-all flex-1" data-testid="text-mint-address">{mintResult.mintAddress}</span>
                        <button
                          onClick={handleCopyMint}
                          className="shrink-0 text-gray-400 hover:text-white transition-colors"
                          aria-label="Copy mint address"
                          data-testid="button-copy-mint"
                        >
                          {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-1">
                      <span className="text-gray-500 text-xs">Owner wallet</span>
                      <p className="font-mono text-[11px] text-gray-300 break-all" data-testid="text-mint-recipient">{mintResult.recipient}</p>
                    </div>
                    <a
                      href={mintResult.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-black/40 border border-gray-700 text-white font-bold uppercase tracking-wider text-sm hover:border-primary/50 transition-colors"
                      data-testid="link-explorer"
                    >
                      <ExternalLink className="h-4 w-4" /> View on Explorer
                    </a>
                  </div>
                ) : mintMutation.isPending ? (
                  <MintingCinematic />
                ) : (
                  <>
                    <div className="bg-black/40 p-3 rounded-lg border border-gray-800 space-y-2.5" data-testid="mint-recipient-option">
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider">Send the NFT to</span>

                      <WalletConnect />

                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-[9px] uppercase tracking-widest text-gray-600">or paste an address</span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>

                      <Input
                        value={useTempWallet ? getWalletAddress() : recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        disabled={useTempWallet || walletConnected || mintMutation.isPending}
                        placeholder="Paste your Solana wallet address"
                        spellCheck={false}
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="h-10 bg-black/60 border-gray-700 text-white font-mono text-xs"
                        data-testid="input-recipient"
                      />
                      <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useTempWallet}
                          onChange={(e) => setUseTempWallet(e.target.checked)}
                          disabled={walletConnected || mintMutation.isPending}
                          className="accent-primary h-3.5 w-3.5"
                          data-testid="checkbox-temp-wallet"
                        />
                        I don't have a wallet - use a temporary in-app one
                      </label>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        Minting is free - the app's sponsor wallet covers all devnet fees.
                      </p>
                    </div>

                    <Button
                      onClick={handleMint}
                      disabled={mintMutation.isPending || !mintReady || !recipient}
                      className="w-full h-14 text-white font-black uppercase tracking-wider rounded-xl border-0 bg-gradient-to-br from-accent via-rose-500 to-orange-500 shadow-[0_10px_40px_-8px_hsl(var(--accent)/0.7)] hover:brightness-110"
                      data-testid="button-mint"
                    >
                      {mintMutation.isPending ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Minting NFT…</>
                      ) : (
                        <><Sparkles className="mr-2 h-5 w-5" /> Mint as NFT (free)</>
                      )}
                    </Button>

                    {!mintStatusQuery.isLoading && !mintReady && (
                      <p className="text-xs text-gray-400 text-center" data-testid="text-mint-unavailable">
                        Sponsored minting is temporarily unavailable. Please check back soon.
                      </p>
                    )}

                    {mintError && (
                      <p className="text-xs text-destructive text-center" data-testid="text-mint-error">{mintError}</p>
                    )}
                  </>
                )}
              </motion.div>

              {/* Scroll hint - draws the eye down to the community wall */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 0.6 }}
                className="flex flex-col items-center gap-1.5 mt-8 cursor-pointer select-none"
                onClick={() => communityWallRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") communityWallRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                aria-label="See everyone's cards"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  See what others got
                </span>
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="h-5 w-5 text-primary/60" />
                </motion.div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Community Wall - visible below the result screen */}
      {step === "result" && result && (
        <div ref={communityWallRef} className="w-full pt-8 border-t border-white/5">
          <CommunityWall baseUrl={`${import.meta.env.BASE_URL}`} />
        </div>
      )}

      {/* Remix Forge Overlay - shown while 3 portraits are generating */}
      <AnimatePresence>
        {remixForging && step === "result" && (
          <motion.div
            key="remix-forge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="w-72 bg-[#0a0d12] border border-orange-500/40 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            >
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
                  <div
                    key={v}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                      i < remixResolvedCount ? "bg-orange-400" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                {["Cinematic", "Comic Art", "Fantasy"][remixResolvedCount] ?? "All done!"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden off-screen capture container - fixed 400×600px, no backdrop-blur, no 3D transforms.
          html2canvas reads this div; the live card is never captured. */}
      {step === "result" && result && (
        <div
          aria-hidden="true"
          style={{ position: "fixed", left: -9999, top: 0, width: 400, pointerEvents: "none", zIndex: -1 }}
        >
          {/*
            Capture clone - html2canvas-pro reads this div.
            Layout rules:
            - NO flexbox (gap/flex-direction:column/justify-content:flex-end all collapse in html2canvas)
            - NO -webkit-background-clip:text (renders doubled)
            - Use block/inline-block with explicit margins for all stacking
            - Use inline-block with exact widths for row layouts (footer, stats)
            - Apply the Archivo display font explicitly on all text; await document.fonts.ready before capture
          */}
          <div
            ref={captureRef}
            style={{
              fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif",
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
                <img
                  src={transformedImage}
                  alt="Player"
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.25) saturate(1.1)" }}
                />
              ) : photo ? (
                <img
                  src={photo}
                  alt="Player"
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.25) saturate(1.1) grayscale(0.5)", opacity: 0.4 }}
                />
              ) : null}
              {/* Gradient overlay */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0A0D10 0%, rgba(10,13,16,0.2) 50%, rgba(0,0,0,0.4) 100%)" }} />
              {/* Power Level - block layout, no flex */}
              <div style={{ position: "absolute", bottom: 8, right: 12, textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Power Level</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "white", lineHeight: 1 }}>{result.power}</div>
              </div>
            </div>

            {/* Score Badge (Top Left) - solid gold, no gradient clip */}
            <div style={{ position: "absolute", top: 16, left: 12, zIndex: 30, textAlign: "center" }}>
              <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: "#FFD700" }}>
                {result.aura}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "white", letterSpacing: "0.2em", marginTop: 4, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "0 4px", border: "1px solid rgba(255,255,255,0.1)" }}>
                Aura
              </div>
            </div>

            {/* Nation + Rarity Badges (Top Right) - block stacking, no flex column */}
            <div style={{ position: "absolute", top: 16, right: 12, zIndex: 30 }}>
              <div style={{ display: "block", textAlign: "center", marginBottom: 6, padding: "6px 12px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 900, textTransform: "uppercase", color: "white", background: "rgba(0,0,0,0.8)" }}>
                {result.nation}
              </div>
              <div style={{ display: "block", textAlign: "center", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: rarityStyle.color, border: `1px solid ${rarityStyle.border}`, background: rarityStyle.bg }}>
                {effectiveRarity}
              </div>
            </div>

            {/* Bottom Half Content - fixed 270px, block layout, overflow:hidden prevents any bleed */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 270, padding: "12px 16px", overflow: "hidden", zIndex: 30 }}>
              {/* Name + archetype - block stacking */}
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.2 }}>
                  {result.name}
                </div>
                <div style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(251,191,36,0.2)", color: "rgb(251,191,36)", border: "1px solid rgba(251,191,36,0.3)" }}>
                  {result.archetype}
                </div>
              </div>

              {/* Stats - inline-block cells, no CSS grid or flexbox */}
              <div style={{ marginBottom: 6, padding: "8px 4px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.7)", fontSize: 0 }}>
                {[
                  { label: "PAC", value: result.stats.speed },
                  { label: "SHO", value: result.stats.clutch },
                  { label: "PAS", value: result.stats.iq },
                  { label: "DRI", value: result.stats.chaos },
                  { label: "DEF", value: result.stats.loyalty },
                  { label: "PHY", value: result.stats.banter },
                ].map(stat => (
                  <div key={stat.label} style={{ display: "inline-block", width: "33.33%", textAlign: "center", padding: "4px 0", verticalAlign: "top" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Prophecy */}
              <div style={{ textAlign: "center", fontSize: 10, color: "rgb(209,213,219)", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8, lineHeight: 1.4, marginBottom: 6 }}>
                "{result.prophecy}"
              </div>

              {/* Footer - inline-block row, no flex */}
              <div style={{ paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 0 }}>
                <span style={{ display: "inline-block", width: "40%", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#34d399", verticalAlign: "middle", textAlign: "left" }}>
                  ▸ {result.rank}
                </span>
                <span style={{ display: "inline-block", width: "30%", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: result.rarity === "Mythic" ? "#FFD700" : rarityStyle.color, verticalAlign: "middle", textAlign: "center" }}>
                  {editionNumber != null ? `#${editionNumber.toLocaleString()} / 100,000` : ""}
                </span>
                <span style={{ display: "inline-block", width: "30%", verticalAlign: "middle", textAlign: "right" }}>
                  {vrfTxSig && (
                    <span style={{ display: "block", fontSize: 8, fontWeight: 700, color: "rgba(52,211,153,0.8)", lineHeight: 1.3 }}>⛓ Verified</span>
                  )}
                  <span style={{ display: "block", fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", lineHeight: 1.3 }}>{result.id}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remix Picker Overlay */}
      <AnimatePresence>
        {remixPickerOpen && (
          <motion.div
            key="remix-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center bg-black/80 backdrop-blur-sm"
            onClick={handleRemixCancel}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0.22, duration: 0.55 }}
              className="w-full max-w-lg bg-[#0a0d12] border border-orange-500/30 rounded-t-3xl sm:rounded-2xl p-6 space-y-6 shadow-[0_-20px_80px_rgba(0,0,0,0.8)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-wider">Choose Your Portrait</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Tap a style, then confirm</p>
                </div>
                <button
                  onClick={handleRemixCancel}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 3 Thumbnail Portraits */}
              <div className="grid grid-cols-3 gap-3">
                {STYLE_VARIANTS.map((variant, i) => {
                  const img = remixVariants[i];
                  const isSelected = remixSelectedIndex === i;
                  const isFailed = !img && remixResolvedCount === 3;
                  return (
                    <button
                      key={variant}
                      disabled={!img}
                      onClick={() => { if (img) { setRemixSelectedIndex(i); vrfSlugRef.current = remixVrfSlugsRef.current[i]; vrfSeedRef.current = remixVrfSeedsRef.current[i]; } }}
                      className={`relative flex flex-col items-center gap-2 rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected && img
                          ? "border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.6)] scale-[1.03]"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      {/* Portrait image */}
                      <div className="w-full aspect-[2/3] bg-black/60 relative">
                        {img ? (
                          <img
                            src={img}
                            alt={STYLE_LABELS[variant]}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : isFailed ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-gray-600" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-orange-400 animate-spin" />
                          </div>
                        )}
                        {isSelected && img && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center shadow-lg">
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        )}
                      </div>
                      {/* Label */}
                      <span className={`pb-2 text-[10px] font-black uppercase tracking-widest ${isSelected && img ? "text-orange-300" : "text-gray-400"}`}>
                        {STYLE_LABELS[variant]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleRemixCancel}
                  className="h-12 bg-black/60 border-gray-700 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-black/80"
                >
                  Keep Current
                </Button>
                <Button
                  onClick={handleRemixConfirm}
                  disabled={!remixVariants[remixSelectedIndex]}
                  className="h-12 bg-orange-500 hover:bg-orange-400 text-white font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 shadow-[0_0_20px_rgba(251,146,60,0.4)]"
                >
                  <Check className="mr-2 h-4 w-4" /> Use This One
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge share sheet */}
      <ChallengeSheet
        open={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        cardDataUrl={shareAssets.just}
        rarity={result?.rarity ?? ""}
        archetype={result?.archetype ?? ""}
        rank={result?.rank ?? ""}
        shareUrl={
          cardSlug
            ? `${getAppUrl()}${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${cardSlug}`
            : null
        }
        mintExplorerUrl={mintResult?.explorerUrl ?? null}
      />

      {/* Share carousel sheet */}
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        slides={[
          {
            id: "just",
            label: "Just the Card",
            description: "Clean PNG for Discord & Twitter",
            dataUrl: shareAssets.just,
          },
          {
            id: "prophecy",
            label: "Card + Prophecy",
            description: "Perfect for Instagram & WhatsApp",
            dataUrl: shareAssets.prophecy,
          },
          {
            id: "story",
            label: "Story Format",
            description: "9:16 for Reels & TikTok",
            dataUrl: shareAssets.story,
          },
        ]}
        caption={
          result
            ? `I just unlocked my World Cup Aura Card! ${result.rarity} ${result.archetype}, Aura Level ${result.aura}. Try to beat it! 👊`
            : "Check out my World Cup Aura Card!"
        }
        shareUrl={
          cardSlug
            ? `${getAppUrl()}${import.meta.env.BASE_URL.replace(/\/$/, "")}/card/${cardSlug}`
            : mintResult?.explorerUrl || (getAppUrl() + window.location.pathname)
        }
      />

      {/* "The Collection" - Rarity Odds Modal */}
      <AnimatePresence>
        {rarityOddsOpen && (
          <motion.div
            key="rarity-odds-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={() => setRarityOddsOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
              className="w-full max-w-md bg-[#07090f] border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-[0_-20px_80px_rgba(0,0,0,0.9)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-6 pt-6 pb-5 border-b border-white/10"
                style={{ background: "linear-gradient(135deg, #0a0d16 0%, #0c1120 100%)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">The Collection · 2026 Edition</span>
                    </div>
                    <h2 className="text-xl font-display font-black text-white leading-tight">
                      The 2026 World Cup<br/>Aura Card Collection
                    </h2>
                  </div>
                  <button
                    onClick={() => setRarityOddsOpen(false)}
                    className="mt-0.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Rarity table */}
              <div className="px-6 py-4 space-y-2">
                {(rarityStatsQuery.data?.tiers ?? [
                  { tier: "Core",      quota: 55000, issued: 0, remaining: 55000, pullRate: 55.0 },
                  { tier: "Rising",    quota: 25000, issued: 0, remaining: 25000, pullRate: 25.0 },
                  { tier: "Elite",     quota: 12000, issued: 0, remaining: 12000, pullRate: 12.0 },
                  { tier: "Icon",      quota: 5500,  issued: 0, remaining: 5500,  pullRate: 5.5  },
                  { tier: "Legendary", quota: 2000,  issued: 0, remaining: 2000,  pullRate: 2.0  },
                  { tier: "Mythic",    quota: 500,   issued: 0, remaining: 500,   pullRate: 0.5  },
                ]).map((row) => {
                  const style = getRarityStyle(row.tier);
                  const pct = (row.issued / row.quota) * 100;
                  return (
                    <div key={row.tier} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <div
                        className="w-1.5 h-8 rounded-full shrink-0"
                        style={{ background: style.color, boxShadow: `0 0 8px ${style.color}80` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-black text-white">{row.tier}</span>
                          <span className="text-[11px] font-bold" style={{ color: style.color }}>
                            {row.pullRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct.toFixed(1)}%`,
                              background: style.color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[9px] text-gray-600 font-mono">
                            {row.issued.toLocaleString()} issued
                          </span>
                          <span className="text-[9px] text-gray-600 font-mono">
                            {row.remaining.toLocaleString()} left
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Total counter */}
                {rarityStatsQuery.data && (
                  <div className="flex items-center justify-between px-2 pt-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total claimed</span>
                    <span className="text-[11px] font-black text-white">
                      {rarityStatsQuery.data.totalIssued.toLocaleString()} / 100,000
                    </span>
                  </div>
                )}
              </div>

              {/* Collectible story */}
              <div className="px-6 pb-6 pt-2">
                <div className="p-4 rounded-xl bg-black/40 border border-primary/10 space-y-2.5">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    <span className="text-white font-bold">The founding edition.</span> The 2026 World Cup Aura Card Collection marks the tournament that brought the world together. Every card is numbered and permanently tied to this moment.
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    This edition holds up to 100,000 cards. Future collections may follow - new tournaments, new editions, new chapters - but the 2026 Edition will always be the original.
                  </p>
                </div>
                <button
                  onClick={() => setRarityOddsOpen(false)}
                  className="mt-4 w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rarity reveal overlay - fires once when the server assigns a tier */}
      <AnimatePresence>
        {showRarityReveal && serverRarity && (
          <RarityReveal
            rarity={serverRarity}
            predictedRarity={result?.rarity ?? null}
            editionNumber={editionNumber}
            vrfTxSig={vrfTxSig}
            onDismiss={() => setShowRarityReveal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}