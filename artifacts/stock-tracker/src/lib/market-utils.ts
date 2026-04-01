/**
 * Market timezone and trading-hours utilities.
 * Maps exchange names / currencies to timezones and computes open/closed status.
 */

export interface MarketInfo {
  tz: string;
  city: string;
  label: string;
  openH: number;
  openM: number;
  closeH: number;
  closeM: number;
}

export function getMarketInfo(exchangeName: string, currency: string): MarketInfo {
  const ex = (exchangeName ?? "").toLowerCase();
  const cur = (currency ?? "").toUpperCase();

  if (ex.includes("ksc") || ex.includes("koe") || ex.includes("krx") ||
      ex.includes("kospi") || ex.includes("kosdaq") || ex.includes("nasdaqks") || cur === "KRW") {
    return { tz: "Asia/Seoul",      city: "Seoul",     label: "KST",      openH: 9,  openM: 0,  closeH: 15, closeM: 30 };
  }
  if (ex.includes("toronto") || ex.includes("tsx") || ex.includes("venture") || cur === "CAD") {
    return { tz: "America/Toronto", city: "Toronto",   label: "ET",       openH: 9,  openM: 30, closeH: 16, closeM: 0  };
  }
  if (ex.includes("london") || ex.includes("lse") || cur === "GBP") {
    return { tz: "Europe/London",   city: "London",    label: "GMT/BST",  openH: 8,  openM: 0,  closeH: 16, closeM: 30 };
  }
  if (ex.includes("tokyo") || ex.includes("jpx") || ex.includes("osaka") || cur === "JPY") {
    return { tz: "Asia/Tokyo",      city: "Tokyo",     label: "JST",      openH: 9,  openM: 0,  closeH: 15, closeM: 30 };
  }
  if (ex.includes("hong kong") || ex.includes("hkse") || ex.includes("hkex") || cur === "HKD") {
    return { tz: "Asia/Hong_Kong",  city: "Hong Kong", label: "HKT",      openH: 9,  openM: 30, closeH: 16, closeM: 0  };
  }
  if (ex.includes("shanghai") || ex.includes("shenzhen") || cur === "CNY" || cur === "CNH") {
    return { tz: "Asia/Shanghai",   city: "Shanghai",  label: "CST",      openH: 9,  openM: 30, closeH: 15, closeM: 0  };
  }
  if (ex.includes("nse") || ex.includes("bse") || ex.includes("bombay") || ex.includes("mumbai") || cur === "INR") {
    return { tz: "Asia/Kolkata",    city: "Mumbai",    label: "IST",      openH: 9,  openM: 15, closeH: 15, closeM: 30 };
  }
  if (ex.includes("singapore") || ex.includes("sgx") || cur === "SGD") {
    return { tz: "Asia/Singapore",  city: "Singapore", label: "SGT",      openH: 9,  openM: 0,  closeH: 17, closeM: 0  };
  }
  if (ex.includes("taiwan") || ex.includes("twse") || ex.includes("tpex") || cur === "TWD") {
    return { tz: "Asia/Taipei",     city: "Taipei",    label: "CST",      openH: 9,  openM: 0,  closeH: 13, closeM: 30 };
  }
  if (ex.includes("sydney") || ex.includes("asx") || cur === "AUD") {
    return { tz: "Australia/Sydney",city: "Sydney",    label: "AEST/AEDT",openH: 10, openM: 0,  closeH: 16, closeM: 0  };
  }
  if (ex.includes("paris") || ex.includes("euronext")) {
    return { tz: "Europe/Paris",    city: "Paris",     label: "CET/CEST", openH: 9,  openM: 0,  closeH: 17, closeM: 30 };
  }
  if (ex.includes("amsterdam")) {
    return { tz: "Europe/Amsterdam",city: "Amsterdam", label: "CET/CEST", openH: 9,  openM: 0,  closeH: 17, closeM: 30 };
  }
  if (ex.includes("milan") || ex.includes("borsa")) {
    return { tz: "Europe/Rome",     city: "Milan",     label: "CET/CEST", openH: 9,  openM: 0,  closeH: 17, closeM: 30 };
  }
  if (ex.includes("madrid") || ex.includes("bme")) {
    return { tz: "Europe/Madrid",   city: "Madrid",    label: "CET/CEST", openH: 9,  openM: 0,  closeH: 17, closeM: 30 };
  }
  if (ex.includes("stockholm") || ex.includes("nasdaq stockholm") || cur === "SEK") {
    return { tz: "Europe/Stockholm",city: "Stockholm", label: "CET/CEST", openH: 9,  openM: 0,  closeH: 17, closeM: 30 };
  }
  if (ex.includes("zurich") || ex.includes("six") || cur === "CHF") {
    return { tz: "Europe/Zurich",   city: "Zurich",    label: "CET/CEST", openH: 9,  openM: 0,  closeH: 17, closeM: 30 };
  }
  if (ex.includes("frankfurt") || ex.includes("xetra") || cur === "EUR") {
    return { tz: "Europe/Berlin",   city: "Frankfurt", label: "CET/CEST", openH: 9,  openM: 0,  closeH: 17, closeM: 30 };
  }
  if (ex.includes("brazil") || ex.includes("b3") || ex.includes("bovespa") || cur === "BRL") {
    return { tz: "America/Sao_Paulo",city: "São Paulo",label: "BRT",      openH: 10, openM: 0,  closeH: 17, closeM: 0  };
  }
  return { tz: "America/New_York",  city: "New York",  label: "ET",       openH: 9,  openM: 30, closeH: 16, closeM: 0  };
}

export function formatMarketTime(date: Date, tz: string): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

export function formatMarketDate(date: Date, tz: string): string {
  return date.toLocaleDateString("en-US", {
    timeZone: tz, weekday: "short", month: "short", day: "numeric",
  });
}

export function isMarketOpen(now: Date, market: MarketInfo): boolean {
  const weekdayNum = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(
    now.toLocaleString("en-US", { timeZone: market.tz, weekday: "short" }).slice(0, 3),
  );
  if (weekdayNum === 0 || weekdayNum === 6) return false;

  const localH = parseInt(now.toLocaleString("en-US", { timeZone: market.tz, hour: "2-digit", hour12: false }), 10);
  const localM = parseInt(now.toLocaleString("en-US", { timeZone: market.tz, minute: "2-digit" }), 10);
  const nowMins   = localH * 60 + localM;
  const openMins  = market.openH * 60 + market.openM;
  const closeMins = market.closeH * 60 + market.closeM;
  return nowMins >= openMins && nowMins < closeMins;
}
