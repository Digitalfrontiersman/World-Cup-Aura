export default function Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Diagonal gold slash */}
      <div
        className="absolute"
        style={{
          top: "-8vh",
          right: "-4vw",
          width: "38vw",
          height: "130vh",
          background: "linear-gradient(135deg, #F5A623 0%, #C97D10 100%)",
          transform: "skewX(-14deg)",
          opacity: 0.11,
        }}
      />
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />
      {/* Gold bottom bar */}
      <div className="absolute bottom-0 left-0 w-full" style={{ height: "0.4vh", background: "#F5A623", opacity: 0.4 }} />

      {/* Left content */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ left: "8vw", top: 0, bottom: 0, width: "58vw" }}
      >
        {/* Hackathon badge */}
        <div
          className="font-body uppercase tracking-widest mb-[3.5vh]"
          style={{
            fontSize: "2.2vw",
            color: "#080E1F",
            background: "#F5A623",
            fontWeight: 700,
            letterSpacing: "0.18em",
            display: "inline-block",
            padding: "0.6vh 1.4vw",
            borderRadius: "0.4vw",
            alignSelf: "flex-start",
          }}
        >
          Solana Mini Hackathon
        </div>

        {/* Main title */}
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "11vw", fontWeight: 900, color: "#F5F0E8" }}
        >
          WORLD CUP
        </div>
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "11vw", fontWeight: 900, color: "#F5A623" }}
        >
          AURA CARD
        </div>

        {/* Divider */}
        <div className="mt-[3vh] mb-[3vh]" style={{ width: "8vw", height: "0.4vh", background: "#F5A623" }} />

        {/* Subtitle */}
        <div
          className="font-body"
          style={{ fontSize: "3.2vw", color: "#8B95B0", fontWeight: 400, maxWidth: "44vw", textWrap: "pretty" }}
        >
          A fan-card generator built on Solana - selfie, quiz, AI art, and on-chain mint in 60 seconds.
        </div>
      </div>

      {/* Right: decorative card outline */}
      <div
        className="absolute"
        style={{
          right: "6vw",
          top: "50%",
          transform: "translateY(-50%)",
          width: "22vw",
          height: "34vh",
          border: "0.3vh solid rgba(245,166,35,0.25)",
          borderRadius: "1.5vw",
        }}
      >
        <div
          className="absolute"
          style={{
            top: "1.5vh",
            left: "1.5vw",
            right: "1.5vw",
            bottom: "1.5vh",
            border: "0.15vh solid rgba(245,166,35,0.12)",
            borderRadius: "1vw",
            background: "rgba(245,166,35,0.04)",
          }}
        />
        <div
          className="absolute font-display"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "6vw",
            color: "rgba(245,166,35,0.2)",
            fontWeight: 900,
          }}
        >
          ★
        </div>
      </div>
    </div>
  );
}
