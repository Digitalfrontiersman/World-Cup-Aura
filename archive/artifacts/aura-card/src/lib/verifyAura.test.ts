import { describe, it, expect } from "vitest";
import {
  seedHexToBytes,
  deriveArchetypeFromSeed,
  deriveRarityFromSeed,
  deriveStatDeltasFromSeed,
  verifyCard,
  VRF_ARCHETYPES,
} from "./verifyAura";

// Build a 32-byte hex seed with specific bytes at given positions.
function makeSeed(overrides: Record<number, number>): string {
  const bytes = new Array(32).fill(0);
  for (const [i, v] of Object.entries(overrides)) bytes[Number(i)] = v;
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("verifyAura", () => {
  it("rejects malformed seeds", () => {
    expect(seedHexToBytes("nothex")).toBeNull();
    expect(seedHexToBytes("ab")).toBeNull();
    expect(seedHexToBytes("a".repeat(64))).toHaveLength(32);
  });

  it("derives archetype from byte 1 (mod length)", () => {
    const seed = seedHexToBytes(makeSeed({ 1: 1 }))!;
    expect(deriveArchetypeFromSeed(seed)).toBe(VRF_ARCHETYPES[1]);
    const wrapped = seedHexToBytes(makeSeed({ 1: VRF_ARCHETYPES.length }))!;
    expect(deriveArchetypeFromSeed(wrapped)).toBe(VRF_ARCHETYPES[0]);
  });

  it("maps byte 0 to the rarest tier at the extremes", () => {
    expect(deriveRarityFromSeed(seedHexToBytes(makeSeed({ 0: 0 }))!)).toBe("Mythic");
    expect(deriveRarityFromSeed(seedHexToBytes(makeSeed({ 0: 255 }))!)).toBe("Core");
  });

  it("maps stat delta bytes into -5..+5", () => {
    const deltas = deriveStatDeltasFromSeed(seedHexToBytes(makeSeed({ 3: 0, 4: 255 }))!);
    expect(deltas.speed).toBe(-5);
    expect(deltas.clutch).toBe(5);
    for (const v of Object.values(deltas)) {
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it("verifyCard confirms a matching archetype and flags a mismatch", () => {
    const seedHex = makeSeed({ 1: 2 }); // VRF_ARCHETYPES[2] = "Aura Midfielder"
    const good = verifyCard(seedHex, VRF_ARCHETYPES[2]);
    expect(good.ok).toBe(true);
    expect(good.archetypeMatches).toBe(true);
    expect(good.derivedArchetype).toBe(VRF_ARCHETYPES[2]);

    const bad = verifyCard(seedHex, "Not The Real Archetype");
    expect(bad.ok).toBe(false);
    expect(bad.archetypeMatches).toBe(false);
  });
});
