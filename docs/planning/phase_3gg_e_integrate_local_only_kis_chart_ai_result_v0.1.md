# Phase 3GG-E-INTEGRATE Result: Local-only KIS Data to Chart AI Integration v0.1

- Status: Implemented.
- Baseline: bb2569401a2d6190174f53c9f8a4813dde8be8bc.
- Branch: rebuild/phase-1-ia-shell.

## Purpose

Integrate the completed Phase 3GG-D-FAST local-only Live KIS `current_price` market-data
path into the Chart AI local-only flow, making sanitized KIS current-price data available
inside Chart AI in a local-only, opt-in, non-public way. Per the governing work order for
this phase, this document is a result record only — no separate plan document was produced,
consistent with the acceleration instruction to prioritize working local-only integration
over additional planning documents.

## Files changed

Created:
- `src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs` — pure, dependency-free
  Chart AI context adapter.
- `src/pages/api/chart-ai/local-only-kis-current-price.json.ts` — local-only, fail-closed
  API route.
- `scripts/smoke_phase_3gg_e_integrate_local_only_kis_chart_ai_context.mjs` — integration
  smoke script.
- `scripts/check_phase_3gg_e_integrate_contract.mjs` — static contract checker.
- `docs/planning/phase_3gg_e_integrate_local_only_kis_chart_ai_result_v0.1.md` — this
  document.

Modified:
- `src/pages/chart-ai.astro` — added a hidden-by-default owner-local KIS integration panel,
  its local-only + opt-in visibility gate, and its click-handler/fetch logic. No existing
  panel, gate, or fetch call was altered.
- `package.json` — added `smoke:phase-3gg-e-integrate` and `check:phase-3gg-e-integrate`
  script entries.
- `docs/planning/planning_changelog.md` — prepended the Phase 3GG-E-INTEGRATE entry.

## Integration summary

The adapter (`kis-market-data-to-chart-ai-context.mjs`) maps a sanitized Phase 3GG-D-FAST
binding response onto an 11-field allowlisted Chart AI market-data context
(`symbol`, `market`, `currentPrice`, `volume`, `timestamp`, `sourceStatus`, `cacheStatus`,
`sanitizedErrorCode`, `providerLabel`, `integrationMode`, `warnings`). It only ever reads
these named fields from its input, so raw provider payload keys or credential-shaped keys
are never carried through regardless of what is passed in; `assertNoRawKisPayloadInChartAiContext`
enforces this as a hard invariant. Unavailable/blocked input is mapped to a safe,
fail-closed context with `warnings` populated rather than throwing.

The route (`local-only-kis-current-price.json.ts`) wires the adapter to the Phase 3GG-D-FAST
binding's `runLocalOnlyLiveKisMarketDataRequest`, using module-scope rate-limiter/cache
instances and a `fetchQuote` dependency that delegates to the existing, unmodified
`kisClient.ts`'s `getKisDomesticQuoteSnapshot`. The chart-ai.astro panel calls this route on
an explicit button click only (never automatically) and renders the sanitized context fields
into a `<dl>` summary.

## API route created

Yes: `src/pages/api/chart-ai/local-only-kis-current-price.json.ts` (`GET`, plus an `ALL`
handler that returns 405 with a blocked context for any other method).

## chart-ai.astro modified

Yes. Three additions: (1) a hidden-by-default `<section id="chartAiOwnerLocalKisIntegrationPanel">`
with a run button and a result container; (2) a visibility-gating block computing
`ownerLocalKisIntegrationEnabled = mockedChartAiAccess.capabilities.canAccessChartAi &&
isLocalOwnerHostname() && ownerLocalKisIntegrationOptIn`, toggling `panel.hidden`; (3) a
click-handler block that fetches the route with an 8-second `AbortController` timeout, an
in-flight-request guard, and renders the result or a fail-closed message. No other panel,
gate, or fetch call in the file was modified.

## Sanitized fields displayed

`symbol`, `market`, `currentPrice`, `volume`, `timestamp`, `sourceStatus`, `cacheStatus`,
plus a `warnings` list and a disclaimer paragraph when the source is unavailable. No raw
provider payload field (e.g. `rt_cd`, `output`, `stck_prpr`, `acml_vol`) and no credential
value is ever displayed, logged, or returned.

## Activation status

No public activation. No beta activation. No internal QA activation. The panel is hidden by
default and only becomes visible on `localhost` / `127.0.0.1` / `::1` with the explicit
`?ownerLocalKisIntegration=1` query opt-in. The route itself independently fails closed
(returns a `blocked` / `NON_LOCAL_REQUEST` context) unless the same local hostname + opt-in
conditions are met, and further defers to the Phase 3GG-D-FAST binding's own env-based
local-only guard, which blocks in any Vercel/deployed/production runtime regardless of
hostname.

## Credential exposure status

None. The route's `hasEnvValue` helper is boolean-presence-only and never reads, logs, or
serializes an actual credential value. Neither the adapter, the route, nor the chart-ai.astro
panel additions contain any credential value, API key, secret, token, account number, JWT,
session, or cookie data.

## Raw payload exposure status

None. The adapter's fixed-allowlist read pattern structurally prevents raw KIS payload
fields (`rt_cd`, `output`, `stck_prpr`, `acml_vol`, etc.) from ever reaching the Chart AI
context, the API route response, or the chart-ai.astro panel. Verified by the smoke script's
static source scans of the route file, the adapter file, and the new panel/gating/click-handler
markup in chart-ai.astro.

## Forbidden endpoint status

No order, cancel/modify order, account, balance, funds, buying power, sellable quantity,
profit/loss, deposit/withdrawal, trading history, portfolio/holdings, or personal endpoint
exists in the adapter, the route, or the new chart-ai.astro panel markup. The route's
endpoint category is hardcoded to `current_price` with no parameter or code path capable of
requesting any other category.

## Validation results

- `npm run smoke:phase-3gg-e-integrate` — PASS (113/113 assertions).
- `npm run check:phase-3gg-e-integrate` — PASS.
- `npm run smoke:phase-3gg-d-fast` — PASS (re-run to confirm Phase 3GG-D-FAST is unaffected).
- `npm run check:phase-3gg-d-fast` — PASS (re-run to confirm Phase 3GG-D-FAST is unaffected).
- `npm run build` — PASS.
- `git diff --check` — no whitespace errors.
- Forbidden diff check (MK Agent / Similar Pattern Agent / guarded-productization-scaffold /
  Phase 3GG-D-FAST binding source and fixture / components / supabase / src/data / lockfiles /
  `.env` / `.env.local` since baseline `bb2569401a2d6190174f53c9f8a4813dde8be8bc`) — empty.
- KIS provider diff check (existing KIS provider modules since the same baseline) — empty.

## Known limitations

- No outbound KIS network call occurred in this local validation environment: the delegated
  `kisClient.ts` readiness gate returns `CONFIG_MISSING`/disabled without `KIS_ENABLE_LIVE_QUOTES`
  and the other required credential env vars present, so the route safely fails closed with
  `sourceStatus: unavailable` / `sanitizedErrorCode: PROVIDER_UNAVAILABLE` end-to-end. This
  mirrors Phase 3GG-D-FAST's own documented limitation and was not re-solved in this phase.
- `current_price` is the only supported endpoint category; no OHLC, account, order, balance,
  or portfolio data is integrated, per this phase's explicit scope boundary.
- No automated browser/UI QA was run against the new panel in this phase (accelerated,
  local-only path); manual owner-local QA is deferred to the next phase.

## Next recommended phase

Phase 3GG-F-FAST — Local-only Chart AI KIS Current Price UX Polish and Manual QA.
