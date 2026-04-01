import { Router, type IRouter } from "express";
import { yahooFinance } from "../lib/yahoo";
import { openai } from "../lib/openai";

const router: IRouter = Router();

// Simple in-memory cache for Korean → English translation
const translationCache = new Map<string, string>();

function containsKorean(text: string): boolean {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text);
}

async function translateKoreanToEnglish(koreanQuery: string): Promise<string> {
  const cached = translationCache.get(koreanQuery);
  if (cached) return cached;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a Korean-to-English stock company name translator. " +
            "Given a Korean company name, return ONLY the most common English name used on stock exchanges. " +
            "Return just the company name, nothing else. " +
            "Examples: 메디포스트 → Medipost, 카카오 → Kakao, 삼성전자 → Samsung Electronics, " +
            "현대차 → Hyundai Motor, 네이버 → Naver, SK하이닉스 → SK Hynix, LG전자 → LG Electronics, " +
            "셀트리온 → Celltrion, 카카오뱅크 → KakaoBank, 하이브 → HYBE, 크래프톤 → Krafton.",
        },
        {
          role: "user",
          content: koreanQuery,
        },
      ],
      max_tokens: 30,
      temperature: 0,
    });

    const translated = completion.choices[0]?.message?.content?.trim() ?? koreanQuery;
    translationCache.set(koreanQuery, translated);
    return translated;
  } catch (err) {
    console.error("[search] Translation error:", err);
    return koreanQuery;
  }
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
}

async function searchYahoo(query: string): Promise<SearchResult[]> {
  const result = await yahooFinance.search(query, {
    quotesCount: 8,
    newsCount: 0,
    enableFuzzyQuery: true,
  });

  return (result.quotes ?? [])
    .filter((item) => {
      const type = (item as { quoteType?: string }).quoteType;
      return type === "EQUITY" || type === "ETF";
    })
    .slice(0, 6)
    .map((item) => {
      const i = item as {
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchDisp?: string;
        exchange?: string;
      };
      return {
        symbol: i.symbol ?? "",
        name: i.shortname ?? i.longname ?? i.symbol ?? "",
        exchange: i.exchDisp ?? i.exchange ?? "",
      };
    })
    .filter((r) => r.symbol !== "");
}

async function fetchPrices(symbols: string[]): Promise<Map<string, { price: number; change: number; changePercent: number; currency: string }>> {
  const priceMap = new Map<string, { price: number; change: number; changePercent: number; currency: string }>();

  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        const q = await yahooFinance.quote(symbol, {
          fields: ["regularMarketPrice", "regularMarketChange", "regularMarketChangePercent", "currency"],
        });
        if (q?.regularMarketPrice != null) {
          priceMap.set(symbol, {
            price: q.regularMarketPrice,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
            currency: q.currency ?? "USD",
          });
        }
      } catch {
        // silently skip if price unavailable
      }
    })
  );

  return priceMap;
}

router.get("/", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();

  if (!q || q.length < 1) {
    res.json({ results: [] });
    return;
  }

  try {
    let results: SearchResult[];

    if (containsKorean(q)) {
      // Translate Korean → English, then search
      const englishName = await translateKoreanToEnglish(q);
      console.log(`[search] Korean query "${q}" translated to "${englishName}"`);
      results = await searchYahoo(englishName);

      // Prefer Korean-listed stocks first
      results = [
        ...results.filter((r) => r.symbol.endsWith(".KQ") || r.symbol.endsWith(".KS")),
        ...results.filter((r) => !r.symbol.endsWith(".KQ") && !r.symbol.endsWith(".KS")),
      ];
    } else {
      results = await searchYahoo(q);
    }

    // Fetch current prices for all results in parallel
    const priceMap = await fetchPrices(results.map((r) => r.symbol));

    const enriched = results.map((r) => {
      const p = priceMap.get(r.symbol);
      return p ? { ...r, ...p } : r;
    });

    res.json({ results: enriched });
  } catch (err) {
    console.error("[search] Error:", err);
    res.json({ results: [] });
  }
});

export default router;
