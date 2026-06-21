# Next Task Prompt — Phase 3AA

Copy this section and pass it to the next Claude Code session (or use it as ChatGPT's first instruction to Claude Code).

---

## Instruction

You are continuing the **mk-stock-lab** project. The previous Claude Code session completed Phase 3Z (recording the owner manual local live KIS quote smoke result). The current next recommended phase is **Phase 3AA**.

**Before doing anything else**, you must perform a read-back of the repository state.

---

## Required Read-Back Before Phase 3AA

Run the following in order and report the results:

1. `git log --oneline -10` — show recent commits.
2. `git status --short` — confirm working tree is clean.
3. Read `docs/planning/planning_changelog.md` — confirm the latest entry is Phase 3Z.
4. Read `docs/planning/phase_3z_owner_local_kis_quote_smoke_result_v0.1.md` — confirm what Phase 3Z validated.
5. Read `docs/planning/new_chat_handoff/CURRENT_STATE.md` — review operational state.
6. Read `src/lib/server/providers/kisClient.ts` lines 1–100 — confirm `isProductionRuntime()` guard location and logic.
7. Read `src/lib/server/marketData/quotes.ts` — confirm `getQuoteSnapshot()` flow.
8. Read `src/pages/api/market/quote.ts` — confirm route request/response shape.

After reading these files, produce a **read-back report** with:

- Branch name
- Latest commit hash and message
- Working tree state (clean/dirty)
- Latest completed phase
- Next recommended phase
- Confirmed blocked items (production KIS calls, UI wiring, Vercel mutation, deployment)
- List of files read and whether each was found at the expected location

**Do not begin Phase 3AA planning or implementation until the read-back report is complete.**

---

## Phase 3AA Direction

After the read-back is confirmed, begin **Phase 3AA: Local `/api/market/quote` HTTP Endpoint Verification**.

Phase 3AA objective: verify that the complete Astro server-side quote route responds correctly with live KIS backing in a local non-production dev-server environment.

### Phase 3AA approach:

Phase 3AA should either:

**Option A (planning-only)**: Produce a documentation-only local endpoint verification plan that defines the owner-run procedure, required env vars, expected request, expected response shape checklist, and safety gates.

**Option B (harness)**: Implement a lightweight fail-closed owner-run local HTTP smoke script (`scripts/owner_smoke_api_quote_live.mjs`) that:
- Requires explicit approval guard env vars (fail-closed, default dry-run)
- Starts a background Astro dev server or makes an HTTP request to a locally running server
- Sends `GET http://localhost:4321/api/market/quote?market=KR&symbol=XXXXXX`
- Records only sanitized response-shape evidence (field presence, no actual price values)
- Validates `ok: true`, presence of `data` object with required public fields, absence of raw KIS fields
- Validates `Cache-Control: no-store` header
- Does not print price values, raw KIS fields, tokens, keys, account data, raw errors, or stack traces

**Which option to pursue**: Start with a planning-only document (Option A) to define the procedure, then ask owner for approval before implementing any harness (Option B).

### Phase 3AA hard constraints:

- Do not run live KIS calls from Claude Code directly.
- Do not call KIS OAuth/token endpoint.
- Do not call KIS quote endpoint.
- Do not run live Supabase query/write.
- Do not execute SQL.
- Do not use Supabase MCP database tools.
- Do not list Supabase projects.
- Do not touch production DB.
- Do not read ignored `.env*` files.
- Do not read, print, infer, or record secret values.
- Do not mutate Vercel environment values.
- Do not use Vercel CLI.
- Do not deploy.
- Do not change `kisClient.ts` production KIS guard.
- Do not allow production KIS calls.
- Do not implement UI live quote wiring.
- Do not connect Market, Portfolio, Chart AI, Home, Lab, or any browser UI to live quote data.
- Do not implement account, order, trading, balance, holdings, or WebSocket APIs.
- Do not expose price values, raw KIS fields, tokens, keys, account data, raw errors, or stack traces.
- Do not modify root `README.md`, migration files, or production SQL pack files.
- Do not record project refs, Vercel project IDs, Supabase URLs, KIS app keys, KIS app secrets, tokens, account numbers, connection strings, DB passwords, service-role keys, anon keys, JWT secrets, screenshots, raw errors, stack traces, price values, or secret-bearing output.

### Phase 3AA success criteria:

- Owner-run local Astro dev-server confirms `GET /api/market/quote?market=KR&symbol=XXXXXX` returns `{ ok: true, data: <QuoteSnapshot>, fallback: <FallbackState> }` with `Cache-Control: no-store`.
- No raw KIS fields in the response (`stck_prpr`, `prdy_vrss`, `prdy_ctrt`, `acml_vol`, `rt_cd`, `output`).
- No token, key, account data, raw errors, or stack traces in the response.
- Response field presence confirmed (sanitized shape only — no actual price value recorded).

### Phase 3AA does not include:

- Supabase persistent cache integration test with live KIS quote.
- Vercel Preview or Production gate changes.
- UI wiring.
- Gate decision (Option A/B/C from Phase 3X) — that is a separate owner approval step.

---

## English-Only Rule

All agent output, documentation, commit messages, code comments, plan text, and progress updates must be English only. Korean may appear only in approved owner-review checklist blocks.
