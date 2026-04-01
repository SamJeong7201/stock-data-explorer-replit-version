import { SENTIMENT_LABELS } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

interface SentimentPillProps {
  sentiment: string;
  lang?: Lang;
}

export function SentimentPill({ sentiment, lang = "en" }: SentimentPillProps) {
  const labels = SENTIMENT_LABELS[lang] ?? SENTIMENT_LABELS.en;

  if (sentiment === "positive") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
        style={{ background: "rgba(0,255,156,0.1)", color: "#00FF9C", border: "1px solid rgba(0,255,156,0.25)" }}
      >
        {labels.positive}
      </span>
    );
  }
  if (sentiment === "negative") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
        style={{ background: "rgba(255,77,77,0.1)", color: "#FF4D4D", border: "1px solid rgba(255,77,77,0.25)" }}
      >
        {labels.negative}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
      style={{ background: "rgba(58,160,255,0.1)", color: "#3AA0FF", border: "1px solid rgba(58,160,255,0.2)" }}
    >
      {labels.neutral}
    </span>
  );
}
