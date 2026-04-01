/**
 * PriorityCard
 *
 * Per-ticker card on the Priority Board.
 *
 * Layout:
 *   Top row   — signal badge · ticker · company name · price · change · remove (subtle)
 *   Teaser    — 1 high-signal line (the most important product element on the card)
 *   Actions   — QuickActionBar (4 buttons)
 *   Expansion — QuickActionPanel (inline response, animates open/closed)
 *   Pro only  — full summary + drivers beneath the quick actions
 *
 * Design principles:
 *   - Remove button is opacity-0 by default; appears on hover for a clean look.
 *   - Teaser is deliberately prominent: larger than the metadata above it.
 *   - Quick actions use toggle semantics: click active button to collapse.
 */

import { Trash2, TrendingUp, TrendingDown, Minus, Newspaper, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useStock } from "@/hooks/use-stock";
import { useQuickAction } from "@/hooks/use-quick-action";
import { getCurrencySymbol, isWholeCurrency } from "@/lib/format";
import type { StockInsight } from "@/services/watchlist-insights";
import type { PriorityBoardStrings } from "@/lib/premium-i18n";
import type { Lang } from "@/lib/i18n";
import { QuickActionBar } from "./QuickActionBar";
import { QuickActionPanel } from "./QuickActionPanel";

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

interface PriorityCardProps {
  symbol:    string;
  insight:   StockInsight | undefined;
  isProUser: boolean;
  lang:      Lang;
  onRemove:  (symbol: string) => void;
  onSelect:  (symbol: string) => void;
  onUpgrade: () => void;
  strings:   PriorityBoardStrings;
  index:     number;
}

export function PriorityCard({
  symbol, insight, isProUser, lang, onRemove, onSelect, onUpgrade, strings: s, index,
}: PriorityCardProps) {
  const { data, isLoading } = useStock(symbol);
  const qa = useQuickAction(symbol, lang, isProUser);

  const isPositive = data ? data.change >= 0 : true;
  const currency   = data?.currency ?? "USD";
  const sym        = getCurrencySymbol(currency);
  const whole      = isWholeCurrency(currency);
  const price      = data
    ? `${sym}${data.currentPrice.toLocaleString(undefined, {
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2,
      })}`
    : "—";
  const change = data
    ? `${data.change >= 0 ? "+" : ""}${data.change.toFixed(2)} (${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%)`
    : "";

  const signalColor = insight ? SIGNAL_COLOR[insight.signal] : "rgba(255,255,255,0.2)";
  const signalLabel = insight ? s.signal[insight.signal] : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="group rounded-2xl overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── Top row: ticker / signal / price / remove ── */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">

        {/* Left: signal badge + ticker + company */}
        <button
          onClick={() => onSelect(symbol)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2 mb-1">
            {/* Signal badge */}
            {insight ? (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0"
                style={{
                  background: `${signalColor}14`,
                  border: `1px solid ${signalColor}28`,
                  color: signalColor,
                }}
              >
                {insight.signal === "bullish"
                  ? <TrendingUp  className="w-2.5 h-2.5" />
                  : insight.signal === "bearish"
                  ? <TrendingDown className="w-2.5 h-2.5" />
                  : <Minus className="w-2.5 h-2.5" />
                }
                {signalLabel}
              </span>
            ) : (
              <span
                className="h-4 w-14 rounded-full animate-pulse shrink-0"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            )}

            {/* Ticker */}
            <span
              className="font-mono text-sm font-black hover:underline transition-all"
              style={{ color: "#3AA0FF" }}
            >
              {symbol}
            </span>
          </div>

          {/* Company name */}
          {isLoading ? (
            <div className="h-3 w-24 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          ) : (
            <span className="text-[11px] truncate block" style={{ color: "rgba(255,255,255,0.3)" }}>
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
                <span className="text-[11px] font-mono tabular-nums" style={{ color: isPositive ? "#00FF9C" : "#FF4D4D" }}>
                  {change}
                </span>
              )}
            </>
          )}

          {/* Remove — always visible on touch (mobile), hover-only on desktop */}
          <button
            onClick={e => { e.stopPropagation(); onRemove(symbol); }}
            title={s.remove}
            className="mt-1.5 w-6 h-6 rounded-lg flex items-center justify-center opacity-40 sm:opacity-0 sm:group-hover:opacity-60 transition-all hover:!opacity-100"
            style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#FF4D4D")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Teaser — the highest-signal line on the card ── */}
      <div className="px-4 pb-3">
        {!insight ? (
          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)", width: "90%" }} />
            <div className="h-2.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.04)", width: "65%" }} />
          </div>
        ) : (
          <p
            className="text-[12.5px] font-medium leading-relaxed"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            {insight.teaser}
          </p>
        )}
      </div>

      {/* ── Divider + Quick actions + response panel ── */}
      {insight && (
        <div
          className="px-4 pb-4 pt-3 space-y-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <QuickActionBar
            activeAction={qa.activeAction}
            state={qa.state}
            onTrigger={qa.trigger}
            strings={s}
          />

          <QuickActionPanel
            activeAction={qa.activeAction}
            state={qa.state}
            response={qa.response}
            isProUser={isProUser}
            onUpgrade={onUpgrade}
            strings={s}
          />

          {/* Pro-only: full summary + drivers + badges */}
          {isProUser && (
            <div className="space-y-3 pt-1">
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                {insight.summary}
              </p>

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.18)" }}>
                  {s.drivers}
                </p>
                <ul className="space-y-1.5">
                  {insight.drivers.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-[9px] font-black mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.15)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.44)" }}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

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
      )}
    </motion.div>
  );
}
