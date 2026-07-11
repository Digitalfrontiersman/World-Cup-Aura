export default function Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Gold top + bottom bars */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />
      <div className="absolute bottom-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Diagonal gold accent — mirrored from title */}
      <div
        className="absolute"
        style={{
          top: "-8vh",
          right: "-4vw",
          width: "38vw",
          height: "130vh",
          background: "linear-gradient(135deg, #F5A623 0%, #C97D10 100%)",
          transform: "skewX(-14deg)",
          opacity: 0.1,
        }}
      />

      {/* Center content */}
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ top: 0, left: "8vw", right: "8vw", bottom: 0 }}
      >
        {/* Hackathon label */}
        <div
          className="font-body uppercase tracking-widest mb-[3.5vh]"
          style={{
            fontSize: "2.2vw",
            color: "#080E1F",
            background: "#F5A623",
            fontWeight: 700,
            letterSpacing: "0.18em",
            padding: "0.6vh 1.4vw",
            borderRadius: "0.4vw",
          }}
        >
          Solana Mini Hackathon
        </div>

        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "9.5vw", fontWeight: 900, color: "#F5F0E8" }}
        >
          THANK YOU.
        </div>
        <div
          className="font-display leading-none tracking-tight mt-[1vh]"
          style={{ fontSize: "9.5vw", fontWeight: 900, color: "#F5A623" }}
        >
          LET'S PLAY.
        </div>

        <div className="mt-[4vh] mb-[4vh]" style={{ width: "6vw", height: "0.4vh", background: "#F5A623" }} />

        {/* Links row */}
        <div className="flex items-center justify-center" style={{ gap: "5vw" }}>
          <div className="text-center">
            <div className="font-body uppercase mb-[0.8vh]" style={{ fontSize: "2.2vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.15em" }}>
              Try It
            </div>
            <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
              worldcupaura.com
            </div>
          </div>
          <div style={{ width: "0.15vw", height: "7vh", background: "rgba(245,166,35,0.25)" }} />
          <div className="text-center">
            <div className="font-body uppercase mb-[0.8vh]" style={{ fontSize: "2.2vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.15em" }}>
              Source
            </div>
            <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
              github.com / aura-card
            </div>
          </div>
          <div style={{ width: "0.15vw", height: "7vh", background: "rgba(245,166,35,0.25)" }} />
          <div className="text-center">
            <div className="font-body uppercase mb-[0.8vh]" style={{ fontSize: "2.2vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.15em" }}>
              Contact
            </div>
            <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
              hello@worldcupaura.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
