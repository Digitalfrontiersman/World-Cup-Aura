import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";

/**
 * Minimal full-width site footer — a single edge-to-edge row: wordmark on the
 * left, a couple of route links + the fine print on the right.
 */
export function Footer() {
  return (
    <footer className="relative z-10 mt-16 w-full border-t border-white/10" data-testid="site-footer">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-6 sm:px-8">
        <div className="font-display text-sm font-bold uppercase tracking-tight text-white">
          Aura <span className="text-primary">Cards</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
          <Link href="/collection" className="transition-colors hover:text-foreground">
            Collection
          </Link>
          <Link href="/odds" className="transition-colors hover:text-foreground" data-testid="footer-odds">
            Odds
          </Link>
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
          <a
            href="https://worldcupaura.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Site <ArrowUpRight className="h-3 w-3" />
          </a>
          <span className="text-white/30">© 2026 Aura Cards · Minted on Solana · Not affiliated with FIFA</span>
        </div>
      </div>
    </footer>
  );
}
