export default function DemoCard() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Header - top left */}
      <div className="absolute" style={{ top: "8vh", left: "8vw" }}>
        <div
          className="font-body uppercase tracking-widest mb-[1.5vh]"
          style={{ fontSize: "2.2vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          Demo - Step 3
        </div>
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "5.5vw", fontWeight: 900, color: "#F5F0E8" }}
        >
          YOUR AURA CARD
        </div>
      </div>

      {/* Large central screenshot placeholder */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: "8vw", right: "8vw", top: "28vh", bottom: "18vh" }}
      >
        <div
          className="w-full h-full flex flex-col items-center justify-center"
          style={{
            border: "0.35vh dashed rgba(245,166,35,0.5)",
            borderRadius: "1.4vw",
            background: "rgba(245,166,35,0.04)",
            position: "relative",
          }}
        >
          {/* Corner star accents */}
          <div
            className="absolute font-display"
            style={{ top: "1.5vh", left: "1.8vw", fontSize: "2.5vw", color: "rgba(245,166,35,0.2)", fontWeight: 900 }}
          >
            ★
          </div>
          <div
            className="absolute font-display"
            style={{ top: "1.5vh", right: "1.8vw", fontSize: "2.5vw", color: "rgba(245,166,35,0.2)", fontWeight: 900 }}
          >
            ★
          </div>

          <div
            className="font-body text-center"
            style={{ fontSize: "3.2vw", color: "rgba(245,166,35,0.6)", fontWeight: 700 }}
          >
            Insert screenshot here
          </div>
          <div
            className="font-body text-center mt-[1.5vh]"
            style={{ fontSize: "2.8vw", color: "rgba(139,149,176,0.5)", textWrap: "balance", maxWidth: "50vw" }}
          >
            The generated Aura Card result - AI portrait, stats, rarity badge, and prophecy
          </div>
        </div>
      </div>

      {/* Bottom row: three outcome callouts */}
      <div
        className="absolute flex items-center justify-between"
        style={{ left: "8vw", right: "8vw", bottom: "4vh" }}
      >
        <div className="font-body text-center" style={{ fontSize: "2.6vw", color: "#8B95B0" }}>
          <span className="font-display" style={{ color: "#F5A623", fontWeight: 900 }}>SAVE</span> - download as image
        </div>
        <div style={{ width: "0.15vw", height: "4vh", background: "rgba(245,166,35,0.2)" }} />
        <div className="font-body text-center" style={{ fontSize: "2.6vw", color: "#8B95B0" }}>
          <span className="font-display" style={{ color: "#F5A623", fontWeight: 900 }}>SHARE</span> - social link
        </div>
        <div style={{ width: "0.15vw", height: "4vh", background: "rgba(245,166,35,0.2)" }} />
        <div className="font-body text-center" style={{ fontSize: "2.6vw", color: "#8B95B0" }}>
          <span className="font-display" style={{ color: "#DC2626", fontWeight: 900 }}>OWN IT</span> - stored on Solana
        </div>
      </div>
    </div>
  );
}
