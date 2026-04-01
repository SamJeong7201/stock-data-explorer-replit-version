import { useGetStockData } from "@workspace/api-client-react";

/**
 * Custom wrapper hook for fetching stock data.
 * Auto-refreshes every 30 seconds for live price updates.
 */
export function useStock(ticker: string) {
  return useGetStockData(ticker, {
    query: {
      retry: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
      enabled: Boolean(ticker && ticker.trim() !== ""),
      // Auto-poll every 15 seconds for live price updates
      refetchInterval: 15_000,
    }
  });
}
