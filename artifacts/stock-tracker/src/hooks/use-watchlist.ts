/**
 * use-watchlist.ts
 *
 * React hook that exposes the user's watchlist through the WatchlistStorage adapter.
 *
 * Rules:
 *  - All storage I/O goes through `watchlistStorage` — never imported directly
 *    from localStorage or any backend client.
 *  - Provides optimistic UI: local state is updated immediately; storage is
 *    synced async in the background.
 *  - To swap to an API-backed storage layer, replace the `watchlistStorage`
 *    singleton in `services/watchlist-storage.ts`. This hook needs no changes.
 */

import { useState, useEffect, useCallback } from "react";
import { watchlistStorage } from "@/services/watchlist-storage";
import type { WatchlistItem, WatchlistItemInput } from "@/services/watchlist-storage";
import { FREE_WATCHLIST_LIMIT } from "@/lib/subscription";

export interface UseWatchlistReturn {
  items:        WatchlistItem[];
  loading:      boolean;
  /** True when the free limit has been reached and the user is not Pro. */
  limitReached: boolean;
  addItem:      (input: WatchlistItemInput) => Promise<{ ok: boolean; reason?: "duplicate" | "limit" }>;
  removeItem:   (symbol: string) => Promise<void>;
  /** Whether a symbol is already saved. */
  has:          (symbol: string) => boolean;
}

export function useWatchlist(isProUser: boolean): UseWatchlistReturn {
  const [items,   setItems]   = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const latest = await watchlistStorage.getItems();
    setItems(latest);
  }, []);

  // Load on mount
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const has = useCallback(
    (symbol: string) => items.some(i => i.symbol === symbol),
    [items],
  );

  const addItem = useCallback(async (
    input: WatchlistItemInput,
  ): Promise<{ ok: boolean; reason?: "duplicate" | "limit" }> => {
    if (has(input.symbol)) return { ok: false, reason: "duplicate" };
    if (!isProUser && items.length >= FREE_WATCHLIST_LIMIT) {
      return { ok: false, reason: "limit" };
    }
    // Optimistic update
    const optimistic: WatchlistItem = {
      ...input,
      addedAt:   input.addedAt   ?? new Date().toISOString(),
      sortOrder: input.sortOrder ?? items.length,
    };
    setItems(prev => [...prev, optimistic]);
    await watchlistStorage.addItem(input);
    await refresh();
    return { ok: true };
  }, [has, isProUser, items.length, refresh]);

  const removeItem = useCallback(async (symbol: string) => {
    // Optimistic update
    setItems(prev => prev.filter(i => i.symbol !== symbol));
    await watchlistStorage.removeItem(symbol);
    await refresh();
  }, [refresh]);

  const limitReached = !isProUser && items.length >= FREE_WATCHLIST_LIMIT;

  return { items, loading, limitReached, addItem, removeItem, has };
}
