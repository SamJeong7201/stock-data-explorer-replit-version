import { Globe, TrendingUp, TrendingDown } from "lucide-react";
import { usePriceFlash } from "@/hooks/use-price-flash";
import { useMarketClock } from "@/hooks/use-market-clock";
import { formatPrice, getCurrencySymbol } from "@/lib/format";
import { getMarketInfo, formatMarketTime, formatMarketDate, isMarketOpen } from "@/lib/market-utils";
import { StatBox } from "./StatBox";
import type { Translations } from "@/lib/i18n";

interface StockData {
  ticker: string;
  companyName: string;
  exchangeName?: string;
  currency: string;
  currentPrice: number;
  previousClose: number;
  high52Week: number;
  low52Week: number;
  marketCap: string;
  volume: string;
  change: number;
  changePercent: number;
}

interface PriceHeroCardProps {
  data: StockData;
  isPositive: boolean;
  t: Translations;
  dataUpdatedAt: number;
}

export function PriceHeroCard({ data, isPositive, t, dataUpdatedAt }: PriceHeroCardProps) {
  const { currency, exchangeName = "", ticker } = data;
  const currencySymbol = getCurrencySymbol(currency);
  const accentColor    = isPositive ? "#00FF9C" : "#FF4D4D";

  const flash  = usePriceFlash(data.currentPrice, ticker);
  const now    = useMarketClock();
  const market = getMarketInfo(exchangeName, currency);
  const open   = isMarketOpen(now, market);

  const refreshSecondsLeft = dataUpdatedAt
    ? Math.max(0, 15 - Math.floor((now.getTime() - dataUpdatedAt) / 1000))
    : null;

  const flashClass = flash === "up"
    ? " price-flash-up"
    : flash === "down"
    ? " price-flash-down"
    : " text-white";

  return (
    <div
      className="rounded-2xl p-5 mb-5 relative overflow-hidden card-gradient-border"
      style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-64 h-32 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${accentColor}10 0%, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-5">
        {/* Left: identity */}
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-black text-4xl tracking-tight text-white">{data.ticker}</span>
              <span className="w-2 h-2 rounded-full live-dot" style={{ background: accentColor }} />
            </div>
            <p className="font-medium text-base mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              {data.companyName}
            </p>
            {data.exchangeName && (
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <Globe className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{data.exchangeName}</span>
                {data.currency !== "USD" && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: "rgba(58,160,255,0.12)", color: "#3AA0FF", border: "1px solid rgba(58,160,255,0.2)" }}
                  >
                    {data.currency}
                  </span>
                )}
                {/* Inline market time */}
                <span className="flex items-center gap-1 ml-1 pl-2" style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: open ? "#00FF9C" : "rgba(255,255,255,0.2)",
                      boxShadow: open ? "0 0 5px #00FF9C" : "none",
                      animation: open ? "pulse-dot 2s ease-in-out infinite" : "none",
                    }}
                  />
                  <span className="font-mono text-xs tabular-nums font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {formatMarketTime(now, market.tz)}
                  </span>
                  <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {market.label}
                  </span>
                  <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
                    · {formatMarketDate(now, market.tz)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: price + change + refresh */}
        <div className="flex flex-col md:items-end">
          <span
            key={data.currentPrice}
            className={`font-mono font-black text-4xl tracking-tight leading-none${flashClass}`}
          >
            {formatPrice(data.currentPrice, currency)}
          </span>

          <div className="flex items-center gap-1.5 mt-2 font-mono font-bold text-lg" style={{ color: accentColor }}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span>{isPositive ? "+" : "-"}{currencySymbol}{Math.abs(data.change).toLocaleString()}</span>
            <span className="text-base opacity-75">
              ({isPositive ? "+" : ""}{data.changePercent.toFixed(2)}%)
            </span>
          </div>

          {/* Auto-refresh countdown */}
          {refreshSecondsLeft !== null && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="relative w-4 h-4 flex-shrink-0">
                <svg className="w-4 h-4 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle
                    cx="16" cy="16" r="14" fill="none"
                    stroke="rgba(58,160,255,0.5)" strokeWidth="3"
                    strokeDasharray="88"
                    strokeDashoffset={88 - Math.round(88 * (refreshSecondsLeft / 15))}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
              </div>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                {refreshSecondsLeft > 0 ? `${refreshSecondsLeft}s` : t.updating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div
        className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-5 mt-5 pt-5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <StatBox label={t.prevClose} value={formatPrice(data.previousClose, currency)} />
        <StatBox label={t.highLow}   value={`${formatPrice(data.high52Week, currency)} / ${formatPrice(data.low52Week, currency)}`} />
        <StatBox label={t.marketCap} value={data.marketCap} />
        <StatBox label={t.volume}    value={data.volume} />
      </div>
    </div>
  );
}
