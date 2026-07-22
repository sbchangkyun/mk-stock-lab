# KIS Instrument-Master Refresh — Runbook v0.1

Operational runbook for the KIS-only instrument-master refresh (Phase 3GG-T-HF3B-HF2). KIS-only sources;
no KRX/data.go.kr/Nasdaq-Trader. No credentials, no KIS REST/market/trading API, no OAuth.

## 1. Official public KIS source files

| Family | URL | Extracted |
|---|---|---|
| KR KOSPI | `https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip` | `kospi_code.mst` |
| KR KOSDAQ | `https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip` | `kosdaq_code.mst` |
| US NASDAQ | `https://new.real.download.dws.co.kr/common/master/nasmst.cod.zip` | `nasmst.cod` |
| US NYSE | `https://new.real.download.dws.co.kr/common/master/nysmst.cod.zip` | `nysmst.cod` |
| US AMEX | `https://new.real.download.dws.co.kr/common/master/amsmst.cod.zip` | `amsmst.cod` |

Classification: KR security-group `ST`=stock / `EF`=ETF (EN/RT excluded); US security-type `2`=stock /
`3`=ETF; exchange `NAS`/`NYS`/`AMS` → NASDAQ/NYSE/AMEX. KR codes are six-character `^[0-9A-Z]{6}$`.

## 2. Manual (Mode 0) refresh

```
# 1. download + extract the five source files into a scratch dir (browser or curl; not committed)
# 2. regenerate the master from those files:
node scripts/generate_chart_ai_instrument_master.mjs \
  --kospi-source <scratch>/kospi_code.mst --kosdaq-source <scratch>/kosdaq_code.mst \
  --nasdaq-source <scratch>/nasmst.cod --nyse-source <scratch>/nysmst.cod --amex-source <scratch>/amsmst.cod \
  --source-date <YYYY-MM-DD> --retrieved <YYYY-MM-DD>
# 3. validate + review, then commit the four data artifacts.
```

Or run the full pipeline against pre-downloaded files:
```
node scripts/automation/refresh_kis_instrument_master.mjs --report-only --source-dir <scratch> --output-report <scratch>/report.json
node scripts/automation/refresh_kis_instrument_master.mjs --apply --source-dir <scratch>   # writes tracked files if gates pass
```

## 3. Scheduled (Modes 1–2) refresh via GitHub Actions

- Workflow: `.github/workflows/kis-instrument-master-refresh.yml`.
- Schedules (UTC): KR `17 13 * * 1-5`, US `23 2 * * 2-6`, weekly full `41 13 * * 6`. Manual
  `workflow_dispatch` (default report-only).
- Scheduled runs execute the pipeline `--apply` on the persistent branch
  `automation/kis-instrument-master-refresh`, commit only the four generated data artifacts, push that
  branch, and open/update **one** PR to the default branch. Never merges/deploys.

### Prerequisite (one-time, owner)

Scheduled Actions run from the workflow file **on the default branch**. This workflow only fires after the
Phase 3GG-T-HF3B-HF2 PR is **merged to `main`**. Also enable **Settings → Actions → General → Workflow
permissions → "Allow GitHub Actions to create and approve pull requests."**

## 4. Safety gates (block ⇒ preserve last-known-good, fail run, upload diagnostics)

Source unavailable/empty/schema-changed; empty category; duplicate identity; KR shape/leading-zero damage;
anchor disappearance; total drop > 5% / growth > 25%; KR ETF drop > 1% or ≥ 10; > 20 KR stock / > 10 KR
ETF / > 100 US removals; > 20 type changes. A blocked run makes **no tracked write, no commit, no PR
update, no deploy**.

## 5. Lifecycle & archive

Two-consecutive-valid-snapshot absence policy (1st → pending & kept active; 2nd → archived). Archive
retention is **indefinite**. Rename keeps the prior name as an alias. Code changes / mergers are never
auto-linked (archive old + add new; human review).

## 6. Rollback / incident

- A bad refresh PR: **do not merge** (Production is unaffected until merge + a separate deploy). Close the
  PR; the automation branch and tracked files retain last-known-good.
- If a gate false-positives on a legitimate large change, run `--report-only` locally to inspect the diff
  report, then decide (never auto-relax thresholds).

## 7. What is never done automatically

Merge, auto-merge, Production/Preview deploy, DB/env/Supabase/secret change, KIS REST/market/trading call,
KIS OAuth issuance, default-branch push, force-push, raw-source-file commit, token printing.
