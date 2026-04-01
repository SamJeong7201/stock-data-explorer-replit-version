/**
 * watchlist-storage.ts
 *
 * Storage adapter for the user's personal watchlist.
 *
 * Architecture:
 *  - `WatchlistStorage` is a pure interface — no UI / React dependency.
 *  - `LocalWatchlistStorage` is the current implementation (localStorage).
 *  - To switch to a real backend, implement `ApiWatchlistStorage` and swap the
 *    exported `watchlistStorage` singleton.  Zero changes needed in hooks or UI.
 *
 * Future replacement:
 *   export const watchlistStorage = new ApiWatchlistStorage(authToken);
 */

// ─────────────────────────────────────────────────────────────────────────────
// Domain model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single item in the user's watchlist.
 * Fields are deliberately future-ready for account-backed storage.
 */
export interface WatchlistItem {
  symbol:      string;              // Canonical ticker symbol e.g. "AAPL", "005930.KS"
  displayName: string;              // Short label e.g. "Apple" or the symbol itself
  market:      "US" | "KR" | "HK" | "OTHER";
  addedAt:     string;              // ISO-8601 timestamp
  sortOrder:   number;              // Lower = first in list
}

/**
 * Input shape for adding an item.
 * `addedAt` and `sortOrder` are optional and will be derived if omitted.
 */
export type WatchlistItemInput = Omit<WatchlistItem, "addedAt" | "sortOrder"> &
  Partial<Pick<WatchlistItem, "addedAt" | "sortOrder">>;

// ─────────────────────────────────────────────────────────────────────────────
// Adapter interface  ← the only surface that hooks / UI depend on
// ─────────────────────────────────────────────────────────────────────────────

export interface WatchlistStorage {
  /** Return items sorted by `sortOrder` ascending. */
  getItems():                          Promise<WatchlistItem[]>;

  /** Add an item; silently ignores duplicates by symbol. */
  addItem(item: WatchlistItemInput):   Promise<void>;

  /** Remove by symbol. No-op if not found. */
  removeItem(symbol: string):          Promise<void>;

  /**
   * Persist a new sort order.
   * `symbols` is the ordered list of symbols after drag-and-drop.
   */
  reorderItems(symbols: string[]):     Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LocalWatchlistStorage — current implementation
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "omni_watchlist_v1";

export class LocalWatchlistStorage implements WatchlistStorage {
  private read(): WatchlistItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WatchlistItem[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: WatchlistItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async getItems(): Promise<WatchlistItem[]> {
    return this.read().sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async addItem(input: WatchlistItemInput): Promise<void> {
    const items = this.read();
    if (items.some(i => i.symbol === input.symbol)) return; // no duplicates
    const item: WatchlistItem = {
      ...input,
      addedAt:   input.addedAt   ?? new Date().toISOString(),
      sortOrder: input.sortOrder ?? items.length,
    };
    this.write([...items, item]);
  }

  async removeItem(symbol: string): Promise<void> {
    const items = this.read().filter(i => i.symbol !== symbol);
    // Re-normalise sortOrder so there are no gaps
    this.write(items.map((item, idx) => ({ ...item, sortOrder: idx })));
  }

  async reorderItems(symbols: string[]): Promise<void> {
    const map = new Map(this.read().map(i => [i.symbol, i]));
    const reordered: WatchlistItem[] = symbols
      .map((sym, idx) => {
        const item = map.get(sym);
        return item ? { ...item, sortOrder: idx } : null;
      })
      .filter((i): i is WatchlistItem => i !== null);
    this.write(reordered);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton — swap this line when connecting a real backend
// ─────────────────────────────────────────────────────────────────────────────

export const watchlistStorage: WatchlistStorage = new LocalWatchlistStorage();
