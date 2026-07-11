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

export default function QuizNameScreen() {
  const steps = 7;
  const current = 0;

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

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
        {/* Progress scrubber */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {Array.from({ length: steps }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: i === current ? 8 : 6, borderRadius: 999,
              background: i === current
                ? "#fbbf24"
                : i < current
                ? "rgba(251,191,36,0.5)"
                : "#374151",
              boxShadow: i === current ? "0 0 8px rgba(251,191,36,0.7)" : "none",
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        {/* Step label */}
        <p style={{ color: "rgba(251,191,36,0.6)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
          1 / 7 - Your Name
        </p>

        {/* Question */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
          <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            What should we call you on your card?
          </h2>

          {/* Text input */}
          <div style={{
            height: 56, borderRadius: 10,
            border: "1px solid rgba(251,191,36,0.5)",
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", paddingLeft: 16,
          }}>
            <span style={{ color: "#6b7280", fontSize: 18 }}>Your Name / Nickname</span>
          </div>
        </div>

        {/* Continue */}
        <button
          onClick={() => goTo("quiz-nation")}
          style={{
            width: "100%", height: 62, borderRadius: 12, border: "none",
            background: "#fbbf24", color: "#000", fontSize: 16, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer",
            boxShadow: "0 0 20px rgba(251,191,36,0.3)",
          }}
        >
          Continue →
        </button>
        <button
          onClick={() => goTo("photo")}
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
