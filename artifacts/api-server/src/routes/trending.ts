import { Router, type IRouter } from "express";
import { yahooFinance } from "../lib/yahoo";
import { formatVolume } from "../lib/format";

const router: IRouter = Router();

const REGION_MAP: Record<string, string> = {
  us: "US",
  kr: "KR",
  cn: "HK",
};

/**
 * GET /api/trending?market=us|kr|cn
 * Returns { trending: TrendItem[], mostActive: TrendItem[] }
 */
router.get("/", async (req, res) => {
  const market = (req.query.market as string) ?? "us";
  const regionCode = REGION_MAP[market] ?? "US";

  try {
    const [trendingResult, mostActiveResult] = await Promise.allSettled([
      yahooFinance.trendingSymbols(regionCode, { count: 12 }),
      // screener is US-only; skip for non-US
      market === "us"
        ? yahooFinance.screener("most_actives", { count: 12 } as any)
        : Promise.resolve(null),
    ]);

    /* ── 1. Trending symbols → full quotes ── */
    let trendingItems: any[] = [];
    if (trendingResult.status === "fulfilled" && trendingResult.value.quotes.length) {
      const symbols = trendingResult.value.quotes
        .map((q) => q.symbol)
        .filter(Boolean)
        .slice(0, 12);

      const quotes = await yahooFinance.quote(symbols).catch(() => []);
      const quotesArr = Array.isArray(quotes) ? quotes : [quotes];
      trendingItems = quotesArr
        .filter((q) => q && q.regularMarketPrice)
        .map((q, i) => ({
          rank: i + 1,
          symbol: q.symbol,
          name: q.shortName ?? q.longName ?? q.symbol,
          price: q.regularMarketPrice,
          changePercent: q.regularMarketChangePercent ?? 0,
          volume: formatVolume(q.regularMarketVolume),
          currency: q.currency ?? "USD",
        }));
    }

    /* ── 2. Most active (US only from screener) ── */
    let mostActiveItems: any[] = [];
    if (
      mostActiveResult.status === "fulfilled" &&
      mostActiveResult.value &&
      (mostActiveResult.value as any).quotes
    ) {
      mostActiveItems = ((mostActiveResult.value as any).quotes as any[])
        .filter((q) => q && q.regularMarketPrice)
        .slice(0, 12)
        .map((q, i) => ({
          rank: i + 1,
          symbol: q.symbol,
          name: q.shortName ?? q.longName ?? q.symbol,
          price: q.regularMarketPrice,
          changePercent: q.regularMarketChangePercent ?? 0,
          volume: formatVolume(q.regularMarketVolume),
          currency: q.currency ?? "USD",
        }));
    }

    res.json({ trending: trendingItems, mostActive: mostActiveItems });
  } catch (err) {
    console.error("Trending error:", err);
    res.status(500).json({ error: "Failed to fetch trending data" });
  }
});

export default router;
