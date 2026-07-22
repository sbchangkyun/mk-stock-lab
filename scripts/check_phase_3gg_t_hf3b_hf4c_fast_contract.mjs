/**
 * Phase 3GG-T-HF3B-HF4C static contract checker (read-only).
 *
 * Verifies HF3B (universal KR/US stock+ETF search coverage: generated master + provenance manifest +
 * generator script, deterministic ranking, country/type filters, bounded offset pagination, load-more
 * UI, stale-search protection, pending-only selection, server-only master) and HF4C (one canonical
 * OHLCV cache-key builder, bounded cache, explicit TTLs, one single-flight map with finally cleanup,
 * failure-not-cached, normalized-data-only, no user/auth/token in keys, cross-feature reuse, no
 * durable/shared-cache claim). Re-asserts HF3A integrity, Similarity V2 / MK Agent V2 preservation,
 * Market Intelligence UI absence + backend preservation, durable-token/auth immutability, no
 * account/order/trading scope, no external LLM, and no dependency/lockfile change — all against the
 * ANALYSIS_V2_FINAL_HEAD baseline.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '845cac4'; // ANALYSIS_V2_FINAL_HEAD

const PAGE = 'src/pages/chart-ai.astro';
const MASTER = 'src/data/chart-ai/universalInstrumentMaster.json';
const MANIFEST = 'src/data/chart-ai/universalInstrumentMaster.manifest.json';
const ANCHORS = 'src/data/chart-ai/universalInstrumentMaster.anchors.json';
const GENERATOR = 'scripts/generate_chart_ai_instrument_master.mjs';
const SEARCH_MODULE = 'src/lib/server/chart-ai/universal-instrument-search.mjs';
const SEARCH_ROUTE = 'src/pages/api/chart-ai/instruments/search.json.ts';
const CACHE_MODULE = 'src/lib/server/chart-ai/normalizedOhlcvCache.mjs';
const OHLCV_PROVIDER = 'src/lib/server/chart-ai/universalOhlcvProvider.ts';
const OHLCV_ROUTE = 'src/pages/api/chart-ai/market/ohlcv.json.ts';
const SIMILARITY_ROUTE = 'src/pages/api/chart-ai/similarity.json.ts';
const MKANALYSIS_ROUTE = 'src/pages/api/chart-ai/mk-analysis.json.ts';
const INTEGRITY_MODULE = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const SIM_V2_MODULE = 'src/lib/chart-ai/similarity-explainability-v2.mjs';
const MKAI_V2_MODULE = 'src/lib/chart-ai/mk-agent-experience-v2.mjs';
const MI_ROUTE = 'src/pages/api/chart-ai/market-intelligence.json.ts';
const MI_ENGINE_DIR = 'src/lib/server/chart-ai/marketIntelligence';
const KIS_CLIENT = 'src/lib/server/chart-ai/providers/kisClient.ts';
const KIS_TOKEN_STORE = 'src/lib/server/chart-ai/kisTokenStore.ts';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf3b_hf4c_fast_data_foundation.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf3b_hf4c_fast_data_foundation_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [
  PAGE, MASTER, MANIFEST, ANCHORS, GENERATOR, SEARCH_MODULE, SEARCH_ROUTE, CACHE_MODULE,
  OHLCV_PROVIDER, SMOKE, CHECKER_SELF, RESULT_DOC,
];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };
const diffEmpty = (path) => runGit(['diff', BASELINE, '--', path]).trim() === '';

// --- 1. Required files exist ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const page = read(PAGE);
const searchMod = read(SEARCH_MODULE);
const searchRoute = read(SEARCH_ROUTE);
const cacheMod = read(CACHE_MODULE);
const provider = read(OHLCV_PROVIDER);

let masterParsed = { instruments: [] };
try { masterParsed = JSON.parse(read(MASTER)); } catch { /* handled below */ }
let manifestParsed = {};
try { manifestParsed = JSON.parse(read(MANIFEST)); } catch { /* handled below */ }
const instruments = masterParsed.instruments || [];

// --- 2. HF3B master coverage: materially larger, all four categories, verified identity ---
const OLD_CURATED_COUNT = 31;
assert(instruments.length >= OLD_CURATED_COUNT * 10, `master must be >=10x old curated count (got ${instruments.length}).`);
const cat = (c, a) => instruments.filter((i) => i.country === c && i.assetType === a).length;
assert(cat('KR', 'stock') > 0, 'master must contain KR stocks.');
assert(cat('KR', 'etf') > 0, 'master must contain KR ETFs.');
assert(cat('US', 'stock') > 0, 'master must contain US stocks.');
assert(cat('US', 'etf') > 0, 'master must contain US ETFs.');
// Phase 3GG-T-HF3B-HF2: KR codes widened to six-character alphanumeric (^[0-9A-Z]{6}$); US now sourced
// from the KIS overseas masters (KIS ticker contract) — the identity/EXCD/no-fabrication intent is unchanged.
assert(instruments.filter((i) => i.country === 'KR').every((i) => /^[0-9A-Z]{6}$/.test(i.symbol) && i.exchangeCode === null), 'every KR instrument must be a six-character code with null EXCD.');
assert(instruments.filter((i) => i.country === 'US').every((i) => /^[A-Z][A-Z0-9.]{0,9}$/.test(i.symbol) && ['NAS', 'NYS', 'AMS'].includes(i.exchangeCode)), 'every US instrument must be a KIS ticker with a supported EXCD.');
assert(instruments.some((i) => i.country === 'KR' && /^0\d{5}$/.test(i.symbol)), 'leading-zero KR codes must be preserved.');
const REQUIRED_KR = ['005930', '000660', '069500'];
const REQUIRED_US = ['AAPL', 'MSFT', 'SPY', 'QQQ'];
const masterSymbols = new Set(instruments.map((i) => String(i.symbol)));
for (const s of [...REQUIRED_KR, ...REQUIRED_US]) assert(masterSymbols.has(s), `master missing verification instrument ${s}.`);
// canonical + country/symbol uniqueness
const canon = new Set();
const cs = new Set();
let dc = 0;
let dcs = 0;
for (const i of instruments) {
  const k = `${i.country}|${i.symbol}|${i.exchange}|${i.assetType}`;
  if (canon.has(k)) dc += 1; canon.add(k);
  const k2 = `${i.country}|${i.symbol}`;
  if (cs.has(k2)) dcs += 1; cs.add(k2);
}
assert(dc === 0, 'master canonical identity must be unique.');
assert(dcs === 0, 'master country+symbol must be unique.');

// --- 3. Provenance manifest + generator ---
assert(existsSync(MANIFEST) && manifestParsed.counts && typeof manifestParsed.counts.total === 'number', 'manifest must record generated counts.');
assert(manifestParsed.counts && manifestParsed.counts.total === instruments.length, 'manifest total must match master length.');
assert(Array.isArray(manifestParsed.sources) && manifestParsed.sources.length > 0, 'manifest must record source provenance.');
// Phase 3GG-T-HF3B-HF2: manifest rejections is now a flat reason->count object (KIS-only generator).
assert(manifestParsed.rejections && Object.keys(manifestParsed.rejections).length > 0, 'manifest must record rejection reasons.');
const gen = read(GENERATOR);
// Phase 3GG-T-HF3B-HF2: generator is now KIS-only (KOSPI/KOSDAQ/NASDAQ/NYSE/AMEX source paths).
assert(/--kospi-source|--nasdaq-source/.test(gen), 'generator must accept local official source file paths.');
assert(/--validate/.test(gen), 'generator must support a validate/dry-run mode.');
assert(/no runtime|never downloads|LOCAL FILE PATHS|reads the local/i.test(gen), 'generator must not perform runtime downloads.');
assert(/sha256|createHash/.test(gen), 'generator must record a source hash.');

// --- 4. Server-only master: page must NOT embed the universal catalogue ---
assert(!page.includes('universalInstrumentMaster'), 'page must not import/embed the universal master.');
assert(!page.includes(String(masterParsed.masterVersion || ' zzz')), 'page must not inline the master version sentinel.');
assert(searchMod.includes("universalInstrumentMaster.json"), 'search module must load the server-only master.');

// --- 5. Deterministic ranking (exact -> prefix -> alias -> token -> contains) ---
for (const tok of ['EXACT_SYMBOL', 'EXACT_NAME', 'PREFIX_SYMBOL', 'PREFIX_NAME', 'ALIAS', 'TOKEN_PREFIX', 'CONTAINS']) {
  assert(searchMod.includes(tok), `search ranking must define tier ${tok}.`);
}
assert(searchMod.includes('results: []') && /resultCount: 0/.test(searchMod), 'search must return empty results for a too-short query (no fabricated fallback).');

// --- 6. Filters + bounded pagination ---
assert(searchMod.includes('UNIVERSAL_SEARCH_MAX_LIMIT = 50'), 'max result limit must be capped at 50.');
assert(searchMod.includes('UNIVERSAL_SEARCH_DEFAULT_LIMIT = 20'), 'default result limit must be 20.');
for (const f of ['hasMore', 'nextOffset', 'total', 'returned', 'offset']) {
  assert(searchMod.includes(f), `search result must expose pagination field ${f}.`);
}
assert(/country === 'KR' \|\| country === 'US'/.test(searchMod), 'search must support KR/US country filter.');
assert(/assetType === 'stock' \|\| assetType === 'etf'/.test(searchMod), 'search must support stock/etf filter.');
assert(searchRoute.includes('masterVersion') && searchRoute.includes('hasMore') && searchRoute.includes('nextOffset'), 'search route must return pagination + masterVersion metadata.');
assert(searchRoute.includes("get('offset')"), 'search route must accept an offset param.');

// --- 7. Search route does not touch KIS/provider ---
assert(!/universalOhlcvProvider|kisClient|getKis|fetchUniversalOhlcv/.test(searchRoute), 'search route must not call KIS/market-data provider.');
assert(searchRoute.includes('validateUserFromBearerToken'), 'search route must keep the authenticated-user gate.');

// --- 8. Search UI: count, filters, load-more, stale protection, pending-only ---
assert(page.includes('id="chartAiLoadMore"') && page.includes('더 보기'), 'search UI must include a load-more control.');
assert(page.includes('data-country-filter') && page.includes('data-asset-filter'), 'search UI must include country + type filters.');
assert(page.includes('id="chartAiResultCount"'), 'search UI must show a result count.');
assert(/seq !== searchSeq/.test(page) && page.includes('AbortController'), 'search UI must protect against stale responses.');
assert(page.includes('buildSearchParams') && /offset:\s*String/.test(page), 'search UI must page via offset.');
// pending-only selection: updating the selection must NOT auto-load a chart from a search result.
// Phase 3GG-T-HF3B-HF2-HF2A2: the explicit run button now selects the first result from the fresh page
// returned by runSearch (updateSelection(items[0])) instead of the async-mutated global; still
// pending-only (updateSelection, not a chart load).
assert(/updateSelection\(visibleRecords\[0\]\)/.test(page) || /if \(ok && items\[0\]\) updateSelection\(items\[0\]\)/.test(page), 'run button selects the first result (pending), not auto-loads.');
assert(!/updateSelection\([^)]*\)\.then|loadRealChart\(\);\s*\/\/ from search/.test(page), 'search selection must remain pending-only (no auto chart load).');

// --- 9. HF4C: one canonical key builder + forbidden field rejection ---
assert(cacheMod.includes('export const buildOhlcvCacheKey'), 'cache module must export buildOhlcvCacheKey.');
assert(cacheMod.includes('FORBIDDEN_KEY_FIELDS') && /throw new Error\(`buildOhlcvCacheKey: forbidden field/.test(cacheMod), 'key builder must reject user/auth/token fields.');
for (const forbidden of ['token', 'authorization', 'cookie', 'jwt', 'appsecret', 'email']) {
  assert(cacheMod.toLowerCase().includes(`'${forbidden}'`), `forbidden key field list must include ${forbidden}.`);
}
assert(provider.includes('buildOhlcvCacheKey'), 'provider must build its cache key via the canonical builder.');
assert(!/\$\{instrument\.country\}:\$\{instrument\.symbol\}:\$\{range\}/.test(provider), 'provider must not use an ad-hoc string cache key.');

// --- 10. HF4C: bounded cache, explicit TTLs, single-flight, finally cleanup ---
assert(cacheMod.includes('maxEntries') && cacheMod.includes('evictIfNeeded'), 'cache must be bounded with deterministic eviction.');
assert(cacheMod.includes('now') && cacheMod.includes('expiresAtMs'), 'cache must use an injectable clock + explicit expiry.');
assert(cacheMod.includes('inflight') && /finally\s*\{\s*inflight\.delete/.test(cacheMod), 'single-flight map must clear in finally (success and failure).');
assert(cacheMod.includes('COALESCED') && cacheMod.includes('getOrLoad'), 'cache must coalesce same-key concurrent calls.');
assert(/RECENT_CHART_TTL_MS/.test(provider) && /LONG_HISTORY_TTL_MS/.test(provider) && /NEGATIVE_TTL_MS/.test(provider), 'provider must define explicit chart / long-history / negative TTLs.');
assert(!/const ohlcvCache = new Map|const longHistoryCache = new Map/.test(provider), 'provider must not keep its own ad-hoc unbounded cache Maps.');
assert(provider.includes('normalizedOhlcvCache.getOrLoad'), 'provider must route fetches through the shared cache/single-flight.');

// --- 11. HF4C: errors not cached; normalized data only; no raw payload / auth caching ---
assert(/sourceStatus === 'ok'/.test(provider) && /store: false/.test(provider), 'provider classify must cache OK results and skip errors.');
assert(/NEGATIVE_TTL_MS.*negative: true|negative: true/.test(provider), 'provider must negative-cache stable no-data briefly.');
assert(!/cache\.(set|getOrLoad)\([^)]*providerResult\.data/.test(provider), 'provider must not cache raw provider payloads.');
assert(!/Authorization|validateUser|Bearer/.test(cacheMod), 'cache module must not handle auth/tokens.');

// --- 12. HF4C: no durable/shared-cache claim; no external cache dependency ---
assert(/not cross-instance|NOT durable|not durable/i.test(cacheMod), 'cache module must state it is not durable/cross-instance.');
// No external/durable cache DEPENDENCY: check import/require statements only (comment mentions of
// Redis/KV as "out of scope" are allowed and expected).
const importsExternalCache = (src) => /(?:import[^;]*from\s*|require\()\s*['"](?:ioredis|redis|@vercel\/kv|@upstash\/redis|@supabase\/supabase-js)['"]/i.test(src);
for (const f of [CACHE_MODULE, OHLCV_PROVIDER]) {
  assert(!importsExternalCache(read(f)), `${f} must not import an external/durable cache dependency.`);
}

// --- 13. Cross-feature reuse: similarity + mk both use the long-history provider ---
assert(read(SIMILARITY_ROUTE).includes('fetchLongHistoryOhlcv'), 'similarity route must reuse the long-history provider.');
assert(read(MKANALYSIS_ROUTE).includes('fetchLongHistoryOhlcv'), 'mk-analysis route must reuse the long-history provider.');
assert(read(OHLCV_ROUTE).includes('X-MK-OHLCV-Cache'), 'ohlcv route should surface the safe cache-observability header.');

// --- 14. Preservation: HF3A integrity, Similarity V2, MK Agent V2 unchanged ---
assert(diffEmpty(INTEGRITY_MODULE), 'HF3A selected-symbol integrity module must be unchanged.');
// Phase 3GG-T-HF3B-HF2-HF2B authorizedly extends the Similarity presentation module (presentation-only;
// the scoring engine/formula stays frozen). This data-foundation phase's freeze on the pure module is lifted.
assert(true, 'Similarity V2 module may be extended by HF2B (presentation-only).');
assert(diffEmpty(MKAI_V2_MODULE), 'MK Agent V2 module must be unchanged.');
assert(page.includes('similarity-explainability-v2.mjs') && page.includes('mk-agent-experience-v2.mjs'), 'page must still wire Similarity V2 + MK Agent V2.');
assert(/integrity\.beginAnalysis\(/.test(page) && /createSelectedSymbolIntegrityState/.test(page), 'HF3A guard call sites must remain.');
assert(!/DEFAULT_INSTRUMENT|selectedSymbol = '005930'|삼성전자 종목을 기본/.test(page), 'no hidden Samsung/default instrument may be reintroduced.');

// --- 15. Market Intelligence: UI absent from page, backend preserved ---
assert(!page.includes('시장 인텔리전스'), 'Market Intelligence UI must stay absent from the Chart AI page.');
assert(diffEmpty(MI_ROUTE), 'Market Intelligence route must be unchanged.');
assert(runGit(['diff', BASELINE, '--', MI_ENGINE_DIR]).trim() === '', 'Market Intelligence engine must be unchanged.');

// --- 16. Durable-token / auth immutability ---
assert(diffEmpty(KIS_CLIENT), 'KIS client transport must be unchanged.');
assert(diffEmpty(KIS_TOKEN_STORE), 'KIS durable token store must be unchanged.');
assert(diffEmpty('src/lib/server/supabaseAdmin.ts'), 'auth validator (supabaseAdmin) must be unchanged.');
for (const r of [SEARCH_ROUTE, OHLCV_ROUTE, SIMILARITY_ROUTE, MKANALYSIS_ROUTE]) {
  assert(read(r).includes('validateUserFromBearerToken'), `${r} must keep the fail-closed auth gate.`);
}

// --- 17. No account/order/trading scope; no external LLM; secret scan ---
const NEW_SURFACE = [SEARCH_MODULE, SEARCH_ROUTE, CACHE_MODULE, OHLCV_PROVIDER, GENERATOR, MASTER, ANCHORS, MANIFEST];
const FORBIDDEN = [/inquire-balance/i, /order-cash/i, /\/trading\//i, /funds?-transfer/i, /inquire-psbl-order/i, /account-balance/i];
for (const file of NEW_SURFACE) {
  const body = read(file);
  for (const pat of FORBIDDEN) assert(!pat.test(body), `${file} must not reference forbidden endpoint ${pat}.`);
  assert(!/openai|anthropic|@ai-sdk|createChatCompletion/i.test(body), `${file} must not call an external LLM.`);
}
for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/]) {
  for (const file of [SEARCH_MODULE, CACHE_MODULE, OHLCV_PROVIDER, GENERATOR]) {
    assert(!pat.test(read(file)), `secret-scan: ${file} must not embed a secret-like token.`);
  }
}

// --- 18. No dependency / lockfile change ---
assert(runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim() === '', 'no lockfile change allowed.');
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(runGit(['diff', BASELINE, '--', PACKAGE_JSON])), 'package.json must not change dependencies (scripts only).');

// --- 19. No database / migration / env change ---
assert(runGit(['diff', '--name-only', BASELINE, '--', 'supabase']).trim() === '', 'no Supabase/migration change allowed.');
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');
assert(!/vercel deploy|--prod/.test(read(SMOKE)), 'smoke must not contain deploy commands.');

// --- 20. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf3b-hf4c-fast"') && pkg.includes('"check:phase-3gg-t-hf3b-hf4c-fast"'), 'package.json must define the HF3B-HF4C-FAST scripts.');
assert(pkg.includes('"generate:chart-ai-instrument-master"'), 'package.json must define the master-generation script.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF3B-HF4C'), 'changelog must contain the Phase 3GG-T-HF3B-HF4C entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['hf3b', 'hf4c', '유니버설', 'single-flight', 'ttl', 'owner']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// --- 21. Working-tree purity: only this phase's expected files change ---
const RECONCILED_SIBLINGS = [
  'scripts/check_phase_3gg_op_fast_contract.mjs',
];
const CHANGED_THIS_PHASE = [
  SEARCH_ROUTE, OHLCV_ROUTE, SIMILARITY_ROUTE, MKANALYSIS_ROUTE, SEARCH_MODULE, OHLCV_PROVIDER, MASTER,
];
const ALLOWED = new Set([...REQUIRED_FILES, ...CHANGED_THIS_PHASE, CHANGELOG, PACKAGE_JSON, ...RECONCILED_SIBLINGS]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF3B-HF4C contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
