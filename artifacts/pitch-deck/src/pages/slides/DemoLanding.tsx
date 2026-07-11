export default function DemoLanding() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080E1F" }}>
      {/* Thin gold top bar */}
      <div className="absolute top-0 left-0 w-full" style={{ height: "0.5vh", background: "#F5A623" }} />

      {/* Left: label + caption */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ left: "8vw", top: 0, bottom: 0, width: "30vw" }}
      >
        <div
          className="font-body uppercase tracking-widest mb-[2vh]"
          style={{ fontSize: "2.2vw", color: "#F5A623", fontWeight: 700, letterSpacing: "0.22em" }}
        >
          Demo - Step 1
        </div>
        <div
          className="font-display leading-none tracking-tight mb-[3vh]"
          style={{ fontSize: "6vw", fontWeight: 900, color: "#F5F0E8" }}
        >
          THE LANDING PAGE
        </div>
        <div className="mb-[3vh]" style={{ width: "5vw", height: "0.4vh", background: "#F5A623" }} />
        <div
          className="font-body"
          style={{ fontSize: "3vw", color: "#8B95B0", textWrap: "pretty" }}
        >
          A fan lands on the page, sees a preview Aura Card, and taps to start their own.
        </div>
        <div
          className="font-body mt-[3vh]"
          style={{ fontSize: "2.8vw", color: "#8B95B0", textWrap: "pretty" }}
        >
          No sign-up. No wallet. Just start.
        </div>
      </div>

      {/* Right: screenshot placeholder */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ right: "6vw", top: "6vh", bottom: "6vh", width: "52vw" }}
      >
        <div
          className="w-full h-full flex flex-col items-center justify-center"
          style={{
            border: "0.3vh dashed rgba(245,166,35,0.45)",
            borderRadius: "1.2vw",
            background: "rgba(245,166,35,0.04)",
          }}
        >
          {/* Camera icon stand-in */}
          <div
            className="font-display mb-[2.5vh]"
            style={{ fontSize: "5vw", color: "rgba(245,166,35,0.3)", fontWeight: 900 }}
          >
            [ ]
          </div>
          <div
            className="font-body text-center"
            style={{ fontSize: "3vw", color: "rgba(245,166,35,0.55)", fontWeight: 700 }}
          >
            Insert screenshot here
          </div>
          <div
            className="font-body text-center mt-[1.5vh]"
            style={{ fontSize: "2.6vw", color: "rgba(139,149,176,0.5)" }}
          >
            Landing page - hero card preview
          </div>
        </div>
      </div>
    </div>
  );
}
