# mk-stock-lab Current State — New Chat Handoff

Generated: 2026-06-21 — after Phase 3Z completion.

---

## 1. Project Identity

- **Project name**: mk-stock-lab
- **Local path**: `C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`
- **Branch**: `rebuild/phase-1-ia-shell`
- **Latest known commit**: `2ae6367 docs: record successful local kis quote smoke result`
- **Working tree state at handoff**: clean — no uncommitted changes

---

## 2. Source of Truth Hierarchy

1. **Local repository on disk** — always authoritative. ChatGPT cannot read it directly.
2. **`docs/planning/planning_changelog.md`** — chronological record of all phase work, decisions, and outcomes.
3. **Phase-specific result documents** in `docs/planning/` — evidence records for each phase.
4. **Memory files** in `~/.claude/projects/.../memory/` — Claude Code persistent session context.
5. **This file** — snapshot summary only. Do not act on this file without Claude Code read-back first.

**IMPORTANT**: ChatGPT cannot read the local repository directly. Before any Phase 3AA work begins, a Claude Code session must read the repository, verify the state, and produce a read-back report.

---

## 3. Product Purpose

mk-stock-lab is a personal investment research platform built with Astro + Vercel SSR and a Supabase backend. It connects to the Korea Investment Securities (KIS) API for live domestic stock market data. The platform is in early infrastructure-build phase. No user-facing live market data features are active.

**Technology stack**:

- Framework: Astro v6 with Vercel SSR adapter (`@astrojs/vercel`)
- Backend: Supabase (PostgreSQL-based)
- Market data: KIS (Korea Investment Securities) API
- Runtime: Node.js ≥22.12.0
- Language: TypeScript

---

## 4. Active Routes

| Route | Method | Purpose | Status |
|---|---|---|---|
| `/api/market/quote` | GET | Server-side quote fetch with KIS backing and cache | Implemented; local live KIS not yet HTTP-tested |
| All other routes | — | UI pages and other API routes | No live market data connected |

**`/api/market/quote` request/response shape**:
- Query: `?market=KR&symbol=XXXXXX` (6-digit KR code)
- Success: `{ ok: true, data: QuoteSnapshot, fallback: { state, reason } }`
- Error: `{ ok: false, code, message, staleState? }`
- Headers: `Cache-Control: no-store`
- Accepts: `GET` only; `ALL` handler returns `405`

---

## 5. Core Safety Invariants — Must Not Change Without Explicit Owner Approval

### 5.1 Production KIS Gate

`src/lib/server/providers/kisClient.ts` lines 60–64 contain:

```typescript
const isProductionRuntime = () => {
  const nodeEnv = normalizeString(process.env.NODE_ENV).toLowerCase();
  const vercelEnv = normalizeString(process.env.VERCEL_ENV).toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
};
```

`getKisQuoteConfigReadiness()` checks `isProductionRuntime()` first and returns `production_not_allowed` before any KIS call if production is detected. Setting Vercel environment variables alone is insufficient to enable production KIS calls — a source code change to `kisClient.ts` is required and must be separately approved.

All KIS provider registry entries carry `productionAllowed: false`.

### 5.2 Server-Only Boundary

`assertServerRuntime()` in `src/lib/server/providers/serverOnly.ts` throws `ServerOnlyRuntimeError` if called in a browser context (`typeof window !== 'undefined'`). All market data functions call this guard first.

### 5.3 Quote Cache Default

`src/lib/server/marketData/quoteCache.ts`:
- Fresh TTL: `QUOTE_CACHE_FRESH_TTL_MS = 15_000` (15 seconds)
- Stale TTL: `QUOTE_CACHE_STALE_TTL_MS = 120_000` (120 seconds)
- Default backend: in-memory `Map`
- Supabase backend: opt-in via `QUOTE_CACHE_BACKEND=supabase`
- Env name: `QUOTE_CACHE_BACKEND_ENV_NAME = 'QUOTE_CACHE_BACKEND'`

### 5.4 Server Quote Flow

`src/lib/server/marketData/quotes.ts` `getQuoteSnapshot()`:

1. `assertServerRuntime()`
2. Validate `market` and `symbol`
3. Check cache → return `stale-but-usable` or `fresh` if hit
4. Call `getKisQuoteSnapshot()` → KIS OAuth token + domestic quote price inquiry
5. On success: write to cache, return `fresh`
6. On failure: try stale cache → return `stale-but-usable` or `expired`

---

## 6. KIS Provider Environment Names

| Name | Role | Secret | Notes |
|---|---|---|---|
| `KIS_APP_KEY` | KIS API app key | Yes — never record value | Required for live mode |
| `KIS_APP_SECRET` | KIS API app secret | Yes — never record value | Required for live mode |
| `KIS_BASE_URL` | KIS API base URL | Non-secret internal URL | Required for live mode |
| `KIS_ENABLE_LIVE_QUOTES` | Feature flag | Non-secret | Must be `true` string |
| `KIS_ACCOUNT_NO` | Account number | Yes — never set in smoke phases | Must remain absent in Phase 3Y/3AA |

---

## 7. Persistent Quote Cache Environment Names

| Name | Role | Notes |
|---|---|---|
| `QUOTE_CACHE_BACKEND` | Cache backend selector | `supabase` to enable; memory if absent |
| `PUBLIC_SUPABASE_URL` | Supabase project URL | Non-secret (public) |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Non-secret (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Secret — never record value |

---

## 8. Completed Phase Timeline

| Phase | Description | Result | Commit |
|---|---|---|---|
| Phase 3M | Created `market_quote_cache` lifecycle migration file | Complete | — |
| Phase 3Q | Owner manually applied production DB migration via Supabase Dashboard SQL Editor | Passed | `03ba46c` |
| Phase 3R | Added persistent Supabase quote cache adapter (opt-in, default memory) | Complete | `cd36cc2` |
| Phase 3S | Added persistent quote cache live smoke harness | Complete | `bca617f` |
| Phase 3T | Owner ran live smoke; failed with `UNEXPECTED_SAFE_FAILURE` — root cause: `import.meta.env` unavailable in Node.js harness | Failed (diagnosed) | `1044fa0` |
| Phase 3U | Improved smoke diagnostics; added `process.env` fallback in `supabaseAdmin.ts`; 18 step labels | Complete | `5931d61` |
| Phase 3V | Owner ran improved live smoke; all 15 steps passed | **Passed** | `aea3e01` |
| Phase 3W | Controlled live quote integration readiness plan | Complete (docs) | `bd6ffc1` |
| Phase 3X | Vercel env readiness and KIS production gate decision plan (Options A/B/C) | Complete (docs) | `d06f8da` |
| Phase 3Y | Implemented fail-closed, owner-run, local-only KIS quote smoke harness; dry-run validated | Complete | `7f9e0a6` |
| Phase 3Z | Owner ran local live KIS quote smoke; all 14 steps passed | **Passed** | `2ae6367` |

---

## 9. What Is Implemented

- Persistent Supabase quote cache adapter (`src/lib/server/marketData/supabaseQuoteCache.ts`)
- Memory quote cache (default, in `src/lib/server/marketData/quoteCache.ts`)
- KIS domestic quote provider (`src/lib/server/providers/kisClient.ts`) — production-blocked
- Server-side quote orchestration (`src/lib/server/marketData/quotes.ts`)
- `/api/market/quote` HTTP GET route (`src/pages/api/market/quote.ts`)
- Persistent quote cache live smoke harness (`scripts/owner_smoke_persistent_quote_cache_live.mjs`)
- Local KIS quote smoke harness (`scripts/owner_smoke_kis_quote_live.mjs`)
- npm scripts: `smoke:persistent-quote-cache-live:dry`, `smoke:kis-quote-live:dry`, `check:provider-boundaries`
- Provider boundary check script (`scripts/check_server_only_provider_boundaries.mjs`)
- Phase 3W controlled live quote integration readiness plan
- Phase 3X Vercel env readiness and KIS gate decision plan (Options A/B/C)

---

## 10. What Is Validated (by Evidence)

| Validation | Evidence | Phase |
|---|---|---|
| Production DB migration for `market_quote_cache` | Owner manual apply success | Phase 3Q/3V |
| Supabase persistent cache write/readback/cleanup | Owner live smoke passed (15 steps) | Phase 3V |
| KIS provider module loads in local Node.js runtime | `provider-import status=passed` | Phase 3Z |
| Local live KIS OAuth token fetch + quote fetch | `quote-fetch status=passed note=live-quote-received` | Phase 3Z |
| KIS quote normalization to `QuoteSnapshot` | `quote-normalization status=passed` (all required fields, `staleState=fresh`) | Phase 3Z |
| In-process mock cache write/readback/cleanup | `cache-write`, `fresh-readback`, `cleanup-restore` all passed | Phase 3Z |
| TypeScript compiler passes (`tsc --noEmit`) | Passed multiple phases | Phase 3Y |
| Provider boundary check | `check:provider-boundaries` passed | Phase 3Y |
| Astro build | `npm run build` passed | Phase 3Y |

---

## 11. What Remains Unvalidated

- `/api/market/quote` HTTP endpoint with live KIS backing (HTTP request/response shape, status codes, `Cache-Control: no-store` header, actual normalization through the route)
- Supabase persistent cache write/readback using a live KIS quote response (not yet tested — Phase 3Y used in-process mock despite `configuredBackend=supabase`)
- Vercel Preview environment behavior with live KIS
- Vercel Production environment (permanently blocked; no change planned until gate decision)
- KIS rate-limit behavior under repeated calls
- Cold-start token cache reset in deployed Vercel runtime
- KIS error/fallback paths (429, non-`0` `rt_cd`, missing price field)
- Stale cache fallback with live KIS failure

---

## 12. What Is Blocked

| Blocked Action | Reason |
|---|---|
| Production KIS calls | `isProductionRuntime()` guard in `kisClient.ts` — requires code change + owner approval |
| UI live quote wiring (Market, Portfolio, Chart AI, Home, Lab) | Not approved; API endpoint not yet validated |
| Vercel env mutation | Requires separate owner approval |
| Deployment to Vercel | Requires gate decision (Option A/B/C from Phase 3X) |
| KIS account, trading, order, balance, holdings, WebSocket APIs | Permanently blocked in current scope |
| `KIS_ACCOUNT_NO` env var | Must remain absent — account scope excluded |

---

## 13. What Must Not Be Done Next

- Do not implement UI live quote wiring.
- Do not mutate Vercel env.
- Do not deploy.
- Do not change `isProductionRuntime()` or any production KIS guard.
- Do not expose price values, raw KIS fields, tokens, keys, account data, raw errors, or stack traces.
- Do not run live KIS calls from Claude Code directly.
- Do not call KIS OAuth/token or quote endpoints.
- Do not run live Supabase queries from Claude Code.
- Do not set or use `KIS_ACCOUNT_NO`.

---

## 14. Current Recommended Next Action

**Phase 3AA** — Local `/api/market/quote` HTTP endpoint verification.

The next step is to verify that the complete server-side route — from HTTP request through quote orchestration, KIS call, normalization, and JSON response — works correctly with live KIS data in a local non-production Astro dev-server.

This should:
1. Plan or implement an owner-run local Astro dev-server HTTP smoke.
2. Owner starts local Astro dev server, sets required KIS env vars privately, sends `GET /api/market/quote?market=KR&symbol=XXXXXX`.
3. Record only sanitized response-shape evidence: presence of `ok`, `data`, `fallback`; absence of raw KIS fields, tokens, keys; `Cache-Control: no-store`.
4. Not wire any browser UI.
5. Not mutate Vercel env.
6. Not deploy.
7. Not change production KIS guard.

Gate decision (Option A/B/C from Phase 3X) must be made separately before any Vercel env or deployment change.

---

## 15. ChatGPT Cannot Read the Repository

ChatGPT does not have filesystem access. It cannot read `kisClient.ts`, `quotes.ts`, the planning changelog, or any source files. Every claim in this handoff document represents state as of 2026-06-21. The repository may have changed since.

**Before any Phase 3AA implementation or planning begins**, a Claude Code session must:

1. Read `docs/planning/planning_changelog.md` — the chronological source of truth.
2. Read the latest phase result doc (`docs/planning/phase_3z_owner_local_kis_quote_smoke_result_v0.1.md`).
3. Read the relevant source files: `src/lib/server/providers/kisClient.ts`, `src/lib/server/marketData/quotes.ts`, `src/pages/api/market/quote.ts`.
4. Run `git log --oneline -10` and `git status --short`.
5. Produce a read-back report confirming: branch, latest commit, working tree state, latest phase completed, next recommended phase, and current blocked items.
6. **Only after that read-back**, prepare Phase 3AA planning or implementation instructions.
