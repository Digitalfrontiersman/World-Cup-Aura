import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";
import { WorldCupTicker } from "@/components/WorldCupTicker";

interface NavbarProps {
  /** In the home flow, the wordmark resets the flow instead of routing to "/". */
  onHome?: () => void;
}

const NAV_ITEMS = [
  { href: "/collection", label: "Collection", testid: "nav-collection" },
  { href: "/odds", label: "Odds", testid: "nav-odds" },
  { href: "/docs", label: "Docs", testid: "nav-docs" },
] as const;

const mobileLinkBase =
  "block rounded-lg px-3 py-2.5 text-base font-medium transition-colors";

/**
 * Slim persistent top bar shared across pages. Transparent over the hero, then
 * fades to a frosted-glass bar once you scroll. Desktop nav is a frosted pill
 * with a gold active-indicator that slides between routes; a hamburger menu on
 * mobile. Inline nav on desktop.
 */
export function Navbar({ onHome }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

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
    <span className="group flex items-center gap-2">
      <motion.span
        aria-hidden
        className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-primary transition-transform duration-300 group-hover:scale-125"
        animate={{
          boxShadow: [
            "0 0 8px hsl(42 78% 55% / 0.5)",
            "0 0 16px hsl(42 78% 55% / 0.9)",
            "0 0 8px hsl(42 78% 55% / 0.5)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="font-display text-sm font-bold uppercase leading-none tracking-tight text-white">
        World Cup <span className="gold-text-static">Aura</span>
      </span>
    </span>
  );

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled || menuOpen
          ? "border-b border-white/[0.07] bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-background/70 to-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Gold hairline accent, revealed once the bar frosts over on scroll */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent transition-opacity duration-500 ${
          scrolled || menuOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        {onHome ? (
          <button
            onClick={() => {
              closeMenu();
              onHome();
            }}
            className="flex items-center"
            aria-label="World Cup Aura home"
            data-testid="nav-home"
          >
            {wordmark}
          </button>
        ) : (
          <Link href="/" className="flex items-center" aria-label="World Cup Aura home" data-testid="nav-home" onClick={closeMenu}>
            {wordmark}
          </Link>
        )}

        {/* Desktop nav — frosted pill with a sliding gold active-indicator */}
        <nav className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur">
            {NAV_ITEMS.map((item) => {
              const active = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={item.testid}
                  className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      className="absolute inset-0 -z-10 rounded-full bg-white/[0.07] ring-1 ring-primary/40 shadow-[0_0_16px_hsl(42_78%_55%/0.25)]"
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </div>
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={menuOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
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
              {NAV_ITEMS.map((item, i) => {
                const active = location === item.href || location.startsWith(`${item.href}/`);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      className={`${mobileLinkBase} ${
                        active
                          ? "bg-white/[0.06] text-white ring-1 ring-primary/30"
                          : "text-white/70 hover:bg-white/[0.05] hover:text-white"
                      }`}
                      onClick={closeMenu}
                      data-testid={`${item.testid}-mobile`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
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
    </motion.header>
  );
}
