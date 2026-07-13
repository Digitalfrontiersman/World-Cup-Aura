import { Link } from "wouter";
import { WalletConnect } from "@/components/WalletConnect";
import { WorldCupTicker } from "@/components/WorldCupTicker";

interface NavbarProps {
  /** In the home flow, the wordmark resets the flow instead of routing to "/". */
  onHome?: () => void;
}

const navLink =
  "rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3";

/**
 * Slim persistent top bar shared across pages. Wordmark left; route links +
 * wallet right. Collection / Odds / Docs are real routes now.
 */
export function Navbar({ onHome }: NavbarProps) {
  const wordmark = (
    <span className="font-display text-sm font-bold uppercase leading-none tracking-tight text-white">
      Aura <span className="text-primary">Cards</span>
    </span>
  );

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-card-border bg-background/80 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        {onHome ? (
          <button onClick={onHome} className="flex items-center" aria-label="Aura Cards home" data-testid="nav-home">
            {wordmark}
          </button>
        ) : (
          <Link href="/" className="flex items-center" aria-label="Aura Cards home" data-testid="nav-home">
            {wordmark}
          </Link>
        )}

        <nav className="flex items-center gap-1">
          <Link href="/collection" className={navLink} data-testid="nav-collection">
            Collection
          </Link>
          <Link href="/odds" className={`hidden sm:inline-flex ${navLink}`} data-testid="nav-odds">
            Odds
          </Link>
          <Link href="/docs" className={navLink} data-testid="nav-docs">
            Docs
          </Link>
          <WalletConnect compact />
        </nav>
      </div>

      {/* Live World Cup ticker, glued full-width to the navbar (self-hides if the
          TxLINE feed isn't configured). */}
      <WorldCupTicker />
    </header>
  );
}
