import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { WorldCupTicker } from "@/components/WorldCupTicker";

interface NavbarProps {
  /** In the home flow, the wordmark resets the flow instead of routing to "/". */
  onHome?: () => void;
}

const navLink =
  "rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3";

const mobileLink =
  "block rounded-lg px-3 py-2.5 text-base font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white";

/**
 * Slim persistent top bar shared across pages. Transparent over the hero, then
 * fades to a frosted-glass bar once you scroll. Inline nav on desktop; a
 * hamburger menu on mobile.
 */
export function Navbar({ onHome }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

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
        scrolled || menuOpen
          ? "border-b border-white/[0.07] bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-background/70 to-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        {onHome ? (
          <button
            onClick={() => {
              closeMenu();
              onHome();
            }}
            className="flex items-center"
            aria-label="Aura Cards home"
            data-testid="nav-home"
          >
            {wordmark}
          </button>
        ) : (
          <Link href="/" className="flex items-center" aria-label="Aura Cards home" data-testid="nav-home" onClick={closeMenu}>
            {wordmark}
          </Link>
        )}

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/collection" className={navLink} data-testid="nav-collection">
            Collection
          </Link>
          <Link href="/odds" className={navLink} data-testid="nav-odds">
            Odds
          </Link>
          <Link href="/docs" className={navLink} data-testid="nav-docs">
            Docs
          </Link>
          <WalletConnect compact />
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          data-testid="nav-menu-toggle"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/[0.06] md:hidden"
          >
            <nav className="mx-auto flex w-full max-w-6xl flex-col gap-0.5 px-4 py-3">
              <Link href="/collection" className={mobileLink} onClick={closeMenu} data-testid="nav-collection-mobile">
                Collection
              </Link>
              <Link href="/odds" className={mobileLink} onClick={closeMenu} data-testid="nav-odds-mobile">
                Odds
              </Link>
              <Link href="/docs" className={mobileLink} onClick={closeMenu} data-testid="nav-docs-mobile">
                Docs
              </Link>
              <div className="mt-2 border-t border-white/[0.06] pt-3">
                <WalletConnect compact />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live World Cup ticker, glued full-width to the navbar (self-hides if the
          TxLINE feed isn't configured). Only shown once scrolled so the hero
          stays clean and cinematic. */}
      {scrolled && !menuOpen && <WorldCupTicker />}
    </header>
  );
}
