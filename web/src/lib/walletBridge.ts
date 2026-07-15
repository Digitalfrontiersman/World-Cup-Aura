import { useSyncExternalStore } from "react";

/**
 * Lightweight wallet bridge. The heavy wallet stack (@reown/appkit +
 * @solana/wallet-adapter) is code-split into a lazy chunk (SolanaProviders) that
 * only loads once the user activates the wallet (clicks Connect, or was
 * connected in a previous session). This module holds a tiny external store the
 * whole app reads via `useWalletBridge()`; it imports NOTHING heavy, so it stays
 * in the initial bundle while the wallet libraries do not.
 *
 * Minting is treasury-sponsored via a throwaway localStorage wallet, so the
 * connected wallet is only ever READ as the mint destination — the default
 * disconnected state simply falls back to the throwaway wallet.
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
  /** Open the connect modal (activates + lazy-loads the wallet stack on first use). */
  open: () => void;
  disconnect: () => void;
}

const ACTIVATION_KEY = "wca:wallet-activated";
function readActivated(): boolean {
  try {
    return localStorage.getItem(ACTIVATION_KEY) === "1";
  } catch {
    return false;
  }
}

let activated = readActivated();
let hasRuntime = false;
let pendingOpen = false;

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Kick off loading the wallet runtime and open the modal once it's ready. The
 * first call flips `activated`, which mounts the lazy runtime; the pending open
 * is consumed by `publishBridge` as soon as the real bridge goes live.
 */
export function requestConnect(): void {
  pendingOpen = true;
  if (!activated) {
    activated = true;
    try {
      localStorage.setItem(ACTIVATION_KEY, "1");
    } catch {
      /* ignore */
    }
    emit();
  } else if (hasRuntime) {
    pendingOpen = false;
    bridge.open();
  }
}

const disconnectedBridge: WalletBridge = {
  address: null,
  isConnected: false,
  connecting: false,
  walletName: null,
  open: requestConnect,
  disconnect: () => {},
};

let bridge: WalletBridge = disconnectedBridge;

/** The lazy wallet runtime publishes live wallet state here as it changes. */
export function publishBridge(next: WalletBridge): void {
  hasRuntime = true;
  bridge = next;
  emit();
  if (pendingOpen) {
    pendingOpen = false;
    next.open();
  }
}

/** The single hook the app reads for wallet state, regardless of the modal. */
export function useWalletBridge(): WalletBridge {
  return useSyncExternalStore(
    subscribe,
    () => bridge,
    () => bridge,
  );
}

/** True once the wallet stack should be mounted (used by WalletRuntimeGate). */
export function useWalletActivated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => activated,
    () => activated,
  );
}
