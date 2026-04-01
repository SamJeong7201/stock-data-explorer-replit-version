import { useState, useRef, useEffect } from "react";
import {
  Search, Loader2, Bell, Settings, Compass, Sparkles, LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { getCurrencySymbol, isWholeCurrency } from "@/lib/format";
import type { Lang, Translations } from "@/lib/i18n";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { PREMIUM_UI } from "@/lib/premium-i18n";

interface TopNavProps {
  view: "main" | "discover" | "priority";
  onViewChange: (v: "main" | "discover" | "priority") => void;
  ticker: string;
  onSelectTicker: (symbol: string) => void;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  t: Translations;
}

export function TopNav({ view, onViewChange, ticker, onSelectTicker, lang, onLangChange, t }: TopNavProps) {
  const [menuOpen, setMenuOpen]           = useState(false);
  const [searchInput, setSearchInput]     = useState("");
  const [showDropdown, setShowDropdown]   = useState(false);
  const [comingSoon, setComingSoon]       = useState<"bell" | "settings" | null>(null);
  const comingSoonTimerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef                         = useRef<HTMLDivElement>(null);

  const { isProUser, openUpgradeModal } = useSubscription();

  const { suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(searchInput);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setShowDropdown(searchInput.trim().length > 0);
  }, [searchInput]);

  const selectTicker = (symbol: string) => {
    onSelectTicker(symbol);
    setSearchInput("");
    setShowDropdown(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchInput.trim();
    if (!raw) return;
    if (suggestions.length > 0) { selectTicker(suggestions[0].symbol); return; }
    const parts = raw.split(".");
    const normalized = parts.length > 1
      ? parts[0].toUpperCase() + "." + parts.slice(1).join(".").toUpperCase()
      : raw.toUpperCase();
    selectTicker(normalized);
  };

  const showComingSoon = (which: "bell" | "settings") => {
    if (comingSoonTimerRef.current) clearTimeout(comingSoonTimerRef.current);
    setComingSoon(v => v === which ? null : which);
    comingSoonTimerRef.current = setTimeout(() => setComingSoon(null), 3000);
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-5 h-14 shrink-0 gap-2"
      style={{
        background: "rgba(11,15,20,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo + nav menu ── */}
      <div className="relative flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="flex flex-col leading-none transition-opacity hover:opacity-75"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <span className="font-display font-bold text-sm tracking-tight text-white">OmniAlpha</span>
          <span className="text-[9px] font-medium tracking-widest uppercase" style={{ color: "#3AA0FF" }}>
            Labs
          </span>
        </button>

        {menuOpen && (
          <div
            className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden"
            style={{
              background: "#121821",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
              zIndex: 100,
              minWidth: "140px",
            }}
          >
            {(["main", "discover", "priority"] as const).map((v, i) => (
              <button
                key={v}
                onClick={() => { onViewChange(v); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium"
                style={{
                  color: view === v ? "#3AA0FF" : "rgba(255,255,255,0.85)",
                  background: view === v ? "rgba(58,160,255,0.08)" : "transparent",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(58,160,255,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = view === v ? "rgba(58,160,255,0.08)" : "transparent")}
              >
                {v === "main"
                  ? (lang === "ko" ? "메인" : lang === "zh" ? "主页" : "Main")
                  : v === "discover"
                  ? (lang === "ko" ? "유망주" : lang === "zh" ? "探索" : "Discover")
                  : PREMIUM_UI[lang].priority.tab}
              </button>
            ))}
          </div>
        )}

        {/* Page indicator pill — hidden on mobile to save space */}
        <AnimatePresence mode="wait">
          {view === "discover" ? (
            <motion.div
              key="disc"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(255,156,0,0.12)", color: "#FF9C00", border: "1px solid rgba(255,156,0,0.25)" }}
            >
              <Compass className="w-2.5 h-2.5" />
              {lang === "ko" ? "유망주" : lang === "zh" ? "探索" : "Discover"}
            </motion.div>
          ) : view === "priority" ? (
            <motion.div
              key="priority"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(58,160,255,0.1)", color: "#3AA0FF", border: "1px solid rgba(58,160,255,0.25)" }}
            >
              <LayoutDashboard className="w-2.5 h-2.5" />
              {PREMIUM_UI[lang].priority.tab}
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(58,160,255,0.08)", color: "rgba(58,160,255,0.6)", border: "1px solid rgba(58,160,255,0.15)" }}
            >
              {lang === "ko" ? "메인" : lang === "zh" ? "主页" : "Main"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Search — hidden on mobile (icon-only button shown in right area) ── */}
      <div ref={searchRef} className="flex-1 max-w-[480px] mx-3 sm:mx-6 relative hidden sm:block">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: "rgba(255,255,255,0.3)" }} />
          {suggestionsLoading && searchInput.length > 0 && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin z-10" style={{ color: "#3AA0FF" }} />
          )}
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onFocus={() => searchInput.trim().length > 0 && setShowDropdown(true)}
            placeholder={t.searchPlaceholder}
            className="w-full text-sm py-2 pl-10 pr-10 rounded-lg font-medium transition-all outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.9)",
            }}
            onFocusCapture={e => ((e.target as HTMLInputElement).style.borderColor = "rgba(58,160,255,0.5)")}
            onBlurCapture={e  => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)")}
          />
        </form>

        <AnimatePresence>
          {showDropdown && (suggestions.length > 0 || suggestionsLoading) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-1.5 left-0 right-0 rounded-xl overflow-hidden z-50"
              style={{ background: "#16202E", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}
            >
              {suggestionsLoading && suggestions.length === 0 ? (
                <div className="flex items-center gap-2.5 px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
                </div>
              ) : (
                <ul>
                  {suggestions.map((s, i) => {
                    const sym = getCurrencySymbol(s.currency ?? "USD");
                    const priceStr = s.price != null
                      ? isWholeCurrency(s.currency ?? "")
                        ? `${sym}${Math.round(s.price).toLocaleString()}`
                        : `${sym}${s.price.toFixed(2)}`
                      : null;
                    const pctStr  = s.changePercent != null
                      ? (s.changePercent >= 0 ? "+" : "") + s.changePercent.toFixed(2) + "%"
                      : null;
                    const isUp = (s.changePercent ?? 0) >= 0;

                    return (
                      <li key={s.symbol}>
                        <button
                          type="button"
                          onClick={() => selectTicker(s.symbol)}
                          className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                          style={{ borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(58,160,255,0.08)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-semibold truncate leading-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                              {s.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-bold" style={{ color: "#3AA0FF" }}>{s.symbol}</span>
                              <span
                                className="text-[10px] px-1.5 py-px rounded"
                                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
                              >
                                {s.exchange}
                              </span>
                            </div>
                          </div>
                          {priceStr && (
                            <div className="flex flex-col items-end shrink-0">
                              <span className="font-mono text-sm font-bold" style={{ color: "rgba(255,255,255,0.88)" }}>
                                {priceStr}
                              </span>
                              {pctStr && (
                                <span className="font-mono text-[10px] font-semibold" style={{ color: isUp ? "#00FF9C" : "#FF4D4D" }}>
                                  {pctStr}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">

        {/* Mobile search icon — tap to jump to search on mobile */}
        <button
          className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)" }}
          onClick={() => {
            // Focus the hidden search by temporarily showing it via a URL trick — instead,
            // open a native prompt as a minimal fallback for mobile
            const q = window.prompt("Search ticker or company…");
            if (!q?.trim()) return;
            const raw = q.trim();
            const parts = raw.split(".");
            const sym = parts.length > 1
              ? parts[0].toUpperCase() + "." + parts.slice(1).join(".").toUpperCase()
              : raw.toUpperCase();
            onSelectTicker(sym);
          }}
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Language toggle — short labels on mobile, full on desktop */}
        <div
          className="flex items-center rounded-lg p-0.5 gap-0.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {(["en", "ko", "zh"] as const).map(l => (
            <button
              key={l}
              onClick={() => onLangChange(l)}
              className="px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-bold transition-all"
              style={lang === l
                ? { background: "#3AA0FF", color: "#0B0F14" }
                : { color: "rgba(255,255,255,0.35)" }
              }
            >
              {/* Short on all screens — compact and never wraps */}
              {l === "en" ? "EN" : l === "ko" ? "KO" : "ZH"}
            </button>
          ))}
        </div>

        {/* Subscription status */}
        {isProUser ? (
          <PremiumBadge size="md" />
        ) : (
          <button
            onClick={openUpgradeModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(249,115,22,0.12))", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <Sparkles className="w-3 h-3" />
            {PREMIUM_UI[lang].upgradeBtn}
          </button>
        )}

        {/* Bell — hidden on mobile */}
        <div className="hidden sm:block">
          <IconButton
            icon={<Bell className="w-4 h-4" />}
            active={comingSoon === "bell"}
            tooltipText={t.comingSoon}
            tooltipEmoji="🔔"
            showTooltip={comingSoon === "bell"}
            onClick={() => showComingSoon("bell")}
          />
        </div>

        {/* Settings — hidden on mobile */}
        <div className="hidden sm:block">
          <IconButton
            icon={<Settings className="w-4 h-4" />}
            active={comingSoon === "settings"}
            tooltipText={t.comingSoon}
            tooltipEmoji="⚙️"
            showTooltip={comingSoon === "settings"}
            onClick={() => showComingSoon("settings")}
          />
        </div>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full ml-0.5 sm:ml-1 flex items-center justify-center font-bold text-xs"
          style={{ background: "linear-gradient(135deg,#3AA0FF,#0052cc)", color: "white" }}
        >
          OA
        </div>
      </div>
    </header>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  active: boolean;
  tooltipText: string;
  tooltipEmoji: string;
  showTooltip: boolean;
  onClick: () => void;
}

function IconButton({ icon, active, tooltipText, tooltipEmoji, showTooltip, onClick }: IconButtonProps) {
  return (
    <div className="relative">
      <button
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{
          color: active ? "#3AA0FF" : "rgba(255,255,255,0.4)",
          background: active ? "rgba(58,160,255,0.1)" : "transparent",
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
          }
        }}
        onClick={onClick}
      >
        {icon}
      </button>
      {showTooltip && (
        <div
          className="absolute top-full right-0 mt-2 z-50 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-pre-line text-center pointer-events-none"
          style={{
            background: "#1A2234",
            border: "1px solid rgba(58,160,255,0.25)",
            color: "rgba(255,255,255,0.75)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            minWidth: "160px",
          }}
        >
          <span className="block text-[10px] font-bold mb-0.5" style={{ color: "#3AA0FF" }}>
            {tooltipEmoji}
          </span>
          {tooltipText}
        </div>
      )}
    </div>
  );
}
