# Phase 3F.3 Portfolio Aggregate And Display-Name Labels Result v0.1

Date: 2026-06-20

## Status And Scope

Status: implementation completed; validation results are recorded below.

Phase 3F.3 adds a provider-free My Portfolio aggregate view to the Market dashboard sample model and switches Market chart labels from ticker-first to display-name-first. The phase preserves the `d3-hierarchy` Treemap engine, Market view modes, fullscreen, browser-only PNG export, Home sticky ad, Chart AI, Portfolio CRUD, Header auth stability, and `Today: 000`.

## Files Changed

- `src/components/MarketShell.astro`
- `src/data/marketTreemapSamples.ts`
- `src/styles/style.css`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`
- `docs/planning/phase_3f3_portfolio_aggregate_display_names_result_v0.1.md`

## Owner Phase 3F.2 Smoke Result Summary

- Passed: `/market`, `/heatmap`, visible `Treemap` terminology, hierarchy-like Treemap visual quality, value-based tile sizing, mode behavior for `Treemap`, `Momentum / Trend`, and `같이 보기`, fullscreen, PNG export, Home sticky ad, Chart AI, Portfolio, Header auth, `Today: 000`, provider-call absence, and console safety.
- New requirements: add a My Portfolio aggregate `전체 보기` option and make Treemap and Momentum / Trend labels display security names first instead of ticker-only labels.

## My Portfolio Current-State Assessment

The Market dashboard currently uses deterministic sample data only. Existing authenticated Portfolio client/API/server helpers remain separate from the Market dashboard and were not called by Codex validation. Phase 3F.3 therefore implements aggregate and individual portfolio behavior in the sample data model so future real authenticated data can plug into the same dashboard shape later.

## Portfolio Aggregate View Summary

- Added sample portfolio scopes under the My Portfolio universe.
- Added `전체 보기` as the default aggregate scope.
- Added individual sample portfolio scopes:
  - `Core Growth`
  - `Income Balance`
- The selector is visible only when the active universe is My Portfolio.
- The selector affects both Treemap and Momentum / Trend panels.

## `전체 보기` Selector Summary

`전체 보기` combines all sample portfolio scopes into one aggregate view. Non-Portfolio universes normalize to the internal `all` scope and do not show the portfolio selector.

## Duplicate Security Aggregation Strategy

Aggregate grouping uses a stable `market + symbol` key, with market inferred from the sample item when not explicitly set. Duplicate securities across sample portfolios are merged into one row. The merged row preserves display name, symbol, market, sector, and source portfolio names for SVG title metadata.

## Area Value / Cost-Basis / Sample-Weight Strategy

This phase does not fetch live prices and does not pretend sample values are live valuations. Treemap area uses deterministic sample `value`. When duplicate securities are aggregated, `value` is summed and momentum, trend, and base return are weighted by sample value.

## Individual Portfolio View Preservation Summary

Individual sample portfolio views remain available as separate scope tabs. Selecting an individual scope limits Treemap and Momentum / Trend to that sample portfolio's positions.

## Display-Name-First Label Policy Summary

Visible Treemap and scatter labels now use the best available display name:

- `displayName`
- `name`
- `symbol` as final fallback

Ticker/symbol remains available in SVG title text, aria labels, internal keys, and export filenames.

## Treemap Label Update Summary

- Large Treemap tiles show display name plus return.
- Medium Treemap tiles show compact display name.
- Small tiles hide visible text but keep the native SVG title.
- SVG titles use `Display Name (SYMBOL)` plus return and value.

## Momentum / Trend Label Update Summary

- Scatter point labels now show display names.
- SVG titles use `Display Name (SYMBOL)` plus momentum and trend.
- Source portfolio names are included in titles for aggregate sample rows.

## Tooltip / Aria / Internal Ticker Preservation Summary

Symbols remain in:

- SVG `<title>` values.
- scatter point `aria-label`.
- internal security keys.
- export filenames.
- `symbol` fields in the data model.

## Display Name Sample-Data Enrichment Summary

- Added `displayName` support to sample constituents.
- Added Korean display names for key Korean sample holdings such as `삼성전자`, `SK하이닉스`, `KB금융`, and `셀트리온`.
- Existing English names remain display names for US securities and ETFs.

## Treemap Engine Preservation Summary

The `d3-hierarchy` engine remains in place. `hierarchy`, `treemap`, and `treemapSquarify` still build a root -> sector -> constituent layout with value-based area mapping and return-color fills.

## View-Mode Preservation Summary

The Market view-mode selector remains:

- `Treemap`
- `Momentum / Trend`
- `같이 보기`

Treemap-only and Momentum-only full-width modes remain, and combined mode remains available.

## Fullscreen / Export Preservation Summary

Fullscreen modal, close button, ESC close, backdrop close, and browser-only PNG export remain. Export filenames still use `treemap` for Treemap cards and do not upload files, store files in a database, or send analytics.

## Home Sticky Ad Preservation Summary

Home sticky ad code was not changed. Home-only ad behavior and non-Home ad absence are preserved by scope.

## Chart AI Preservation Summary

Chart AI chart-first UX, selected-security query prefill, and the Phase 3D server-only usage guard skeleton are preserved. No provider execution was added.

## Portfolio / Header / Today Preservation Summary

Portfolio CRUD code was not changed. Header auth label stability and `Today: 000` placeholder behavior are preserved by scope.

## Explicit Non-Goals

- No real provider call was implemented.
- No real AI analysis was implemented.
- No real market-data fetching was implemented.
- No reference-site scraping/fetching was implemented.
- No DB migration was added.
- No direct SQL was run.
- No Supabase CLI was run.
- No `psql` was run.
- No production authenticated write validation was performed by Codex.
- No real visitor count was implemented.
- No ad-event tracking was implemented.
- No Vercel environment mutation was performed.
- No deployment was run.

## Security Notes

- No browser service-role exposure was added.
- No token logging was added.
- No raw DB errors were added to browser-visible UI.
- No provider secrets were requested, read, recorded, printed, or summarized.
- No ignored `.env*` file contents were read.

## Validation Results

- `npm run build`: pass.
- Vercel output exists:
  - `.vercel/output/config.json`
  - `.vercel/output/functions/_render.func`
  - `.vercel/output/static`
- Local unauthenticated route smoke:
  - `/`: pass.
  - `/portfolio`: pass.
  - `/chart-ai`: pass.
  - `/chart-ai?symbol=005930&name=...&market=KR`: pass.
  - `/lab`: pass.
  - `/heatmap`: pass.
  - `/market`: pass.
- Removed legacy route smoke:
  - `/seibro`: 404.
  - `/api/news`: 404.
  - `/api/list`: 404.
  - `/api/holdings`: 404.
  - `/api/stock`: 404.
  - `/api/etf`: 404.
  - `/api/search`: 404.
- Unauthenticated POST to `/api/chart-ai/analyze`: sanitized 401 with no raw stack/token marker detected.
- Static source validation:
  - My Portfolio `전체 보기` UI exists.
  - Portfolio scope selector is scoped to My Portfolio through dashboard state/CSS.
  - Individual sample portfolio options exist.
  - Aggregate logic groups by market + symbol.
  - Duplicate securities are merged.
  - Treemap and scatter visible labels use display names.
  - Tickers remain in SVG title/aria/internal metadata.
  - `d3-hierarchy` Treemap engine remains.
  - view-mode selector remains.
  - visible Market UI uses `Treemap`.
- Browser automation:
  - Playwright was not installed locally.
  - No new browser automation dependency was added solely for this phase.
  - Owner browser smoke remains required for final visual judgment and PNG click behavior.

## Owner Manual Smoke Steps

```text
Phase 3F.3 Portfolio 전체 보기/표시명 재점검 결과:

- 테스트 대상: local / deployed
- 브라우저: Chrome 등
- `/market` 진입: 통과/실패
- `/heatmap` 호환 진입: 통과/실패
- My Portfolio 선택 시 `전체 보기` 옵션 표시: 통과/실패
- 개별 포트폴리오 선택 옵션 표시: 통과/실패/해당 없음
- `전체 보기` 선택 시 여러 포트폴리오 보유 종목이 합산 표시됨: 통과/실패/샘플 기준
- 동일 종목이 여러 포트폴리오에 있을 때 하나로 합산됨: 통과/실패/해당 없음
- Treemap 라벨이 티커가 아니라 종목명 중심으로 표시됨: 통과/실패
- Momentum / Trend 라벨이 티커가 아니라 종목명 중심으로 표시됨: 통과/실패
- tooltip/title 또는 보조 정보에서 티커 확인 가능: 통과/실패/미실행
- `Treemap` 보기 모드 유지: 통과/실패
- `Momentum / Trend` 보기 모드 유지: 통과/실패
- `같이 보기` 보기 모드 유지: 통과/실패
- Treemap 계층형 블록 시각 유지: 통과/실패
- Treemap 크게 보기 동작: 통과/실패
- 산점도 크게 보기 동작: 통과/실패
- Treemap PNG 저장: 통과/실패/미실행
- 산점도 PNG 저장: 통과/실패/미실행
- Home 광고 sticky 동작 유지: 통과/실패/화면폭 부족
- Chart AI 차트 우선 UX 유지: 통과/실패
- Portfolio 주요 기능 유지: 통과/실패/미실행
- Header 로그인 라벨 안정성 유지: 통과/실패
- `Today: 000` placeholder 유지: 통과/실패
- 실제 provider/reference-site 호출 없음: 통과/실패
- 브라우저 콘솔에 token/key/raw DB error/stack trace 노출 없음: 통과/실패
- 비밀 정보 없는 메모:
```

## Remaining Risks

- The aggregate My Portfolio view is sample-data-only until a future authenticated read design is approved.
- No browser automation runtime was available, so owner visual smoke remains required for fullscreen and PNG click behavior.
- The sample `value` field is a deterministic weight/proxy, not live valuation.

## Recommended Next Action

Run the Phase 3F.3 owner Chrome smoke. If accepted, proceed to the next provider-free Market refinement or a separately approved authenticated data integration planning phase.
