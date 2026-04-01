import React from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

export function Stat({ label, value, className, valueClassName }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className={cn("text-xl font-mono font-semibold tracking-tight text-foreground", valueClassName)}>
        {value}
      </span>
    </div>
  );
}
