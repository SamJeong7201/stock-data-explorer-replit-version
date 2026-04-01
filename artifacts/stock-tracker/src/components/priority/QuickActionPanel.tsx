/**
 * QuickActionPanel
 *
 * Inline response panel that expands below the QuickActionBar.
 *
 * Free:  short 1-sentence answer + upgrade CTA.
 * Pro:   full 3–5 sentence deep read.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { QuickActionType } from "@/services/watchlist-insights";
import type { QuickActionState } from "@/hooks/use-quick-action";
import type { PriorityBoardStrings } from "@/lib/premium-i18n";

interface QuickActionPanelProps {
  activeAction: QuickActionType | null;
  state:        QuickActionState;
  response:     string | null;
  isProUser:    boolean;
  onUpgrade:    () => void;
  strings:      PriorityBoardStrings;
}

export function QuickActionPanel({
  activeAction, state, response, isProUser, onUpgrade, strings: s,
}: QuickActionPanelProps) {
  const isVisible = activeAction !== null && state !== "idle";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={activeAction}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div
            className="mt-3 px-3 py-3 rounded-xl"
            style={{
              background: "rgba(58,160,255,0.04)",
              border: "1px solid rgba(58,160,255,0.12)",
            }}
          >
            {state === "loading" ? (
              <div className="space-y-2">
                {[100, 80, 60].map(w => (
                  <div
                    key={w}
                    className="h-2.5 rounded-full animate-pulse"
                    style={{ background: "rgba(255,255,255,0.06)", width: `${w}%` }}
                  />
                ))}
              </div>
            ) : (
              <div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.62)" }}
                >
                  {response}
                </p>
                {!isProUser && (
                  <button
                    onClick={onUpgrade}
                    className="mt-2.5 text-[10px] font-bold transition-all hover:opacity-80"
                    style={{ color: "#f59e0b" }}
                  >
                    {s.actionUpgradeCta}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
