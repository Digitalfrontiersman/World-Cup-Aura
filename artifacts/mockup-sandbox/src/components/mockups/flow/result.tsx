function goTo(screen: string) {
  const { pathname } = window.location;
  const dir = pathname.substring(0, pathname.lastIndexOf("/") + 1);
  window.location.href = dir + screen;
}

function ResetButton() {
  return (
    <button
      onClick={() => goTo("landing")}
      style={{
        position: "fixed", top: 12, right: 12, zIndex: 9999,
        padding: "5px 10px", borderRadius: 8,
        background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.2)",
        color: "#9ca3af", fontSize: 11, fontWeight: 600, cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}
    >
      ↺ Reset
    </button>
  );
}

export default function ResultScreen() {
  return (
    <div style={{
      width: 390, minHeight: 844,
      background: "#050816",
      position: "relative", overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      padding: "32px 20px 32px",
      gap: 16,
    }}>
      <ResetButton />

      {/* Glow background */}
      <div style={{
        position: "absolute", top: "-10%", left: "-20%", width: "70%", height: "70%",
        background: "rgba(251,191,36,0.2)", borderRadius: "50%", filter: "blur(120px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-20%", width: "70%", height: "70%",
        background: "rgba(192,132,252,0.15)", borderRadius: "50%", filter: "blur(120px)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {/* Rarity badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 999,
          border: "2px solid rgba(251,191,36,0.55)",
          background: "rgba(251,191,36,0.15)",
          color: "#fbbf24", fontSize: 11, fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "0.15em",
          boxShadow: "0 0 12px rgba(251,191,36,0.3)",
        }}>
          ★ Legendary Striker
        </div>

        {/* Player name */}
        <h1 style={{
          color: "#fff", fontSize: 30, fontWeight: 900, textTransform: "uppercase",
          letterSpacing: "-0.01em", margin: 0, textAlign: "center",
        }}>
          Carlos "El Rayo" Mendez
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Brazil · Mythic Champion</p>

        {/* Card */}
        <div style={{
          width: "100%", maxWidth: 320,
          borderRadius: 18, overflow: "hidden",
          border: "3px solid rgba(251,191,36,0.55)",
          boxShadow: "0 0 50px rgba(251,191,36,0.35), 0 20px 60px rgba(0,0,0,0.8)",
          background: "linear-gradient(160deg, #1e3a5f 0%, #0a1628 60%, #1a2744 100%)",
          position: "relative",
          aspectRatio: "3/4",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
        }}>
          {/* Portrait placeholder */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, #2a4f7c 0%, #0a1628 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 80, opacity: 0.8,
          }}>
            👤
          </div>
          {/* Score overlay */}
          <div style={{ position: "absolute", top: 12, left: 14 }}>
            <div style={{
              fontSize: 44, fontWeight: 900, lineHeight: 1,
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>97</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Aura</div>
          </div>
          {/* Flag */}
          <div style={{ position: "absolute", top: 12, right: 14, fontSize: 22 }}>🇧🇷</div>
          {/* Bottom info */}
          <div style={{
            position: "relative", zIndex: 1,
            padding: "32px 16px 14px",
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)",
          }}>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 900, textTransform: "uppercase" }}>Carlos "El Rayo"</div>
            <div style={{ color: "#fbbf24", fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}>Legendary Striker</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {[["97", "Aura"], ["91", "Power"], ["88", "Speed"]].map(([v, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ color: "#fbbf24", fontSize: 16, fontWeight: 900 }}>{v}</div>
                  <div style={{ color: "#6b7280", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Save", icon: "⬇", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" },
            { label: "Share", icon: "↑", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" },
            { label: "Remix", icon: "✦", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" },
            { label: "Mint", icon: "◈", bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.4)" },
          ].map(({ label, icon, bg, border }) => (
            <button key={label} style={{
              height: 56, borderRadius: 12,
              border: `1px solid ${border}`,
              background: bg, color: "#fff",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, cursor: "pointer", fontSize: 18,
            }}>
              <span>{icon}</span>
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Prophecy */}
        <div style={{
          width: "100%", borderRadius: 14,
          background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)",
          padding: "14px 16px", textAlign: "center",
        }}>
          <p style={{ color: "#6b7280", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Matchday Prophecy</p>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>
            "Your belief ignites when others doubt. The final whistle belongs to you."
          </p>
        </div>

        {/* Play again */}
        <button
          onClick={() => goTo("landing")}
          style={{
            width: "100%", height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer",
          }}
        >
          ↺ Start Over
        </button>
      </div>
    </div>
  );
}
