import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Flame, Zap, Star, ArrowUpRight, ArrowDownRight,
  Activity, Search, Loader2,
} from "lucide-react";
import { useStock } from "@/hooks/use-stock";
import { useChart } from "@/hooks/use-chart";
import { useTrending, type TrendItem } from "@/hooks/use-trending";
import {
  AreaChart, Area, ResponsiveContainer,
} from "recharts";

type Lang = "en" | "ko" | "zh";

/* ─────────────────────────────────────────────── */
/*  Curated lists                                  */
/* ─────────────────────────────────────────────── */
const DISCOVER: Record<
  "us" | "kr" | "cn",
  { symbol: string; label: string; reason: Record<Lang, string>; tag: string }[]
> = {
  us: [
    {
      symbol: "NVDA",
      label: "NVIDIA",
      tag: "AI",
      reason: {
        en: "Dominates AI chip demand — GPUs power every major LLM training run globally.",
        ko: "전 세계 AI 칩 수요를 독점 — 모든 대형 LLM 학습은 NVIDIA GPU로 구동됩니다.",
        zh: "主导AI芯片需求——全球主要大模型训练均依赖NVIDIA GPU。",
      },
    },
    {
      symbol: "PLTR",
      label: "Palantir",
      tag: "AI SaaS",
      reason: {
        en: "AI-driven data analytics platform rapidly winning US government & enterprise contracts.",
        ko: "AI 기반 데이터 분석 플랫폼으로 미국 정부·기업 계약을 빠르게 확장 중.",
        zh: "AI数据分析平台，正快速拿下美国政府和企业订单。",
      },
    },
    {
      symbol: "ARM",
      label: "Arm Holdings",
      tag: "Chips",
      reason: {
        en: "Architecture inside 99% of smartphones — now powering AI edge & data-center chips.",
        ko: "스마트폰 99%에 탑재된 아키텍처 — AI 엣지·데이터센터 칩으로 확장 중.",
        zh: "99%智能手机芯片架构，正向AI边缘和数据中心扩展。",
      },
    },
    {
      symbol: "AVGO",
      label: "Broadcom",
      tag: "AI Networking",
      reason: {
        en: "Custom AI chips and networking silicon — essential backbone for hyperscaler AI clusters.",
        ko: "맞춤형 AI 칩 & 네트워킹 — 초대형 AI 클러스터의 핵심 인프라.",
        zh: "定制AI芯片和网络硅——超大规模AI集群的关键基础设施。",
      },
    },
    {
      symbol: "META",
      label: "Meta Platforms",
      tag: "AI+Social",
      reason: {
        en: "Open-source Llama models + AI Glasses + ad revenue explosion — firing on all cylinders.",
        ko: "오픈소스 Llama + AI 안경 + 광고 매출 폭발 — 모든 분야에서 성장 중.",
        zh: "开源Llama模型+AI眼镜+广告收入爆发——全面开火。",
      },
    },
    {
      symbol: "TSLA",
      label: "Tesla",
      tag: "EV + Robotics",
      reason: {
        en: "FSD autonomy improvements and Optimus humanoid robot could be the next trillion-dollar story.",
        ko: "FSD 자율주행 개선 + 옵티머스 인간형 로봇 — 차세대 조 달러 기회.",
        zh: "FSD自动驾驶改进+Optimus人形机器人，可能是下一个万亿美元故事。",
      },
    },
    {
      symbol: "AMZN",
      label: "Amazon",
      tag: "Cloud + AI",
      reason: {
        en: "AWS AI services growing 30%+ while advertising revenue and Prime continue compounding.",
        ko: "AWS AI 서비스 30% 이상 성장, 광고 수익·Prime도 꾸준히 복리 성장 중.",
        zh: "AWS AI服务增长30%+，广告收入和Prime持续复利增长。",
      },
    },
  ],
  kr: [
    {
      symbol: "000660.KS",
      label: "SK하이닉스",
      tag: "HBM",
      reason: {
        en: "World's #1 HBM (High Bandwidth Memory) supplier — every Nvidia H100/H200 uses it.",
        ko: "세계 1위 HBM 공급사 — Nvidia H100/H200 모두 SK하이닉스 HBM 탑재.",
        zh: "全球第一HBM供应商——每块Nvidia H100/H200都使用其产品。",
      },
    },
    {
      symbol: "005380.KS",
      label: "현대차",
      tag: "EV + 로봇",
      reason: {
        en: "Boston Dynamics + Ioniq EV line makes Hyundai a rare auto + robotics conglomerate.",
        ko: "Boston Dynamics + 아이오닉 EV — 자동차와 로봇을 동시에 키우는 희귀한 기업.",
        zh: "Boston Dynamics+Ioniq电动车，使现代成为罕见的汽车+机器人集团。",
      },
    },
    {
      symbol: "035420.KS",
      label: "NAVER",
      tag: "AI+검색",
      reason: {
        en: "Korea's AI search leader with HyperCLOVA X — competing head-on with ChatGPT in Korean.",
        ko: "HyperCLOVA X로 한국 AI 검색 선두 — ChatGPT와 한국어 AI 시장 정면 경쟁.",
        zh: "韩国AI搜索领导者，以HyperCLOVA X直面ChatGPT竞争。",
      },
    },
    {
      symbol: "373220.KS",
      label: "LG에너지솔루션",
      tag: "배터리",
      reason: {
        en: "Powering GM, Ford, and Stellantis EVs — one of the largest battery makers outside China.",
        ko: "GM, 포드, 스텔란티스 전기차 배터리 공급 — 중국 외 최대 배터리 기업.",
        zh: "为GM、福特和Stellantis电动车供电——中国以外最大电池制造商之一。",
      },
    },
    {
      symbol: "068270.KS",
      label: "셀트리온",
      tag: "바이오",
      reason: {
        en: "Korea's biosimilar export champion — Remsima SC now approved in 100+ countries.",
        ko: "한국 바이오시밀러 수출 챔피언 — Remsima SC 100개국 이상 승인.",
        zh: "韩国生物仿制药出口冠军——Remsima SC已在100多个国家获批。",
      },
    },
    {
      symbol: "086520.KS",
      label: "에코프로",
      tag: "양극재",
      reason: {
        en: "Leading Korean EV battery cathode material maker — key beneficiary of EV adoption.",
        ko: "한국 대표 2차전지 양극재 기업 — EV 확산의 핵심 수혜주.",
        zh: "韩国领先的电动车电池正极材料制造商——电动车普及的核心受益者。",
      },
    },
    {
      symbol: "035720.KS",
      label: "카카오",
      tag: "플랫폼",
      reason: {
        en: "Korea's super-app ecosystem: messaging, payments, AI, webtoons, and entertainment.",
        ko: "한국 슈퍼앱 생태계 — 메시지, 결제, AI, 웹툰, 엔터테인먼트 모두 포함.",
        zh: "韩国超级应用生态系统：消息、支付、AI、网络漫画和娱乐。",
      },
    },
  ],
  cn: [
    {
      symbol: "700.HK",
      label: "腾讯",
      tag: "AI+游戏",
      reason: {
        en: "Dominant gaming & messaging empire pivoting to AI — Hunyuan models advancing fast.",
        ko: "게임·메시징 제국에서 AI로 전환 — Hunyuan 모델 빠르게 발전 중.",
        zh: "主导游戏和消息帝国转向AI——混元大模型快速进化中。",
      },
    },
    {
      symbol: "9988.HK",
      label: "阿里巴巴",
      tag: "AI 클라우드",
      reason: {
        en: "Alibaba Cloud's Qwen AI models rival GPT-4 — massive Chinese enterprise market tailwind.",
        ko: "알리바바 클라우드 Qwen AI 모델 GPT-4 수준 — 거대한 중국 기업 시장 성장.",
        zh: "阿里云通义千问AI模型媲美GPT-4——中国企业市场强劲增长。",
      },
    },
    {
      symbol: "1211.HK",
      label: "比亚迪",
      tag: "EV",
      reason: {
        en: "World's #1 EV seller — outselling Tesla globally and expanding into Europe and SE Asia.",
        ko: "세계 1위 EV 판매량 — 전 세계에서 테슬라 추월, 유럽·동남아 진출 확대.",
        zh: "全球第一电动车销售商——全球销量超越特斯拉，向欧洲和东南亚扩张。",
      },
    },
    {
      symbol: "9618.HK",
      label: "京东",
      tag: "이커머스",
      reason: {
        en: "JD's self-built logistics network gives a structural edge in China's competitive e-commerce market.",
        ko: "자체 물류 네트워크로 중국 이커머스 시장에서 구조적 경쟁 우위 보유.",
        zh: "京东自建物流网络在中国激烈的电商市场中提供结构性优势。",
      },
    },
    {
      symbol: "2015.HK",
      label: "理想汽车",
      tag: "EV",
      reason: {
        en: "Li Auto's EREV tech uniquely solves range anxiety — becoming China's family EV of choice.",
        ko: "Li Auto EREV 기술로 주행거리 불안 해소 — 중국 가족 EV 선택의 기준.",
        zh: "理想汽车增程电动技术独特解决续航焦虑——成为中国家庭首选电动车。",
      },
    },
    {
      symbol: "9866.HK",
      label: "蔚来",
      tag: "EV+배터리",
      reason: {
        en: "NIO's battery-swap network and premium brand strategy keep it relevant despite fierce competition.",
        ko: "배터리 스왑 네트워크 + 프리미엄 전략으로 치열한 경쟁 속 포지션 유지.",
        zh: "蔚来换电网络和高端品牌战略在激烈竞争中保持竞争力。",
      },
    },
    {
      symbol: "9999.HK",
      label: "网易",
      tag: "게임",
      reason: {
        en: "NetEase's global gaming hits and education pivot show strong non-Tencent gaming exposure.",
        ko: "네이즈 글로벌 게임 히트 + 교육 전환 — 텐센트 외 게임 노출 강화.",
        zh: "网易全球游戏热门和教育转型展现强劲的非腾讯游戏敞口。",
      },
    },
  ],
};

/* ─────────────────────────────────────────────── */
/*  UI Translations                                */
/* ─────────────────────────────────────────────── */
const DT: Record<Lang, { title: string; subtitle: string; whyTitle: string; open: string; closed: string }> = {
  en: {
    title: "Discover",
    subtitle: "Trending & high-potential picks — curated per market",
    whyTitle: "WHY IT MATTERS",
    open: "OPEN",
    closed: "CLOSED",
  },
  ko: {
    title: "유망주 탐색",
    subtitle: "마켓별 트렌딩 및 유망 종목 — 큐레이션",
    whyTitle: "주목해야 하는 이유",
    open: "개장",
    closed: "폐장",
  },
  zh: {
    title: "探索",
    subtitle: "各市场热门与高潜力精选股票",
    whyTitle: "为什么值得关注",
    open: "开盘",
    closed: "休市",
  },
};

/* ─────────────────────────────────────────────── */
/*  Sparkline + stock data card                    */
/* ─────────────────────────────────────────────── */
function DiscoverCard({
  symbol,
  label,
  tag,
  reason,
  lang,
  onSelect,
}: {
  symbol: string;
  label: string;
  tag: string;
  reason: Record<Lang, string>;
  lang: Lang;
  onSelect: (s: string) => void;
}) {
  const { data, isLoading } = useStock(symbol);
  const { data: chartData } = useChart(symbol, "1w");

  const price = data?.price ?? null;
  const changePct = data?.changePercent ?? null;
  const currency = data?.currency ?? "USD";
  const up = (changePct ?? 0) >= 0;

  const currencySymbol: Record<string, string> = {
    USD: "$", KRW: "₩", HKD: "HK$", EUR: "€", GBP: "£", JPY: "¥",
  };
  const sym = currencySymbol[currency] ?? currency + " ";

  const formatPrice = (v: number) => {
    if (currency === "KRW" || currency === "JPY") return sym + Math.round(v).toLocaleString();
    return sym + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const sparkPoints = (chartData?.points ?? []).map((d: { price: number }) => ({ v: d.price }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(symbol)}
      className="cursor-pointer rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: "#121821",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(58,160,255,0.3)")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)")}
    >
      {/* Top section */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-white text-sm truncate">{label}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: "rgba(58,160,255,0.12)", color: "#3AA0FF", border: "1px solid rgba(58,160,255,0.2)" }}>
              {tag}
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{symbol}</span>
        </div>

        {/* Price block */}
        <div className="text-right shrink-0">
          {isLoading ? (
            <div className="w-20 h-5 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          ) : price != null ? (
            <>
              <div className="font-mono font-bold text-base text-white leading-none">
                {formatPrice(price)}
              </div>
              {changePct != null && (
                <div className="flex items-center justify-end gap-0.5 mt-1">
                  {up
                    ? <ArrowUpRight className="w-3 h-3" style={{ color: "#00FF9C" }} />
                    : <ArrowDownRight className="w-3 h-3" style={{ color: "#FF4D4D" }} />
                  }
                  <span className="font-mono text-xs font-bold"
                    style={{ color: up ? "#00FF9C" : "#FF4D4D" }}>
                    {up ? "+" : ""}{(changePct ?? 0).toFixed(2)}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
          )}
        </div>
      </div>

      {/* Sparkline */}
      <div className="px-2" style={{ height: 56 }}>
        {sparkPoints.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkPoints} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id={`sg-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={up ? "#00FF9C" : "#FF4D4D"} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={up ? "#00FF9C" : "#FF4D4D"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={up ? "#00FF9C" : "#FF4D4D"}
                strokeWidth={1.5}
                fill={`url(#sg-${symbol})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Why it matters */}
      <div className="mx-4 mb-5 mt-3 px-3 py-3 rounded-xl"
        style={{ background: "rgba(58,160,255,0.06)", border: "1px solid rgba(58,160,255,0.1)" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#3AA0FF" }}>
          WHY IT MATTERS
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
          {reason[lang]}
        </p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Single row in a trending list                  */
/* ─────────────────────────────────────────────── */
function TrendRow({
  item,
  onSelect,
}: {
  item: TrendItem;
  onSelect: (s: string) => void;
}) {
  const up = item.changePercent >= 0;
  const currSym: Record<string, string> = {
    USD: "$", KRW: "₩", HKD: "HK$", EUR: "€", GBP: "£", JPY: "¥",
  };
  const sym = currSym[item.currency] ?? item.currency + " ";
  const fmtPrice = (v: number) => {
    if (item.currency === "KRW" || item.currency === "JPY")
      return sym + Math.round(v).toLocaleString();
    return sym + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: item.rank * 0.04 }}
      onClick={() => onSelect(item.symbol)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
      style={{ background: "transparent" }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(58,160,255,0.06)")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      {/* Rank */}
      <span className="text-[10px] font-bold font-mono w-4 shrink-0 text-center"
        style={{ color: item.rank <= 3 ? "#FF9C00" : "rgba(255,255,255,0.2)" }}>
        {item.rank}
      </span>

      {/* Name + symbol */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white truncate">{item.name}</div>
        <div className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          {item.symbol}
        </div>
      </div>

      {/* Volume */}
      <div className="text-[9px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
        {item.volume}
      </div>

      {/* Price + change */}
      <div className="text-right shrink-0 ml-1">
        <div className="text-xs font-bold font-mono text-white">{fmtPrice(item.price)}</div>
        <div className="flex items-center justify-end gap-0.5 mt-0.5">
          {up
            ? <ArrowUpRight className="w-2.5 h-2.5" style={{ color: "#00FF9C" }} />
            : <ArrowDownRight className="w-2.5 h-2.5" style={{ color: "#FF4D4D" }} />
          }
          <span className="text-[9px] font-bold font-mono"
            style={{ color: up ? "#00FF9C" : "#FF4D4D" }}>
            {up ? "+" : ""}{(item.changePercent ?? 0).toFixed(2)}%
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────── */
/*  Trending panel (searched + most active)        */
/* ─────────────────────────────────────────────── */
const TREND_LABELS: Record<Lang, { searched: string; active: string; powered: string }> = {
  en: { searched: "Most Searched", active: "Most Traded", powered: "Powered by Yahoo Finance" },
  ko: { searched: "최다 검색 종목", active: "최다 거래 종목", powered: "Yahoo Finance 제공" },
  zh: { searched: "热门搜索", active: "最多交易", powered: "由 Yahoo Finance 提供" },
};

function TrendingPanel({
  market,
  lang,
  onSelectTicker,
}: {
  market: "us" | "kr" | "cn";
  lang: Lang;
  onSelectTicker: (s: string) => void;
}) {
  const { data, isLoading, error } = useTrending(market);
  const tl = TREND_LABELS[lang];

  const skeleton = Array.from({ length: 8 }, (_, i) => i);

  const Panel = ({
    title,
    icon,
    items,
    accentColor,
  }: {
    title: string;
    icon: React.ReactNode;
    items: TrendItem[];
    accentColor: string;
  }) => (
    <div className="flex-1 min-w-0 rounded-2xl flex flex-col overflow-hidden"
      style={{ background: "#121821", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color: accentColor }}>{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-white">{title}</span>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: "rgba(255,255,255,0.2)" }} />}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-1.5" style={{ scrollbarWidth: "none" }}>
        {isLoading && skeleton.map(i => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 mb-0.5">
            <div className="w-4 h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex-1">
              <div className="h-3 w-3/4 rounded animate-pulse mb-1.5" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-2 w-1/3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
            <div className="h-3 w-12 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        ))}
        {!isLoading && error && (
          <p className="text-xs p-4 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
            {lang === "ko" ? "데이터를 불러올 수 없습니다" : lang === "zh" ? "无法加载数据" : "Unable to load data"}
          </p>
        )}
        {!isLoading && !error && items.length === 0 && (
          <p className="text-xs p-4 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
            {lang === "ko" ? "데이터 없음" : lang === "zh" ? "暂无数据" : "No data available"}
          </p>
        )}
        {!isLoading && items.map(item => (
          <TrendRow key={item.symbol} item={item} onSelect={onSelectTicker} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>{tl.powered}</p>
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 mb-7" style={{ height: 340 }}>
      <Panel
        title={tl.searched}
        icon={<Search className="w-3.5 h-3.5" />}
        items={data?.trending ?? []}
        accentColor="#3AA0FF"
      />
      <Panel
        title={tl.active}
        icon={<Activity className="w-3.5 h-3.5" />}
        items={data?.mostActive ?? []}
        accentColor="#00FF9C"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Main Discover Page                             */
/* ─────────────────────────────────────────────── */
export function DiscoverPage({
  lang,
  onSelectTicker,
}: {
  lang: Lang;
  onSelectTicker: (ticker: string) => void;
}) {
  const [market, setMarket] = useState<"us" | "kr" | "cn">("us");
  const dt = DT[lang];
  const stocks = DISCOVER[market];

  const marketTabs: { key: "us" | "kr" | "cn"; flag: string; label: string }[] = [
    { key: "us", flag: "🇺🇸", label: "US" },
    { key: "kr", flag: "🇰🇷", label: "KR" },
    { key: "cn", flag: "🇨🇳", label: "HK" },
  ];

  const sectionLabel: Record<Lang, string> = {
    en: "Editor's Picks — High Potential",
    ko: "에디터 픽 — 유망주",
    zh: "编辑精选 — 高潜力",
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: "none" }}>
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5" style={{ color: "#FF9C00" }} />
            <h1 className="font-display font-bold text-2xl text-white">{dt.title}</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{dt.subtitle}</p>
        </div>

        {/* Market tab */}
        <div className="flex items-center rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
          {marketTabs.map(({ key, flag, label }) => (
            <button
              key={key}
              onClick={() => setMarket(key)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all"
              style={market === key
                ? { background: "#3AA0FF", color: "#0B0F14" }
                : { color: "rgba(255,255,255,0.4)" }
              }
            >
              <span>{flag}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Real-time trending panels ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`trend-${market}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <TrendingPanel market={market} lang={lang} onSelectTicker={onSelectTicker} />
        </motion.div>
      </AnimatePresence>

      {/* ── Curated picks divider ── */}
      <div className="flex items-center gap-3 mb-5">
        <Star className="w-3.5 h-3.5 shrink-0" style={{ color: "#FF9C00" }} />
        <span className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.35)" }}>
          {sectionLabel[lang]}
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Cards grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={market}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {stocks.map((s, i) => (
            <motion.div key={s.symbol} transition={{ delay: i * 0.05 }}>
              <DiscoverCard
                symbol={s.symbol}
                label={s.label}
                tag={s.tag}
                reason={s.reason}
                lang={lang}
                onSelect={(sym) => onSelectTicker(sym)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
