# Phase 3GG-T-HF3B-HF1 — KR ETF Coverage & Master-Refresh Discovery — Result v0.1

> Evidence tags used throughout: **[FACT]** observed/measured locally · **[SRC]** official source statement ·
> **[TEST]** behavior I tested from this environment · **[INFER]** engineering inference · **[REC]** recommendation ·
> **[OPEN]** unresolved / owner-dependent. This is a **discovery-only** phase: no Production master change,
> no deploy, no workflow created, no push.

## 1. Executive Classification

**`PASS_KR_ETF_AND_MASTER_REFRESH_DISCOVERY_COMPLETE_OWNER_INPUT_REQUIRED`**

Architecture, parsing tooling, exact-count method, mapping method, cadence, and pipeline design are
complete and validated locally. Proceeding to implementation requires specific **owner inputs** (a
browser-downloaded authoritative KRX ETF file **or** a KRX/data.go.kr API key, a data-use/terms
confirmation, a GitHub default-branch/push decision, and approval of a KR symbol-shape widening). No
hard technical blocker remains; the gating items are owner decisions and one legal review.

## 2. Baseline

- Branch `rebuild/phase-1-ia-shell`; starting HEAD `030d8fd` (verified). **[FACT]**
- Default branch `main`; the current feature branch exists on `origin` but local is **ahead/unpushed**. **[FACT]**
- Existing scheduled workflow `.github/workflows/scrape.yml` (Seibro scraper, `cron: '0 0 * * *'` = KST 09:00,
  `workflow_dispatch`, Supabase secrets) proves GitHub Actions is enabled on the repo. **[FACT]**
- Production master `universalInstrumentMaster.json` masterVersion `hf3b-12826` (12,826 rows). Untouched. **[FACT]**

## 3. Current Seven-Anchor Limitation

The live master's KR ETF category is exactly the 7 curated anchors (069500, 102110, 114800, 229200,
360750, 133690, 379800), all verified present as `EF` in the official KIS master. **[FACT]** HF3B could
not expand KR ETFs because its KR source (KRX KIND corp-list) enumerates listed *companies* only.

## 4. Official-Source Inventory

| Source | What it provides | Auto-retrievable here? | Access needs |
|---|---|---|---|
| **KIS public KOSPI master** `new.real.download.dws.co.kr/common/master/kospi_code.mst.zip` | All KOSPI-market securities incl. ETFs with a **security-group field** (EF/EN/RT/ST/…) + ISIN + Korean name | **YES** (HTTP 200) **[TEST]** | none (public file) |
| **KRX Data Marketplace** `data.krx.co.kr` (ETF 전종목 기본정보/시세) | KRX-authoritative ETF membership + base index | **NO** from automation — WAF returns `400 "LOGOUT"` on `getJsonData.cmd`; OTP `download.cmd` returns `200` with **0 bytes** **[TEST]** | credential-free **in a browser**; blocked for scripts |
| **KRX Open API** `openapi.krx.co.kr` | ETF services (basic info, daily) | not attempted (key not authorized) | **account + AUTH_KEY + per-service approval**; ToS restricts re-providing data to third parties **[SRC]** |
| **data.go.kr** `금융위원회_KRX상장종목정보` (gov open-data) | Government-sanctioned KRX listed-instrument info | not attempted (key not authorized) | data.go.kr account + API key (open-data terms, generally permissive) **[SRC]** |
| **Nasdaq Trader Symbol Directory** `nasdaqlisted.txt`/`otherlisted.txt` | US listing + ETF flag + exchange | **YES** (already used by HF3B) | none |

## 5. Exact Latest-Available Active KR ETF Count

Because the KRX bulk endpoints are automation-blocked here, the **retrievable-now authoritative count**
is taken from the official **KIS KOSPI master security-group field (`EF`)** — a field-based classification,
not a name substring:

- **1,151 active ETFs (group `EF`)** in the KIS KOSPI master. **[FACT/TEST]**
  - 868 with numeric 6-digit KRX codes; **283 with alphanumeric 6-char KRX codes** (e.g. `0000D0`). **[FACT]**
  - Unique codes: 1,151 (0 duplicates). All match `^[0-9A-Z]{6}$`. **[FACT]**
- Companion groups (same master, same field): ETN `EN` = 385, REIT `RT` = 23, stock `ST` = 917,
  BC = 71, others (SW/SR/PF/IF/MF/DR/FS) = 16; total records 2,562. **[FACT]**
- KOSDAQ master (`kosdaq_code.mst`) contains **0 `EF`** — all Korean ETFs list on the KOSPI market file. **[FACT]**

The **definitive KRX-published ETF count** (for a membership cross-check) is classified **OWNER_SOURCE_FILE_REQUIRED**:
the owner downloads the ETF list from data.krx.co.kr in a browser (no account) and runs
`scripts/discovery/parse_krx_etf_master.mjs`. **[REC]** I did **not** substitute a marketing/approximate
figure; 1,151 is the measured official-KIS figure. **[OPEN]** KRX may classify a small number of
`EF` products differently (e.g. certain active/synthetic ETFs) — the owner file resolves this.

## 6. Source As-Of & Hash

- `kospi_code.mst.zip`: retrieved 2026-07-14; server mtime `2026-07-14T11:00:06Z`; SHA-256 `178d89210dbda5be…`; 117,940 bytes. **[FACT]**
- `kospi_code.mst` (unzipped): SHA-256 `dd15d6be3237efff…`; 740,418 bytes; 2,562 records. **[FACT]**
- Raw files kept in scratch `C:\Users\kkama\AppData\Local\Temp\mk-stock-lab-kr-etf-discovery` — **not committed**. **[FACT]**

## 7. ETF / ETN / Other-Product Classification Method

The official KIS master's **증권그룹구분코드 (security group code)** — the first 2 chars of the fixed
228-byte record tail per `koreainvestment/open-trading-api/stocks_info/kis_kospi_code_mst.py` **[SRC]** —
is a field-based classifier: **EF = ETF, EN = ETN, EW = ELW, RT = REIT, ST = stock, …**. This is exactly
how ETF/ETN/ELW/trusts should be distinguished **without any name-based guessing** (never KODEX/TIGER
branding, ticker shape, or the coarse `ETP` flag alone, which does not separate ETF from ETN). **[REC]**
KRX's own ETF dataset remains the membership authority; KIS provides the field-based type + chart mapping. **[INFER]**

## 8. KRX→KIS Mapping Count & Percentage

By construction, the ETF universe derived here comes from the KIS master itself, so **100% (1,151/1,151)
of these ETFs are KIS-mappable** — each carries a KIS short code + ISIN and is addressable on the existing
KIS **domestic daily OHLC** transport. **[FACT]** The true KRX-authoritative → KIS mapping rate (official
KRX list ∩ KIS `EF`) is measured by `compare_krx_etf_to_kis_master.mjs` once the owner supplies the KRX
file; the tool reports mapped/unmapped/percentage + name/standard-code mismatches. **[REC]** Expected
mapping rate is very high (both are KRX-sourced), with any gap being brand-new listings not yet in one
snapshot. **[INFER]**

## 9. Unmapped & Mismatch Analysis

- **[FACT]** 283 of the 1,151 ETFs use **alphanumeric** KRX codes → they would be **rejected by the current
  master's KR symbol rule `^\d{6}$`** (`instrument.ts` `KR_SYMBOL_PATTERN`, HF3B generator, search module).
  This is the single most important implementation finding: the KR symbol contract must widen to
  `^[0-9A-Z]{6}$` to admit modern KRX codes. KIS domestic OHLC accepts the 6-char code regardless. **[INFER]**
- **[OPEN]** Name-mismatch / standard-code-mismatch / KIS-not-in-KRX / likely-ETN-excluded counts are
  produced by the comparator against the owner KRX file (not yet available).

## 10. Current-Master Impact

Adopting the full KIS `EF` set (illustrative projection; **not applied**): **[FACT]**
- KR ETF: 7 → **1,151** (+1,144); KR instruments: 2,608 → **3,752**; grand total: 12,826 → **13,970** (+1,144).
- Master file size ≈ 3.64 MB → ≈ **3.96 MB** (server-only; well within bundle limits). **[INFER]**
- Search remains a bounded, offset-paginated linear scan over ~14k rows → negligible perf change; existing
  pagination (default 20 / max 50) stays sufficient. **[INFER]**
- Canonical identity `country|symbol|exchange|assetType` is unchanged in shape, but the **KR symbol
  alphabet** must widen (§9). No hidden-default assumption changes. **[INFER]**

## 11. Listing-Lifecycle Model

Modeled and unit-tested in `simulate_instrument_master_refresh.mjs`. Event types + handling:

| Event | Detection source | Active search | Chart load | Archive | Human review |
|---|---|---|---|---|---|
| NEW_LISTING | code in new snapshot, not prev | show after validation | enabled | — | none (small batches) |
| DELISTING_ANNOUNCED / TRADING_SUSPENDED / LIQUIDATION_TRADING | KIS trading-status fields | show with notice | enabled w/ warning | — | none |
| DELISTED | code gone from snapshot | remove from search | disabled | **archive (preserve identity)** | if > threshold |
| RENAMED | same code, name change | update name | enabled | keep prior name | spot-check |
| SYMBOL_CHANGED / STANDARD_CODE_CHANGED | **ISIN continuity** across code change | map new code | enabled | link successor | **required** |
| MERGED | corporate action feed | remove absorbed | disabled | link successor | **required** |
| MARKET_TRANSFERRED | exchange field change | update exchange | enabled | — | spot-check |
| INSTRUMENT_TYPE_CORRECTED | group-code change (EF↔EN etc.) | reclassify | enabled | — | spot-check |
| PROVIDER_MAPPING_ADDED/REMOVED | KIS master presence | toggle loadable | toggle | — | if removal |
| REACTIVATED | archived code reappears | restore | enabled | move to active | spot-check |

**[REC]** Never auto-redirect an old code to a *different* instrument without a **verified ISIN/corporate-action
mapping** — the simulator only asserts SYMBOL_CHANGED when the ISIN is continuous.

## 12. Active / Archive Policy

Two concepts (designed, not implemented): **active master** (searchable + provider-supported) and a
compact **inactive archive** (delisted/merged/renamed/code-changed) with fields: canonical identity,
prior names/symbol/exchange, type, first-seen, last-active, inactive reason, verified successor identity,
source version/refs. **[REC]** Preserve inactive identities **indefinitely** in a compact archive
(URL/snapshot resolution shows an "inactive" notice); exclude them from ordinary search. Storage impact is
tiny (a few hundred rows/yr). **[INFER]**

## 13. Source-Update Observations

- **US (Nasdaq Trader):** "updated periodically through-out each day"; each file ends with a
  `File Creation Time: mmddyyyyhhmm` trailer. **[SRC]** → key the refresh off that trailer timestamp, not a
  fixed clock. Exchange codes A/N/P/Z/V and the ETF Y/N flag confirm HF3B's US mapping. **[SRC]**
- **KR (KIS master):** the `kospi_code.mst.zip` mtime was `2026-07-14T11:00:06Z` (≈20:00 KST) and reflects
  the latest listing snapshot; regenerated daily by KIS. **[FACT]**
- **KR (KRX):** ETF membership updates on new-listing/delisting effective dates (business days). **[INFER]**

## 14. Recommended Daily / Weekly Cadence

**[REC]** Option **B — daily diff + weekly full reconciliation** (scored highest on freshness vs. false-deletion
risk vs. complexity):
- KR: daily diff after the KIS master refreshes (evening KST).
- US: daily diff after the Nasdaq Trader files update (keyed off the `File Creation Time` trailer).
- Weekly: full rebuild + reconciliation + archive sweep.
- Manual `workflow_dispatch` fallback always available.
Options A (every business day full) / C (weekly only) / D (manual only) are documented in the operating
policy with scores; A is heavier with no freshness gain over B, C risks stale coverage, D risks neglect.

## 15. Recommended Exact Schedule Times

**[REC]** (avoid minute 00 due to documented top-of-hour scheduling delays):
- KR daily diff: **`17 12 * * 1-5` UTC = 21:17 KST** (after the KIS evening snapshot). 
- US daily diff: **`23 22 * * 1-5` UTC = 07:23 KST / 18:23 ET** (after the US session + directory settle).
- Weekly full reconciliation: **`41 13 * * 6` UTC = Sat 22:41 KST**.
GitHub Actions cron is **UTC-based** [SRC]; if the newer IANA-timezone cron field is available, express as
`Asia/Seoul` and convert accordingly (KST = UTC+9, no DST). **[INFER]**

## 16. GitHub Actions Feasibility

- **[SRC]** "Scheduled workflows run on the latest commit on the **default branch**" and only trigger "if
  the workflow file exists on the default branch." Shortest interval 5 min; UTC by default; schedules "can be
  delayed during periods of high loads"; public-repo scheduled workflows auto-disable after 60 days of no activity.
- **[FACT]** Actions is already enabled here (`scrape.yml` runs). `GITHUB_TOKEN` can commit/open a PR when
  workflow `permissions: contents: write` / `pull-requests: write` are granted.
- **[REC]** Initial mode: **report-only or automatic-PR from a workflow on `main`**, owner reviews/merges,
  **no auto-deploy**. Add `concurrency:` to prevent overlapping refresh runs.

## 17. No-Push / Default-Branch Constraint (critical)

**[FACT/INFER]** The refresh is worthless as a *local-only* workflow: a scheduled Action only runs from the
workflow file **on `main`**. The HF3B/HF4C work and any new workflow currently live on an **unpushed feature
branch**. Therefore, before any scheduled refresh can run, the owner must (a) authorize pushing/merging the
workflow to `main`, and (b) accept that the refresh operates against `main`. Until then the pipeline can only
be run **manually/locally** (Mode 0). This is the decisive operational gate.

## 18. Refresh Pipeline Architecture

Seven stages (designed; simulator covers stages 4–5 deterministically): **Fetch** (KRX ETF, KRX/KIND stock,
KIS KOSPI/KOSDAQ master, Nasdaq listed/other) → **Verify** (HTTP/content-type/min-size/hash/schema/as-of/stale)
→ **Normalize** (NFKC, leading-zero + alphanumeric code preservation, exchange map, group-code classification,
canonical identity) → **Compare** (prev active vs candidate; new/removed/renamed/type/exchange/mapping diffs;
suspicious mass-change flags) → **Validate** (uniqueness, non-empty categories, source counts, mapping rate,
anchor checks, no hidden defaults, search-ranking + chart-map smokes) → **Artifacts** (candidate master,
manifest, diff report, archive update, rejected-row report, source hashes) → **Review** (report/PR; **no
auto-merge, no auto-deploy** initially).

## 19. Automatic Blocking Rules

Encoded + unit-tested in `simulate_instrument_master_refresh.mjs` (`evaluateBlockingRules`): source
unavailable / stale / schema-changed; any required category empty; duplicate canonical identity; damaged
KR code shape; **total drop > 5%**, **total growth > 25%**, **> 50 removals/refresh**; ETF-category collapse;
**mapping rate < 95%**; verified anchors missing. **[REC]** Thresholds are **separate per axis** (new
listings vs removals vs total vs ETF-count vs mapping-rate) — not a single hard-coded ±3%. On any block:
**preserve last-known-good**, upload diagnostics, fail the run, never auto-merge.

## 20. Operating-Mode Recommendation

**[REC]** Adoption sequence **Mode 0 (manual now) → Mode 1 (scheduled report-only) → Mode 2 (scheduled
auto-PR)**, with an **≥ 4-week observation** before considering **Mode 3 (low-risk auto-merge)**. **Mode 4
(auto Production deploy) is not recommended** and only reconsidered after sustained clean operation. Rationale:
KR listing data is high-churn and the alphanumeric-code + terms questions are unresolved, so a human gate on
merges is warranted initially.

## 21. Legal / Data-Use Findings

Conservative classification (no conclusion beyond the text reviewed):
- **KRX Open API ToS** — one compliant excerpt: users may not "provide information received from the Korea
  Exchange to third parties." **[SRC]** → serving KRX-API-sourced data to app users is **CLEARLY RESTRICTED /
  REQUIRES KRX APPLICATION OR APPROVAL** for that channel. **[OPEN]**
- **KRX Data Marketplace browser export** — technically credential-free, but redistribution/serving terms are
  **UNCLEAR — OWNER/LEGAL REVIEW REQUIRED**. **[OPEN]**
- **KIS public master file** — a codes/names reference master (not live 시세); committing normalized codes/names
  and serving client-safe search metadata is **UNCLEAR — OWNER/LEGAL REVIEW REQUIRED** (confirm KIS terms). **[OPEN]**
- **data.go.kr gov open-data** — generally permissive open-data terms; **likely CLEARLY PERMITTED** but requires
  an API key + attribution confirmation. **[OPEN]** A strong candidate authoritative KR source.
- **Nasdaq Trader** — public official symbol directory, already used in Production; **CLEARLY PERMITTED** for
  symbol reference (retain attribution). **[INFER]**
> Because a material KRX redistribution restriction exists on the *API* channel, **do not enable an automatic
> Production pipeline serving KRX-derived data until the owner completes a data-use review** and picks a source
> whose terms permit the intended use (data.go.kr is the most promising).

## 22. Owner Inputs Required

See `instrument_master_refresh_owner_input_checklist_v0.1.md`. Summary: an authoritative KR ETF source
decision (browser CSV **or** data.go.kr/KRX API key), a data-use/terms confirmation, a GitHub
default-branch/push + PR-permission decision, approval of the `^[0-9A-Z]{6}$` KR symbol widening, and a
refresh schedule + threshold sign-off.

## 23. Implementation-Scope Proposal

Successor **Phase 3GG-T-HF3B-HF2-INSTRUMENT-MASTER-AUTOMATION** (§ below). Lanes A–D; not implemented now.

## 24. Risks & Unresolved Questions

- **[OPEN]** KR symbol widening to `^[0-9A-Z]{6}$` touches `instrument.ts`, the HF3B generator, the search
  module, and the master schema — a cross-cutting but additive change; must re-verify all HF3B contracts.
- **[OPEN]** KRX data-use terms for the chosen channel (legal review).
- **[OPEN]** No-push/default-branch: a scheduled workflow requires merging to `main`.
- **[OPEN]** Definitive KRX ETF membership count needs the owner-downloaded file (KIS `EF` = 1,151 is the
  current best official figure).
- **[INFER]** KIS master mtime/refresh time may shift; key US off the file trailer, KR off the KIS snapshot.

## 25. Final Go / No-Go Recommendation

**GO to design-complete; owner input required before implementation.** Recommended immediate path:
adopt **Mode 0** now (owner or a local run refreshes when desired using the committed discovery tooling),
obtain the authoritative KR ETF file/key + terms clearance, approve the KR symbol widening, then implement
**Phase 3GG-T-HF3B-HF2** as **Mode 1 → Mode 2** on `main`. Do not enable auto-deploy.
