import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";

/**
 * Wallet layer selection. Reown AppKit needs a projectId (from cloud.reown.com);
 * when `VITE_REOWN_PROJECT_ID` is set we use AppKit's polished modal, otherwise
 * we fall back to the plain `@solana/wallet-adapter` modal so the site keeps
 * working with no config. The choice is fixed at module load, so the two hook
 * implementations below are each called consistently across renders.
 */
export const REOWN_PROJECT_ID = ((import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined) ?? "").trim();
export const USE_APPKIT = REOWN_PROJECT_ID.length > 0;

export interface WalletBridge {
  /** Base58 address of the connected wallet, or null. */
  address: string | null;
  isConnected: boolean;
  connecting: boolean;
  /** Human wallet name when known (adapter path only). */
  walletName: string | null;
  /** Open the connect modal. */
  open: () => void;
  disconnect: () => void;
}

/** Legacy path: @solana/wallet-adapter modal. */
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

/** New path: Reown AppKit modal (Solana). */
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

/** One hook the app reads for wallet state, regardless of the underlying modal. */
export const useWalletBridge: () => WalletBridge = USE_APPKIT ? useAppKitBridge : useAdapterBridge;
