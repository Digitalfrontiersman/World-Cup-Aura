import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { NATION_FLAGS, FLAG_NATIONS } from "@/lib/nations";
import { QUIZ_STEP_NAMES } from "../types";
import { useAuraFlow } from "../AuraFlowProvider";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function QuizStep() {
  const { state, actions } = useAuraFlow();
  const { quizState, quizStep, quizDirection } = state;
  const touchStartX = useRef<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") actions.nextQuizStep();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") actions.prevQuizStep();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [quizStep, quizState, actions]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -80) actions.nextQuizStep();
    else if (dx > 80) actions.prevQuizStep();
  };

  const renderQuestion = () => {
    switch (quizStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">What should we call you on your card?</h2>
            <Input
              value={quizState.name}
              onChange={(e) => actions.setQuizField("name", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") actions.nextQuizStep(); }}
              placeholder="Your Name / Nickname"
              className="text-xl h-14"
              autoFocus
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-display font-bold text-white">Which nation has your heart?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {FLAG_NATIONS.map((n) => {
                const code = NATION_FLAGS[n];
                const selected = quizState.nation === n;
                return (
                  <button
                    key={n}
                    onClick={() => actions.selectAndAdvance("nation", n)}
                    className={`flex flex-col items-center rounded-xl overflow-hidden border-2 transition-all duration-150 bg-surface-2 hover:bg-surface-3 focus:outline-none ${selected ? "border-primary" : "border-card-border hover:border-white/30"}`}
                  >
                    <div className="card-shine w-full relative" style={{ aspectRatio: "3/2" }}>
                      <img
                        src={`https://flagcdn.com/w160/${code}.png`}
                        alt={n}
                        width={160}
                        height={107}
                        className="w-full h-full object-cover"
                        loading="eager"
                        draggable={false}
                      />
                      <div className="holo-overlay" />
                    </div>
                    <span className="w-full text-center text-white text-xs py-1.5 px-1 leading-tight font-medium truncate">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">What is your matchday energy?</h2>
            <div className="grid gap-3">
              {["Calm Assassin", "Chaos Mode", "Tactical Genius", "Savage Believer", "Spiritual Supporter", "Delusional Champion"].map((opt) => (
                <Button
                  key={opt}
                  variant={quizState.energy === opt ? "default" : "outline"}
                  className="h-13 text-base justify-start"
                  onClick={() => actions.selectAndAdvance("energy", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">Pick your greatest football weapon</h2>
            <div className="grid grid-cols-2 gap-3">
              {["Pure Aura", "Vision", "Speed", "Clutch Energy", "Trash Talk", "Loyalty", "Football IQ", "Chaos"].map((opt) => (
                <Button
                  key={opt}
                  variant={quizState.weapon === opt ? "default" : "outline"}
                  className="h-13 text-sm sm:text-base"
                  onClick={() => actions.selectAndAdvance("weapon", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">What is your biggest fan flaw?</h2>
            <div className="grid gap-3">
              {[
                "I blame the referee immediately",
                "I become unbearable when we win",
                'I say "this is our year" every year',
                "I get superstitious and irrational",
                "I talk too much before the match",
                "I lose faith, then come back instantly",
              ].map((opt) => (
                <Button
                  key={opt}
                  variant={quizState.flaw === opt ? "default" : "outline"}
                  className="h-auto py-3 px-4 text-left whitespace-normal"
                  onClick={() => actions.selectAndAdvance("flaw", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-display font-bold text-white">How confident are you that your team can win it all?</h2>
            <div className="pt-8 pb-4 px-2" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
              <Slider
                value={[quizState.confidence]}
                min={1}
                max={100}
                step={1}
                onValueChange={(v) => actions.setQuizField("confidence", v[0])}
                className="[&>[role=slider]]:h-6 [&>[role=slider]]:w-6 [&>[role=slider]]:bg-primary [&>[role=slider]]:border-none"
              />
            </div>
            <div className="text-center space-y-2">
              <div className="text-5xl font-display font-black text-primary">{quizState.confidence}%</div>
              <div className="text-xl text-primary font-medium">
                {quizState.confidence <= 25 ? "Protect your heart" : quizState.confidence <= 50 ? "Cautiously faithful" : quizState.confidence <= 75 ? "Dangerously hopeful" : quizState.confidence <= 90 ? "Elite belief" : "Delusion or destiny?"}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-white">Choose your walkout vibe</h2>
            <div className="grid gap-3">
              {["Final boss energy", "Locked in and silent", "Pure national pride", "Main character mode", "Villain arc activated", "Crowd control"].map((opt) => (
                <Button
                  key={opt}
                  variant={quizState.walkout === opt ? "default" : "outline"}
                  className="h-13 text-base justify-start"
                  onClick={() => actions.selectAndAdvance("walkout", opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      key="quiz"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex-1 flex flex-col pt-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Scrubber */}
      <div className="flex items-center gap-1.5 mb-10">
        {Array.from({ length: 7 }, (_, i) => (
          <button
            key={i}
            onClick={() => actions.navToQuizStep(i)}
            disabled={i >= quizStep}
            aria-label={`Go to step ${i + 1}`}
            className={`flex-1 rounded-full transition-all duration-300 focus:outline-none ${
              i === quizStep ? "h-2 bg-primary" : i < quizStep ? "h-2 bg-primary/50 hover:bg-primary/75 cursor-pointer" : "h-1.5 bg-gray-700 cursor-default opacity-40"
            }`}
          />
        ))}
      </div>

      {/* Step label */}
      <AnimatePresence mode="wait" custom={quizDirection}>
        <motion.p
          key={quizStep}
          custom={quizDirection}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-6"
        >
          {quizStep + 1} / 7 - {QUIZ_STEP_NAMES[quizStep]}
        </motion.p>
      </AnimatePresence>

      {/* Question content */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait" custom={quizDirection}>
          <motion.div
            key={quizStep}
            custom={quizDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="w-full"
          >
            {renderQuestion()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="mt-8 pt-6 space-y-3">
        {[0, 1, 5].includes(quizStep) && (
          <Button onClick={actions.nextQuizStep} className="w-full h-16 text-lg font-bold uppercase tracking-[0.06em] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all">
            Continue <ChevronRight className="ml-2" />
          </Button>
        )}
        {quizStep > 0 && (
          <Button variant="ghost" onClick={actions.prevQuizStep} className="w-full h-10 text-gray-500 hover:text-white text-sm">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        )}
      </div>
    </motion.div>
  );
}
