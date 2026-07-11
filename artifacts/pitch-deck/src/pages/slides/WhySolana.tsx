export default function WhySolana() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Faint purple tint top-right */}
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: "40vw",
          height: "55vh",
          background: "radial-gradient(ellipse at top right, rgba(153,69,255,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Left: headline */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ left: "8vw", top: 0, bottom: 0, width: "38vw" }}
      >
        <div
          className="font-body uppercase tracking-widest mb-[3vh]"
          style={{ fontSize: "2.4vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          Why Solana
        </div>
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "7vw", fontWeight: 900, color: "#F5F0E8", textWrap: "balance" }}
        >
          FAST. CHEAP. OUT OF THE WAY.
        </div>
        <div className="mt-[3vh]" style={{ width: "5vw", height: "0.4vh", background: "#F5A623" }} />
        <div
          className="font-body mt-[3vh]"
          style={{ fontSize: "3vw", color: "#8B95B0", textWrap: "pretty" }}
        >
          The chain should be invisible to the fan. Solana makes that possible.
        </div>
      </div>

      {/* Right: four stats */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ right: "6vw", top: 0, bottom: 0, width: "42vw", gap: "2.5vh" }}
      >
        <div className="flex items-start" style={{ gap: "2.2vw" }}>
          <div className="font-display shrink-0" style={{ fontSize: "5vw", fontWeight: 900, color: "#F5A623", lineHeight: 1 }}>
            &lt;$0.01
          </div>
          <div className="font-body" style={{ fontSize: "3vw", color: "#8B95B0", paddingTop: "0.5vh", textWrap: "pretty" }}>
            Per mint - makes per-fan NFTs economically viable at any scale.
          </div>
        </div>

        <div style={{ height: "0.15vh", background: "rgba(245,166,35,0.15)" }} />

        <div className="flex items-start" style={{ gap: "2.2vw" }}>
          <div className="font-display shrink-0" style={{ fontSize: "5vw", fontWeight: 900, color: "#F5A623", lineHeight: 1 }}>
            400ms
          </div>
          <div className="font-body" style={{ fontSize: "3vw", color: "#8B95B0", paddingTop: "0.5vh", textWrap: "pretty" }}>
            Confirmation - mint completes before the fan even realises it happened.
          </div>
        </div>

        <div style={{ height: "0.15vh", background: "rgba(245,166,35,0.15)" }} />

        <div className="flex items-start" style={{ gap: "2.2vw" }}>
          <div className="font-display shrink-0" style={{ fontSize: "5vw", fontWeight: 900, color: "#DC2626", lineHeight: 1 }}>
            0
          </div>
          <div className="font-body" style={{ fontSize: "3vw", color: "#8B95B0", paddingTop: "0.5vh", textWrap: "pretty" }}>
            Friction for the fan - on-chain ownership works invisibly in the background.
          </div>
        </div>

        <div style={{ height: "0.15vh", background: "rgba(245,166,35,0.15)" }} />

        <div className="flex items-start" style={{ gap: "2.2vw" }}>
          <div className="font-display shrink-0" style={{ fontSize: "3.5vw", fontWeight: 900, color: "#DC2626", lineHeight: 1 }}>
            Metaplex
          </div>
          <div className="font-body" style={{ fontSize: "3vw", color: "#8B95B0", paddingTop: "0.5vh", textWrap: "pretty" }}>
            Token Metadata standard - proven, widely supported, and well-documented.
          </div>
        </div>
      </div>
    </div>
  );
}
