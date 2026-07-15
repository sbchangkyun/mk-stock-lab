# Phase 3GG-T-HF3B-HF2-HF2A3 — Protected Preview API Transport Hotfix — Result v0.1

Root-cause-confirmed transport hotfix: **no instrument** searched on the SSO-protected Preview
(005930 / 삼성전자 / 069500 / 0000D0 / AAPL / IWM). **No merge, no Production deploy, no DB/Supabase/env/
Vercel-setting/secret change.**

## 1. Executive classification

**`PASS_PREVIEW_DEPLOYMENT_PROTECTION_API_TRANSPORT_VERIFIED`** — implemented + local gates green + pushed
(`09bc39c`) + authenticated Preview transport verified by Owner QA on the SSO-protected Preview (§7). No PR
merge, no main push, no PR-metadata mutation, no Production deploy.

## 2. Corrected root cause

- **Why ALL searches failed (not only 0000D0):** the protected Chart AI API calls used
  **`credentials: 'omit'`**, which strips the **Vercel Deployment Protection (SSO) cookie** from
  same-origin requests. On the SSO-protected Preview, Vercel intercepts/redirects those cookie-less
  requests to its login screen **before they reach the Astro API route** — so every instrument search (and
  OHLCV/Similarity/MK) fails. This is `REQUEST BLOCKED BEFORE APPLICATION ROUTE`, not "the handler returned
  zero results".
- **Static evidence:** all same-origin `/api/chart-ai/*` calls in `chart-ai.astro` explicitly set
  `credentials: 'omit'` (search ×3, OHLCV, Similarity, MK, summary).
- **Runtime-log evidence (prior phase):** the Preview logs contained `/chart-ai` and
  `/api/auth/profile-bootstrap` but **NOT** `/api/chart-ai/instruments/search.json` after search attempts —
  the search request never reached the app.
- **Why prior hotfixes did not solve it:** HF2A2 fixed the OAuth redirect (login stays on Preview) and the
  client's "401-as-zero-results" display, but the request itself was still cookie-less and blocked by
  Deployment Protection before any app auth/JSON logic ran. The transport was the missing piece.
- The committed master + pure search resolve all instruments (smoke matrix) → the master is **not** the
  cause and is **not modified**.

## 3. Transport contract (fix)

New `src/lib/chart-ai/chart-ai-authenticated-fetch.ts`:
- `chartAiAuthenticatedFetch(input, init)` — resolves the target against `window.location.origin` and
  **rejects a cross-origin target**; merges caller headers via `new Headers(init.headers)`; attaches the
  Supabase **Bearer** token from `getCurrentSession()` (never cached in module state); sends
  **`credentials: 'same-origin'`** (SSO cookie reaches the SAME Preview host only — never KIS/Supabase/
  vercel.com/another domain); preserves method/body/AbortSignal; never logs tokens/cookies/headers/bodies.
- `classifyChartAiResponse` + `fetchChartAiJson` — classify the response so a blocked/redirected request is
  never shown as zero results:
  `SUCCESS` / `NO_RESULTS` / `APP_AUTH_REQUIRED` (401) / `APP_AUTH_INVALID` (403) /
  `PREVIEW_DEPLOYMENT_AUTH_REQUIRED` (off-origin redirect or HTML where JSON is required) /
  `API_RESPONSE_INVALID` / `API_REQUEST_FAILED`.

**Security:** Vercel SSO preserved (not bypassed, not disabled); Supabase Bearer still independently
required (route stays fail-closed `private, no-store` + `Vary: Authorization`); same-origin only; no
token/cookie exposure.

## 4. Migrated protected calls

| Call | Before | After |
|---|---|---|
| instrument search | `fetch(..., credentials:'omit')` | `fetchChartAiJson(...)` (classified) |
| load more | `fetch(..., credentials:'omit')` | `chartAiAuthenticatedFetch(...)` |
| suggested-instrument resolve | `fetch(..., credentials:'omit')` | `chartAiAuthenticatedFetch(...)` |
| OHLCV (real chart) | `fetch(..., credentials:'omit')` | `chartAiAuthenticatedFetch(...)` |
| Similarity | `fetch(..., credentials:'omit')` | `chartAiAuthenticatedFetch(...)` |
| MK Analysis | `fetch(..., credentials:'omit')` | `chartAiAuthenticatedFetch(...)` |
| local-only KIS summary (localhost) | `fetch(..., credentials:'omit')` | `chartAiAuthenticatedFetch(...)` |

Owner-local preview calls (`owner-local-*`, `/api/chart-ai/similarity` POST) already used the default
`same-origin` credentials and are localhost-only — unchanged. Public assets / external APIs do not use the
helper.

## 5. Search diagnostics + init isolation

- Non-secret `data-chart-ai-search-{state,http-status,master-version,request-host}` attributes on the search
  panel (state enum + integer status + non-secret master version + hostname only — never tokens/cookies/
  user data/payloads) for deterministic browser QA.
- Deployment-protection failures show the transport message
  “Preview 접근 인증이 만료되었거나 API 요청이 보호 화면에서 차단되었습니다. 페이지를 새로고침한 뒤 다시
  로그인해 주세요.” — never "검색 결과가 없습니다".
- `data-chart-ai-search-ready="true"` is set only after the input/button exist, all search listeners are
  bound, and the transport helper is available — set BEFORE the chart/analysis setup, so a later
  initialization error cannot leave search unbound. HF2A2 behaviors preserved (debounce cancel, canonical
  uppercase code, fresh-page selection, stale-response guard, load-more hidden on zero).

## 6. Tests

- `smoke:phase-3gg-t-hf3b-hf2-hf2a3` — 18/18 (pure search matrix for all seven queries + the classification
  decision table). `check:phase-3gg-t-hf3b-hf2-hf2a3` — PASS (helper contract, migration, classification,
  diagnostics/init marker, HF2A2 preservation, master/workflow/token unchanged). Full gate + `astro build`
  + `npm ls` + `git diff --check` — see the changelog.

## 7. Preview transport verification — Owner QA, PASS (commit 09bc39c)

- Preview: `https://mkstocklab-23kvouhpg-sbchangkyun-2946s-projects.vercel.app` — READY, target Preview,
  SSO-protected (unauthenticated `/chart-ai` and `/api/chart-ai/instruments/search.json` both 302 →
  `vercel.com/sso-api`; the only new Preview created ~57s after the `e922cc4..09bc39c` push).
- **The authenticated browser stayed on the protected Preview** — the transport reached the app route
  through Deployment Protection instead of being redirected to the SSO login screen. This is the direct
  proof that `credentials: 'same-origin'` fixed the blocked-before-route failure.
- **`0000D0` search succeeded.** **`0000d0` (lowercase) succeeded and resolved to the canonical `0000D0`**
  (query canonicalization intact).
- Displayed identity: **`KR | 0000D0 | KOSPI | etf`**; the UI rendered **KOSPI, ETF, and KRW** correctly.
- **Preview runtime logs recorded 8 requests to `/api/chart-ai/instruments/search.json`, all HTTP 200** —
  the search route was actually invoked on the app (not intercepted), returning success.
- **No Production deployment occurred.** No PR merge, no main push, no PR-metadata change.

Evidence scope: the Owner confirmed the above. Downstream OHLCV/Similarity/MK and KIS-token counts were not
part of this QA pass and are not claimed here.

## 8. Git / safety

- Implementation commit `Phase 3GG-T-HF3B-HF2-HF2A3: fix protected Preview API transport`; docs-only
  verification commit only after a real Preview PASS. Feature branch pushed (no main push/force/merge/
  auto-merge). No Production deploy; no DB/Supabase/env/Vercel-setting/secret change; no KIS token lifecycle
  change; no auth weakening; Vercel SSO preserved; master unchanged; no raw files.

## 9. Next phase

**Phase 3GG-T-HF3B-HF2-HF2B-SIMILARITY-EXPLAINABILITY-UX** (not started here).
