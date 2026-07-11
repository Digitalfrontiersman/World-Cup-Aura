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

const FLAGS = [
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "France", flag: "🇫🇷" },
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Morocco", flag: "🇲🇦" },
  { name: "USA", flag: "🇺🇸" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "Nigeria", flag: "🇳🇬" },
];

export default function QuizNationScreen() {
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
        {/* Progress */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: i === 1 ? 8 : 6, borderRadius: 999,
              background: i === 1 ? "#fbbf24" : i < 1 ? "rgba(251,191,36,0.5)" : "#374151",
              boxShadow: i === 1 ? "0 0 8px rgba(251,191,36,0.7)" : "none",
            }} />
          ))}
        </div>

        <p style={{ color: "rgba(251,191,36,0.6)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
          2 / 7 - Your Nation
        </p>

        <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          Which nation has your heart?
        </h2>

        {/* Flag grid - tap any to advance */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, flex: 1, alignContent: "start" }}>
          {FLAGS.map(({ name, flag }) => (
            <div
              key={name}
              onClick={() => goTo("quiz-energy")}
              style={{
                borderRadius: 12, overflow: "hidden",
                border: name === "Brazil" ? "2px solid #fbbf24" : "2px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.5)",
                display: "flex", flexDirection: "column", alignItems: "center",
                boxShadow: name === "Brazil" ? "0 0 12px rgba(251,191,36,0.6)" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: "100%", aspectRatio: "3/2",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.05)", fontSize: 28,
              }}>
                {flag}
              </div>
              <span style={{ color: "#fff", fontSize: 10, padding: "4px 4px 6px", textAlign: "center", fontWeight: 500, lineHeight: 1.2 }}>
                {name}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => goTo("quiz-name")}
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
