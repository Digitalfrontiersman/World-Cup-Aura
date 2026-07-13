import { useMemo, type ReactNode } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solanaDevnet } from "@reown/appkit/networks";
import { REOWN_PROJECT_ID, USE_APPKIT } from "@/lib/walletBridge";

/**
 * Wallet providers. When a Reown projectId is configured we boot AppKit (its
 * modal supersedes the plain adapter UI); otherwise we mount the legacy
 * `@solana/wallet-adapter` providers so the app works with zero config.
 *
 * Either way the wallet is only ever READ for its address as the NFT mint
 * destination - minting is treasury-sponsored, so the wallet never signs.
 * Phantom (and any Wallet-Standard wallet) is supported in both paths.
 */
if (USE_APPKIT) {
  createAppKit({
    adapters: [new SolanaAdapter()],
    networks: [solanaDevnet],
    projectId: REOWN_PROJECT_ID,
    metadata: {
      name: "Aura Cards",
      description: "Turn your selfie into a legendary fan card, minted on Solana.",
      url: "https://worldcupaura.com",
      icons: ["https://worldcupaura.com/apple-touch-icon.png"],
    },
    features: { analytics: false, email: false, socials: [] },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#e6b033", // gold, matching the app's primary
      "--w3m-border-radius-master": "2px",
    },
  });
}

export function SolanaProviders({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    const raw = import.meta.env.VITE_SOLANA_DEVNET_RPC_URL as string | undefined;
    if (raw && /^https?:\/\//.test(raw)) return raw;
    if (raw) return `https://devnet.helius-rpc.com/?api-key=${raw}`;
    return clusterApiUrl("devnet");
  }, []);

  // AppKit manages its own connection + state internally; no adapter tree needed.
  if (USE_APPKIT) return <>{children}</>;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
