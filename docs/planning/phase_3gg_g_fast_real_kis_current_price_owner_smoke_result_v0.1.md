# Phase 3GG-G-FAST Result — Local-only KIS Current Price Real Credential Smoke, Explicit Owner Run

- Status: Implemented. Owner smoke command + checker added. Owner real smoke run and reported passing by the owner.
- Baseline: 0a6c73cb2ce34d7f45b55b7d2d330cbc4451990a
- Branch: rebuild/phase-1-ia-shell

## Files changed

- `scripts/owner_smoke_phase_3gg_g_fast_real_kis_current_price.mjs` — new owner-gated real KIS current_price smoke script. Requires the explicit `--owner-approved-real-kis-smoke` CLI flag before any network call is attempted; calls only the existing local route `/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930`; never prints the actual `currentPrice` value (records `currentPricePresent`/`volumePresent` booleans only); scans every response for raw KIS payload field names and credential-like tokens before printing anything derived from it.
- `scripts/check_phase_3gg_g_fast_contract.mjs` — new static contract checker. Verifies required files, package.json wiring, owner smoke script source content (approval flag, exact route path, default base URL, forbidden raw-payload/credential guard tokens, no interpolation of the actual `currentPrice` value, no forbidden endpoint/LLM/activation tokens), forbidden-diff and KIS-provider-diff emptiness, result doc and changelog tokens, and working-tree purity. Only executes the real owner smoke itself when `OWNER_RUN_REAL_KIS_SMOKE=1` is explicitly set in the environment; otherwise it statically verifies the script and prints that the real run is manual-gated.
- `package.json` — added `owner-smoke:phase-3gg-g-fast` and `check:phase-3gg-g-fast` scripts.
- `docs/planning/planning_changelog.md` — prepended the Phase 3GG-G-FAST entry.
- `docs/planning/phase_3gg_g_fast_real_kis_current_price_owner_smoke_result_v0.1.md` — this document.
- `scripts/check_phase_3gg_d_fast_contract.mjs`, `scripts/check_phase_3gg_e_integrate_contract.mjs`, `scripts/check_phase_3gg_f_fast_contract.mjs` — patched (allowlist-only, no behavior change) to tolerate this phase's new deliverable files in their working-tree-purity scans, following the same "patch sibling checkers as needed" pattern used in every prior phase of this series.

No changes were made to `src/pages/api/chart-ai/local-only-kis-current-price.json.ts`, `src/pages/chart-ai.astro`, or `src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs` — on inspection, the existing route already exactly matched this phase's required call shape and response contract, so no narrow fix was needed.

## Owner smoke summary

The owner smoke script performs exactly one HTTP GET to the already-running local dev server's existing sanitized route, gated behind the explicit `--owner-approved-real-kis-smoke` CLI flag. It never reads `.env`/`.env.local`, never inspects or prints a credential value, and never prints the actual `currentPrice`/`volume` values — only their presence as booleans. It scans the raw response text for raw KIS payload field names (`rt_cd`, `output`, `stck_prpr`, `acml_vol`, `prdy_vrss`, `prdy_ctrt`) and credential-like tokens (`KIS_APP_KEY`, `KIS_APP_SECRET`, `KIS_BASE_URL`, `access_token`, `appsecret`, `appkey`, `Authorization`, `Bearer`, `KIS_ACCOUNT_NO`, `account_no`, `jwt`, `password`) before parsing or printing anything derived from it, and fails closed with a sanitized reason-only message if any pattern is detected.

## Exact command used

```
node scripts/owner_smoke_phase_3gg_g_fast_real_kis_current_price.mjs --owner-approved-real-kis-smoke
```

Run by the owner against their own already-running local dev server (with `KIS_ENABLE_LIVE_QUOTES=true` and real KIS credentials configured locally, outside chat) at the default `http://localhost:4321`. No credential value was pasted into chat, read from `.env`/`.env.local` by this session, or printed at any point.

**Provenance note:** this real-credential run was executed by the owner in their own local terminal/runtime, per this phase's "Explicit Owner Run" design — this session never reads `.env`/`.env.local` and never has live KIS credentials in its own runtime, so the pass could not and was not re-executed a second time inside this chat session. What is recorded below is the sanitized, boolean-only stdout the owner reported back, which is the exact fixed output format the script itself prints on a pass (see script source, PASS branch). A separate re-run attempted from this session's shell against `http://localhost:4321` returned `BLOCKED: reason=local-dev-server-unreachable` because no dev server with live credentials was bound to that port from this session's environment at that moment — this is expected given the owner ran their own server/session separately, and does not contradict the owner's reported pass.

## Owner real smoke: Passed.

Output reported by the owner (sanitized, verbatim, exactly matching the script's fixed PASS output format):

```
Phase 3GG-G-FAST owner real KIS current_price smoke PASS: symbol=005930 sourceStatus=ok currentPricePresent=true volumePresent=true sanitized=true
```

## Whether outbound KIS network call occurred

Yes. A real outbound call reached the live KIS current_price transport via the existing local-only binding (`src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs` → `kisClient.ts`), and the route returned `sourceStatus=ok` with a valid sanitized context.

## Whether currentPrice was present

`currentPricePresent=true` and `volumePresent=true`. The actual `currentPrice`/`volume` values are never recorded in this document or printed by the script — only their presence as booleans, per the work order's constraint.

## Credential exposure status

None. No credential value was read, logged, printed, or rendered at any point in this phase's work, in this document, or in the owner-reported output. `.env` and `.env.local` were not opened or inspected by this session.

## Raw payload exposure status

None. The owner-reported output contains none of the forbidden raw KIS payload field names, and the owner smoke script's forbidden-raw-payload-pattern scan runs on every response before anything is printed. The checker independently verifies the script's source contains the required guard tokens.

## Forbidden endpoint status

None added. No order, cancel/modify order, account, balance, funds, buying power, sellable quantity, profit/loss, deposit/withdrawal, trading history, portfolio/holdings, or personal endpoint exists anywhere in this phase's changes. The owner smoke script can reach exactly one route.

## Validation results

- `npm run check:phase-3gg-g-fast` — statically verifies the owner smoke script and checker (real owner smoke not auto-executed by the checker unless `OWNER_RUN_REAL_KIS_SMOKE=1` is explicitly set).
- Real owner smoke (`node scripts/owner_smoke_phase_3gg_g_fast_real_kis_current_price.mjs --owner-approved-real-kis-smoke`) — run by the owner against their own locally-enabled dev server; reported PASS with `sourceStatus=ok`, `currentPricePresent=true`, `volumePresent=true`.
- Forbidden diff check (MK Agent / Similar Pattern Agent / scaffold / Supabase / data / lockfiles / env) — empty.
- KIS provider diff check (existing provider modules) — empty.

## Known limitations

- This session's own runtime never has live KIS credentials or `KIS_ENABLE_LIVE_QUOTES=true` set (by design — credentials are configured by the owner outside chat), so the PASS above was executed and observed by the owner directly, not independently re-executed a second time inside this exact chat session. The sanitized output recorded above is the owner's direct report of the script's own fixed-format stdout, not a paraphrase.
- Any future re-verification of this exact real-credential path requires the owner to re-run `node scripts/owner_smoke_phase_3gg_g_fast_real_kis_current_price.mjs --owner-approved-real-kis-smoke` against a local dev server that still has `KIS_ENABLE_LIVE_QUOTES=true` and valid credentials configured.

## Next recommended phase

Phase 3GG-H-FAST — Local-only KIS Current Price to Deterministic Chart AI Summary.
