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

const WEAPON_OPTIONS = [
  "Pure Aura", "Vision", "Speed", "Clutch Energy",
  "Trash Talk", "Loyalty", "Football IQ", "Chaos",
];

const FLAW_OPTIONS = [
  "I blame the referee immediately",
  "I become unbearable when we win",
  "I say \"this is our year\" every year",
  "I get superstitious and irrational",
];

export default function QuizWeaponFlawScreen() {
  return (
    <div style={{
      width: 390, minHeight: 844,
      background: "#050816",
      position: "relative", overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column",
      padding: "40px 20px 40px",
    }}>
      <ResetButton />
      <div style={{ position: "absolute", top: "-15%", left: "-20%", width: "60%", height: "60%", background: "rgba(251,191,36,0.12)", borderRadius: "50%", filter: "blur(90px)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: i === 3 ? 8 : 6, borderRadius: 999,
              background: i === 3 ? "#fbbf24" : i < 3 ? "rgba(251,191,36,0.5)" : "#374151",
              boxShadow: i === 3 ? "0 0 8px rgba(251,191,36,0.7)" : "none",
            }} />
          ))}
        </div>

        <p style={{ color: "rgba(251,191,36,0.6)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
          4 / 7 - Greatest Weapon
        </p>

        <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          Pick your greatest football weapon
        </h2>

        {/* Tap any weapon to advance */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {WEAPON_OPTIONS.map((opt, i) => (
            <button
              key={opt}
              onClick={() => goTo("quiz-confidence")}
              style={{
                height: 54, borderRadius: 10,
                border: i === 0 ? "none" : "1px solid #374151",
                background: i === 0 ? "#fbbf24" : "rgba(0,0,0,0.4)",
                color: i === 0 ? "#000" : "#fff",
                fontSize: 13, fontWeight: i === 0 ? 700 : 400, cursor: "pointer",
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Divider to next question preview */}
        <div style={{ margin: "8px 0", height: 1, background: "rgba(255,255,255,0.06)" }} />

        <p style={{ color: "rgba(251,191,36,0.4)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
          5 / 7 - Fan Flaw (next)
        </p>
        <h2 style={{ color: "rgba(255,255,255,0.3)", fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          What is your biggest fan flaw?
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 0.3 }}>
          {FLAW_OPTIONS.map((opt) => (
            <button key={opt} style={{
              height: 46, borderRadius: 10, border: "1px solid #374151",
              background: "rgba(0,0,0,0.4)", color: "#fff",
              fontSize: 12, textAlign: "left", paddingLeft: 14, cursor: "default",
            }}>
              {opt}
            </button>
          ))}
        </div>

        <button
          onClick={() => goTo("quiz-energy")}
          style={{
            width: "100%", height: 38, background: "transparent", border: "none",
            color: "#6b7280", fontSize: 14, cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
