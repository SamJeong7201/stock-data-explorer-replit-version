# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
Codebase is progressively being made Vercel-friendly: portable env var handling,
centralized API URLs, shared singleton clients, and clean plugin gating.

## Artifacts

- **Stock Tracker** (`artifacts/stock-tracker`) — React + Vite frontend at `/`
- **API Server** (`artifacts/api-server`) — Express backend at `/api`

## Stock Tracker Features

- Real-time stock data via Yahoo Finance (yahoo-finance2 v3) + Naver Finance for Korean stocks
- `GET /api/stocks/:ticker` — price, chart history, news (responds in ~0.5s)
- `POST /api/stocks/:ticker/insights` — AI-powered "Why it matters" per headline (async, ~3s, called after initial load)
- `GET /api/stocks/:ticker/chart?range=` — OHLC chart data across 9 ranges (1d–max)
- `GET /api/search?q=` — live ticker/company search with price enrichment; Korean text auto-translated
- `POST /api/translate/news` — translates news headlines+summaries to KO or ZH via OpenAI
- `GET /api/trending?market=us|kr|cn` — trending + most-active stocks via Yahoo Finance screener
- Supported tickers: any valid Yahoo Finance symbol + Korean stocks (`.KS`/`.KQ`) + HK stocks (`.HK`)
- News relevance scoring: 3=direct company, 2=sector peer, 1=macro — score≥2 shown
- UI: Bloomberg Terminal dark theme, EN|한국어|中文 language toggle
- Quick-access Watchlist bar with 🇺🇸/🇰🇷/🇨🇳 market tabs; Discover page with trending + curated picks
- **Priority Board** (full page view via TopNav "Priority Board" tab — replaces old Watchlist view):
  - Decision-focused personal stock intelligence board with 4 sections: Today's Priority / Highest Risk / Momentum·Opportunity / Quiet but Important
  - 4 quick insight actions per card: Why moving? / Risk view / What to watch / Market read (toggle panel, local cache, loading states)
  - `src/services/watchlist-storage.ts` — WatchlistStorage interface + LocalWatchlistStorage (drop-in replaceable)
  - `src/services/watchlist-insights.ts` — InsightProvider, QuickActionType, SectionId, classifyInsight(), getQuickAction(), MockInsightProvider (EN/KO/ZH, free/pro depth)
  - `src/hooks/use-watchlist.ts` + `src/hooks/use-watchlist-insights.ts` — adapter-agnostic hooks
  - `src/hooks/use-quick-action.ts` — per-card quick action state with toggle semantics and local cache
  - `src/components/priority/` — PriorityAddBar, QuickActionBar, QuickActionPanel, PriorityCard, PrioritySection, PortfolioIntelligenceCard, PriorityBoardPanel
  - `src/components/watchlist/` — WatchlistAddBar, WatchlistInsightCard, WatchlistPortfolioSummary, WatchlistInsightPanel (legacy, still compiled)
  - Free: signal + teaser + 4 quick actions (shallow); Pro: full summary + drivers + news pulse + risk flag + portfolio intelligence card
  - i18n: `PREMIUM_UI[lang].priority.*` (EN/KO/ZH), `PriorityBoardStrings` interface in `premium-i18n.ts`

## Freemium / Subscription System

- `src/lib/subscription.ts` — PlanTier, FEATURES constants, PRICING_PLANS, FREE_FEATURES/PRO_FEATURES
- `src/contexts/SubscriptionContext.tsx` — mock tier toggle (free↔pro), canAccess(), openUpgradeModal()
- All gating uses `canAccess(FEATURES.X)` — never direct `isProUser` checks in components
- **FREE features**: all chart ranges, top 3 news, basic stats, P/L calculator, watchlist
- **PRO-gated features**: AI Deep Report, full news list (4+), email digest, market sentiment
- `src/components/premium/` — PremiumBadge, PremiumGate, LockedCard, UpgradeModal, AIDeepReport, EmailDigestPreview, PricingSection
- TopNav shows "Upgrade" button (free) or PRO badge (pro)
- NewsPanel gates items 4+ with blurred preview + upgrade CTA
- UpgradeModal rendered globally in App.tsx (opens from any component)
- Demo mode: clicking Upgrade toggles Pro instantly (no real billing)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/             # Express API server
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── yahoo.ts    # Shared YahooFinance singleton
│   │       │   ├── openai.ts   # Shared OpenAI singleton
│   │       │   ├── format.ts   # Shared formatters (currency, volume, market cap)
│   │       │   └── logger.ts
│   │       ├── routes/         # One file per API resource
│   │       └── index.ts / app.ts
│   └── stock-tracker/          # React + Vite frontend
│       └── src/
│           ├── lib/
│           │   ├── api.ts          # apiUrl() helper — centralizes VITE_API_BASE_URL
│           │   ├── format.ts       # Client-side formatters (getCurrencySymbol, formatPrice, formatNewsDate)
│           │   ├── market-utils.ts # Market timezone logic (getMarketInfo, isMarketOpen, etc.)
│           │   ├── i18n.ts         # Lang type, UI_TRANSLATIONS, SENTIMENT_LABELS
│           │   ├── constants.ts    # MARKET_TICKERS, CHART_RANGES
│           │   └── utils.ts
│           ├── hooks/
│           │   ├── use-stock.ts          # useStock — auto-refetch every 15s
│           │   ├── use-chart.ts          # useChart — OHLC chart data
│           │   ├── use-search-suggestions.ts
│           │   ├── use-stock-insights.ts # AI "Why it matters" summaries
│           │   ├── use-translated-news.ts
│           │   ├── use-trending.ts
│           │   ├── use-market-clock.ts   # Live 1s clock (shared hook)
│           │   └── use-price-flash.ts    # Price change flash effect
│           ├── components/
│           │   ├── layout/
│           │   │   ├── TopNav.tsx       # Sticky header (search, lang toggle, nav)
│           │   │   └── WatchlistBar.tsx # Ticker pills + market clock bar
│           │   └── stock/
│           │       ├── SentimentPill.tsx    # Bullish/Bearish/Neutral badge
│           │       ├── StatBox.tsx          # Stat display (Prev Close, Volume, etc.)
│           │       ├── PriceHeroCard.tsx    # Main stock price card
│           │       ├── ChartCard.tsx        # Chart + range selector
│           │       ├── ProfitCalculator.tsx # P/L position calculator
│           │       ├── NewsPanel.tsx        # Right sidebar news list
│           │       └── NewsContextMenu.tsx  # Click-to-translate popup
│           └── pages/
│               ├── Home.tsx    # Orchestrator (~140 lines) — shared state + layout only
│               └── Discover.tsx
├── lib/                        # Shared libraries
│   ├── api-spec/               # OpenAPI spec + Orval codegen config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas from OpenAPI
│   └── db/                     # Drizzle ORM schema + DB connection
├── scripts/                    # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Environment Variables

### API Server (`artifacts/api-server/.env.example`)
| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes (auto in Replit) | Port Express listens on |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Yes | OpenAI-compatible API base URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | OpenAI API key |

### Frontend (`artifacts/stock-tracker/.env.example`)
| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes (auto in Replit) | Vite dev server port; defaults to 5173 if unset |
| `BASE_PATH` | No | Base path for Replit routing; defaults to `/` |
| `VITE_API_BASE_URL` | No | Full API URL for cross-origin deploys; empty = same origin |

## Vercel-Readiness Notes

- **`BASE_PATH`** is now optional (defaults to `/`). Vercel builds will not fail if unset.
- **Replit plugins** (`@replit/vite-plugin-*`) are gated behind `REPL_ID !== undefined`. Vercel CI never loads them.
- **All API calls** go through `apiUrl()` in `src/lib/api.ts`. Setting `VITE_API_BASE_URL` on Vercel points all fetches at the deployed API.
- **Server singletons** (`lib/yahoo.ts`, `lib/openai.ts`) — one instance per process, consistent config.
- **Remaining gap**: Express server is long-running, not serverless. For Vercel API routes, it would need conversion to serverless functions or a framework like Next.js API routes (future work).

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`).
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
- Shared lib: `src/lib/yahoo.ts`, `src/lib/openai.ts`, `src/lib/format.ts`
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).
Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.
