/**
 * use-quick-action.ts
 *
 * Per-card quick action state manager.
 *
 * Language-awareness design
 * ─────────────────────────
 * All generated content is language-specific, so the cache key is
 *   `${lang}:${action}`   e.g. "en:why_moving", "ko:risk_view"
 *
 * This means:
 *  - Each (lang × action) pair is cached independently.
 *  - Switching language never serves content from a previous language.
 *  - Switching back to a prior language re-uses the correct cached text.
 *
 * Panel reset on context change
 * ─────────────────────────────
 * When `lang` OR `symbol` changes, any open panel is immediately collapsed
 * via a ref-guarded useEffect.  This ensures no stale text lingers on screen
 * between a language switch and the new fetch completing.
 *
 * To swap to a real AI backend, only the insightProvider singleton changes.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { insightProvider } from "@/services/watchlist-insights";
import type { QuickActionType } from "@/services/watchlist-insights";
import type { Lang } from "@/lib/i18n";

export type QuickActionState = "idle" | "loading" | "done";

export interface UseQuickActionReturn {
  state:        QuickActionState;
  response:     string | null;
  activeAction: QuickActionType | null;
  trigger:      (action: QuickActionType) => void;
  clear:        () => void;
}

/**
 * Cache key format: "<lang>:<action>"
 * Examples: "en:why_moving", "ko:risk_view", "zh:market_read"
 *
 * Using a plain `string` type rather than a template-literal type keeps
 * the Record indexing simple and avoids TypeScript inference noise.
 */
type CacheKey = string;

function makeCacheKey(lang: Lang, action: QuickActionType): CacheKey {
  return `${lang}:${action}`;
}

export function useQuickAction(
  symbol:    string,
  lang:      Lang,
  isProUser: boolean,
): UseQuickActionReturn {
  const [state,        setState]        = useState<QuickActionState>("idle");
  const [response,     setResponse]     = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<QuickActionType | null>(null);

  /**
   * Cross-language cache: keyed by `${lang}:${action}` so that content
   * for different languages is stored and served separately.
   *
   * This cache intentionally persists across language switches so that
   * switching back to a previous language serves the correct cached text
   * immediately without a redundant fetch.
   */
  const [cache, setCache] = useState<Record<CacheKey, string>>({});

  /**
   * Panel reset guard.
   *
   * Whenever the context changes — either the target symbol or the active
   * language — close the panel immediately.  We use a ref to track the
   * previous context so the effect only fires on genuine changes, not on
   * every render.
   */
  const prevContextRef = useRef<string>(`${symbol}:${lang}`);

  useEffect(() => {
    const next = `${symbol}:${lang}`;
    if (prevContextRef.current !== next) {
      prevContextRef.current = next;
      setState("idle");
      setActiveAction(null);
      setResponse(null);
    }
  }, [symbol, lang]);

  const trigger = useCallback(async (action: QuickActionType) => {
    // Toggle semantics: clicking the active button again collapses the panel.
    if (activeAction === action && state !== "loading") {
      setState("idle");
      setActiveAction(null);
      setResponse(null);
      return;
    }

    setActiveAction(action);

    // Serve from cache if this (lang × action) pair was already fetched.
    const cacheKey = makeCacheKey(lang, action);
    const cached = cache[cacheKey];
    if (cached) {
      setState("done");
      setResponse(cached);
      return;
    }

    setState("loading");
    setResponse(null);

    try {
      const result = await insightProvider.getQuickAction(symbol, action, lang, isProUser);
      setResponse(result);
      // Store under the lang-qualified key.
      setCache(prev => ({ ...prev, [cacheKey]: result }));
      setState("done");
    } catch {
      setState("idle");
      setActiveAction(null);
    }
  }, [symbol, lang, isProUser, activeAction, state, cache]);

  const clear = useCallback(() => {
    setState("idle");
    setActiveAction(null);
    setResponse(null);
  }, []);

  return { state, response, activeAction, trigger, clear };
}
