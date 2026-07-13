// ─────────────────────────────────────────────────────────────────────────────
// AuraFlowProvider — the single state container for the whole aura flow.
//
// • `state` is ONE object holding every piece of flow state, grouped by concern.
//   It's the one place to see what state exists.
// • `actions` are named functions (answerQuiz, nextQuizStep, mint, remix…) — the
//   only way state changes. The async orchestration (AI transform, save, mint,
//   share-asset rendering) lives here too, so step components stay presentational.
// • Non-serializable bits (DOM refs, framer motion values, React Query
//   mutations, the connected wallet) are exposed alongside state.
//
// Consume it with `useAuraFlow()`.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import confetti from "canvas-confetti";
import { useWalletBridge } from "@/lib/walletBridge";
import {
  useGetMintStatus,
  useGetRarityStats,
  useMintAuraCard,
  useSaveAuraCard,
  useUpdateAuraCardImage,
} from "@/api";
import { calculateAuraScore } from "@/lib/scoring";
import { getRarityStyle } from "@/lib/rarity";
import { NATION_FLAGS, FLAG_NATIONS } from "@/lib/nations";
import { getWalletAddress } from "@/lib/solanaWallet";
import {
  trackStep,
  trackViewContent,
  trackGenerateAuraCard,
  trackPurchase,
  trackShareAuraCard,
} from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { useStepHistory, type NavPosition } from "@/hooks/useStepHistory";
import {
  EMPTY_QUIZ,
  EMPTY_SHARE_ASSETS,
  GENDER_LABELS,
  MAX_REMIXES,
  STYLE_VARIANTS,
  type CardResult,
  type Gender,
  type QuizState,
  type ShareAssets,
  type Step,
  type TransformErrorKind,
  type TransformStatus,
} from "./types";
import {
  requestAuraTransform,
  TransformError,
  type TransformResult,
} from "./transform";
import { captureCardCanvas, captureCardDataUrl, buildShareAssets } from "./capture";

// ── State ────────────────────────────────────────────────────────────────────

interface FlowState {
  // flow / navigation
  step: Step;
  gender: Gender | null;
  // photo
  photo: string | null;
  photoIntent: "upload" | null;
  // quiz
  quizState: QuizState;
  quizStep: number;
  quizDirection: number;
  // result / card display
  result: CardResult | null;
  isFlipped: boolean;
  backMounted: boolean;
  isFirstReveal: boolean;
  // AI transform / scan
  transformedImage: string | null;
  transformStatus: TransformStatus;
  transformErrorKind: TransformErrorKind | null;
  capacityCountdown: number | null;
  scanMsgIndex: number;
  // on-chain / rarity / edition (server-assigned)
  cardSlug: string | null;
  serverRarity: string | null;
  editionNumber: number | null;
  vrfTxSig: string | null;
  vrfProof: { seedHex: string; archetype: string } | null;
  // mint / wallet UI
  recipientInput: string;
  useTempWallet: boolean;
  copied: boolean;
  // remix
  remixCount: number;
  remixForging: boolean;
  remixResolvedCount: number;
  remixVariants: (string | null)[];
  remixPickerOpen: boolean;
  remixSelectedIndex: number;
  // share
  shareAssets: ShareAssets;
  shareGenerating: boolean;
  // sheets / modals
  challengeOpen: boolean;
  shareOpen: boolean;
  rarityOddsOpen: boolean;
  collectionOpen: boolean;
  shipOpen: boolean;
  showRarityReveal: boolean;
}

function initialState(): FlowState {
  let gender: Gender | null = null;
  try {
    const stored = localStorage.getItem("aura:gender");
    gender = (GENDER_LABELS.includes(stored as Gender) ? stored : null) as Gender | null;
  } catch {
    /* ignore */
  }
  return {
    step: "landing",
    gender,
    photo: null,
    photoIntent: null,
    quizState: { ...EMPTY_QUIZ },
    quizStep: 0,
    quizDirection: 1,
    result: null,
    isFlipped: false,
    backMounted: false,
    isFirstReveal: false,
    transformedImage: null,
    transformStatus: "idle",
    transformErrorKind: null,
    capacityCountdown: null,
    scanMsgIndex: 0,
    cardSlug: null,
    serverRarity: null,
    editionNumber: null,
    vrfTxSig: null,
    vrfProof: null,
    recipientInput: "",
    useTempWallet: false,
    copied: false,
    remixCount: 0,
    remixForging: false,
    remixResolvedCount: 0,
    remixVariants: [null, null, null],
    remixPickerOpen: false,
    remixSelectedIndex: 0,
    shareAssets: { ...EMPTY_SHARE_ASSETS },
    shareGenerating: false,
    challengeOpen: false,
    shareOpen: false,
    rarityOddsOpen: false,
    collectionOpen: false,
    shipOpen: false,
    showRarityReveal: false,
  };
}

// A tiny reducer: every mutation is a shallow patch (or a full reset). The
// *semantics* live in the named action functions below — this keeps the reducer
// trivial while giving callers a clear, named API.
type FlowAction = { type: "patch"; patch: Partial<FlowState> } | { type: "reset" };

function reducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch };
    case "reset":
      return { ...initialState(), gender: state.gender };
  }
}

// ── Context shape ──────────────────────────────────────────────────────────────

export interface AuraFlowActions {
  goToStep: (step: Step) => void;
  goHome: () => void;
  start: () => void;
  setGender: (g: Gender | null) => void;
  setPhoto: (src: string | null) => void;
  requestUpload: () => void;
  clearPhotoIntent: () => void;
  selectSampleAvatar: (num: number) => void;
  // quiz
  setQuizField: (field: keyof QuizState, value: string | number) => void;
  nextQuizStep: () => void;
  prevQuizStep: () => void;
  navToQuizStep: (target: number) => void;
  selectAndAdvance: (field: keyof QuizState, value: string) => void;
  // card
  setFlipped: (v: boolean) => void;
  setBackMounted: (v: boolean) => void;
  completeReveal: () => void;
  setScanMsgIndex: (i: number) => void;
  // transform
  retryTransform: () => Promise<void>;
  // remix
  remix: () => Promise<void>;
  confirmRemix: () => void;
  cancelRemix: () => void;
  setRemixSelectedIndex: (i: number) => void;
  // mint
  setRecipientInput: (v: string) => void;
  setUseTempWallet: (v: boolean) => void;
  mint: () => Promise<void>;
  copyMint: () => void;
  download: () => Promise<void>;
  // sheets
  setSheet: (
    sheet:
      | "challengeOpen"
      | "shareOpen"
      | "rarityOddsOpen"
      | "collectionOpen"
      | "shipOpen"
      | "showRarityReveal",
    open: boolean,
  ) => void;
  // reset the whole flow back to landing (result "Retry")
  resetToLanding: () => void;
}

interface CardMotion {
  cardX: MotionValue<number>;
  cardY: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  holoX: MotionValue<string>;
  holoY: MotionValue<string>;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
}

interface AuraFlowValue {
  state: FlowState;
  actions: AuraFlowActions;
  // derived
  effectiveRarity: string;
  rarityStyle: ReturnType<typeof getRarityStyle>;
  recipient: string;
  mintReady: boolean;
  mintError: string | null;
  mintResult: ReturnType<typeof useMintAuraCard>["data"] | null;
  remixFocusMode: boolean;
  prefersReducedMotion: boolean;
  walletConnected: boolean;
  // refs
  cardRef: React.RefObject<HTMLDivElement | null>;
  captureRef: React.RefObject<HTMLDivElement | null>;
  communityWallRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  // camera
  cameraActive: boolean;
  cameraError: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => void;
  // motion
  motion: CardMotion;
  // queries
  mintStatusQuery: ReturnType<typeof useGetMintStatus>;
  rarityStatsQuery: ReturnType<typeof useGetRarityStats>;
  mintMutation: ReturnType<typeof useMintAuraCard>;
}

const AuraFlowContext = createContext<AuraFlowValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuraFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const patch = (p: Partial<FlowState>) => dispatch({ type: "patch", patch: p });

  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { address: connectedWalletAddress, isConnected: walletConnected } = useWalletBridge();

  // React Query
  const mintStatusQuery = useGetMintStatus();
  // orval types the options as a full UseQueryOptions (wants a queryKey); the
  // cast is an options-typing quirk only, not a payload cast.
  const rarityStatsQuery = useGetRarityStats({ query: { staleTime: 60_000 } } as never);
  const mintMutation = useMintAuraCard();
  const saveCardMutation = useSaveAuraCard();
  const updateCardImageMutation = useUpdateAuraCardImage();
  const mintResult = mintMutation.data ?? null;

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const communityWallRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capacityRetryUsedRef = useRef(false);
  const vrfSlugRef = useRef<string | null>(null);
  const vrfSeedRef = useRef<string | null>(null);
  const remixVrfSlugsRef = useRef<(string | null)[]>([null, null, null]);
  const remixVrfSeedsRef = useRef<(string | null)[]>([null, null, null]);
  // Lazily initialised once (the previous inline IIFE re-parsed localStorage on
  // every render — this provider re-renders often).
  const revealedSlugsRef = useRef<Set<string> | null>(null);
  if (revealedSlugsRef.current === null) {
    try {
      const raw = localStorage.getItem("aura:revealedSlugs");
      revealedSlugsRef.current = new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      revealedSlugsRef.current = new Set<string>();
    }
  }
  const revealedSlugs = revealedSlugsRef.current;
  // Monotonic run token: guards the save/share pipeline against re-entrancy when
  // a retry or remix-confirm re-triggers it while a prior run is still in flight.
  const shareRunIdRef = useRef(0);

  // Camera (local component state — lives here so it can feed `photo`)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      patch({ photo: null });
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
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    patch({ photo: canvas.toDataURL("image/png") });
    stopCamera();
  };

  // Motion values for the 3D card tilt + holo foil.
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const rotateX = useTransform(cardY, [-100, 100], [10, -10]);
  const rotateY = useTransform(cardX, [-100, 100], [-10, 10]);
  const holoX = useTransform(cardX, [-150, 150], ["0%", "100%"]);
  const holoY = useTransform(cardY, [-150, 150], ["0%", "100%"]);
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    cardX.set(e.clientX - rect.left - rect.width / 2);
    cardY.set(e.clientY - rect.top - rect.height / 2);
  };
  const onMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

  // Derived
  const effectiveRarity = state.serverRarity ?? state.result?.rarity ?? "Core";
  const rarityStyle = getRarityStyle(effectiveRarity);
  const recipient = (state.useTempWallet ? getWalletAddress() : state.recipientInput).trim();
  const mintReady = mintStatusQuery.data?.ready ?? false;
  const mintError = mintMutation.error
    ? ((mintMutation.error as { data?: { error?: string } }).data?.error ??
      (mintMutation.error as Error).message ??
      "Minting failed. Please try again.")
    : null;
  const remixFocusMode = state.remixPickerOpen || state.remixForging;

  // ── The AI transform orchestration ──────────────────────────────────────────

  const buildTransformInput = (finalResult: CardResult, styleVariant?: "realistic" | "comic" | "fantasy") => ({
    photoSrc: state.photo,
    nation: finalResult.nation,
    archetype: finalResult.archetype,
    aura: finalResult.aura ?? 50,
    energy: state.quizState.energy,
    walkout: state.quizState.walkout,
    weapon: state.quizState.weapon,
    gender: state.gender,
    ...(styleVariant ? { styleVariant } : {}),
  });

  const runScan = async (finalResult: CardResult) => {
    trackStep("aura_step_quiz_complete");
    patch({ step: "scanner", transformStatus: "loading", transformErrorKind: null, transformedImage: null });
    capacityRetryUsedRef.current = false;
    let transformed: string | null = null;
    let errorKind: TransformErrorKind = "ai_error";
    try {
      const tr = await requestAuraTransform(buildTransformInput(finalResult));
      transformed = tr.image;
      if (tr.vrfSlug) vrfSlugRef.current = tr.vrfSlug;
      if (tr.vrfSeedHex) vrfSeedRef.current = tr.vrfSeedHex;
    } catch (err) {
      errorKind = err instanceof TransformError ? err.kind : "ai_error";
    }
    if (transformed) trackGenerateAuraCard();
    patch({
      transformedImage: transformed,
      transformStatus: transformed ? "success" : "error",
      transformErrorKind: transformed ? null : errorKind,
      result: finalResult,
      isFirstReveal: true,
      isFlipped: false,
      backMounted: false,
      step: "result",
    });

    // Epic confetti blast
    setTimeout(() => {
      const end = Date.now() + 3000;
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#FFD700", "#FFA500", "#FF4500"] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#FFD700", "#FFA500", "#FF4500"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }, 500);
  };

  const retryTransform = async () => {
    if (!state.result || !state.photo) return;
    patch({ capacityCountdown: null, transformStatus: "loading", transformErrorKind: null });
    try {
      const tr = await requestAuraTransform(buildTransformInput(state.result));
      if (tr.vrfSlug) vrfSlugRef.current = tr.vrfSlug;
      if (tr.vrfSeedHex) vrfSeedRef.current = tr.vrfSeedHex;
      patch({ transformedImage: tr.image, transformStatus: "success" });
    } catch (err) {
      patch({
        transformedImage: null,
        transformStatus: "error",
        transformErrorKind: err instanceof TransformError ? err.kind : "ai_error",
      });
    }
  };

  // ── Remix ───────────────────────────────────────────────────────────────────

  const remix = async () => {
    if (!state.result || !state.photo || state.remixCount >= MAX_REMIXES || state.transformStatus === "loading" || state.remixForging)
      return;
    patch({
      remixCount: state.remixCount + 1,
      remixForging: true,
      remixResolvedCount: 0,
      remixVariants: [null, null, null],
      remixSelectedIndex: 0,
    });

    const settled: (string | null)[] = [null, null, null];
    let resolved = 0;
    const result = state.result;
    const promises = STYLE_VARIANTS.map((variant, i) =>
      requestAuraTransform(buildTransformInput(result, variant))
        .then((tr: TransformResult) => {
          settled[i] = tr.image;
          remixVrfSlugsRef.current[i] = tr.vrfSlug ?? null;
          remixVrfSeedsRef.current[i] = tr.vrfSeedHex ?? null;
        })
        .catch(() => {
          settled[i] = null;
        })
        .finally(() => {
          resolved += 1;
          patch({ remixResolvedCount: resolved, remixVariants: [...settled] });
        }),
    );
    await Promise.allSettled(promises);

    if (settled.some(Boolean)) {
      patch({ remixForging: false, remixSelectedIndex: settled.findIndex(Boolean), remixPickerOpen: true });
    } else {
      patch({ remixForging: false });
      toast({ title: "Remix failed", description: "None of the 3 portrait variations could be generated. Try again.", variant: "destructive" });
    }
  };

  const confirmRemix = () => {
    const chosen = state.remixVariants[state.remixSelectedIndex];
    if (chosen) {
      // Swap the active VRF proof to the chosen variant's.
      const slug = remixVrfSlugsRef.current[state.remixSelectedIndex];
      const seed = remixVrfSeedsRef.current[state.remixSelectedIndex];
      if (slug) vrfSlugRef.current = slug;
      if (seed) vrfSeedRef.current = seed;
      patch({ transformedImage: chosen, transformStatus: "success", remixPickerOpen: false });
    } else {
      patch({ remixPickerOpen: false });
    }
  };
  const cancelRemix = () => patch({ remixPickerOpen: false });

  // ── Capture / download / mint ───────────────────────────────────────────────

  const download = async () => {
    if (!captureRef.current) return;
    const canvas = await captureCardCanvas(captureRef.current);
    trackShareAuraCard("download_result");
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `AuraCard-${state.result?.id || "draft"}.png`;
    link.click();
  };

  const mint = async () => {
    if (!state.result) return;
    if (!recipient) {
      toast({ title: "Wallet address needed", description: "Paste a Solana wallet address or use the temporary in-app wallet.", variant: "destructive" });
      return;
    }
    trackStep("aura_step_mint_start");
    try {
      const image = captureRef.current ? await captureCardDataUrl(captureRef.current) : "";
      const r = state.result;
      const card = {
        id: r.id, name: r.name, nation: r.nation, aura: r.aura, power: r.power,
        rank: r.rank, rarity: r.rarity, archetype: r.archetype, prophecy: r.prophecy, stats: r.stats,
      };
      await mintMutation.mutateAsync({ data: { image, recipient, card } });
      trackStep("aura_step_mint_success");
      trackPurchase();
      toast({ title: "NFT minted!", description: "Your Aura Card is now in your wallet on Solana devnet." });
      if (!prefersReducedMotion) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#22c55e", "#3b82f6", "#fbbf24"] });
      }
    } catch (err) {
      const apiMessage = err && typeof err === "object" && "data" in err ? (err as { data?: { error?: string } }).data?.error : undefined;
      const message = apiMessage ?? (err instanceof Error ? err.message : "Minting failed. Please try again.");
      toast({ title: "Mint failed", description: message, variant: "destructive" });
    }
  };

  const copyMint = async () => {
    if (!mintResult) return;
    try {
      await navigator.clipboard.writeText((mintResult as { mintAddress: string }).mintAddress);
      patch({ copied: true });
      setTimeout(() => patch({ copied: false }), 2000);
    } catch {
      /* ignore clipboard failures */
    }
  };

  // ── Quiz navigation ─────────────────────────────────────────────────────────

  const nextQuizStep = () => {
    const q = state.quizState;
    const s = state.quizStep;
    if (s === 0 && !q.name.trim()) return;
    if (s === 1 && !q.nation) return;
    if (s === 2 && !q.energy) return;
    if (s === 3 && !q.weapon) return;
    if (s === 4 && !q.flaw) return;
    if (s === 6 && !q.walkout) return;

    if (s < 6) {
      patch({ quizDirection: 1, quizStep: s + 1 });
    } else {
      patch({ quizDirection: 1 });
      runScan(calculateAuraScore(q) as CardResult);
    }
  };
  const prevQuizStep = () => {
    if (state.quizStep > 0) patch({ quizDirection: -1, quizStep: state.quizStep - 1 });
  };
  const navToQuizStep = (target: number) => {
    if (target < state.quizStep) patch({ quizDirection: -1, quizStep: target });
  };
  const selectAndAdvance = (field: keyof QuizState, value: string) => {
    const newState = { ...state.quizState, [field]: value };
    if (state.quizStep < 6) {
      patch({ quizState: newState, quizDirection: 1, quizStep: state.quizStep + 1 });
    } else {
      patch({ quizState: newState, quizDirection: 1 });
      runScan(calculateAuraScore(newState) as CardResult);
    }
  };

  // ── Named actions ────────────────────────────────────────────────────────────

  const actions: AuraFlowActions = {
    goToStep: (step) => patch({ step }),
    goHome: () => patch({ collectionOpen: false, rarityOddsOpen: false, isFlipped: false, quizStep: 0, step: "landing" }),
    start: () => {
      trackViewContent();
      patch({ step: "photo" });
    },
    setGender: (g) => {
      patch({ gender: g });
      try {
        if (g) localStorage.setItem("aura:gender", g);
        else localStorage.removeItem("aura:gender");
      } catch {
        /* ignore */
      }
    },
    setPhoto: (src) => patch({ photo: src }),
    requestUpload: () => patch({ photoIntent: "upload", step: "photo" }),
    clearPhotoIntent: () => patch({ photoIntent: null }),
    selectSampleAvatar: (num) => patch({ photo: `/avatar-${num}.png` }),
    setQuizField: (field, value) => patch({ quizState: { ...state.quizState, [field]: value } }),
    nextQuizStep,
    prevQuizStep,
    navToQuizStep,
    selectAndAdvance,
    setFlipped: (v) => patch({ isFlipped: v }),
    setBackMounted: (v) => patch({ backMounted: v }),
    completeReveal: () => patch({ isFirstReveal: false }),
    setScanMsgIndex: (i) => patch({ scanMsgIndex: i }),
    retryTransform: async () => {
      capacityRetryUsedRef.current = false;
      await retryTransform();
    },
    remix,
    confirmRemix,
    cancelRemix,
    setRemixSelectedIndex: (i) => patch({ remixSelectedIndex: i }),
    setRecipientInput: (v) => patch({ recipientInput: v }),
    setUseTempWallet: (v) => patch({ useTempWallet: v }),
    mint,
    copyMint,
    download,
    setSheet: (sheet, open) => patch({ [sheet]: open } as Partial<FlowState>),
    resetToLanding: () => {
      vrfSlugRef.current = null;
      vrfSeedRef.current = null;
      remixVrfSlugsRef.current = [null, null, null];
      remixVrfSeedsRef.current = [null, null, null];
      capacityRetryUsedRef.current = false;
      dispatch({ type: "reset" });
    },
  };

  // ── Effects (global to the flow) ─────────────────────────────────────────────

  // Wire the step machine into browser history so Back navigates within the app.
  const restoreNav = (pos: NavPosition) => {
    patch({ quizDirection: -1, step: pos.step as Step, quizStep: pos.quizStep, isFlipped: false });
  };
  useStepHistory({
    step: state.step,
    quizStep: state.quizStep,
    onRestore: restoreNav,
    transientSteps: ["scanner"],
    rootStep: "landing",
  });

  // Handle the return from Ziina checkout (?ship=success&pi=… / ?ship=cancelled).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ship = params.get("ship");
    if (!ship) return;
    const clean = () => window.history.replaceState({}, "", window.location.pathname);
    if (ship === "cancelled") {
      toast({ title: "Checkout cancelled", description: "No worries, your card wasn't ordered." });
      clean();
      return;
    }
    if (ship === "success") {
      const pi = params.get("pi");
      if (!pi) {
        clean();
        return;
      }
      const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
      fetch(`${base}/api/aura/ship/${pi}/status`)
        .then((r) => r.json())
        .then((d) => {
          if (d.paid) toast({ title: "Order confirmed", description: "Your physical Aura Card is on its way." });
          else toast({ title: "Payment pending", description: "We'll ship your card once payment clears." });
        })
        .catch(() => {})
        .finally(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload all flag images while on landing.
  useEffect(() => {
    FLAG_NATIONS.forEach((nation) => {
      const img = new Image();
      img.src = `https://flagcdn.com/w80/${NATION_FLAGS[nation]}.png`;
    });
  }, []);

  // Funnel event on each step.
  useEffect(() => {
    const map: Record<Step, string> = {
      landing: "aura_step_landing",
      photo: "aura_step_photo",
      quiz: "aura_step_quiz_start",
      scanner: "aura_step_scanning",
      result: "aura_step_result",
    };
    trackStep(map[state.step]);
  }, [state.step]);

  // Stop camera on unmount.
  useEffect(() => () => stopCamera(), []);

  // Stop the camera when leaving the photo step.
  useEffect(() => {
    if (state.step !== "photo") stopCamera();
  }, [state.step]);

  // Revoke previous blob: URL when the photo changes / on unmount.
  useEffect(() => {
    const p = state.photo;
    return () => {
      if (p && p.startsWith("blob:")) URL.revokeObjectURL(p);
    };
  }, [state.photo]);

  // When the landing "Upload" intent lands on the photo step, open the picker.
  useEffect(() => {
    if (state.step === "photo" && state.photoIntent === "upload") {
      fileInputRef.current?.click();
      patch({ photoIntent: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.photoIntent]);

  // Auto-fill the mint recipient when a real wallet connects.
  useEffect(() => {
    if (walletConnected && connectedWalletAddress) {
      patch({ recipientInput: connectedWalletAddress, useTempWallet: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletConnected, connectedWalletAddress]);

  // Gyroscope tilt on the result card (best-effort, mobile).
  useEffect(() => {
    if (state.step !== "result") return;
    const handle = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const gx = Math.max(-30, Math.min(30, e.gamma));
      const gy = Math.max(-30, Math.min(30, e.beta - 45));
      cardX.set((gx / 30) * 60);
      cardY.set((gy / 30) * 60);
    };
    window.addEventListener("deviceorientation", handle);
    return () => window.removeEventListener("deviceorientation", handle);
  }, [state.step, cardX, cardY]);

  // Auto-retry once with a visible countdown when the server is at capacity.
  useEffect(() => {
    if (state.transformStatus !== "error" || state.transformErrorKind !== "capacity") {
      if (state.capacityCountdown !== null) patch({ capacityCountdown: null });
      return;
    }
    if (capacityRetryUsedRef.current) return;
    capacityRetryUsedRef.current = true;
    let remaining = 5;
    patch({ capacityCountdown: remaining });
    const iv = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(iv);
        patch({ capacityCountdown: null });
        retryTransform();
      } else {
        patch({ capacityCountdown: remaining });
      }
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.transformStatus, state.transformErrorKind]);

  // Fire the rarity reveal once per card after save returns the server tier.
  useEffect(() => {
    if (!state.serverRarity || !state.cardSlug) return;
    if (revealedSlugs.has(state.cardSlug)) return;
    revealedSlugs.add(state.cardSlug);
    try {
      localStorage.setItem("aura:revealedSlugs", JSON.stringify([...revealedSlugs].slice(-200)));
    } catch {
      /* quota - ignore */
    }
    patch({ showRarityReveal: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.serverRarity, state.cardSlug]);

  // Pre-render the three share formats after the AI portrait is ready.
  useEffect(() => {
    if (state.transformStatus !== "success" || state.step !== "result" || !state.result) return;
    patch({ shareAssets: { just: null, prophecy: null, story: null }, cardSlug: null });
    const result = state.result;

    const runId = ++shareRunIdRef.current;
    const superseded = () => shareRunIdRef.current !== runId;

    const go = async () => {
      if (!captureRef.current) return;
      patch({ shareGenerating: true });
      try {
        const initialCapture = await captureCardCanvas(captureRef.current);
        if (superseded()) return;
        const justForApi = initialCapture.toDataURL("image/png");
        let base = initialCapture;
        try {
          const res = await saveCardMutation.mutateAsync({
            data: { card: result, imageDataUrl: justForApi, ...(vrfSlugRef.current ? { vrfSlug: vrfSlugRef.current } : {}) },
          });
          if (superseded()) return;
          const saved = res as { slug: string; rarity: string; editionNumber: number; vrfTxSig?: string };
          flushSync(() => {
            patch({
              cardSlug: saved.slug,
              serverRarity: saved.rarity,
              editionNumber: saved.editionNumber,
              ...(saved.vrfTxSig ? { vrfTxSig: saved.vrfTxSig } : {}),
              ...(vrfSeedRef.current
                ? { vrfProof: { seedHex: vrfSeedRef.current, archetype: String(result.archetype ?? "") } }
                : {}),
            });
          });
          if (captureRef.current) base = await captureCardCanvas(captureRef.current);
          if (superseded()) return;
          try {
            await updateCardImageMutation.mutateAsync({ slug: saved.slug, data: { imageDataUrl: base.toDataURL("image/png") } });
          } catch {
            /* non-critical */
          }
        } catch {
          /* save failed — fall back to client rarity/no edition stamp */
        }
        if (superseded()) return;
        patch({ shareAssets: buildShareAssets(base, result) });
      } catch (err) {
        console.error("Share asset generation failed:", err);
      } finally {
        if (!superseded()) patch({ shareGenerating: false });
      }
    };

    const timer = setTimeout(go, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.transformStatus, state.step, state.result, state.transformedImage]);

  const value: AuraFlowValue = useMemo(
    () => ({
      state,
      actions,
      effectiveRarity,
      rarityStyle,
      recipient,
      mintReady,
      mintError,
      mintResult,
      remixFocusMode,
      prefersReducedMotion,
      walletConnected,
      cardRef,
      captureRef,
      communityWallRef,
      fileInputRef,
      videoRef,
      cameraActive,
      cameraError,
      startCamera,
      stopCamera,
      capturePhoto,
      motion: { cardX, cardY, rotateX, rotateY, holoX, holoY, onMouseMove, onMouseLeave },
      mintStatusQuery,
      rarityStatsQuery,
      mintMutation,
    }),
    // Recompute whenever any observable input changes. `state` covers the reducer;
    // the rest are query/mutation objects that update on their own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, cameraActive, cameraError, effectiveRarity, recipient, mintReady, mintError, mintResult, walletConnected, prefersReducedMotion, mintStatusQuery.data, mintStatusQuery.isLoading, rarityStatsQuery.data, mintMutation.isPending, mintMutation.data, mintMutation.error],
  );

  return <AuraFlowContext.Provider value={value}>{children}</AuraFlowContext.Provider>;
}

export function useAuraFlow(): AuraFlowValue {
  const ctx = useContext(AuraFlowContext);
  if (!ctx) throw new Error("useAuraFlow must be used within an AuraFlowProvider");
  return ctx;
}
