import { useState, useEffect } from "react";

/**
 * Returns a `now` Date that updates every second.
 * Used by components that display a live market clock.
 * The interval is paused when `active` is false (e.g. when the
 * component is on a hidden view) to avoid unnecessary renders.
 */
export function useMarketClock(active = true): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);

  return now;
}
