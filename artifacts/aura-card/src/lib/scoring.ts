export interface AuraAnswers {
  name?: string;
  nation?: string;
  energy?: string;
  weapon?: string;
  flaw?: string;
  confidence?: number;
  walkout?: string;
}

export function calculateAuraScore(answers: AuraAnswers) {
  let aura = 50;
  let power = 500;
  let stats = {
    speed: 60,
    clutch: 60,
    iq: 60,
    chaos: 60,
    loyalty: 60,
    banter: 60,
  };

  // Confidence mapping
  const conf = answers.confidence || 50;
  aura += Math.floor((conf - 50) / 2);
  power += conf * 2;

  if (conf > 80) stats.banter += 15;
  if (conf < 30) stats.loyalty += 10;

  // Energy
  switch (answers.energy) {
    case "Calm Assassin": stats.clutch += 20; stats.iq += 10; aura += 5; break;
    case "Chaos Mode": stats.chaos += 25; stats.banter += 10; break;
    case "Tactical Genius": stats.iq += 25; stats.loyalty += 5; break;
    case "Savage Believer": stats.banter += 20; stats.loyalty += 10; break;
    case "Spiritual Supporter": stats.loyalty += 25; aura += 5; break;
    case "Delusional Champion": stats.chaos += 20; aura += 10; stats.banter += 15; break;
  }

  // Weapon
  switch (answers.weapon) {
    case "Pure Aura": aura += 15; power += 100; break;
    case "Vision": stats.iq += 20; break;
    case "Speed": stats.speed += 25; break;
    case "Clutch Energy": stats.clutch += 25; break;
    case "Trash Talk": stats.banter += 25; break;
    case "Loyalty": stats.loyalty += 20; break;
    case "Football IQ": stats.iq += 20; break;
    case "Chaos": stats.chaos += 25; break;
  }

  // Flaw (guard against an unset flaw so scoring never throws)
  const flaw = answers.flaw ?? "";
  if (flaw.includes("referee")) stats.banter += 10;
  if (flaw.includes("unbearable")) { stats.banter += 15; aura += 2; }
  if (flaw.includes("this is our year")) { stats.loyalty += 15; stats.chaos += 5; }

  // Clamp stats — no random noise here; server overwrites with VRF-derived deltas
  const clamp = (v: number) => Math.max(1, Math.min(99, Math.floor(v)));

  aura = clamp(aura);
  stats.speed   = clamp(stats.speed);
  stats.clutch  = clamp(stats.clutch);
  stats.iq      = clamp(stats.iq);
  stats.chaos   = clamp(stats.chaos);
  stats.loyalty = clamp(stats.loyalty);
  stats.banter  = clamp(stats.banter);
  power = Math.max(100, Math.min(999, Math.floor(power)));

  // Derived fields
  let rank = "Matchday Rookie";
  if (aura > 20) rank = "Street Warrior";
  if (aura > 35) rank = "Iron Defender";
  if (aura > 50) rank = "Midfield Engine";
  if (aura > 65) rank = "Elite Captain";
  if (aura > 75) rank = "Goal Hunter";
  if (aura > 84) rank = "National Hero";
  if (aura > 90) rank = "Aura Icon";
  if (aura > 95) rank = "World Class Legend";
  if (aura > 98) rank = "Mythic Champion";

  // Local preview rarity (server will assign the actual tier via VRF + quota at save time)
  const rarities = ["Core", "Rising", "Elite", "Icon", "Legendary", "Mythic"];
  const rarityIndex = Math.min(5, Math.floor(aura / 17));
  const rarity = rarities[rarityIndex];

  // Preview archetype — deterministic from energy answer.
  // Server overwrites this with the VRF-derived archetype at save time.
  const ENERGY_ARCHETYPE: Record<string, string> = {
    "Calm Assassin":        "Clutch Warrior",
    "Chaos Mode":           "Chaos Striker",
    "Tactical Genius":      "Tactical Captain",
    "Savage Believer":      "Underdog Hero",
    "Spiritual Supporter":  "National Icon",
    "Delusional Champion":  "Delusion King",
  };
  const archetype = ENERGY_ARCHETYPE[answers.energy ?? ""] ?? "Aura Midfielder";

  // Preview prophecy — deterministic from confidence level.
  // Server overwrites this with the VRF-derived prophecy at save time.
  const prophecies = [
    "You were born for late winners and emotional chaos.",
    "Your aura rises strongest when doubted.",
    "You will talk the most and suffer the most.",
    "You carry the energy of a nation that refuses to quit.",
    "You are dangerously confident and weirdly powerful.",
    "Your rival nation should fear your group chat energy.",
    "You may not survive penalties, but your aura will.",
  ];
  const prophecyIndex = Math.min(prophecies.length - 1, Math.floor(conf / (100 / prophecies.length)));
  const prophecy = prophecies[prophecyIndex];

  // Deterministic card ID from name + nation (no random component)
  const nameHash = [...(answers.name || "X")].reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
  const nationHash = [...(answers.nation || "X")].reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
  const id = `WCA-2026-${((nameHash * 31 + nationHash) % 9000) + 1000}`;

  return {
    id,
    name: answers.name || "Unknown Fan",
    nation: answers.nation || "Neutral",
    aura,
    power,
    stats,
    rank,
    rarity,
    archetype: archetype.slice(0, 30),
    prophecy: prophecy.slice(0, 120),
  };
}
