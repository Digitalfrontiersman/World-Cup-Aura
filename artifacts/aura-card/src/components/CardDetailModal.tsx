import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";
import {
  useListCardComments,
  useVoteAuraCard,
  usePostCardComment,
} from "@workspace/api-client-react";
import type { CardComment, CommunityCard } from "@workspace/api-client-react";
import { NATION_FLAGS } from "../lib/nations";
import { rarityColor } from "../lib/rarity";

function getSessionId(): string {
  const key = "aura_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getStoredVote(slug: string): 1 | -1 | null {
  const raw = localStorage.getItem(`aura_vote_${slug}`);
  if (raw === "1") return 1;
  if (raw === "-1") return -1;
  return null;
}

function storeVote(slug: string, vote: 1 | -1): void {
  localStorage.setItem(`aura_vote_${slug}`, String(vote));
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface OptimisticComment extends CardComment {
  optimistic?: boolean;
}

interface CardDetailModalProps {
  card: CommunityCard;
  baseUrl: string;
  onClose: () => void;
}

export function CardDetailModal({ card, baseUrl, onClose }: CardDetailModalProps) {
  const cardRarityColor = rarityColor(card.rarity);
  const flagCode = NATION_FLAGS[card.nation];

  const [localVoteScore, setLocalVoteScore] = useState(card.voteScore);
  const [localUserVote, setLocalUserVote] = useState<1 | -1 | null>(() =>
    getStoredVote(card.slug),
  );

  const [comments, setComments] = useState<OptimisticComment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const { data: commentsData } = useListCardComments(card.slug, {
    query: { refetchInterval: 30_000 } as never,
  });

  useEffect(() => {
    if (commentsData?.comments) {
      setComments(commentsData.comments.filter((c) => !(c as OptimisticComment).optimistic));
    }
  }, [commentsData]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const voteMutation = useVoteAuraCard();

  const handleVote = useCallback(
    (v: 1 | -1) => {
      const prevScore = localVoteScore;
      const prevVote = localUserVote;

      let scoreDelta = v;
      if (prevVote !== null) {
        scoreDelta = v - prevVote;
      }
      setLocalVoteScore(localVoteScore + scoreDelta);
      setLocalUserVote(v);
      storeVote(card.slug, v);

      voteMutation.mutate(
        { slug: card.slug, data: { vote: v, sessionId: getSessionId() } },
        {
          onSuccess: (result) => {
            setLocalVoteScore(result.voteScore);
          },
          onError: () => {
            setLocalVoteScore(prevScore);
            setLocalUserVote(prevVote);
          },
        },
      );
    },
    [card.slug, localVoteScore, localUserVote, voteMutation],
  );

  const commentMutation = usePostCardComment();

  const handleSubmitComment = useCallback(async () => {
    const body = commentBody.trim();
    if (!body || isSubmitting) return;
    setIsSubmitting(true);

    const optimisticId = -Date.now();
    const optimistic: OptimisticComment = {
      id: optimisticId,
      displayName: commentName.trim() || "Anonymous",
      body,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setComments((prev) => [optimistic, ...prev]);
    setCommentBody("");

    commentMutation.mutate(
      {
        slug: card.slug,
        data: { displayName: commentName.trim() || undefined, body },
      },
      {
        onSuccess: (newComment) => {
          setComments((prev) =>
            prev.map((c) => (c.id === optimisticId ? { ...newComment } : c)),
          );
        },
        onError: () => {
          setComments((prev) => prev.filter((c) => c.id !== optimisticId));
          setCommentBody(body);
        },
        onSettled: () => setIsSubmitting(false),
      },
    );
  }, [card.slug, commentBody, commentName, commentMutation, isSubmitting]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          ref={panelRef}
          className="relative z-10 w-full max-w-md max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden bg-card border border-white/10"
          initial={{ y: "100%", scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: "100%", scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={(_e, info) => {
            if (info.offset.y > 80 || info.velocity.y > 500) {
              onClose();
            }
          }}
        >
          {/* Drag handle + close */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
            <div className="w-8 h-1 rounded-full bg-white/20 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
            <button
              onClick={onClose}
              className="ml-auto p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable body - stop pointer events from propagating to the drag layer */}
          <div
            className="overflow-y-auto flex-1 px-4 [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Card image */}
            <div className="flex justify-center mb-4">
              <div
                className="relative w-52 rounded-xl overflow-hidden"
                style={{
                  aspectRatio: "2/3",
                  border: `1.5px solid ${cardRarityColor}`,
                }}
              >
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, #0a0a0f 0%, ${cardRarityColor}33 100%)` }}
                  >
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-white/30">
                      {card.archetype}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Rarity tier chip — flat, meaningful color coding */}
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.08em]"
                  style={{
                    color: "#0a0a0f",
                    backgroundColor: cardRarityColor,
                  }}
                >
                  {card.rarity}
                </div>

                {flagCode && (
                  <img
                    src={`https://flagcdn.com/w20/${flagCode}.png`}
                    alt={card.nation}
                    className="absolute top-2 left-2 w-5 h-auto rounded-sm opacity-90"
                  />
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs font-black uppercase tracking-wide truncate">
                    {card.name}
                  </p>
                  <p className="text-[10px] font-mono text-gray-400">
                    {card.nation} · {card.archetype}
                  </p>
                  {card.editionNumber != null && (
                    <p className="text-[9px] font-mono text-gray-500">
                      #{card.editionNumber.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* View card page link + verified badge */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <a
                href={`${baseUrl}card/${card.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View card page
              </a>
              {card.vrfTxSig && (
                <a
                  href={`https://explorer.solana.com/tx/${card.vrfTxSig}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-emerald-500/80 hover:text-emerald-400 transition-colors font-bold"
                >
                  <BadgeCheck className="h-3 w-3" />
                  Verified on Solana
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              )}
            </div>

            {/* Vote buttons */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => handleVote(1)}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-lg border text-sm font-bold transition-all ${
                  localUserVote === 1
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                }`}
                aria-label="Thumbs up"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>

              <span
                className={`text-lg font-black tabular-nums min-w-[3ch] text-center ${
                  localVoteScore > 0
                    ? "text-emerald-400"
                    : localVoteScore < 0
                    ? "text-rose-400"
                    : "text-gray-400"
                }`}
              >
                {localVoteScore > 0 ? `+${localVoteScore}` : localVoteScore}
              </span>

              <button
                onClick={() => handleVote(-1)}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-lg border text-sm font-bold transition-all ${
                  localUserVote === -1
                    ? "bg-rose-500/20 border-rose-500 text-rose-400"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                }`}
                aria-label="Thumbs down"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>

            {/* Comments section */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="flex items-center gap-1.5 type-eyebrow text-[0.68rem] text-muted-foreground mb-4">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments
                {comments.length > 0 && (
                  <span className="ml-1 text-primary tabular-nums">{comments.length}</span>
                )}
              </h3>

              {/* Comment form */}
              <div className="mb-5 space-y-2">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value.slice(0, 50))}
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                />
                <div className="relative">
                  <textarea
                    placeholder="Add a comment…"
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value.slice(0, 280))}
                    maxLength={280}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-gray-600 pointer-events-none">
                    {commentBody.length}/280
                  </span>
                </div>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentBody.trim() || isSubmitting}
                  className="flex items-center gap-1.5 ml-auto px-4 py-1.5 rounded-lg bg-primary text-black text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-95"
                >
                  <Send className="h-3 w-3" />
                  Post
                </button>
              </div>

              {/* Comment list */}
              {comments.length === 0 ? (
                <p className="text-center text-xs text-gray-600 py-4">
                  No comments yet. Be the first!
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: c.optimistic ? 0.7 : 1, y: 0 }}
                      className="p-3 rounded-lg bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-white/80">
                          {c.displayName}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {formatRelativeTime(new Date(c.createdAt))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{c.body}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
