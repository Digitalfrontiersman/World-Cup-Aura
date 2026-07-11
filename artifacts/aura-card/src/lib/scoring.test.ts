import { describe, it, expect } from "vitest";
import { calculateAuraScore } from "./scoring";

describe("calculateAuraScore", () => {
  it("is deterministic — same input yields identical output", () => {
    const answers = {
      name: "Sam",
      nation: "Brazil",
      energy: "Chaos Mode",
      weapon: "Pure Aura",
      flaw: "I blame the referee",
      confidence: 70,
    };
    expect(calculateAuraScore(answers)).toEqual(calculateAuraScore(answers));
  });

  it("clamps stats and aura/power into valid ranges", () => {
    const maxed = calculateAuraScore({
      name: "Max",
      nation: "Argentina",
      energy: "Delusional Champion",
      weapon: "Pure Aura",
      flaw: "unbearable",
      confidence: 100,
    });
    expect(maxed.aura).toBeGreaterThanOrEqual(1);
    expect(maxed.aura).toBeLessThanOrEqual(99);
    expect(maxed.power).toBeGreaterThanOrEqual(100);
    expect(maxed.power).toBeLessThanOrEqual(999);
    for (const v of Object.values(maxed.stats)) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(99);
    }
  });

  it("does not throw when optional fields are missing", () => {
    // flaw/energy/weapon all unset — previously answers.flaw.includes() threw.
    expect(() => calculateAuraScore({})).not.toThrow();
    const r = calculateAuraScore({});
    expect(r.name).toBe("Unknown Fan");
    expect(r.nation).toBe("Neutral");
  });

  it("maps energy to the expected preview archetype", () => {
    expect(calculateAuraScore({ energy: "Tactical Genius" }).archetype).toBe(
      "Tactical Captain",
    );
    expect(calculateAuraScore({ energy: "totally unknown" }).archetype).toBe(
      "Aura Midfielder",
    );
  });

  it("derives a higher rarity tier as aura increases", () => {
    const low = calculateAuraScore({ confidence: 0 });
    const high = calculateAuraScore({
      energy: "Delusional Champion",
      weapon: "Pure Aura",
      confidence: 100,
    });
    const order = ["Core", "Rising", "Elite", "Icon", "Legendary", "Mythic"];
    expect(order.indexOf(high.rarity)).toBeGreaterThanOrEqual(
      order.indexOf(low.rarity),
    );
  });

  it("produces a deterministic WCA card id from name + nation", () => {
    const a = calculateAuraScore({ name: "Sam", nation: "Brazil" });
    const b = calculateAuraScore({ name: "Sam", nation: "Brazil" });
    expect(a.id).toBe(b.id);
    expect(a.id).toMatch(/^WCA-2026-\d{4}$/);
  });
});
