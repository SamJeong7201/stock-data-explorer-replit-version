/**
 * PriorityAddBar
 *
 * Ticker search + add bar for the Priority Board.
 * Shares the same autocomplete pattern as WatchlistAddBar but uses PriorityBoardStrings.
 */

import { useState, useRef, useEffect } from "react";
import { Plus, Search, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import type { WatchlistItemInput } from "@/services/watchlist-storage";
import type { PriorityBoardStrings } from "@/lib/premium-i18n";

type FeedbackKind = "duplicate" | "limit" | "added" | null;

interface PriorityAddBarProps {
  onAdd:        (input: WatchlistItemInput) => Promise<{ ok: boolean; reason?: "duplicate" | "limit" }>;
  limitReached: boolean;
  isProUser:    boolean;
  onUpgrade:    () => void;
  strings:      PriorityBoardStrings;
}

export function PriorityAddBar({
  onAdd, limitReached, isProUser, onUpgrade, strings: s,
}: PriorityAddBarProps) {
  const [input,    setInput]    = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackKind>(null);
  const [adding,   setAdding]   = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading: sugLoading } = useSearchSuggestions(input);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setShowDrop(input.trim().length > 0); }, [input]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(t);
  }, [feedback]);

  const resolveItem = (symbol: string, name?: string): WatchlistItemInput => {
    const upper = symbol.toUpperCase();
    const market: WatchlistItemInput["market"] =
      upper.endsWith(".KS") || upper.endsWith(".KQ") ? "KR" :
      upper.endsWith(".HK") ? "HK" : "US";
    return { symbol: upper, displayName: name ?? upper, market };
  };

  const submit = async (symbol: string, name?: string) => {
    if (!symbol.trim() || adding) return;
    setAdding(true);
    setShowDrop(false);
    const result = await onAdd(resolveItem(symbol, name));
    setAdding(false);
    if (result.ok) {
      setInput("");
      setFeedback("added");
    } else {
      setFeedback(result.reason ?? null);
    }
  };

  const handleForm = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    if (suggestions.length > 0) {
      submit(suggestions[0].symbol, suggestions[0].name);
    } else {
      const parts = raw.split(".");
      const sym = parts.length > 1
        ? parts[0].toUpperCase() + "." + parts.slice(1).join(".").toUpperCase()
        : raw.toUpperCase();
      submit(sym);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleForm} className="flex items-center gap-2">
        <div
          className="flex items-center flex-1 gap-2 px-3.5 py-2.5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${
              feedback === "duplicate" || feedback === "limit"
                ? "rgba(255,77,77,0.35)"
                : feedback === "added"
                ? "rgba(0,255,156,0.25)"
                : "rgba(255,255,255,0.08)"
            }`,
          }}
        >
          {adding || sugLoading
            ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />
            : <Search  className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
          }
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={s.addPlaceholder}
            disabled={adding}
            className="flex-1 bg-transparent text-xs font-medium outline-none placeholder:font-normal"
            style={{ color: "rgba(255,255,255,0.85)", minWidth: 0 }}
          />
        </div>

        {limitReached && !isProUser ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0B0F14" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Pro
          </button>
        ) : (
          <button
            type="submit"
            disabled={adding || !input.trim()}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: "#3AA0FF", color: "#0B0F14" }}
          >
            <Plus className="w-3.5 h-3.5" />
            {s.addBtn}
          </button>
        )}
      </form>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 mt-1.5 z-20"
          >
            {(feedback === "duplicate" || feedback === "limit") ? (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.2)", color: "#FF4D4D" }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {feedback === "duplicate" ? s.duplicate : s.limitMsg(5)}
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: "rgba(0,255,156,0.08)", border: "1px solid rgba(0,255,156,0.15)", color: "#00FF9C" }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {s.addBtn}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDrop && suggestions.length > 0 && !adding && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-12 mt-1.5 rounded-xl overflow-hidden z-30"
            style={{
              background: "#1A2233",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            }}
          >
            {suggestions.slice(0, 6).map(sug => (
              <button
                key={sug.symbol}
                type="button"
                onClick={() => submit(sug.symbol, sug.name)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(58,160,255,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span className="font-mono text-xs font-black w-20 shrink-0" style={{ color: "#3AA0FF" }}>
                  {sug.symbol}
                </span>
                <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {sug.name}
                </span>
                {sug.exchange && (
                  <span className="ml-auto text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {sug.exchange}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
