import { useState, useEffect, useRef } from "react";

/**
 * Tracks price changes and returns a flash direction ("up" | "down" | null).
 * The flash resets automatically after `durationMs` milliseconds.
 * Also resets whenever the `ticker` changes.
 */
export function usePriceFlash(
  price: number | undefined,
  ticker: string,
  durationMs = 2000,
): "up" | "down" | null {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when the ticker changes
  useEffect(() => {
    prevPriceRef.current = null;
    setFlash(null);
  }, [ticker]);

  // Detect price change and trigger flash
  useEffect(() => {
    if (price === undefined) return;
    const prev = prevPriceRef.current;
    if (prev !== null && prev !== price) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setFlash(price > prev ? "up" : "down");
      timerRef.current = setTimeout(() => setFlash(null), durationMs);
    }
    prevPriceRef.current = price;
  }, [price, durationMs]);

  return flash;
}
