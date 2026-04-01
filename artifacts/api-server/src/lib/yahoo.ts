import YahooFinance from "yahoo-finance2";

/**
 * Shared Yahoo Finance client instance.
 * Instantiated once and reused across all routes to avoid
 * multiple initializations and redundant validation noise.
 */
export const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});
