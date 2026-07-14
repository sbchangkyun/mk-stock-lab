# Phase 3GG-T-HF3B-HF2-HF2A2 — Preview Alphanumeric-Search Hotfix — Result v0.1

Root-cause-driven hotfix for the persistent inability to search the KIS-supported Korean alphanumeric ETF
`0000D0` on the Vercel Preview. **No merge, no Production deploy, no DB/Supabase/env/secret change.**

## 1. Executive classification

Local: implemented + local gates green + pushed. Preview verification (Section 14) is Owner-authenticated
browser QA on the new Preview; target `PASS_PREVIEW_ALPHANUMERIC_SEARCH_HOTFIX_VERIFIED`.

## 2. Reproduced symptom & root cause

- **Symptom:** searching `0000D0` (and `0000d0`) on the Preview shows "검색 결과가 없습니다" (zero results),
  although the committed master + pure search resolve it correctly.
- **Selected decision-matrix case: CASE A — the login redirect sent the user to Production, not the Preview.**
- **Deterministic evidence (no login required):** the deployed **Production** search route
  (`https://mkstocklab.vercel.app/api/chart-ai/instruments/search.json`) reports
  **`masterVersion: hf3b-12826`** (the OLD 12,826-row Nasdaq-Trader+KRX-KIND master) which **does not contain
  the alphanumeric `0000D0`** (that symbol only exists in the KIS-only `hf3b-hf2-kis-16018` master on the
  Preview). Meanwhile `src/components/Auth/GoogleLogin.astro` used `redirectTo: window.location.origin` —
  origin-only, dropping `/chart-ai`, so the Supabase OAuth callback fell back to the Site URL (Production).
  After a Preview login the user was actually on **Production**, whose master lacks `0000D0` → honest zero
  results. **Why the UI showed zero:** the wrong deployment answered (Production), and separately the client
  rendered any empty `items` array (including a 401's) as "no results".

## 3. Actual request evidence

- Production `…/search.json?q=0000D0&country=KR&assetType=etf` → `code: AUTH_REQUIRED`,
  **`masterVersion: hf3b-12826`**, `resultCount: 0`, `items: 0` (no `0000D0` in that master).
- Local committed master: `masterVersion hf3b-hf2-kis-16018`, `0000D0` present once (KR/KOSPI/etf/active,
  `standardCode KR70000D0009`); `searchUniversalInstruments`/`findUniversalInstrument` return it for both
  cases. → the master + parser are correct; **not modified** (Section 3 rule respected).

## 4. Fixes (only evidence-required files)

1. **CASE A — OAuth redirect preservation** (`GoogleLogin.astro`): `redirectTo` now
   ``${window.location.origin}${window.location.pathname}${window.location.search}`` — same origin + path
   (`/chart-ai`) + query, never the URL hash (where OAuth tokens live), no hardcoded Production/Preview host.
   A Preview `/chart-ai` login returns to the same Preview `/chart-ai` (given the Owner-registered Additional
   Redirect URL for the Preview branch alias). Production still returns to Production.
2. **Auth-gated cache safety** (`search.json.ts`): replaced `Cache-Control: public, max-age=300` with
   **`Cache-Control: private, no-store` + `Vary: Authorization`**, so a 401 or another user's 200 can never be
   shared across auth contexts by a CDN. Added a safe **`X-MK-Instrument-Master-Version`** response header
   (non-secret) so a caller can confirm which deployed master answered. The static master stays server-only.
3. **Search-client hardening** (`chart-ai.astro`):
   - `runSearch()` now validates the response: **401/403/AUTH_REQUIRED/AUTH_INVALID → a distinct "로그인이
     필요합니다" message**, not "검색 결과가 없습니다"; a non-ok/`data.ok!==true` → a temporary error message;
     a successful response renders results. Auth/error states are no longer disguised as zero matches.
   - Explicit search (조회 button / Enter) **cancels the pending debounce timer** and issues exactly one
     request, and selects the first result **from the fresh page returned by that request** (not the
     async-mutated global `visibleRecords`) — no debounce/stale race.
   - Query canonicalization: a six-character KR-like code (e.g. `0000d0`) is NFKC-normalized + uppercased for
     the request (leading zeros preserved); ordinary Korean/English name queries are unchanged.
   - Load-more stays hidden when there are zero results.

## 5. Auth & cache behavior

Route stays fail-closed (`validateUserFromBearerToken`; 401 `AUTH_REQUIRED` unauthenticated). Responses are
`private, no-store` + `Vary: Authorization`. No auth weakening; the route was not made public.

## 6. Test results

- `smoke:phase-3gg-t-hf3b-hf2-hf2a2` — 19/19 (master + pure search 0000D0/0000d0 + query normalization).
- `check:phase-3gg-t-hf3b-hf2-hf2a2` — PASS (redirect preservation, cache headers + master-version header,
  client auth-error/debounce/normalization hardening, master/generator/workflow/token/similarity/MK unchanged,
  no account/order/trading, working-tree purity).
- Full regression gate + `astro build` + `npm ls` + `git diff --check` — see §8.

## 7. Preview verification (Owner-authenticated) — recorded after QA

- New Preview deployment (id / url / alias / commit / READY) + deployment-protection state.
- `0000D0` and `0000d0` exact search: request host = Preview, HTTP 200, `masterVersion hf3b-hf2-kis-16018`,
  total ≥ 1, first `0000D0` (KR/KOSPI/etf). UI renders the result; no zero-results; login stays on Preview.
- Filters (KR / ETF / KR+ETF) keep `0000D0` first; selection pending-only; explicit load; chart / Similarity
  / MK bound to `KR|0000D0|KOSPI|etf`; regression on 069500 / AAPL / IWM; KIS token issuance count.

## 8. Git / safety

- Implementation commit `Phase 3GG-T-HF3B-HF2-HF2A2: fix Preview alphanumeric instrument search`; docs-only
  verification commit after Preview PASS. Feature branch pushed (no main push, no force, no merge, no
  auto-merge). No Production deploy; no DB/Supabase/env/secret change; no KIS token implementation change; no
  raw files; no auth weakening; master unchanged.

## 9. Next phase

**Phase 3GG-T-HF3B-HF2-HF2B-SIMILARITY-EXPLAINABILITY-UX** (not started here).
