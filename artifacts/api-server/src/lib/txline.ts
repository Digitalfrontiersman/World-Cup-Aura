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

async function getRawFixtures(): Promise<TxFixture[]> {
  const qs = WC_COMPETITION_ID ? `?competitionId=${WC_COMPETITION_ID}` : "";
  const res = await txlineGet(`/api/fixtures/snapshot${qs}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TxLINE fixtures ${res.status}: ${body.slice(0, 200)}`);
  }
  let raw = (await res.json()) as TxFixture[];
  if (!WC_COMPETITION_ID) raw = raw.filter((f) => /world\s*cup/i.test(f.Competition));
  return raw;
}

/**
 * Current World Cup fixtures. If TXLINE_WC_COMPETITION_ID is set we filter
 * server-side; otherwise we keep fixtures whose competition name looks like a
 * World Cup.
 */
export async function getWorldCupFixtures(): Promise<WorldCupMatch[]> {
  if (!isConfigured()) return [];
  return (await getRawFixtures())
    .map(normalizeFixture)
    .sort((a, b) => a.startTime - b.startTime);
}

// ── Odds → market read ───────────────────────────────────────────────────────
// The TxLINE StablePrice feed exposes a 1X2 (home/draw/away) match-result market
// with de-margined implied probabilities. We turn a nation's implied win chance
// into an "aura stance" that drives the card's live market read.
interface TxOdds {
  FixtureId: number;
  SuperOddsType: string;
  PriceNames: string[];
  Prices: number[]; // decimal odds * 1000
  Pct: string[]; // de-margined implied %, or "NA"
}

export type MarketStance = "favorite" | "contender" | "underdog";

export interface NationMarketRead {
  nation: string;
  opponent: string;
  fixtureId: number;
  kickoff: number; // epoch ms
  winProbability: number; // 0..1 (de-margined)
  drawProbability: number; // 0..1
  decimalOdds: number; // e.g. 2.41
  stance: MarketStance;
}

const normName = (s: string): string => s.trim().toLowerCase();

function stanceFor(winProbability: number): MarketStance {
  if (winProbability >= 0.45) return "favorite";
  if (winProbability >= 0.28) return "contender";
  return "underdog";
}

/**
 * The live market's read on a nation: finds its soonest World Cup fixture that
 * carries 1X2 odds and returns the de-margined win chance + decimal price.
 * Returns null when the feed has no odds for that nation (graceful degrade).
 */
export async function getNationMarketRead(
  nation: string,
): Promise<NationMarketRead | null> {
  if (!isConfigured()) return null;
  const n = normName(nation);
  const candidates = (await getRawFixtures())
    .filter((f) => normName(f.Participant1) === n || normName(f.Participant2) === n)
    .sort((a, b) => a.StartTime - b.StartTime);

  for (const f of candidates) {
    const res = await txlineGet(`/api/odds/snapshot/${f.FixtureId}`);
    if (!res.ok) continue;
    const arr = (await res.json().catch(() => [])) as TxOdds[];
    const m = arr.find(
      (o) =>
        o.SuperOddsType === "1X2_PARTICIPANT_RESULT" &&
        Array.isArray(o.Pct) &&
        o.Pct.length === 3 &&
        o.Pct[0] !== "NA",
    );
    if (!m) continue;

    const isP1 = normName(f.Participant1) === n;
    const winPct = Number(m.Pct[isP1 ? 0 : 2]);
    const drawPct = Number(m.Pct[1]);
    const price = m.Prices[isP1 ? 0 : 2] / 1000;
    if (!Number.isFinite(winPct) || winPct <= 0) continue;

    const winProbability = winPct / 100;
    const startTime = f.StartTime > 1e12 ? f.StartTime : f.StartTime * 1000;
    return {
      nation: isP1 ? f.Participant1 : f.Participant2,
      opponent: isP1 ? f.Participant2 : f.Participant1,
      fixtureId: f.FixtureId,
      kickoff: startTime,
      winProbability,
      drawProbability: Number.isFinite(drawPct) ? drawPct / 100 : 0,
      decimalOdds: price,
      stance: stanceFor(winProbability),
    };
  }
  return null;
}
