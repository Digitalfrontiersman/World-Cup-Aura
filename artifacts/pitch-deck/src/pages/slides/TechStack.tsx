export default function TechStack() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Header */}
      <div className="absolute" style={{ top: "9vh", left: "8vw" }}>
        <div
          className="font-body uppercase tracking-widest mb-[1.5vh]"
          style={{ fontSize: "2.4vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          How We Built It
        </div>
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "5.5vw", fontWeight: 900, color: "#F5F0E8" }}
        >
          THE TECH STACK
        </div>
      </div>

      {/* Four tech layers */}
      <div
        className="absolute"
        style={{
          left: "8vw",
          right: "8vw",
          top: "36vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2.5vh 4vw",
        }}
      >
        {/* Frontend */}
        <div
          style={{
            background: "rgba(245,166,35,0.07)",
            border: "0.15vh solid rgba(245,166,35,0.25)",
            borderRadius: "1vw",
            padding: "2.2vh 2.2vw",
          }}
        >
          <div className="font-display mb-[1vh]" style={{ fontSize: "3.5vw", fontWeight: 900, color: "#F5A623" }}>
            FRONTEND
          </div>
          <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
            React + Vite + Tailwind CSS — camera capture, quiz flow, card display, and mint UI.
          </div>
        </div>

        {/* AI */}
        <div
          style={{
            background: "rgba(245,166,35,0.05)",
            border: "0.15vh solid rgba(245,166,35,0.18)",
            borderRadius: "1vw",
            padding: "2.2vh 2.2vw",
          }}
        >
          <div className="font-display mb-[1vh]" style={{ fontSize: "3.5vw", fontWeight: 900, color: "#F5A623" }}>
            AI LAYER
          </div>
          <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
            OpenAI GPT-image-1 for portrait generation. Express API server handles the generation pipeline.
          </div>
        </div>

        {/* Solana */}
        <div
          style={{
            background: "rgba(220,38,38,0.07)",
            border: "0.15vh solid rgba(220,38,38,0.22)",
            borderRadius: "1vw",
            padding: "2.2vh 2.2vw",
          }}
        >
          <div className="font-display mb-[1vh]" style={{ fontSize: "3.5vw", fontWeight: 900, color: "#DC2626" }}>
            SOLANA
          </div>
          <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
            Metaplex + Helius RPC — on-chain card storage with fast, reliable transaction handling.
          </div>
        </div>

        {/* Backend */}
        <div
          style={{
            background: "rgba(220,38,38,0.04)",
            border: "0.15vh solid rgba(220,38,38,0.15)",
            borderRadius: "1vw",
            padding: "2.2vh 2.2vw",
          }}
        >
          <div className="font-display mb-[1vh]" style={{ fontSize: "3.5vw", fontWeight: 900, color: "#DC2626" }}>
            BACKEND
          </div>
          <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
            Node.js + Express API server — handles image generation, quiz scoring, and card assembly.
          </div>
        </div>
      </div>
    </div>
  );
}
