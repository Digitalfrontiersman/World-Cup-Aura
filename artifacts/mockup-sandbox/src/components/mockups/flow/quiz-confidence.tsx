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

export default function QuizConfidenceScreen() {
  const confidence = 72;

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
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: i === 5 ? 8 : 6, borderRadius: 999,
              background: i === 5 ? "#fbbf24" : i < 5 ? "rgba(251,191,36,0.5)" : "#374151",
              boxShadow: i === 5 ? "0 0 8px rgba(251,191,36,0.7)" : "none",
            }} />
          ))}
        </div>

        <p style={{ color: "rgba(251,191,36,0.6)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
          6 / 7 - Belief Level
        </p>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}>
          <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            How confident are you that your team can win it all?
          </h2>

          {/* Slider track */}
          <div style={{ padding: "0 4px" }}>
            <div style={{ position: "relative", height: 6, background: "#1f2937", borderRadius: 999 }}>
              <div style={{
                position: "absolute", left: 0, width: `${confidence}%`, height: "100%",
                background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                borderRadius: 999,
              }} />
              <div style={{
                position: "absolute", left: `${confidence}%`, top: "50%",
                transform: "translate(-50%, -50%)",
                width: 24, height: 24, borderRadius: "50%",
                background: "#fbbf24", boxShadow: "0 0 12px rgba(251,191,36,0.6)",
              }} />
            </div>
          </div>

          {/* Value display */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{
              fontSize: 64, fontWeight: 900,
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {confidence}%
            </div>
            <div style={{ color: "#fbbf24", fontSize: 20, fontWeight: 500 }}>
              Dangerously hopeful
            </div>
          </div>
        </div>

        {/* Continue */}
        <button
          onClick={() => goTo("quiz-walkout")}
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
          onClick={() => goTo("quiz-weapon-flaw")}
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
