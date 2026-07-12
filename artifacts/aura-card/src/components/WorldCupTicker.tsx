import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { NATION_FLAGS } from "../lib/nations";

const API_BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

interface WorldCupMatch {
  fixtureId: number;
  competition: string;
  competitionId: number;
  startTime: number;
  home: string;
  away: string;
  homeId: number;
  awayId: number;
}

interface FixturesResponse {
  configured: boolean;
  matches: WorldCupMatch[];
}

function Flag({ nation }: { nation: string }) {
  const code = NATION_FLAGS[nation];
  if (!code) return null;
  return <img src={`https://flagcdn.com/w20/${code}.png`} alt="" className="h-3 w-auto rounded-[1px]" />;
}

function kickoff(ms: number): string {
  try {
    return new Date(ms).toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Slim live World Cup fixtures ticker (TxLINE feed). Self-hides when the feed
 * isn't configured or has no fixtures, so it never shows an empty/broken bar.
 */
export function WorldCupTicker() {
  const { data } = useQuery({
    queryKey: ["worldcup-fixtures"],
    queryFn: async (): Promise<FixturesResponse> => {
      const res = await fetch(`${API_BASE}/api/worldcup/fixtures`);
      if (!res.ok) throw new Error("feed error");
      return res.json();
    },
    refetchInterval: 60_000, // free tier samples every 60s
    staleTime: 30_000,
  });

  const matches = data?.matches ?? [];
  if (!data?.configured || matches.length === 0) return null;

  const items = matches.slice(0, 24);
  const Row = (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {items.map((m) => (
        <span key={m.fixtureId} className="flex items-center gap-2 whitespace-nowrap">
          <Flag nation={m.home} />
          <span className="font-condensed text-xs font-semibold uppercase tracking-wide text-white/85">{m.home}</span>
          <span className="text-[10px] font-bold text-white/30">vs</span>
          <span className="font-condensed text-xs font-semibold uppercase tracking-wide text-white/85">{m.away}</span>
          <Flag nation={m.away} />
          <span className="ml-1 font-condensed text-[10px] uppercase tracking-wide text-primary/70">{kickoff(m.startTime)}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="w-full overflow-hidden border-t border-white/10 bg-surface-1" data-testid="worldcup-ticker">
      <div className="flex w-full items-center gap-3 px-4">
        <span className="flex shrink-0 items-center gap-1.5 border-r border-white/10 py-2 pr-3 font-condensed text-[10px] font-bold uppercase tracking-widest text-primary">
          <Radio className="h-3 w-3 animate-pulse" />
          Live · World Cup
        </span>
        <div className="relative flex-1 overflow-hidden py-2">
          <div className="flex w-max animate-wc-ticker">
            {/* duplicated for a seamless loop */}
            {Row}
            {Row}
          </div>
        </div>
      </div>
    </div>
  );
}
