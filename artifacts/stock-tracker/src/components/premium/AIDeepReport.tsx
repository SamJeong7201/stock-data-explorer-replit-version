/**
 * AIDeepReport — Pro-only 8-section market intelligence brief.
 *
 * Visual design: premium analyst memo / institutional brief style.
 * Content: language-native mock generators (EN/KO/ZH) — not translated from each other.
 * Architecture: all strings from PREMIUM_UI[lang].report; generators return typed Report objects.
 *
 * To connect a real backend: replace `buildMockReport` with an API call to
 *   POST /api/stocks/:ticker/deep-report?lang=en
 */
import { useState, useEffect } from "react";
import {
  Sparkles, Lock, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, ShieldAlert, Waves, SplitSquareHorizontal,
  Eye, AlignLeft, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumBadge } from "./PremiumBadge";
import { PREMIUM_UI } from "@/lib/premium-i18n";
import type { Lang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Data types
// ─────────────────────────────────────────────────────────────────────────────

type SentimentTag = "positive" | "negative" | "neutral";

interface TextSection    { type: "text";     key: string; sentiment: SentimentTag; text: string }
interface BulletsSection { type: "bullets";  key: string; sentiment: SentimentTag; bullets: string[] }
interface DecisionSection{ type: "decision"; key: string; short: string; swing: string; longTerm: string }
interface CaveatSection  { type: "caveat";   key: string; text: string }

type Section = TextSection | BulletsSection | DecisionSection | CaveatSection;

interface Report {
  generatedAt: string;
  sections: Section[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock report generators — one per language, written natively
// ─────────────────────────────────────────────────────────────────────────────

function generateEN(ticker: string, company: string, pct: number): Report {
  const dn = pct < 0;
  const ap = Math.abs(pct).toFixed(2);

  return {
    generatedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    sections: [
      {
        type: "text", key: "s1", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `${company} (${ticker}) is off ${ap}% in a move that reads as macro-driven rather than company-specific. Broad risk-off pressure across large-cap tech is compressing multiple names simultaneously, with no material fundamental development to justify stock-specific concern. Near-term price path will likely track index-level flows until a clearer catalyst emerges.`
          : `${company} (${ticker}) is up ${ap}%, a move consistent with renewed institutional interest rather than short-term momentum chasing. ${ticker} is outperforming sector peers — a setup that tends to sustain when earnings revision trends are supportive. Current action reads as orderly accumulation, not a reactive spike.`,
      },
      {
        type: "text", key: "s2", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `The market is re-rating ${ticker} in line with broader multiple compression under the higher-for-longer rate narrative. The premium historically assigned to ${company}'s earnings durability is under pressure as real yields rise. This week, ${ticker} is trading more as a rate-sensitivity proxy than on its own fundamental story.`
          : `The market appears to be pricing in a re-acceleration of ${company}'s core growth, with sector sentiment providing a tailwind. The volume profile and options activity both suggest genuine accumulation. The multiple expansion is tracking peers but leading slightly — implying a specific institutional thesis is in play, not just passive index flows.`,
      },
      {
        type: "bullets", key: "s3", sentiment: dn ? "negative" : "positive",
        bullets: dn
          ? [
              `Rate sensitivity: rising 10Y Treasury yields are compressing growth premiums across mega-cap tech; ${ticker} is not insulated`,
              `Earnings revision risk: consensus expects high-teens growth next quarter — any downward revision resets the valuation floor`,
              `FX headwind: sustained USD strength translates to margin pressure on international revenue, a factor the market is actively re-weighting`,
            ]
          : [
              `Sector rotation inflows: risk appetite is returning to large-cap tech; ${ticker} is a natural destination for institutional reallocation`,
              `Estimate upgrades: recent consensus revisions are providing fundamental backing for the move, not just sentiment`,
              `High-margin revenue mix: the market is assigning a higher multiple to recurring revenue streams gaining share in the business model`,
            ],
      },
      {
        type: "text", key: "s4", sentiment: dn ? "negative" : "neutral",
        text: dn
          ? `Primary downside scenario: sustained index selling forces institutional de-risking that tests the 200-day moving average — a break there would likely trigger systematic follow-through. Secondary risk: an earnings guidance revision that invalidates the current consensus model. Upside requires either a meaningful rate reversal or a strong forward guidance print to re-establish the growth premium.`
          : `The key risk to this thesis is a macro reversal — hawkish Fed repricing or disappointing peer earnings — that erodes the current sector tailwind. A volume deterioration without fundamental confirmation would be the early warning signal. The current setup leaves limited room for error if the macro environment shifts before the next earnings catalyst.`,
      },
      {
        type: "text", key: "s5", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `Options activity shows an elevated put/call ratio, consistent with portfolio managers reducing delta exposure rather than building fresh directional shorts. The move reads as a positioning flush — technically driven — rather than a conviction-based structural sell. Interpret the current flow as cautious de-risking, not a fundamental re-rating of the business.`
          : `Options positioning reflects growing call activity at above-market strikes, consistent with managers adding delta exposure rather than rolling hedges. The volume profile in the underlying shows buying on weakness — a characteristic of institutional accumulation phases. The flow reads as conviction-driven, not reactive momentum chasing.`,
      },
      {
        type: "decision", key: "s6",
        short: dn
          ? `Risk/reward for new long entries is unfavorable until ${ticker} reclaims near-term resistance on volume. Avoid chasing the flush — the positioning reset may not be complete.`
          : `Momentum is clear but entry at current levels carries elevated pullback risk given move size. Partial exposure with a defined stop is more disciplined than full commitment on strength.`,
        swing: dn
          ? `Mean-reversion setup becomes viable if the stock holds a prior support level on a closing basis with improving relative strength. Wait for confirmation before sizing in.`
          : `The setup supports adding exposure on an orderly consolidation. First constructive pullback that holds above the breakout level is the risk-defined entry to watch for.`,
        longTerm: dn
          ? `Today's action does not change the multi-year thesis. Multiple compression in a rising rate environment is a known risk, not new information. Patience and position sizing discipline are the relevant inputs.`
          : `The move is additive to the longer-term thesis. No action required unless position sizing has drifted outside target allocation — trimming into strength is a reasonable risk-management consideration.`,
      },
      {
        type: "bullets", key: "s7", sentiment: "neutral",
        bullets: dn
          ? [
              `10Y Treasury yield: a sustained move above 4.5% would add further multiple compression pressure across the sector`,
              `${company} earnings date: Services revenue guidance is the key swing variable for re-establishing the growth premium`,
              `200-day moving average: a weekly close below this level would likely trigger systematic institutional selling`,
              `Options open interest clustering: heavy put concentration below current price indicates where hedging ends and directional positioning begins`,
              `Peer earnings read-through: sector-wide results will clarify whether the pressure is ${ticker}-specific or a broader thematic reset`,
            ]
          : [
              `Volume profile: if daily volume reverts to below-average levels, the conviction behind this move should be reassessed`,
              `Options expiration: notable open interest at nearby strikes may cap the move near-term before a cleaner directional path forms`,
              `${company} earnings date: the thesis needs confirmation from guidance — a disappointing forward look would invalidate current positioning`,
              `Fed communication calendar: the next policy signal is the primary macro input to monitor over the coming two weeks`,
              `Sector relative strength: broad continuation supports the position; a reversal in peers is the key early warning signal`,
            ],
      },
      {
        type: "caveat", key: "s8",
        text: `This brief reflects a structured read of available market data and price behavior. It is not a recommendation to buy, sell, or hold any security. All inferences about institutional activity and positioning are analytical interpretations, not confirmed data. Past price behavior does not guarantee future results.`,
      },
    ],
  };
}

function generateKO(ticker: string, company: string, pct: number): Report {
  const dn = pct < 0;
  const ap = Math.abs(pct).toFixed(2);

  return {
    generatedAt: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    sections: [
      {
        type: "text", key: "s1", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `${company}(${ticker})은 오늘 ${ap}% 하락했으나, 이는 회사 고유 이슈보다 매크로 환경에 기인한 조정으로 판단된다. 대형 기술주 전반에 걸친 리스크 오프 분위기가 동반 하락을 유발했으며, 새로운 펀더멘털 변화는 확인되지 않는다. 차주 주요 이벤트(연준 발언, 지수 방향성) 전까지는 지수 연동 흐름이 이어질 가능성이 높다.`
          : `${company}(${ticker})은 오늘 ${ap}% 상승하며 단순 모멘텀 매수보다는 기관의 계획적 매집 흐름이 감지된다. 동종 섹터 대비 아웃퍼폼하는 양상으로, 실적 추정치 상향 추세와 맞물려 단기적으로 지속 가능한 구도다. 현재 주가 흐름은 반응적 급등이 아닌 질서 있는 상승세로 해석된다.`,
      },
      {
        type: "text", key: "s2", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `현재 시장은 고금리 장기화 기조 하에서 성장주 밸류에이션 멀티플을 재조정하는 과정에 있다. ${company}의 이익 안정성에 기반했던 프리미엄 멀티플은 실질금리 상승과 함께 압박받고 있으며, 이번 주 ${ticker}는 종목 고유의 펀더멘털 스토리보다 금리 민감도 프록시로 거래되는 양상이다.`
          : `시장은 ${company}의 핵심 이익 성장 재가속을 반영하기 시작한 것으로 보이며, 섹터 전반의 센티먼트 개선이 추가적인 지지대 역할을 하고 있다. 거래량 프로파일과 옵션 포지셔닝 모두 의미 있는 기관 매집 신호를 나타낸다. 멀티플 확장이 동종 그룹을 소폭 앞서고 있어 패시브 자금 유입 이상의 특정 투자 테마가 작용 중인 것으로 판단된다.`,
      },
      {
        type: "bullets", key: "s3", sentiment: dn ? "negative" : "positive",
        bullets: dn
          ? [
              `금리 민감도: 미국채 10년물 수익률 상승이 대형 기술주 성장 프리미엄을 전반적으로 압박 중이며, ${ticker}도 예외가 아님`,
              `실적 추정치 하향 리스크: 컨센서스는 다음 분기 10%대 중후반 성장을 기대하고 있어, 하향 조정 시 밸류에이션 하단이 재설정될 수 있음`,
              `달러 강세 헤드윈드: USD 강세 지속에 따른 해외 매출 환산 손실이 시장에서 재조명되고 있는 리스크 요인`,
            ]
          : [
              `섹터 로테이션 자금 유입: 위험선호 심리 회복과 함께 대형 기술주로의 기관 자금 재배분이 진행 중이며, ${ticker}는 자연스러운 수혜 종목`,
              `실적 추정치 상향: 최근 컨센서스 EPS 상향 조정이 현재 주가 움직임에 펀더멘털 근거를 제공`,
              `고마진 반복 매출 확대: 구독형 서비스 부문의 비중 증가에 대해 시장이 더 높은 멀티플을 부여하기 시작`,
            ],
      },
      {
        type: "text", key: "s4", sentiment: dn ? "negative" : "neutral",
        text: dn
          ? `주요 하방 시나리오는 지수 전반의 매도세가 심화되어 200일 이동평균선 테스트가 현실화되는 경우다. 이 선이 이탈될 경우 시스템 매도가 뒤따를 가능성이 있다. 추가 리스크로는 다음 실적 가이던스 하향 조정이 있으며, 이는 현재 컨센서스 모델의 밸류에이션 근거를 무력화한다. 반등 조건은 금리 방향 전환 또는 강한 가이던스 서프라이즈다.`
          : `현재 테마의 주요 리스크는 매크로 반전, 즉 연준의 매파적 신호 강화 또는 주요 동종 기업의 실망스러운 실적으로 인한 섹터 센티먼트 약화다. 거래량 프로파일이 악화되면서 펀더멘털 확인이 뒤따르지 않는 경우가 조기 경고 신호가 될 수 있다. 다음 실적 발표 전까지 매크로 환경이 바뀔 경우 현 포지션에 여유 공간이 제한적이다.`,
      },
      {
        type: "text", key: "s5", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `옵션 시장에서는 풋/콜 비율이 상승한 가운데, 이는 신규 공매도 포지션 구축보다는 기존 보유자의 델타 익스포저 축소에 가깝다. 현재 움직임은 컨빅션에 기반한 구조적 매도가 아닌 포지션 정리(플러시) 성격으로 해석된다. 기관의 펀더멘털 재평가가 아닌 리스크 관리 차원의 헤징으로 봐야 한다.`
          : `옵션 포지셔닝을 보면 현재 주가 위의 행사가에 콜 잔고가 증가하고 있으며, 이는 헤지 롤링이 아닌 기관의 의도적 델타 추가 매입으로 해석된다. 기초자산에서의 거래량 패턴도 약세 시 매수 흐름이 확인되어 전형적인 기관 매집 국면의 특징과 일치한다.`,
      },
      {
        type: "decision", key: "s6",
        short: dn
          ? `${ticker}가 단기 저항선을 거래량과 함께 회복하기 전까지는 신규 매수의 리스크/리워드가 불리하다. 포지션 청산 흐름이 아직 완결되지 않았을 가능성을 감안해야 한다.`
          : `모멘텀은 명확하나 현 수준에서의 진입은 최근 급등으로 인한 되돌림 리스크가 높다. 타이트한 스탑 설정 하의 부분 진입이 전체 베팅보다 리스크 관리 측면에서 유리하다.`,
        swing: dn
          ? `이전 지지선에서 종가 기준 안착하며 상대 강도가 개선될 경우 평균 회귀 매매 기회가 성립한다. 확인 신호 없이 서두를 필요는 없다.`
          : `조정 국면에서의 추가 매수 구도는 여전히 유효하다. 최근 돌파 레벨 위에서 안착하는 첫 번째 건전한 되돌림이 리스크를 정의할 수 있는 진입 포인트가 될 것이다.`,
        longTerm: dn
          ? `오늘의 조정은 멀티년 투자 테마를 바꾸지 않는다. 금리 상승 환경에서의 멀티플 압박은 이미 알려진 리스크이며, 새로운 정보가 아니다. 포지션 규모 원칙을 지키면서 인내심을 유지하는 것이 핵심이다.`
          : `현재 상승은 장기 투자 근거를 강화하는 방향이다. 목표 비중에서 포지션이 크게 이탈하지 않았다면 추가 액션이 필요없다. 강세 국면에서의 일부 차익 실현은 합리적인 리스크 관리 고려 사항이다.`,
      },
      {
        type: "bullets", key: "s7", sentiment: "neutral",
        bullets: dn
          ? [
              `미국채 10년물 수익률: 4.5% 이상 안착 여부가 대형 기술주 멀티플 추가 압박의 핵심 관찰 지표`,
              `${company} 실적 발표: 서비스 매출 가이던스가 향후 3~6개월 주가 방향을 결정할 핵심 변수`,
              `200일 이동평균선: 주봉 기준 이탈 여부 — 이탈 시 시스템 매도 및 기관 리스크 감소 트리거 가능성`,
              `풋 옵션 집중 구간: 대규모 풋 오픈인터레스트 위치가 헤징과 방향성 베팅의 경계선을 표시`,
              `동종 기업 실적 시즌: 섹터 전반적 가이던스가 현재 압박이 ${ticker} 특이적인지 구조적인지를 판단하는 기준점`,
            ]
          : [
              `거래량 지속성: 일 평균 거래량 하회 시 현재 상승의 컨빅션에 의문을 가져야 하는 조기 경고 지표`,
              `주요 행사가 옵션 만기: 인근 대규모 오픈인터레스트가 단기적으로 상승을 제한할 수 있는 레벨`,
              `${company} 다음 실적 발표: 가이던스 확인 없이는 현재 포지셔닝의 근거가 불완전하다`,
              `연준 커뮤니케이션 일정: 향후 2주간 금리 관련 발언이 섹터 전반의 1차 매크로 변수`,
              `동종 섹터 상대 강도: 섹터 전반의 상승 지속이 포지션을 지지하며, 동종 반전은 핵심 경고 신호`,
            ],
      },
      {
        type: "caveat", key: "s8",
        text: `본 브리핑은 시장 데이터와 가격 흐름에 대한 구조화된 분석을 제공합니다. 특정 종목의 매수·매도·보유를 권장하는 투자 권유가 아닙니다. 기관 수급 및 포지셔닝에 관한 추론은 분석적 해석이며, 확인된 데이터가 아닙니다. 과거 흐름이 미래 성과를 보증하지 않습니다.`,
      },
    ],
  };
}

function generateZH(ticker: string, company: string, pct: number): Report {
  const dn = pct < 0;
  const ap = Math.abs(pct).toFixed(2);

  return {
    generatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    sections: [
      {
        type: "text", key: "s1", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `${company}（${ticker}）今日下跌${ap}%，此次回调更多源于宏观环境压力，而非公司基本面的实质性变化。大型科技股整体承压，带动${ticker}跟随调整，目前尚无公司层面的负面催化因素。预计短期内走势将继续跟随市场情绪，直至明确的驱动因素出现。`
          : `${company}（${ticker}）今日上涨${ap}%，此次上行更接近机构有序建仓，而非短线动量追逐。${ticker}表现优于同板块个股，在盈利预期上修趋势配合下，当前势头具备可持续性。价格行为呈现有序上涨特征，而非情绪性急拉。`,
      },
      {
        type: "text", key: "s2", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `当前市场正在高利率持续环境下对成长股估值进行重新定价。${company}盈利稳定性所支撑的估值溢价，随着实际利率走高而承压。本周${ticker}的交易逻辑更偏向利率敏感性代理标的，而非公司自身基本面叙事。`
          : `市场已开始计价${company}核心增长的重新加速，板块整体情绪改善提供了额外支撑。成交量结构和期权持仓均显示出真实机构建仓迹象，而非被动指数资金流入。估值扩张小幅领先同类标的，暗示有特定机构逻辑在驱动，并非单纯随板块轮动。`,
      },
      {
        type: "bullets", key: "s3", sentiment: dn ? "negative" : "positive",
        bullets: dn
          ? [
              `利率敏感性：美债10年期收益率持续上行压缩大型科技股成长溢价，${ticker}同样难以独善其身`,
              `盈利预期下修风险：市场一致预期下季度增速在十几个百分点，若下修将重置估值底部`,
              `汇率逆风：美元持续走强对海外收入形成汇兑压力，该因素正被市场重新纳入定价`,
            ]
          : [
              `板块轮动资金流入：风险偏好回升推动机构资金向大型科技股再配置，${ticker}是天然承接方向`,
              `盈利预期上修：近期卖方机构EPS预测上调，为本轮上涨提供了基本面支撑，而非仅靠情绪驱动`,
              `高毛利率经常性收入占比提升：市场开始对订阅类高粘性收入赋予更高估值倍数`,
            ],
      },
      {
        type: "text", key: "s4", sentiment: dn ? "negative" : "neutral",
        text: dn
          ? `主要下行情景：市场持续抛压导致${ticker}测试200日均线，若有效破位可能触发系统化跟随卖出。次要风险为业绩指引下修，将动摇当前一致预期模型的估值基础。反弹的触发条件需要利率预期出现实质性转向或业绩季出现超预期指引。`
          : `当前逻辑面临的核心风险是宏观逆转——美联储鸽转鹰或同类企业业绩低于预期——导致板块情绪快速逆转。成交量萎缩而基本面验证缺席，将是需要重视的早期预警信号。在下一个业绩催化剂落地前，若宏观环境发生转变，当前仓位的容错空间有限。`,
      },
      {
        type: "text", key: "s5", sentiment: dn ? "negative" : "positive",
        text: dn
          ? `期权市场认沽/认购比率上升，与机构主动降低净Delta敞口一致，而非构建全新空头方向仓位。此次下跌更接近仓位清洗（技术性调整），而非基于基本面的结构性做空。当前资金流向应解读为风险管理层面的主动减仓，而非对公司价值的重新评估。`
          : `期权持仓显示价外认购期权增加，与机构主动增加Delta敞口一致，而非被动滚续对冲。标的股的成交量结构体现出逢低买入的特征，与机构建仓阶段的典型形态吻合。资金流向呈现主动配置特征，而非被动动量追随。`,
      },
      {
        type: "decision", key: "s6",
        short: dn
          ? `在${ticker}有效收复短期阻力位并量能配合之前，新多头入场的风险收益比不佳。仓位出清尚未完成，不宜抢底。`
          : `势头明确，但当前位置入场的回调风险因涨幅已大而相对较高。半仓配合严格止损优于全仓追入。`,
        swing: dn
          ? `若股价在前期支撑位以收盘价为基础止跌企稳，同时相对强度改善，则均值回归交易机会成立。等待确认信号，无需仓促入场。`
          : `中线仓位可在有序回调中加仓。以突破位上方的首次有效回踩为基础，设定明确止损后的参与时机。`,
        longTerm: dn
          ? `今日调整不改变多年持有逻辑。加息环境下的估值压缩是已知风险，并非新信息。重点是仓位管理纪律与耐心持有。`
          : `此次上涨进一步强化了长期持有逻辑。除非仓位严重偏离目标配置，否则不需要额外操作。强势时适度减仓是合理的风险管理选项。`,
      },
      {
        type: "bullets", key: "s7", sentiment: "neutral",
        bullets: dn
          ? [
              `美债10年期：是否持续站稳4.5%以上，将是成长股估值承压程度的关键观察指标`,
              `${company}业绩发布日：服务收入指引是决定中期走势方向的核心变量`,
              `200日均线：周线级别收盘是否跌破该线，是机构系统化减仓的可能触发点`,
              `认沽期权集中行使价区间：下方密集Put持仓揭示机构对冲仓位的保护底线位置`,
              `同类企业财报季：行业整体指引将判断当前压力是${ticker}特有问题还是板块性结构调整`,
            ]
          : [
              `成交量持续性：若日均量回落至平均以下，应对当前涨势背后的机构信心产生质疑`,
              `关键行使价期权到期：附近大量未平仓合约可能在到期前形成短期阻力区间`,
              `${company}下季财报：缺乏业绩指引确认，当前仓位逻辑存在不完整性`,
              `美联储发言日历：未来两周内的政策信号是板块首要宏观变量`,
              `板块相对强度：同类股持续走强支撑持仓；若板块率先反转，则是关键预警信号`,
            ],
      },
      {
        type: "caveat", key: "s8",
        text: `本报告基于市场数据与价格行为的结构化分析，不构成任何证券的投资建议。关于机构资金动向与仓位的判断均为分析性推断，非经核实的确定性数据。过往表现不代表未来收益。`,
      },
    ],
  };
}

function buildMockReport(ticker: string, company: string, pct: number, lang: Lang): Report {
  if (lang === "ko") return generateKO(ticker, company, pct);
  if (lang === "zh") return generateZH(ticker, company, pct);
  return generateEN(ticker, company, pct);
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual constants
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  s2: <TrendingUp   className="w-3.5 h-3.5" />,
  s3: <Waves        className="w-3.5 h-3.5" />,
  s4: <ShieldAlert  className="w-3.5 h-3.5" />,
  s5: <SplitSquareHorizontal className="w-3.5 h-3.5" />,
  s6: <AlignLeft    className="w-3.5 h-3.5" />,
  s7: <Eye          className="w-3.5 h-3.5" />,
};

const SENTIMENT_COLOR: Record<SentimentTag, string> = {
  positive: "#00FF9C",
  negative: "#FF4D4D",
  neutral:  "#3AA0FF",
};

// ─────────────────────────────────────────────────────────────────────────────
// Section renderers
// ─────────────────────────────────────────────────────────────────────────────

function SectionWrap({ num, sectionKey, label, sentiment, children }: {
  num: number; sectionKey: string; label: string; sentiment?: SentimentTag; children: React.ReactNode;
}) {
  const color = sentiment ? SENTIMENT_COLOR[sentiment] : "rgba(255,255,255,0.35)";
  const icon  = SECTION_ICONS[sectionKey];
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="font-mono text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.2)" }}>
            {String(num).padStart(2, "0")}
          </span>
          <span style={{ color }}>{icon}</span>
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color }}>
            {label}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface AIDeepReportProps {
  ticker: string;
  companyName: string;
  currentPrice: number;
  changePercent: number;
  currency: string;
  lang: Lang;
}

export function AIDeepReport({ ticker, companyName, changePercent, lang }: AIDeepReportProps) {
  const { isProUser, openUpgradeModal } = useSubscription();
  const l = PREMIUM_UI[lang].report;

  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [report, setReport]     = useState<Report | null>(null);

  useEffect(() => { setReport(null); setExpanded(false); }, [ticker]);
  useEffect(() => { if (report) setReport(null); }, [lang]);

  const handleGenerate = async () => {
    if (!isProUser) { openUpgradeModal(); return; }
    setLoading(true);
    setExpanded(true);
    await new Promise(r => setTimeout(r, 1600));
    setReport(buildMockReport(ticker, companyName, changePercent, lang));
    setLoading(false);
  };

  const handleRegenerate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setReport(buildMockReport(ticker, companyName, changePercent, lang));
    setLoading(false);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(245,158,11,0.18)" }}
    >
      {/* ── Card header ── */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-white">{l.title}</span>
              <PremiumBadge size="sm" />
            </div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{l.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report && !loading && (
            <button
              onClick={handleRegenerate}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              title={l.regenerate}
              style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)" }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {report && !loading && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)" }}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          {!report && !loading && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
              style={isProUser
                ? { background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#0B0F14" }
                : { background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }
              }
            >
              {!isProUser ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {l.generate}
            </button>
          )}
        </div>
      </div>

      {/* ── Teaser (no report yet) ── */}
      {!report && !loading && (
        <div className="px-5 py-4">
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.32)" }}>
            {isProUser ? l.proTeaser(ticker) : l.lockedTeaser(ticker)}
          </p>
        </div>
      )}

      {/* ── Loading state ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="px-5 py-8 flex flex-col items-center gap-3"
          >
            <div className="flex gap-1.5">
              {[0,1,2,3].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#f59e0b" }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{l.generating}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report body ── */}
      <AnimatePresence>
        {report && expanded && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Meta bar */}
            <div
              className="flex items-center justify-between px-6 py-2.5"
              style={{ background: "rgba(245,158,11,0.04)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black" style={{ color: "#f59e0b" }}>{ticker}</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {lang === "ko" ? "마켓 인텔리전스 브리핑" : lang === "zh" ? "市场情报简报" : "Market Intelligence Brief"}
                </span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                {report.generatedAt}
              </span>
            </div>

            {/* ── Section 01: Executive Summary ── */}
            {(() => {
              const s = report.sections.find(s => s.key === "s1");
              if (!s || s.type !== "text") return null;
              const color = SENTIMENT_COLOR[s.sentiment];
              return (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="px-6 pt-5 pb-5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.2)" }}>01</span>
                    <Sparkles className="w-3.5 h-3.5" style={{ color }} />
                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ color }}>{l.s1}</span>
                  </div>
                  <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
                    {s.text}
                  </p>
                </motion.div>
              );
            })()}

            {/* ── Sections 02–07 ── */}
            {report.sections
              .filter(s => s.key !== "s1" && s.key !== "s8")
              .map((section, i) => {
                const sectionNum = i + 2;
                const label = l[section.key as keyof typeof l] as string;
                const sentiment = ("sentiment" in section ? section.sentiment : "neutral") as SentimentTag;

                return (
                  <motion.div
                    key={section.key}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.07 }}
                  >
                    <SectionWrap num={sectionNum} sectionKey={section.key} label={label} sentiment={sentiment}>

                      {/* Text section */}
                      {section.type === "text" && (
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>
                          {section.text}
                        </p>
                      )}

                      {/* Bullets section */}
                      {section.type === "bullets" && (
                        <ul className="space-y-2">
                          {section.bullets.map((b, bi) => (
                            <li key={bi} className="flex items-start gap-2.5">
                              <span
                                className="font-mono text-[9px] font-black mt-0.5 shrink-0 w-4"
                                style={{ color: "rgba(255,255,255,0.2)" }}
                              >
                                {String(bi + 1).padStart(2, "0")}
                              </span>
                              <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Decision Context section — 3 columns */}
                      {section.type === "decision" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {([
                            { label: l.decShort, text: section.short,    accent: "#FF9C00" },
                            { label: l.decSwing, text: section.swing,    accent: "#3AA0FF" },
                            { label: l.decLong,  text: section.longTerm, accent: "#00FF9C" },
                          ] as const).map(({ label: lbl, text, accent }) => (
                            <div
                              key={lbl}
                              className="rounded-xl p-3"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              <p
                                className="text-[9px] font-black uppercase tracking-widest mb-2"
                                style={{ color: accent }}
                              >
                                {lbl}
                              </p>
                              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    </SectionWrap>
                  </motion.div>
                );
              })
            }

            {/* ── Caveat footer ── */}
            {(() => {
              const s = report.sections.find(s => s.key === "s8");
              if (!s || s.type !== "caveat") return null;
              return (
                <div
                  className="px-6 py-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
                >
                  <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {s.text}
                  </p>
                  <p className="text-[9px] mt-2" style={{ color: "rgba(255,255,255,0.12)" }}>{l.disclaimer}</p>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
