import { useState } from "react";
import { Mail, Clock, Sparkles, Check, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumBadge } from "./PremiumBadge";
import { PREMIUM_UI } from "@/lib/premium-i18n";
import type { Lang } from "@/lib/i18n";

interface EmailDigestPreviewProps {
  ticker: string;
  companyName: string;
  lang: Lang;
}

// Sample digest items — ticker substituted at render time
const SAMPLE_ITEMS = [
  { time: "Pre-market",  text: "TICKER +1.2% in pre-market — shipment data beats estimates" },
  { time: "9:45 AM",     text: "Volume spike noted — unusual options activity at key strike" },
  { time: "11:30 AM",    text: "Sector rotation: Tech leading with TICKER outperforming peers" },
  { time: "EOD",         text: "TICKER closed +0.8%. Key level to watch: support on pullbacks" },
];

export function EmailDigestPreview({ ticker, companyName, lang }: EmailDigestPreviewProps) {
  const { isProUser, openUpgradeModal } = useSubscription();
  const d = PREMIUM_UI[lang].digest;
  const [email, setEmail]      = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [frequency, setFrequency]   = useState<"daily" | "weekly">("daily");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(58,160,255,0.12)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(58,160,255,0.1)", border: "1px solid rgba(58,160,255,0.2)" }}
          >
            <Mail className="w-4 h-4" style={{ color: "#3AA0FF" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-white">{d.title}</span>
              <PremiumBadge size="sm" />
            </div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{d.subtitle(ticker)}</p>
          </div>
        </div>
      </div>

      {/* Sample timeline items */}
      <div className="px-5 py-4 space-y-2.5">
        {SAMPLE_ITEMS.map((item, i) => {
          const isLocked = !isProUser && i > 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3"
              style={{
                opacity: isLocked ? 0.18 : 1,
                filter: isLocked ? "blur(3px)" : "none",
                pointerEvents: isLocked ? "none" : "auto",
                userSelect: isLocked ? "none" : "auto",
              }}
            >
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <Clock className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.2)" }} />
                <span className="text-[10px] font-mono font-semibold w-20 shrink-0" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {item.time}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {item.text.replace(/TICKER/g, ticker).replace(/COMPANY/g, companyName)}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Free gate CTA */}
      {!isProUser && (
        <div className="px-5 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <button
            onClick={openUpgradeModal}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold mt-3 transition-all hover:opacity-90"
            style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}
          >
            <Lock className="w-3.5 h-3.5" />
            {d.lockedCta}
          </button>
        </div>
      )}

      {/* Pro: subscribe form */}
      {isProUser && (
        <div
          className="px-5 pb-5 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Frequency toggle */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1">
              {(["daily", "weekly"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                  style={frequency === f
                    ? { background: "#3AA0FF", color: "#0B0F14" }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {f === "daily" ? d.freqDaily : d.freqWeekly}
                </button>
              ))}
            </div>
          </div>

          {subscribed ? (
            <div
              className="flex items-center gap-2 py-3 px-4 rounded-xl"
              style={{ background: "rgba(0,255,156,0.08)", border: "1px solid rgba(0,255,156,0.15)" }}
            >
              <Check className="w-4 h-4 shrink-0" style={{ color: "#00FF9C" }} />
              <span className="text-xs font-semibold" style={{ color: "#00FF9C" }}>
                {d.subscribed} · {d.confirmedText(frequency)}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={d.placeholder}
                className="flex-1 text-xs py-2.5 px-3.5 rounded-xl font-medium outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(58,160,255,0.2)",
                  color: "rgba(255,255,255,0.85)",
                }}
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 shrink-0"
                style={{ background: "linear-gradient(135deg,#3AA0FF,#0052cc)", color: "white" }}
              >
                <Sparkles className="w-3 h-3" />
                {d.subscribe}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
