import { useEffect, useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { createAppKit, useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solanaDevnet } from "@reown/appkit/networks";
import { REOWN_PROJECT_ID, USE_APPKIT, publishBridge, type WalletBridge } from "@/lib/walletBridge";

/**
 * Heavy wallet runtime — code-split into its own chunk and lazy-loaded by
 * WalletRuntimeGate only after the user activates the wallet. It boots the
 * connect modal (AppKit when a Reown projectId is set, else the plain
 * @solana/wallet-adapter modal) and publishes live wallet state into the
 * lightweight store in walletBridge.ts, which the rest of the app reads.
 *
 * The wallet is only ever READ for its address as the NFT mint destination -
 * minting is treasury-sponsored, so the wallet never signs.
 */
if (USE_APPKIT) {
  createAppKit({
    adapters: [new SolanaAdapter()],
    networks: [solanaDevnet],
    projectId: REOWN_PROJECT_ID,
    metadata: {
      name: "World Cup Aura",
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

/** Reown AppKit modal (Solana). AppKit is a global store + injected modal. */
function useAppKitBridge(): WalletBridge {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  return {
    address: isConnected && address ? address : null,
    isConnected: !!isConnected && !!address,
    connecting: status === "connecting" || status === "reconnecting",
    walletName: null,
    open: () => {
      void open();
    },
    disconnect: () => {
      void disconnect();
    },
  };
}

/** Legacy path: @solana/wallet-adapter modal (needs the provider tree below). */
function useAdapterBridge(): WalletBridge {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  return {
    address: connected && publicKey ? publicKey.toBase58() : null,
    isConnected: connected && !!publicKey,
    connecting,
    walletName: wallet?.adapter.name ?? null,
    open: () => setVisible(true),
    disconnect: () => {
      void disconnect();
    },
  };
}

const useLiveBridge = USE_APPKIT ? useAppKitBridge : useAdapterBridge;

/** Reads live wallet state from the active modal and publishes it to the store. */
function BridgeSync() {
  const b = useLiveBridge();
  useEffect(() => {
    publishBridge(b);
    // Re-publish only when meaningful state changes; open/disconnect are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.address, b.isConnected, b.connecting, b.walletName]);
  return null;
}

/** Lazy-loaded wallet runtime. Renders no visible UI — just wires up the modal. */
export function WalletRuntime() {
  const endpoint = useMemo(() => {
    const raw = import.meta.env.VITE_SOLANA_DEVNET_RPC_URL as string | undefined;
    if (raw && /^https?:\/\//.test(raw)) return raw;
    if (raw) return `https://devnet.helius-rpc.com/?api-key=${raw}`;
    return clusterApiUrl("devnet");
  }, []);

  // AppKit manages its own connection + injected modal — no adapter tree needed.
  if (USE_APPKIT) return <BridgeSync />;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <BridgeSync />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
