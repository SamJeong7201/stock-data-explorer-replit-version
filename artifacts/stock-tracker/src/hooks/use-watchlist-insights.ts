/**
 * use-watchlist-insights.ts
 *
 * React hook that fetches insights for a list of symbols via the InsightProvider adapter.
 *
 * Language-awareness design
 * ─────────────────────────
 * All insight content (teaser, summary, drivers, portfolio read) is language-
 * specific because `getBatchInsights` and `getPortfolioInsight` both accept
 * `lang` and return native-language text.
 *
 * When `lang` changes:
 *  1. The current insights map is cleared immediately so no stale content
 *     from the previous language is visible while the new fetch is in flight.
 *  2. `loading` is set to `true` so callers render a skeleton.
 *  3. A new `getBatchInsights(symbols, lang)` call is issued.
 *  4. On completion, both `insights` and `portfolioInsight` are replaced with
 *     content in the new language.
 *
 * This pattern works for any number of languages — there are no hardcoded
 * language conditions here.  Adding a new `Lang` value requires no changes
 * to this hook.
 *
 * To swap to a real AI backend, replace the `insightProvider` singleton in
 * `services/watchlist-insights.ts`. This hook needs no changes.
 */

import { useState, useEffect, useMemo } from "react";
import { insightProvider } from "@/services/watchlist-insights";
import type { StockInsight, PortfolioInsight } from "@/services/watchlist-insights";
import type { Lang } from "@/lib/i18n";

export interface UseWatchlistInsightsReturn {
  /** Map from symbol → StockInsight (always in the current `lang`) */
  insights:         Map<string, StockInsight>;
  portfolioInsight: PortfolioInsight | null;
  loading:          boolean;
  /** Re-run the fetch manually (e.g. after a "Refresh" button click) */
  refresh:          () => void;
}

export function useWatchlistInsights(symbols: string[], lang: Lang): UseWatchlistInsightsReturn {
  const [insights,         setInsights]         = useState<Map<string, StockInsight>>(new Map());
  const [portfolioInsight, setPortfolioInsight] = useState<PortfolioInsight | null>(null);
  const [loading,          setLoading]          = useState(false);
  const [tick,             setTick]             = useState(0);

  // Stable key: sorted + joined — prevents spurious re-fetches when the
  // symbols array reference changes but the content is the same.
  const symbolKey = useMemo(() => [...symbols].sort().join(","), [symbols]);

  useEffect(() => {
    if (symbols.length === 0) {
      setInsights(new Map());
      setPortfolioInsight(null);
      setLoading(false);
      return;
    }

    /**
     * Clear stale content immediately so the UI never shows a mix of
     * old-language teaser/summary/drivers with new-language UI strings.
     * Callers that render based on `insights.size > 0` will enter a loading
     * state naturally.
     */
    setInsights(new Map());
    setPortfolioInsight(null);
    setLoading(true);

    let cancelled = false;

    insightProvider
      .getBatchInsights(symbols, lang)
      .then(map => {
        if (cancelled) return;
        setInsights(map);
        const portfolio = insightProvider.getPortfolioInsight(
          Array.from(map.values()),
          lang,
        );
        setPortfolioInsight(portfolio);
      })
      .catch(() => {
        // Silently swallow errors — callers rely on the loading flag,
        // not on thrown exceptions.
        if (!cancelled) {
          setInsights(new Map());
          setPortfolioInsight(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };

  // symbolKey and lang are the authoritative dependencies:
  //   symbolKey — fires when the watched symbol list changes
  //   lang      — fires when the user changes language; triggers a full
  //               re-fetch in the new language
  //   tick      — fires when the user clicks the manual Refresh button
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolKey, lang, tick]);

  const refresh = () => setTick(t => t + 1);

  return { insights, portfolioInsight, loading, refresh };
}
