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

export default function LandingScreen() {
  return (
    <div
      style={{
        width: 390,
        minHeight: 844,
        background: "#050816",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 40,
        paddingBottom: 40,
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      <ResetButton />

      {/* Background glow orbs */}
      <div style={{
        position: "absolute", top: "-15%", left: "-20%",
        width: "60%", height: "60%",
        background: "rgba(251,191,36,0.18)", borderRadius: "50%",
        filter: "blur(90px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-15%", right: "-20%",
        width: "60%", height: "60%",
        background: "rgba(34,197,94,0.12)", borderRadius: "50%",
        filter: "blur(90px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.95) 100%)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 999,
          background: "rgba(0,0,0,0.6)", border: "1px solid rgba(251,191,36,0.4)",
          color: "#fbbf24", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          ⚡ The Ultimate Fan Experience
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            color: "#fff", fontSize: 44, fontWeight: 900, textTransform: "uppercase",
            fontStyle: "italic", lineHeight: 1.0, margin: 0, letterSpacing: "-0.02em",
            textShadow: "0 4px 30px rgba(0,0,0,0.9)",
          }}>
            Unleash Your<br />
            <span style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #ffd700 70%, #fbbf24 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              World Cup Aura
            </span>
          </h1>
          <p style={{ color: "#d1d5db", fontSize: 15, maxWidth: 260, margin: "12px auto 0", lineHeight: 1.5 }}>
            Turn your selfie into a legendary fan card. Pick your nation. Reveal your power level.
          </p>
        </div>

        {/* Card stack preview */}
        <div style={{ position: "relative", width: "100%", height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Glow */}
          <div style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "rgba(251,191,36,0.35)", filter: "blur(60px)",
          }} />
          {/* Left card */}
          <div style={{
            position: "absolute", width: 140, height: 196,
            borderRadius: 14, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "linear-gradient(135deg, #1a2744 0%, #0f1a2e 100%)",
            transform: "rotate(-16deg) translateX(-88px) scale(0.86)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)" }} />
          </div>
          {/* Right card */}
          <div style={{
            position: "absolute", width: 140, height: 196,
            borderRadius: 14, overflow: "hidden",
            border: "1px solid rgba(34,197,94,0.3)",
            background: "linear-gradient(135deg, #1a2744 0%, #0f1a2e 100%)",
            transform: "rotate(16deg) translateX(88px) scale(0.86)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e4a3f 0%, #0a1e18 100%)" }} />
          </div>
          {/* Center card */}
          <div style={{
            position: "relative", width: 180, height: 248,
            borderRadius: 14, overflow: "hidden",
            border: "2px solid rgba(251,191,36,0.6)",
            background: "linear-gradient(135deg, #1a2744 0%, #0f1a2e 100%)",
            transform: "rotate(-3deg)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(34,197,94,0.35)",
          }}>
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(160deg, #1e3a5f 0%, #0a1628 60%, #1a2744 100%)",
            }} />
            {/* Score */}
            <div style={{ position: "absolute", top: 10, left: 12, textAlign: "center" }}>
              <div style={{
                fontSize: 36, fontWeight: 900, lineHeight: 1,
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>94</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Aura</div>
            </div>
            {/* Bottom label */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "20px 12px 10px",
              background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
            }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mythic Champion</div>
              <div style={{ color: "#fbbf24", fontSize: 9, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}>Legendary Striker</div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ textAlign: "center", fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Unlock Your World Cup Aura Fan Card Now
          </p>
          <button
            onClick={() => goTo("photo")}
            style={{
              width: "100%", height: 54, borderRadius: 12, border: "none",
              background: "#fbbf24", color: "#000", fontSize: 16,
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            📷 Take Selfie
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              onClick={() => goTo("photo")}
              style={{
                height: 54, borderRadius: 12, border: "1px solid #374151",
                background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14,
                fontWeight: 500, cursor: "pointer",
              }}
            >
              ⬆ Upload
            </button>
            <button
              onClick={() => goTo("photo")}
              style={{
                height: 54, borderRadius: 12, border: "1px solid #374151",
                background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14,
                fontWeight: 500, cursor: "pointer",
              }}
            >
              👤 Sample
            </button>
          </div>
        </div>

        {/* Footer teaser */}
        <p style={{ textAlign: "center", fontSize: 10, color: "#4b5563", margin: 0 }}>
          Part of an exclusive 100,000-card collection
        </p>
      </div>
    </div>
  );
}
