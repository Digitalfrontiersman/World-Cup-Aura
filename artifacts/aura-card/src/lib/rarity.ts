// Single source of truth for rarity ordering, colors and labels. Previously the
// base color map was copied into CardDetailModal, CommunityWall,
// CommunityCarousel and RarityEffects; keep the canonical values here.

export const RARITY_ORDER = [
  "Core",
  "Rising",
  "Elite",
  "Icon",
  "Legendary",
  "Mythic",
] as const;

export type Rarity = (typeof RARITY_ORDER)[number];

// Canonical rarity → base color. Legacy tier names (Common/Rare/Epic) map to
// their modern equivalents for backward compatibility with older stored cards.
export const RARITY_COLORS: Record<string, string> = {
  Core: "#cbd5e1",
  Rising: "#60a5fa",
  Elite: "#22d3ee",
  Icon: "#c084fc",
  Legendary: "#fbbf24",
  Mythic: "#fb7185",
  Common: "#cbd5e1",
  Rare: "#60a5fa",
  Epic: "#c084fc",
};

export const RARITY_LABELS: Record<string, string> = {
  Core: "CORE",
  Rising: "RISING",
  Elite: "ELITE",
  Icon: "ICON",
  Legendary: "LEGENDARY",
  Mythic: "MYTHIC",
};

export function rarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? RARITY_COLORS.Core;
}
