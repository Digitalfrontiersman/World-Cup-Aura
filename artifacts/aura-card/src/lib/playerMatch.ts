import { PLAYERS, type Player, type PlayerStatProfile } from "./players";

// -----------------------------------------------------------------------------
// Data source seam
// -----------------------------------------------------------------------------
// The self-contained dataset lives in players.ts. When the Solana sports-data
// API is available, implement the fetch here and merge/replace PLAYERS. The rest
// of the matching logic is source-agnostic.
export function loadPlayers(): Player[] {
  return PLAYERS;
}

// -----------------------------------------------------------------------------
// Matching
// -----------------------------------------------------------------------------

const STAT_KEYS = ["speed", "clutch", "iq", "chaos", "loyalty", "banter"] as const;
type StatKey = (typeof STAT_KEYS)[number];

const STAT_LABEL: Record<StatKey, string> = {
  speed: "pace",
  clutch: "clutch factor",
  iq: "football IQ",
  chaos: "chaos energy",
  loyalty: "loyalty",
  banter: "banter",
};

export interface MatchInput {
  stats: Partial<PlayerStatProfile>;
  nation?: string;
  archetype?: string;
}

export interface PlayerMatchResult {
  player: Player;
  /** 0-100 similarity, higher is a closer match. */
  score: number;
  reasons: string[];
}

// Same-nation players feel like a better "who do you resemble" answer, so they
// get a distance discount without fully overriding the stat profile.
const NATION_AFFINITY = 22;

function clampStat(v: number | undefined): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 60;
  return Math.max(1, Math.min(99, v));
}

/** Top N stat keys for a profile, highest first (stable order on ties). */
function topStats(profile: Record<StatKey, number>, n: number): StatKey[] {
  return [...STAT_KEYS]
    .sort((a, b) => profile[b] - profile[a])
    .slice(0, n);
}

/**
 * Match a card to the football player it most resembles. Deterministic: the same
 * card always returns the same player. Combines a Euclidean distance over the six
 * shared stats with a same-nation affinity discount.
 */
export function matchPlayer(
  input: MatchInput,
  players: Player[] = loadPlayers(),
): PlayerMatchResult {
  const stats: Record<StatKey, number> = {
    speed: clampStat(input.stats.speed),
    clutch: clampStat(input.stats.clutch),
    iq: clampStat(input.stats.iq),
    chaos: clampStat(input.stats.chaos),
    loyalty: clampStat(input.stats.loyalty),
    banter: clampStat(input.stats.banter),
  };

  let best: Player | null = null;
  let bestDistance = Infinity;

  for (const p of players) {
    let sumSq = 0;
    for (const k of STAT_KEYS) {
      const d = stats[k] - p.profile[k];
      sumSq += d * d;
    }
    let distance = Math.sqrt(sumSq);
    if (input.nation && p.nation === input.nation) distance -= NATION_AFFINITY;

    if (distance < bestDistance) {
      bestDistance = distance;
      best = p;
    }
  }

  // players is never empty (players.ts ships a fixed list), but guard anyway.
  const player = best ?? players[0];

  // Similarity score for display: a perfect stat match is ~100, degrading with
  // distance. Floored so the UI never shows a demoralising low number.
  const rawDistance = Math.max(0, bestDistance);
  const score = Math.max(55, Math.min(99, Math.round(100 - rawDistance / 2.2)));

  const reasons = buildReasons(stats, input, player);
  return { player, score, reasons };
}

function buildReasons(
  stats: Record<StatKey, number>,
  input: MatchInput,
  player: Player,
): string[] {
  const reasons: string[] = [];

  // Shared dominant traits: stats where both the user and the player are strong.
  const userTop = topStats(stats, 3);
  const playerTop = new Set(topStats(player.profile, 3));
  const shared = userTop.filter((k) => playerTop.has(k));

  if (shared.length > 0) {
    const labels = shared.slice(0, 2).map((k) => STAT_LABEL[k]);
    reasons.push(
      `You both lead with ${labels.join(" and ")}.`,
    );
  }

  if (input.nation && player.nation === input.nation) {
    reasons.push(`Same flag: you both rep ${player.nation}.`);
  }

  // Always include the player's signature blurb so the match reads naturally.
  reasons.push(`They are ${player.blurb}.`);

  return reasons;
}
