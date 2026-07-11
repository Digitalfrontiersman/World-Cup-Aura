/**
 * A slow, living aurora field of blurred drifting color blobs. Sits behind all
 * content. The dominant color can be tinted (e.g. by a card's rarity on the
 * result screen); it defaults to the app's gold. Purely decorative and
 * pointer-events-none, and it respects prefers-reduced-motion via CSS.
 */
export function AuroraBackground({ color }: { color?: string }) {
  const c = color ?? "#fbbf24"; // gold

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60">
      <div
        className="aurora-layer"
        style={{
          background: `radial-gradient(40% 40% at 28% 30%, ${c}55, transparent 70%)`,
        }}
      />
      <div
        className="aurora-layer"
        style={{
          background:
            "radial-gradient(45% 45% at 72% 62%, rgba(34,211,238,0.28), transparent 70%)",
          animationDelay: "-7s",
          animationDuration: "26s",
        }}
      />
      <div
        className="aurora-layer"
        style={{
          background: `radial-gradient(38% 38% at 55% 82%, ${c}33, transparent 70%)`,
          animationDelay: "-13s",
          animationDuration: "32s",
        }}
      />
    </div>
  );
}
