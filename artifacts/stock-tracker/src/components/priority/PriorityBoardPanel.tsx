/**
 * PriorityBoardPanel
 *
 * The main Priority Board page view — rendered when the user selects the
 * "Priority Board" tab in the navigation.
 *
 * Data flow:
 *   - Items     → useWatchlist   (storage adapter, swappable)
 *   - Insights  → useWatchlistInsights (insight adapter, swappable)
 *   - Each item is classified into one of 4 sections via classifyInsight()
 *   - Empty sections are automatically hidden
 *
 * Architecture:
 *   - All text is i18n via PREMIUM_UI[lang].priority
 *   - All Premium gating via isProUser from useSubscription
 *   - Zero hardcoded strings, zero hardcoded layout assumptions
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useWatchlistInsights } from "@/hooks/use-watchlist-insights";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLang } from "@/contexts/LangContext";
import { PREMIUM_UI } from "@/lib/premium-i18n";
import { classifyInsight } from "@/services/watchlist-insights";
import type { SectionId } from "@/services/watchlist-insights";
import type { Lang } from "@/lib/i18n";
import { PriorityAddBar } from "./PriorityAddBar";
import { PrioritySection } from "./PrioritySection";
import { PortfolioIntelligenceCard } from "./PortfolioIntelligenceCard";

const SECTION_ORDER: SectionId[] = ["priority", "risk", "momentum", "quiet"];

interface PriorityBoardPanelProps {
  onSelectTicker: (symbol: string) => void;
  lang?:          Lang;
}

export function PriorityBoardPanel({ onSelectTicker, lang }: PriorityBoardPanelProps) {
  const { isProUser, openUpgradeModal } = useSubscription();
  const { lang: ctxLang } = useLang();
  const effectiveLang = lang ?? ctxLang;
  const s = PREMIUM_UI[effectiveLang].priority;

  const { items, loading: wLoading, limitReached, addItem, removeItem } = useWatchlist(isProUser);
  const symbols = items.map(i => i.symbol);
  const { insights, portfolioInsight, loading: iLoading, refresh } = useWatchlistInsights(symbols, effectiveLang);

  // Classify each symbol into a section
  const sectionMap = useMemo<Record<SectionId, string[]>>(() => {
    const map: Record<SectionId, string[]> = {
      priority: [], risk: [], momentum: [], quiet: [],
    };
    for (const sym of symbols) {
      const insight = insights.get(sym);
      if (insight) {
        map[classifyInsight(insight)].push(sym);
      } else {
        map.quiet.push(sym);
      }
    }
    return map;
  }, [symbols, insights]);

  const isEmpty = !wLoading && items.length === 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-5 py-5 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(58,160,255,0.1)", border: "1px solid rgba(58,160,255,0.2)" }}
            >
              <LayoutDashboard className="w-4.5 h-4.5" style={{ color: "#3AA0FF" }} />
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-white leading-none">{s.title}</h1>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                {items.length > 0
                  ? `${items.length} ${items.length === 1 ? "ticker" : "tickers"}${!isProUser ? ` · ${items.length}/5 free` : ""}`
                  : s.subtitle
                }
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={refresh}
              disabled={iLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.35)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <RefreshCw className={`w-3 h-3 ${iLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>

        {/* ── Add bar ── */}
        <PriorityAddBar
          onAdd={addItem}
          limitReached={limitReached}
          isProUser={isProUser}
          onUpgrade={openUpgradeModal}
          strings={s}
        />

        {/* ── Loading skeletons ── */}
        {wLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
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
              className="flex flex-col items-center justify-center text-center py-20 px-6"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(58,160,255,0.08)", border: "1px solid rgba(58,160,255,0.15)" }}
              >
                <LayoutDashboard className="w-7 h-7" style={{ color: "rgba(58,160,255,0.5)" }} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{s.empty.heading}</h3>
              <p className="text-sm max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                {s.empty.sub}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Sections ── */}
        {!wLoading && items.length > 0 && (
          <div className="space-y-8">
            {SECTION_ORDER.map(sectionId => (
              <PrioritySection
                key={sectionId}
                sectionId={sectionId}
                symbols={sectionMap[sectionId]}
                insights={insights}
                isProUser={isProUser}
                lang={effectiveLang}
                onRemove={removeItem}
                onSelect={onSelectTicker}
                onUpgrade={openUpgradeModal}
                strings={s}
              />
            ))}
          </div>
        )}

        {/* ── Portfolio Intelligence (Pro-gated) ── */}
        {!wLoading && items.length > 0 && (
          <PortfolioIntelligenceCard
            insight={portfolioInsight}
            loading={iLoading}
            isProUser={isProUser}
            onUpgrade={openUpgradeModal}
            strings={s}
          />
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
