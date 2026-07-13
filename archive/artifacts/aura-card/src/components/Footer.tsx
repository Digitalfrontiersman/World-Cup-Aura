import { ArrowUpRight } from "lucide-react";

interface FooterProps {
  /** Opens the collection-odds panel. */
  onOpenOdds?: () => void;
}

/**
 * Site footer shown on the landing + result screens. Wordmark, collection
 * links, and edition line - gives the app a real "site" bottom edge.
 */
export function Footer({ onOpenOdds }: FooterProps) {
  return (
    <footer className="relative z-10 mt-20 w-full border-t border-white/10 pt-8 pb-10" data-testid="site-footer">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="font-display text-lg font-black uppercase leading-none tracking-tight text-white">
              World Cup <span className="text-primary">Aura</span>
            </div>
            <p className="mt-2 font-condensed text-xs font-medium uppercase tracking-wide text-white/40">
              2026 Edition · 100,000 numbered cards
            </p>
          </div>

          <nav className="flex items-center gap-6 font-condensed text-xs font-semibold uppercase tracking-wide text-white/50">
            {onOpenOdds && (
              <button onClick={onOpenOdds} className="transition-colors hover:text-white" data-testid="footer-odds">
                Collection Odds
              </button>
            )}
            <a
              href="https://worldcupaura.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              worldcupaura.com
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
          <p className="text-[11px] text-white/30">© 2026 World Cup Aura. Not affiliated with FIFA.</p>
          <p className="text-[11px] text-white/30">Minted on Solana</p>
        </div>
      </div>
    </footer>
  );
}
