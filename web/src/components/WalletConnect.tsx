import { Wallet, Check, LogOut } from "lucide-react";
import { useWalletBridge } from "@/lib/walletBridge";

function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

interface WalletConnectProps {
  /** Compact pill styling for the persistent header; full-width otherwise. */
  compact?: boolean;
}

/**
 * On-brand wallet connect control. When disconnected it opens the wallet-adapter
 * modal; when connected it shows the wallet + a truncated address with a
 * disconnect action. `compact` renders a header pill; otherwise a full-width
 * block for the mint flow. Styled to match the app's dark/gold theme.
 */
export function WalletConnect({ compact = false }: WalletConnectProps) {
  const { address, isConnected, connecting, disconnect, walletName, open } = useWalletBridge();

  if (isConnected && address) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-surface-2 px-3 h-9">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          <span className="font-mono text-xs text-white">
            {shortAddress(address)}
          </span>
          <button
            onClick={disconnect}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Disconnect wallet"
            title="Disconnect"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 h-11">
        <Check className="h-4 w-4 text-green-400 shrink-0" />
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-[10px] uppercase tracking-[0.08em] text-primary/80">
            {walletName ?? "Wallet"} connected
          </p>
          <p className="font-mono text-xs text-white truncate">
            {shortAddress(address)}
          </p>
        </div>
        <button
          onClick={disconnect}
          className="shrink-0 text-gray-400 hover:text-white transition-colors"
          aria-label="Disconnect wallet"
          title="Disconnect"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={open}
        disabled={connecting}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 h-9 text-xs font-black uppercase tracking-[0.1em] text-primary-foreground shadow-[0_0_20px_hsl(42_78%_55%/0.35)] transition duration-200 hover:brightness-110 active:scale-95 disabled:opacity-60"
        data-testid="button-connect-wallet"
      >
        <Wallet className="h-3.5 w-3.5" />
        {connecting ? "..." : "Connect"}
      </button>
    );
  }

  return (
    <button
      onClick={open}
      disabled={connecting}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-surface-1 h-11 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:bg-primary/10 hover:border-primary active:scale-[0.98] disabled:opacity-60"
      data-testid="button-connect-wallet"
    >
      <Wallet className="h-4 w-4 text-primary" />
      {connecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
