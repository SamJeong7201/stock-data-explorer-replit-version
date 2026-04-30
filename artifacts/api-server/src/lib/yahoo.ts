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
  const today = new Date().toISOString().slice(0,10);
  const from = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10);
  const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${today}&token=${FINNHUB_KEY}`);
  if (!r.ok) return [];
  return r.json();
}

export async function finnhubCandles(ticker: string) {
  const to = Math.floor(Date.now()/1000);
  const from = to - 35*24*60*60;
  const r = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
  if (!r.ok) throw new Error(`Finnhub candles failed: ${r.status}`);
  return r.json();
}
