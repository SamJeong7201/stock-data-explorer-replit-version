/**
 * WatchlistInsightCard
 *
 * Per-ticker card showing real price data + watchlist insight.
 *
 * - Real price/change comes from useStock (independent API call, React Query cached).
 * - Insight comes from the insights Map passed from the parent (fetched via InsightProvider).
 * - Free users see: signal badge + 1-line teaser + upgrade CTA.
 * - Pro users see: signal + strength + full summary + drivers + news pulse + risk flag.
 */

import { Trash2, TrendingUp, TrendingDown, Minus, Newspaper, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useStock } from "@/hooks/use-stock";
import { getCurrencySymbol, isWholeCurrency } from "@/lib/format";
import type { StockInsight } from "@/services/watchlist-insights";
import type { WatchlistUIStrings } from "@/lib/premium-i18n";

const SIGNAL_COLOR = {
  bullish: "#00FF9C",
  bearish: "#FF4D4D",
  neutral: "rgba(255,255,255,0.4)",
} as const;

const PULSE_COLOR = {
  hot:   "#f59e0b",
  mixed: "#3AA0FF",
  quiet: "rgba(255,255,255,0.3)",
} as const;

interface WatchlistInsightCardProps {
  symbol:     string;
  insight:    StockInsight | undefined;
  isProUser:  boolean;
  onRemove:   (symbol: string) => void;
  onSelect:   (symbol: string) => void;
  onUpgrade:  () => void;
  strings:    WatchlistUIStrings;
  index:      number;
}

export function WatchlistInsightCard({
  symbol, insight, isProUser, onRemove, onSelect, onUpgrade, strings: s, index,
}: WatchlistInsightCardProps) {
  const { data, isLoading } = useStock(symbol);

  const isPositive  = data ? data.change >= 0 : true;
  const currency    = data?.currency ?? "USD";
  const sym         = getCurrencySymbol(currency);
  const whole       = isWholeCurrency(currency);
  const price       = data
    ? `${sym}${data.currentPrice.toLocaleString(undefined, { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`
    : "—";
  const change      = data
    ? `${data.change >= 0 ? "+" : ""}${data.change.toFixed(2)} (${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%)`
    : "";

  const signalColor = insight ? SIGNAL_COLOR[insight.signal] : "rgba(255,255,255,0.2)";
  const signalLabel = insight ? s.signal[insight.signal] : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 gap-3">
        {/* Left: ticker + company + signal */}
        <button
          onClick={() => onSelect(symbol)}
          className="flex-1 text-left min-w-0 group"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="font-mono text-sm font-black group-hover:underline transition-all"
              style={{ color: "#3AA0FF" }}
            >
              {symbol}
            </span>

            {/* Signal badge */}
            {insight && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{
                  background: `${signalColor}14`,
                  border: `1px solid ${signalColor}30`,
                  color: signalColor,
                }}
              >
                {insight.signal === "bullish"
                  ? <TrendingUp className="w-2.5 h-2.5" />
                  : insight.signal === "bearish"
                  ? <TrendingDown className="w-2.5 h-2.5" />
                  : <Minus className="w-2.5 h-2.5" />
                }
                {signalLabel}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="h-3 w-28 rounded animate-pulse mt-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          ) : (
            <span className="text-[11px] truncate block" style={{ color: "rgba(255,255,255,0.35)" }}>
              {data?.companyName ?? symbol}
            </span>
          )}
        </button>

        {/* Right: price + change + remove */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {isLoading ? (
            <>
              <div className="h-4 w-20 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-3 w-16 rounded animate-pulse mt-1" style={{ background: "rgba(255,255,255,0.05)" }} />
            </>
          ) : (
            <>
              <span className="text-sm font-bold text-white font-mono">{price}</span>
              {data && (
                <span className="text-[11px] font-mono" style={{ color: isPositive ? "#00FF9C" : "#FF4D4D" }}>
                  {change}
                </span>
              )}
            </>
          )}
          <button
            onClick={e => { e.stopPropagation(); onRemove(symbol); }}
            className="mt-1.5 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:opacity-100"
            title={s.remove}
            style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#FF4D4D")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Signal strength bar (Pro shows fully; Free shows dimmed) ── */}
      {insight && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <div
                key={i}
                className="h-1 w-4 rounded-full"
                style={{
                  background: i <= insight.signalStrength
                    ? signalColor
                    : "rgba(255,255,255,0.08)",
                  opacity: !isProUser && i > 2 ? 0.25 : 1,
                }}
              />
            ))}
          </div>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            {s.strength(insight.signalStrength)}
          </span>
        </div>
      )}

      {/* ── Insight body ── */}
      <div
        className="px-4 pb-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        {!insight ? (
          /* Loading placeholder */
          <div className="pt-3 space-y-1.5">
            {[100, 85, 60].map(w => (
              <div
                key={w}
                className="h-2.5 rounded animate-pulse"
                style={{ background: "rgba(255,255,255,0.05)", width: `${w}%` }}
              />
            ))}
          </div>
        ) : !isProUser ? (
          /* ── FREE: teaser + upgrade CTA ── */
          <div className="pt-3">
            <p className="text-xs leading-relaxed mb-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              {insight.teaser}
            </p>
            <button
              onClick={onUpgrade}
              className="text-[10px] font-bold transition-all hover:opacity-80"
              style={{ color: "#f59e0b" }}
            >
              {s.proInsightCta}
            </button>
          </div>
        ) : (
          /* ── PRO: full insight ── */
          <div className="pt-3 space-y-3">
            {/* Summary */}
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
              {insight.summary}
            </p>

            {/* Drivers */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.22)" }}>
                {s.drivers}
              </p>
              <ul className="space-y-1.5">
                {insight.drivers.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono text-[9px] font-black mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.18)" }}>
                      {String(i+1).padStart(2,"0")}
                    </span>
                    <span className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Badges row: news pulse + risk flag */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{
                  background: `${PULSE_COLOR[insight.newsPulse]}14`,
                  border: `1px solid ${PULSE_COLOR[insight.newsPulse]}25`,
                  color: PULSE_COLOR[insight.newsPulse],
                }}
              >
                <Newspaper className="w-3 h-3" />
                {s.newsPulse.label}: {s.newsPulse[insight.newsPulse]}
              </div>

              {insight.riskFlag && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{
                    background: "rgba(255,77,77,0.08)",
                    border: "1px solid rgba(255,77,77,0.15)",
                    color: "#FF4D4D",
                  }}
                >
                  <ShieldAlert className="w-3 h-3" />
                  {s.riskFlag}: {insight.riskFlag}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
