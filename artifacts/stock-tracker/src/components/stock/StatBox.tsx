interface StatBoxProps {
  label: string;
  value: React.ReactNode;
}

export function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {label}
      </span>
      <span className="font-mono text-sm font-semibold text-white/90 leading-tight">
        {value}
      </span>
    </div>
  );
}
