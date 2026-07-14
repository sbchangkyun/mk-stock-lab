# Phase 3GG-T-HF3B-HF4C — Universal Search + OHLCV Data Foundation — Result v0.1

## 1. Baseline

- Project path: `C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab`
- Branch: `rebuild/phase-1-ia-shell`
- Starting HEAD (`ANALYSIS_V2_FINAL_HEAD`): `845cac4`
  (`Phase 3GG-T-HF5-HF6AB: verify analysis experience V2 in Production`)
- No checkout/reset/stash/rebase performed. Known unrelated working-tree items (`.gitignore`,
  `.agents/`, `.claude/`, `.vscode/settings.json`, `docs/handoff/codex_state_inspection/`,
  `skills-lock.json`) left untouched and uncommitted.

## 2. Scope

Two combined improvements to the Chart AI data foundation, with no change to auth, durable KIS token
lifecycle, selected-symbol integrity, chart interaction, Similarity scoring, or MK Agent scoring:

- **HF3B — Universal KR/US Stock·ETF Search Coverage** (유니버설 종목 마스터): replace the 31-item
  hand-curated master with a generated, versioned master built from official listing metadata, and expand
  the search route/UI with KR/US + type filters and bounded pagination.
- **HF4C — Normalized OHLCV Cache and Request Deduplication**: consolidate OHLCV caching into one
  bounded, per-instance normalized cache with authoritative same-key single-flight.

## 3. HF3B — instrument source and coverage

### 3.1 Previous catalogue

- Prior curated master: **31** instruments (11 KR stock, 7 KR ETF, 9 US stock, 4 US ETF).

### 3.2 Official sources (development-time; owner downloads, generator reads local files only)

- **US** — NASDAQ Trader Symbol Directory: `nasdaqlisted.txt` (NASDAQ-listed) + `otherlisted.txt`
  (NYSE / NYSE American / NYSE Arca / other). The official symbol directory published by Nasdaq; carries
  the authoritative **ETF flag** and the listing exchange. Retrieved 2026-07-14.
- **KR** — KRX KIND listed-corporation directory (상장법인목록), per market
  (`marketType=stockMkt` → KOSPI, `marketType=kosdaqMkt` → KOSDAQ). Carries 회사명 + 종목코드.
  Retrieved 2026-07-14.
- **Curated anchors** — `src/data/chart-ai/universalInstrumentMaster.anchors.json` (the prior 31
  verified records): the authoritative KR ETF source (the KRX corp-list does not enumerate ETFs) and the
  enriched Korean/English name + alias source.

Raw source files were downloaded only into a scratch location and are **not committed**. Committed:
the normalized master, the provenance manifest, the deterministic generator, and this result doc.

### 3.3 Generated catalogue (masterVersion `hf3b-12826`)

| Category | Count |
| --- | --- |
| KR stock (KOSPI 832 / KOSDAQ 1769) | 2601 |
| KR ETF (KOSPI, curated anchors) | 7 |
| US stock (NASDAQ/NYSE/NYSE American/NYSE Arca) | 6231 |
| US ETF (official ETF flag) | 3987 |
| **Total** | **12826** |

- **KR breakdown (manifest-authoritative, verified against the generated records):** the KOSPI *exchange*
  total is **839** = **832 KOSPI stocks + 7 KOSPI KR ETFs**; KOSDAQ is **1769 stocks (0 ETFs)**. So total
  **KR stocks = 832 + 1769 = 2601**, total **KR ETFs = 7**, and total **KR instruments = 2608**. The
  manifest's `counts.krStock` (2601) already excludes ETFs, while `counts.byExchange.KOSPI` (839) is the
  raw per-exchange total that includes the 7 KR ETFs — the two are consistent, not contradictory. (An
  earlier draft of this table mislabeled the KR-stock row as "KOSPI 839"; the generated data was always
  correct — only this documentation line is corrected here.)
- By exchange (raw exchange totals): KOSPI 839 (832 stock + 7 ETF), KOSDAQ 1769, NASDAQ 4939, NYSE 2331,
  NYSE Arca 2676, NYSE American 272.
- 12826 / 31 ≈ **414×** the prior curated count (well beyond the ≥10× requirement). The exact count is
  reported here as an observation, not hard-coded as a permanent contract.

### 3.4 Rejected rows (counted, never silently skipped)

- US: unsupported-exchange 1527 (Cboe BZX / IEX / other — not mappable to the KIS overseas contract),
  invalid-symbol-shape 543 (non pure-alpha / >5 chars — class/preferred/warrant tickers), non-common
  security 702 (warrants/rights/preferred/notes by official security-name designation), test-issue 33.
- KR: invalid-symbol-shape 53 (non six-digit codes, e.g. holding-company placeholder codes),
  duplicate-within-source 36.

### 3.5 Exchange mapping and rules

- US: NASDAQ → `NAS`; NYSE (`N`) → `NYS`; NYSE American (`A`) and NYSE Arca (`P`) → `AMS`; Cboe BZX
  (`Z`), IEX (`V`) and other → rejected as unsupported. US symbol rule: `^[A-Z]{1,5}$` (pure alpha) for
  confident KIS overseas addressing.
- KR: KOSPI/KOSDAQ → `kis-domestic` with `null` EXCD. KR symbol rule: `^\d{6}$` (six-digit code, leading
  zeros preserved as strings). KONEX / non-six-digit codes rejected.
- Canonical identity remains `country|symbol|exchange|instrumentType` (HF3A contract unchanged).
- US stock/ETF classification is taken **verbatim from the official ETF flag**; KR ETFs come only from
  verified anchors. ETF status is never inferred from a name substring.

### 3.6 Generation workflow (manual, reproducible, deterministic)

```
node scripts/generate_chart_ai_instrument_master.mjs \
  --us-nasdaq-source <nasdaqlisted.txt> --us-other-source <otherlisted.txt> \
  --kr-kospi-source  <kospi.html>       --kr-kosdaq-source <kosdaq.html> \
  --source-date 2026-07-14 --retrieved 2026-07-14
```

- No credentials, no KIS token, no runtime dependency, no Production mutation.
- `--validate` dry-run + `--report` rejection report. Exits non-zero on any schema/mapping error or when
  a required category would be empty. Verified byte-identical on regeneration (deterministic).

## 4. HF3B — search implementation

- **Ranking** (deterministic, lower = higher priority): exact symbol → exact name → symbol prefix →
  name prefix → alias → name-token prefix → contains. Ties break by country → exchange → assetType →
  normalized name → symbol. No popularity ranking, no hidden Samsung-first rule.
- **Filters**: `country` (all|KR|US) and `assetType` (all|stock|etf).
- **Pagination**: `limit` (default 20, max 50) + `offset`; response returns
  `items`/`results` (bounded page), `total`, `returned`, `hasMore`, `nextOffset`, `appliedFilters`, and
  `masterVersion`. The full catalogue is never returned in one response.
- **UI**: result count headline (total matches), KR/US + 주식/ETF filter chips (wrap cleanly on mobile),
  a scrolling result region, an incremental "더 보기" load-more control, loading/empty states, monotonic
  `searchSeq` + `AbortController` stale-response protection (an older query can never overwrite a newer
  one), and cross-page de-duplication. Selection remains **pending-only** — searching or selecting never
  auto-loads a chart; an explicit load click is still required (HF3A preserved).
- **Server-only master**: the 12826-row master is loaded by the server search module only and is never
  serialized into `/chart-ai` page HTML. The search route makes no KIS/provider call and keeps the
  authenticated-user gate.

## 5. HF4C — OHLCV cache implementation

- New module `src/lib/server/chart-ai/normalizedOhlcvCache.mjs`: the single owner of normalized-OHLCV
  caching + request coalescing.
- **Canonical key** (`buildOhlcvCacheKey`): includes `country`, `symbol`, `exchange`, `exchangeCode`,
  `mode` (chart | long-history), `range`, `targetBars`, `adjusted`, `methodVersion`. It **throws** if a
  user/auth/token field (`userId`, `token`, `authorization`, `cookie`, `jwt`, `appSecret`, `email`, …)
  is supplied — market-data keys are identical for every authenticated user.
- **Bounded LRU**: `maxEntries` cap (provider uses 512) with deterministic oldest/LRU eviction; injectable
  clock; never unbounded.
- **Explicit TTLs**: recent chart ranges `RECENT_CHART_TTL_MS` = 5 min; long-history analysis data
  `LONG_HISTORY_TTL_MS` = 6 h; stable no-data negative cache `NEGATIVE_TTL_MS` = 30 s. Provider/auth/
  internal errors are **never** cached.
- **single-flight**: one in-flight `Promise` map. Concurrent same-key calls issue exactly one underlying
  provider load; all callers await it; the in-flight entry always clears in `finally` (success **and**
  failure); a later caller may retry after a failure. Different keys never block each other.
- **Value safety**: every stored and returned value is a structured deep clone, so a caller mutating its
  copy can never corrupt the cached value (and vice versa). Raw provider payloads, auth values, tokens,
  and user data are never stored — only the normalized, client-safe response.
- **Cross-feature reuse**: the chart-range fetch and the long-history pager share one cache. Similarity
  and MK Analysis both request the default (~3-year) long history for the same symbol, so they share one
  key and coalesce onto one paged provider fetch; a completed Similarity request lets a later MK request
  hit the cache. Changing range or symbol produces a distinct key.
- **Observability**: safe `X-MK-OHLCV-Cache` header (`MISS` | `HIT` | `COALESCED` | `NEGATIVE_HIT` |
  `BYPASS`, plus `RESULT_HIT` on the analysis routes' own result-cache path) on the ohlcv / similarity /
  mk-analysis routes. Metadata only — no key, no credentials, no user identity; the response body
  contract is unchanged.
- **No cross-instance durability claim**: the cache and single-flight are authoritative only within one
  warm server instance. No Supabase/Redis/KV is added. Durable KIS token reuse remains independent and
  already verified. A shared normalized-OHLCV L2 cache is documented as a possible future enhancement,
  not part of this phase.

## 6. Preserved / out of scope

- HF3A selected-symbol integrity, Similarity V2, MK Agent V2 modules: unchanged (diff-empty vs baseline).
- Durable KIS token lifecycle / store / RPC bridge, KIS transport, `supabaseAdmin` auth validator: all
  unchanged. Every Chart AI route keeps its fail-closed `validateUserFromBearerToken` gate.
- Market Intelligence: UI stays absent from the Chart AI page; its backend route + engine are unchanged.
- No account/order/balance/funds/trading endpoint, no external LLM, no dependency/lockfile change, no
  Supabase/migration/env change, no RSI/MACD/Bollinger/ATR/support-resistance.

## 7. Local test results

- `node scripts/smoke_phase_3gg_t_hf3b_hf4c_fast_data_foundation.mjs` — 87/87 PASS
- `node scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs` — PASS
- Full regression gate (OP/S/N/Q/R-FAST, T-HF1, T-FAST, T-HF2/HF2-HF1, T-HF3A, T-HF4-FAST/HF1/HF2,
  T-HF5-HF6AB) — all PASS (see Owner Checkpoint report for the counts).
- `npx astro build` — PASS. `git diff --check` — clean (only benign CRLF warnings).

## 8. Sibling reconciliation (narrow)

- `scripts/check_phase_3gg_op_fast_contract.mjs`: its single-line substring assertion
  `results: [], resultCount: 0` was widened to `results: []` + `/resultCount: 0/` because the search
  module's empty-return object is now formatted across multiple lines (pagination fields added). No
  provider/auth/endpoint/secret/no-fabrication protection was weakened.

## 9. Implementation commit

- Commit message: `Phase 3GG-T-HF3B-HF4C: expand search and deduplicate OHLCV requests`
- No push (`GIT_PUSH_AUTHORIZED: NO`).

## 10. Production deployment + safe regression

- Implementation commit deployed: `cbd24eb`. Deployed via `vercel deploy --prod --yes` only.
- Deployment `dpl_63VLvyyCELwDdz23pUGMsPkJHJgq`, `readyState: READY`, `target: production`, alias
  `https://mkstocklab.vercel.app`. No rollback required.
- Safe unauthenticated regression: `/chart-ai` 200; search / ohlcv / similarity / mk-analysis /
  market-intelligence routes → sanitized 401 `AUTH_REQUIRED`; bogus bearer → `AUTH_INVALID`; deployed
  page HTML contains neither the full master nor a hidden Samsung default nor Market Intelligence UI, and
  carries the new search UI (KR/US filters + load-more).

## 11. Owner QA — verified

Owner-authenticated browser QA completed 2026-07-14; all required Production QA categories passed:

- Search coverage and ranking: **PASS**
- Filters, result count, pagination, and duplicate prevention: **PASS**
- Newly added KR stock chart loading: **PASS**
- Existing KR ETF regression: **PASS**
- New KR ETF coverage expansion: **NOT ACHIEVED** — the seven verified anchors remain supported
- Newly added US stock and ETF chart loading: **PASS**
- Stale-search protection and pending-only selection: **PASS**
- OHLCV data integrity and warm-instance cache behavior: **PASS**
- Similarity V2 and MK Agent V2 regression: **PASS**
- Samsung/AAPL and cross-symbol isolation: **PASS**
- Mobile responsiveness: **PASS**
- Minor UI/UX items: deferred as non-blocking follow-up work (owner-approved, separate cleanup phase)
- No duplicate KIS token-issuance regression was reported
- No rollback required

### KR ETF coverage limitation (documented)

HF3B did **not** expand KR ETF coverage. The official KRX KIND listed-corporation directory enumerates
listed companies (stocks) only and does not include ETFs, and no other official KR ETF listing file was
introduced this phase. The KR ETF category therefore remains exactly the **7 verified curated anchors**
(069500 KODEX 200, 102110 TIGER 200, 114800 KODEX 인버스, 229200 KODEX 코스닥150, 360750 TIGER
미국S&P500, 133690 TIGER 미국나스닥100, 379800 KODEX 미국S&P500), all real and chart-loadable. A future
phase can add an official KR ETF listing source to the generator to expand this category.

Implementation commit: `cbd24eb` (`Phase 3GG-T-HF3B-HF4C: expand search and deduplicate OHLCV requests`).
Production deployment: `dpl_63VLvyyCELwDdz23pUGMsPkJHJgq`, READY, alias `https://mkstocklab.vercel.app`,
deployed commit `cbd24eb`. No rollback. No push.

**Final classification:
`PASS_SEARCH_AND_OHLCV_DATA_FOUNDATION_PRODUCTION_VERIFIED_WITH_KR_ETF_COVERAGE_LIMITATION`.**
