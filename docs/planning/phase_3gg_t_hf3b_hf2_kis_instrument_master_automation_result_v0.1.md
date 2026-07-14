# Phase 3GG-T-HF3B-HF2 — KIS Instrument-Master Automation — Result v0.1

## 1. Executive classification

**`IMPLEMENTED_PUSHED_PR_OPEN_OWNER_REVIEW_PENDING`** (target after merge + QA:
`PASS_KIS_INSTRUMENT_MASTER_AUTOMATION_PRODUCTION_VERIFIED`).

Implements the approved KIS-only instrument-master expansion, KR alphanumeric six-character symbol
support, a deterministic scheduled refresh pipeline with active/inactive lifecycle tracking and
last-known-good safety, and a GitHub Actions workflow that opens/updates a single PR against the default
branch. **No merge, no deploy, no DB/env/Supabase/secret change** in this run.

## 2. Baseline

- Branch `rebuild/phase-1-ia-shell`; starting HEAD `9d22ff4`; implementation commit created this phase.
- Default branch `main` (`origin/HEAD` → `main`). `gh` CLI is not installed in this environment.

## 3. Locked product & data policy (as built)

- **KIS-only.** The master is built exclusively from official public KIS master files. No KRX Open API,
  KRX Data Marketplace, KRX OTP, data.go.kr, or Nasdaq-Trader source in the pipeline or its blocking
  contract. Terminology throughout: **KIS-supported** KR/US stocks & ETFs — **not** "all KRX-listed" or
  "all US-listed".
- **Classification is KIS field-based only** (never product name / brand / ticker shape):
  - KR domestic security-group code: `ST` = stock, `EF` = ETF. `EN` (ETN), `RT` (REIT), and other groups
    are excluded from the active master.
  - US overseas security-type: `2` = stock, `3` = ETF. Exchanges `NAS`/`NYS`/`AMS` → NASDAQ/NYSE/AMEX;
    other exchanges/types excluded. (The KIS overseas type field has no separate ETN code; it classifies
    each record as stock or ETF, and we follow that authoritative field.)

## 4. Generated universe (implementation-time KIS snapshot, as-of 2026-07-14)

| Category | Count |
|---|---|
| KR stock (KOSPI + KOSDAQ) | 2,718 |
| KR ETF (KIS `EF`) | 1,151 (868 numeric + **283 alphanumeric**) |
| US stock (NASDAQ/NYSE/AMEX) | 6,210 |
| US ETF (NASDAQ/NYSE/AMEX) | 5,939 |
| **Grand total** | **16,018** |

- By exchange: KOSPI 2,065, KOSDAQ 1,804, NASDAQ 5,197, NYSE 2,419, AMEX 4,533.
- Rejected: unsupported-security-group 513 (KR EN/RT/…), duplicate-country-symbol 3, invalid-symbol-shape
  461 (US tickers not matching the KIS overseas ticker contract).
- Counts are the **KIS-supported** subset at snapshot time — not exchange-wide listing totals, and not
  hardcoded as a permanent contract (masterVersion `hf3b-hf2-kis-16018`).
- All seven verified KR ETF anchors present and classified `etf`; alphanumeric ETF codes (e.g. `0000D0`)
  pass the full application contract.

## 5. KR symbol widening (`^[0-9A-Z]{6}$`)

Updated paths (uppercase-normalized, leading zeros preserved, whitespace/punctuation rejected):
`src/lib/market-data/instrument.ts` (`KR_SYMBOL_PATTERN` + `isKrSymbol`), `kisClient.ts`
(`normalizeKrSymbol` uppercases + `isValidKrQuoteSymbol` widened — gates both the domestic OHLC chart
path and the quote path), `local-only-live-kis-market-data-binding.mjs`, the local-only KIS summary route,
and the KIS-only generator/source adapter. The universal search resolver already uppercases input.
Canonical identity `country|symbol|exchange|instrumentType` unchanged. Validation: an alphanumeric KR ETF
(`0000D0`) resolves via `findUniversalInstrument` (both cases), is `kis-domestic` mappable, and flows
through the search/similarity/MK identity path (smoke §16.6).

## 6. Refresh pipeline (`scripts/automation/refresh_kis_instrument_master.mjs`)

- Modes: `--validate-only`, `--report-only`, `--write-candidate`, `--apply`, `--full-reconcile`,
  `--scratch-dir`, `--source-dir` (offline), `--output-report`. Default never overwrites tracked files.
- Stages: fetch (download official KIS zips, dependency-free single-file inflate) → source integrity
  (status/size/schema/hash) → parse+normalize (KIS field-based) → build candidate → diff vs current
  master/archive/state → lifecycle classification → Safety Gates → artifacts → transactional apply
  (candidate built in scratch, tracked files written only when all gates pass with `--apply`).
- **Missing policy (two consecutive valid snapshots):** 1st absence → `pending_inactive`, `missingCount=1`,
  **kept active**; 2nd consecutive absence → removed from active + archived
  (`SOURCE_ABSENT_TWO_CONSECUTIVE_VALID_SNAPSHOTS`), `missingCount=2`. Reappearance resets; archived
  reappearance → `REACTIVATED`. Missing counters never increment when a source is unavailable/stale/
  schema-broken or gates fail.
- **Rename** preserves the prior name as an alias. **Code changes / mergers are never auto-linked** — the
  old identity is archived and the new one added separately (human review for linkage).

## 7. Safety Gates

Immediate blockers: source unavailable/empty/schema-changed, empty required category, duplicate canonical
identity, KR symbol shape / leading-zero damage, verified anchor disappearance. Quantity blockers
(baseline = last-known-good): total drop > 5%, total growth > 25%, KR ETF drop > 1% or ≥ 10, > 20 KR stock
removals, > 10 KR ETF removals, > 100 combined US removals, > 20 type changes. Thresholds are per-axis and
never auto-relaxed. On any block: preserve last-known-good tracked files, write diagnostics, exit non-zero
(the CI job fails and uploads safe artifacts); no commit, no PR update, no deploy. Validated by the smoke
(§16.4) and the discovery simulator.

## 8. Active / inactive archive

`universalInstrumentMaster.archive.json` (retention **INDEFINITE**): canonical identity, prior
names/symbol/exchange, type, standard code, first-seen/last-active/inactive dates, inactive reason,
successor identity (only when verified), source version. Excluded from ordinary search; not exposed in the
initial browser payload; available for legacy URL/snapshot resolution with an inactive notice.
`universalInstrumentMaster.refreshState.json` tracks per-symbol `missingCounts` + `pendingInactive` +
last-known-good version.

## 9. GitHub Actions workflow (`.github/workflows/kis-instrument-master-refresh.yml`)

- Schedules (UTC; avoid top-of-hour): KR `17 13 * * 1-5` (22:17 KST Mon–Fri), US `23 2 * * 2-6`
  (11:23 KST Tue–Sat), weekly full reconcile `41 13 * * 6` (22:41 KST Sat). Plus `workflow_dispatch`
  (scope/fullReconcile/reportOnly; manual default **report-only**).
- Permissions: `contents: write`, `pull-requests: write`, `actions: read` (no admin). Concurrency group
  `kis-instrument-master-refresh`, `cancel-in-progress: false`.
- Persistent automation branch `automation/kis-instrument-master-refresh`: checks out default branch,
  creates/reuses the automation branch, integrates the default branch (fails on conflict), runs the
  pipeline `--apply`, validates content offline, commits **only** the four generated data artifacts,
  pushes **only** the automation branch (never default, never force), and opens **one** PR or updates the
  existing one via `gh`. **Never merges, never enables auto-merge, never deploys.** Safe diagnostics are
  uploaded on failure (7-day retention). The token is never printed.
- **Default-branch requirement:** scheduled workflows run from the workflow file on the default branch, so
  this workflow only fires once the PR is merged to `main` (see the runbook).

## 10. Files changed

Symbol widening: `instrument.ts`, `kisClient.ts`, `local-only-live-kis-market-data-binding.mjs`,
`local-only-kis-llm-summary.json.ts`. Lane A: `generate_chart_ai_instrument_master.mjs` (rewritten
KIS-only), `scripts/lib/kisInstrumentMasterSource.mjs` (new), regenerated
`universalInstrumentMaster.json` + `.manifest.json`, new `.archive.json` + `.refreshState.json`. Lane B:
`scripts/automation/refresh_kis_instrument_master.mjs` (new). Workflow:
`.github/workflows/kis-instrument-master-refresh.yml` (new). Tests: `smoke_phase_3gg_t_hf3b_hf2_kis_automation.mjs`,
`check_phase_3gg_t_hf3b_hf2_contract.mjs` (new). Docs: this file + the runbook + changelog. `package.json`
(scripts only). Narrow sibling reconciliation: HF3B-HF4C + OP-FAST checkers/smokes (KIS-only US exchange
labels, widened KR symbol, KIS-only generator).

## 11. Test results

- `smoke:phase-3gg-t-hf3b-hf2` — 53/53 (KR/US parser, symbol, lifecycle, safety gate, runtime regression
  incl. alphanumeric KR ETF fixture).
- `check:phase-3gg-t-hf3b-hf2` — PASS (KIS-only master/manifest, symbol widening, pipeline + workflow
  contract, preservation, no dependency change).
- Regression: HF3B-HF4C, HF5-HF6AB, HF4-FAST-HF2, HF3A, OP-FAST, discovery, durable-token/bridge checkers,
  `npx astro build`, `git diff --check` — see §12.

## 12. Regression + reconciliation

Sibling checkers reconciled narrowly for the KIS-only + widened-symbol reality (US exchange labels
NASDAQ/NYSE/AMEX; KR symbol `^[0-9A-Z]{6}$`; KIS-only generator) while preserving all security/auth/
identity/pagination/no-fabrication protections. Documented per file.

## 13. Git result

- Implementation commit: `Phase 3GG-T-HF3B-HF2: automate KIS instrument master refresh`.
- Feature branch `rebuild/phase-1-ia-shell` pushed to origin. No default-branch push, no force-push.

## 14. Pull request

- PR targeting `main` from `rebuild/phase-1-ia-shell`. (See the Owner checkpoint for number/URL, or the
  reported blocker if PR creation was unavailable.) **Not merged; no auto-merge; no deploy.**

## 15. Owner review procedure & rollback

- Review the PR diff (data artifacts + code). Rollback = do not merge (Production is unaffected until
  merge + a separate deploy). After merge, a bad refresh PR can be closed; the automation branch retains
  last-known-good.

## 16. Required repository setting

For the scheduled workflow to open PRs with `GITHUB_TOKEN`, enable **Settings → Actions → General →
Workflow permissions → "Allow GitHub Actions to create and approve pull requests."** If disabled, the
workflow fails safely and reports the exact setting required (no PAT workaround).

## 17. Pending owner authorizations

Pull-request merge; Production deployment after merge; initial workflow execution/observation. Requested
separately — not performed in this run.
