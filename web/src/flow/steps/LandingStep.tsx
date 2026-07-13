import { Link } from "wouter";
import { motion } from "framer-motion";
import { Zap, Camera, Upload, User, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuraFlow } from "../AuraFlowProvider";

export function LandingStep() {
  const { actions } = useAuraFlow();

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:content-center py-4"
    >
      {/* Copy block */}
      <motion.div
        className="space-y-4 relative text-center md:text-left md:col-start-1 md:row-start-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg surface-flat type-eyebrow text-primary mb-2">
          <Zap size={13} className="text-primary" />
          <span>The Ultimate Fan Experience</span>
        </div>
        <h1 className="type-hero text-white uppercase pb-1 text-balance">
          Unleash Your <br className="hidden md:block" />
          <span className="gold-text-static">Aura</span>
        </h1>
        <p className="text-white/70 text-lg leading-relaxed max-w-[300px] mx-auto md:mx-0 md:max-w-sm font-medium">
          Turn your selfie into a legendary fan card. Pick your nation. Reveal your power level.
        </p>
      </motion.div>

      {/* Card stack */}
      <div className="relative w-full flex items-center justify-center h-[300px] md:h-[460px] overflow-hidden md:col-start-2 md:row-start-1 md:row-span-2">
        <div className="absolute w-64 h-64 rounded-full bg-primary/16 blur-[110px] pointer-events-none" />

        <motion.div
          className="absolute w-40 h-56 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-surface-1"
          style={{ transformOrigin: "bottom center" }}
          initial={{ opacity: 0, rotate: 0, x: 0, scale: 0.8 }}
          animate={{ opacity: 1, rotate: -16, x: -88, scale: 0.86, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: 0.35, duration: 0.5 },
            rotate: { delay: 0.35, type: "spring", bounce: 0.5 },
            x: { delay: 0.35, type: "spring", bounce: 0.5 },
            scale: { delay: 0.35, type: "spring", bounce: 0.5 },
            y: { delay: 1, duration: 5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <img src="/card-action-1.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </motion.div>

        <motion.div
          className="absolute w-40 h-56 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-surface-1"
          style={{ transformOrigin: "bottom center" }}
          initial={{ opacity: 0, rotate: 0, x: 0, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 16, x: 88, scale: 0.86, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: 0.5, duration: 0.5 },
            rotate: { delay: 0.5, type: "spring", bounce: 0.5 },
            x: { delay: 0.5, type: "spring", bounce: 0.5 },
            scale: { delay: 0.5, type: "spring", bounce: 0.5 },
            y: { delay: 1.4, duration: 5.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <img src="/hero-action.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </motion.div>

        <motion.div
          className="relative w-52 h-72 glass-panel rounded-xl overflow-hidden card-shine shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] border-primary/60 z-10"
          initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -3, y: [0, -14, 0] }}
          transition={{
            opacity: { duration: 0.5 },
            scale: { type: "spring", bounce: 0.5 },
            rotate: { type: "spring", bounce: 0.5 },
            y: { delay: 0.8, duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <img src="/card-action-2.png" alt="Aura Card" className="w-full h-full object-cover object-top filter contrast-125" />
          <div className="holo-overlay" />
          <div className="absolute top-3 left-3 z-20 text-center drop-shadow-xl">
            <div className="text-4xl font-display font-black leading-none gold-text-gradient">94</div>
            <div className="text-[9px] font-bold uppercase text-white/80 tracking-widest">Aura</div>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="text-white text-base font-display font-black uppercase tracking-wide leading-tight">Mythic Champion</div>
            <div className="text-primary text-[10px] uppercase font-bold tracking-widest">Legendary Striker</div>
          </div>
        </motion.div>
      </div>

      {/* CTA buttons */}
      <motion.div
        className="w-full space-y-3 md:col-start-1 md:row-start-2"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, type: "spring", bounce: 0.3 }}
      >
        <p className="type-eyebrow text-white/40 text-center md:text-left text-[0.68rem]">Unlock your fan card now</p>
        <Button onClick={actions.start} className="w-full h-14 text-lg font-black uppercase tracking-[0.06em] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <Camera className="mr-2" /> Take Selfie
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={actions.requestUpload} variant="outline" className="h-14 surface-flat text-white hover:border-primary/50">
            <Upload className="mr-2 h-5 w-5" /> Upload
          </Button>
          <Button onClick={actions.start} variant="outline" className="h-14 surface-flat text-white hover:border-primary/50">
            <User className="mr-2 h-5 w-5" /> Sample
          </Button>
        </div>

        <div className="flex items-center justify-center md:justify-start gap-1.5 pt-1">
          <Layers className="h-3 w-3 text-gray-500 shrink-0" />
          <span className="text-[11px] text-gray-500">Part of an exclusive 100,000-card collection. </span>
          <Link
            href="/odds"
            className="inline-flex items-center gap-0.5 text-[11px] text-primary/80 hover:text-primary underline underline-offset-2 font-semibold transition-colors focus:outline-none"
          >
            See the odds <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
