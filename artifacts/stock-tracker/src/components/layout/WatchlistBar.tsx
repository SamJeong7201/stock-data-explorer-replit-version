import { useState } from "react";
import { Globe } from "lucide-react";
import { useMarketClock } from "@/hooks/use-market-clock";
import { getMarketInfo, formatMarketTime, isMarketOpen } from "@/lib/market-utils";
import { MARKET_TICKERS } from "@/lib/constants";
import type { Market } from "@/lib/constants";
import type { Lang, Translations } from "@/lib/i18n";

interface WatchlistBarProps {
  ticker: string;
  onSelectTicker: (symbol: string) => void;
  t: Translations;
  lang: Lang;
  exchangeName?: string;
  currency?: string;
  hasData: boolean;
}

const MARKET_FLAGS: { key: Market; flag: string }[] = [
  { key: "us", flag: "🇺🇸" },
  { key: "kr", flag: "🇰🇷" },
  { key: "cn", flag: "🇨🇳" },
];

export function WatchlistBar({
  ticker, onSelectTicker, t, exchangeName = "", currency = "USD", hasData,
}: WatchlistBarProps) {
  const [watchlistMarket, setWatchlistMarket] = useState<Market>("us");

  const now    = useMarketClock();
  const market = getMarketInfo(exchangeName, currency);
  const open   = hasData ? isMarketOpen(now, market) : false;

  return (
    <div
      className="shrink-0 flex items-center gap-2 px-5 py-2.5 overflow-x-auto scrollbar-none"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-widest shrink-0"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        {t.watchlist}
      </span>

      {/* Market selector */}
      <div
        className="flex items-center rounded-md overflow-hidden shrink-0"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {MARKET_FLAGS.map(({ key, flag }) => (
          <button
            key={key}
            onClick={() => setWatchlistMarket(key)}
            className="px-2 py-0.5 text-xs font-bold transition-all"
            style={watchlistMarket === key
              ? { background: "#3AA0FF", color: "#0B0F14" }
              : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)" }
            }
          >
            {flag}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-4 shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* Ticker pills */}
      {MARKET_TICKERS[watchlistMarket].map(({ symbol, label }) => (
        <button
          key={symbol}
          onClick={() => onSelectTicker(symbol)}
          className="shrink-0 px-3 py-1 rounded-md text-xs font-bold font-mono transition-all"
          style={ticker === symbol
            ? { background: "rgba(58,160,255,0.15)", color: "#3AA0FF", border: "1px solid rgba(58,160,255,0.3)" }
            : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }
          }
          onMouseEnter={e => {
            if (ticker !== symbol) {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
            }
          }}
          onMouseLeave={e => {
            if (ticker !== symbol) {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
            }
          }}
        >
          {label}
        </button>
      ))}

      {/* Live market clock — hidden on mobile (behind scroll, not useful there) */}
      <div className="ml-auto shrink-0 hidden sm:flex items-center gap-2.5">
        {hasData ? (
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: open ? "#00FF9C" : "rgba(255,255,255,0.2)",
                boxShadow: open ? "0 0 6px #00FF9C" : "none",
                animation: open ? "pulse-dot 2s ease-in-out infinite" : "none",
              }}
            />
            <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
              {market.city}
            </span>
            <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.75)" }}>
              {formatMarketTime(now, market.tz)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
              {market.label}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={open
                ? { background: "rgba(0,255,156,0.1)", color: "#00FF9C", border: "1px solid rgba(0,255,156,0.2)" }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {open ? t.open : t.closed}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            <Globe className="w-3 h-3" />
            <span>{t.globalMarkets}</span>
          </div>
        )}
      </div>
    </div>
  );
}
