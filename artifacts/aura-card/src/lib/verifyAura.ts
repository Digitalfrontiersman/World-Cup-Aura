// Client-side mirror of the server's VRF derivation (api-server/src/lib/solanaVrf.ts).
// Given the 32-byte seed that was committed on-chain (Solana Memo tx), anyone can
// re-derive the card's archetype / rarity / stat modifiers and confirm they match
// the card they were shown — i.e. the card wasn't tampered with after the on-chain
// commitment. Keep the arrays + byte layout in lockstep with the server.

// Must match ARCHETYPES in api-server/src/lib/solanaVrf.ts (order matters).
export const VRF_ARCHETYPES = [
  "Chaos Striker",
  "Tactical Captain",
  "Aura Midfielder",
  "Golden Boot Prophet",
  "Penalty Ghost",
  "Savage Winger",
  "Crowd Controller",
  "Clutch Warrior",
  "Delusion King",
  "Underdog Hero",
  "National Icon",
  "Final Boss Fan",
  "Group Chat Menace",
] as const;

// Must match RARITY_PULL_RATES / RARITY_TIERS_ORDERED in solanaVrf.ts.
const RARITY_PULL_RATES = [55.0, 25.0, 12.0, 5.5, 2.0, 0.5] as const;
const RARITY_TIERS_ORDERED = [
  "Core",
  "Rising",
  "Elite",
  "Icon",
  "Legendary",
  "Mythic",
] as const;

const STAT_KEYS = ["speed", "clutch", "iq", "chaos", "loyalty", "banter"] as const;

/** Parse a 32-byte hex seed into bytes. Returns null on malformed input. */
export function seedHexToBytes(seedHex: string): number[] | null {
  if (!/^[0-9a-fA-F]{64}$/.test(seedHex)) return null;
  const bytes: number[] = [];
  for (let i = 0; i < seedHex.length; i += 2) {
    bytes.push(parseInt(seedHex.slice(i, i + 2), 16));
  }
  return bytes;
}

/** Byte 0 → weighted rarity draw (rarest-first cumulative), mirroring pickRarity. */
export function deriveRarityFromSeed(seed: number[]): string {
  const rand = (seed[0] / 256) * 100.0;
  let cumRate = 0;
  let drawnIdx = 0;
  for (let i = RARITY_TIERS_ORDERED.length - 1; i >= 0; i--) {
    cumRate += RARITY_PULL_RATES[i];
    if (rand < cumRate) {
      drawnIdx = i;
      break;
    }
  }
  return RARITY_TIERS_ORDERED[drawnIdx];
}

/** Byte 1 → archetype index. */
export function deriveArchetypeFromSeed(seed: number[]): string {
  return VRF_ARCHETYPES[seed[1] % VRF_ARCHETYPES.length];
}

/** Bytes 3–8 → per-stat delta in −5..+5. */
export function deriveStatDeltasFromSeed(seed: number[]): Record<string, number> {
  const mapDelta = (byte: number) => Math.round((byte / 255) * 10 - 5);
  const deltas: Record<string, number> = {};
  STAT_KEYS.forEach((key, i) => {
    deltas[key] = mapDelta(seed[3 + i]);
  });
  return deltas;
}

export interface CardVerification {
  ok: boolean;
  seedValid: boolean;
  derivedArchetype: string | null;
  derivedSeedRarity: string | null;
  archetypeMatches: boolean;
}

/**
 * Verify a card against the on-chain seed. The archetype is always
 * seed-deterministic and must match. The final displayed rarity CAN differ from
 * the seed-derived rarity because edition quotas cascade to the next available
 * tier — so we report the seed rarity separately rather than asserting equality.
 */
export function verifyCard(
  seedHex: string,
  cardArchetype: string,
): CardVerification {
  const seed = seedHexToBytes(seedHex);
  if (!seed) {
    return {
      ok: false,
      seedValid: false,
      derivedArchetype: null,
      derivedSeedRarity: null,
      archetypeMatches: false,
    };
  }
  const derivedArchetype = deriveArchetypeFromSeed(seed);
  const derivedSeedRarity = deriveRarityFromSeed(seed);
  const archetypeMatches = derivedArchetype === cardArchetype;
  return {
    ok: archetypeMatches,
    seedValid: true,
    derivedArchetype,
    derivedSeedRarity,
    archetypeMatches,
  };
}
