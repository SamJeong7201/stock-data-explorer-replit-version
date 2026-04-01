/**
 * translate.ts
 *
 * Utilities for constructing translated external article URLs.
 *
 * Design
 * ──────
 * - `makeTranslateUrl` is the single point of truth for building
 *   Google Translate proxy links. All components call this function;
 *   none construct translation URLs themselves.
 *
 * - `GT_LANG` maps app `Lang` codes to Google Translate IETF language tags.
 *   Adding a new app language requires one new entry here only.
 *
 * - `shouldShowTranslate` encapsulates the policy for when to offer a
 *   translate button. The current assumption is that news articles are
 *   predominantly in English, so translating TO English is redundant.
 *   Change this one function to adjust that policy without touching any UI.
 *
 * Scaling
 * ───────
 * To support a new language (e.g. Japanese):
 *   1. Add `ja: "ja"` to GT_LANG.
 *   2. Add the Lang value to i18n.ts.
 *   No other changes needed.
 */

import type { Lang } from "@/lib/i18n";

/**
 * Maps app language codes → Google Translate target language tags.
 *
 * Most codes are identical; ZH is the notable exception because Google
 * Translate distinguishes Simplified (zh-CN) from Traditional (zh-TW).
 * We default to Simplified Chinese which covers the largest audience.
 */
export const GT_LANG: Record<Lang, string> = {
  en: "en",
  ko: "ko",
  zh: "zh-CN",
};

/**
 * Build a Google Translate URL that proxies `articleUrl` and renders it
 * in the language given by `lang`.
 *
 * `sl=auto` lets Google detect the source language automatically, so
 * the link works correctly regardless of the article's original language.
 */
export function makeTranslateUrl(articleUrl: string, lang: Lang): string {
  const tl = GT_LANG[lang];
  return `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(tl)}&u=${encodeURIComponent(articleUrl)}`;
}

/**
 * Returns `true` when offering a translated link adds clear value.
 *
 * Policy: external articles are predominantly published in English.
 * Offering a "translate to English" link for English-speaking users
 * is therefore redundant for the vast majority of articles.
 * For every other target language the translation is genuinely useful.
 *
 * If the app adds non-English source languages in the future, this
 * function can be updated to compare article language against user language.
 */
export function shouldShowTranslate(lang: Lang): boolean {
  return GT_LANG[lang] !== "en";
}
