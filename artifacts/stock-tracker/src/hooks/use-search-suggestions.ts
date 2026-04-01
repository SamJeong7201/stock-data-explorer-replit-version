import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

export interface SearchSuggestion {
  symbol: string;
  name: string;
  exchange: string;
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
}

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(q)}`), {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results ?? []);
        }
      } catch {
        // Aborted or network error — ignore
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { suggestions, isLoading };
}
