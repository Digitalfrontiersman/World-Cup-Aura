import { useMemo, type ReactNode } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Wraps the app in the Solana wallet-adapter providers so users can connect a
 * real wallet (Phantom, Solflare, and any Wallet-Standard wallet auto-registers)
 * as their NFT mint destination. Minting itself is treasury-sponsored, so the
 * wallet is only ever read for its address - it never signs.
 */
export function SolanaProviders({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    const raw = import.meta.env.VITE_SOLANA_DEVNET_RPC_URL as string | undefined;
    if (raw && /^https?:\/\//.test(raw)) return raw;
    if (raw) return `https://devnet.helius-rpc.com/?api-key=${raw}`;
    return clusterApiUrl("devnet");
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
