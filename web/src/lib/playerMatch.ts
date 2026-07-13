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
  /**
   * The card's rarity tier. Gates which elite players can be matched: mirroring
   * a GOAT (Messi/Ronaldo) needs a Legendary/Mythic card; "star" players need
   * Icon+. Omit to allow every player (ungated).
   */
  rarity?: string;
}

// Rarity tiers in ascending order. Legacy names (Common/Rare/Epic) map onto
// their modern equivalents so older stored cards still gate correctly.
const RARITY_RANK: Record<string, number> = {
  Core: 0, Common: 0,
  Rising: 1, Rare: 1,
  Elite: 2,
  Icon: 3, Epic: 3,
  Legendary: 4,
  Mythic: 5,
};

/** Minimum card rank required to be eligible for each elite tier. */
const ELITE_MIN_RANK = { star: 3 /* Icon */, goat: 4 /* Legendary */ } as const;

function isEligible(player: Player, cardRank: number): boolean {
  if (!player.eliteTier) return true;
  return cardRank >= ELITE_MIN_RANK[player.eliteTier];
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

  // Gate elite players by the card's rarity tier so GOAT/star mirrors are rare.
  const cardRank = input.rarity !== undefined ? (RARITY_RANK[input.rarity] ?? 0) : 5;
  const eligible = players.filter((p) => isEligible(p, cardRank));
  const pool = eligible.length > 0 ? eligible : players;

  let best: Player | null = null;
  let bestDistance = Infinity;

  for (const p of pool) {
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

  // Lead with the rarity of the mirror for elite matches.
  if (player.eliteTier === "goat") {
    reasons.push("An almost impossible mirror - you share a GOAT's aura.");
  } else if (player.eliteTier === "star") {
    reasons.push("A rare mirror - you echo a genuine superstar.");
  }

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
