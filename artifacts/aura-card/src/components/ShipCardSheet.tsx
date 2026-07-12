import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Loader2, Truck } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");
const PRICE_LABEL = "$4.99";

interface ShipCardSheetProps {
  open: boolean;
  onClose: () => void;
  cardSlug?: string | null;
  cardName?: string | null;
}

interface FormState {
  fullName: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
}

const EMPTY: FormState = {
  fullName: "", email: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "", phone: "",
};

function Field({
  label, value, onChange, placeholder, type = "text", required, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="font-condensed text-[10px] font-semibold uppercase tracking-wide text-white/45">
        {label}{required && <span className="text-primary"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg border border-white/10 bg-surface-1 px-3 text-sm text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none"
      />
    </label>
  );
}

/** Bottom sheet: collect a shipping address and start Ziina checkout for the physical card. */
export function ShipCardSheet({ open, onClose, cardSlug, cardName }: ShipCardSheetProps) {
  const [f, setF] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof FormState) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const canSubmit = f.fullName.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) && f.line1.trim() && f.city.trim() && f.country.trim();

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/aura/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardSlug: cardSlug ?? null,
          cardName: cardName ?? null,
          email: f.email.trim(),
          origin: window.location.origin,
          shipping: {
            fullName: f.fullName.trim(),
            line1: f.line1.trim(),
            line2: f.line2.trim() || undefined,
            city: f.city.trim(),
            region: f.region.trim() || undefined,
            postalCode: f.postalCode.trim() || undefined,
            country: f.country.trim(),
            phone: f.phone.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) throw new Error(data.error || "Could not start checkout.");
      // Hand off to Ziina's hosted checkout.
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="ship-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0.16, duration: 0.5 }}
            className="w-full max-w-md surface-flat overflow-hidden rounded-t-2xl sm:rounded-2xl"
            style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 pt-5 pb-4">
              <div>
                <div className="flex items-center gap-1.5 type-eyebrow text-[0.66rem] text-primary">
                  <Package className="h-3.5 w-3.5" />
                  Physical Card
                </div>
                <h2 className="mt-1.5 font-display text-xl font-black uppercase leading-none tracking-tight text-white">
                  Ship Your Card
                </h2>
                <p className="mt-1.5 text-xs text-white/45">
                  A premium printed edition mailed to your door — <span className="font-bold text-primary">{PRICE_LABEL}</span> incl. shipping.
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-white transition-colors hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="max-h-[55vh] overflow-y-auto scroll-slim px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name" value={f.fullName} onChange={set("fullName")} placeholder="Jordan Fan" required className="col-span-2" />
                <Field label="Email" value={f.email} onChange={set("email")} placeholder="you@email.com" type="email" required className="col-span-2" />
                <Field label="Address" value={f.line1} onChange={set("line1")} placeholder="Street address" required className="col-span-2" />
                <Field label="Apt / Suite" value={f.line2} onChange={set("line2")} placeholder="Optional" className="col-span-2" />
                <Field label="City" value={f.city} onChange={set("city")} placeholder="City" required />
                <Field label="State / Emirate" value={f.region} onChange={set("region")} placeholder="Region" />
                <Field label="Postal code" value={f.postalCode} onChange={set("postalCode")} placeholder="ZIP" />
                <Field label="Country" value={f.country} onChange={set("country")} placeholder="Country" required />
                <Field label="Phone" value={f.phone} onChange={set("phone")} placeholder="Optional" className="col-span-2" />
              </div>

              {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
            </div>

            {/* CTA */}
            <div className="border-t border-white/10 px-5 py-4">
              <button
                onClick={submit}
                disabled={!canSubmit || submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-condensed text-sm font-bold uppercase tracking-wide text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="button-ship-checkout"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Truck className="h-5 w-5" />}
                {submitting ? "Starting checkout…" : `Pay ${PRICE_LABEL} & Ship`}
              </button>
              <p className="mt-2 text-center text-[10px] text-white/30">
                Secure checkout by Ziina · charged in AED
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
