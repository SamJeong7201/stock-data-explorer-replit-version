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

function deriveSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();
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
  const WEAK_POSITIVE = ["surges", "surged", "soars", "soared", "jumps", "jumped", "rallies", "rallied", "rebounds", "rebounded"];
  const WEAK_NEGATIVE = ["plunges", "plunged", "slumps", "slumped", "tanks", "tanked", "tumbles", "tumbled", "collapses", "collapsed"];
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
  for (const word of WEAK_POSITIVE) if (lower.includes(word)) score += 1;
  for (const word of WEAK_NEGATIVE) if (lower.includes(word)) score -= 1;

  if (score >= 1) return "positive";
  if (score <= -1) return "negative";
  return "neutral";
}

function deriveSentimentKo(text: string): "positive" | "negative" | "neutral" {
  const STRONG_POSITIVE_KO = ["흑자전환", "실적 개선", "목표가 상향", "수주 성공", "턴어라운드", "역대 최고", "어닝 서프라이즈", "영업익 증가", "매출 증가", "순이익 증가", "신고가", "가이던스 상향", "임상 성공", "허가 승인"];
  const STRONG_NEGATIVE_KO = ["적자전환", "실적 부진", "목표가 하향", "소송 제기", "과징금", "영업손실", "수주 취소", "대규모 감원", "가이던스 하향", "순손실", "매출 감소", "영업익 감소", "임상 실패", "허가 거부", "상장폐지"];
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

interface NaverNewsItem {
  id?: string;
  officeId?: string;
  articleId?: string;
  officeName?: string;
  datetime?: string;
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

interface ScoredNewsItem extends ParsedNewsItem {
  relevanceScore: number;
}

async function fetchNaverKoreanName(stockCode: string): Promise<string | null> {
  try {
    const resp = await fetch(`https://m.stock.naver.com/api/stock/${stockCode}/basic`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://m.stock.naver.com/",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
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

function extractCompanyKeywords(name: string, ticker: string): string[] {
  const kws: string[] = [];
  const cleaned = name.replace(/Co\.|Corp\.|Ltd\.|Inc\.|PLC|ADR|ETF|Fund|Holdings?|Group/gi, "").trim().toLowerCase();
  kws.push(cleaned);
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 3);
  kws.push(...words.slice(0, 5));
  const base = ticker.includes(".") ? ticker.split(".")[0] : ticker;
  kws.push(base.toLowerCase());
  return [...new Set(kws.filter(Boolean))];
}

function extractIndustryKeywords(sector?: string | null, industry?: string | null, companyName?: string): string[] {
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
  const name = (companyName ?? "").toLowerCase();
  if (name.includes("gas") || name.includes("가스")) kws.push("gas", "lng", "natural gas", "city gas", "도시가스", "가스", "lpg");
  if (name.includes("semiconductor") || name.includes("반도체")) kws.push("semiconductor", "chip", "wafer", "반도체", "파운드리");
  if (name.includes("bank") || name.includes("은행")) kws.push("bank", "financial", "credit", "은행", "금리", "예금", "대출");
  if (name.includes("bio") || name.includes("pharma") || name.includes("치료")) kws.push("biotech", "clinical", "fda", "drug", "임상", "신약", "바이오");
  return [...new Set(kws.filter((k) => k.length >= 2))];
}

function scoreHeadlineRelevance(headline: string, companyKws: string[], industryKws: string[]): number {
  const lower = headline.toLowerCase();
  for (const kw of companyKws) if (kw.length >= 3 && lower.includes(kw)) return 3;
  for (const kw of industryKws) if (kw.length >= 2 && lower.includes(kw)) return 2;
  return 0;
}

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

function koreanStockCode(ticker: string): string | null {
  const upper = ticker.toUpperCase();
  if (upper.endsWith(".KS") || upper.endsWith(".KQ")) return upper.split(".")[0];
  return null;
}

router.get("/:ticker", async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const stockCode = koreanStockCode(ticker);

    const [quoteRaw, candlesRaw, profileRaw] = await Promise.all([
      finnhubQuote(ticker),
      finnhubCandles(ticker),
      finnhubProfile(ticker),
    ]);

    const currentPrice: number = quoteRaw.c ?? 0;
    const previousClose: number = quoteRaw.pc ?? currentPrice;
    const companyName: string = profileRaw.name ?? ticker;
    const currency: string = profileRaw.currency ?? "USD";
    const exchangeName: string = profileRaw.exchange ?? "";
    const marketCapRaw: number = (profileRaw.marketCapitalization ?? 0) * 1_000_000;
    const sector: string = profileRaw.finnhubIndustry ?? "";
    const sym = currencySymbol(currency);
    const change = parseFloat((currentPrice - previousClose).toFixed(isWholeCurrency(currency) ? 0 : 2));
    const changePercent = previousClose ? parseFloat(((change / previousClose) * 100).toFixed(2)) : 0;

    const priceHistory: { date: string; price: number }[] = [];
    if (candlesRaw.s === "ok" && Array.isArray(candlesRaw.t)) {
      for (let i = 0; i < candlesRaw.t.length; i++) {
        const close = candlesRaw.c?.[i];
        if (close != null) {
          priceHistory.push({
            date: new Date(candlesRaw.t[i] * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            price: parseFloat(close.toFixed(isWholeCurrency(currency) ? 0 : 2)),
          });
        }
      }
    }

    const [finnhubNewsArr, naverNews, koreanName] = await Promise.all([
      finnhubNews(ticker),
      stockCode ? fetchNaverNews(stockCode) : Promise.resolve([] as ParsedNewsItem[]),
      stockCode ? fetchNaverKoreanName(stockCode) : Promise.resolve(null),
    ]);

    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const parsedFinnhubNews: ParsedNewsItem[] = (finnhubNewsArr as {
      id?: number; headline?: string; source?: string; datetime?: number; url?: string;
    }[]).map((item, idx) => {
      const headline = item.headline ?? "Market Update";
      const ts = (item.datetime ?? 0) * 1000;
      return {
        id: String(item.id ?? idx),
        headline,
        source: item.source ?? "Finnhub",
        publishedAt: new Date(ts).toISOString(),
        url: item.url ?? "#",
        summary: buildWhyItMatters(headline),
        sentiment: deriveSentiment(headline),
        _ts: ts,
      };
    });

    const allNews = [...parsedFinnhubNews, ...naverNews];
    const seenHeadlines = new Set<string>();
    const dedupedNews = allNews.filter((n) => {
      const key = n.headline.slice(0, 30).toLowerCase();
      if (seenHeadlines.has(key)) return false;
      seenHeadlines.add(key);
      return true;
    });

    const companyKws = extractCompanyKeywords(companyName, ticker);
    if (koreanName) {
      companyKws.push(koreanName.toLowerCase());
      const koWords = koreanName.replace(/주식회사|㈜|\(주\)/g, "").trim();
      companyKws.push(koWords.toLowerCase());
      if (koWords.length > 4) companyKws.push(koWords.slice(0, Math.floor(koWords.length * 0.6)).toLowerCase());
    }
    const industryKws = extractIndustryKeywords(sector, sector, companyName + (koreanName ? ` ${koreanName}` : ""));

    const scoredNews: ScoredNewsItem[] = dedupedNews.map((n) => ({
      ...n,
      relevanceScore: scoreHeadlineRelevance(n.headline, companyKws, industryKws),
    }));

    const relevantNews = scoredNews.filter((n) => n.relevanceScore >= 2);
    const fallbackNews = relevantNews.length >= 3 ? relevantNews
      : scoredNews.filter((n) => n.relevanceScore >= 1).length >= 3 ? scoredNews.filter((n) => n.relevanceScore >= 1)
      : scoredNews;

    const directNews  = fallbackNews.filter((n) => n.relevanceScore >= 3).sort((a, b) => b._ts - a._ts);
    const sectorNews  = fallbackNews.filter((n) => n.relevanceScore === 2).sort((a, b) => b._ts - a._ts);
    const recentMacro = fallbackNews.filter((n) => n.relevanceScore < 2 && n._ts >= fourteenDaysAgo).sort((a, b) => b._ts - a._ts);
    const oldOther    = fallbackNews.filter((n) => n.relevanceScore < 2 && n._ts < fourteenDaysAgo).sort((a, b) => b._ts - a._ts);

    const newsLimit = stockCode ? 10 : 7;
    const topNews = [...directNews, ...sectorNews, ...recentMacro, ...oldOther].slice(0, newsLimit);

    const newsItems = topNews.map((n) => ({
      id: n.id,
      headline: n.headline,
      source: n.relevanceScore < 3 && n.relevanceScore >= 2 ? `업종 | ${n.source}` : n.source,
      publishedAt: n.publishedAt,
      url: n.url,
      summary: n.summary,
      sentiment: n.sentiment,
    }));

    const data = GetStockDataResponse.parse({
      ticker,
      companyName,
      currency,
      exchangeName,
      currentPrice,
      previousClose,
      change,
      changePercent,
      high52Week: quoteRaw.h ?? currentPrice,
      low52Week: quoteRaw.l ?? currentPrice,
      marketCap: formatMarketCap(marketCapRaw, sym),
      volume: formatVolume(quoteRaw.v),
      priceHistory,
      news: newsItems,
    });

    res.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error? err.message : String(err);
    if (msg.includes("Not Found") || msg.includes("No fundamentals") || msg.includes("No data found") || msg.includes("404")) {
      res.status(404).json({ error: `"${ticker}" wasn't found.` });
      return;
    }
    console.error(`[stocks] Error fetching ${ticker}:`, err);
    res.status(500).json({ error: `Failed to fetch data for "${ticker}". Please try again shortly.` });
  }
});

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
