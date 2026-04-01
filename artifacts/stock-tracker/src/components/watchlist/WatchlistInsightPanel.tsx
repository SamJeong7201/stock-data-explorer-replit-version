/**
 * WatchlistInsightPanel
 *
 * The main Watchlist view — rendered when the user clicks the "Watchlist" tab.
 *
 * Layout:
 *   - Header: title + item count
 *   - WatchlistAddBar
 *   - Empty state OR list of WatchlistInsightCards
 *   - WatchlistPortfolioSummary (Pro-gated, bottom)
 *
 * Data flow:
 *   - Watchlist items come from useWatchlist (storage adapter)
 *   - Insights come from useWatchlistInsights (insight adapter)
 *   - Both adapters can be replaced without touching this component
 */

import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, RefreshCw } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useWatchlistInsights } from "@/hooks/use-watchlist-insights";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLang } from "@/contexts/LangContext";
import { PREMIUM_UI } from "@/lib/premium-i18n";
import { WatchlistAddBar } from "./WatchlistAddBar";
import { WatchlistInsightCard } from "./WatchlistInsightCard";
import { WatchlistPortfolioSummary } from "./WatchlistPortfolioSummary";
import type { Lang } from "@/lib/i18n";

interface WatchlistInsightPanelProps {
  onSelectTicker: (symbol: string) => void;
  lang:           Lang;
}

export function WatchlistInsightPanel({ onSelectTicker, lang }: WatchlistInsightPanelProps) {
  const { isProUser, openUpgradeModal } = useSubscription();
  const { lang: ctxLang } = useLang();
  const effectiveLang = lang ?? ctxLang;
  const s = PREMIUM_UI[effectiveLang].priority;

  const {
    items, loading: wLoading, limitReached, addItem, removeItem,
  } = useWatchlist(isProUser);

  const symbols = items.map(i => i.symbol);

  const {
    insights, portfolioInsight, loading: iLoading, refresh,
  } = useWatchlistInsights(symbols, effectiveLang);

  const isEmpty = !wLoading && items.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[860px] mx-auto px-5 py-5 space-y-5">

        {/* ── Panel header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(58,160,255,0.1)", border: "1px solid rgba(58,160,255,0.2)" }}
            >
              <BookMarked className="w-4 h-4" style={{ color: "#3AA0FF" }} />
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-white leading-none">{s.title}</h1>
              {items.length > 0 && (
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {items.length} {items.length === 1 ? "ticker" : "tickers"}
                  {!isProUser && ` · ${items.length}/5 free`}
                </p>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={refresh}
              disabled={iLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <RefreshCw className={`w-3 h-3 ${iLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>

        {/* ── Add bar ── */}
        <WatchlistAddBar
          onAdd={addItem}
          limitReached={limitReached}
          isProUser={isProUser}
          onUpgrade={openUpgradeModal}
          strings={s}
        />

        {/* ── Loading skeleton ── */}
        {wLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "#121821" }} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        <AnimatePresence>
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-16 px-6"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(58,160,255,0.08)", border: "1px solid rgba(58,160,255,0.15)" }}
              >
                <BookMarked className="w-7 h-7" style={{ color: "rgba(58,160,255,0.5)" }} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{s.empty.heading}</h3>
              <p className="text-sm max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                {s.empty.sub}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Watchlist cards ── */}
        {!wLoading && items.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, idx) => (
                <WatchlistInsightCard
                  key={item.symbol}
                  symbol={item.symbol}
                  insight={insights.get(item.symbol)}
                  isProUser={isProUser}
                  onRemove={removeItem}
                  onSelect={sym => onSelectTicker(sym)}
                  onUpgrade={openUpgradeModal}
                  strings={s}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Portfolio summary (Pro-gated) ── */}
        {!wLoading && items.length > 0 && (
          <WatchlistPortfolioSummary
            insight={portfolioInsight}
            loading={iLoading}
            isProUser={isProUser}
            onUpgrade={openUpgradeModal}
            strings={s}
          />
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
