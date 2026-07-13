// ─────────────────────────────────────────────────────────────────────────────
// Shared types for the Aura flow (landing → photo → quiz → scanner → result).
// These describe every piece of state the flow tracks; the reducer in
// AuraFlowProvider is the single place that mutates them.
// ─────────────────────────────────────────────────────────────────────────────

export type Step = "landing" | "photo" | "quiz" | "scanner" | "result";

export type Gender = "Woman" | "Man";
export const GENDER_LABELS: Gender[] = ["Woman", "Man"];

export interface QuizState {
  name: string;
  nation: string;
  energy: string;
  weapon: string;
  flaw: string;
  confidence: number;
  walkout: string;
}

export const EMPTY_QUIZ: QuizState = {
  name: "",
  nation: "",
  energy: "",
  weapon: "",
  flaw: "",
  confidence: 50,
  walkout: "",
};

export interface CardStats {
  speed: number;
  clutch: number;
  iq: number;
  chaos: number;
  loyalty: number;
  banter: number;
}

// The computed card. Mirrors the return of calculateAuraScore() in lib/scoring.
export interface CardResult {
  id: string;
  name: string;
  nation: string;
  aura: number;
  power: number;
  stats: CardStats;
  rank: string;
  rarity: string;
  archetype: string;
  prophecy: string;
}

export type TransformStatus = "idle" | "loading" | "success" | "error";
export type TransformErrorKind = "capacity" | "ai_error";

// Remix portrait styles — single source of truth (used by the provider, the
// forge overlay, and the picker).
export const STYLE_VARIANTS: Array<"realistic" | "comic" | "fantasy"> = ["realistic", "comic", "fantasy"];
export const STYLE_LABELS: Record<string, string> = {
  realistic: "Cinematic",
  comic: "Comic Art",
  fantasy: "Fantasy",
};
export const MAX_REMIXES = 2;

export interface ShareAssets {
  just: string | null;
  prophecy: string | null;
  story: string | null;
}

export const EMPTY_SHARE_ASSETS: ShareAssets = { just: null, prophecy: null, story: null };

// The seven quiz questions, in order.
export const QUIZ_STEP_NAMES = [
  "Your Name",
  "Your Nation",
  "Matchday Energy",
  "Greatest Weapon",
  "Fan Flaw",
  "Belief Level",
  "Walkout Vibe",
] as const;

// Display tier derived from the aura score — passed to the transform prompt.
export function getAuraTier(aura: number): string {
  if (aura <= 33) return "Street Warrior";
  if (aura <= 50) return "Rising Star";
  if (aura <= 67) return "Club Legend";
  if (aura <= 83) return "National Hero";
  if (aura <= 93) return "World Class";
  return "Mythic Champion";
}
