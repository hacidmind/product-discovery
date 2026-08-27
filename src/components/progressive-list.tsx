"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Spinner } from "@/components/ui";

interface ProgressiveListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  initialCount?: number;
  chunkSize?: number;
  scrollRef?: RefObject<HTMLElement | null>;
  keyOf?: (item: T) => string;
}

const PREFETCH_MARGIN = 300;

export default function ProgressiveList<T>({
  items,
  renderItem,
  className = "",
  initialCount = 30,
  chunkSize = 30,
  scrollRef,
  keyOf,
}: ProgressiveListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < items.length;

  const getKey = keyOf ?? ((item: T) => String((item as { id?: string }).id ?? ""));
  const signature = `${items.length}:${items.length > 0 ? getKey(items[0]) : ""}`;
  const prevSignature = useRef(signature);
  useEffect(() => {
    if (prevSignature.current !== signature) {
      prevSignature.current = signature;
      setVisibleCount(initialCount);
    }
  }, [signature, initialCount]);

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + chunkSize, items.length));
  }, [chunkSize, items.length]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { root: scrollRef?.current ?? null, rootMargin: `${PREFETCH_MARGIN}px 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, scrollRef]);

  useEffect(() => {
    if (!hasMore || typeof window === "undefined") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const rootEl = scrollRef?.current ?? null;
    const rootRect = rootEl
      ? rootEl.getBoundingClientRect()
      : { top: 0, bottom: window.innerHeight };
    const rect = sentinel.getBoundingClientRect();
    if (rect.top <= rootRect.bottom + PREFETCH_MARGIN && rect.bottom >= rootRect.top - PREFETCH_MARGIN) {
      const timer = setTimeout(loadMore, 120);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, hasMore, loadMore, scrollRef]);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.slice(0, visibleCount).map((item, index) => renderItem(item, index))}
      {hasMore && (
        <div ref={sentinelRef} className="col-span-full flex justify-center py-2">
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Spinner size={12} />
            Showing {visibleCount} of {items.length} · Load more
          </button>
        </div>
      )}
    </div>
  );
}
