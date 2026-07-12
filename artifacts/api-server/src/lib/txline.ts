// TxLINE (TxOdds) live sports-data client.
//
// Data endpoints require two credentials:
//   1. a guest JWT from POST /auth/guest/start (free, fetched + cached here)
//   2. an X-Api-Token obtained via TxLINE's on-chain free-tier World Cup
//      activation (POST /api/token/activate with a Solana txSig + wallet
//      signature). That token is a static credential supplied via
//      TXLINE_API_TOKEN once activated.
//
// Without TXLINE_API_TOKEN the data endpoints return 403, so `isConfigured()`
// lets the routes degrade gracefully instead of erroring.

import { canActivate, getActivatedApiToken } from "./txlineActivate";

// The activated token is devnet-scoped, so default to the devnet host.
const BASE = (process.env.TXLINE_API_BASE || "https://txline-dev.txodds.com").replace(/\/+$/, "");
const ENV_TOKEN = process.env.TXLINE_API_TOKEN?.trim() ?? "";
// FIFA World Cup competition id in the TxLINE feed.
const WC_COMPETITION_ID = process.env.TXLINE_WC_COMPETITION_ID
  ? Number(process.env.TXLINE_WC_COMPETITION_ID)
  : 72;

/** Either a token is provided directly, or we can activate one on-chain. */
export function isConfigured(): boolean {
  return ENV_TOKEN.length > 0 || canActivate();
}

/** The API token: an explicit env token wins; otherwise activate on-chain (cached). */
async function getApiToken(): Promise<string> {
  return ENV_TOKEN || (await getActivatedApiToken());
}

// ── Guest JWT cache ─────────────────────────────────────────────────────────
let cachedJwt: string | null = null;
let jwtExpMs = 0;

function decodeJwtExpMs(jwt: string): number {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function getGuestJwt(force = false): Promise<string> {
  const now = Date.now();
  if (!force && cachedJwt && now < jwtExpMs - 60_000) return cachedJwt;
  const res = await fetch(`${BASE}/auth/guest/start`, { method: "POST" });
  if (!res.ok) throw new Error(`TxLINE guest auth failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  cachedJwt = data.token;
  jwtExpMs = decodeJwtExpMs(data.token) || now + 30 * 60_000;
  return cachedJwt;
}

/** GET a TxLINE data path with auth; renews the guest JWT once on 401 (per docs). */
async function txlineGet(path: string): Promise<Response> {
  const apiToken = await getApiToken();
  const fetchWith = (jwt: string) =>
    fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${jwt}`, "X-Api-Token": apiToken },
    });
  let res = await fetchWith(await getGuestJwt());
  if (res.status === 401) res = await fetchWith(await getGuestJwt(true));
  return res;
}

// ── Fixtures ────────────────────────────────────────────────────────────────
interface TxFixture {
  Ts: number;
  StartTime: number;
  Competition: string;
  CompetitionId: number;
  FixtureGroupId: number;
  Participant1Id: number;
  Participant1: string;
  Participant2Id: number;
  Participant2: string;
  FixtureId: number;
  Participant1IsHome: boolean;
}

export interface WorldCupMatch {
  fixtureId: number;
  competition: string;
  competitionId: number;
  startTime: number; // epoch ms
  home: string;
  away: string;
  homeId: number;
  awayId: number;
}

function normalizeFixture(f: TxFixture): WorldCupMatch {
  const p1Home = f.Participant1IsHome;
  // StartTime may arrive in seconds or ms; normalise to ms.
  const startTime = f.StartTime > 1e12 ? f.StartTime : f.StartTime * 1000;
  return {
    fixtureId: f.FixtureId,
    competition: f.Competition,
    competitionId: f.CompetitionId,
    startTime,
    home: p1Home ? f.Participant1 : f.Participant2,
    away: p1Home ? f.Participant2 : f.Participant1,
    homeId: p1Home ? f.Participant1Id : f.Participant2Id,
    awayId: p1Home ? f.Participant2Id : f.Participant1Id,
  };
}

/**
 * Current World Cup fixtures. If TXLINE_WC_COMPETITION_ID is set we filter
 * server-side; otherwise we pull the snapshot and keep fixtures whose
 * competition name looks like a World Cup.
 */
export async function getWorldCupFixtures(): Promise<WorldCupMatch[]> {
  if (!isConfigured()) return [];
  const qs = WC_COMPETITION_ID ? `?competitionId=${WC_COMPETITION_ID}` : "";
  const res = await txlineGet(`/api/fixtures/snapshot${qs}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TxLINE fixtures ${res.status}: ${body.slice(0, 200)}`);
  }
  const raw = (await res.json()) as TxFixture[];
  let matches = raw.map(normalizeFixture);
  if (!WC_COMPETITION_ID) matches = matches.filter((m) => /world\s*cup/i.test(m.competition));
  return matches.sort((a, b) => a.startTime - b.startTime);
}
