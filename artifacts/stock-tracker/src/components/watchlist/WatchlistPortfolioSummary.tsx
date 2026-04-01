/**
 * WatchlistPortfolioSummary
 *
 * Pro-only portfolio-level intelligence card.
 *
 * - Free users see a blurred/locked preview with upgrade CTA.
 * - Pro users see overall sentiment + market read + top pick + risk note.
 */

import { Sparkles, Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import type { PortfolioInsight } from "@/services/watchlist-insights";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import type { WatchlistUIStrings } from "@/lib/premium-i18n";

const SENTIMENT_COLOR = {
  bullish: "#00FF9C",
  bearish: "#FF4D4D",
  neutral: "#3AA0FF",
} as const;

const SENTIMENT_ICON = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
} as const;

interface WatchlistPortfolioSummaryProps {
  insight:   PortfolioInsight | null;
  loading:   boolean;
  isProUser: boolean;
  onUpgrade: () => void;
  strings:   WatchlistUIStrings;
}

export function WatchlistPortfolioSummary({
  insight, loading, isProUser, onUpgrade, strings: s,
}: WatchlistPortfolioSummaryProps) {
  const sentiment     = insight?.overallSentiment ?? "neutral";
  const SentimentIcon = SENTIMENT_ICON[sentiment];
  const color         = SENTIMENT_COLOR[sentiment];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#0F1620",
        border: "1px solid rgba(245,158,11,0.15)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
          </div>
          <span className="text-sm font-bold text-white">{s.portfolio.title}</span>
          <PremiumBadge size="sm" />
        </div>
      </div>

      {/* Body */}
      {!isProUser ? (
        /* ── LOCKED state ── */
        <div className="relative">
          {/* Blurred preview of content */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ filter: "blur(7px)", opacity: 0.3 }}
          >
            <LockedPreviewContent />
          </div>
          <div className="absolute inset-0 rounded-b-2xl" style={{ background: "rgba(11,15,20,0.7)" }} />

          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)" }}
            >
              <Lock className="w-5 h-5" style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">{s.portfolio.lockedHeading}</p>
              <p className="text-xs leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                {s.portfolio.lockedSub}
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0B0F14" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Unlock Pro
            </button>
          </div>
        </div>
      ) : loading || !insight ? (
        /* ── Loading state ── */
        <div className="px-5 py-5 space-y-3">
          {[100,80,65,90].map(w => (
            <div key={w} className="h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: `${w}%` }} />
          ))}
        </div>
      ) : (
        /* ── PRO: full content ── */
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="px-5 py-5 space-y-5"
        >
          {/* Overall sentiment */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{
                background: `${color}10`,
                border: `1px solid ${color}25`,
              }}
            >
              <SentimentIcon className="w-4 h-4" style={{ color }} />
              <span className="text-sm font-black uppercase tracking-wider" style={{ color }}>
                {s.portfolio.sentiment[sentiment]}
              </span>
            </div>
          </div>

          {/* Market read */}
          {insight.theme && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                {s.portfolio.themeLabel}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {insight.theme}
              </p>
            </div>
          )}

          {/* Top pick + Risk in a 2-col layout */}
          <div className="grid grid-cols-2 gap-3">
            {insight.topPick && (
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(0,255,156,0.04)", border: "1px solid rgba(0,255,156,0.1)" }}
              >
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "rgba(0,255,156,0.5)" }}>
                  {s.portfolio.topPickLabel}
                </p>
                <p className="text-sm font-black font-mono" style={{ color: "#00FF9C" }}>
                  {insight.topPick}
                </p>
              </div>
            )}

            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(255,77,77,0.04)", border: "1px solid rgba(255,77,77,0.1)" }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "rgba(255,77,77,0.5)" }}>
                {s.portfolio.riskLabel}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                {insight.riskSummary}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/** Dummy content that appears blurred behind the lock overlay */
function LockedPreviewContent() {
  return (
    <div className="px-5 py-5 space-y-3 pointer-events-none select-none">
      <div className="flex items-center gap-2">
        <div className="w-20 h-6 rounded-xl" style={{ background: "rgba(0,255,156,0.2)" }} />
      </div>
      <div className="space-y-1">
        <div className="h-2.5 rounded" style={{ background: "rgba(255,255,255,0.1)", width: "90%" }} />
        <div className="h-2.5 rounded" style={{ background: "rgba(255,255,255,0.08)", width: "75%" }} />
        <div className="h-2.5 rounded" style={{ background: "rgba(255,255,255,0.06)", width: "60%" }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 rounded-xl" style={{ background: "rgba(0,255,156,0.06)" }} />
        <div className="h-14 rounded-xl" style={{ background: "rgba(255,77,77,0.06)" }} />
      </div>
    </div>
  );
}
