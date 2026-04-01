import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

export interface TrendItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: string;
  currency: string;
}

export interface TrendingData {
  trending: TrendItem[];
  mostActive: TrendItem[];
}

export function useTrending(market: "us" | "kr" | "cn") {
  const [data, setData] = useState<TrendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/trending?market=${market}`), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch trending");
        const json = await res.json();
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
  }, [market]);

  return { data, isLoading, error };
}
