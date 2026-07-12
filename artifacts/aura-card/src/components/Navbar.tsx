import { WalletConnect } from "@/components/WalletConnect";

interface NavbarProps {
  /** Opens the collection-odds panel. */
  onOpenOdds?: () => void;
  /** Opens the full gallery of every minted card. */
  onOpenCollection?: () => void;
  /** Wordmark click - return to the landing screen. */
  onHome?: () => void;
}

/**
 * Slim persistent top bar: wordmark left, collection link + wallet right.
 * Fixed so it stays put across the flow; sits below the reveal overlays (z-40).
 */
export function Navbar({ onOpenOdds, onOpenCollection, onHome }: NavbarProps) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] bg-background/70 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <button
          onClick={onHome}
          className="flex items-center gap-2"
          aria-label="World Cup Aura home"
          data-testid="nav-home"
        >
          <img
            src={`${import.meta.env.BASE_URL}football.png`}
            alt=""
            className="h-7 w-7 object-contain"
          />
          <span className="font-display text-sm font-black uppercase leading-none tracking-tight text-white">
            World Cup <span className="text-primary">Aura</span>
          </span>
        </button>

        <nav className="flex items-center gap-1">
          {onOpenCollection && (
            <button
              onClick={onOpenCollection}
              className="px-2.5 py-2 font-condensed text-xs font-semibold uppercase tracking-wide text-white/60 transition-colors hover:text-white sm:px-3"
              data-testid="nav-collection"
            >
              Collection
            </button>
          )}
          {onOpenOdds && (
            <button
              onClick={onOpenOdds}
              className="hidden px-3 py-2 font-condensed text-xs font-semibold uppercase tracking-wide text-white/55 transition-colors hover:text-white sm:inline-flex"
              data-testid="nav-odds"
            >
              Odds
            </button>
          )}
          <WalletConnect compact />
        </nav>
      </div>
    </header>
  );
}
