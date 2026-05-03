import { useState } from "react";
import { Loader2, LineChart as ChartIcon, CandlestickChart } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer,
  Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid,
  ComposedChart, Bar, Cell,
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

// 캔들 커스텀 바
function CandleBar(props: any) {
  const { x, y, width, payload } = props;
  if (!payload) return null;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "#00cc7a" : "#FF4D4D";
  const bodyTop    = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyH      = Math.abs(close - open);

  // recharts YAxis의 실제 스케일을 쓰려면 yAxis prop이 필요하지만
  // ComposedChart Bar의 커스텀 shape에서는 픽셀값으로 직접 받음
  // props.y = bar top (close or open 중 높은 쪽), props.height = bar height
  const barTop    = props.y ?? 0;
  const barHeight = Math.max(props.height ?? 1, 1);
  const barWidth  = Math.max((width ?? 6) * 0.6, 2);
  const cx        = (x ?? 0) + (width ?? 6) / 2;

  return (
    <g>
      {/* 위 꼬리 */}
      <line x1={cx} y1={barTop - (props.highOffset ?? 0)} x2={cx} y2={barTop} stroke={color} strokeWidth={1} />
      {/* 몸통 */}
      <rect x={cx - barWidth / 2} y={barTop} width={barWidth} height={barHeight} fill={color} rx={1} />
      {/* 아래 꼬리 */}
      <line x1={cx} y1={barTop + barHeight} x2={cx} y2={barTop + barHeight + (props.lowOffset ?? 0)} stroke={color} strokeWidth={1} />
    </g>
  );
}

// 캔들용 커스텀 shape (ComposedChart Bar shape)
function CandleShape(props: any) {
  const { x, width, payload, yAxis } = props;
  if (!payload || !yAxis) return null;

  const { open, high, low, close } = payload;
  const isUp  = close >= open;
  const color = isUp ? "#00cc7a" : "#FF4D4D";

  const toY = (v: number) => {
    const { scale } = yAxis;
    return scale ? scale(v) : 0;
  };

  const openY  = toY(open);
  const closeY = toY(close);
  const highY  = toY(high);
  const lowY   = toY(low);

  const bodyTop = Math.min(openY, closeY);
  const bodyBot = Math.max(openY, closeY);
  const bodyH   = Math.max(bodyBot - bodyTop, 1);
  const bw      = Math.max((width ?? 8) * 0.65, 2);
  const cx      = (x ?? 0) + (width ?? 8) / 2;

  return (
    <g>
      <line x1={cx} y1={highY} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1} />
      <rect x={cx - bw / 2} y={bodyTop} width={bw} height={bodyH} fill={color} rx={1} />
      <line x1={cx} y1={bodyBot} x2={cx} y2={lowY} stroke={color} strokeWidth={1} />
    </g>
  );
}

// 캔들 툴팁
function CandleTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const fmt = (v: number) => formatPrice(v, currency);
  const isUp = d.close >= d.open;
  return (
    <div style={{ background: "#1A2234", border: "1px solid rgba(58,160,255,0.25)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6 }}>{label}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
        {[["O", d.open], ["H", d.high], ["L", d.low], ["C", d.close]].map(([lbl, val]) => (
          <div key={lbl as string} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "JetBrains Mono", width: 12 }}>{lbl}</span>
            <span style={{ color: lbl === "C" ? (isUp ? "#00cc7a" : "#FF4D4D") : "#fff", fontSize: 12, fontWeight: 700, fontFamily: "JetBrains Mono" }}>
              {fmt(val as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartCard({ ticker, currency, isPositive, t }: ChartCardProps) {
  const [chartRange, setChartRange] = useState<ChartRange>("1mo");
  const [chartType, setChartType]   = useState<"line" | "candle">("line");
  const { data: chartData, isLoading: chartLoading } = useChart(ticker, chartRange);

  const chartColor = isPositive ? "#00cc7a" : "#FF4D4D";

  // 캔들은 1d/3d/1w처럼 짧은 범위에서만 의미 있음 — 아무 range나 허용
  const canShowCandle = true;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-4 h-4" style={{ color: "#3AA0FF" }} />
          <span className="font-display font-bold text-sm text-white">{t.priceHistory}</span>
          {chartLoading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" style={{ color: "rgba(255,255,255,0.3)" }} />}
        </div>

        <div className="flex items-center gap-2">
          {/* 차트 타입 토글 */}
          <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setChartType("line")}
              title="Line chart"
              className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all flex items-center gap-1"
              style={chartType === "line" ? { background: "#3AA0FF", color: "#0B0F14" } : { color: "rgba(255,255,255,0.35)" }}
            >
              <ChartIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => setChartType("candle")}
              title="Candlestick chart"
              className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all flex items-center gap-1"
              style={chartType === "candle" ? { background: "#3AA0FF", color: "#0B0F14" } : { color: "rgba(255,255,255,0.35)" }}
            >
              <CandlestickChart className="w-3 h-3" />
            </button>
          </div>

          {/* Range 탭 */}
          <div className="flex items-center gap-0.5 rounded-lg p-0.5 overflow-x-auto scrollbar-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {CHART_RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setChartRange(r.value)}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all"
                style={chartRange === r.value ? { background: "#3AA0FF", color: "#0B0F14" } : { color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={e => { if (chartRange !== r.value) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
                onMouseLeave={e => { if (chartRange !== r.value) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="h-[380px] relative px-2 pb-3">
        {chartLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl" style={{ background: "rgba(18,24,33,0.7)" }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#3AA0FF" }} />
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <AreaChart data={chartData?.points ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={chartColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} dy={8} minTickGap={45} />
              <YAxis domain={["auto", "auto"]} hide />
              <RechartsTooltip
                contentStyle={{ background: "#1A2234", border: "1px solid rgba(58,160,255,0.25)", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", padding: "10px 14px" }}
                itemStyle={{ color: "#fff", fontWeight: 700, fontFamily: "JetBrains Mono", fontSize: 13 }}
                labelStyle={{ color: "rgba(255,255,255,0.4)", marginBottom: 4, fontSize: 11 }}
                formatter={(value: number) => [formatPrice(value, chartData?.currency ?? currency), t.price]}
                cursor={{ stroke: "rgba(58,160,255,0.3)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2} fill="url(#priceGradient)" dot={false}
                activeDot={{ r: 4, fill: chartColor, stroke: "#0B0F14", strokeWidth: 2 }}
                animationDuration={500} isAnimationActive={!chartLoading} />
            </AreaChart>
          ) : (
            <ComposedChart data={chartData?.points ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} dy={8} minTickGap={45} />
              <YAxis domain={["auto", "auto"]} hide />
              <RechartsTooltip content={<CandleTooltip currency={chartData?.currency ?? currency} />} cursor={{ stroke: "rgba(58,160,255,0.3)", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Bar dataKey="close" shape={<CandleShape />} isAnimationActive={!chartLoading}>
                {(chartData?.points ?? []).map((p, i) => (
                  <Cell key={i} fill={p.close >= p.open ? "#00cc7a" : "#FF4D4D"} />
                ))}
              </Bar>
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
