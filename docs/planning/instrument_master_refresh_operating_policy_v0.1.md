# Instrument-Master Refresh Operating Policy — v0.1 (proposed)

Companion to `phase_3gg_t_hf3b_hf1_kr_etf_master_refresh_discovery_result_v0.1.md`. **Proposed** policy —
nothing here is implemented or deployed. No workflow was created; no push.

## 1. Why a refresh is required (not one-time static generation)

Listings change continuously: new ETF/stock listings, delistings, renames, mergers, symbol/standard-code
changes, and market transfers occur on business days. A static master silently drifts stale — missing new
instruments and offering delisted ones. Evidence: Nasdaq Trader files are "updated periodically through-out
each day" [SRC]; the KIS master is regenerated daily (observed mtime `2026-07-14T11:00:06Z`) [FACT]; 283
alphanumeric KR ETF codes show KRX is actively issuing beyond the numeric space [FACT].

## 2. Cadence options (scored 1–5, higher better)

| Option | Freshness | Op. simplicity | Failure risk | Cost | Source-limit fit | False-deletion risk | Recovery | Total |
|---|---|---|---|---|---|---|---|---|
| A daily full (KR+US) | 5 | 3 | 3 | 3 | 3 | 3 | 4 | 24 |
| **B daily diff + weekly full** | **5** | **4** | **4** | **4** | **4** | **4** | **5** | **30** |
| C weekly only | 2 | 5 | 4 | 5 | 5 | 4 | 4 | 29 |
| D manual/event only | 2 | 5 | 5 | 5 | 5 | 5 | 5 | 32* |

\* D scores high on safety but fails the product goal (coverage drifts without discipline); it is the
**fallback**, not the primary. **Recommendation: B** (daily diff + weekly full reconciliation) with D as the
manual `workflow_dispatch` fallback.

## 3. Proposed schedule (UTC cron; avoid minute 00 due to top-of-hour delays [SRC])

| Job | Cron (UTC) | Local | Rationale |
|---|---|---|---|
| KR daily diff | `17 12 * * 1-5` | 21:17 KST | after KIS evening master snapshot |
| US daily diff | `23 22 * * 1-5` | 07:23 KST / 18:23 ET | after US session + Nasdaq directory settle (key off `File Creation Time` trailer) |
| Weekly full reconciliation | `41 13 * * 6` | Sat 22:41 KST | full rebuild + archive sweep on the weekend |
| Manual | `workflow_dispatch` | any | fallback / re-run |

GitHub Actions cron is UTC [SRC]; use the IANA-timezone cron field (`Asia/Seoul`) if available, else keep
UTC (KST = UTC+9, no DST). Add `concurrency: { group: master-refresh, cancel-in-progress: false }`.

## 4. Pipeline stages

Fetch → Verify (HTTP/type/min-size/hash/schema/as-of/stale) → Normalize (NFKC, preserve leading zeros AND
alphanumeric 6-char codes, exchange map, KIS group-code type, canonical identity) → Compare (diff vs last
active) → Validate (uniqueness, non-empty categories, counts, mapping rate, anchors, search+chart-map smoke)
→ Artifacts (candidate master, manifest, diff report, archive update, rejected rows, hashes) → Review.

## 5. Blocking rules (per-axis thresholds — NOT a blanket ±3%)

| Rule | Default | Action on trip |
|---|---|---|
| source unavailable / stale / schema-changed | — | BLOCK, keep last-known-good |
| any required category empty | 0 | BLOCK |
| duplicate canonical identity | 0 | BLOCK |
| KR code shape damaged (not `^[0-9A-Z]{6}$`) | — | BLOCK |
| total count drop | > 5% | BLOCK |
| total count growth | > 25% | BLOCK (schema/dup suspicion) |
| removals per refresh | > 50 | BLOCK |
| ETF-category drop | > 5% | BLOCK |
| provider-mapping rate | < 95% | BLOCK |
| verified anchors missing | any | BLOCK |

On any BLOCK: preserve the last-known-good master, upload diagnostic artifacts, fail the workflow, **never**
auto-merge. (Implemented + unit-tested in `simulate_instrument_master_refresh.mjs`, 19/19.)

## 6. Active vs inactive archive

- **Active master**: searchable + provider-supported (current behavior).
- **Inactive archive** (compact): delisted/merged/renamed/code-changed records with canonical identity,
  prior names/symbol/exchange, type, first-seen, last-active, inactive reason, verified successor, source
  version/refs. Preserve **indefinitely**; exclude from ordinary search; allow legacy URL/snapshot resolution
  with an "inactive" notice. Never auto-redirect a code to a different instrument without verified ISIN/
  corporate-action continuity.

## 7. Operating modes & adoption sequence

| Mode | Behavior | Recommended? |
|---|---|---|
| 0 manual | owner/local run + manual commit | **now** |
| 1 scheduled report-only | workflow validates + uploads candidate/diff artifacts; no repo change | **first remote step** |
| 2 scheduled auto-PR | workflow opens/updates one PR; owner merges; **no auto-deploy** | **after Mode 1 is clean** |
| 3 low-risk auto-merge | only small validated diffs, ≥ 4-week observation, branch protection + tests | later, optional |
| 4 auto Production deploy | — | **not recommended initially** |

## 8. No-push / default-branch constraint

A scheduled Action runs only from the workflow file **on the default branch `main`** [SRC]. The current
work is on an **unpushed feature branch**, so Modes 1–3 require the owner to push/merge the workflow to
`main` first. Until then only **Mode 0** is possible.
