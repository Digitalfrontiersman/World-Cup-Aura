import { motion } from "framer-motion";
import { Camera, Upload, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GENDER_LABELS } from "../types";
import { useAuraFlow } from "../AuraFlowProvider";

export function PhotoStep() {
  const { state, actions, fileInputRef, videoRef, cameraActive, cameraError, startCamera, stopCamera, capturePhoto } = useAuraFlow();
  const { photo, gender } = state;

  const onPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      actions.setPhoto(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <motion.div
      key="photo"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex-1 flex flex-col space-y-8 pt-4"
    >
      <div className="space-y-2 text-center">
        <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-wide">Player Portrait</h2>
        <p className="text-gray-400 font-medium">Snap a selfie or upload a photo for your card.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onPhotoSelect} className="hidden" />

        <div className="relative w-64 h-80 rounded-2xl overflow-hidden surface-flat border-2 border-primary/40 flex items-center justify-center transition-all">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
          ) : photo ? (
            <img src={photo} alt="Player portrait preview" className="w-full h-full object-cover filter contrast-110" />
          ) : (
            <div className="text-center space-y-4 p-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
                <Camera size={36} />
              </div>
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Take a selfie or upload</p>
            </div>
          )}
        </div>

        {cameraActive ? (
          <div className="mt-8 w-full grid grid-cols-2 gap-3">
            <Button onClick={capturePhoto} className="h-14 text-base font-bold uppercase tracking-[0.06em] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
              <Camera className="mr-2 h-5 w-5" /> Capture
            </Button>
            <Button onClick={stopCamera} variant="outline" className="h-14 surface-flat text-white hover:border-primary/50">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="mt-8 w-full grid grid-cols-2 gap-3">
            <Button onClick={startCamera} className="h-14 text-base font-bold uppercase tracking-[0.06em] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
              <Camera className="mr-2 h-5 w-5" /> {photo ? "Retake" : "Take Selfie"}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-14 surface-flat text-white hover:border-primary/50">
              <Upload className="mr-2 h-5 w-5" /> Upload
            </Button>
          </div>
        )}

        {cameraError && <p className="mt-4 text-sm text-center text-red-400 font-medium max-w-[260px]">{cameraError}</p>}

        {!photo && !cameraActive && (
          <div className="mt-8 w-full space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-800"></div>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Or use sample</div>
              <div className="flex-1 h-px bg-gray-800"></div>
            </div>
            <div className="flex justify-center gap-6">
              {[1, 2, 3].map((num) => (
                <button key={num} onClick={() => actions.selectSampleAvatar(num)} className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-700 hover:border-primary hover:scale-110 transition-all shadow-lg">
                  <img src={`/avatar-${num}.png`} alt={`Avatar ${num}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gender toggle */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Depict me as</p>
        <div className="flex rounded-xl overflow-hidden border border-gray-700 bg-black/40">
          {GENDER_LABELS.map((g) => (
            <button
              key={g}
              onClick={() => actions.setGender(gender === g ? null : g)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-all ${
                gender === g ? "bg-primary text-primary-foreground" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <Button
        disabled={!photo || cameraActive}
        onClick={() => actions.goToStep("quiz")}
        className="w-full h-16 text-lg font-bold uppercase tracking-wider bg-white text-black hover:bg-gray-200 rounded-xl disabled:opacity-50 shadow-xl"
      >
        Continue to Aura Scan <ChevronRight className="ml-2 h-6 w-6" />
      </Button>
    </motion.div>
  );
}
