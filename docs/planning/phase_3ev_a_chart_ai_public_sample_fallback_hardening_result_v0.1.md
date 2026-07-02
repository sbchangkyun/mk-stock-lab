# Phase 3EV-A — Chart AI Public Sample/Fallback Hardening Result

## 1. Status

Implemented — public sample/fallback hardening and owner-local KIS connected mode labeling applied to `/chart-ai`. No gate, route, or provider changes.

## 2. Background

- Phase 3EU-OWNER-REVIEW-CLOSEOUT closed the Chart AI data integration policy review as `PASS_WITH_POLICY_BOUNDARY` and recommended Phase 3EV-A as the next implementation track.
- The owner requested faster implementation and fewer documentation-only phases, and asked that the KIS API be treated as a real connected implementation — not only as a test/smoke path — specifically meaning the owner-local KIS quote/OHLC preview should read as an actual connected owner-local runtime path, while public/default `/chart-ai` remains sample/mocked but should look intentional and product-ready.
- This phase implements that request as a UI/copy-only hardening pass over `src/pages/chart-ai.astro`. No API route, provider, or gate logic was changed.

## 3. Implemented Scope

- **Public/default sample hardening**: added an explicit sample-mode helper line under the chart status badges ("현재 화면은 기능 체험용 샘플 데이터로 구성되어 있습니다. 실제 투자 판단용 정보가 아닙니다.") and extended the bottom page disclaimer with the same framing while preserving the existing buy/sell-recommendation disavowal sentence.
- **Owner-local KIS connected mode labeling**: the KIS local preview panel heading changed from "KIS 로컬 프리뷰" to "KIS 연결 프리뷰". A new `#chartAiQuotePreviewEyebrow` element and the existing `#chartAiQuotePreviewGuide` text now switch at page-load time between a public/default framing ("오너 로컬 전용" / "공개 화면은 샘플 모드입니다. KIS 연결 프리뷰는 오너 로컬 환경에서만 사용할 수 있습니다.") and an owner-local framing ("오너 로컬 KIS 연결 모드" / "오너 로컬 환경에서 KIS 연결 프리뷰를 사용할 수 있습니다. 버튼을 눌러 지연 시세와 OHLC를 확인하세요."), based on the existing client-side `source=owner-local` query check. The approved applied-state copy ("지연 시세 · KIS OHLC · KRW", "오너 로컬 전용") is unchanged.
- **KIS preview fallback UX copy**: updated the client-side fallback strings for both the quote preview and OHLC preview controls to a consistent three-tier vocabulary: blocked = "오너 로컬 환경에서만 KIS 연결 프리뷰를 사용할 수 있습니다.", unavailable/error = "현재 KIS 데이터를 불러오지 못했습니다. 샘플 데이터로 계속 표시합니다.", malformed/insufficient OHLC = "KIS 응답을 차트에 표시할 수 없어 샘플 차트를 유지합니다.". The quote preview panel no longer echoes the raw `providerStatus` string in its detail line. No raw server message, stack trace, or provider code is shown in any path.
- **Company overview fallback hardening**: the sidebar company panel now shows a small deterministic field list (업종/시장 구분/데이터 상태 placeholders) plus a "정식 기업 데이터 연동 전까지는 참고용 구조 예시로 제공됩니다." note, in addition to the existing sample/non-investment disclaimer. All content is static; no external fetch or live data was added.
- **Sample chart state**: confirmed unchanged behavior — `renderChart()`/`fallbackToSampleChart()` still render the deterministic mocked OHLC series on load, on symbol/period change, and on any blocked/unavailable/malformed owner-local response; only the fallback message text changed (see above).
- **MK AI readiness copy**: the readiness note now reads "MK AI 분석 준비 중" with "MK AI 분석은 차트 데이터 연동 안정화 이후 순차 제공 예정입니다." and "현재는 차트와 데이터 상태를 먼저 확인할 수 있습니다." No AI analysis behavior or external AI API call was added.

## 4. KIS Connected Mode Interpretation

- Actual owner-local KIS connection: unchanged. The owner-local quote/OHLC preview routes still require `source=owner-local`, the matching `preview=quote`/`preview=ohlc` flag, a localhost request, the three owner-local env flags, and the owner-local provider gate (`mode='owner-local'`, `allowNetwork=true`, `allowKisLive=true`) before any real KIS call is attempted.
- Public/default KIS exposure: not added. Public/default `/chart-ai` never calls the owner-local quote/OHLC routes; the preview buttons remain `disabled` in markup and only receive click handlers when `source=owner-local` is present in the URL.
- `source=live`: not added.
- `source=auto`: not added.
- Owner-local gates: unchanged — no edits to `src/pages/api/chart-ai/owner-local-quote-preview.ts`, `src/pages/api/chart-ai/owner-local-ohlc-preview.ts`, `src/lib/server/providers/kis/kisOwnerLocalGate.ts`, `kisOwnerLocalQuotePreview.ts`, or `kisOwnerLocalOhlcPreview.ts`.
- Raw response/secrets: no raw provider payload, header, token, or account field is rendered by the updated UI copy; the quote preview panel's detail line (previously `provider: ${providerStatus}`) was removed rather than expanded.

## 5. Preserved Boundaries

- No public KIS quote or OHLC exposure.
- No `source=live` or `source=auto`.
- No change to owner-local gate conditions (localhost check, env flags, provider gate, endpoint verification).
- No change to API route files or provider/adapter files.
- No account/trading/order/balance API usage; no `KIS_ACCOUNT_NO` reference.
- No live KIS call, dev server, browser, Playwright/Puppeteer, or screenshot used by Codex.
- No Supabase/SQL/migration, Vercel env, or dependency changes.
- No deployment, no push.

## 6. Validation

- `npm run check:phase-3ev-a-chart-ai-public-sample-fallback-hardening`: PASS (42/42).
- `npm run check:phase-3eu-owner-review-closeout-chart-ai-data-policy`: PASS (45/45).
- `npm run check:phase-3eu-owner-review-chart-ai-data-integration-policy`: PASS (47/47).
- `npm run check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan`: PASS (48/48).
- `npm run check:phase-3en-hf1-legacy-kis-checker-cleanup`: PASS (42/42).
- `npm run check:kis-quote-adapter-mocked`: PASS (101/101).
- `npm run check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview`: PASS (41/41).
- `npm run check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification`: PASS (44/44).
- `npm run check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification`: PASS (46/46).
- `npm run check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring`: PASS (62/62).
- `npm run check:phase-3et-owner-review-chart-ai-ohlc-preview`: PASS (38/38).
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke-closeout`: PASS (38/38).
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke`: PASS (70/70).
- `npm run check:phase-3ep-owner-review-closeout`: PASS (32/32).
- `npm run check:phase-3eq-kis-chart-ohlc-feasibility-plan`: PASS (66/66).
- `npm run check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`: PASS (49/49).
- `npm run check:phase-3eo-owner-local-kis-quote-smoke`: PASS (58/58).
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`: PASS (87/87).
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS (7/7).
- `npm run check:kis-error-fallback`: PASS (48/48).
- `npm run check:chart-ai-ux-skeleton`: PASS (82/82).
- `npm run check:mobile-baseline`: PASS (74/74).
- `npm run check:production-domain`: PASS (33/33).
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: DRY_RUN; no browser and no network.

Three literal-copy checker assertions (`check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification`, `check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring`, `check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`) were updated in this phase to match the newly accepted copy strings ("KIS 연결 프리뷰" panel heading, and the updated blocked/unavailable/malformed fallback messages). No safety assertion was weakened — the same fallback/gate/no-raw-data behaviors are still checked, only the literal Korean copy expectations were brought current.

Two additional checkers (`check:phase-3eu-owner-review-chart-ai-data-integration-policy`, `check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan`) initially failed a single "no src runtime files changed in this phase" assertion each, because both used an open-ended `git diff --name-only <startingCommit>` range that picked up this phase's legitimate uncommitted `chart-ai.astro` changes. This is the same open-ended-diff fragility class already fixed for three other checkers in Phase 3EN-HF1. Both checkers were updated to diff a pinned `${startingCommit}..${endingCommit}` range (ending commits `1c3defc` and `0f6df6b`, the commits at which those historical phases actually completed), matching the established fix pattern. No safety assertion was weakened; both now pass at their original full counts (47/47 and 48/48).

No known checker failures remain.

## 7. Safety

Confirmed for this phase:

- UI/copy-only change to `src/pages/chart-ai.astro`; no API route change; no provider/adapter change; no gate change;
- no public KIS quote/OHLC exposure added;
- no `source=live` or `source=auto` added;
- owner-local gates (localhost check, env flags, provider gate, endpoint verification) unchanged;
- no live KIS call by Codex;
- no dev server launched by Codex;
- no browser opened by Codex;
- no Playwright or Puppeteer used;
- no `.env` read;
- no actual market values recorded;
- no raw response, provider code, or stack trace exposed in UI copy;
- no secrets;
- no account/trading APIs; no `KIS_ACCOUNT_NO` reference;
- no screenshot committed;
- no Supabase/SQL/migration;
- no Vercel changes;
- no dependency changes;
- no deployment;
- no push.

## 8. Recommended Next Phase

Recommended:
Phase 3EV-A-OWNER-RUNTIME-CHECK — Owner Local Runtime Check of Public Sample/Fallback and KIS Connected Mode

Rationale:
This phase's copy and UX changes are static-only verified; an owner-local runtime check (owner running `npm run dev` locally with `source=owner-local` and the owner-local env flags) is the safest way to confirm the new labels and fallback copy render and behave as intended against a real owner-local KIS connection.

Alternative:
Phase 3EV-B — Owner-Auth Gated Preview Plan, only if the owner wants to plan authenticated preview beyond localhost.
