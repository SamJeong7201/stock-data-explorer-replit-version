import { cn } from "@/lib/utils";

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === "positive") {
    return (
      <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        Bullish
      </span>
    );
  }
  
  if (sentiment === "negative") {
    return (
      <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
        Bearish
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/30">
      Neutral
    </span>
  );
}
