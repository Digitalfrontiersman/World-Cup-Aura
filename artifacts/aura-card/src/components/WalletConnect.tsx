import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, Check, LogOut } from "lucide-react";

function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/**
 * On-brand wallet connect control for the mint flow. When disconnected it opens
 * the wallet-adapter modal; when connected it shows the wallet name + a
 * truncated address with a disconnect action. Styled to match the app's dark
 * theme instead of the default adapter button.
 */
export function WalletConnect() {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 h-11">
        <Check className="h-4 w-4 text-green-400 shrink-0" />
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-[10px] uppercase tracking-wider text-primary/80">
            {wallet?.adapter.name ?? "Wallet"} connected
          </p>
          <p className="font-mono text-xs text-white truncate">
            {shortAddress(publicKey.toBase58())}
          </p>
        </div>
        <button
          onClick={() => disconnect()}
          className="shrink-0 text-gray-400 hover:text-white transition-colors"
          aria-label="Disconnect wallet"
          title="Disconnect"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      disabled={connecting}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-black/60 h-11 text-sm font-bold uppercase tracking-wider text-white hover:bg-primary/10 hover:border-primary transition-colors disabled:opacity-60"
      data-testid="button-connect-wallet"
    >
      <Wallet className="h-4 w-4 text-primary" />
      {connecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
