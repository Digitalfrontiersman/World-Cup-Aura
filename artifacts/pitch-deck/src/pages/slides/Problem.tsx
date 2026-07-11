export default function Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Crimson left accent */}
      <div
        className="absolute top-0 left-0 bottom-0"
        style={{ width: "0.7vw", background: "linear-gradient(to bottom, #DC2626, transparent)" }}
      />

      <div
        className="absolute flex flex-col justify-center"
        style={{ left: "8vw", top: 0, bottom: 0, right: "8vw" }}
      >
        <div
          className="font-body uppercase tracking-widest mb-[3vh]"
          style={{ fontSize: "2.4vw", color: "#DC2626", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          The Problem
        </div>

        <div
          className="font-display leading-none tracking-tight mb-[5vh]"
          style={{ fontSize: "6.5vw", fontWeight: 900, color: "#F5F0E8", maxWidth: "72vw", textWrap: "balance" }}
        >
          FANS HAVE NO PERSONAL STAKE IN THE MOMENT.
        </div>

        <div className="flex flex-col" style={{ gap: "2.8vh" }}>
          <div className="flex items-start" style={{ gap: "2.2vw" }}>
            <div className="font-display shrink-0" style={{ fontSize: "3.5vw", color: "#F5A623", fontWeight: 900, lineHeight: 1 }}>
              01
            </div>
            <div className="font-body" style={{ fontSize: "3.2vw", color: "#8B95B0", textWrap: "pretty" }}>
              A 5-billion-viewer event leaves fans with nothing to own or share.
            </div>
          </div>
          <div className="flex items-start" style={{ gap: "2.2vw" }}>
            <div className="font-display shrink-0" style={{ fontSize: "3.5vw", color: "#F5A623", fontWeight: 900, lineHeight: 1 }}>
              02
            </div>
            <div className="font-body" style={{ fontSize: "3.2vw", color: "#8B95B0", textWrap: "pretty" }}>
              Blockchain collectibles exist, but wallet setup blocks almost every casual fan.
            </div>
          </div>
          <div className="flex items-start" style={{ gap: "2.2vw" }}>
            <div className="font-display shrink-0" style={{ fontSize: "3.5vw", color: "#F5A623", fontWeight: 900, lineHeight: 1 }}>
              03
            </div>
            <div className="font-body" style={{ fontSize: "3.2vw", color: "#8B95B0", textWrap: "pretty" }}>
              AI image generation is powerful, but no one has made it feel personal for sport.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
