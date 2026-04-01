/**
 * Subscription / monetisation configuration.
 *
 * All "is this user Pro?" checks must flow through the SubscriptionContext so
 * that swapping mock state for real auth (Clerk, Supabase, etc.) only requires
 * editing ONE file — the context — not every component.
 *
 * To connect real billing later:
 *   1. Replace `useMockSubscription` in SubscriptionContext with a real hook.
 *   2. Everything else stays unchanged.
 */

export type PlanTier = "free" | "pro";

export interface PricingPlan {
  id: PlanTier;
  name: string;
  price: { monthly: number; annual: number };
  currency: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  highlighted: boolean;
}

export interface PlanFeature {
  label: string;
  included: boolean;
  proOnly?: boolean;
}

/** Canonical list of features — used by PricingSection & UpgradeModal */
export const FREE_FEATURES: PlanFeature[] = [
  { label: "Real-time stock prices (US, KR, HK/CN)",  included: true  },
  { label: "Full chart history (all ranges)",          included: true  },
  { label: "Basic stats & key metrics",               included: true  },
  { label: "Top news headlines",                       included: true  },
  { label: "\"Why It Matters\" preview",              included: true  },
  { label: "P/L position calculator",                 included: true  },
  { label: "Watchlist (US · KR · CN)",                included: true  },
  { label: "AI Deep Report",                          included: false, proOnly: true },
  { label: "Full premium news analysis",              included: false, proOnly: true },
  { label: "Market sentiment dashboard",              included: false, proOnly: true },
  { label: "Email digest (daily / weekly)",           included: false, proOnly: true },
  { label: "Portfolio watchlist insights",            included: false, proOnly: true },
];

export const PRO_FEATURES: PlanFeature[] = FREE_FEATURES.map(f => ({ ...f, included: true }));

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    currency: "USD",
    description: "Real data, real utility — no credit card needed.",
    features: FREE_FEATURES,
    cta: "Current Plan",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 19, annual: 14 },
    currency: "USD",
    description: "Deeper insight and faster decisions for serious investors.",
    features: PRO_FEATURES,
    cta: "Upgrade to Pro",
    highlighted: true,
  },
];

/**
 * Feature gate identifiers.
 * Import these instead of magic strings when calling usePremiumGate().
 */
export const FEATURES = {
  AI_DEEP_REPORT:        "ai_deep_report",
  PREMIUM_WHY_MATTERS:   "premium_why_matters",
  FULL_NEWS_LIST:        "full_news_list",
  MARKET_SENTIMENT:      "market_sentiment",
  EMAIL_DIGEST:          "email_digest",
  WATCHLIST_INSIGHTS:    "watchlist_insights",
  PORTFOLIO_SUMMARY:     "portfolio_summary",
} as const;

/** Free-tier watchlist item cap */
export const FREE_WATCHLIST_LIMIT = 5;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

/** Map of which features require Pro */
export const PRO_FEATURE_SET = new Set<FeatureKey>(Object.values(FEATURES));
