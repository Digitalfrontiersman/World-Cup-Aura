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

export default function PhotoScreen() {
  return (
    <div style={{
      width: 390, minHeight: 844,
      background: "#050816",
      position: "relative", overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px 40px",
    }}>
      <ResetButton />
      <div style={{ position: "absolute", top: "-15%", left: "-20%", width: "60%", height: "60%", background: "rgba(251,191,36,0.15)", borderRadius: "50%", filter: "blur(90px)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
          <button
            onClick={() => goTo("landing")}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "2px solid rgba(251,191,36,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", cursor: "pointer",
            }}
          >
            <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700 }}>←</span>
          </button>
          <span style={{ color: "#6b7280", fontSize: 12 }}>Step 1 of 3</span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: 36, fontWeight: 900, textTransform: "uppercase", fontStyle: "italic", margin: 0, letterSpacing: "-0.01em" }}>
            Player Portrait
          </h2>
          <p style={{ color: "#9ca3af", fontSize: 14, margin: "8px 0 0" }}>
            Snap a selfie or upload a photo for your card.
          </p>
        </div>

        {/* Camera frame */}
        <div style={{
          width: 240, height: 300,
          borderRadius: 18, overflow: "hidden",
          border: "2px solid rgba(251,191,36,0.5)",
          background: "rgba(0,0,0,0.5)",
          boxShadow: "0 0 40px rgba(251,191,36,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 16,
        }}>
          <div style={{
            width: 70, height: 70, borderRadius: "50%",
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 32 }}>📷</span>
          </div>
          <p style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Take a selfie or upload
          </p>
        </div>

        {/* Camera / upload buttons */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button
            onClick={() => goTo("quiz-name")}
            style={{
              height: 54, borderRadius: 12, border: "none",
              background: "#fbbf24", color: "#000", fontSize: 14, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer",
            }}
          >
            📷 Take Selfie
          </button>
          <button
            onClick={() => goTo("quiz-name")}
            style={{
              height: 54, borderRadius: 12, border: "1px solid #374151",
              background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14, cursor: "pointer",
            }}
          >
            ⬆ Upload
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#1f2937" }} />
          <span style={{ color: "#6b7280", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Or use sample</span>
          <div style={{ flex: 1, height: 1, background: "#1f2937" }} />
        </div>

        {/* Sample avatars */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          {[1, 2, 3].map(n => (
            <div
              key={n}
              onClick={() => goTo("quiz-name")}
              style={{
                width: 60, height: 60, borderRadius: "50%", overflow: "hidden",
                border: "2px solid #374151",
                background: "linear-gradient(135deg, #1e3a5f, #0a1628)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 24 }}>👤</span>
            </div>
          ))}
        </div>

        {/* Continue CTA */}
        <button
          onClick={() => goTo("quiz-name")}
          style={{
            width: "100%", height: 62, borderRadius: 12, border: "none",
            background: "#fff", color: "#000", fontSize: 16, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer",
          }}
        >
          Continue to Aura Scan →
        </button>
      </div>
    </div>
  );
}
