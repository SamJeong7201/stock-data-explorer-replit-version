import { useState, useRef, useMemo } from "react";
import { Calculator as CalcIcon } from "lucide-react";
import { getCurrencySymbol, formatPrice, isWholeCurrency } from "@/lib/format";
import type { Translations } from "@/lib/i18n";

interface ProfitCalculatorProps {
  currentPrice: number;
  currency: string;
  t: Translations;
}

export function ProfitCalculator({ currentPrice, currency, t }: ProfitCalculatorProps) {
  const [buyPrice, setBuyPrice]       = useState("");
  const [quantity, setQuantity]       = useState("");
  const [investAmount, setInvestAmount] = useState("");
  const driverRef = useRef<"quantity" | "amount">("quantity");

  const currencySymbol = getCurrencySymbol(currency);
  const whole = isWholeCurrency(currency);

  const syncAmount = (bp: number, q: number) =>
    whole ? Math.round(bp * q).toString() : (bp * q).toFixed(2);

  const handleBuyPriceChange = (val: string) => {
    setBuyPrice(val);
    const bp = parseFloat(val);
    if (isNaN(bp) || bp <= 0) return;
    if (driverRef.current === "quantity") {
      const q = parseFloat(quantity);
      if (!isNaN(q) && q > 0) setInvestAmount(syncAmount(bp, q));
    } else {
      const amt = parseFloat(investAmount);
      if (!isNaN(amt) && amt > 0) setQuantity((amt / bp).toFixed(4).replace(/\.?0+$/, ""));
    }
  };

  const handleQuantityChange = (val: string) => {
    driverRef.current = "quantity";
    setQuantity(val);
    const bp = parseFloat(buyPrice);
    const q = parseFloat(val);
    if (!isNaN(bp) && !isNaN(q) && bp > 0 && q > 0) setInvestAmount(syncAmount(bp, q));
    else setInvestAmount("");
  };

  const handleInvestAmountChange = (val: string) => {
    driverRef.current = "amount";
    setInvestAmount(val);
    const bp = parseFloat(buyPrice);
    const amt = parseFloat(val);
    if (!isNaN(bp) && !isNaN(amt) && bp > 0 && amt > 0)
      setQuantity((amt / bp).toFixed(4).replace(/\.?0+$/, ""));
    else setQuantity("");
  };

  const { cost, currentVal, pl, plPercent } = useMemo(() => {
    const bp = parseFloat(buyPrice);
    const q  = parseFloat(quantity);
    if (!isNaN(bp) && !isNaN(q) && q > 0) {
      const c      = bp * q;
      const val    = currentPrice * q;
      const profit = val - c;
      const pct    = c > 0 ? (profit / c) * 100 : 0;
      return { cost: c, currentVal: val, pl: profit, plPercent: pct };
    }
    return { cost: 0, currentVal: 0, pl: 0, plPercent: 0 };
  }, [buyPrice, quantity, currentPrice]);

  const inputClass = "w-full text-sm py-2.5 px-4 rounded-xl font-mono transition-all outline-none";
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(58,160,255,0.2)",
    color: "rgba(255,255,255,0.85)",
  };
  const labelClass = "block text-[10px] font-bold uppercase tracking-widest mb-2";
  const labelStyle = { color: "rgba(255,255,255,0.3)" };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#121821", border: "1px solid rgba(58,160,255,0.12)" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <CalcIcon className="w-4 h-4" style={{ color: "#3AA0FF" }} />
        <span className="font-display font-bold text-sm text-white">{t.calculator}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>
              {t.avgBuyPrice} ({currencySymbol})
            </label>
            <input
              type="number"
              value={buyPrice}
              onChange={e => handleBuyPriceChange(e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder={currency === "KRW" ? "e.g. 71000" : "e.g. 150.00"}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>{t.quantity}</label>
            <input
              type="number"
              value={quantity}
              onChange={e => handleQuantityChange(e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>
              {t.investAmount} ({currencySymbol})
            </label>
            <input
              type="number"
              value={investAmount}
              onChange={e => handleInvestAmountChange(e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder={currency === "KRW" ? "e.g. 1000000" : "e.g. 1500.00"}
            />
          </div>
        </div>

        {/* Results */}
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t.totalCost}</span>
              <span className="font-mono text-sm font-semibold text-white">
                {cost > 0 ? formatPrice(cost, currency) : `${currencySymbol}—`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t.currentValue}</span>
              <span className="font-mono text-sm font-semibold text-white">
                {currentVal > 0 ? formatPrice(currentVal, currency) : `${currencySymbol}—`}
              </span>
            </div>
          </div>
          <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>{t.profitLoss}</span>
              <div className="text-right">
                <div
                  className="font-mono text-2xl font-black leading-none"
                  style={{ color: pl > 0 ? "#00FF9C" : pl < 0 ? "#FF4D4D" : "rgba(255,255,255,0.5)" }}
                >
                  {pl !== 0
                    ? (pl > 0 ? "+" : "-") + formatPrice(Math.abs(pl), currency)
                    : `${currencySymbol}0`}
                </div>
                <div
                  className="text-xs font-bold mt-1"
                  style={{ color: pl > 0 ? "rgba(0,255,156,0.7)" : pl < 0 ? "rgba(255,77,77,0.7)" : "rgba(255,255,255,0.25)" }}
                >
                  {plPercent !== 0 ? (plPercent > 0 ? "+" : "") + plPercent.toFixed(2) + "%" : "0.00%"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
