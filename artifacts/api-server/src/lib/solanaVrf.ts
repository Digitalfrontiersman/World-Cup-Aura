import { createHash } from "node:crypto";
import {
  Connection,
  Transaction,
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getTreasuryConfig } from "./solanaMint.js";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const ARCHETYPES = [
  "Chaos Striker",
  "Tactical Captain",
  "Aura Midfielder",
  "Golden Boot Prophet",
  "Penalty Ghost",
  "Savage Winger",
  "Crowd Controller",
  "Clutch Warrior",
  "Delusion King",
  "Underdog Hero",
  "National Icon",
  "Final Boss Fan",
  "Group Chat Menace",
];

const PROPHECIES = [
  "You were born for late winners and emotional chaos.",
  "Your aura rises strongest when doubted.",
  "You will talk the most and suffer the most.",
  "You carry the energy of a nation that refuses to quit.",
  "You are dangerously confident and weirdly powerful.",
  "Your rival nation should fear your group chat energy.",
  "You may not survive penalties, but your aura will.",
];

const STAT_KEYS = ["speed", "clutch", "iq", "chaos", "loyalty", "banter"] as const;

// Pull rates (%) matching RARITY_TIERS in aura.ts — ordered most-common → rarest
const RARITY_PULL_RATES = [55.0, 25.0, 12.0, 5.5, 2.0, 0.5] as const;
const RARITY_TIERS_ORDERED = ["Core", "Rising", "Elite", "Icon", "Legendary", "Mythic"] as const;

export interface VrfValues {
  vrfSeedHex: string;
  vrfSlot: number;
  vrfArchetype: string;
  vrfProphecy: string;
  vrfStatDeltas: Record<string, number>;
}

/**
 * Derive a 32-byte deterministic seed from:
 *   blockhash  — produced by Solana validators, unpredictable before the request
 *   slug       — unique card slug, generated server-side before portrait generation
 *   ts         — millisecond timestamp locked at request start
 *
 * Seed = SHA-256("${blockhash}:${slug}:${ts}")
 *
 * Anyone with the blockhash (from the on-chain Memo) + slug + ts can recompute
 * the seed and verify all derived card values (rarity, archetype, prophecy, stats).
 */
export function deriveVrfSeed(blockhash: string, slug: string, ts: number): Buffer {
  return createHash("sha256")
    .update(`${blockhash}:${slug}:${ts}`)
    .digest();
}

/**
 * Pick a rarity tier using the same weighted-draw logic as the server's
 * Math.random() path, seeded deterministically from byte 0 of the VRF seed.
 *
 * Byte 0 maps to [0, 256) → scaled to [0, 100) and compared against cumulative
 * pull-rate thresholds (rarest-first scan, matching aura.ts quota draw).
 */
export function pickRarity(seed: Buffer): string {
  const rand = (seed[0] / 256) * 100.0;
  let cumRate = 0;
  let drawnIdx = 0;
  for (let i = RARITY_TIERS_ORDERED.length - 1; i >= 0; i--) {
    cumRate += RARITY_PULL_RATES[i];
    if (rand < cumRate) {
      drawnIdx = i;
      break;
    }
  }
  return RARITY_TIERS_ORDERED[drawnIdx];
}

/**
 * Derive all VRF-based card values from a 32-byte seed.
 *
 * Byte layout:
 *   [0]   → rarity draw (pickRarity)
 *   [1]   → archetype index (mod ARCHETYPES.length)
 *   [2]   → prophecy index (mod PROPHECIES.length)
 *   [3]   → speed delta
 *   [4]   → clutch delta
 *   [5]   → iq delta
 *   [6]   → chaos delta
 *   [7]   → loyalty delta
 *   [8]   → banter delta
 *   (each delta byte maps 0–255 → −5..+5 via round((byte/255)*10−5))
 */
export function deriveVrfValues(seed: Buffer, slot: number): VrfValues {
  const mapDelta = (byte: number) => Math.round((byte / 255) * 10 - 5);
  const vrfStatDeltas: Record<string, number> = {};
  STAT_KEYS.forEach((key, i) => {
    vrfStatDeltas[key] = mapDelta(seed[3 + i]);
  });
  return {
    vrfSeedHex: seed.toString("hex"),
    vrfSlot: slot,
    vrfArchetype: ARCHETYPES[seed[1] % ARCHETYPES.length],
    vrfProphecy: PROPHECIES[seed[2] % PROPHECIES.length],
    vrfStatDeltas,
  };
}

/**
 * Fetch the latest confirmed blockhash + slot number from the treasury RPC.
 * Returns null if the RPC is unreachable or unconfigured.
 */
export async function fetchBlockhashData(): Promise<{ blockhash: string; slot: number } | null> {
  const cfg = getTreasuryConfig();
  const rpcUrl = cfg?.rpcUrl ?? "https://api.devnet.solana.com";
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const [{ blockhash }, slot] = await Promise.all([
      connection.getLatestBlockhash("confirmed"),
      connection.getSlot("confirmed"),
    ]);
    return { blockhash, slot };
  } catch {
    return null;
  }
}

/**
 * Send a Solana Memo transaction that permanently records the full VRF inputs
 * on-chain. The memo JSON contains every field needed for independent verification:
 *
 *   { app, v, slug, blockhash, requestId, ts, slot, seedHex, vrfRarity, archetype }
 *
 * Verification procedure:
 *   1. Look up the slot on Solana Explorer to get the block's `blockhash`.
 *   2. Compute SHA-256("${blockhash}:${requestId}:${ts}") → compare against `seedHex`.
 *   3. Re-derive archetype / rarity / stat deltas from the seed to confirm outputs.
 *
 * `vrfRarity` is the seed-derived rarity (byte 0 of seed mapped through pull rates).
 * The actual assigned rarity may differ due to edition quota cascading, but the
 * seed-derived rarity is what the VRF committed to before quota data was read.
 *
 * Returns the transaction signature, or null if the treasury is unconfigured
 * or the transaction fails.
 */
export async function commitVrfMemo(
  slug: string,
  blockhash: string,
  ts: number,
  slot: number,
  seedHex: string,
  vrfRarity: string,
  archetype: string,
): Promise<string | null> {
  const cfg = getTreasuryConfig();
  if (!cfg) return null;

  try {
    const connection = new Connection(cfg.rpcUrl, "confirmed");
    // Memo v2: contains all inputs needed for independent seed recomputation.
    // Verifier: SHA-256("${blockhash}:${slug}:${ts}") must equal seedHex.
    const memoText = JSON.stringify({
      app: "worldcupaura",
      v: 2,
      slug,
      blockhash,
      ts,
      slot,
      seedHex,
      vrfRarity,
      archetype,
    });

    const ix = new TransactionInstruction({
      keys: [{ pubkey: cfg.keypair.publicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, "utf-8"),
    });

    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [cfg.keypair], {
      commitment: "confirmed",
      skipPreflight: true,
    });
    return sig;
  } catch {
    return null;
  }
}
