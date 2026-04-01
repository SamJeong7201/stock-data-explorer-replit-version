/**
 * NewsPanel
 *
 * Design philosophy:
 *   The AI-generated "WHY IT MATTERS" summary is the primary content.
 *   The external source link is a deliberate secondary action so users
 *   are never left blocked by a paywall after clicking.
 *
 * Source link UX:
 *   - Labeled clearly as "Source" (not "Read more" or an unlabeled icon).
 *   - A "may require subscription" note appears on all external articles.
 *   - A "likely paywalled" badge appears when the domain is on the known
 *     paywall list, so users know before they click.
 *   - All strings come from i18n — no hardcoded language conditions.
 *
 * Language-awareness:
 *   - All static strings: i18n `t` prop (Translations type)
 *   - AI summaries:  useStockInsights(... lang) — generates native content
 *   - Translated headlines/summaries: useTranslatedNews(... lang)
 *   - No lang === "ko" / lang === "zh" conditions anywhere in this file.
 */

import type { ReactNode } from "react";
import { Newspaper, Clock, ExternalLink, Languages, Loader2, Lock, Sparkles, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslatedNews } from "@/hooks/use-translated-news";
import { useStockInsights } from "@/hooks/use-stock-insights";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SentimentPill } from "./SentimentPill";
import { formatNewsDate } from "@/lib/format";
import { FEATURES } from "@/lib/subscription";
import { makeTranslateUrl, shouldShowTranslate } from "@/lib/translate";
import type { Lang, Translations } from "@/lib/i18n";

const FREE_NEWS_LIMIT = 3;

/**
 * Domains that commonly gate content behind a subscription.
 * Used to show a "likely paywalled" warning before the user clicks.
 */
const PAYWALLED_DOMAINS = new Set([
  "wsj.com",
  "ft.com",
  "nytimes.com",
  "barrons.com",
  "bloomberg.com",
  "economist.com",
  "seekingalpha.com",
  "thetimes.co.uk",
  "theathletic.com",
]);

function isLikelyPaywalled(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return PAYWALLED_DOMAINS.has(host);
  } catch {
    return false;
  }
}

/**
 * Reusable pill-shaped action link for the news card source row.
 *
 * `accent` — when true, applies a subtle blue tint to visually distinguish
 *            the Translate button from the neutral Source button.
 */
function NewsActionLink({
  href,
  icon,
  accent = false,
  children,
}: {
  href:      string;
  icon:      ReactNode;
  accent?:   boolean;
  children:  ReactNode;
}) {
  const base = accent
    ? { bg: "rgba(58,160,255,0.06)", fg: "rgba(58,160,255,0.7)", border: "rgba(58,160,255,0.18)" }
    : { bg: "rgba(255,255,255,0.04)", fg: "rgba(255,255,255,0.45)", border: "rgba(255,255,255,0.08)" };

  const hover = accent
    ? { bg: "rgba(58,160,255,0.12)", fg: "rgba(58,160,255,1)" }
    : { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.7)" };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
      style={{
        background: base.bg,
        color: base.fg,
        border: `1px solid ${base.border}`,
        textDecoration: "none",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = hover.bg;
        el.style.color = hover.fg;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = base.bg;
        el.style.color = base.fg;
      }}
    >
      {icon}
      {children}
    </a>
  );
}

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  url?: string;
  publishedAt: string;
  source: string;
  sentiment: string;
}

interface NewsPanelProps {
  ticker:      string;
  companyName: string;
  news:        NewsItem[];
  lang:        Lang;
  t:           Translations;
}

export function NewsPanel({ ticker, companyName, news, lang, t }: NewsPanelProps) {
  const { canAccess, openUpgradeModal } = useSubscription();
  const hasFullNews = canAccess(FEATURES.FULL_NEWS_LIST);

  const { translatedNews, isTranslating } = useTranslatedNews(news, lang);
  const baseHeadlines = news.map(n => n.headline);
  const { summaries: aiSummaries, loading: aiLoading } = useStockInsights(
    ticker, companyName, baseHeadlines, lang,
  );

  const visibleNews = hasFullNews
    ? translatedNews
    : translatedNews.slice(0, FREE_NEWS_LIMIT);
  const lockedCount = hasFullNews
    ? 0
    : Math.max(0, translatedNews.length - FREE_NEWS_LIMIT);

  return (
    <div
      className="flex flex-col min-w-0 rounded-2xl overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Newspaper className="w-4 h-4" style={{ color: "#3AA0FF" }} />
        <span className="font-display font-bold text-sm text-white">{t.marketNews}</span>

        {isTranslating && (
          <Loader2 className="w-3 h-3 animate-spin ml-1" style={{ color: "rgba(255,255,255,0.3)" }} />
        )}

        {!hasFullNews && translatedNews.length > FREE_NEWS_LIMIT && (
          <span
            className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(245,158,11,0.1)",
              color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            {FREE_NEWS_LIMIT}/{translatedNews.length}
          </span>
        )}
      </div>

      {/* ── News list ─────────────────────────────────────────── */}
      <div className="overflow-y-auto flex-1">
        {translatedNews.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            {t.noRecentNews}
          </div>
        ) : (
          <>
            {visibleNews.map((item, i) => {
              const paywalled = isLikelyPaywalled(item.url);
              const aiText    = aiSummaries[i];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {/* Headline — plain text, not a link */}
                  <h4 className="text-sm font-semibold leading-snug text-white/85 mb-2 line-clamp-3">
                    {item.headline}
                  </h4>

                  {/* Sentiment badge (stable — set at fetch time, never changes) + timestamp */}
                  <div className="flex items-center gap-2 mb-3">
                    <SentimentPill sentiment={item.sentiment} lang={lang} />
                    <span
                      className="flex items-center gap-1 text-[10px]"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {formatNewsDate(item.publishedAt)} · {item.source}
                    </span>
                  </div>

                  {/* ── WHY IT MATTERS — primary content ──────── */}
                  <div
                    className="rounded-lg px-3 py-2.5 mb-3"
                    style={{
                      background: "rgba(58,160,255,0.05)",
                      border: "1px solid rgba(58,160,255,0.1)",
                    }}
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 mb-1"
                      style={{ color: "#3AA0FF" }}
                    >
                      {t.whyItMatters}
                      {aiLoading && !aiText && (
                        <Loader2
                          className="w-2.5 h-2.5 animate-spin"
                          style={{ color: "rgba(58,160,255,0.5)" }}
                        />
                      )}
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {aiText || item.summary}
                    </p>
                  </div>

                  {/* ── Source / Translate row — secondary actions ── */}
                  {item.url && (
                    <div className="flex items-center gap-2 flex-wrap">

                      {/* Source — opens original article */}
                      <NewsActionLink href={item.url} icon={<ExternalLink className="w-2.5 h-2.5 shrink-0" />}>
                        {t.sourceLink}: {item.source}
                      </NewsActionLink>

                      {/* Translate — only shown when it adds value (non-English UI) */}
                      {shouldShowTranslate(lang) && (
                        <NewsActionLink
                          href={makeTranslateUrl(item.url, lang)}
                          icon={<Languages className="w-2.5 h-2.5 shrink-0" />}
                          accent
                        >
                          {t.translate}
                        </NewsActionLink>
                      )}

                      {/* Paywall indicator */}
                      {paywalled ? (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(245,158,11,0.08)",
                            color: "#f59e0b",
                            border: "1px solid rgba(245,158,11,0.15)",
                          }}
                        >
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          {t.likelyPaywalled}
                        </span>
                      ) : (
                        <span
                          className="text-[9px]"
                          style={{ color: "rgba(255,255,255,0.18)" }}
                        >
                          {t.mayRequireSubscription}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* ── Locked news gate ──────────────────────────── */}
            {!hasFullNews && lockedCount > 0 && (
              <div
                className="px-5 py-4 flex flex-col items-center gap-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                {/* Blurred preview of locked items */}
                <div
                  className="w-full space-y-2"
                  style={{
                    filter: "blur(3.5px)",
                    opacity: 0.25,
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {translatedNews.slice(FREE_NEWS_LIMIT, FREE_NEWS_LIMIT + 2).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div className="h-3 rounded mb-1" style={{ background: "rgba(255,255,255,0.15)", width: "80%" }} />
                      <div className="h-2 rounded" style={{ background: "rgba(255,255,255,0.08)", width: "55%" }} />
                    </div>
                  ))}
                </div>

                {/* Lock CTA */}
                <button
                  onClick={openUpgradeModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold w-full justify-center transition-all hover:opacity-90"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.15)",
                  }}
                >
                  <Lock className="w-3.5 h-3.5" />
                  {lockedCount} · {t.upgradeForFullNews}
                </button>
              </div>
            )}

            {/* ── Pro footer ────────────────────────────────── */}
            {hasFullNews && translatedNews.length > 0 && (
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                <Sparkles className="w-3 h-3" style={{ color: "#f59e0b" }} />
                <span className="text-[9px] font-bold" style={{ color: "rgba(245,158,11,0.5)" }}>
                  {t.fullNewsFeedPro}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
