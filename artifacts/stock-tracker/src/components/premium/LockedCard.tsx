import { Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLang } from "@/contexts/LangContext";
import { PREMIUM_UI } from "@/lib/premium-i18n";

interface LockedCardProps {
  label: string;
  description?: string;
  height?: string;
  previewContent?: React.ReactNode;
}

export function LockedCard({ label, description, height, previewContent }: LockedCardProps) {
  const { openUpgradeModal } = useSubscription();
  const { lang } = useLang();
  const cta = PREMIUM_UI[lang].locked.cta;

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "#121821",
        border: "1px solid rgba(245,158,11,0.15)",
        minHeight: height ?? "140px",
      }}
    >
      {previewContent && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ filter: "blur(6px)", opacity: 0.3 }}
        >
          {previewContent}
        </div>
      )}
      <div className="absolute inset-0" style={{ background: previewContent ? "rgba(11,15,20,0.65)" : "transparent" }} />

      <div
        className="relative z-10 flex flex-col items-center justify-center text-center p-8 gap-3"
        style={{ minHeight: height ?? "140px" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)" }}
        >
          <Lock className="w-5 h-5" style={{ color: "#f59e0b" }} />
        </div>

        <div>
          <p className="text-sm font-bold text-white mb-1">{label}</p>
          {description && (
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
              {description}
            </p>
          )}
        </div>

        <button
          onClick={openUpgradeModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0B0F14" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {cta}
        </button>
      </div>
    </div>
  );
}
