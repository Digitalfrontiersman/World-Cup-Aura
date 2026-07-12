import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Radio } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

interface MarketReadData {
  nation: string;
  opponent: string;
  fixtureId: number;
  kickoff: number;
  winProbability: number;
  drawProbability: number;
  decimalOdds: number;
  stance: "favorite" | "contender" | "underdog";
}

interface OddsResponse {
  configured: boolean;
  read: MarketReadData | null;
}

const STANCE = {
  favorite: {
    label: "Frontrunner",
    tone: "#34d399",
    icon: TrendingUp,
    blurb: "the market backs your nation",
  },
  contender: {
    label: "Contender",
    tone: "#60a5fa",
    icon: Minus,
    blurb: "the market sees a real shot",
  },
  underdog: {
    label: "Dark Horse",
    tone: "#fb7185",
    icon: TrendingDown,
    blurb: "the market doubts them — that's the fuel",
  },
} as const;

/**
 * Live "odds-driven aura" panel: pulls the TxOdds/TxLINE StablePrice market read
 * for the card's nation and frames it as an aura stance. Self-hides when the feed
 * has no odds for that nation, so the card never shows a broken/empty band.
 */
export function MarketRead({ nation }: { nation: string }) {
  const { data } = useQuery({
    queryKey: ["market-read", nation],
    queryFn: async (): Promise<OddsResponse> => {
      const res = await fetch(
        `${API_BASE}/api/worldcup/odds/${encodeURIComponent(nation)}`,
      );
      if (!res.ok) throw new Error("odds unavailable");
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
  });

  const read = data?.read;
  if (!read) return null;

  const s = STANCE[read.stance];
  const Icon = s.icon;
  const winPct = Math.round(read.winProbability * 100);

  return (
    <div
      className="w-full rounded-2xl surface-card p-4"
      style={{ borderColor: `${s.tone}55` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="type-eyebrow text-[0.66rem]" style={{ color: s.tone }}>
          Live Market Read
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
          <Radio className="h-3 w-3" /> TxOdds
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${s.tone}1a`, color: s.tone }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold leading-tight text-white">
            {s.label}
            <span className="font-medium text-white/40">
              {" · "}
              {read.nation} {read.decimalOdds.toFixed(2)} to win
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {winPct}% implied vs {read.opponent} — {s.blurb}
          </p>
        </div>
      </div>
    </div>
  );
}
