import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, ThumbsUp, MessageSquare, Layers } from "lucide-react";
import type { CommunityCard } from "@/api";
import { CardDetailModal } from "./CardDetailModal";
import { NATION_FLAGS } from "../lib/nations";
import { rarityColor } from "../lib/rarity";
import { RARITY_ORDER } from "../lib/rarity";

const PAGE = 60;
const API_BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");
const FRAMED_TIERS = new Set(["Legendary", "Mythic", "Icon", "Elite"]);

interface CardsPage {
  cards: CommunityCard[];
  totalIssued: number;
}

interface CollectionGalleryProps {
  open: boolean;
  onClose: () => void;
}

/** Tile — mirrors the community-wall sticker styling. */
function GalleryTile({ card, onOpen }: { card: CommunityCard; onOpen: () => void }) {
  const color = rarityColor(card.rarity);
  const framed = FRAMED_TIERS.has(card.rarity);
  const flagCode = NATION_FLAGS[card.nation];
  const hasActivity = card.voteScore !== 0 || card.commentCount > 0;
  return (
    <button
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden rounded-lg border bg-surface-1 text-left transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ borderColor: framed ? color : "hsl(var(--card-border))", borderWidth: framed ? "1.5px" : "1px" }}
      aria-label={`${card.name} - ${card.rarity} ${card.archetype}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-2">
            <span className="type-eyebrow text-[0.6rem] text-white/40">{card.archetype}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
        <div
          className="absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em]"
          style={{ color: "#0a0a0f", backgroundColor: color }}
        >
          {card.rarity}
        </div>
        {flagCode && (
          <img
            src={`https://flagcdn.com/w20/${flagCode}.png`}
            alt={card.nation}
            loading="lazy"
            className="absolute left-1.5 top-1.5 h-auto w-5 rounded-sm"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 p-1.5">
          <p className="truncate text-[10px] font-black uppercase leading-tight tracking-[0.02em] text-white">{card.name}</p>
          {card.editionNumber != null && (
            <p className="truncate font-mono text-[8px] text-white/50">#{card.editionNumber.toLocaleString()}</p>
          )}
        </div>
      </div>
      {hasActivity && (
        <div className="flex items-center gap-2 border-t border-card-border bg-surface-2 px-1.5 py-1">
          {card.voteScore !== 0 && (
            <span className={`flex items-center gap-0.5 text-[9px] font-black tabular-nums ${card.voteScore > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              <ThumbsUp className="h-2.5 w-2.5" />
              {card.voteScore > 0 ? `+${card.voteScore}` : card.voteScore}
            </span>
          )}
          {card.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-black tabular-nums text-muted-foreground">
              <MessageSquare className="h-2.5 w-2.5" />
              {card.commentCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

/** Full-screen gallery of every card minted so far, pulled from the database. */
export function CollectionGallery({ open, onClose }: CollectionGalleryProps) {
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<CommunityCard | null>(null);

  // Lock the page behind the full-screen gallery so there's only ONE scrollbar
  // (the gallery's) - not the gallery's plus the body's.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const q = useInfiniteQuery({
    queryKey: ["all-cards"],
    enabled: open,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`${API_BASE}/api/aura/cards?limit=${PAGE}&offset=${pageParam}`);
      if (!res.ok) throw new Error("Failed to load the collection.");
      return (await res.json()) as CardsPage;
    },
    getNextPageParam: (_last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.cards.length, 0);
      const total = pages[0]?.totalIssued ?? 0;
      return loaded < total ? loaded : undefined;
    },
  });

  const allCards = useMemo(() => q.data?.pages.flatMap((p) => p.cards) ?? [], [q.data]);
  const total = q.data?.pages[0]?.totalIssued ?? 0;
  const shown = filter === "All" ? allCards : allCards.filter((c) => c.rarity === filter);

  const filters = ["All", ...[...RARITY_ORDER].reverse()];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="collection-gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex flex-col bg-background"
          style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top))" }}
        >
          {/* Sub-header (sits under the persistent app navbar) */}
          <div className="shrink-0 border-b border-white/10 bg-background/80 backdrop-blur-md">
            <div className="mx-auto w-full max-w-6xl px-4 py-4">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Back to cards"
                data-testid="close-collection"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to cards
              </button>
              <div className="mt-3">
                <div className="flex items-center gap-2 type-eyebrow text-[0.66rem] text-primary">
                  <Layers className="h-3.5 w-3.5" />
                  The Collection
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[0.9] tracking-tight text-white sm:text-4xl">
                  Every <span className="gold-text-static">Aura Card</span>
                </h2>
                <p className="mt-2 font-condensed text-xs font-medium uppercase tracking-wide text-white/45">
                  {total.toLocaleString()} minted of 100,000
                </p>
              </div>
            </div>

            {/* Rarity filter chips */}
            <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filters.map((f) => {
                const active = filter === f;
                const color = f === "All" ? undefined : rarityColor(f);
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="shrink-0 rounded-md px-3 py-1.5 font-condensed text-xs font-semibold uppercase tracking-wide transition-colors"
                    style={
                      active
                        ? { background: color ?? "hsl(var(--primary))", color: "#0a0a0f" }
                        : { background: "hsl(var(--surface-2))", color: "rgba(255,255,255,0.55)" }
                    }
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid */}
          <div className="scroll-slim flex-1 overflow-y-auto px-4 py-5">
            <div className="mx-auto w-full max-w-6xl">
              {q.isLoading ? (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-white/5" />
                  ))}
                </div>
              ) : q.isError ? (
                <div className="py-20 text-center text-sm text-white/50">Couldn't load the collection. Try again.</div>
              ) : shown.length === 0 ? (
                <div className="py-20 text-center text-sm text-white/50">No {filter} cards yet.</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                    {shown.map((card) => (
                      <GalleryTile key={card.slug} card={card} onOpen={() => setSelected(card)} />
                    ))}
                  </div>

                  {/* Load more */}
                  <div className="mt-8 flex flex-col items-center gap-2 pb-8">
                    <p className="font-condensed text-xs uppercase tracking-wide text-white/35">
                      Showing {allCards.length.toLocaleString()} of {total.toLocaleString()}
                    </p>
                    {q.hasNextPage && (
                      <button
                        onClick={() => q.fetchNextPage()}
                        disabled={q.isFetchingNextPage}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface-2 px-6 font-condensed text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-surface-3 disabled:opacity-60"
                      >
                        {q.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                        Load more
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {selected && (
            <CardDetailModal card={selected} baseUrl={import.meta.env.BASE_URL} onClose={() => setSelected(null)} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
