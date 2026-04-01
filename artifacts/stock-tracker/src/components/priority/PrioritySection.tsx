/**
 * PrioritySection
 *
 * Groups PriorityCards under a labeled section header.
 * Hidden entirely when the section has no items.
 */

import { AnimatePresence } from "framer-motion";
import type { StockInsight, SectionId } from "@/services/watchlist-insights";
import type { PriorityBoardStrings } from "@/lib/premium-i18n";
import type { Lang } from "@/lib/i18n";
import { PriorityCard } from "./PriorityCard";

const SECTION_ACCENT: Record<SectionId, string> = {
  priority: "#00FF9C",
  risk:     "#FF4D4D",
  momentum: "#3AA0FF",
  quiet:    "rgba(255,255,255,0.3)",
};

const SECTION_ICON: Record<SectionId, string> = {
  priority: "●",
  risk:     "▲",
  momentum: "◆",
  quiet:    "○",
};

interface PrioritySectionProps {
  sectionId:  SectionId;
  symbols:    string[];
  insights:   Map<string, StockInsight>;
  isProUser:  boolean;
  lang:       Lang;
  onRemove:   (symbol: string) => void;
  onSelect:   (symbol: string) => void;
  onUpgrade:  () => void;
  strings:    PriorityBoardStrings;
}

export function PrioritySection({
  sectionId, symbols, insights, isProUser, lang,
  onRemove, onSelect, onUpgrade, strings: s,
}: PrioritySectionProps) {
  if (symbols.length === 0) return null;

  const accent = SECTION_ACCENT[sectionId];
  const icon   = SECTION_ICON[sectionId];

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[11px] font-black" style={{ color: accent }}>{icon}</span>
        <div>
          <h2
            className="text-[11px] font-black uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {s.sections[sectionId]}
          </h2>
          <p className="text-[10px] mt-px" style={{ color: "rgba(255,255,255,0.22)" }}>
            {s.sectionSubs[sectionId]}
          </p>
        </div>
        <div
          className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{
            background: `${accent}14`,
            border: `1px solid ${accent}22`,
            color: accent,
          }}
        >
          {symbols.length}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {symbols.map((sym, idx) => (
            <PriorityCard
              key={sym}
              symbol={sym}
              insight={insights.get(sym)}
              isProUser={isProUser}
              lang={lang}
              onRemove={onRemove}
              onSelect={onSelect}
              onUpgrade={onUpgrade}
              strings={s}
              index={idx}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
