import { readFileSync } from "node:fs";
import path from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

// The server-side "treasury" sponsor wallet pays all mint fees so users need no
// SOL of their own. Its secret key lives ONLY server-side (env var or this
// gitignored file) — never in the client bundle — so it can't be
// extracted/drained by visitors.
const CONFIG_FILE = "artifacts/api-server/.solana-treasury.json";

// Env-var names checked before the file. Setting these (e.g. via a secret store)
// makes the treasury wallet portable to any environment with no code change.
const ENV_SECRET_KEY = "SOLANA_TREASURY_SECRET_KEY";
const ENV_RPC_URL = "SOLANA_DEVNET_RPC_URL";

// Default devnet RPC used when no explicit URL is configured anywhere.
const DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com";

// A regular NFT mint costs ~0.02 SOL (rent + fees). Require a small buffer so we
// fail fast with a clear message instead of a confusing on-chain error when the
// treasury runs dry.
const MIN_TREASURY_SOL = 0.03;

const DEVNET_IRYS = "https://devnet.irys.xyz";

export interface CardMeta {
  id: string;
  name: string;
  nation: string;
  aura: number;
  power: number;
  rank: string;
  rarity: string;
  archetype: string;
  prophecy: string;
  stats: {
    speed: number;
    clutch: number;
    iq: number;
    chaos: number;
    loyalty: number;
    banter: number;
  };
}

export interface MintCardOutput {
  mintAddress: string;
  explorerUrl: string;
  recipient: string;
}

export interface MintStatusInfo {
  configured: boolean;
  ready: boolean;
  treasuryAddress: string | null;
  balanceSol: number | null;
}

export class TreasuryNotConfiguredError extends Error {
  constructor(message = "Treasury wallet is not configured.") {
    super(message);
    this.name = "TreasuryNotConfiguredError";
  }
}

export class TreasuryUnfundedError extends Error {
  constructor(message = "Treasury wallet is out of devnet SOL.") {
    super(message);
    this.name = "TreasuryUnfundedError";
  }
}

interface TreasuryConfig {
  rpcUrl: string;
  secretKey: string;
}

function workspaceRoot(): string {
  // esbuild bundles the server to dist/, so resolve paths from an explicit root
  // that is stable whether dev runs from artifacts/api-server or prod from root.
  return process.cwd().endsWith(path.join("artifacts", "api-server"))
    ? path.resolve(process.cwd(), "../..")
    : process.cwd();
}

let cachedConfig: TreasuryConfig | null | undefined;

function loadFromFile(): Partial<TreasuryConfig> {
  try {
    const raw = readFileSync(path.resolve(workspaceRoot(), CONFIG_FILE), "utf8");
    return JSON.parse(raw) as Partial<TreasuryConfig>;
  } catch {
    return {};
  }
}

function loadConfig(): TreasuryConfig | null {
  if (cachedConfig !== undefined) return cachedConfig;

  // Env vars win so the wallet is portable to any environment that can supply a
  // secret. The gitignored file is the no-permission fallback.
  const fileCfg = loadFromFile();
  const secretKey = process.env[ENV_SECRET_KEY]?.trim() || fileCfg.secretKey;
  const rpcUrl =
    process.env[ENV_RPC_URL]?.trim() || fileCfg.rpcUrl || DEFAULT_DEVNET_RPC;

  cachedConfig = secretKey ? { rpcUrl, secretKey } : null;
  return cachedConfig;
}

function treasuryKeypair(cfg: TreasuryConfig): Keypair {
  return Keypair.fromSecretKey(bs58.decode(cfg.secretKey));
}

export function isMintConfigured(): boolean {
  return loadConfig() !== null;
}

/**
 * Returns the treasury keypair + RPC URL for use by other server-side modules
 * (e.g. solanaVrf.ts for committing Memo transactions). Returns null when the
 * treasury wallet is not configured.
 */
export function getTreasuryConfig(): { rpcUrl: string; keypair: Keypair } | null {
  const cfg = loadConfig();
  if (!cfg) return null;
  try {
    return { rpcUrl: cfg.rpcUrl, keypair: treasuryKeypair(cfg) };
  } catch {
    return null;
  }
}

export function isValidAddress(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export function getTreasuryAddress(): string | null {
  const cfg = loadConfig();
  if (!cfg) return null;
  try {
    return treasuryKeypair(cfg).publicKey.toBase58();
  } catch {
    return null;
  }
}

async function getBalanceSol(cfg: TreasuryConfig): Promise<number | null> {
  try {
    const conn = new Connection(cfg.rpcUrl, "confirmed");
    const lamports = await conn.getBalance(treasuryKeypair(cfg).publicKey);
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

export async function getMintStatusInfo(): Promise<MintStatusInfo> {
  const cfg = loadConfig();
  if (!cfg) {
    return {
      configured: false,
      ready: false,
      treasuryAddress: null,
      balanceSol: null,
    };
  }
  const treasuryAddress = getTreasuryAddress();
  const balanceSol = await getBalanceSol(cfg);
  const ready = balanceSol !== null && balanceSol >= MIN_TREASURY_SOL;
  return { configured: true, ready, treasuryAddress, balanceSol };
}

function buildAttributes(card: CardMeta) {
  return [
    { trait_type: "Nation", value: card.nation },
    { trait_type: "Aura", value: String(card.aura) },
    { trait_type: "Power", value: String(card.power) },
    { trait_type: "Rank", value: card.rank },
    { trait_type: "Rarity", value: card.rarity },
    { trait_type: "Archetype", value: card.archetype },
    { trait_type: "Speed", value: String(card.stats.speed) },
    { trait_type: "Clutch", value: String(card.stats.clutch) },
    { trait_type: "IQ", value: String(card.stats.iq) },
    { trait_type: "Chaos", value: String(card.stats.chaos) },
    { trait_type: "Loyalty", value: String(card.stats.loyalty) },
    { trait_type: "Banter", value: String(card.stats.banter) },
  ];
}

/**
 * Sponsor-mints an Aura Card NFT to `recipient`, paying all fees from the
 * server-held treasury wallet. Uploads the image + metadata to devnet Irys,
 * then mints a regular NFT whose token owner is the recipient.
 */
export async function mintCardToRecipient(
  imageBytes: Uint8Array,
  card: CardMeta,
  recipient: string,
): Promise<MintCardOutput> {
  const cfg = loadConfig();
  if (!cfg) throw new TreasuryNotConfiguredError();

  const kp = treasuryKeypair(cfg);

  const balance = await getBalanceSol(cfg);
  if (balance === null) {
    throw new Error("Could not reach the Solana devnet RPC.");
  }
  if (balance < MIN_TREASURY_SOL) {
    throw new TreasuryUnfundedError();
  }

  const umi = createUmi(cfg.rpcUrl)
    .use(mplTokenMetadata())
    .use(irysUploader({ address: DEVNET_IRYS }));
  umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(kp.secretKey)));

  const file = createGenericFile(imageBytes, `aura-card-${card.id}.png`, {
    contentType: "image/png",
  });
  const [imageUri] = await umi.uploader.upload([file]);

  const metadataUri = await umi.uploader.uploadJson({
    name: card.name,
    symbol: "AURA",
    description: `World Cup Aura Card — ${card.archetype} from ${card.nation}. "${card.prophecy}"`,
    image: imageUri,
    attributes: buildAttributes(card),
    properties: {
      files: [{ uri: imageUri, type: "image/png" }],
      category: "image",
    },
  });

  const mint = generateSigner(umi);
  await createNft(umi, {
    mint,
    name: card.name,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    tokenOwner: umiPublicKey(recipient),
  }).sendAndConfirm(umi);

  const mintAddress = mint.publicKey.toString();
  return {
    mintAddress,
    explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`,
    recipient,
  };
}
