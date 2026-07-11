function goTo(screen: string) {
  const { pathname } = window.location;
  const dir = pathname.substring(0, pathname.lastIndexOf("/") + 1);
  window.location.href = dir + screen;
}

function ResetButton() {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); goTo("landing"); }}
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

export default function RarityRevealScreen() {
  return (
    <div style={{
      width: 390, minHeight: 844,
      background: "#000",
      position: "relative", overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <ResetButton />

      {/* Deep background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(251,191,36,0.12) 0%, rgba(0,0,0,0.9) 70%)",
        pointerEvents: "none",
      }} />

      {/* Animated ring layers */}
      {[300, 240, 180].map((size, i) => (
        <div key={i} style={{
          position: "absolute", width: size, height: size, borderRadius: "50%",
          border: `1px solid rgba(251,191,36,${0.06 + i * 0.04})`,
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }} />
      ))}

      {/* Particle dots */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360;
        const r = 140;
        const x = Math.cos(angle * Math.PI / 180) * r;
        const y = Math.sin(angle * Math.PI / 180) * r;
        return (
          <div key={i} style={{
            position: "absolute",
            left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
            width: 4, height: 4, borderRadius: "50%",
            background: "#fbbf24", opacity: 0.6,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }} />
        );
      })}

      {/* Center content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {/* Glow burst */}
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(251,191,36,0) 70%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 60px rgba(251,191,36,0.5), 0 0 120px rgba(251,191,36,0.2)",
        }}>
          <span style={{ fontSize: 48 }}>⭐</span>
        </div>

        {/* Tier label */}
        <div style={{
          padding: "8px 20px", borderRadius: 999,
          border: "2px solid rgba(251,191,36,0.8)",
          background: "rgba(251,191,36,0.15)",
          boxShadow: "0 0 20px rgba(251,191,36,0.5)",
        }}>
          <span style={{
            color: "#fbbf24", fontSize: 13, fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.2em",
          }}>
            ✦ Legendary ✦
          </span>
        </div>

        <div>
          <h1 style={{
            color: "#fff", fontSize: 40, fontWeight: 900,
            textTransform: "uppercase", fontStyle: "italic",
            margin: 0, lineHeight: 1,
            textShadow: "0 0 40px rgba(251,191,36,0.8)",
          }}>
            LEGENDARY
          </h1>
          <p style={{
            background: "linear-gradient(135deg, #fbbf24, #ffd700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontSize: 18, fontWeight: 700, margin: "8px 0 0",
            letterSpacing: "0.15em", textTransform: "uppercase",
          }}>
            Striker
          </p>
        </div>

        <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.5, maxWidth: 260, margin: 0 }}>
          You are in the top <span style={{ color: "#fbbf24", fontWeight: 700 }}>3%</span> of all Aura Cards ever generated.
        </p>

        <button
          onClick={() => goTo("result")}
          style={{
            padding: "14px 40px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            color: "#000", fontSize: 16, fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.08em",
            cursor: "pointer", boxShadow: "0 0 30px rgba(251,191,36,0.5)",
          }}
        >
          Reveal My Card
        </button>
      </div>
    </div>
  );
}
