/**
 * QuickActionBar
 *
 * Row of 4 quick-insight action buttons per Priority Card.
 * Active button is highlighted; clicking the active button again collapses the panel.
 */

import { Loader2 } from "lucide-react";
import type { QuickActionType } from "@/services/watchlist-insights";
import type { QuickActionState } from "@/hooks/use-quick-action";
import type { PriorityBoardStrings } from "@/lib/premium-i18n";

interface QuickActionBarProps {
  activeAction: QuickActionType | null;
  state:        QuickActionState;
  onTrigger:    (action: QuickActionType) => void;
  strings:      PriorityBoardStrings;
}

const ACTIONS: QuickActionType[] = ["why_moving", "risk_view", "what_to_watch", "market_read"];

export function QuickActionBar({ activeAction, state, onTrigger, strings: s }: QuickActionBarProps) {
  const labels: Record<QuickActionType, string> = {
    why_moving:    s.actions.why,
    risk_view:     s.actions.riskView,
    what_to_watch: s.actions.watch,
    market_read:   s.actions.market,
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {ACTIONS.map(action => {
        const isActive  = activeAction === action;
        const isLoading = isActive && state === "loading";

        return (
          <button
            key={action}
            type="button"
            onClick={() => onTrigger(action)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: isActive
                ? "rgba(58,160,255,0.15)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${isActive ? "rgba(58,160,255,0.35)" : "rgba(255,255,255,0.07)"}`,
              color: isActive ? "#3AA0FF" : "rgba(255,255,255,0.45)",
            }}
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
            {labels[action]}
          </button>
        );
      })}
    </div>
  );
}
