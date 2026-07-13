import { useEffect, useRef } from "react";

export interface NavPosition {
  step: string;
  quizStep: number;
}

interface UseStepHistoryOptions {
  /** Current top-level step. */
  step: string;
  /** Current quiz sub-step (ignored for non-quiz steps). */
  quizStep: number;
  /** Called when the browser Back/Forward button restores an earlier position. */
  onRestore: (pos: NavPosition) => void;
  /** Steps that should NOT create a history entry (transient/auto-advancing). */
  transientSteps?: string[];
  /** The root step; Back from here leaves the app, as users expect. */
  rootStep?: string;
  /** Optional URL (hash) to display for a given position - purely cosmetic. */
  hashFor?: (pos: NavPosition) => string;
}

/**
 * Wires the in-app step machine into browser history so the Back button walks
 * backwards through the flow (result → quiz → photo → landing) instead of
 * leaving the site. Forward transitions push a history entry; Back/Forward
 * restore the recorded position via `onRestore`. State that lives in memory
 * (photo, result, …) is untouched, so returning to a step shows it intact.
 */
export function useStepHistory({
  step,
  quizStep,
  onRestore,
  transientSteps = [],
  rootStep = "landing",
  hashFor,
}: UseStepHistoryOptions): void {
  const navRef = useRef<NavPosition>({ step, quizStep });
  const isPopping = useRef(false);
  // Hold the latest onRestore in a ref so the popstate listener stays stable.
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // Push a history entry whenever the position moves forward.
  useEffect(() => {
    if (isPopping.current) {
      isPopping.current = false;
      navRef.current = { step, quizStep };
      return;
    }
    const prev = navRef.current;
    if (prev.step === step && prev.quizStep === quizStep) return;
    navRef.current = { step, quizStep };
    if (transientSteps.includes(step)) return;
    const url = hashFor ? hashFor({ step, quizStep }) : undefined;
    window.history.pushState({ auraNav: { step, quizStep } }, "", url);
    // transientSteps/hashFor are stable config from the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, quizStep]);

  // Restore the recorded position on Back/Forward.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const nav = (e.state && (e.state as { auraNav?: NavPosition }).auraNav) || undefined;
      const target: NavPosition = nav ?? { step: rootStep, quizStep: 0 };
      isPopping.current = true;
      navRef.current = target;
      onRestoreRef.current(target);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [rootStep]);
}
