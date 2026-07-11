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

export default function ScannerScreen() {
  return (
    <div
      onClick={() => goTo("rarity-reveal")}
      style={{
        width: 390, minHeight: 844,
        background: "#050816",
        position: "relative", overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 20px",
        gap: 48,
        cursor: "pointer",
      }}
    >
      <ResetButton />

      {/* Radial HUD background glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(251,191,36,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Outer ring decoration */}
      <div style={{
        position: "absolute", width: 320, height: 320, borderRadius: "50%",
        border: "1px solid rgba(251,191,36,0.1)",
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 240, height: 240, borderRadius: "50%",
        border: "1px solid rgba(251,191,36,0.08)",
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />

      {/* Photo frame with scan overlay */}
      <div style={{
        position: "relative", width: 230, height: 286,
        borderRadius: 14, overflow: "hidden",
        border: "2px solid rgba(251,191,36,0.3)",
        boxShadow: "0 0 50px rgba(251,191,36,0.2)",
        background: "#0a0f1e",
      }}>
        {/* Placeholder avatar */}
        <div style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 72, filter: "grayscale(0.3)",
        }}>
          👤
        </div>

        {/* Golden overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(251,191,36,0.12)",
          mixBlendMode: "overlay",
        }} />

        {/* Scan line */}
        <div style={{
          position: "absolute", left: 0, right: 0,
          top: "35%", height: 2,
          background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.8), transparent)",
        }} />

        {/* Corner marks */}
        {[
          { top: 8, left: 8, borderTop: "2px solid #fbbf24", borderLeft: "2px solid #fbbf24" },
          { top: 8, right: 8, borderTop: "2px solid #fbbf24", borderRight: "2px solid #fbbf24" },
          { bottom: 8, left: 8, borderBottom: "2px solid #fbbf24", borderLeft: "2px solid #fbbf24" },
          { bottom: 8, right: 8, borderBottom: "2px solid #fbbf24", borderRight: "2px solid #fbbf24" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 16, height: 16, ...s }} />
        ))}
      </div>

      {/* Status text */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {/* Spinner ring */}
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            border: "2px solid rgba(251,191,36,0.2)",
            borderTop: "2px solid #fbbf24",
          }} />
          <span style={{ color: "#fbbf24", fontSize: 15, fontWeight: 700, letterSpacing: "0.05em" }}>
            Scanning fan aura...
          </span>
        </div>

        <p style={{ color: "#4b5563", fontSize: 12, margin: 0 }}>
          AI is forging your legendary card
        </p>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 4 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i <= 2 ? "#fbbf24" : "#374151",
            }} />
          ))}
        </div>

        <p style={{ color: "#6b7280", fontSize: 11, margin: "8px 0 0", fontStyle: "italic" }}>
          Tap anywhere to skip ahead →
        </p>
      </div>

      {/* HUD data rows */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Aura Frequency", value: "■■■■■■■■░░", color: "#fbbf24" },
          { label: "Loyalty Index", value: "■■■■■■░░░░", color: "#22d3ee" },
          { label: "Delusion Factor", value: "■■■■░░░░░░", color: "#c084fc" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
            <span style={{ color, fontSize: 12, fontFamily: "monospace", letterSpacing: "2px" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
