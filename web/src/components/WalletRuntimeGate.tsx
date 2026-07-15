import { lazy, Suspense } from "react";
import { useWalletActivated } from "@/lib/walletBridge";

// The heavy wallet stack (@reown/appkit + @solana/wallet-adapter) lives here and
// is fetched only when this gate first renders the runtime.
const WalletRuntime = lazy(() =>
  import("@/components/SolanaProviders").then((m) => ({ default: m.WalletRuntime })),
);

/**
 * Mounts the wallet runtime lazily, and only once the user activates the wallet
 * (clicks Connect, or was connected in a prior session). Renders nothing until
 * then — so the landing page never loads the wallet libraries. It sits as a
 * sibling of <App/>, so activating it never remounts the app.
 */
export function WalletRuntimeGate() {
  const activated = useWalletActivated();
  if (!activated) return null;
  return (
    <Suspense fallback={null}>
      <WalletRuntime />
    </Suspense>
  );
}
