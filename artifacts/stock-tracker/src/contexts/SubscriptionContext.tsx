/**
 * SubscriptionContext
 *
 * Single source of truth for the user's subscription state.
 * Currently uses a mock toggle so the full premium UX can be built and
 * tested without a real billing backend.
 *
 * To connect real auth/billing later, replace the mock useState with
 * a real hook (e.g. useAuth().subscription) inside this file only.
 * Every consuming component stays unchanged.
 */
import { createContext, useContext, useState } from "react";
import type { PlanTier, FeatureKey } from "@/lib/subscription";
import { PRO_FEATURE_SET } from "@/lib/subscription";

interface SubscriptionContextValue {
  tier: PlanTier;
  isProUser: boolean;
  /** True if the given feature is unlocked for the current user */
  canAccess: (feature: FeatureKey) => boolean;
  /** Dev/demo helper — toggle plan without real billing */
  togglePlan: () => void;
  /** Open the upgrade modal from anywhere in the tree */
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  upgradeModalOpen: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  // ── Mock state ──────────────────────────────────────────────────────────────
  // Replace this with real auth in production:
  //   const tier = useAuth().user?.subscription?.tier ?? "free"
  const [tier, setTier] = useState<PlanTier>("free");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isProUser = tier === "pro";

  const canAccess = (feature: FeatureKey): boolean => {
    if (!PRO_FEATURE_SET.has(feature)) return true;
    return isProUser;
  };

  const togglePlan = () => setTier(t => (t === "free" ? "pro" : "free"));
  const openUpgradeModal  = () => setUpgradeModalOpen(true);
  const closeUpgradeModal = () => setUpgradeModalOpen(false);

  return (
    <SubscriptionContext.Provider value={{
      tier, isProUser, canAccess, togglePlan,
      openUpgradeModal, closeUpgradeModal, upgradeModalOpen,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/** Use anywhere inside SubscriptionProvider */
export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used inside <SubscriptionProvider>");
  return ctx;
}
