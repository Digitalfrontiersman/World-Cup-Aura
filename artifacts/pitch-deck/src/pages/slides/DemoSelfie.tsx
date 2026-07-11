export default function DemoSelfie() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Right: label + caption */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ right: "6vw", top: 0, bottom: 0, width: "30vw" }}
      >
        <div
          className="font-body uppercase tracking-widest mb-[2vh]"
          style={{ fontSize: "2.2vw", color: "#DC2626", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          Demo - Step 2
        </div>
        <div
          className="font-display leading-none tracking-tight mb-[3vh]"
          style={{ fontSize: "5.5vw", fontWeight: 900, color: "#F5F0E8" }}
        >
          SELFIE + QUIZ
        </div>
        <div className="mb-[3vh]" style={{ width: "5vw", height: "0.4vh", background: "#DC2626" }} />
        <div
          className="font-body mb-[2.5vh]"
          style={{ fontSize: "3vw", color: "#8B95B0", textWrap: "pretty" }}
        >
          Take a photo or upload one. Then answer 7 quick questions - your answers shape every stat on the card.
        </div>
        <div className="flex flex-col" style={{ gap: "1.5vh" }}>
          <div className="font-body" style={{ fontSize: "2.8vw", color: "#F5F0E8" }}>
            ★ Archetype
          </div>
          <div className="font-body" style={{ fontSize: "2.8vw", color: "#F5F0E8" }}>
            ★ Rarity tier
          </div>
          <div className="font-body" style={{ fontSize: "2.8vw", color: "#F5F0E8" }}>
            ★ Prophecy text
          </div>
        </div>
      </div>

      {/* Left: screenshot placeholder - two panels side by side */}
      <div
        className="absolute flex"
        style={{ left: "6vw", top: "6vh", bottom: "6vh", width: "50vw", gap: "2vw" }}
      >
        {/* Selfie panel */}
        <div
          className="flex-1 flex flex-col items-center justify-center"
          style={{
            border: "0.3vh dashed rgba(220,38,38,0.45)",
            borderRadius: "1.2vw",
            background: "rgba(220,38,38,0.04)",
          }}
        >
          <div className="font-body text-center" style={{ fontSize: "3vw", color: "rgba(220,38,38,0.6)", fontWeight: 700 }}>
            Insert screenshot
          </div>
          <div className="font-body text-center mt-[1.2vh]" style={{ fontSize: "2.6vw", color: "rgba(139,149,176,0.5)" }}>
            Selfie / camera screen
          </div>
        </div>

        {/* Quiz panel */}
        <div
          className="flex-1 flex flex-col items-center justify-center"
          style={{
            border: "0.3vh dashed rgba(245,166,35,0.4)",
            borderRadius: "1.2vw",
            background: "rgba(245,166,35,0.03)",
          }}
        >
          <div className="font-body text-center" style={{ fontSize: "3vw", color: "rgba(245,166,35,0.55)", fontWeight: 700 }}>
            Insert screenshot
          </div>
          <div className="font-body text-center mt-[1.2vh]" style={{ fontSize: "2.6vw", color: "rgba(139,149,176,0.5)" }}>
            Quiz question screen
          </div>
        </div>
      </div>
    </div>
  );
}
