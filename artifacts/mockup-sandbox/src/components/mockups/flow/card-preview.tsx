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

export default function CardPreviewScreen() {
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

      {/* Background glows */}
      <div style={{
        position: "absolute", top: "-20%", left: "-20%", width: "60%", height: "60%",
        background: "rgba(192,132,252,0.2)", borderRadius: "50%", filter: "blur(120px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-20%", width: "60%", height: "60%",
        background: "rgba(192,132,252,0.12)", borderRadius: "50%", filter: "blur(120px)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {/* Rarity badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 999,
          border: "2px solid rgba(192,132,252,0.55)",
          background: "rgba(192,132,252,0.15)",
          color: "#c084fc", fontSize: 11, fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "0.15em",
          boxShadow: "0 0 12px rgba(192,132,252,0.3)",
        }}>
          ★ Icon Midfielder
        </div>

        <h1 style={{
          color: "#fff", fontSize: 28, fontWeight: 900, textTransform: "uppercase",
          letterSpacing: "-0.01em", margin: 0, textAlign: "center",
        }}>
          Marcus "The Vision"
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>England · Icon Commander</p>

        {/* Shared card */}
        <div style={{
          width: "100%", maxWidth: 300,
          borderRadius: 18, overflow: "hidden",
          border: "3px solid rgba(192,132,252,0.55)",
          boxShadow: "0 0 50px rgba(192,132,252,0.3), 0 20px 60px rgba(0,0,0,0.8)",
          background: "linear-gradient(160deg, #2a1a4f 0%, #0a0a28 60%, #1a1044 100%)",
          position: "relative", aspectRatio: "3/4",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, #3a2a6f 0%, #0a0a28 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 70, opacity: 0.8,
          }}>
            👤
          </div>
          <div style={{ position: "absolute", top: 12, left: 14 }}>
            <div style={{
              fontSize: 40, fontWeight: 900, lineHeight: 1,
              color: "#c084fc",
            }}>91</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Aura</div>
          </div>
          <div style={{ position: "absolute", top: 12, right: 14, fontSize: 20 }}>🏴󠁧󠁢󠁥󠁮󠁧󠁿</div>
          <div style={{
            position: "relative", zIndex: 1,
            padding: "32px 16px 14px",
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)",
          }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 900, textTransform: "uppercase" }}>Marcus "The Vision"</div>
            <div style={{ color: "#c084fc", fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}>Icon Midfielder</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {[["91", "Aura"], ["85", "Power"], ["79", "Speed"]].map(([v, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ color: "#c084fc", fontSize: 16, fontWeight: 900 }}>{v}</div>
                  <div style={{ color: "#6b7280", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[["91", "Aura"], ["85", "Power"], ["79", "Speed"]].map(([v, l]) => (
            <div key={l} style={{
              borderRadius: 12, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)",
              padding: "12px 8px", textAlign: "center",
            }}>
              <p style={{ color: "#c084fc", fontSize: 22, fontWeight: 900, margin: 0 }}>{v}</p>
              <p style={{ color: "#6b7280", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, fontWeight: 700 }}>{l}</p>
            </div>
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
            "The pitch becomes your stage. Your vision sees what others cannot."
          </p>
        </div>

        {/* Think you can beat this CTA */}
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0, textAlign: "center" }}>
          Think your card can beat this?
        </p>
        <button
          onClick={() => goTo("landing")}
          style={{
            width: "100%", height: 56, borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, rgba(192,132,252,0.85), rgba(192,132,252,0.6))",
            color: "#000", fontSize: 14, fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer",
          }}
        >
          ⚡ Reveal Your Aura
        </button>

        <p style={{ color: "#4b5563", fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.15em", margin: 0 }}>
          World Cup Aura Card
        </p>
      </div>
    </div>
  );
}
