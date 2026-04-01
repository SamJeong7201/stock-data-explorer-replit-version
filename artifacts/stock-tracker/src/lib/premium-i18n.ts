/**
 * premium-i18n.ts
 *
 * Single source of truth for all premium/freemium UI copy.
 *
 * Architecture rules:
 *  - Each language is written natively — not translated from another language.
 *  - Components import PREMIUM_UI[lang].section.key — no hardcoded strings allowed.
 *  - When connecting real billing / auth, only this file needs copy updates.
 *  - Function-valued keys accept minimal params; keep signatures stable.
 */

import type { Lang } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Priority Board strings
// ─────────────────────────────────────────────────────────────────────────────

export interface PriorityBoardStrings {
  tab:            string;
  title:          string;
  subtitle:       string;
  addPlaceholder: string;
  addBtn:         string;
  duplicate:      string;
  limitMsg:       (n: number) => string;
  empty: { heading: string; sub: string };
  remove:         string;
  signal: { bullish: string; bearish: string; neutral: string };
  /** @deprecated — kept for backward compat with old Watchlist components */
  strength:       (n: number) => string;
  sections: {
    priority: string;
    risk:     string;
    momentum: string;
    quiet:    string;
  };
  sectionSubs: {
    priority: string;
    risk:     string;
    momentum: string;
    quiet:    string;
  };
  actions: {
    why:      string;
    riskView: string;
    watch:    string;
    market:   string;
  };
  actionsLoading:    string;
  actionUpgradeCta:  string;
  /** @deprecated — use actionUpgradeCta */
  proInsightCta:     string;
  proFullInsight:    string;
  drivers:           string;
  riskFlag:          string;
  newsPulse: { label: string; hot: string; quiet: string; mixed: string };
  portfolio: {
    title:         string;
    sentiment: { bullish: string; bearish: string; neutral: string };
    themeLabel:    string;
    topPickLabel:  string;
    riskLabel:     string;
    lockedHeading: string;
    lockedSub:     string;
  };
}

/** @deprecated — backward compat alias; use PriorityBoardStrings */
export type WatchlistUIStrings = PriorityBoardStrings;

// ─────────────────────────────────────────────────────────────────────────────
// Full premium strings interface
// ─────────────────────────────────────────────────────────────────────────────

export interface PremiumUIStrings {
  upgradeBtn: string;

  locked: { cta: string };

  modal: {
    title: string;
    subtitle: string;
    monthly: string;
    annual: string;
    saveLabel: (pct: number) => string;
    freeName: string;
    freeTagline: string;
    proName: string;
    proTagline: string;
    perMonth: string;
    billedAnnually: string;
    currentPlan: string;
    demoBanner: string;
    activatePro: string;
    switchFree: string;
    disclaimer: string;
  };

  pricing: {
    heading: string;
    subtext: string;
    monthly: string;
    annual: string;
    saveLabel: (pct: number) => string;
    freeForever: string;
    currentPlan: string;
    perMonth: string;
    annualNote: string;
    upgradeCta: string;
    downgradeCta: string;
    demoBanner: string;
  };

  priority: PriorityBoardStrings;

  digest: {
    title: string;
    subtitle: (ticker: string) => string;
    subscribe: string;
    subscribed: string;
    confirmedText: (freq: string) => string;
    placeholder: string;
    freqDaily: string;
    freqWeekly: string;
    lockedCta: string;
  };

  report: {
    title: string;
    subtitle: string;
    generate: string;
    regenerate: string;
    generating: string;
    lockedTeaser: (ticker: string) => string;
    proTeaser: (ticker: string) => string;
    disclaimer: string;
    s1: string;
    s2: string;
    s3: string;
    s4: string;
    s5: string;
    s6: string;
    s7: string;
    s8: string;
    decShort: string;
    decSwing: string;
    decLong: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementations
// ─────────────────────────────────────────────────────────────────────────────

export const PREMIUM_UI: Record<Lang, PremiumUIStrings> = {

  // ──────────────────────────────────────────────────────────────────────────
  // ENGLISH
  // Written for a professional Western financial product audience.
  // Tone: precise, signal-dense, minimal marketing fluff.
  // ──────────────────────────────────────────────────────────────────────────
  en: {
    upgradeBtn: "Upgrade",

    locked: { cta: "Unlock with Pro" },

    modal: {
      title:          "Unlock OmniAlpha Pro",
      subtitle:       "Deeper context. Faster decisions. Less noise.",
      monthly:        "Monthly",
      annual:         "Annual",
      saveLabel:      (pct) => `SAVE ${pct}%`,
      freeName:       "Free",
      freeTagline:    "Real market data, no card required.",
      proName:        "Pro",
      proTagline:     "For investors who want signal over noise.",
      perMonth:       "/mo",
      billedAnnually: "billed annually",
      currentPlan:    "Current plan",
      demoBanner:     "Demo mode — toggle Pro instantly, no billing required",
      activatePro:    "⚡ Activate Pro — Demo Mode",
      switchFree:     "↓ Switch back to Free",
      disclaimer:     "No real charges. Stripe integration coming soon.",
    },

    pricing: {
      heading:      "Simple, transparent pricing",
      subtext:      "All chart data is free. Pro unlocks deeper interpretation.",
      monthly:      "Monthly",
      annual:       "Annual",
      saveLabel:    (pct) => `SAVE ${pct}%`,
      freeForever:  "Free forever",
      currentPlan:  "Current plan",
      perMonth:     "/mo",
      annualNote:   "billed annually",
      upgradeCta:   "⚡ Upgrade to Pro",
      downgradeCta: "↓ Switch to Free",
      demoBanner:   "Demo mode — toggle Pro instantly",
    },

    priority: {
      tab:            "Priority Board",
      title:          "Priority Board",
      subtitle:       "What matters most in your portfolio right now",
      addPlaceholder: "Add ticker (e.g. NVDA, 005930.KS)",
      addBtn:         "Add",
      duplicate:      "Already on your board",
      limitMsg:       (n) => `Free plan supports up to ${n} tickers — upgrade for unlimited`,
      empty: {
        heading: "Your board is empty",
        sub:     "Add tickers to surface what matters most across your names.",
      },
      remove:  "Remove",
      signal:  { bullish: "Bullish", bearish: "Bearish", neutral: "Neutral" },
      strength: (n) => `Strength ${n}/5`,
      sections: {
        priority: "Today's Priority",
        risk:     "Highest Risk",
        momentum: "Momentum / Opportunity",
        quiet:    "Quiet but Important",
      },
      sectionSubs: {
        priority: "High-conviction setups demanding attention now",
        risk:     "Names with elevated downside or event risk",
        momentum: "Building strength — watch for acceleration",
        quiet:    "Low noise but worth keeping on your radar",
      },
      actions: {
        why:      "Why moving?",
        riskView: "Risk view",
        watch:    "What to watch",
        market:   "Market read",
      },
      actionsLoading:   "Analyzing…",
      actionUpgradeCta: "Upgrade for deeper analysis →",
      proInsightCta:    "Upgrade for full insight →",
      proFullInsight:   "Full Insight",
      drivers:          "Key Drivers",
      riskFlag:         "Risk",
      newsPulse: { label: "News", hot: "Hot", quiet: "Quiet", mixed: "Mixed" },
      portfolio: {
        title:         "Portfolio Intelligence",
        sentiment:     { bullish: "Bullish", bearish: "Bearish", neutral: "Mixed" },
        themeLabel:    "Market Read",
        topPickLabel:  "Top Conviction",
        riskLabel:     "Risk Note",
        lockedHeading: "Portfolio Intelligence",
        lockedSub:     "Portfolio-level synthesis across your board is a Pro feature.",
      },
    },

    digest: {
      title:         "Market Digest",
      subtitle:      (t) => `Curated daily/weekly brief for ${t}`,
      subscribe:     "Subscribe",
      subscribed:    "Subscribed",
      confirmedText: (f) => `${f === "daily" ? "Daily" : "Weekly"} digest confirmed.`,
      placeholder:   "your@email.com",
      freqDaily:     "Daily",
      freqWeekly:    "Weekly",
      lockedCta:     "Email digest is a Pro feature — upgrade to activate",
    },

    report: {
      title:        "AI Deep Report",
      subtitle:     "Market intelligence brief",
      generate:     "Generate Brief",
      regenerate:   "Regenerate",
      generating:   "Compiling brief…",
      lockedTeaser: (t) =>
        `Pro-only — structured 8-section analyst brief for ${t}. Covers positioning, drivers, risks, flow, and decision context.`,
      proTeaser: (t) =>
        `Generate a structured intelligence brief for ${t}: market positioning, key drivers, risk assessment, institutional flow, and per-investor decision context.`,
      disclaimer: "AI-generated market brief · Not financial advice · For informational purposes only",
      s1: "Executive Summary",
      s2: "Market Positioning",
      s3: "Key Drivers",
      s4: "Risk Assessment",
      s5: "Institutional Flow",
      s6: "Decision Context",
      s7: "What to Watch",
      s8: "Analyst Note",
      decShort: "Short-term",
      decSwing:  "Swing",
      decLong:   "Long-term",
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // KOREAN
  // 국내 기관 리서치 보고서 및 증권사 애널리스트 보고서 문체를 기준으로 작성.
  // 영어 번역이 아닌 한국어 금융 문서의 자연스러운 표현 사용.
  // ──────────────────────────────────────────────────────────────────────────
  ko: {
    upgradeBtn: "Pro 업그레이드",

    locked: { cta: "Pro로 잠금 해제" },

    modal: {
      title:          "OmniAlpha Pro 활성화",
      subtitle:       "더 깊은 분석. 더 빠른 판단. 더 적은 노이즈.",
      monthly:        "월간 결제",
      annual:         "연간 결제",
      saveLabel:      (pct) => `${pct}% 할인`,
      freeName:       "무료",
      freeTagline:    "카드 없이 실시간 시장 데이터를 이용하세요.",
      proName:        "Pro",
      proTagline:     "노이즈가 아닌 시그널을 원하는 투자자를 위해.",
      perMonth:       "/월",
      billedAnnually: "연간 결제 기준",
      currentPlan:    "현재 플랜",
      demoBanner:     "데모 모드 — 결제 없이 즉시 Pro 체험 가능",
      activatePro:    "⚡ Pro 체험 시작 (데모)",
      switchFree:     "↓ 무료 플랜으로 전환",
      disclaimer:     "실제 결제 없음. Stripe 연동 출시 예정.",
    },

    pricing: {
      heading:      "명확하고 합리적인 요금제",
      subtext:      "차트 데이터는 모두 무료입니다. Pro에서 더 깊은 분석을 제공합니다.",
      monthly:      "월간",
      annual:       "연간",
      saveLabel:    (pct) => `${pct}% 절감`,
      freeForever:  "영구 무료",
      currentPlan:  "현재 플랜",
      perMonth:     "/월",
      annualNote:   "연간 결제",
      upgradeCta:   "⚡ Pro로 업그레이드",
      downgradeCta: "↓ 무료 플랜으로 전환",
      demoBanner:   "데모 모드 — 즉시 Pro 전환 가능",
    },

    priority: {
      tab:            "우선순위 보드",
      title:          "우선순위 보드",
      subtitle:       "지금 포트폴리오에서 가장 중요한 것을 먼저",
      addPlaceholder: "종목 추가 (예: NVDA, 005930.KS)",
      addBtn:         "추가",
      duplicate:      "이미 보드에 있는 종목입니다",
      limitMsg:       (n) => `무료 플랜은 최대 ${n}개 종목 — Pro에서 무제한`,
      empty: {
        heading: "보드가 비어 있습니다",
        sub:     "종목을 추가해 지금 당장 중요한 시그널을 한눈에 파악하세요.",
      },
      remove:  "삭제",
      signal:  { bullish: "강세", bearish: "약세", neutral: "중립" },
      strength: (n) => `강도 ${n}/5`,
      sections: {
        priority: "오늘의 우선순위",
        risk:     "고위험 주의",
        momentum: "모멘텀 / 기회",
        quiet:    "눈여겨볼 종목",
      },
      sectionSubs: {
        priority: "지금 당장 점검이 필요한 고확신 셋업",
        risk:     "하방 리스크 또는 이벤트 리스크가 높은 종목",
        momentum: "강도 확산 중 — 가속 여부 주시 필요",
        quiet:    "노이즈는 없지만 레이더에 유지할 종목",
      },
      actions: {
        why:      "왜 움직이나?",
        riskView: "리스크 분석",
        watch:    "주목 포인트",
        market:   "시장 반응",
      },
      actionsLoading:   "분석 중…",
      actionUpgradeCta: "Pro에서 심층 분석 보기 →",
      proInsightCta:    "Pro에서 전체 인사이트 보기 →",
      proFullInsight:   "전체 인사이트",
      drivers:          "핵심 동인",
      riskFlag:         "리스크",
      newsPulse: { label: "뉴스", hot: "활발", quiet: "조용", mixed: "혼조" },
      portfolio: {
        title:         "포트폴리오 인텔리전스",
        sentiment:     { bullish: "강세", bearish: "약세", neutral: "혼조" },
        themeLabel:    "시황 분석",
        topPickLabel:  "최선호 종목",
        riskLabel:     "리스크 노트",
        lockedHeading: "포트폴리오 인텔리전스",
        lockedSub:     "전체 보드 기반 포트폴리오 합산 분석은 Pro 전용 기능입니다.",
      },
    },

    digest: {
      title:         "마켓 다이제스트",
      subtitle:      (t) => `${t} 종목 일간/주간 시황 브리핑`,
      subscribe:     "구독 신청",
      subscribed:    "구독 완료",
      confirmedText: (f) => `${f === "daily" ? "일간" : "주간"} 다이제스트가 설정되었습니다.`,
      placeholder:   "이메일 주소를 입력하세요",
      freqDaily:     "매일",
      freqWeekly:    "매주",
      lockedCta:     "이메일 다이제스트는 Pro 전용 기능입니다",
    },

    report: {
      title:        "AI 심층 분석 보고서",
      subtitle:     "기관급 마켓 인텔리전스 브리핑",
      generate:     "보고서 생성",
      regenerate:   "재생성",
      generating:   "분석 중…",
      lockedTeaser: (t) =>
        `Pro 전용 — ${t} 종목의 8개 섹션 구조화 분석 보고서. 포지셔닝, 주요 동인, 리스크, 기관 플로우, 투자 판단 컨텍스트 포함.`,
      proTeaser: (t) =>
        `${t} 종목의 구조화 인텔리전스 브리핑을 생성합니다. 시장 포지셔닝, 핵심 동인, 리스크 평가, 기관 플로우, 투자자 유형별 판단 컨텍스트를 분석합니다.`,
      disclaimer: "AI 생성 시황 분석 · 투자 권유 아님 · 참고용 정보 제공",
      s1: "요약",
      s2: "시장 포지셔닝",
      s3: "핵심 동인",
      s4: "리스크 평가",
      s5: "기관 플로우",
      s6: "투자 판단 컨텍스트",
      s7: "모니터링 포인트",
      s8: "애널리스트 노트",
      decShort: "단기 트레이더",
      decSwing:  "스윙 트레이더",
      decLong:   "장기 투자자",
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CHINESE (Simplified)
  // 以国内券商研报及机构分析报告的专业表达方式撰写。
  // 非英文直译，而是中文金融文体的自然呈现。
  // ──────────────────────────────────────────────────────────────────────────
  zh: {
    upgradeBtn: "升级Pro",

    locked: { cta: "升级解锁" },

    modal: {
      title:          "开启 OmniAlpha Pro",
      subtitle:       "更深的洞察。更快的决策。更少的噪音。",
      monthly:        "月付",
      annual:         "年付",
      saveLabel:      (pct) => `节省 ${pct}%`,
      freeName:       "免费版",
      freeTagline:    "无需绑卡，即享实时行情数据。",
      proName:        "Pro",
      proTagline:     "专为追求高质量信号的投资者设计。",
      perMonth:       "/月",
      billedAnnually: "按年计费",
      currentPlan:    "当前方案",
      demoBanner:     "演示模式 — 无需支付，立即体验Pro功能",
      activatePro:    "⚡ 立即体验Pro（演示）",
      switchFree:     "↓ 切换至免费版",
      disclaimer:     "无实际扣费，Stripe付款接入即将上线。",
    },

    pricing: {
      heading:      "透明简洁的定价方案",
      subtext:      "所有图表数据均免费。Pro版解锁更深层次的分析能力。",
      monthly:      "月付",
      annual:       "年付",
      saveLabel:    (pct) => `节省 ${pct}%`,
      freeForever:  "永久免费",
      currentPlan:  "当前方案",
      perMonth:     "/月",
      annualNote:   "按年计费",
      upgradeCta:   "⚡ 升级到Pro",
      downgradeCta: "↓ 切换至免费版",
      demoBanner:   "演示模式 — 一键切换Pro",
    },

    priority: {
      tab:            "优先面板",
      title:          "优先面板",
      subtitle:       "聚焦当下组合中最值得关注的信号",
      addPlaceholder: "添加股票代码（如 NVDA、005930.KS）",
      addBtn:         "添加",
      duplicate:      "该股票已在面板中",
      limitMsg:       (n) => `免费版最多添加${n}只，升级Pro享无限制`,
      empty: {
        heading: "面板暂无股票",
        sub:     "添加股票，即可捕捉当下最关键的市场信号。",
      },
      remove:  "删除",
      signal:  { bullish: "看多", bearish: "看空", neutral: "中性" },
      strength: (n) => `强度 ${n}/5`,
      sections: {
        priority: "今日重点",
        risk:     "高风险警示",
        momentum: "动能 / 机会",
        quiet:    "值得关注",
      },
      sectionSubs: {
        priority: "当前需要立即关注的高确信度个股",
        risk:     "下行风险或事件风险较高的标的",
        momentum: "强度持续扩散，关注加速突破",
        quiet:    "低噪音但值得持续留意的个股",
      },
      actions: {
        why:      "为何波动?",
        riskView: "风险视角",
        watch:    "关注要点",
        market:   "市场解读",
      },
      actionsLoading:   "分析中…",
      actionUpgradeCta: "升级Pro查看深度分析 →",
      proInsightCta:    "升级Pro查看完整洞察 →",
      proFullInsight:   "完整洞察",
      drivers:          "核心驱动",
      riskFlag:         "风险",
      newsPulse: { label: "资讯", hot: "活跃", quiet: "平静", mixed: "分化" },
      portfolio: {
        title:         "组合智能分析",
        sentiment:     { bullish: "看多", bearish: "看空", neutral: "分化" },
        themeLabel:    "市场研判",
        topPickLabel:  "最优选股",
        riskLabel:     "风险提示",
        lockedHeading: "组合智能分析",
        lockedSub:     "基于全部面板股票的投资组合综合分析为Pro专属功能。",
      },
    },

    digest: {
      title:         "市场摘要",
      subtitle:      (t) => `${t} 每日/每周精选简报`,
      subscribe:     "立即订阅",
      subscribed:    "订阅成功",
      confirmedText: (f) => `${f === "daily" ? "每日" : "每周"}摘要已设置。`,
      placeholder:   "请输入您的邮箱",
      freqDaily:     "每日",
      freqWeekly:    "每周",
      lockedCta:     "邮件摘要为Pro专属功能，升级后即可使用",
    },

    report: {
      title:        "AI深度研报",
      subtitle:     "机构级市场情报简报",
      generate:     "生成研报",
      regenerate:   "重新生成",
      generating:   "正在分析…",
      lockedTeaser: (t) =>
        `Pro专属 — ${t}的8项结构化分析报告，涵盖持仓定位、核心驱动、风险评估、机构资金流向及投资决策参考。`,
      proTeaser: (t) =>
        `生成${t}的结构化情报简报，包含市场定位、核心驱动因素、风险评估、机构资金流向分析及各类投资者的决策参考。`,
      disclaimer: "AI生成市场分析 · 非投资建议 · 仅供参考",
      s1: "综合摘要",
      s2: "市场定位",
      s3: "核心驱动",
      s4: "风险评估",
      s5: "机构资金面",
      s6: "投资决策参考",
      s7: "重点关注项",
      s8: "分析师注记",
      decShort: "短线交易者",
      decSwing:  "波段交易者",
      decLong:   "长线投资者",
    },
  },
};
