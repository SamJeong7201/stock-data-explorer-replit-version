import YahooFinance from "yahoo-finance2";

export const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  fetchOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    },
  },
});

export const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? "";

export async function finnhubQuote(ticker: string) {
  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
  if (!r.ok) throw new Error(`Finnhub quote failed: ${r.status}`);
  return r.json();
}

export async function finnhubProfile(ticker: string) {
  const r = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`);
  if (!r.ok) throw new Error(`Finnhub profile failed: ${r.status}`);
  return r.json();
}

export async function finnhubNews(ticker: string) {
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${today}&token=${FINNHUB_KEY}`);
  if (!r.ok) return [];
  return r.json();
}

export async function finnhubCandles(ticker: string) {
  const r = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1mo`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    }
  );
  if (!r.ok) throw new Error(`Chart fetch failed: ${r.status}`);
  const data = await r.json() as any;
  const timestamps = data?.chart?.result?.[0]?.timestamp ?? [];
  const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  return {
    s: "ok",
    t: timestamps,
    c: closes,
  };
}
