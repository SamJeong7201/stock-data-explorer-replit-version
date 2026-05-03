import { Router, type IRouter } from "express";
import { yahooFinance } from "../lib/yahoo";
import { isWholeCurrency } from "../lib/format";

const router: IRouter = Router();

type Range = "1d" | "3d" | "1w" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "max";
type Interval = "5m" | "15m" | "1h" | "1d" | "1wk" | "1mo";

interface RangeConfig {
  interval: Interval;
  daysBack?: number;
  useMax?: boolean;
  labelFormat: "time" | "datetime" | "date" | "month" | "year";
}

const RANGE_CONFIG: Record<Range, RangeConfig> = {
  "1d":  { interval: "5m",  daysBack: 1,        labelFormat: "time" },
  "3d":  { interval: "1h",  daysBack: 3,        labelFormat: "datetime" },
  "1w":  { interval: "1h",  daysBack: 7,        labelFormat: "datetime" },
  "1mo": { interval: "1d",  daysBack: 30,       labelFormat: "date" },
  "3mo": { interval: "1d",  daysBack: 90,       labelFormat: "date" },
  "6mo": { interval: "1d",  daysBack: 180,      labelFormat: "date" },
  "1y":  { interval: "1wk", daysBack: 365,      labelFormat: "date" },
  "5y":  { interval: "1mo", daysBack: 365 * 5,  labelFormat: "year" },
  "max": { interval: "1mo", useMax: true,        labelFormat: "year" },
};

function formatLabel(date: Date, fmt: RangeConfig["labelFormat"]): string {
  switch (fmt) {
    case "time":
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    case "datetime":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    case "date":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "month":
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    case "year":
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString();
  }
}

function round(v: number | null | undefined, decimals: number): number {
  if (v == null) return 0;
  return parseFloat(v.toFixed(decimals));
}

router.get("/:ticker/chart", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const range = (req.query.range as Range) || "1mo";
  const config = RANGE_CONFIG[range] ?? RANGE_CONFIG["1mo"];

  try {
    const period1 = (() => {
      if (config.useMax) return new Date("1970-01-01");
      const d = new Date();
      d.setDate(d.getDate() - (config.daysBack ?? 30));
      if (range === "1d") d.setHours(0, 0, 0, 0);
      return d;
    })();

    const chart = await yahooFinance.chart(ticker, {
      period1,
      interval: config.interval as "1d" | "5m" | "15m" | "1h" | "1wk" | "1mo",
    });

    const currency = chart.meta?.currency ?? "USD";
    const isWhole = isWholeCurrency(currency);
    const dec = isWhole ? 0 : 2;

    const points = (chart.quotes ?? [])
      .filter((q) => q.close !== null && q.close !== undefined)
      .map((q) => ({
        date:      formatLabel(new Date(q.date), config.labelFormat),
        timestamp: new Date(q.date).getTime(),
        open:      round(q.open,  dec),
        high:      round(q.high,  dec),
        low:       round(q.low,   dec),
        close:     round(q.close, dec),
        price:     round(q.close, dec),
        volume:    q.volume ?? 0,
      }));

    res.json({ ticker, range, currency, points });
  } catch (err) {
    console.error(`[chart] Error fetching ${ticker} chart:`, err);
    res.status(500).json({ error: "Failed to fetch chart data." });
  }
});

export default router;
