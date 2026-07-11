import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet, Check, LogOut } from "lucide-react";

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
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-black/60 backdrop-blur px-3 h-9 shadow-lg">
          <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)]" />
          <span className="font-mono text-xs text-white">
            {shortAddress(publicKey.toBase58())}
          </span>
          <button
            onClick={() => disconnect()}
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

  if (compact) {
    return (
      <button
        onClick={() => setVisible(true)}
        disabled={connecting}
        className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-black/60 backdrop-blur px-3.5 h-9 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-200 hover:bg-primary/15 hover:border-primary active:scale-95 disabled:opacity-60"
        data-testid="button-connect-wallet"
      >
        <Wallet className="h-3.5 w-3.5 text-primary" />
        {connecting ? "..." : "Connect"}
      </button>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      disabled={connecting}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-black/60 h-11 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-primary/10 hover:border-primary active:scale-[0.98] disabled:opacity-60"
      data-testid="button-connect-wallet"
    >
      <Wallet className="h-4 w-4 text-primary" />
      {connecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
