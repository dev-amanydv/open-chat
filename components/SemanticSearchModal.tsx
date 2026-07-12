"use client";

import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

type SearchHit = {
  id: string;
  content: string;
  senderName: string;
  chatLabel: string;
  href: string;
  createdAt: number;
  score: number;
};

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function SemanticSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const search = useAction(api.search.semanticSearch);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    setQuery("");
    setResults([]);
    setError(null);
    setHasSearched(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }
      const seq = ++requestSeq.current;
      setLoading(true);
      setError(null);
      try {
        const hits = await search({ query: trimmed });
        if (seq !== requestSeq.current) return;
        setResults(hits);
        setHasSearched(true);
      } catch (err) {
        if (seq !== requestSeq.current) return;
        setError(
          err instanceof Error ? err.message : "Search failed. Try again.",
        );
        setResults([]);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(handle);
  }, [query, open, runSearch]);

  const openHit = (hit: SearchHit) => {
    onClose();
    router.push(hit.href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="oc-panel w-full max-w-xl overflow-hidden bg-surface-1 shadow-[var(--shadow-pop)] semantic-search-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 border-b border-line">
          <CiSearch className="size-5 flex-none text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your messages by meaning…"
            className="w-full bg-transparent py-4 text-[15px] text-ink focus:outline-0 placeholder:text-ink-faint"
          />
          <kbd className="hidden sm:block flex-none text-[11px] font-mono text-ink-faint border border-line rounded-md px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto oc-scroll">
          {loading && (
            <div className="px-4 py-6 text-sm text-ink-faint flex items-center gap-2.5">
              <span className="agent-tool-spin size-4 rounded-full border-2 border-line border-t-accent" />
              Searching by meaning…
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-6 text-sm text-red-500">{error}</div>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="px-4 py-6 text-sm text-ink-faint">
              No related messages found.
            </div>
          )}

          {!loading && !error && !hasSearched && query.trim() === "" && (
            <div className="px-4 py-9 text-center">
              <div className="oc-glow relative size-11 mx-auto mb-3 rounded-2xl bg-accent-soft grid place-items-center">
                <HiOutlineMagnifyingGlass className="size-5 text-accent" />
              </div>
              <p className="text-sm text-ink-muted">
                Find messages by what they mean, not just exact words.
              </p>
              <p className="text-xs text-ink-faint mt-1">
                Try “the invoice deadline” or “where should we meet”.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            results.map((hit) => (
              <button
                key={hit.id}
                onClick={() => openHit(hit)}
                className="w-full text-left px-4 py-3 flex flex-col gap-1 hover:bg-surface-3 border-b border-line last:border-0 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink truncate">
                    {hit.chatLabel}
                  </span>
                  <span className="flex-none flex items-center gap-2">
                    <span className="text-[11px] text-ink-faint font-mono-num">
                      {relativeTime(hit.createdAt)}
                    </span>
                    <span
                      className="text-[10px] font-medium text-accent bg-accent-soft rounded px-1.5 py-0.5 font-mono-num"
                      title="Semantic relevance"
                    >
                      {Math.round(hit.score * 100)}% match
                    </span>
                  </span>
                </div>
                <p className="text-[13px] text-ink-muted line-clamp-2">
                  <span className="text-ink-faint">{hit.senderName}: </span>
                  {hit.content}
                </p>
              </button>
            ))}
        </div>

        <div className="flex items-center gap-1.5 px-4 py-2.5 border-t border-line text-[11px] text-ink-faint font-mono">
          <HiOutlineMagnifyingGlass className="size-3.5" />
          semantic search
        </div>
      </div>
    </div>
  );
}
