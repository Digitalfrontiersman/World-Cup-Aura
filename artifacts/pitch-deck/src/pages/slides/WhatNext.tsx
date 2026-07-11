export default function WhatNext() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Faint diagonal slash */}
      <div
        className="absolute"
        style={{
          top: "-10vh",
          right: "-6vw",
          width: "45vw",
          height: "140vh",
          background: "linear-gradient(135deg, #F5A623 0%, transparent 100%)",
          transform: "skewX(-14deg)",
          opacity: 0.055,
        }}
      />

      {/* Left: headline */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ left: "8vw", top: 0, bottom: 0, width: "40vw" }}
      >
        <div
          className="font-body uppercase tracking-widest mb-[3vh]"
          style={{ fontSize: "2.4vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          What We'd Build Next
        </div>
        <div
          className="font-display leading-none tracking-tight"
          style={{ fontSize: "6.5vw", fontWeight: 900, color: "#F5F0E8", textWrap: "balance" }}
        >
          GIVEN MORE TIME.
        </div>
        <div className="mt-[3vh]" style={{ width: "5vw", height: "0.4vh", background: "#F5A623" }} />
        <div
          className="font-body mt-[3vh]"
          style={{ fontSize: "3vw", color: "#8B95B0", textWrap: "pretty" }}
        >
          The hackathon proved the core loop works. Here's where it goes next.
        </div>
      </div>

      {/* Right: next steps */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ right: "6vw", top: 0, bottom: 0, width: "44vw", gap: "2.8vh" }}
      >
        <div className="flex items-start" style={{ gap: "2vw" }}>
          <div
            className="font-display shrink-0 flex items-center justify-center"
            style={{
              width: "4.5vw",
              height: "4.5vw",
              borderRadius: "50%",
              border: "0.2vh solid rgba(245,166,35,0.4)",
              background: "rgba(245,166,35,0.08)",
              fontSize: "2.5vw",
              fontWeight: 900,
              color: "#F5A623",
            }}
          >
            1
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 900, color: "#F5F0E8" }}>
              Production Launch
            </div>
            <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
              Full public release timed to World Cup 2026 kick-off.
            </div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "2vw" }}>
          <div
            className="font-display shrink-0 flex items-center justify-center"
            style={{
              width: "4.5vw",
              height: "4.5vw",
              borderRadius: "50%",
              border: "0.2vh solid rgba(245,166,35,0.3)",
              background: "rgba(245,166,35,0.05)",
              fontSize: "2.5vw",
              fontWeight: 900,
              color: "#F5A623",
            }}
          >
            2
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 900, color: "#F5F0E8" }}>
              Card Gallery
            </div>
            <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
              A public wall of every minted Aura Card — shareable, filterable by rarity.
            </div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "2vw" }}>
          <div
            className="font-display shrink-0 flex items-center justify-center"
            style={{
              width: "4.5vw",
              height: "4.5vw",
              borderRadius: "50%",
              border: "0.2vh solid rgba(220,38,38,0.35)",
              background: "rgba(220,38,38,0.07)",
              fontSize: "2.5vw",
              fontWeight: 900,
              color: "#DC2626",
            }}
          >
            3
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 900, color: "#F5F0E8" }}>
              Mobile App
            </div>
            <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
              Native camera, push notifications for match days, and card trading between fans.
            </div>
          </div>
        </div>

        <div className="flex items-start" style={{ gap: "2vw" }}>
          <div
            className="font-display shrink-0 flex items-center justify-center"
            style={{
              width: "4.5vw",
              height: "4.5vw",
              borderRadius: "50%",
              border: "0.2vh solid rgba(220,38,38,0.25)",
              background: "rgba(220,38,38,0.04)",
              fontSize: "2.5vw",
              fontWeight: 900,
              color: "#DC2626",
            }}
          >
            4
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 900, color: "#F5F0E8" }}>
              Sponsored Cards
            </div>
            <div className="font-body" style={{ fontSize: "2.8vw", color: "#8B95B0" }}>
              Brand-themed card templates for sponsors activated during live match moments.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
