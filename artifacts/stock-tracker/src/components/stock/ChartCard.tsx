import { useState } from "react";
import { Loader2, LineChart as ChartIcon } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer,
  Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useChart, type ChartRange } from "@/hooks/use-chart";
import { formatPrice } from "@/lib/format";
import { CHART_RANGES } from "@/lib/constants";
import type { Translations } from "@/lib/i18n";

interface ChartCardProps {
  ticker: string;
  currency: string;
  isPositive: boolean;
  t: Translations;
}

export function ChartCard({ ticker, currency, isPositive, t }: ChartCardProps) {
  const [chartRange, setChartRange] = useState<ChartRange>("1mo");
  const { data: chartData, isLoading: chartLoading } = useChart(ticker, chartRange);

  const chartColor = isPositive ? "#00FF9C" : "#FF4D4D";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-4 h-4" style={{ color: "#3AA0FF" }} />
          <span className="font-display font-bold text-sm text-white">{t.priceHistory}</span>
          {chartLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" style={{ color: "rgba(255,255,255,0.3)" }} />
          )}
        </div>

        {/* Range tabs — scrollable on mobile to prevent overflow */}
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5 overflow-x-auto scrollbar-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {CHART_RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setChartRange(r.value)}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all"
              style={chartRange === r.value
                ? { background: "#3AA0FF", color: "#0B0F14" }
                : { color: "rgba(255,255,255,0.35)" }
              }
              onMouseEnter={e => { if (chartRange !== r.value) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { if (chartRange !== r.value) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[380px] relative px-2 pb-3">
        {chartLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10 rounded-xl"
            style={{ background: "rgba(18,24,33,0.7)" }}
          >
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#3AA0FF" }} />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData?.points ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "JetBrains Mono" }}
              tickLine={false}
              axisLine={false}
              dy={8}
              minTickGap={45}
            />
            <YAxis domain={["auto", "auto"]} hide />
            <RechartsTooltip
              contentStyle={{
                background: "#1A2234",
                border: "1px solid rgba(58,160,255,0.25)",
                borderRadius: "10px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                padding: "10px 14px",
              }}
              itemStyle={{ color: "#fff", fontWeight: 700, fontFamily: "JetBrains Mono", fontSize: 13 }}
              labelStyle={{ color: "rgba(255,255,255,0.4)", marginBottom: 4, fontSize: 11 }}
              formatter={(value: number) => [
                formatPrice(value, chartData?.currency ?? currency),
                t.price,
              ]}
              cursor={{ stroke: "rgba(58,160,255,0.3)", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: chartColor, stroke: "#0B0F14", strokeWidth: 2 }}
              animationDuration={500}
              isAnimationActive={!chartLoading}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
