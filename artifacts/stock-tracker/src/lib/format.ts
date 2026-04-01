/**
 * Client-side formatting utilities.
 * These are intentionally separate from the server-side formatters in
 * api-server/src/lib/format.ts to keep the client/server boundary clear.
 */

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: "$", KRW: "₩", EUR: "€", GBP: "£", JPY: "¥",
  CNY: "¥", CNH: "¥", HKD: "HK$", CAD: "CA$", AUD: "A$",
  INR: "₹", SGD: "S$", TWD: "NT$", SEK: "kr", CHF: "CHF",
  BRL: "R$",
};

/** Returns the display symbol for a currency code (e.g. "USD" → "$") */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOL_MAP[currency] ?? currency;
}

/** Returns true for currencies displayed without decimal places (KRW, JPY) */
export function isWholeCurrency(currency: string): boolean {
  return currency === "KRW" || currency === "JPY";
}

/** Formats a price value with the appropriate symbol and decimal precision */
export function formatPrice(value: number, currency: string): string {
  const sym = getCurrencySymbol(currency);
  return isWholeCurrency(currency)
    ? `${sym}${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : `${sym}${value.toFixed(2)}`;
}

/** Formats an ISO date string as a relative time label (e.g. "3h ago") */
export function formatNewsDate(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return iso;
  }
}
