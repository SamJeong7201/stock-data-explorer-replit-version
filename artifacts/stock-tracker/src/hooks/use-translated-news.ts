import { useState, useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api";

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  sentiment: string;
  source: string;
  publishedAt: string;
  url?: string;
}

export function useTranslatedNews(news: NewsItem[], lang: "en" | "ko" | "zh") {
  const [translatedNews, setTranslatedNews] = useState<NewsItem[]>(news);
  const [isTranslating, setIsTranslating] = useState(false);

  const newsKey = news.map((n) => n.id).join(",");
  const prevKeyRef = useRef("");
  const prevLangRef = useRef<"en" | "ko" | "zh">("en");

  useEffect(() => {
    const keyChanged = newsKey !== prevKeyRef.current;
    const langChanged = lang !== prevLangRef.current;

    if (!keyChanged && !langChanged) return;

    prevKeyRef.current = newsKey;
    prevLangRef.current = lang;

    if (lang === "en" || news.length === 0) {
      setTranslatedNews(news);
      setIsTranslating(false);
      return;
    }

    const controller = new AbortController();
    setIsTranslating(true);

    (async () => {
      try {
        const res = await fetch(apiUrl("/api/translate/news"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ news, lang }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setTranslatedNews(data.news ?? news);
        }
      } catch {
        setTranslatedNews(news);
      } finally {
        setIsTranslating(false);
      }
    })();

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsKey, lang]);

  // When news resets (new ticker in EN mode), sync immediately
  useEffect(() => {
    if (lang === "en") {
      setTranslatedNews(news);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsKey]);

  return { translatedNews, isTranslating };
}
