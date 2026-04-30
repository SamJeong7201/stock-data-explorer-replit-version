import { Router, type IRouter } from "express";
import { GetStockDataResponse } from "@workspace/api-zod";
import { finnhubQuote, finnhubProfile, finnhubNews, finnhubCandles } from "../lib/yahoo";
import { openai } from "../lib/openai";
import {
  currencySymbol,
  formatMarketCap,
  formatVolume,
  isWholeCurrency,
} from "../lib/format";

const router: IRouter = Router();

/**
 * Lightweight, fast, server-side sentiment classifier.
 *
 * Design principles:
 *   - Runs synchronously during the initial stock fetch — zero extra latency.
 *   - Badge is set once and never changes (no async override).
 *   - Score-based: strong multi-word phrases outweigh single ambiguous words.
 *   - Negation detection: "not", "fails to", etc. before a positive signal → signal ignored.
 *   - Default to "neutral" — a wrong label is worse than a neutral one.
 *
 * Scoring:
 *   Strong phrase match → ±2   (e.g. "beats expectations", "cuts guidance")
 *   Weak single word   → ±1   (e.g. "surges", "plunges")
 *   Net score ≥  1 → positive
 *   Net score ≤ -1 → negative
 *   Net score  = 0 → neutral
 */
function deriveSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();

  // Strong positive phrases — rarely appear in a negative context
  const STRONG_POSITIVE = [
    "record high", "record revenue", "record profit", "record earnings", "all-time high",
    "beats expectations", "beat expectations", "beats estimates", "beat estimates",
    "exceeds expectations", "exceeded expectations", "exceeds estimates",
    "raised guidance", "raises guidance", "guidance raised",
    "upgraded to buy", "price target raised", "price target increased",
    "strong earnings", "strong results", "strong revenue", "strong profit",
    "profit rises", "profit rose", "revenue rises", "revenue rose", "sales rise",
    "fda approves", "fda approved", "approved by fda", "regulatory approval",
    "wins contract", "awarded contract", "wins bid",
    "market share gain", "gaining market share",
    "strategic acquisition", "transformative deal",
    "dividend increase", "buyback program",
  ];

  // Strong negative phrases — clearly directional in context
  const STRONG_NEGATIVE = [
    "misses estimates", "misses expectations", "missed estimates", "missed expectations",
    "miss estimates", "miss expectations",
    "below expectations", "below estimates", "fell short",
    "earnings miss", "revenue miss", "profit miss",
    "cuts guidance", "cut guidance", "lowered guidance", "lowers guidance", "guidance cut",
    "downgraded to sell", "downgraded to underperform",
    "price target cut", "price target reduced", "price target lowered",
    "product recall", "safety recall",
    "faces lawsuit", "filed lawsuit", "sec investigation", "regulatory probe",
    "revenue declines", "revenue fell", "revenue dropped",
    "profit falls", "profit fell", "profit dropped",
    "loss widens", "net loss", "operating loss",
    "layoffs announced", "mass layoffs", "job cuts announced",
    "debt crisis", "liquidity crisis",
  ];

  // Weak positive — clear movement words with positive direction
  const WEAK_POSITIVE = ["surges", "surged", "soars", "soared", "jumps", "jumped", "rallies", "rallied", "rebounds", "rebounded"];

  // Weak negative — clear movement words with negative direction
  const WEAK_NEGATIVE = ["plunges", "plunged", "slumps", "slumped", "tanks", "tanked", "tumbles", "tumbled", "collapses", "collapsed"];

  // Negation guard — if these appear within ~50 chars before a positive phrase, ignore it
  const NEGATION_RE = /\b(not|no|never|without|despite|fails?\s+to|unable\s+to|miss(?:es|ed)?|rejects?|denies?)\b/;

  let score = 0;

  for (const phrase of STRONG_POSITIVE) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      const context = lower.slice(Math.max(0, idx - 50), idx);
      if (!NEGATION_RE.test(context)) score += 2;
    }
  }

  for (const phrase of STRONG_NEGATIVE) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      const context = lower.slice(Math.max(0, idx - 50), idx);
      if (!NEGATION_RE.test(context)) score -= 2;
    }
  }

  for (const word of WEAK_POSITIVE) {
    if (lower.includes(word)) score += 1;
  }

  for (const word of WEAK_NEGATIVE) {
    if (lower.includes(word)) score -= 1;
  }

  if (score >= 1) return "positive";
  if (score <= -1) return "negative";
  return "neutral";
}

/**
 * Korean equivalent — same conservative, score-based approach.
 * Handles Naver Finance headlines (Korean stocks).
 */
function deriveSentimentKo(text: string): "positive" | "negative" | "neutral" {
  const STRONG_POSITIVE_KO = [
    "흑자전환", "실적 개선", "목표가 상향", "수주 성공", "턴어라운드",
    "역대 최고", "어닝 서프라이즈", "영업익 증가", "매출 증가", "순이익 증가",
    "신고가", "가이던스 상향", "임상 성공", "허가 승인",
  ];
  const STRONG_NEGATIVE_KO = [
    "적자전환", "실적 부진", "목표가 하향", "소송 제기", "과징금",
    "영업손실", "수주 취소", "대규모 감원", "가이던스 하향", "순손실",
    "매출 감소", "영업익 감소", "임상 실패", "허가 거부", "상장폐지",
  ];
  const WEAK_POSITIVE_KO = ["급등", "강세", "반등", "상승"];
  const WEAK_NEGATIVE_KO = ["급락", "약세", "하락", "폭락"];

  let score = 0;
  for (const w of STRONG_POSITIVE_KO) if (text.includes(w)) score += 2;
  for (const w of STRONG_NEGATIVE_KO) if (text.includes(w)) score -= 2;
  for (const w of WEAK_POSITIVE_KO) if (text.includes(w)) score += 1;
  for (const w of WEAK_NEGATIVE_KO) if (text.includes(w)) score -= 1;

  if (score >= 1) return "positive";
  if (score <= -1) return "negative";
  return "neutral";
}

// ─── Naver Finance news (Korean stocks only) ─────────────────────────────────

interface NaverNewsItem {
  id?: string;
  officeId?: string;
  articleId?: string;
  officeName?: string;
  datetime?: string;   // "202603191650" (YYYYMMDDHHMM KST)
  title?: string;
  titleFull?: string;
  body?: string;
}

interface NaverNewsGroup {
  total?: number;
  items?: NaverNewsItem[];
}

interface ParsedNewsItem {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  url: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  _ts: number;
}

// Fetch the Korean company name from Naver for relevance keyword matching
async function fetchNaverKoreanName(stockCode: string): Promise<string | null> {
  try {
    const resp = await fetch(
      `https://m.stock.naver.com/api/stock/${stockCode}/basic`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
          "Referer": "https://m.stock.naver.com/",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!resp.ok) return null;
    const data = await resp.json() as { stockName?: string };
    return data.stockName ?? null;
  } catch {
    return null;
  }
}

async function fetchNaverNews(stockCode: string): Promise<ParsedNewsItem[]> {
  const url = `https://api.stock.naver.com/news/stock/${stockCode}?type=all&pageSize=12&page=1`;
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": `https://m.stock.naver.com/domestic/stock/${stockCode}/news`,
        "Accept": "application/json, text/plain, */*",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!resp.ok) return [];

    const data: NaverNewsGroup[] = await resp.json() as NaverNewsGroup[];
    const items = data.flatMap((g) => g.items ?? []);

    return items
      .filter((item) => item.officeId && item.articleId && (item.titleFull ?? item.title))
      .map((item, idx) => {
        const dt = item.datetime ?? "";
        // "202603191650" → KST ISO string
        const isoStr = dt.length >= 12
          ? `${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}T${dt.slice(8,10)}:${dt.slice(10,12)}:00+09:00`
          : new Date().toISOString();
        const ts = new Date(isoStr).getTime();
        const headline = (item.titleFull ?? item.title ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
        const body = (item.body ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim().slice(0, 200);

        return {
          id: `naver_${item.id ?? idx}`,
          headline,
          source: item.officeName ?? "네이버 증권",
          publishedAt: new Date(ts).toISOString(),
          url: `https://n.news.naver.com/article/${item.officeId}/${item.articleId}`,
          summary: body || "네이버 금융에서 제공하는 최신 뉴스입니다.",
          sentiment: deriveSentimentKo(headline),
          _ts: ts,
        };
      });
  } catch (err) {
    console.error("[naver-news] Fetch failed:", err);
    return [];
  }
}

function buildWhyItMatters(headline: string): string {
  const sentiment = deriveSentiment(headline);
  const lower = headline.toLowerCase();

  if (lower.includes("earnings") || lower.includes("profit") || lower.includes("revenue") || lower.includes("beat") || lower.includes("miss")) {
    return sentiment === "positive"
      ? `Strong earnings results signal the company is executing well, which typically supports a higher stock price and can attract new investors.`
      : `Weaker-than-expected financial results raise questions about growth momentum and can lead investors to reassess the stock's valuation.`;
  }
  if (lower.includes("acquisition") || lower.includes("merger") || lower.includes("deal") || lower.includes("acquire")) {
    return `Mergers and acquisitions can open new markets or add capabilities, but they also introduce integration risk — investors watch closely to judge whether the deal price is fair.`;
  }
  if (lower.includes("ceo") || lower.includes("chief executive") || lower.includes("leadership") || lower.includes("resign")) {
    return `Executive changes create uncertainty in the short term. Markets often react to who is coming in and what strategic shifts they might bring.`;
  }
  if (lower.includes("fda") || lower.includes("regulat") || lower.includes("probe") || lower.includes("fine") || lower.includes("lawsuit") || lower.includes("antitrust")) {
    return sentiment === "negative"
      ? `Regulatory actions add compliance costs and can restrict operations, putting downward pressure on profitability and investor confidence.`
      : `A favorable regulatory decision removes a key risk overhang, which often allows the stock to re-rate higher.`;
  }
  if (lower.includes("ai") || lower.includes("artificial intelligence") || lower.includes("machine learning")) {
    return sentiment === "positive"
      ? `Progress in AI is a major growth driver investors are paying a premium for. Positive AI news tends to lift sentiment and justify higher valuations.`
      : `AI-related setbacks can weigh on the high expectations already priced into the stock.`;
  }
  if (lower.includes("upgrade") || lower.includes("price target") || lower.includes("analyst")) {
    return sentiment === "positive"
      ? `Analyst upgrades or raised price targets signal that Wall Street expects the stock to outperform, which can attract more buyers.`
      : `A downgrade or reduced price target signals reduced confidence from analysts, which can trigger selling pressure.`;
  }
  if (lower.includes("dividend") || lower.includes("buyback") || lower.includes("repurchase")) {
    return `Dividends and share buybacks return capital to shareholders and signal management's confidence in the company's financial health.`;
  }
  if (lower.includes("supply") || lower.includes("chip") || lower.includes("shortage") || lower.includes("inventory")) {
    return `Supply chain issues or inventory dynamics directly affect a company's ability to meet demand and hit its revenue targets.`;
  }

  return sentiment === "positive"
    ? `This development is seen as a positive signal by investors and may support the stock price in the near term.`
    : sentiment === "negative"
    ? `This news introduces uncertainty or risk that could put downward pressure on the stock price.`
    : `Investors are monitoring this situation for potential impact on the company's business outlook.`;
}

// ─── Relevance scoring ────────────────────────────────────────────────────────

// Derive keywords from company name for relevance matching
function extractCompanyKeywords(name: string, ticker: string): string[] {
  const kws: string[] = [];
  const cleaned = name
    .replace(/Co\.|Corp\.|Ltd\.|Inc\.|PLC|ADR|ETF|Fund|Holdings?|Group/gi, "")
    .trim()
    .toLowerCase();
  kws.push(cleaned);
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 3);
  kws.push(...words.slice(0, 5));
  const base = ticker.includes(".") ? ticker.split(".")[0] : ticker;
  kws.push(base.toLowerCase());
  return [...new Set(kws.filter(Boolean))];
}

// Industry keywords inferred from sector/industry metadata or company name
function extractIndustryKeywords(
  sector?: string | null,
  industry?: string | null,
  companyName?: string,
): string[] {
  const kws: string[] = [];
  if (sector) kws.push(...sector.toLowerCase().split(/\s+/));
  if (industry) kws.push(...industry.toLowerCase().split(/\s+/));

  const SECTOR_MAP: Record<string, string[]> = {
    utilities: ["utility", "utilities", "gas", "power", "electricity", "energy", "water", "electric", "도시가스", "가스", "전기", "수도"],
    energy: ["oil", "gas", "lng", "energy", "crude", "petroleum", "refin", "도시가스", "가스"],
    technology: ["tech", "semiconductor", "software", "ai", "chip", "반도체", "소프트웨어"],
    financials: ["bank", "finance", "insurance", "credit", "loan", "금융", "은행", "보험"],
    healthcare: ["pharma", "biotech", "drug", "medical", "clinical", "병원", "제약", "바이오"],
    "consumer discretionary": ["retail", "consumer", "brand", "fashion", "auto"],
    "consumer staples": ["food", "beverage", "grocery", "consumer"],
    industrials: ["manufacturing", "industrial", "factory", "machinery", "construction"],
    "real estate": ["reit", "property", "real estate", "building", "housing"],
    materials: ["steel", "chemical", "metal", "mining", "copper", "lithium"],
    "communication services": ["telecom", "media", "internet", "streaming", "통신", "미디어"],
  };

  for (const [key, vals] of Object.entries(SECTOR_MAP)) {
    if ((sector ?? "").toLowerCase().includes(key) || (industry ?? "").toLowerCase().includes(key)) {
      kws.push(...vals);
    }
  }

  // Extra inference from company name keywords
  const name = (companyName ?? "").toLowerCase();
  if (name.includes("gas") || name.includes("가스")) kws.push("gas", "lng", "natural gas", "city gas", "도시가스", "가스", "lng", "lpg", "한국가스", "도시가스요금", "유가");
  if (name.includes("semiconductor") || name.includes("반도체")) kws.push("semiconductor", "chip", "wafer", "반도체", "파운드리");
  if (name.includes("bank") || name.includes("은행")) kws.push("bank", "financial", "credit", "은행", "금리", "예금", "대출");
  if (name.includes("bio") || name.includes("pharma") || name.includes("치료")) kws.push("biotech", "clinical", "fda", "drug", "임상", "신약", "바이오");

  return [...new Set(kws.filter((k) => k.length >= 2))];
}

// Score relevance of a headline to a specific company (0-3)
// 3 = direct company mention, 2 = industry/sector match, 1 = general market, 0 = unrelated
function scoreHeadlineRelevance(
  headline: string,
  companyKws: string[],
  industryKws: string[],
): number {
  const lower = headline.toLowerCase();
  for (const kw of companyKws) {
    if (kw.length >= 3 && lower.includes(kw)) return 3;
  }
  for (const kw of industryKws) {
    if (kw.length >= 2 && lower.includes(kw)) return 2;
  }
  return 0;
}

// ─── AI-powered context-aware news summaries ──────────────────────────────────

interface ScoredNewsItem {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  url: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  _ts: number;
  relevanceScore: number;
}

// ─── Language config for AI prompts ──────────────────────────────────────────

const LANG_WRITE: Record<string, string> = {
  en: "English",
  ko: "Korean (한국어)",
  zh: "Simplified Chinese (简体中文)",
};

const PEER_PREFIX: Record<string, string> = {
  en: "As a fellow {{sector}} company in this industry,",
  ko: "같은 {{sector}} 업종의 기업으로서,",
  zh: "作为同一{{sector}}行业的企业，",
};

/**
 * Generates "Why it matters" summaries for a batch of news headlines.
 *
 * AI is used ONLY for the explanatory summary text — not for the visible
 * sentiment badge.  The badge is determined synchronously by deriveSentiment()
 * and never changes after the initial fetch.
 *
 * Returns one summary string per headline, in the user's language.
 */
async function generateAISummaries(
  companyName: string,
  sector: string,
  items: ScoredNewsItem[],
  lang: "en" | "ko" | "zh" = "en",
): Promise<string[]> {
  if (items.length === 0) return [];

  const industryNote = sector ? ` (sector: ${sector})` : "";
  const writeLang = LANG_WRITE[lang] ?? LANG_WRITE.en;
  const peerPrefix = (PEER_PREFIX[lang] ?? PEER_PREFIX.en).replace("{{sector}}", sector || "company");

  const prompt = `You are a financial analyst writing for investors. The company being analyzed is: "${companyName}"${industryNote}.

Write every summary in ${writeLang}.

For each news headline below, write 1-2 concise sentences explaining WHY it matters specifically for "${companyName}" and its investors.
- If the headline is DIRECTLY about ${companyName}: explain the direct impact on the company's financials, operations, or valuation.
- If it's about a PEER or COMPETITOR in the same sector: begin with "${peerPrefix}" and explain how this sector-level development applies to ${companyName}.
- If it's GENERAL MARKET or MACRO news: explain how the macro trend specifically affects ${companyName}'s business model or stock.

Be concrete and company-specific. Avoid generic statements.

Headlines:
${items.map((n, i) => `${i + 1}. [${n.relevanceScore >= 3 ? "direct" : n.relevanceScore >= 2 ? "sector" : "macro"}] ${n.headline}`).join("\n")}

Return ONLY a JSON array of strings (one per headline): ["summary 1", "summary 2", ...]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
    });
    const content = response.choices[0]?.message?.content ?? "[]";
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return items.map((n) => n.summary);
    const parsed = JSON.parse(match[0]) as string[];
    return parsed.length === items.length ? parsed : items.map((n) => n.summary);
  } catch (err) {
    console.error("[ai-summaries] Error:", err);
    return items.map((n) => n.summary);
  }
}

// ─── Korean stock code extractor (e.g. "078160.KQ" → "078160") ───────────────
function koreanStockCode(ticker: string): string | null {
  const upper = ticker.toUpperCase();
  if (upper.endsWith(".KS") || upper.endsWith(".KQ")) {
    return upper.split(".")[0];
  }
  return null;
}

router.get("/:ticker", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  try {
    const stockCode = koreanStockCode(ticker);

    const [quote, chart] = await Promise.all([
      yahooFinance.quote(ticker),
      yahooFinance.chart(ticker, {
        period1: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 35);
          return d;
        })(),
        interval: "1d",
      }),
    ]);

    // Pick the best available name for news search.
    // shortName can be garbage (e.g. "035720.KQ,0P0000AN5S,1145416") for some tickers.
    // longName like "Samsung Electronics Co., Ltd." has commas in legal suffixes — that's fine.
    // We reject only names with multiple comma-separated segments (>2 commas = ID garbage).
    const isUsableName = (s: string | null | undefined): boolean => {
      if (!s || s.length < 2) return false;
      if ((s.match(/,/g) ?? []).length > 2) return false;  // e.g. "0P...,0P...,123456"
      if (/^\d{4,}\.[A-Z]{1,3}/.test(s)) return false;     // starts with numeric ticker
      return true;
    };
    const rawName = isUsableName(quote.longName)
      ? quote.longName!
      : isUsableName(quote.shortName)
      ? quote.shortName!
      : null;

    // Strip legal suffixes from the first match to end-of-string
    // e.g. "Samsung Electronics Co., Ltd." → "Samsung Electronics"
    //      "Apple Inc." → "Apple"
    const newsQuery = rawName
      ? rawName.replace(/[,\s]+(Inc\.?|Corp\.?|Ltd\.?|Co\.?|PLC|ADR|ETF|Fund).*$/gi, "").trim()
      : null;

    const trySearch = (q: string) =>
      yahooFinance.search(q, { newsCount: 15, enableFuzzyQuery: true }).catch(() => ({ news: [] as unknown[] }));

    const hasNews = (r: unknown) => ((r as { news?: unknown[] }).news ?? []).length > 0;

    // Derive an ASCII-only short keyword from the raw name (useful for Korean tickers
    // whose longName is in Hangul – strip all non-ASCII chars and take the first token).
    const asciiKeyword = rawName
      ? rawName.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim().split(" ")[0]
      : null;
    const usableAscii = asciiKeyword && asciiKeyword.length >= 3 && /[a-zA-Z]/.test(asciiKeyword)
      ? asciiKeyword
      : null;

    // Build a base ticker without the exchange suffix for search (e.g. "078160.KQ" → "078160")
    const tickerBase = ticker.includes(".") ? ticker.split(".")[0] : null;

    // Priority: clean name → raw name → ASCII keyword → ticker → ticker base
    let searchResult: unknown = { news: [] };
    if (newsQuery) {
      searchResult = await trySearch(newsQuery);
    }
    if (!hasNews(searchResult) && rawName && rawName !== newsQuery) {
      searchResult = await trySearch(rawName);
    }
    if (!hasNews(searchResult) && usableAscii && usableAscii !== newsQuery) {
      searchResult = await trySearch(usableAscii);
    }
    if (!hasNews(searchResult)) {
      searchResult = await trySearch(ticker);
    }
    if (!hasNews(searchResult) && tickerBase) {
      searchResult = await trySearch(tickerBase);
    }

    const currency = quote.currency ?? "USD";
    const sym = currencySymbol(currency);

    const quotes = chart.quotes ?? [];
    const priceHistory = quotes
      .filter((q) => q.close !== null && q.close !== undefined)
      .map((q) => ({
        date: new Date(q.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: parseFloat((q.close as number).toFixed(isWholeCurrency(currency) ? 0 : 2)),
      }));

    const rawNewsArr = (searchResult as { news?: unknown[] }).news ?? [];

    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const yahooNews: ParsedNewsItem[] = rawNewsArr.map((item: unknown, idx: number) => {
      const n = item as {
        title?: string;
        publisher?: string;
        providerPublishTime?: Date | number;
        link?: string;
        uuid?: string;
      };
      const headline = n.title ?? "Market Update";
      const ts = n.providerPublishTime
        ? (n.providerPublishTime instanceof Date ? n.providerPublishTime.getTime() : Number(n.providerPublishTime) * 1000)
        : Date.now();
      return {
        id: n.uuid ?? String(idx),
        headline,
        source: n.publisher ?? "Yahoo Finance",
        publishedAt: new Date(ts).toISOString(),
        url: n.link ?? "#",
        summary: buildWhyItMatters(headline),
        sentiment: deriveSentiment(headline),
        _ts: ts,
      };
    });

    // For Korean stocks, fetch Naver news + Korean company name in parallel
    const [naverNews, koreanName] = stockCode
      ? await Promise.all([fetchNaverNews(stockCode), fetchNaverKoreanName(stockCode)])
      : [[] as ParsedNewsItem[], null];

    // Merge Yahoo + Naver news, deduplicate by headline prefix
    const allNews = [...yahooNews, ...naverNews];
    const seenHeadlines = new Set<string>();
    const dedupedNews = allNews.filter((n) => {
      const key = n.headline.slice(0, 30).toLowerCase();
      if (seenHeadlines.has(key)) return false;
      seenHeadlines.add(key);
      return true;
    });

    // ── Relevance scoring ──
    const companyForKws = rawName ?? ticker;
    const companyKws = extractCompanyKeywords(companyForKws, ticker);
    // Also add Korean name keywords if available (critical for matching Korean headlines)
    if (koreanName) {
      companyKws.push(koreanName.toLowerCase());
      // Add shorter root (e.g. "인천도시가스" → also try "인천도시", "도시가스")
      const koWords = koreanName.replace(/주식회사|㈜|\(주\)/g, "").trim();
      companyKws.push(koWords.toLowerCase());
      if (koWords.length > 4) {
        companyKws.push(koWords.slice(0, Math.floor(koWords.length * 0.6)).toLowerCase());
      }
    }
    const industryKws = extractIndustryKeywords(
      (quote as { sector?: string }).sector,
      (quote as { industry?: string }).industry,
      companyForKws + (koreanName ? ` ${koreanName}` : ""),
    );

    const scoredNews: ScoredNewsItem[] = dedupedNews.map((n) => ({
      ...n,
      relevanceScore: scoreHeadlineRelevance(n.headline, companyKws, industryKws),
    }));

    // Filter: keep only relevant items (score >= 2 = direct or sector match)
    // Score 1 and 0 are considered too generic
    const relevantNews = scoredNews.filter((n) => n.relevanceScore >= 2);

    // If we have fewer than 3 relevant items, relax to score >= 1, then score 0 as last resort
    const fallbackNews = relevantNews.length >= 3
      ? relevantNews
      : scoredNews.filter((n) => n.relevanceScore >= 1).length >= 3
        ? scoredNews.filter((n) => n.relevanceScore >= 1)
        : scoredNews; // absolute fallback: all items

    // Build final ranked list:
    // 1. Direct company news (score 3) — any date, newest first
    // 2. Sector/industry news (score 2) — any date, newest first (user: "그전거라도 보이고")
    // 3. Recent macro news (score 1, within 14 days)
    // 4. Fallback junk only if absolutely nothing else exists

    const directNews   = fallbackNews.filter((n) => n.relevanceScore >= 3).sort((a, b) => b._ts - a._ts);
    const sectorNews   = fallbackNews.filter((n) => n.relevanceScore === 2).sort((a, b) => b._ts - a._ts);
    const recentMacro  = fallbackNews.filter((n) => n.relevanceScore < 2 && n._ts >= fourteenDaysAgo).sort((a, b) => b._ts - a._ts);
    const oldOther     = fallbackNews.filter((n) => n.relevanceScore < 2 && n._ts < fourteenDaysAgo).sort((a, b) => b._ts - a._ts);

    const newsSource = [...directNews, ...sectorNews, ...recentMacro, ...oldOther];

    // Cap: 10 for Korean stocks, 7 for others
    const newsLimit = stockCode ? 10 : 7;
    const topNews = newsSource.slice(0, newsLimit);

    const sector = (quote as { sector?: string }).sector ?? "";

    const newsItems = topNews.map((n) => ({
      id: n.id,
      headline: n.headline,
      source: n.relevanceScore < 3 && n.relevanceScore >= 2
        ? `업종 | ${n.source}`
        : n.source,
      publishedAt: n.publishedAt,
      url: n.url,
      summary: n.summary,
      sentiment: n.sentiment,
    }));

    const currentPrice = quote.regularMarketPrice ?? 0;
    const previousClose = quote.regularMarketPreviousClose ?? currentPrice;
    const change = parseFloat((currentPrice - previousClose).toFixed(isWholeCurrency(currency) ? 0 : 2));
    const changePercent = parseFloat(((change / previousClose) * 100).toFixed(2));

    const data = GetStockDataResponse.parse({
      ticker,
      companyName: quote.shortName ?? quote.longName ?? ticker,
      currency,
      exchangeName: quote.fullExchangeName ?? quote.exchange ?? "",
      currentPrice,
      previousClose,
      change,
      changePercent,
      high52Week: quote.fiftyTwoWeekHigh ?? currentPrice,
      low52Week: quote.fiftyTwoWeekLow ?? currentPrice,
      marketCap: formatMarketCap(quote.marketCap, sym),
      volume: formatVolume(quote.regularMarketVolume),
      priceHistory,
      news: newsItems,
    });

    res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (
      msg.includes("Not Found") ||
      msg.includes("No fundamentals") ||
      msg.includes("No data found") ||
      msg.includes("404")
    ) {
      res.status(404).json({
        error: `"${ticker}" wasn't found. For US stocks use symbols like AAPL or TSLA. For Korean stocks try formats like 005930.KS (KRX) or 005930.KQ (KOSDAQ).`,
      });
      return;
    }

    console.error(`[stocks] Error fetching ${ticker}:`, err);
    res.status(500).json({ error: `Failed to fetch data for "${ticker}". Please try again shortly.` });
  }
});

// POST /api/stocks/:ticker/insights
// Async AI-powered "Why it matters" summaries — called after the main stock data loads.
// NOTE: Sentiment badges are NOT set here — they are determined synchronously by
// deriveSentiment() during the initial GET and never change.
router.post("/:ticker/insights", async (req, res) => {
  const { companyName, sector, headlines, lang } = req.body as {
    companyName?: string;
    sector?: string;
    headlines?: string[];
    lang?: "en" | "ko" | "zh";
  };

  if (!companyName || !Array.isArray(headlines) || headlines.length === 0) {
    res.json({ summaries: [] });
    return;
  }

  const items: ScoredNewsItem[] = headlines.map((h, i) => ({
    id: String(i),
    headline: h,
    source: "",
    publishedAt: "",
    url: "",
    summary: "",
    sentiment: "neutral",
    _ts: 0,
    relevanceScore: 2,
  }));

  const summaries = await generateAISummaries(companyName, sector ?? "", items, lang ?? "en");
  res.json({ summaries });
});

export default router;
