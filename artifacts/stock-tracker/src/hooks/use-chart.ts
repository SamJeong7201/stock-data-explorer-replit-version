import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

export type ChartRange = "1d" | "3d" | "1w" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "max";

export interface ChartPoint {
  date: string;
  timestamp: number;
  price: number;
  volume: number;
}

export interface ChartData {
  ticker: string;
  range: ChartRange;
  currency: string;
  points: ChartPoint[];
}

export function useChart(ticker: string, range: ChartRange) {
  const [data, setData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/stocks/${encodeURIComponent(ticker)}/chart?range=${range}`), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Chart fetch failed");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError((e as Error).message);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [ticker, range]);

  return { data, isLoading, error };
}
