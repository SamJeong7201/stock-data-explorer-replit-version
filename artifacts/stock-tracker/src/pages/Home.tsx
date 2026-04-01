import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { DiscoverPage } from "./Discover";
import { PriorityBoardPanel } from "@/components/priority/PriorityBoardPanel";
import { useStock } from "@/hooks/use-stock";
import { UI_TRANSLATIONS } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import { TopNav } from "@/components/layout/TopNav";
import { WatchlistBar } from "@/components/layout/WatchlistBar";
import { PriceHeroCard } from "@/components/stock/PriceHeroCard";
import { ChartCard } from "@/components/stock/ChartCard";
import { ProfitCalculator } from "@/components/stock/ProfitCalculator";
import { NewsPanel } from "@/components/stock/NewsPanel";
import { AIDeepReport } from "@/components/premium/AIDeepReport";
import { EmailDigestPreview } from "@/components/premium/EmailDigestPreview";
import { PricingSection } from "@/components/premium/PricingSection";

export default function Home() {
  const [view, setView]         = useState<"main" | "discover" | "priority">("main");
  const [ticker, setTicker]     = useState("AAPL");
  const { lang, setLang }       = useLang();

  const { data, isLoading, error, dataUpdatedAt } = useStock(ticker);

  const t           = UI_TRANSLATIONS[lang];
  const currency    = data?.currency ?? "USD";
  const isPositive  = data ? data.change >= 0 : true;

  const selectTicker = (symbol: string) => setTicker(symbol);

  const errorMessage = (() => {
    if (!error) return null;
    const err = error as { message?: string; data?: { error?: string } };
    if (err?.data?.error) return err.data.error;
    const msg = err?.message ?? "An unexpected error occurred. Please try again.";
    const idx = msg.indexOf(": ");
    return idx !== -1 ? msg.slice(idx + 2) : msg;
  })();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B0F14" }}>

      <TopNav
        view={view}
        onViewChange={setView}
        ticker={ticker}
        onSelectTicker={selectTicker}
        lang={lang}
        onLangChange={setLang}
        t={t}
      />

      <WatchlistBar
        ticker={ticker}
        onSelectTicker={selectTicker}
        t={t}
        lang={lang}
        exchangeName={data?.exchangeName}
        currency={currency}
        hasData={Boolean(data)}
      />

      {/* ── Discover page ── */}
      <AnimatePresence mode="wait">
        {view === "discover" && (
          <motion.div
            key="discover"
            className="flex-1 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <DiscoverPage
              lang={lang}
              onSelectTicker={sym => { selectTicker(sym); setView("main"); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Priority Board page ── */}
      <AnimatePresence mode="wait">
        {view === "priority" && (
          <motion.div
            key="priority"
            className="flex-1 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <PriorityBoardPanel
              lang={lang}
              onSelectTicker={sym => { selectTicker(sym); setView("main"); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      {view === "main" && (
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-5 py-5">
            <AnimatePresence mode="wait">

              {/* Loading skeleton */}
              {isLoading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="h-28 rounded-2xl animate-pulse mb-5" style={{ background: "#121821" }} />
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
                    <div className="space-y-5">
                      <div className="h-[420px] rounded-2xl animate-pulse" style={{ background: "#121821" }} />
                      <div className="h-48 rounded-2xl animate-pulse" style={{ background: "#121821" }} />
                    </div>
                    <div className="h-[640px] rounded-2xl animate-pulse" style={{ background: "#121821" }} />
                  </div>
                </motion.div>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="mt-20 flex flex-col items-center text-center"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.2)" }}
                  >
                    <AlertCircle className="w-7 h-7" style={{ color: "#FF4D4D" }} />
                  </div>
                  <h2 className="text-xl font-display font-bold text-white mb-2">{t.notFound}</h2>
                  <p className="text-sm max-w-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {errorMessage}
                  </p>
                  <p className="text-xs mb-7" style={{ color: "rgba(255,255,255,0.25)" }}>{t.notFoundSub}</p>
                  <button
                    onClick={() => selectTicker("AAPL")}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ background: "#3AA0FF", color: "#0B0F14" }}
                  >
                    {t.backToDefault}
                  </button>
                </motion.div>
              )}

              {/* Data loaded */}
              {data && !isLoading && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <PriceHeroCard
                    data={data}
                    isPositive={isPositive}
                    t={t}
                    dataUpdatedAt={dataUpdatedAt ?? 0}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
                    {/* ── Left column ── */}
                    <div className="space-y-5 min-w-0">
                      <ChartCard
                        ticker={ticker}
                        currency={currency}
                        isPositive={isPositive}
                        t={t}
                      />
                      <ProfitCalculator
                        currentPrice={data.currentPrice}
                        currency={currency}
                        t={t}
                      />

                      {/* AI Deep Report (Pro gate inside component) */}
                      <AIDeepReport
                        ticker={ticker}
                        companyName={data.companyName}
                        currentPrice={data.currentPrice}
                        changePercent={data.changePercent}
                        currency={currency}
                        lang={lang}
                      />

                      {/* Email Digest (Pro gate inside component) */}
                      <EmailDigestPreview
                        ticker={ticker}
                        companyName={data.companyName}
                        lang={lang}
                      />

                      {/* Pricing section */}
                      <PricingSection lang={lang} />
                    </div>

                    {/* ── Right column: news panel ── */}
                    <NewsPanel
                      ticker={ticker}
                      companyName={data.companyName}
                      news={data.news ?? []}
                      lang={lang}
                      t={t}
                    />
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      )}

    </div>
  );
}
