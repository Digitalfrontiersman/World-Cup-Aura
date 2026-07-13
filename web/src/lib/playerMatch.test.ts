import { describe, it, expect } from "vitest";
import { matchPlayer } from "./playerMatch";
import { PLAYERS } from "./players";

describe("matchPlayer", () => {
  it("is deterministic for the same input", () => {
    const input = {
      stats: { speed: 90, clutch: 90, iq: 80, chaos: 60, loyalty: 70, banter: 66 },
      nation: "France",
    };
    expect(matchPlayer(input).player.id).toBe(matchPlayer(input).player.id);
  });

  it("returns a valid player and a bounded score", () => {
    const r = matchPlayer({ stats: {}, nation: "Neutral" });
    expect(PLAYERS.some((p) => p.id === r.player.id)).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(55);
    expect(r.score).toBeLessThanOrEqual(99);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("prefers a same-nation player when stats are close", () => {
    // Griezmann-ish profile but also near other playmakers; nation should tip it.
    const r = matchPlayer({
      stats: { speed: 78, clutch: 84, iq: 90, chaos: 45, loyalty: 92, banter: 70 },
      nation: "France",
    });
    expect(r.player.nation).toBe("France");
    expect(r.reasons.some((x) => x.includes("France"))).toBe(true);
  });

  it("matches a chaos/banter profile to a high-chaos player", () => {
    const r = matchPlayer({
      stats: { speed: 90, clutch: 70, iq: 66, chaos: 96, loyalty: 74, banter: 84 },
    });
    expect(r.player.profile.chaos).toBeGreaterThanOrEqual(80);
  });
});
