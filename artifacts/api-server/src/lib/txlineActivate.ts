// One-time TxLINE free World Cup tier activation (Solana devnet).
//
// Flow (mirrors txodds/tx-on-chain examples/devnet):
//   guest JWT → ensure Token-2022 ATA → subscribe(serviceLevel=1, weeks=4) on
//   the TxLINE program → sign `${txSig}:${leagues}:${jwt}` → POST /token/activate
//   → API token (valid ~4 weeks). We reuse the app's devnet treasury wallet as
//   the subscriber (free tier costs 0 TxL, only SOL fees) and persist the token
//   to a gitignored file so restarts don't re-subscribe.

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import nacl from "tweetnacl";
import fs from "fs";
import { logger } from "./logger";
import { getTreasuryConfig } from "./solanaMint";
import idl from "./txoracle.idl.json" with { type: "json" };

const DEVNET_API = "https://txline-dev.txodds.com";
const TOKEN_MINT = new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG");
const SERVICE_LEVEL_ID = 1; // free World Cup tier
const DURATION_WEEKS = 4;
const SELECTED_LEAGUES: number[] = []; // empty = standard World Cup bundle

const TOKEN_FILE = "artifacts/api-server/.txline-token.json";
const TOKEN_TTL_MS = 24 * 24 * 60 * 60 * 1000; // ~24 days (< the 4-week validity)

interface CachedToken { token: string; createdAt: number; }

function readCachedToken(): string | null {
  try {
    const c = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")) as CachedToken;
    if (c.token && Date.now() - c.createdAt < TOKEN_TTL_MS) return c.token;
  } catch { /* none */ }
  return null;
}

function writeCachedToken(token: string): void {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, createdAt: Date.now() }, null, 2));
  } catch (err) {
    logger.warn({ err }, "Could not persist TxLINE token");
  }
}

/** True if we have either a cached token or a treasury wallet to activate with. */
export function canActivate(): boolean {
  return Boolean(readCachedToken()) || getTreasuryConfig() !== null;
}

let inFlight: Promise<string> | null = null;
let lastFailureMs = 0;
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000; // don't retry on-chain activation too often

/** Returns a valid TxLINE API token, activating on-chain once if needed. */
export async function getActivatedApiToken(): Promise<string> {
  const cached = readCachedToken();
  if (cached) return cached;
  if (inFlight) return inFlight;
  if (Date.now() - lastFailureMs < FAILURE_COOLDOWN_MS) {
    throw new Error("TxLINE activation recently failed; in cooldown.");
  }
  inFlight = activate()
    .catch((err) => { lastFailureMs = Date.now(); throw err; })
    .finally(() => { inFlight = null; });
  return inFlight;
}

async function activate(): Promise<string> {
  const cfg = getTreasuryConfig();
  if (!cfg) throw new Error("No treasury wallet available for TxLINE activation.");
  const user = cfg.keypair;

  const connection = new Connection(process.env.TXLINE_RPC_URL || cfg.rpcUrl, "confirmed");
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(user), { commitment: "confirmed" });
  const program = new anchor.Program(idl as anchor.Idl, provider);

  // 1. Guest JWT
  const jwtRes = await fetch(`${DEVNET_API}/auth/guest/start`, { method: "POST" });
  if (!jwtRes.ok) throw new Error(`TxLINE guest auth failed: ${jwtRes.status}`);
  const jwt = ((await jwtRes.json()) as { token: string }).token;

  // 2. Ensure the user's Token-2022 ATA exists
  const userAta = getAssociatedTokenAddressSync(TOKEN_MINT, user.publicKey, false, TOKEN_2022_PROGRAM_ID);
  if (!(await connection.getAccountInfo(userAta))) {
    logger.info("TxLINE: creating Token-2022 ATA for subscriber");
    const ataTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        user.publicKey, userAta, user.publicKey, TOKEN_MINT, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
    await anchor.web3.sendAndConfirmTransaction(connection, ataTx, [user], { commitment: "confirmed" });
  }

  // 3. subscribe() on-chain (free tier)
  const [pricingMatrixPda] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], program.programId);
  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], program.programId);
  const tokenTreasuryVault = getAssociatedTokenAddressSync(TOKEN_MINT, tokenTreasuryPda, true, TOKEN_2022_PROGRAM_ID);

  logger.info({ level: SERVICE_LEVEL_ID, weeks: DURATION_WEEKS }, "TxLINE: subscribing on-chain (free World Cup tier)");
  const tx: Transaction = await program.methods
    .subscribe(SERVICE_LEVEL_ID, DURATION_WEEKS)
    .accountsPartial({
      user: user.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: TOKEN_MINT,
      userTokenAccount: userAta,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  const bh = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = bh.blockhash;
  tx.feePayer = user.publicKey;
  tx.sign(user);
  const txSig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction({ signature: txSig, blockhash: bh.blockhash, lastValidBlockHeight: bh.lastValidBlockHeight }, "confirmed");
  logger.info({ txSig }, "TxLINE: subscription tx confirmed");

  // 4. Sign the message binding and activate
  const message = new TextEncoder().encode(`${txSig}:${SELECTED_LEAGUES.join(",")}:${jwt}`);
  const walletSignature = Buffer.from(nacl.sign.detached(message, user.secretKey)).toString("base64");

  const actRes = await fetch(`${DEVNET_API}/api/token/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ txSig, walletSignature, leagues: SELECTED_LEAGUES }),
  });
  if (!actRes.ok) throw new Error(`TxLINE activation failed: ${actRes.status} ${(await actRes.text().catch(() => "")).slice(0, 200)}`);
  const actBody = await actRes.text();
  let token: string;
  try {
    const parsed = JSON.parse(actBody) as { token?: string };
    token = parsed.token ?? actBody;
  } catch {
    token = actBody.trim().replace(/^"|"$/g, "");
  }
  if (!token) throw new Error("TxLINE activation returned an empty token.");

  writeCachedToken(token);
  logger.info("TxLINE: API token activated + cached");
  return token;
}
