# PR #1 — Proposed Title & Body — v0.1 (not applied remotely)

The current PR title is the stale final-phase title and the body is empty. Proposed replacement below —
**design only; `PR_METADATA_UPDATE_AUTHORIZED: NO`** this phase. Apply after Owner authorization.

## Proposed title

`MK Stock Lab rebuild → main: Production-verified app + KIS-only instrument-master automation`

## Proposed body

```markdown
## Summary
Brings the full MK Stock Lab rebuild (394 commits) from `rebuild/phase-1-ia-shell` into `main` for the first
time. `main` was never updated during the rebuild — all prior Production deploys were made via the Vercel
CLI from this branch. This PR merges the accumulated app + the latest KIS-only instrument-master automation.

## Scope
- Full rebuild: IA shell, Chart AI (search, real OHLCV chart, Similarity V2, MK Agent V2), Market
  Intelligence backend, Portfolio Intelligence, auth gate, durable KIS token lifecycle, and the data
  foundation (universal search + normalized OHLCV cache).
- Latest phase (HF3B-HF2): KIS-only instrument master (16,018 KIS-supported KR/US stocks & ETFs), KR
  alphanumeric six-character symbol support (`^[0-9A-Z]{6}$`), a deterministic refresh pipeline with
  active/inactive lifecycle + last-known-good safety, and a scheduled GitHub Actions refresh workflow that
  opens/updates one PR (never merges/deploys).

## Production baseline vs this PR
- Production functional baseline: `cbd24eb` (deployed via CLI + Owner-verified).
- Not yet deployed: `030d8fd` (docs), `9d22ff4` (discovery), `aa2e422` (KIS automation + symbol widening +
  the 16,018-row KIS-only master replacing the live 12,826-row master). These need Owner QA after deploy.

## Security & data
- No secrets, no `.env`/`.vercel`, no raw KIS/KRX source files committed. 3 new deps
  (d3-hierarchy, html-to-image, pretendard) consistent with the lockfile; no install lifecycle scripts.
- 6 additive migrations (0 destructive); no workflow/script auto-applies them — merging SQL is inert.
- Server-only 5 MB generated master (never shipped to the browser).

## GitHub Actions
- Adds `kis-instrument-master-refresh.yml`: official actions only, minimal permissions, pushes only the
  automation branch, opens/updates one PR, **never** pushes `main` / force-pushes / merges / auto-merges /
  deploys. Requires "Allow GitHub Actions to create and approve pull requests".

## Tests
- Clean local merge simulation (0 conflicts). `astro build` PASS; full local gate 18/18; `git diff --check`
  clean. (No PR-triggered CI is configured in the repo.)

## Merge risks / required before merge
- ⚠️ **Vercel auto-deploy on `main` is unconfirmed** (no `vercel.json`; governed by the dashboard). Merging
  may deploy the undeployed KIS-only master + symbol widening to Production. Confirm/pause before merge.
- Update this title/body (done). Optional: one-byte NUL cleanup in a checker.

## Explicit gates
- **Do not auto-merge.** Merge requires explicit Owner authorization.
- **Do not deploy to Production on merge without separate authorization + Owner QA** of the KIS-only master
  and alphanumeric KR ETF charting.

## Rollback
- Revert the merge commit; Vercel rollback to last-known-good; KIS master last-known-good restore; disable
  the refresh workflow. Applied Supabase migrations are not reverted by a source revert (all are additive).
```
