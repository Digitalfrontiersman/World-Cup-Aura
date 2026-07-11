export default function Solution() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Gold right accent */}
      <div
        className="absolute top-0 right-0 bottom-0"
        style={{ width: "0.7vw", background: "linear-gradient(to bottom, #F5A623, transparent)" }}
      />

      {/* Left column */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ left: "8vw", top: 0, bottom: 0, width: "44vw" }}
      >
        <div
          className="font-body uppercase tracking-widest mb-[3vh]"
          style={{ fontSize: "2.4vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          Our Solution
        </div>
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "7.5vw", fontWeight: 900, color: "#F5F0E8" }}
        >
          YOUR AURA.
        </div>
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "7.5vw", fontWeight: 900, color: "#F5A623" }}
        >
          YOUR CARD.
        </div>
        <div className="mt-[3vh]" style={{ width: "6vw", height: "0.4vh", background: "#F5A623" }} />
        <div
          className="font-body mt-[3vh]"
          style={{ fontSize: "3vw", color: "#8B95B0", maxWidth: "38vw", textWrap: "pretty" }}
        >
          Take a selfie, answer 7 questions, and AI generates a personalised trading card — stats, rarity tier, and a World Cup prophecy. Mint it as an NFT with one tap.
        </div>
      </div>

      {/* Right column: three pillars */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ right: "6vw", top: 0, bottom: 0, width: "36vw", gap: "2.2vh" }}
      >
        <div
          style={{
            fontSize: "3vw",
            color: "#F5F0E8",
            background: "rgba(245,166,35,0.1)",
            border: "0.15vh solid rgba(245,166,35,0.3)",
            borderRadius: "0.8vw",
            padding: "2.2vh 2.2vw",
          }}
        >
          <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 900, color: "#F5A623", marginBottom: "0.6vh" }}>AI PORTRAIT</div>
          <div className="font-body">Selfie transformed into match-day hero art via GPT-image-1.</div>
        </div>
        <div
          style={{
            fontSize: "3vw",
            color: "#F5F0E8",
            background: "rgba(245,166,35,0.06)",
            border: "0.15vh solid rgba(245,166,35,0.18)",
            borderRadius: "0.8vw",
            padding: "2.2vh 2.2vw",
          }}
        >
          <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 900, color: "#F5A623", marginBottom: "0.6vh" }}>AURA STATS</div>
          <div className="font-body">Quiz answers drive unique attributes, rarity, and prophecy — no two cards alike.</div>
        </div>
        <div
          style={{
            fontSize: "3vw",
            color: "#F5F0E8",
            background: "rgba(220,38,38,0.08)",
            border: "0.15vh solid rgba(220,38,38,0.25)",
            borderRadius: "0.8vw",
            padding: "2.2vh 2.2vw",
          }}
        >
          <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 900, color: "#DC2626", marginBottom: "0.6vh" }}>ON SOLANA</div>
          <div className="font-body">Card ownership lives on-chain. Save it, share it, or keep it as a collectible.</div>
        </div>
      </div>
    </div>
  );
}
