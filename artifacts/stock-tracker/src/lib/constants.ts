/**
 * Static data constants for the Stock Tracker UI.
 * Keeping them here (rather than inside components) makes them easy to update
 * and avoids recreating them on every render.
 */

import type { ChartRange } from "@/hooks/use-chart";

export type Market = "us" | "kr" | "cn";

export interface WatchlistTicker {
  symbol: string;
  label: string;
}

/** Default watchlist tickers per market */
export const MARKET_TICKERS: Record<Market, WatchlistTicker[]> = {
  us: [
    { symbol: "AAPL",  label: "AAPL"  },
    { symbol: "TSLA",  label: "TSLA"  },
    { symbol: "NVDA",  label: "NVDA"  },
    { symbol: "MSFT",  label: "MSFT"  },
    { symbol: "GOOGL", label: "GOOGL" },
    { symbol: "AMZN",  label: "AMZN"  },
    { symbol: "META",  label: "META"  },
  ],
  kr: [
    { symbol: "005930.KS", label: "삼성전자"  },
    { symbol: "000660.KS", label: "SK하이닉스" },
    { symbol: "035420.KS", label: "NAVER"    },
    { symbol: "035720.KS", label: "카카오"    },
    { symbol: "051910.KS", label: "LG화학"    },
    { symbol: "006400.KS", label: "삼성SDI"   },
    { symbol: "207940.KS", label: "삼성바이오" },
  ],
  cn: [
    { symbol: "9988.HK", label: "阿里巴巴" },
    { symbol: "9888.HK", label: "百度"    },
    { symbol: "9618.HK", label: "京东"    },
    { symbol: "3690.HK", label: "美团"    },
    { symbol: "9866.HK", label: "蔚来"    },
    { symbol: "2015.HK", label: "理想汽车"  },
    { symbol: "9868.HK", label: "小鹏汽车"  },
  ],
};

/** Available chart time ranges */
export const CHART_RANGES: { label: string; value: ChartRange }[] = [
  { label: "1D",  value: "1d"  },
  { label: "3D",  value: "3d"  },
  { label: "1W",  value: "1w"  },
  { label: "1M",  value: "1mo" },
  { label: "3M",  value: "3mo" },
  { label: "6M",  value: "6mo" },
  { label: "1Y",  value: "1y"  },
  { label: "5Y",  value: "5y"  },
  { label: "ALL", value: "max" },
];
