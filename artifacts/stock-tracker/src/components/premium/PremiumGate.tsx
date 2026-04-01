/**
 * PremiumGate
 *
 * Wraps any content. If the user has access, renders children normally.
 * If not, renders a locked placeholder (LockedCard) that prompts an upgrade.
 *
 * Usage:
 *   <PremiumGate feature={FEATURES.AI_DEEP_REPORT} label="AI Deep Report">
 *     <AIDeepReport ... />
 *   </PremiumGate>
 */
import { useSubscription } from "@/contexts/SubscriptionContext";
import { LockedCard } from "./LockedCard";
import type { FeatureKey } from "@/lib/subscription";

interface PremiumGateProps {
  feature: FeatureKey;
  /** Short label shown in the locked card header */
  label: string;
  /** Subtext shown under the lock */
  description?: string;
  children: React.ReactNode;
  /** Height of the locked placeholder (default: auto) */
  lockedHeight?: string;
}

export function PremiumGate({
  feature, label, description, children, lockedHeight,
}: PremiumGateProps) {
  const { canAccess } = useSubscription();
  if (canAccess(feature)) return <>{children}</>;
  return <LockedCard label={label} description={description} height={lockedHeight} />;
}
