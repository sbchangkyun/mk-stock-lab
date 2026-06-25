# Phase 3DE — Chart AI UX Skeleton Enhancement
## Result Document v0.1 — 2026-06-26

---

### Metadata

- **Phase**: 3DE
- **Type**: Chart AI UX Skeleton Enhancement
- **Status**: Implemented
- **Latest prior commit**: 3d9a84b feat: complete mypage mvp cleanup
- **Runtime UI changes**: Chart AI page only (`src/pages/chart-ai.astro`)
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **AI provider calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Product Reason

Chart AI is a core differentiating feature of the service. Before this phase, the `/chart-ai` page was a thin placeholder that called a server-side analysis route without any working AI or data backend — giving users a confusing, broken-looking experience.

A skeleton-first approach:
- Makes the page feel "analysis-ready" with a clear workflow
- Shows what the final feature will look like without requiring any live backend
- Avoids server load until real AI/KIS integration is ready
- Sets clear expectations: this is a demo screen, not a live analysis tool

---

### Implementation Summary

#### Changes Made

| File | Change |
|---|---|
| `src/pages/chart-ai.astro` | Full rewrite — improved page hierarchy, control panel, chart snapshot, result cards, disclaimer |
| `src/data/chartAiDemoAnalysis.json` | New fixture file with 4 demo symbol entries |
| `src/styles/style.css` | Added Phase 3DE CSS classes (~120 lines) |
| `scripts/check_chart_ai_ux_skeleton_static_contract.mjs` | New focused checker (13 groups, 82 checks) |
| `package.json` | Added `check:chart-ai-ux-skeleton` script |
| `docs/planning/planning_changelog.md` | Phase 3DE entry prepended |

#### Page Structure (New)

1. **Page header** — eyebrow `Chart AI`, h1 `차트 분석 준비 화면`, lead explaining skeleton-first approach
2. **Analysis control panel** — symbol input, 4 sample symbol buttons, run button, `예시 데이터` local-only badge
3. **Chart snapshot placeholder** — existing bar chart skeleton visual with `연동 전 화면` badge and note
4. **Analysis result section** — 5 result cards (추세 요약, 모멘텀, 변동성, 지지/저항, 리스크 체크) updated by JS on symbol selection
5. **Template/fallback state** — shown for known-but-no-fixture symbols or unknown symbols
6. **Disclaimer panel** — investment guardrails and liability copy

#### Removed from Previous Version

- Server-side `analyzeChartAi` import and `/api/chart-ai/analyze` call (replaced by local fixture)
- URL search param pre-fill logic (simplified to default symbol = 005930)
- `.chart-ai-run-panel` side panel layout (replaced by full-width vertical stack)
- Usage counter / limit status display (not relevant for skeleton)

---

### Fixture Data

**File**: `src/data/chartAiDemoAnalysis.json`

| Symbol | Name | Market |
|---|---|---|
| 005930 | 삼성전자 | KR |
| 035420 | NAVER | KR |
| AAPL | Apple | US |
| NVDA | NVIDIA | US |

**Data policy (strictly enforced)**:
- Every entry's `disclaimer` field contains `예시 데이터 기반 화면입니다. 실제 투자 판단에 사용할 수 없습니다.`
- Every entry's `profile` field contains `예시`
- No entry claims 실시간, live KIS connection, or actual AI output
- No buy/sell recommendation copy in any field

---

### Interaction Behavior

- **Default symbol**: 005930 (삼성전자) analysis rendered on page load via SSR defaults + JS init
- **Sample buttons**: clicking 삼성전자 / NAVER / AAPL / NVDA immediately updates all result cards
- **Symbol input**: typing a ticker and pressing Enter or clicking "예시 분석 보기" triggers lookup
- **Known symbol, no fixture** (e.g. MSFT, KO, QQQ): shows "분석 템플릿 준비 중" state with display name from KNOWN_SYMBOLS
- **Unknown symbol**: shows "티커 직접 입력" state with fallback message
- **No persistence**: no localStorage, no sessionStorage, no cookies
- **No network**: zero fetch calls, zero XHR, no Supabase, no API routes
- **No timers**: no setInterval, no polling, no background refresh

---

### Safety and Scope

- No AI provider added (no OpenAI / Anthropic / Gemini SDK or API call)
- No live data claim (no 실시간, no KIS quote, no live chart data)
- No KIS / GNews / external HTTP
- No Supabase call or import
- No DB migration
- No API route added or modified
- No screenshot capture (no html-to-image invocation)
- No investment advice (no buy/sell signals, no profit guarantee, no recommendation)
- No Home / MyPage / Portfolio / Market / Lab files modified
- No .env reads
- No SQL executed
- No setInterval or recurring timers

---

### Validation Results

| Validator | Result |
|---|---|
| `npm run check:chart-ai-ux-skeleton` | PASS (82/82) |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (only known pre-existing untracked files) |

---

### Manual Owner Checklist

1. Open `/chart-ai`
2. **Improved layout visible** — eyebrow, h1 "차트 분석 준비 화면", lead copy
3. **Control panel** — symbol input, 4 sample buttons (삼성전자/NAVER/AAPL/NVDA), "예시 분석 보기" button
4. **Click "삼성전자"** — result cards update; snapshot title shows `005930 · 삼성전자 · 일봉 예시`
5. **Click "NAVER"** — result cards update to NAVER fixture analysis
6. **Click "AAPL"** — result cards update to Apple English-language fixture
7. **Click "NVDA"** — result cards update to NVIDIA fixture
8. **Type "MSFT" and run** — "분석 템플릿 준비 중" state appears; name "Microsoft" shown
9. **Type "UNKNOWN123" and run** — "티커 직접 입력" fallback state appears
10. **`예시 데이터` badge** — visible in control panel
11. **`연동 전 화면` badge** — visible in snapshot area
12. **Chart skeleton bars** — visible; deterministic CSS-only bar chart
13. **Disclaimer** — "실제 AI 분석 결과가 아닙니다", "매수 또는 매도를 권고하지 않습니다", "이용자 본인의 책임" all visible
14. **Home feature card** — `/chart-ai` link still works from Home page
15. **No buy/sell signal copy** anywhere on the page
16. **Dark mode** — colors adapt via CSS variables

---

### Remaining Limitations

- No real chart image (capture integration deferred to future phase)
- No real AI analysis (AI provider integration deferred)
- No live price data or KIS quote
- No chart interval selector (일봉/주봉/월봉) — timeframe is from fixture string
- No saved analysis history
- No KIS / FX / OpenDART integration
- Only 4 demo symbols have full fixture analysis (others show template state)

---

### Recommended Next Phase

**Option A — Phase 3DF: Lab Static Module Shells**
- Add static content shells for planned Lab sections (sector returns, national pension holdings, ETF scanner, etc.)
- Removes placeholder-heavy "준비 중" feel from Lab page quickly
- Low risk, pure HTML/CSS work

**Option B — Phase 3DF: Market Page Fixture Chart Enhancement**
- Improve Market page with deterministic fixture chart data
- Show more realistic sector/index snapshot without live data
- Medium complexity; reuses chart-skeleton visual system

**Recommendation**: Lab Static Module Shells if the goal is removing the most placeholder-heavy pages fastest; Market Fixture Enhancement if the next visible priority is market analytics UX.
