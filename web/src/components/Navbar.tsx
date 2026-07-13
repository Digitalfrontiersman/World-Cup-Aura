import { useEffect, useState } from "react";
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
 * Slim persistent top bar shared across pages. Transparent over the hero, then
 * fades to a frosted-glass bar once you scroll. Wordmark left; route links +
 * wallet right. Collection / Odds / Docs are real routes.
 */
export function Navbar({ onHome }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wordmark = (
    <span className="flex items-center gap-2">
      <span className="h-2 w-2 rotate-45 rounded-[2px] bg-primary shadow-[0_0_10px_hsl(42_78%_55%/0.6)]" aria-hidden />
      <span className="font-display text-sm font-bold uppercase leading-none tracking-tight text-white">
        Aura <span className="text-primary">Cards</span>
      </span>
    </span>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? "border-b border-white/[0.07] bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-background/70 to-transparent"
      }`}
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
          TxLINE feed isn't configured). Only shown once scrolled so the hero
          stays clean and cinematic. */}
      {scrolled && <WorldCupTicker />}
    </header>
  );
}
