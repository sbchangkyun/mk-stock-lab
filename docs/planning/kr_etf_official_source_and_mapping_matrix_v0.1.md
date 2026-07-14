# KR ETF Official Source & Mapping Matrix — v0.1

Companion to `phase_3gg_t_hf3b_hf1_kr_etf_master_refresh_discovery_result_v0.1.md`. Discovery-only;
no Production change. Evidence tags: [FACT] measured · [SRC] source statement · [TEST] tested here ·
[INFER] inference · [OPEN] unresolved.

## 1. Source decision matrix

| # | Source | Content | Auto? (this env) | Credentials | Redistribution/terms | ETF membership authority | Verdict |
|---|---|---|---|---|---|---|---|
| S1 | KIS `kospi_code.mst` (`new.real.download.dws.co.kr`) | KOSPI securities + group code (EF/EN/RT/ST) + ISIN + KR name | **Yes, HTTP 200** [TEST] | none | UNCLEAR — confirm KIS terms [OPEN] | field-based **type** + chart mapping (not membership) | **Primary retrievable-now** count + mapping |
| S2 | KRX Data Marketplace CSV (`data.krx.co.kr`) | KRX-authoritative ETF list + base index | **No** — WAF `400 LOGOUT`; OTP CSV `200/0 bytes` [TEST] | none *in a browser* | UNCLEAR — legal review [OPEN] | **membership authority** | **Owner browser download** (OWNER_SOURCE_FILE_REQUIRED) |
| S3 | KRX Open API (`openapi.krx.co.kr`) | ETF basic/daily services | key not authorized | account + AUTH_KEY + per-service approval [SRC] | "cannot provide … to third parties" → RESTRICTED [SRC] | membership authority | Needs KRX application + terms review |
| S4 | data.go.kr `금융위원회_KRX상장종목정보` | gov open-data KRX listed instruments | key not authorized | data.go.kr key | open-data (generally permissive) [SRC] | membership (gov-sanctioned) | **Best long-term authoritative source** |
| S5 | Nasdaq Trader (`nasdaqtrader.com`) | US listing + ETF flag + exchange | **Yes** (HFused by HF3B) | none | public official directory [SRC] | US authority | Keep for US |

## 2. Measured KR classification (KIS master, group code) — [FACT]

Source: `kospi_code.mst`, SHA-256 `dd15d6be3237efff…`, 740,418 bytes, retrieved 2026-07-14, 2,562 records.

| Group | Meaning | Count |
|---|---|---|
| EF | **ETF** | **1,151** |
| EN | ETN | 385 |
| ST | stock (incl. preferred) | 917 |
| BC | (beneficiary/other) | 71 |
| RT | REIT | 23 |
| SW/SR/PF/IF/MF/DR/FS | other ETP/trust/DR | 16 |

- ETF codes: 868 numeric 6-digit + **283 alphanumeric 6-char** (e.g. `0000D0`); 1,151 unique; all `^[0-9A-Z]{6}$`. [FACT]
- KOSDAQ master: **0 EF** (all KR ETFs are on the KOSPI market file). [FACT]

## 3. ETF vs ETN vs ELW vs trust — classification rule [REC]

Use the KIS **security group code** (first 2 chars of the 228-byte record tail, per the official
`kis_kospi_code_mst.py`): `EF`=ETF, `EN`=ETN, `EW`=ELW, `RT`=REIT, `ST`=stock. **Never** infer type from
brand (KODEX/TIGER/ACE/SOL/RISE), ticker shape, or the coarse `ETP` flag (which does not separate ETF/ETN).
Use the KRX ETF dataset as the membership authority once available; KIS provides the field-based type +
chart mapping.

## 4. KRX → KIS mapping (method + expected) 

- By construction, the 1,151 KIS `EF` ETFs are **100% KIS-mappable** (each has a KIS short code + ISIN,
  addressable on the existing KIS domestic daily-OHLC path). [FACT]
- True KRX-authoritative → KIS rate is produced by `scripts/discovery/compare_krx_etf_to_kis_master.mjs`
  against the owner's KRX file: mapped / unmapped / % + name/standard-code mismatch + KIS-not-in-KRX +
  likely-ETN excluded. Expected ≥ 99% (both KRX-sourced); gaps = brand-new listings in one snapshot only. [INFER]

## 5. Critical mapping caveat — alphanumeric codes [INFER]

283/1,151 ETFs use **alphanumeric** KRX codes. The current KR symbol contract `^\d{6}$`
(`src/lib/market-data/instrument.ts` `KR_SYMBOL_PATTERN`, the HF3B generator, and the search module) would
**reject** these. Implementation must widen KR symbols to `^[0-9A-Z]{6}$`. KIS domestic OHLC accepts the
6-char code either way (numeric or alphanumeric).

## 6. Owner steps to obtain the authoritative KRX ETF file (credential-free)

1. Browser → `https://data.krx.co.kr` → **[증권상품] → [ETF] → "전종목 기본정보"** (or "전종목 시세").
2. Click the CSV/Excel download icon; save (e.g. `krx_etf.csv`).
3. `node scripts/discovery/parse_krx_etf_master.mjs --source krx_etf.csv` → exact active unique count.
4. `node scripts/discovery/compare_krx_etf_to_kis_master.mjs --krx krx_etf.csv --kis <kospi_code.mst>` → mapping report.

(Alternatively obtain a **data.go.kr** API key for `금융위원회_KRX상장종목정보` — cleaner terms — and add a
parser in the implementation phase.)

## 7. Discovery tooling (committed, offline, no dependency)

- `scripts/discovery/parse_kis_kospi_master.mjs` — parses `kospi_code.mst`; group breakdown; ISIN→6-char code; anchor validation.
- `scripts/discovery/parse_krx_etf_master.mjs` — parses an owner KRX ETF CSV (auto-detects code/name cols; alphanumeric-safe; dedup).
- `scripts/discovery/compare_krx_etf_to_kis_master.mjs` — KRX ETF ∩ KIS `EF` mapping report.
- `scripts/discovery/simulate_instrument_master_refresh.mjs` — diff + blocking-rules simulator (`--self-test`, 19/19).
- `scripts/discovery/smoke_phase_3gg_t_hf3b_hf1_discovery.mjs` — offline smoke over all of the above (14/14, no external file).
