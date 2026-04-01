import { useState, useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api";

interface InsightsResult {
  summaries: string[];
  loading:   boolean;
}

export function useStockInsights(
  ticker: string,
  companyName: string,
  headlines: string[],
  lang: "en" | "ko" | "zh" = "en",
): InsightsResult {
  const [summaries, setSummaries] = useState<string[]>([]);
  const [loading,   setLoading]   = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const newsKey = `${lang}:${headlines.join("|").slice(0, 200)}`;

  useEffect(() => {
    if (!ticker || !companyName || headlines.length === 0) {
      setSummaries([]);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setSummaries([]);
    setLoading(true);

    fetch(apiUrl(`/api/stocks/${encodeURIComponent(ticker)}/insights`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, headlines, lang }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data: { summaries?: string[] }) => {
        if (!ctrl.signal.aborted) {
          setSummaries(data.summaries ?? []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, newsKey]);

  return { summaries, loading };
}
