import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine } from "lucide-react";
import { CommunityCarousel } from "@/components/CommunityCarousel";
import { useAuraFlow } from "../AuraFlowProvider";

const scanMessages = [
  "Scanning fan aura...",
  "Detecting delusion...",
  "Measuring loyalty...",
  "Calculating power level...",
  "Forging your final form...",
  "Igniting aura core...",
  "Finalizing legend...",
];

export function ScannerStep() {
  const { state, actions } = useAuraFlow();
  const { photo, scanMsgIndex } = state;

  // Cycle scan messages while this step is mounted (spread across ~60s).
  useEffect(() => {
    actions.setScanMsgIndex(0);
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % scanMessages.length;
      actions.setScanMsgIndex(i);
    }, 8500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center relative overflow-hidden">
      {/* HUD Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none mix-blend-screen">
        <img src="/scanner-hud.png" alt="" className="w-full max-w-[400px] animate-spin-slow" style={{ animationDuration: "30s" }} />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 space-y-8 pt-8 pb-4 w-full z-10">
        <div className="relative w-56 h-72 rounded-xl overflow-hidden border-2 border-primary/30">
          {photo && <img src={photo} alt="" className="w-full h-full object-cover filter contrast-125 grayscale-[0.5]" />}
          <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />

          <motion.div
            className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(255,215,0,1)] z-10"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
            animate={{ top: ["-100%", "100%", "-100%"] }}
            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
          />

          <div className="absolute inset-0 flex items-center justify-center z-20">
            <ScanLine size={56} className="text-primary drop-shadow-[0_0_10px_rgba(255,215,0,1)] animate-pulse" />
          </div>
        </div>

        <div className="space-y-5 w-full max-w-[300px] relative z-20 glass-panel p-5 rounded-2xl border-primary/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={scanMsgIndex}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              className="text-xl font-display font-black text-primary text-center uppercase tracking-widest drop-shadow-md"
            >
              {scanMessages[scanMsgIndex]}
            </motion.div>
          </AnimatePresence>

          <div className="space-y-3">
            <div className="w-full bg-black/80 h-3 rounded-full overflow-hidden border border-gray-700 shadow-inner relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMTAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIvPjwvc3ZnPg==')] opacity-50 z-10" />
              <motion.div className="h-full bg-gradient-to-r from-accent via-primary to-secondary relative z-0" initial={{ width: "2%" }} animate={{ width: "98%" }} transition={{ duration: 60, ease: "linear" }} />
            </div>
            <div className="flex justify-between text-[10px] text-primary/80 font-mono font-bold uppercase tracking-widest">
              <span>Init: 0x4F8A</span>
              <span className="animate-pulse">Forging...</span>
            </div>
          </div>
        </div>
      </div>

      <div className="[@media(max-height:639px)]:hidden w-full">
        <CommunityCarousel baseUrl={`${import.meta.env.BASE_URL}`} active />
      </div>
    </motion.div>
  );
}
