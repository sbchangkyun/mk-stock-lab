# Phase 3CC — Security Metadata Coverage Expansion
## Result Document v0.1 — 2026-06-26

---

### Metadata

- **Phase**: 3CC
- **Type**: Security Metadata Coverage Expansion
- **Status**: Implemented
- **Latest prior commit**: a314f52 fix: polish global spacing and home order
- **Runtime UI changes**: none
- **API route changes**: none
- **DB / Supabase schema changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **External HTTP by Claude Code**: none
- **Vercel Preview calls by Claude Code**: none
- **Deployment**: not performed

---

### Business / Product Reason

Portfolio and Chart AI use `securityLogos.json` as a local display-name fallback. Before this phase, only two symbols were covered (`005930` with the English name "Samsung Electronics", and `KO`). Users entering the four KR fixture valuation symbols or common US test symbols would see the raw ticker instead of a recognizable name.

Goals:
- Reduce `티커 직접 입력` fallback for common symbols used in early testing.
- Show Korean display names for KR securities.
- Show concise English display names for US securities.
- Prepare a richer local metadata layer before live KIS official names are connected.
- No live API calls, no DB changes, no runtime logic changes.

---

### Implementation Summary

**Data-only expansion.** No runtime files were modified. Only `src/data/securityLogos.json` was updated.

#### Modified Files

| File | Change |
|---|---|
| `src/data/securityLogos.json` | Updated `005930` name to Korean; added 9 new entries |
| `scripts/check_security_metadata_coverage_static_contract.mjs` | New focused checker (12 groups) |
| `scripts/check_portfolio_ticker_display_name_resolver_static_contract.mjs` | Added Group 4B Phase 3CC coverage checks |
| `package.json` | Added `check:security-metadata-coverage` script |
| `docs/planning/planning_changelog.md` | Phase 3CC entry prepended |

---

### Added / Updated Coverage

| Symbol | Name | Country | Change |
|---|---|---|---|
| `005930` | 삼성전자 | KR | Updated (was "Samsung Electronics") |
| `000660` | SK하이닉스 | KR | Added |
| `035420` | NAVER | KR | Added |
| `069500` | KODEX 200 | KR | Added |
| `KO` | Coca-Cola | US | Unchanged (already correct) |
| `AAPL` | Apple | US | Added |
| `NVDA` | NVIDIA | US | Added |
| `MSFT` | Microsoft | US | Added |
| `TSLA` | Tesla | US | Added |
| `SPY` | SPDR S&P 500 ETF | US | Added |
| `QQQ` | Invesco QQQ | US | Added |

**Total**: 11 symbols covered (up from 2). 4 KR fixture valuation symbols covered. 7 US test symbols covered.

**Logo URLs**: Existing `005930` and `KO` Toss Invest CDN logo URLs preserved. New entries do not include `logoUrl` — portfolio falls back to avatar initials as designed.

---

### Schema Preservation

The existing schema is `{ name, symbol, country, logoUrl? }` where `country` is `"KR"` or `"US"`. This phase:

- Preserves the `country` field (does NOT introduce a `market` field)
- Does NOT introduce `type`, `assetType`, `category`, `provider`, `lastUpdated`, or `price` fields
- Preserves all existing entries without modification except updating `005930.name`

The `normalizeLogoKey` resolver in `portfolio.astro` uppercases all lookup keys. All added keys are either 6-digit numeric strings (KR codes, unchanged by uppercase) or uppercase US ticker strings — matching the lookup behavior exactly.

---

### Naming Policy

| Market | Display Name Source | Example |
|---|---|---|
| KR | Local Korean broker-style name | `삼성전자`, `SK하이닉스`, `KODEX 200` |
| US | Concise canonical English name | `Apple`, `NVIDIA`, `SPDR S&P 500 ETF` |

**These are local display names only**, used as fallback before live KIS official names are connected. They are NOT:
- Live KIS official names
- Real-time data
- Guaranteed to match broker confirmation screens

KIS official names may override these in a future phase when live name resolution is added.

---

### No-Load Policy

- All data is local JSON — no HTTP fetch, no Supabase, no KIS, no GNews.
- No setInterval, polling, cron, or background refresh added.
- No API route created or modified.
- No Supabase schema change.

---

### Validation Results

| Validator | Result |
|---|---|
| `npm run check:security-metadata-coverage` | PASS |
| `npm run check:portfolio-ticker-display-name` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| `git status --short` | Clean (only known pre-existing untracked files) |

---

### Manual Owner Checklist

1. Open `/portfolio` (Portfolio page) on desktop
2. Create a position with symbol `000660` — confirm display name shows **SK하이닉스**
3. Create a position with symbol `035420` — confirm display name shows **NAVER**
4. Create a position with symbol `069500` — confirm display name shows **KODEX 200**
5. Create a position with symbol `AAPL` — confirm display name shows **Apple**
6. Confirm the symbol (`000660`, `AAPL`, etc.) still appears as the secondary label
7. Confirm valuation behavior (fixture data, 연동 예정 fallback) is unchanged
8. Create a position with an unsupported ticker (e.g., `ZZZ`) — confirm **티커 직접 입력** fallback remains

---

### Remaining Limitations

- **Local metadata only**: 11 symbols covered; all other tickers still fall back to `티커 직접 입력`.
- **No live name search**: users cannot autocomplete ticker names from a live database.
- **No KIS official naming yet**: names shown are local approximations, not broker-confirmed.
- **No logo URLs for new entries**: new entries use avatar initials (letter-based) as the logo display.
- **Coverage is curated**: adding more tickers requires manual JSON updates until live resolution is added.

---

### Recommended Next Phase

**Option A — Phase 3CD: MyPage MVP Completion**
- Complete the MyPage account display (join date, session count, notification toggle persistence)
- Moderate scope; involves Supabase reads for user metadata
- High visible impact for returning users

**Option B — Phase 3CD: Chart AI UX Skeleton Enhancement**
- Improve the Chart AI analysis flow skeleton (search UX, state display, guard messaging)
- Pure frontend work; no live API calls required for the skeleton phase
- Visible product milestone for the analysis flow

**Recommendation**: Phase 3CD MyPage MVP Completion if account-page polish is the priority; Chart AI UX Skeleton if the next visible milestone should be the analysis entry flow.
