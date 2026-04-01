import { useState } from "react";
import { Check, X, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PRICING_PLANS } from "@/lib/subscription";
import { PREMIUM_UI } from "@/lib/premium-i18n";
import type { Lang } from "@/lib/i18n";

interface PricingSectionProps {
  lang: Lang;
}

export function PricingSection({ lang }: PricingSectionProps) {
  const { tier, togglePlan } = useSubscription();
  const p = PREMIUM_UI[lang].pricing;
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const freePlan = PRICING_PLANS.find(pl => pl.id === "free")!;
  const proPlan  = PRICING_PLANS.find(pl => pl.id === "pro")!;
  const price    = billing === "annual" ? proPlan.price.annual : proPlan.price.monthly;
  const saving   = Math.round((1 - proPlan.price.annual / proPlan.price.monthly) * 100);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Header */}
      <div
        className="px-6 pt-6 pb-5 text-center"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: "#f59e0b" }} />
          <h3 className="font-display font-black text-lg text-white">{p.heading}</h3>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{p.subtext}</p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <div
            className="flex items-center rounded-lg p-0.5 gap-0.5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {(["monthly", "annual"] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className="px-3 py-1 rounded-md text-[11px] font-bold transition-all"
                style={billing === b
                  ? { background: "#f59e0b", color: "#0B0F14" }
                  : { color: "rgba(255,255,255,0.38)" }
                }
              >
                {b === "monthly" ? p.monthly : p.annual}
              </button>
            ))}
          </div>
          {billing === "annual" && (
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,255,156,0.12)", color: "#00FF9C", border: "1px solid rgba(0,255,156,0.2)" }}
            >
              {p.saveLabel(saving)}
            </span>
          )}
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>

        {/* Free */}
        <div className="p-6 relative">
          {tier === "free" && (
            <div
              className="absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "rgba(58,160,255,0.12)", color: "#3AA0FF", border: "1px solid rgba(58,160,255,0.2)" }}
            >
              ✓ {p.currentPlan}
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>
            {freePlan.name}
          </p>
          <p className="text-3xl font-black text-white mb-0.5">$0</p>
          <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>{p.freeForever}</p>
          <ul className="space-y-2">
            {freePlan.features.map(f => (
              <li key={f.label} className="flex items-start gap-2">
                {f.included
                  ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                  : <X     className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.1)" }} />
                }
                <span className="text-xs" style={{ color: f.included ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)" }}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <motion.div
          className="p-6 relative"
          style={{ background: "rgba(245,158,11,0.03)" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-16 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top right,rgba(245,158,11,0.09) 0%,transparent 70%)" }}
          />
          {tier === "pro" && (
            <div
              className="absolute top-4 right-4 text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              ✓ {p.currentPlan}
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>Pro</p>
          <div className="flex items-baseline gap-1 mb-0.5">
            <p className="text-3xl font-black text-white">${price}</p>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {p.perMonth}{billing === "annual" ? ` · ${p.annualNote}` : ""}
            </span>
          </div>
          <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>{proPlan.description}</p>
          <ul className="space-y-2">
            {proPlan.features.map(f => (
              <li key={f.label} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: f.proOnly ? "#f59e0b" : "#00FF9C" }} />
                <span className="text-xs" style={{ color: f.proOnly ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)" }}>
                  {f.label}
                  {f.proOnly && (
                    <span className="ml-1.5 text-[9px] font-black px-1 py-px rounded"
                      style={{ background: "rgba(245,158,11,0.14)", color: "#f59e0b" }}>
                      PRO
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* CTA */}
      <div
        className="px-6 py-5 flex flex-col items-center gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: "rgba(58,160,255,0.08)", border: "1px solid rgba(58,160,255,0.15)", color: "#3AA0FF" }}
        >
          <Zap className="w-3 h-3" />
          {p.demoBanner}
        </div>

        <button
          onClick={togglePlan}
          className="w-full max-w-sm py-3 rounded-xl text-sm font-black tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
          style={tier === "free"
            ? { background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0B0F14" }
            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }
          }
        >
          {tier === "free" ? p.upgradeCta : p.downgradeCta}
        </button>
      </div>
    </div>
  );
}
