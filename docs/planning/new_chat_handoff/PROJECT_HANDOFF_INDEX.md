# Project Handoff Index — mk-stock-lab

This index lists the source-of-truth files, evidence records, relevant source files, and validation commands.
Claude Code must verify the repository state by reading these files rather than trusting this index alone.

---

## 1. Chronological Source of Truth

| File | Purpose |
|---|---|
| `docs/planning/planning_changelog.md` | **Primary** — chronological record of every phase. Latest entry = latest work. |

The changelog is the authoritative sequence record. Always read it first.

---

## 2. Phase Result Documents (Evidence Records)

| File | Phase | Key Evidence |
|---|---|---|
| `docs/planning/phase_3z_owner_local_kis_quote_smoke_result_v0.1.md` | Phase 3Z | First successful local live KIS quote smoke. All 14 steps passed. |
| `docs/planning/phase_3y_local_kis_quote_smoke_harness_result_v0.1.md` | Phase 3Y | KIS quote smoke harness design, dry-run/mock validation. |
| `docs/planning/phase_3x_vercel_env_readiness_and_kis_gate_plan_v0.1.md` | Phase 3X | Vercel env readiness, gate options A/B/C. |
| `docs/planning/phase_3w_controlled_live_quote_integration_readiness_plan_v0.1.md` | Phase 3W | End-to-end flow plan, UI surface recommendation. |
| `docs/planning/phase_3v_owner_live_smoke_retry_result_v0.1.md` | Phase 3V | Successful persistent cache live smoke (all 15 steps). |
| `docs/planning/phase_3u_owner_live_smoke_diagnostic_improvement_result_v0.1.md` | Phase 3U | Smoke diagnostic improvement; `process.env` fallback fix. |
| `docs/planning/phase_3r_persistent_quote_cache_adapter_result_v0.1.md` | Phase 3R | Persistent cache adapter design and validation. |

---

## 3. Handoff Files (This Session)

| File | Purpose |
|---|---|
| `docs/planning/new_chat_handoff/CURRENT_STATE.md` | **Latest operational state snapshot**. Snapshot only — verify against repo. |
| `docs/planning/new_chat_handoff/NEXT_TASK_PROMPT.md` | **Next-step bootstrap**. Copy-ready Phase 3AA instruction. |
| `docs/planning/new_chat_handoff/PROJECT_HANDOFF_INDEX.md` | This file — what to read and in what order. |
| `docs/planning/new_chat_handoff/NEW_CHAT_BOOTSTRAP_PROMPT.txt` | Short paste-ready bootstrap for a new ChatGPT chat. |
| `docs/planning/new_chat_handoff/HANDOFF_MANIFEST.json` | JSON manifest of project state at handoff. |

---

## 4. Owner Review Checklist

| File | Purpose |
|---|---|
| `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md` | Korean owner review checklists — one block per phase. Latest = Phase 3Z. |

---

## 5. Scripts Relevant to Live Smoke

| File | Purpose | npm Script |
|---|---|---|
| `scripts/owner_smoke_kis_quote_live.mjs` | Phase 3Y KIS quote smoke harness (owner-run, fail-closed) | `smoke:kis-quote-live:dry` |
| `scripts/owner_smoke_persistent_quote_cache_live.mjs` | Phase 3S persistent cache smoke harness (owner-run) | `smoke:persistent-quote-cache-live:dry` |
| `scripts/check_server_only_provider_boundaries.mjs` | Server-only boundary check (no live calls) | `check:provider-boundaries` |

---

## 6. Source Files Relevant to Phase 3AA

| File | What It Contains | Why Relevant for Phase 3AA |
|---|---|---|
| `src/pages/api/market/quote.ts` | GET route: parses request, calls `getQuoteSnapshot()`, returns `{ ok, data, fallback }` | Direct target of Phase 3AA HTTP test |
| `src/lib/server/marketData/quotes.ts` | `getQuoteSnapshot()`: cache check → KIS call → cache write → stale fallback | Full quote flow |
| `src/lib/server/marketData/quoteCache.ts` | Cache constants, `Map`-based memory cache, `getConfiguredQuoteCacheBackendName()` | Cache backend selection |
| `src/lib/server/marketData/supabaseQuoteCache.ts` | Supabase persistent cache adapter | Optional if live Supabase cache tested in future |
| `src/lib/server/providers/kisClient.ts` | KIS token + quote fetch; `isProductionRuntime()` guard; `getKisQuoteConfigReadiness()` | Safety gate; core KIS call |
| `src/lib/server/providers/providerEnv.ts` | Provider env registry — all KIS entries `productionAllowed: false` | Guard verification |
| `src/lib/server/providers/serverOnly.ts` | `assertServerRuntime()` — throws if browser context detected | Server boundary enforcement |
| `src/lib/server/providers/providerErrors.ts` | `sanitizeUnknownError()` — never exposes original error | Safe error handling |
| `src/lib/server/providers/types.ts` | `QuoteSnapshot`, `SecurityIdentity`, `ProviderResult`, `FallbackState` types | Contract definitions |
| `package.json` | npm scripts — `smoke:kis-quote-live:dry`, `check:provider-boundaries`, `build` | Available commands |

---

## 7. Files That Must Not Be Modified Without Explicit Owner Approval

| File | Reason |
|---|---|
| `src/lib/server/providers/kisClient.ts` | Contains `isProductionRuntime()` production KIS gate |
| `src/lib/server/marketData/supabaseAdmin.ts` | Supabase admin client — security boundary |
| Migration files in `supabase/migrations/` | Production DB migrations — must not be altered after apply |
| Production SQL pack files in `docs/` | Evidence records of applied migrations |
| Root `README.md` | Owner-managed project documentation |

---

## 8. Validation Commands (Historically Used — All Safe)

| Command | Purpose | When to Run |
|---|---|---|
| `git log --oneline -10` | Show recent commits | Always at new-chat startup |
| `git status --short` | Confirm working tree state | Always at new-chat startup |
| `npm run check:provider-boundaries` | Verify server-only import boundaries | After any source file change |
| `npx tsc --noEmit` | TypeScript type check | After any source file change |
| `npm run build` | Full Astro build | After implementation phases |
| `npm run smoke:kis-quote-live:dry` | KIS quote smoke in dry-run/mock mode (no live calls) | After any harness change |
| `npm run smoke:persistent-quote-cache-live:dry` | Persistent cache smoke in dry-run/mock mode | After any cache harness change |

Commands that must NOT be run by Claude Code:
- `npm run smoke:kis-quote-live:dry` with live guard env vars set — owner-run only
- Any `vercel` CLI command
- Any `supabase` CLI command
- Any SQL execution
- Any live KIS or Supabase API call

---

## 9. Safe Commands Allowed at New-Chat Startup

```powershell
git log --oneline -10
git status --short
```

Then read files listed in Section 6 above.

---

## 10. Expected Read-Back Report Structure

A Claude Code read-back report must include:

```
READ-BACK REPORT
================
Branch: <value>
Latest commit: <hash> <message>
Working tree: clean / dirty (list if dirty)
Latest completed phase: Phase 3Z
Next recommended phase: Phase 3AA
Blocked items confirmed:
  - Production KIS calls: blocked (isProductionRuntime() guard in kisClient.ts:60-64)
  - UI live quote wiring: blocked (not approved)
  - Vercel env mutation: blocked (requires separate approval)
  - Deployment: blocked (gate decision pending)
Files read:
  - docs/planning/planning_changelog.md: found, latest entry = Phase 3Z
  - docs/planning/phase_3z_owner_local_kis_quote_smoke_result_v0.1.md: found
  - docs/planning/new_chat_handoff/CURRENT_STATE.md: found
  - src/lib/server/providers/kisClient.ts: found, isProductionRuntime() at lines 60-64
  - src/lib/server/marketData/quotes.ts: found
  - src/pages/api/market/quote.ts: found
Status: READ-BACK COMPLETE — ready to proceed to Phase 3AA planning
```
