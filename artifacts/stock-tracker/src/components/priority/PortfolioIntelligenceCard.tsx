/**
 * PortfolioIntelligenceCard
 *
 * Pro-only portfolio-level intelligence summary at the bottom of the Priority Board.
 * Free users see a blurred/locked preview with an upgrade CTA.
 */

import { Sparkles, Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import type { PortfolioInsight } from "@/services/watchlist-insights";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import type { PriorityBoardStrings } from "@/lib/premium-i18n";

const SENTIMENT_COLOR = {
  bullish: "#00FF9C",
  bearish: "#FF4D4D",
  neutral: "#3AA0FF",
} as const;

interface PortfolioIntelligenceCardProps {
  insight:   PortfolioInsight | null;
  loading:   boolean;
  isProUser: boolean;
  onUpgrade: () => void;
  strings:   PriorityBoardStrings;
}

export function PortfolioIntelligenceCard({
  insight, loading, isProUser, onUpgrade, strings: s,
}: PortfolioIntelligenceCardProps) {
  const p = s.portfolio;
  const sentimentColor = insight ? SENTIMENT_COLOR[insight.overallSentiment] : "#3AA0FF";
  const sentimentLabel = insight ? p.sentiment[insight.overallSentiment] : "—";
  const SentimentIcon  = insight?.overallSentiment === "bullish"
    ? TrendingUp
    : insight?.overallSentiment === "bearish"
    ? TrendingDown
    : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative rounded-2xl overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
          </div>
          <span className="text-sm font-bold text-white">{p.title}</span>
        </div>
        <PremiumBadge />
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-4 pb-4 space-y-2">
          {[100, 80, 55].map(w => (
            <div
              key={w}
              className="h-2.5 rounded animate-pulse"
              style={{ background: "rgba(255,255,255,0.05)", width: `${w}%` }}
            />
          ))}
        </div>
      ) : isProUser ? (
        <div
          className="px-4 pb-4 space-y-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          {/* Overall sentiment */}
          {insight && (
            <div className="pt-3 flex items-center gap-2.5">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black"
                style={{
                  background: `${sentimentColor}10`,
                  border: `1px solid ${sentimentColor}25`,
                  color: sentimentColor,
                }}
              >
                <SentimentIcon className="w-3.5 h-3.5" />
                {sentimentLabel}
              </div>
              {insight.topPick && (
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <span style={{ color: "rgba(255,255,255,0.22)" }}>{p.topPickLabel}: </span>
                  <span className="font-mono font-black" style={{ color: "#3AA0FF" }}>{insight.topPick}</span>
                </div>
              )}
            </div>
          )}

          {/* Theme / market read */}
          {insight?.theme && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                {p.themeLabel}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                {insight.theme}
              </p>
            </div>
          )}

          {/* Risk note */}
          {insight?.riskSummary && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                {p.riskLabel}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.44)" }}>
                {insight.riskSummary}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Locked preview ── */
        <div className="relative px-4 pb-4">
          {/* Blurred dummy content */}
          <div className="select-none pt-3 space-y-2.5" style={{ filter: "blur(5px)", opacity: 0.35 }}>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl text-sm font-black" style={{ background: "rgba(0,255,156,0.1)", color: "#00FF9C" }}>
                Bullish
              </div>
              <span className="text-xs font-mono font-black" style={{ color: "#3AA0FF" }}>AAPL</span>
            </div>
            <div className="space-y-1.5">
              {[100, 88, 72].map(w => (
                <div key={w} className="h-2.5 rounded" style={{ background: "rgba(255,255,255,0.12)", width: `${w}%` }} />
              ))}
            </div>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)" }}
            >
              <Lock className="w-4 h-4" style={{ color: "#f59e0b" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white mb-1">{p.lockedHeading}</p>
              <p className="text-[11px] max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                {p.lockedSub}
              </p>
            </div>
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0B0F14" }}
            >
              <Sparkles className="w-3 h-3" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
