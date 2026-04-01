import { Sparkles } from "lucide-react";

interface PremiumBadgeProps {
  /** "sm" = inline label, "md" = pill with icon (default) */
  size?: "sm" | "md";
  className?: string;
}

export function PremiumBadge({ size = "md", className = "" }: PremiumBadgeProps) {
  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${className}`}
        style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0B0F14" }}
      >
        PRO
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${className}`}
      style={{
        background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(249,115,22,0.15))",
        color: "#f59e0b",
        border: "1px solid rgba(245,158,11,0.3)",
      }}
    >
      <Sparkles className="w-3 h-3" />
      Pro
    </span>
  );
}
