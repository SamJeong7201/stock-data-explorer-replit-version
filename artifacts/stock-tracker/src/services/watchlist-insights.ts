/**
 * watchlist-insights.ts
 *
 * Insight adapter for per-stock and portfolio-level watchlist intelligence.
 *
 * Architecture:
 *  - `InsightProvider` is a pure interface — no UI / React dependency.
 *  - `MockInsightProvider` is the current implementation using deterministic
 *    content derived from the ticker symbol.
 *  - `getBatchInsights` is the primary entry point; it supports future
 *    single-round-trip API calls (e.g. POST /api/watchlist/insights).
 *  - To swap in a real AI backend, implement `ApiInsightProvider` and
 *    replace the exported `insightProvider` singleton. Zero changes needed
 *    in hooks or UI.
 *
 * Content:
 *  - Mock text is written natively per language (EN/KO/ZH) — not translated.
 *  - Signal / strength / newsPulse / riskFlag are seeded from ticker hash for
 *    consistency across renders without requiring stored state.
 */

import type { Lang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Domain models
// ─────────────────────────────────────────────────────────────────────────────

export type Signal        = "bullish" | "bearish" | "neutral";
export type NewsPulse     = "hot" | "quiet" | "mixed";
export type SignalStrength = 1 | 2 | 3 | 4 | 5;
export type QuickActionType = "why_moving" | "risk_view" | "what_to_watch" | "market_read";

/** Which Priority Board section a stock belongs to */
export type SectionId = "priority" | "risk" | "momentum" | "quiet";

/**
 * Classify a StockInsight into exactly one Priority Board section.
 * Rules (evaluated in order):
 *   1. TODAY'S PRIORITY  — bullish + strength≥4 + hot news
 *   2. HIGHEST RISK      — bearish signal OR has riskFlag + not bullish
 *   3. MOMENTUM          — bullish + strength≥3
 *   4. QUIET             — everything else
 */
export function classifyInsight(insight: StockInsight): SectionId {
  const { signal, signalStrength, newsPulse, riskFlag } = insight;
  if (signal === "bullish" && signalStrength >= 4 && newsPulse === "hot") return "priority";
  if (signal === "bearish") return "risk";
  if (riskFlag !== null && signal !== "bullish") return "risk";
  if (signal === "bullish" && signalStrength >= 3) return "momentum";
  return "quiet";
}

export interface StockInsight {
  symbol:         string;
  signal:         Signal;
  signalStrength: SignalStrength;
  teaser:         string;          // 1 line — shown to free users
  summary:        string;          // 2-3 sentences — Pro only
  drivers:        string[];        // 2-3 bullets — Pro only
  newsPulse:      NewsPulse;       // Pro only
  riskFlag:       string | null;   // e.g. "Earnings in ~2 weeks" — Pro only
  generatedAt:    string;          // ISO timestamp
}

/** Portfolio-level synthesis across all watched tickers */
export interface PortfolioInsight {
  overallSentiment: Signal;
  theme:            string;        // 1-2 sentence thematic read
  topPick:          string | null; // symbol of the highest-conviction bullish name
  riskSummary:      string;        // 1 sentence risk note
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter interface  ← the only surface hooks/UI depend on
// ─────────────────────────────────────────────────────────────────────────────

export interface InsightProvider {
  /**
   * Fetch insights for a batch of symbols.
   * Returns a Map<symbol, StockInsight>.
   * Future API impl: single POST /api/watchlist/insights { symbols, lang }
   */
  getBatchInsights(symbols: string[], lang: Lang): Promise<Map<string, StockInsight>>;

  /**
   * Derive a portfolio-level read from a set of already-fetched insights.
   * Kept synchronous since it's a pure aggregation over existing data.
   */
  getPortfolioInsight(insights: StockInsight[], lang: Lang): PortfolioInsight;

  /**
   * Return a quick action response for a given symbol and action type.
   * Free users: 1–2 sentence teaser.  Pro users: 3–5 sentence deep read.
   * Future API impl: POST /api/watchlist/quick-action { symbol, action, lang, isPro }
   */
  getQuickAction(
    symbol:    string,
    action:    QuickActionType,
    lang:      Lang,
    isProUser: boolean,
  ): Promise<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic hash — seeds mock content per ticker for stable renders
// ─────────────────────────────────────────────────────────────────────────────

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = ((h * 31) + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Defensively picks an element from an array.
 * Uses a two-step modulo so the result is always non-negative:
 *   ((seed % len) + len) % len
 * This handles negative seeds that arise from signed bit-shifts (>> n)
 * when the hash value has bit-31 set (i.e. h >= 2^31).
 * Also guards against empty arrays — returns the first element if len === 0.
 */
function pick<T>(arr: T[], seed: number): T {
  if (arr.length === 0) return undefined as unknown as T;
  const len = arr.length;
  const idx = ((seed % len) + len) % len;
  return arr[idx];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock content — language-native, not translated
// ─────────────────────────────────────────────────────────────────────────────

// ── English ──────────────────────────────────────────────────────────────────

const EN_BULLISH = [
  {
    teaser: (t: string) => `${t} showing institutional accumulation; sector rotation supporting the name.`,
    summary: (t: string) => `${t} is attracting meaningful institutional flows consistent with conviction-building rather than index rebalancing. The price structure reflects demand at each pullback, with volume supporting the directional thesis. Near-term, the risk/reward for incremental exposure looks favorable relative to sector peers.`,
    drivers: (t: string) => [
      `${t} outperforming sector on a risk-adjusted basis over the trailing 20 sessions`,
      `Options market showing call accumulation at above-market strikes — consistent with upside positioning`,
      `Earnings estimate revisions trending positive; consensus has been raising the bar incrementally`,
    ],
  },
  {
    teaser: (t: string) => `${t} breaking out of consolidation range with improving volume profile.`,
    summary: (t: string) => `${t} has cleared a multi-week consolidation range that had compressed the reward structure. The volume on the breakout day was well above the 20-day average, lending conviction to the directional move. Sector conditions are supportive and no earnings catalyst is imminent that would create binary event risk.`,
    drivers: (t: string) => [
      `Technical breakout confirmed on above-average volume — reduces the probability of a false break`,
      `Relative strength vs. index improving steadily over the past month`,
      `No near-term earnings risk — clean setup for momentum to develop without a catalyst reset`,
    ],
  },
  {
    teaser: (t: string) => `${t} benefiting from sector tailwind as risk appetite rotates into growth.`,
    summary: (t: string) => `${t} is riding a sector-level tailwind that is adding momentum beyond company-specific fundamentals. Risk appetite has been rotating back into growth names, and ${t} sits in a favorable position within the sector pecking order. The setup is broad-based rather than idiosyncratic.`,
    drivers: (t: string) => [
      `Growth sector seeing renewed institutional inflows; ${t} is a natural beneficiary`,
      `Rate expectations have eased modestly, compressing the discount rate headwind on growth multiples`,
      `Peer results suggest improving end-market demand — supportive read-through for ${t}`,
    ],
  },
];

const EN_BEARISH = [
  {
    teaser: (t: string) => `${t} under macro headwinds; rate sensitivity weighing on near-term setup.`,
    summary: (t: string) => `${t} is trading in line with broader multiple compression as real yields remain elevated. The premium the market had assigned to the name's growth durability is under pressure, and the current price action reflects a risk-off positioning flush rather than a fundamental re-rating. The path of least resistance remains lower until rate expectations stabilize.`,
    drivers: (t: string) => [
      `10Y yield elevation compressing growth multiples across the sector — ${t} is not insulated`,
      `Relative underperformance vs. sector peers over the trailing 10 sessions signals low conviction from buyers`,
      `Put/call ratio elevated — portfolio managers reducing delta rather than adding directional short exposure`,
    ],
  },
  {
    teaser: (t: string) => `${t} losing relative strength vs. sector; technical structure deteriorating.`,
    summary: (t: string) => `${t} has been steadily losing ground against its sector peers, a pattern that typically precedes further derating. The volume profile on down-days exceeds that on up-days, signaling distribution. Without a catalyst to reset the narrative, the tactical setup favors waiting for a lower entry or cleaner confirmation before rebuilding exposure.`,
    drivers: (t: string) => [
      `Distribution pattern visible in price/volume divergence over the past 15 sessions`,
      `Below sector on relative strength ranking — institutional preference rotating to peers`,
      `Key support levels approaching; a decisive break would likely trigger systematic selling`,
    ],
  },
  {
    teaser: (t: string) => `${t} facing earnings revision risk; consensus estimates under pressure.`,
    summary: (t: string) => `The risk for ${t} is that forward estimates have not yet fully reflected macro headwinds feeding through to the business. Consensus is pricing in a recovery trajectory that requires a constructive macro backdrop to deliver — the current environment does not guarantee that. Estimate risk is asymmetrically to the downside until there is more clarity on demand trends.`,
    drivers: (t: string) => [
      `Forward estimates still embed an optimistic demand recovery assumption — downside revision risk elevated`,
      `Recent peer guidance has been cautious, creating a negative read-through for the sector`,
      `Valuation offers limited cushion against downside surprises — the margin of safety is thin at current levels`,
    ],
  },
];

const EN_NEUTRAL = [
  {
    teaser: (t: string) => `${t} range-bound; no dominant catalyst driving a directional setup.`,
    summary: (t: string) => `${t} is in a holding pattern between clear support and resistance levels, with neither bulls nor bears establishing control. Volume has been trending below average, consistent with low conviction in both directions. The setup is best described as event-driven — the next meaningful move will likely require a specific catalyst (earnings, macro data, sector news) rather than technical continuation.`,
    drivers: (t: string) => [
      `${t} consolidating in a defined range — breakout in either direction would require a volume catalyst`,
      `No material earnings or corporate events imminent — price action likely to remain subdued`,
      `Sector sentiment is mixed; no broad tailwind or headwind applying directional pressure`,
    ],
  },
];

// ── Korean (기관 리서치 보고서 문체) ─────────────────────────────────────────

const KO_BULLISH = [
  {
    teaser: (t: string) => `${t} 기관 매집 흐름 확인; 섹터 로테이션이 수급을 지지.`,
    summary: (t: string) => `${t}는 지수 리밸런싱이 아닌 컨빅션 기반의 의미 있는 기관 수급 유입이 관찰된다. 가격 구조는 눌림 구간에서 매수세가 유입되는 패턴이며, 거래량이 방향성 테마를 뒷받침한다. 단기 리스크/리워드는 섹터 동종 대비 추가 노출 확대에 유리한 국면이다.`,
    drivers: (t: string) => [
      `${t} 직전 20거래일 기준 리스크 조정 후 수익률에서 섹터 내 아웃퍼폼 지속`,
      `시장가 위 행사가에 콜옵션 잔고 누적 — 업사이드 포지셔닝과 일치하는 기관 행태`,
      `실적 컨센서스 EPS 상향 기조 지속; 시장 기대치가 점진적으로 상승 중`,
    ],
  },
  {
    teaser: (t: string) => `${t} 횡보 박스권 돌파, 거래량 동반 상승으로 방향성 확인.`,
    summary: (t: string) => `${t}는 보상 구조를 압축하던 수주간의 횡보 박스권을 이탈했다. 돌파 당일 거래량이 20일 평균을 크게 상회하며 방향성 신뢰도를 높였다. 섹터 환경은 우호적이며 이벤트 리스크를 유발할 실적 일정이 당장은 없어 클린한 셋업이다.`,
    drivers: (t: string) => [
      `평균 이상의 거래량을 동반한 기술적 돌파 확인 — 허위 돌파 가능성을 낮춤`,
      `지수 대비 상대 강도 지속 개선 — 지난 한 달간 꾸준한 우위 유지`,
      `단기 실적 이벤트 리스크 없음 — 카탈리스트 리셋 없이 모멘텀 전개 가능한 클린 환경`,
    ],
  },
  {
    teaser: (t: string) => `${t} 성장주 로테이션 수혜; 섹터 전반 매수세 유입.`,
    summary: (t: string) => `${t}는 종목 고유 펀더멘털을 넘어 섹터 레벨의 순풍이 모멘텀을 가산하고 있다. 위험 선호 심리가 성장주로 다시 로테이션되면서 ${t}는 섹터 내에서 유리한 위치에 자리한다. 종목 특이 요인이 아닌 광범위한 섹터 수급 개선이 핵심 드라이버다.`,
    drivers: (t: string) => [
      `성장 섹터로의 기관 순매수 재개; ${t}는 자연스러운 수혜 종목`,
      `금리 기대치 소폭 하향 안정 — 성장주 멀티플 할인율 헤드윈드 일부 완화`,
      `동종 기업 실적이 최종 수요 개선을 시사 — ${t}에 긍정적 리드스루`,
    ],
  },
];

const KO_BEARISH = [
  {
    teaser: (t: string) => `${t} 매크로 역풍; 금리 민감도가 단기 셋업에 부담.`,
    summary: (t: string) => `${t}는 실질금리 고점 지속에 따른 광범위한 멀티플 압축 흐름과 동조하고 있다. 시장이 이 종목에 부여했던 성장 내구성 프리미엄은 하락 압박을 받고 있으며, 현재 주가 흐름은 펀더멘털 재평가가 아닌 리스크 오프 포지션 정리의 성격이 짙다. 금리 기대치가 안정되기 전까지 저항선의 무게가 지속될 가능성이 높다.`,
    drivers: (t: string) => [
      `10년물 수익률 고점 유지가 섹터 전반의 성장 멀티플을 압박 — ${t}도 예외가 아님`,
      `직전 10거래일 섹터 동종 대비 언더퍼폼 — 매수 측의 컨빅션 저하 시그널`,
      `풋/콜 비율 상승 — 신규 숏 구축보다는 기관의 델타 축소 헤징 행태`,
    ],
  },
  {
    teaser: (t: string) => `${t} 섹터 대비 상대 강도 약화; 기술적 구조 악화 중.`,
    summary: (t: string) => `${t}는 섹터 동종 대비 지속적인 상대 약세를 보이고 있으며, 이는 일반적으로 추가 디레이팅 선행 패턴이다. 하락 일의 거래량이 상승 일을 초과하며 분산 신호를 보내고 있다. 내러티브를 바꿀 카탈리스트가 없는 상황에서 더 낮은 진입 레벨 또는 더 명확한 확인 신호를 기다리는 전술적 접근이 합리적이다.`,
    drivers: (t: string) => [
      `직전 15거래일 가격/거래량 다이버전스에서 분산 패턴 확인 가능`,
      `섹터 내 상대 강도 순위 하락 — 기관 선호도가 동종 대비 약화`,
      `핵심 지지선 접근 중; 결정적 이탈 시 시스템 매도 트리거 가능성`,
    ],
  },
  {
    teaser: (t: string) => `${t} 실적 추정치 하향 리스크; 컨센서스 압박 가시화.`,
    summary: (t: string) => `${t}의 위험은 선행 추정치가 아직 매크로 역풍의 비즈니스 파급 효과를 완전히 반영하지 않았다는 점이다. 컨센서스는 회복 궤적을 이미 가격에 반영하고 있으나, 현재 거시 환경은 그 달성을 보장하지 않는다. 수요 동향 명확성이 확보되기 전까지 추정치 리스크는 하방으로 비대칭적이다.`,
    drivers: (t: string) => [
      `선행 추정치가 낙관적 수요 회복 가정 내포 — 하향 조정 리스크 상존`,
      `최근 동종 기업 가이던스 보수적 제시 — 섹터 부정적 리드스루 확인`,
      `밸류에이션이 하방 서프라이즈 대비 완충 여지 부족 — 현 레벨 안전 마진 제한적`,
    ],
  },
];

const KO_NEUTRAL = [
  {
    teaser: (t: string) => `${t} 박스권 혼조; 방향성 카탈리스트 부재로 관망 국면.`,
    summary: (t: string) => `${t}는 명확한 지지·저항 사이에서 매수·매도 어느 쪽도 주도권을 잡지 못하는 혼조 국면이다. 거래량이 평균 이하로 수렴하며 양방향 모두 컨빅션이 낮음을 시사한다. 다음 의미 있는 방향성 움직임은 기술적 연속성보다 특정 이벤트(실적, 매크로 데이터, 섹터 뉴스)에 의해 촉발될 가능성이 높다.`,
    drivers: (t: string) => [
      `${t} 명확한 박스권 내 횡보 — 거래량 동반 돌파가 있어야 방향성 확인 가능`,
      `당분간 실적 또는 기업 이벤트 없음 — 주가 변동성 제한 예상`,
      `섹터 센티먼트 혼재; 방향성 압력을 가하는 광범위한 순풍·역풍 부재`,
    ],
  },
];

// ── Chinese (国内券商研报文体) ─────────────────────────────────────────────────

const ZH_BULLISH = [
  {
    teaser: (t: string) => `${t}机构建仓迹象明显；板块轮动为该股提供资金支撑。`,
    summary: (t: string) => `${t}正吸引与主动建仓一致的机构资金流入，而非指数被动再平衡。价格结构在回调区间呈现需求承接，成交量对方向性逻辑形成有效验证。短期内，相对于同类板块个股，增加仓位的风险收益比较为有利。`,
    drivers: (t: string) => [
      `${t}近20个交易日经风险调整后收益率持续跑赢板块均值`,
      `期权市场价外认购合约持仓增加，与机构上行方向布局吻合`,
      `盈利预期持续上修，卖方一致预期逐步抬升`,
    ],
  },
  {
    teaser: (t: string) => `${t}突破盘整区间，成交量配合验证方向性有效性。`,
    summary: (t: string) => `${t}有效突破了压缩收益结构的多周盘整区间。突破当日成交量显著高于20日均量，为方向性走势提供了较高可信度。板块环境支持，且近期无二元事件风险的业绩催化，走势较为干净。`,
    drivers: (t: string) => [
      `放量突破技术形态确认，有效降低假突破概率`,
      `相对指数强度持续改善，过去一个月稳定维持优势`,
      `无近期业绩事件风险，动能形成路径干净，不存在催化剂重置风险`,
    ],
  },
  {
    teaser: (t: string) => `${t}受益于成长风格轮动；板块整体资金回流。`,
    summary: (t: string) => `${t}正在享受超越公司自身基本面的板块层面顺风支撑。风险偏好重新向成长股轮动，${t}在板块内排位较为有利。驱动力更多来自板块整体资金改善，而非个股特异性逻辑。`,
    drivers: (t: string) => [
      `成长板块机构净流入重启；${t}是资金自然流向的头部标的`,
      `利率预期小幅回落，成长股估值折现率压力部分缓解`,
      `同类公司业绩印证终端需求改善，对${t}形成积极传导`,
    ],
  },
];

const ZH_BEARISH = [
  {
    teaser: (t: string) => `${t}面临宏观逆风；利率敏感性对短期走势构成压制。`,
    summary: (t: string) => `${t}跟随实际利率高企背景下的整体估值压缩走势。市场赋予该股成长稳定性的溢价正承压，当前价格行为更多反映的是风险规避下的仓位清洗，而非基本面重新定价。在利率预期企稳之前，阻力方向仍偏向下行。`,
    drivers: (t: string) => [
      `10年期收益率维持高位，压制板块整体成长倍数；${t}同样无法独善其身`,
      `近10个交易日相对板块同类个股落后，买方信心不足信号明显`,
      `认沽/认购比率上升，更多反映机构降低Delta敞口的对冲行为，而非主动做空`,
    ],
  },
  {
    teaser: (t: string) => `${t}相对板块强度持续走弱；技术结构出现恶化。`,
    summary: (t: string) => `${t}持续落后于板块同类标的，这一模式通常是进一步估值折价的先行信号。下跌日成交量超过上涨日，显示出明显的分发迹象。在缺乏逆转叙事催化剂的情况下，战术上更宜等待更低入场价位或更明确确认信号后再重建仓位。`,
    drivers: (t: string) => [
      `近15个交易日价量背离呈现分发形态，可视为机构出货迹象`,
      `板块内相对强度排名下滑，机构偏好向同类股转移`,
      `关键支撑位临近，若有效跌破将大概率触发系统性卖盘`,
    ],
  },
  {
    teaser: (t: string) => `${t}面临盈利预期下修风险；一致预期压力逐步显现。`,
    summary: (t: string) => `${t}的核心风险在于前瞻性预测尚未充分消化宏观逆风对业务的传导影响。当前一致预期已隐含复苏轨迹假设，但现有宏观环境不足以保障其兑现。在需求趋势确认之前，预期下修风险呈下行方向的非对称性。`,
    drivers: (t: string) => [
      `前瞻性预测仍内嵌乐观的需求回升假设，下修风险持续存在`,
      `近期同类公司指引偏保守，形成板块负向传导确认`,
      `当前估值对下行超预期的安全边际不足，容错空间有限`,
    ],
  },
];

const ZH_NEUTRAL = [
  {
    teaser: (t: string) => `${t}区间震荡；缺乏明确催化剂，方向性有待确认。`,
    summary: (t: string) => `${t}在明确支撑与阻力区间内陷入拉锯，多空双方均未能取得主导权。成交量持续低于均值，两个方向均呈低信心特征。下一次有意义的方向性走势，更可能由特定事件（业绩、宏观数据、板块新闻）驱动，而非技术性延续。`,
    drivers: (t: string) => [
      `${t}在明确区间内震荡整理，需要放量突破才能确认方向`,
      `短期无业绩或重大公司事件，股价波动预计维持收敛`,
      `板块情绪分化，缺乏施加方向性压力的广泛顺风或逆风`,
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Risk flags — picked deterministically per ticker
// ─────────────────────────────────────────────────────────────────────────────

const RISK_FLAGS: Record<Lang, Array<string | null>> = {
  en: [
    null,
    "Earnings in ~2–3 weeks",
    "Elevated short interest",
    "Rate sensitivity above sector average",
    null,
    "Sector under analyst downgrade pressure",
    null,
    "Insider selling reported recently",
  ],
  ko: [
    null,
    "2~3주 내 실적 발표 예정",
    "공매도 잔고 비율 상위권",
    "섹터 평균 대비 금리 민감도 높음",
    null,
    "섹터 내 애널리스트 하향 압박",
    null,
    "최근 내부자 매도 보고",
  ],
  zh: [
    null,
    "约2~3周内发布业绩",
    "空头头寸比例偏高",
    "利率敏感性高于板块均值",
    null,
    "板块内分析师下调压力增加",
    null,
    "近期有内部人士减持记录",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio themes — picked from insight signals
// ─────────────────────────────────────────────────────────────────────────────

const PORTFOLIO_THEMES: Record<Lang, Record<Signal, string[]>> = {
  en: {
    bullish: [
      "Your watchlist skews constructive — institutional flows and sector rotation are both working in your favor. Monitor for a macro catalyst that could compress multiples before adding further.",
      "Risk/reward across your portfolio looks favorable. Sector tailwinds and positive estimate revision trends are both supportive. The main risk is a reversal in rate expectations that resets growth multiples.",
    ],
    bearish: [
      "Your watchlist is facing a broad headwind environment. Rate sensitivity and macro uncertainty are compressing multiples across your holdings. Defensive positioning is more tactical than structural at this stage.",
      "Portfolio sentiment is cautious. Multiple names are showing distribution patterns and relative underperformance. It may be worth reviewing position sizing before the next catalyst event.",
    ],
    neutral: [
      "Your watchlist is split — some names showing constructive setups while others face macro headwinds. Selective positioning is warranted; avoid treating the portfolio as directionally uniform.",
      "Mixed signals across your holdings suggest an environment where stock selection matters more than macro tilts. Monitor relative strength divergences to allocate capital toward the cleaner setups.",
    ],
  },
  ko: {
    bullish: [
      "워치리스트 전반이 건설적 국면으로 기울어 있습니다. 기관 수급과 섹터 로테이션이 모두 유리하게 작용 중입니다. 추가 비중 확대 전, 멀티플을 압축할 수 있는 매크로 카탈리스트 발생 여부를 모니터링하세요.",
      "포트폴리오 전반의 리스크/리워드가 양호한 국면입니다. 섹터 순풍과 실적 추정치 상향 기조가 모두 지지 요인입니다. 주요 리스크는 금리 기대치 반전으로 인한 성장 멀티플 재조정입니다.",
    ],
    bearish: [
      "워치리스트가 광범위한 역풍 환경에 노출되어 있습니다. 금리 민감도와 매크로 불확실성이 보유 종목 전반의 멀티플을 압박하고 있습니다. 현시점에서 방어적 포지셔닝은 구조적이기보다 전술적 대응에 가깝습니다.",
      "포트폴리오 심리가 신중 국면입니다. 다수 종목에서 분산 패턴과 상대 약세가 관찰됩니다. 다음 카탈리스트 이벤트 전에 포지션 규모를 재검토해 볼 시점입니다.",
    ],
    neutral: [
      "워치리스트 신호가 혼조입니다. 일부 종목은 건설적 셋업을 보이는 반면, 다른 종목들은 매크로 역풍에 노출되어 있습니다. 포트폴리오 전체를 동일 방향으로 취급하지 말고 선별적 포지셔닝이 필요합니다.",
      "보유 종목 전반의 혼재된 신호는 매크로 방향보다 종목 선별이 더 중요한 환경임을 시사합니다. 상대 강도 다이버전스를 모니터링하여 더 명확한 셋업의 종목에 자본을 배분하세요.",
    ],
  },
  zh: {
    bullish: [
      "您的自选股整体偏向乐观——机构资金流向与板块轮动均对您有利。在进一步加仓前，请关注可能压缩估值倍数的宏观催化剂。",
      "组合整体风险收益比较为有利。板块顺风与盈利预期上修趋势共同提供支撑。主要风险在于利率预期逆转导致成长股估值重置。",
    ],
    bearish: [
      "您的自选股正面临广泛的逆风环境。利率敏感性与宏观不确定性正在压缩持仓整体估值。此阶段的防御性持仓更多是战术性调整，而非结构性转变。",
      "组合情绪偏谨慎。多只个股呈现分发形态与相对弱势。在下一个催化剂事件前，有必要审视仓位规模是否合理。",
    ],
    neutral: [
      "您的自选股信号分化——部分个股走势偏积极，其他则面临宏观逆风。需要选择性持仓，避免将整个组合视为方向一致的整体。",
      "持仓信号混合，表明当前环境中个股选择比宏观方向更为关键。关注相对强度分化，将资本配置至逻辑更干净的个股。",
    ],
  },
};

const RISK_SUMMARIES: Record<Lang, Record<Signal, string>> = {
  en: {
    bullish: "Primary risk: macro rate repricing that resets growth multiples. Watch the 10Y yield and Fed communication as the dominant inputs.",
    bearish: "Downside risk from further estimate revisions. Manage position sizing carefully into the next round of earnings results.",
    neutral:   "Idiosyncratic risks dominate over macro at this stage. Review each name on its own merits rather than applying a uniform portfolio view.",
  },
  ko: {
    bullish: "주요 리스크: 성장 멀티플을 재조정하는 매크로 금리 재평가. 10년물 금리와 연준 커뮤니케이션을 핵심 변수로 모니터링 필요.",
    bearish: "추가 추정치 하향 리스크 상존. 다음 실적 발표 시즌에 앞서 포지션 규모 관리를 신중히 접근해야 합니다.",
    neutral:   "현 단계에서는 매크로보다 종목 특이 리스크가 지배적입니다. 포트폴리오 전체에 일률적 시각을 적용하기보다 종목별 독립 판단이 필요합니다.",
  },
  zh: {
    bullish: "主要风险：推动成长股估值重置的宏观利率重定价。重点关注10年期国债收益率与美联储沟通作为核心输入变量。",
    bearish: "持续盈利预期下修带来的下行风险不容忽视。在下一轮业绩季前应谨慎管理仓位规模。",
    neutral:   "当前阶段个股特异性风险主导，宏观因素退居其次。建议逐只个股独立判断，而非对整个组合采取统一视角。",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Quick action content — native per language, free vs. pro depth
// ─────────────────────────────────────────────────────────────────────────────

type QAContent = { free: string[]; pro: string[] };
type QAMap = Record<QuickActionType, QAContent>;

const QUICK_ACTIONS: Record<Lang, QAMap> = {
  en: {
    why_moving: {
      free: [
        "Sector rotation and improving risk appetite are driving the recent move.",
        "Short covering following an oversold technical stretch is the primary catalyst.",
        "Estimate revisions from major sellside desks are pulling in incremental institutional flows.",
      ],
      pro: [
        "The 6–10% move reflects two converging forces: a sector rerating as rate expectations soften, and upward estimate revisions from major sellside desks. Options flow confirms institutional accumulation — call-skew at above-market strikes is near a 6-month high. The move looks structural rather than positioning-driven, which reduces the probability of a sharp near-term reversal.",
        "This move is tracking a short squeeze — elevated short interest met three consecutive up-days, triggering forced covering. The underlying fundamental thesis hasn't shifted materially, which means momentum may fade once covering is complete. Watch volume on any pullback to confirm whether genuine buyers are absorbing supply at these levels.",
        "Macro tailwinds are doing the heavy lifting here: softening rate expectations have unlocked multiple expansion across the sector, and this name is a high-beta beneficiary. The move is broad-based rather than idiosyncratic, which typically means it's more durable but also more vulnerable to a macro reversal. No company-specific catalyst is needed to sustain the rally in the short term.",
      ],
    },
    risk_view: {
      free: [
        "Rate sensitivity is the primary near-term risk to monitor closely.",
        "Elevated short interest creates gap-down risk if a negative catalyst emerges.",
        "An earnings event in the next few weeks creates a binary risk window.",
      ],
      pro: [
        "Three risks deserve active monitoring: (1) Macro rate repricing — a hawkish Fed surprise compresses multiples in this sector disproportionately; (2) Earnings timing creates binary event risk in ~3 weeks, with the current multiple embedding optimistic guidance assumptions; (3) Short interest at approximately 7% of float creates two-way gap risk on any macro data surprise. Size the position to reflect asymmetric volatility, not just directional view.",
        "The dominant risk is sector-level, not company-specific — a simultaneous rate shock and growth scare would override stock-level positioning. Within the company, the key risk is a forward estimate cut driven by demand softness not yet visible in reported data. The upside risk the market underestimates: a positive macro surprise could generate an outsized short-covering rally given institutional underweight positioning.",
        "Risk profile is asymmetric in the near term. Downside tail: a negative macro data point (PCE, CPI, or Fed communication) compresses the multiple by 10–15% before any fundamental deterioration. Upside tail: earnings beat with raised guidance would force a rapid reset higher as shorts cover. The binary nature of the next 3 weeks argues for sizing conservatively unless you have a strong directional macro view.",
      ],
    },
    what_to_watch: {
      free: [
        "Watch the upcoming earnings guidance — it will set the forward market narrative.",
        "Fed communications this week are the primary macro input for this sector.",
        "Monitor sector rotation flows; any reversal would compress near-term momentum.",
      ],
      pro: [
        "Three signals to track over the next two weeks: (1) Federal Reserve tone on Wednesday — any shift in rate trajectory language moves this sector immediately; (2) Institutional positioning updates in next week's 13F filings, which will confirm or refute whether smart money is accumulating at these levels; (3) Friday's options expiry creates intraday volatility windows near key strikes — use as tactical entry or trim points rather than reacting to the move.",
        "Two highest-priority data points: (1) Upcoming earnings — focus on forward revenue guidance rather than backward EPS, since the market is already looking through near-term results; (2) A sector conference in the next 10 days may surface management guidance updates that move the stock sharply in either direction. Secondary monitoring: credit spreads in the sector are a reliable leading indicator for equity moves here and are worth a weekly check.",
        "Four things on the watchlist: (1) Tuesday's macro data print — the consensus expectation is already priced, so the move will come from the surprise component; (2) Insider transaction filings over the next 5 trading days; (3) Analyst estimate revision activity after any peer earnings results; (4) Options skew on weekly contracts — a meaningful shift in put/call ratio would signal institutional repositioning before it shows up in price.",
      ],
    },
    market_read: {
      free: [
        "Sector conditions remain broadly supportive despite macro uncertainty.",
        "Relative strength improving — the market is rewarding quality names in this environment.",
        "Credit spreads stable — macro backdrop not signaling acute stress for this sector.",
      ],
      pro: [
        "The broader market backdrop is constructive but fragile. Equity risk premium has compressed to a level that provides limited cushion against a negative macro surprise. Within this, the sector is receiving above-average inflows relative to the past 12 months — a pattern that historically precedes 6–8 weeks of sustained outperformance. The key tail risk is a coordinated macro repricing event (rate shock + growth scare simultaneously), which would override stock-specific positioning.",
        "The headline index move understates the rotation happening beneath the surface. Capital is moving from defensive into cyclical-growth names, which directly benefits this sector. That said, the move is driven more by positioning correction (underweight unwind) than fundamental conviction — historically this leads to cleaner but shorter-duration rallies. Participate with appropriate sizing rather than chasing the move at current levels.",
        "Market read is nuanced and tilted constructive. Credit markets are stable, which historically leads equity volatility by 2–3 weeks — the lack of spread widening is a positive signal. Simultaneously, institutional equity positioning data shows cyclical-growth underweight relative to history, creating a structural tailwind from forced reallocation. The risk is a sentiment shift that reverses flows before the fundamental picture catches up.",
      ],
    },
  },

  ko: {
    why_moving: {
      free: [
        "섹터 로테이션과 위험 선호 개선이 최근 주가 움직임의 핵심 동인입니다.",
        "과매도 구간 이후 강제 숏 커버링이 반등의 주된 촉매제로 작용하고 있습니다.",
        "주요 셀사이드 2곳의 실적 추정치 상향이 기관 신규 유입을 견인하고 있습니다.",
      ],
      pro: [
        "6~10%의 주가 상승은 두 가지 힘이 수렴한 결과입니다: 금리 기대치 완화에 따른 섹터 레벨 리레이팅과 주요 셀사이드의 실적 추정치 상향입니다. 옵션 플로우는 기관 매집을 확인해줍니다 — 시장가 위 콜옵션 스큐가 6개월 최고치에 근접했습니다. 포지셔닝 주도가 아닌 구조적 움직임으로 판단되어 단기 급격한 되돌림 가능성은 낮습니다.",
        "이번 상승은 숏 스퀴즈를 반영하고 있습니다 — 높았던 공매도 잔고가 3거래일 연속 상승을 만나 강제 커버링을 촉발했습니다. 펀더멘털 논리가 실질적으로 변하지 않았으므로 커버링 완료 후 모멘텀이 약화될 수 있습니다. 눌림 구간의 거래량을 주시해 실수요 매수세 유입 여부를 확인하세요.",
        "매크로 순풍이 주가를 주도하고 있습니다: 금리 기대치 완화가 섹터 전반의 멀티플 확장을 허용했고, 이 종목은 고베타 수혜주로 정확히 그 흐름에 올라탔습니다. 종목 특이 요인이 아닌 광범위한 섹터 수급 개선이 핵심이며, 랠리의 지속성은 높지만 매크로 반전 시 취약성도 동일하게 높습니다.",
      ],
    },
    risk_view: {
      free: [
        "금리 민감도가 단기 가장 중요하게 모니터링해야 할 리스크입니다.",
        "높은 공매도 잔고는 부정적 카탈리스트 발생 시 갭 하락 리스크를 내포합니다.",
        "수주 내 실적 발표 일정이 이진 이벤트 리스크 구간을 형성하고 있습니다.",
      ],
      pro: [
        "세 가지 리스크를 집중 모니터링해야 합니다: (1) 매크로 금리 재평가 — 연준의 매파적 서프라이즈는 이 섹터의 멀티플을 과도하게 압박합니다; (2) 약 3주 후 실적 발표가 이진 이벤트 리스크를 형성하며, 현재 멀티플은 낙관적 가이던스 가정을 이미 선반영합니다; (3) 유동주식 대비 약 7%의 공매도 잔고는 어떠한 매크로 데이터 서프라이즈에도 양방향 갭 리스크를 만들어냅니다. 방향성 판단뿐 아니라 비대칭 변동성을 반영한 포지션 규모 관리가 필요합니다.",
        "지배적 리스크는 종목 특이 요인이 아닌 섹터 레벨에 있습니다 — 금리 충격과 성장 우려의 동시 발생은 종목별 포지셔닝을 압도합니다. 기업 내적으로는 아직 보고된 데이터에 나타나지 않은 수요 둔화로 인한 선행 추정치 하향이 핵심 리스크입니다. 시장이 과소평가하는 상방 리스크는 긍정적 매크로 서프라이즈가 언더웨이트 포지션 대비 과도한 숏 커버링 랠리를 유발하는 시나리오입니다.",
        "단기 리스크 프로파일은 비대칭적입니다. 하방 테일: 부정적 매크로 데이터 포인트(PCE, CPI, 연준 발언)가 펀더멘털 악화 전에 멀티플을 10~15% 압축할 수 있습니다. 상방 테일: 실적 서프라이즈 + 가이던스 상향 시 숏 커버링으로 급격한 상방 리셋이 가능합니다. 향후 3주의 이진 구조는 강한 방향성 확신이 없다면 보수적 포지션 규모를 지지합니다.",
      ],
    },
    what_to_watch: {
      free: [
        "향후 실적 가이던스를 주시하세요 — 전향적 시장 내러티브를 결정합니다.",
        "이번 주 연준 발언이 이 섹터의 핵심 매크로 변수입니다.",
        "섹터 로테이션 플로우를 모니터링하세요; 반전 시 단기 모멘텀이 압축됩니다.",
      ],
      pro: [
        "향후 2주간 추적해야 할 세 가지 시그널: (1) 수요일 연준 어조 — 금리 경로 언어의 변화가 있을 경우 이 섹터가 가장 먼저 반응합니다; (2) 다음 주 13F 신고 데이터의 기관 포지셔닝 업데이트 — 현 레벨에서 스마트머니의 실제 매집 여부를 확인 또는 반증합니다; (3) 금요일 옵션 만기는 핵심 행사가 근처에서 장중 변동성 구간을 형성합니다 — 추격보다는 전술적 진입 또는 분할 매도 시점으로 활용하세요.",
        "추적 우선순위가 높은 두 가지 데이터 포인트: (1) 예정된 실적 발표 — 시장이 이미 단기 실적을 선반영하고 있으므로 EPS보다 선행 매출 가이던스에 집중하세요; (2) 향후 10일 내 섹터 컨퍼런스에서 경영진 가이던스 업데이트가 주가를 크게 움직일 수 있습니다. 부차적 모니터링: 섹터 크레딧 스프레드는 주가 움직임의 신뢰할 수 있는 선행 지표이므로 주간 단위로 점검하세요.",
        "네 가지 모니터링 항목: (1) 화요일 매크로 데이터 발표 — 컨센서스는 이미 반영됐으므로 서프라이즈 컴포넌트가 실질 움직임을 결정합니다; (2) 향후 5거래일 내 내부자 거래 신고; (3) 동종 기업 실적 발표 후 애널리스트 추정치 변화; (4) 주간 옵션 스큐 — 풋/콜 비율의 유의미한 변화는 가격 반영 전 기관 재포지셔닝을 시사합니다.",
      ],
    },
    market_read: {
      free: [
        "매크로 불확실성에도 불구하고 섹터 여건은 전반적으로 지지적입니다.",
        "상대 강도 개선 중 — 현 환경에서 시장이 우량주에 프리미엄을 부여하고 있습니다.",
        "크레딧 스프레드 안정 — 매크로 배경이 이 섹터에 급성 스트레스를 시사하지 않습니다.",
      ],
      pro: [
        "전반적 시장 여건은 건설적이나 취약성을 내포합니다. 주식 리스크 프리미엄이 압축되어 부정적 매크로 서프라이즈에 대한 완충 여지가 줄어들었습니다. 이 가운데 해당 섹터는 최근 12개월 대비 평균 이상의 자금 유입을 받고 있으며, 이는 역사적으로 6~8주의 지속적 아웃퍼폼 선행 패턴입니다. 핵심 테일 리스크는 금리 충격과 성장 우려가 동시에 발생하는 매크로 재평가 이벤트로, 종목별 포지셔닝을 압도합니다.",
        "헤드라인 지수 움직임은 표면 아래의 로테이션을 과소평가하고 있습니다. 자금이 방어주에서 경기순환 성장주로 이동 중이며, 이는 이 섹터에 직접적으로 유리합니다. 다만 이 움직임은 펀더멘털 컨빅션보다 포지셔닝 조정(언더웨이트 언와인드)에 의해 주도되고 있으며, 역사적으로 이런 경우 랠리는 깔끔하지만 지속 기간이 짧습니다. 현 레벨에서 추격보다는 적절한 규모로 참여하세요.",
        "시황 해석은 세밀한 접근이 필요합니다. 크레딧 시장 안정은 주식 변동성에 2~3주 선행하는 경향이 있어 스프레드 확대가 없다는 점은 긍정적 신호입니다. 동시에, 기관 주식 포지셔닝 데이터는 역사적 대비 경기순환 성장주 언더웨이트를 보여 구조적 재배분 강제력이 순풍으로 작용 중입니다. 리스크는 펀더멘털 개선이 따라오기 전에 센티먼트 변화가 플로우를 역전시키는 시나리오입니다.",
      ],
    },
  },

  zh: {
    why_moving: {
      free: [
        "板块轮动与风险偏好回升是近期股价波动的主要驱动因素。",
        "技术面超跌后空头回补成为股价反弹的主要推手。",
        "两大卖方机构上调盈利预期，正吸引机构投资者新增仓位。",
      ],
      pro: [
        "6~10%的涨幅来自两股力量的合力：利率预期软化带来的板块整体估值重估，以及主要卖方机构的盈利预期上修。期权资金流向印证机构建仓——价外认购期权偏斜度接近近6个月高位。走势呈现结构性驱动特征，而非仓位主导，短期急速回调概率相对可控。",
        "本轮上涨映射出空头回补行情——此前较高的空仓比例在连续三个交易日上涨后触发强制平仓。基本面逻辑未见实质变化，意味着回补完成后动能或将减弱。关注回调期间成交量，以判断是否有真实买盘在承接筹码。",
        "宏观顺风是这轮行情的主要驱动：利率预期软化打开了板块整体的估值扩张空间，而该股作为高弹性标的直接受益。驱动力更多来自板块整体而非个股特异性逻辑，这意味着行情持续性较好，但同时对宏观逆转也更为敏感。",
      ],
    },
    risk_view: {
      free: [
        "利率敏感性是当前最需要密切监控的短期风险。",
        "较高的空仓比例意味着一旦出现负面催化剂，存在跳空下跌风险。",
        "数周后的业绩发布将形成具有较高不确定性的二元事件窗口。",
      ],
      pro: [
        "需要主动关注三类风险：(1) 宏观利率重定价——美联储的鹰派超预期将对该板块估值倍数形成过度压制；(2) 约3周后的业绩发布形成二元事件风险，当前估值已隐含乐观指引假设；(3) 流通股空仓比例约7%，任何宏观数据超预期均可能引发双向跳空风险。仓位管理应基于非对称波动性，而非单一方向判断。",
        "主导风险来自板块层面而非个股——利率冲击与增长预期下修的同步发生，将压倒个股持仓逻辑。公司层面的核心风险是尚未体现在已披露数据中的需求疲软引发的预期下修。市场容易低估的上行风险，是正面宏观超预期触发大规模空头回补、低配机构被迫追涨的可能性。",
        "短期风险收益呈现非对称结构。下行尾部风险：负面宏观数据点（PCE、CPI或美联储表态）可能在基本面恶化之前率先压缩估值10~15%。上行尾部风险：业绩超预期叠加指引上调，可能触发空头快速平仓，带来急速上行重估。未来3周的二元结构，使得在没有强烈方向性判断的情况下，保守仓位更为合理。",
      ],
    },
    what_to_watch: {
      free: [
        "关注即将发布的业绩指引——这将决定市场后续的核心叙事方向。",
        "本周美联储表态是该板块最重要的宏观变量。",
        "监控板块资金轮动走向；一旦逆转，近期动能将面临压缩。",
      ],
      pro: [
        "未来两周需跟踪的三个信号：(1) 周三美联储措辞——任何利率路径语言的变化都将立即传导至该板块；(2) 下周13F披露的机构持仓更新，将验证或否定聪明钱是否在当前价位建仓；(3) 周五期权到期将在关键行权价附近形成日内波动窗口——建议作为战术性进出时点，而非被动跟随波动操作。",
        "两个最优先跟踪的数据点：(1) 即将发布的业绩——由于市场已透支近期数据，关注前瞻性营收指引而非EPS本身；(2) 未来10天内的行业会议可能释放管理层指引更新，引发较大股价反应。次要监控指标：板块信用利差是股价走势较为可靠的领先信号，建议每周关注。",
        "四项监控内容：(1) 周二宏观数据发布——一致预期已被定价，实际影响来自超预期程度；(2) 未来5个交易日内部人士交易申报情况；(3) 同类公司业绩发布后的分析师预期调整动向；(4) 周度期权偏斜变化——认沽/认购比率的显著移动往往早于价格反映机构再布仓行为。",
      ],
    },
    market_read: {
      free: [
        "尽管宏观不确定性犹存，板块整体环境仍偏向建设性。",
        "相对强度持续改善——当前市场正在对优质标的给予估值溢价。",
        "信用利差稳定——宏观背景未对该板块发出急性压力信号。",
      ],
      pro: [
        "整体市场背景偏建设性，但脆弱性不容忽视。股权风险溢价的压缩已削薄应对宏观负面超预期的安全垫。在此背景下，该板块近12个月以来资金流入高于均值，历史上这一模式往往领先6~8周持续跑赢表现。最大尾部风险是利率冲击与增长预期下修同步发生的宏观重定价，届时将凌驾于个股层面的持仓逻辑之上。",
        "标题指数走势低估了其下隐藏的资金轮动幅度。资金正从防御性配置向周期成长方向流动，直接利好该板块。但当前行情更多由仓位修正（低配松绑）而非真实基本面认可驱动——历史上这类行情的特点是走势干净但持续时间较短。建议以合理仓位参与，而非在当前位置追涨。",
        "市场解读需要细致辨别。信用市场稳定通常领先权益市场波动2~3周，当前无信用利差扩大是积极信号。与此同时，机构权益持仓数据显示周期成长相对历史仍处低配，形成被动再平衡的结构性顺风。主要风险是在基本面逻辑兑现之前，情绪转向导致资金流逆转的情形。",
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MockInsightProvider
// ─────────────────────────────────────────────────────────────────────────────

function detectMarket(symbol: string): string {
  if (symbol.endsWith(".KS") || symbol.endsWith(".KQ")) return "KR";
  if (symbol.endsWith(".HK"))                            return "HK";
  return "US";
}

export class MockInsightProvider implements InsightProvider {
  async getBatchInsights(symbols: string[], lang: Lang): Promise<Map<string, StockInsight>> {
    // Simulate a small async delay (mirrors a real API round-trip)
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

    const map = new Map<string, StockInsight>();
    for (const symbol of symbols) {
      map.set(symbol, this.buildInsight(symbol, lang));
    }
    return map;
  }

  async getQuickAction(
    symbol:    string,
    action:    QuickActionType,
    lang:      Lang,
    isProUser: boolean,
  ): Promise<string> {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
    const h = hash(symbol + action);
    const pool = QUICK_ACTIONS[lang][action];
    const variants = isProUser ? pool.pro : pool.free;
    return pick(variants, h);
  }

  getPortfolioInsight(insights: StockInsight[], lang: Lang): PortfolioInsight {
    if (insights.length === 0) {
      return {
        overallSentiment: "neutral",
        theme: "",
        topPick: null,
        riskSummary: "",
      };
    }

    const counts = { bullish: 0, bearish: 0, neutral: 0 };
    for (const ins of insights) counts[ins.signal]++;

    let overall: Signal;
    if (counts.bullish > counts.bearish && counts.bullish > counts.neutral) overall = "bullish";
    else if (counts.bearish > counts.bullish && counts.bearish > counts.neutral) overall = "bearish";
    else overall = "neutral";

    const topPick = insights
      .filter(i => i.signal === "bullish")
      .sort((a, b) => b.signalStrength - a.signalStrength)[0]?.symbol ?? null;

    const h = hash(insights.map(i => i.symbol).sort().join(""));
    const themes = PORTFOLIO_THEMES[lang][overall];
    const theme = themes[h % themes.length];

    return {
      overallSentiment: overall,
      theme,
      topPick,
      riskSummary: RISK_SUMMARIES[lang][overall],
    };
  }

  private buildInsight(symbol: string, lang: Lang): StockInsight {
    const h = hash(symbol);

    // Determine signal from hash
    const signalIdx = h % 9;
    const signal: Signal =
      signalIdx < 4 ? "bullish" :
      signalIdx < 7 ? "bearish" :
      "neutral";

    // Signal strength: bias toward meaningful values (2-5 for bull/bear, 1-3 for neutral)
    const strengthBase =
      signal === "neutral"
        ? (h % 3) + 1
        : (h % 3) + 3;
    const signalStrength = Math.min(5, strengthBase) as SignalStrength;

    // Pick template
    // Use unsigned right-shift (>>>) throughout so the seed fed into pick() is
    // always a non-negative integer even when h >= 2^31.
    const templates =
      lang === "ko"
        ? (signal === "bullish" ? KO_BULLISH : signal === "bearish" ? KO_BEARISH : KO_NEUTRAL)
        : lang === "zh"
        ? (signal === "bullish" ? ZH_BULLISH : signal === "bearish" ? ZH_BEARISH : ZH_NEUTRAL)
        : (signal === "bullish" ? EN_BULLISH : signal === "bearish" ? EN_BEARISH : EN_NEUTRAL);

    // Defensive fallback: if templates is somehow empty, use the neutral list.
    const safeTemplates =
      templates.length > 0
        ? templates
        : (lang === "ko" ? KO_NEUTRAL : lang === "zh" ? ZH_NEUTRAL : EN_NEUTRAL);

    const tmpl = pick(safeTemplates, (h >>> 2)) ?? safeTemplates[0];

    // News pulse — unsigned shift to avoid negative pulse index
    const pulseIdx = (h >>> 4) % 3;
    const newsPulse: NewsPulse = pulseIdx === 0 ? "hot" : pulseIdx === 1 ? "quiet" : "mixed";

    // Risk flag — unsigned shift; pick() already handles edge cases, null-coalesce as extra guard
    const flagPool = RISK_FLAGS[lang];
    const riskFlag = pick(flagPool, (h >>> 6)) ?? null;

    return {
      symbol,
      signal,
      signalStrength,
      teaser:      tmpl.teaser(symbol),
      summary:     tmpl.summary(symbol),
      drivers:     tmpl.drivers(symbol),
      newsPulse,
      riskFlag,
      generatedAt: new Date().toISOString(),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton — swap this line when connecting a real AI backend
// ─────────────────────────────────────────────────────────────────────────────

export const insightProvider: InsightProvider = new MockInsightProvider();
