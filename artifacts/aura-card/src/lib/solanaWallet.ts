import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { getStoredString, setStoredString } from "./storage";

const STORAGE_KEY = "aura-card:devnet-wallet";

// A throwaway devnet keypair persisted in localStorage. It is only used as a
// fallback recipient address for users who don't have their own wallet — the
// actual mint (and all fees) happen server-side via the sponsor treasury, so
// this key never needs funding and never signs anything.
let cachedKeypair: Keypair | null = null;

export function getWallet(): Keypair {
  if (cachedKeypair) return cachedKeypair;

  const stored = getStoredString(STORAGE_KEY);
  if (stored) {
    try {
      cachedKeypair = Keypair.fromSecretKey(bs58.decode(stored));
      return cachedKeypair;
    } catch {
      // fall through and regenerate if the stored value is corrupt
    }
  }

  const keypair = Keypair.generate();
  setStoredString(STORAGE_KEY, bs58.encode(keypair.secretKey));
  cachedKeypair = keypair;
  return keypair;
}

export function getWalletAddress(): string {
  return getWallet().publicKey.toBase58();
}
