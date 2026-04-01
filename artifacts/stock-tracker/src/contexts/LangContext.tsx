/**
 * LangContext
 *
 * Lifts language state to a global context so that globally-mounted components
 * (UpgradeModal, etc.) can read and react to language changes without prop-drilling.
 *
 * TopNav continues to call onLangChange (from its own props), which internally
 * calls setLang from this context — no breaking change to existing prop signatures.
 */
import { createContext, useContext, useState } from "react";
import type { Lang } from "@/lib/i18n";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
