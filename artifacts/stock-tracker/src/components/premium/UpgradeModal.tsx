import { useState } from "react";
import { X, Check, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLang } from "@/contexts/LangContext";
import { PRICING_PLANS } from "@/lib/subscription";
import { PREMIUM_UI } from "@/lib/premium-i18n";

export function UpgradeModal() {
  const { upgradeModalOpen, closeUpgradeModal, togglePlan, isProUser } = useSubscription();
  const { lang } = useLang();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const m        = PREMIUM_UI[lang].modal;
  const freePlan = PRICING_PLANS.find(p => p.id === "free")!;
  const proPlan  = PRICING_PLANS.find(p => p.id === "pro")!;
  const price    = billing === "annual" ? proPlan.price.annual : proPlan.price.monthly;
  const saving   = Math.round((1 - proPlan.price.annual / proPlan.price.monthly) * 100);

  return (
    <AnimatePresence>
      {upgradeModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(5px)" }}
            onClick={closeUpgradeModal}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 20  }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="w-full max-w-2xl rounded-2xl overflow-hidden"
              style={{
                background: "#0F1620",
                border: "1px solid rgba(245,158,11,0.2)",
                boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.05)",
                pointerEvents: "auto",
              }}
            >
              {/* Header */}
              <div
                className="relative px-8 pt-8 pb-6 text-center"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <button
                  onClick={closeUpgradeModal}
                  className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-2 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.2))", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: "#f59e0b" }} />
                  </div>
                </div>
                <h2 className="text-2xl font-display font-black text-white mb-2">{m.title}</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{m.subtitle}</p>

                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-3 mt-5">
                  <div
                    className="flex items-center rounded-lg p-0.5 gap-0.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {(["monthly", "annual"] as const).map(b => (
                      <button
                        key={b}
                        onClick={() => setBilling(b)}
                        className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                        style={billing === b
                          ? { background: "#f59e0b", color: "#0B0F14" }
                          : { color: "rgba(255,255,255,0.4)" }
                        }
                      >
                        {b === "monthly" ? m.monthly : m.annual}
                      </button>
                    ))}
                  </div>
                  {billing === "annual" && (
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(0,255,156,0.12)", color: "#00FF9C", border: "1px solid rgba(0,255,156,0.2)" }}
                    >
                      {m.saveLabel(saving)}
                    </span>
                  )}
                </div>
              </div>

              {/* Plan comparison */}
              <div className="grid grid-cols-2 divide-x" style={{ borderColor: "rgba(255,255,255,0.06)" }}>

                {/* Free */}
                <div className="px-6 py-6">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {m.freeName}
                  </p>
                  <p className="text-3xl font-black text-white mb-1">$0</p>
                  <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>{m.freeTagline}</p>
                  <ul className="space-y-2.5">
                    {freePlan.features.map(f => (
                      <li key={f.label} className="flex items-start gap-2">
                        <span className="w-3.5 h-3.5 mt-0.5 shrink-0 flex items-center justify-center">
                          {f.included
                            ? <Check className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
                            : <span className="w-3 h-px block" style={{ background: "rgba(255,255,255,0.12)" }} />
                          }
                        </span>
                        <span className="text-xs" style={{ color: f.included ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)" }}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro */}
                <div className="px-6 py-6 relative" style={{ background: "rgba(245,158,11,0.03)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>
                    {m.proName}
                  </p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <p className="text-3xl font-black text-white">${price}</p>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {m.perMonth}{billing === "annual" ? ` · ${m.billedAnnually}` : ""}
                    </span>
                  </div>
                  <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>{m.proTagline}</p>
                  <ul className="space-y-2.5">
                    {proPlan.features.map(f => (
                      <li key={f.label} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: f.proOnly ? "#f59e0b" : "#00FF9C" }} />
                        <span className="text-xs" style={{ color: f.proOnly ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)" }}>
                          {f.label}
                          {f.proOnly && (
                            <span className="ml-1.5 text-[9px] font-black px-1 py-px rounded"
                              style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                              PRO
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer CTA */}
              <div
                className="px-8 py-6 flex flex-col items-center gap-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs mb-1"
                  style={{ background: "rgba(58,160,255,0.08)", border: "1px solid rgba(58,160,255,0.15)", color: "#3AA0FF" }}
                >
                  <Zap className="w-3 h-3" />
                  {m.demoBanner}
                </div>

                <button
                  onClick={() => { togglePlan(); closeUpgradeModal(); }}
                  className="w-full py-3.5 rounded-xl text-sm font-black tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0B0F14" }}
                >
                  {isProUser ? m.switchFree : m.activatePro}
                </button>

                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>{m.disclaimer}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
