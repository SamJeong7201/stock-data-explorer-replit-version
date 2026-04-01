/**
 * Shared formatting utilities used across multiple API routes.
 * Centralizing here avoids duplication and ensures consistent output.
 */

/** Map of ISO currency codes to display symbols */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  KRW: "₩",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  CNH: "¥",
  HKD: "HK$",
  CAD: "CA$",
  AUD: "A$",
  INR: "₹",
  SGD: "S$",
  TWD: "NT$",
  SEK: "kr",
  CHF: "CHF",
};

/** Returns the display symbol for a currency code (e.g. "USD" → "$") */
export function currencySymbol(code: string | null | undefined): string {
  return CURRENCY_SYMBOLS[code ?? ""] ?? (code ?? "$");
}

/** Formats a market cap number with T/B/M suffix */
export function formatMarketCap(
  value: number | null | undefined,
  currSym = "$",
): string {
  if (!value) return "N/A";
  if (value >= 1e12) return `${currSym}${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${currSym}${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${currSym}${(value / 1e6).toFixed(2)}M`;
  return `${currSym}${value.toFixed(0)}`;
}

/** Formats a trading volume number with K/M/B suffix */
export function formatVolume(value: number | null | undefined): string {
  if (!value) return "N/A";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

/**
 * Returns true if the currency should be displayed as a whole number
 * (no decimal places). Used for KRW, JPY, etc.
 */
export function isWholeCurrency(currency: string): boolean {
  return currency === "KRW" || currency === "JPY";
}
