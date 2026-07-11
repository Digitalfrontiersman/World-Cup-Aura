export default function WhatWeBuilt() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Faint background number */}
      <div
        className="absolute font-display"
        style={{
          right: "-2vw",
          bottom: "-4vh",
          fontSize: "38vw",
          fontWeight: 900,
          color: "rgba(245,166,35,0.035)",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        01
      </div>

      {/* Center content */}
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ top: 0, left: "6vw", right: "6vw", bottom: 0 }}
      >
        <div
          className="font-body uppercase tracking-widest mb-[4vh]"
          style={{ fontSize: "2.4vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          What We Built
        </div>
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "8vw", fontWeight: 900, color: "#F5F0E8", textWrap: "balance" }}
        >
          ONE SELFIE.
        </div>
        <div
          className="font-display leading-none tracking-tight mt-[1vh]"
          style={{ fontSize: "8vw", fontWeight: 900, color: "#F5F0E8", textWrap: "balance" }}
        >
          ONE QUIZ.
        </div>
        <div
          className="font-display leading-none tracking-tight mt-[1vh]"
          style={{ fontSize: "8vw", fontWeight: 900, color: "#F5A623", textWrap: "balance" }}
        >
          ONE CARD ON SOLANA.
        </div>

        <div className="mt-[4vh] mb-[3.5vh]" style={{ width: "6vw", height: "0.4vh", background: "#F5A623" }} />

        {/* Three quick facts inline */}
        <div className="flex items-center justify-center" style={{ gap: "4vw" }}>
          <div className="text-center">
            <div className="font-display" style={{ fontSize: "5vw", fontWeight: 900, color: "#F5A623" }}>60s</div>
            <div className="font-body" style={{ fontSize: "2.6vw", color: "#8B95B0" }}>end-to-end</div>
          </div>
          <div style={{ width: "0.15vw", height: "7vh", background: "rgba(245,166,35,0.25)" }} />
          <div className="text-center">
            <div className="font-display" style={{ fontSize: "5vw", fontWeight: 900, color: "#F5A623" }}>0</div>
            <div className="font-body" style={{ fontSize: "2.6vw", color: "#8B95B0" }}>wallet setup</div>
          </div>
          <div style={{ width: "0.15vw", height: "7vh", background: "rgba(245,166,35,0.25)" }} />
          <div className="text-center">
            <div className="font-display" style={{ fontSize: "5vw", fontWeight: 900, color: "#DC2626" }}>Solana</div>
            <div className="font-body" style={{ fontSize: "2.6vw", color: "#8B95B0" }}>powered</div>
          </div>
        </div>
      </div>
    </div>
  );
}
