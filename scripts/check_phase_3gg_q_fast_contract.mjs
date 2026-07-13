/**
 * Phase 3GG-Q-FAST contract checker — Real Similar Pattern Analysis on Selected Instrument OHLCV.
 *
 * Static, deterministic verification:
 *  - the deterministic similarity engine (.mjs) exists, is pure (no randomness / no LLM), preserves
 *    the documented 0.45/0.35/0.20 weighting, and adds Top-K min-gap de-duplication;
 *  - the real similarity route (.json) is guarded like the OHLCV/summary routes, uses real
 *    long-history OHLCV + the engine, exposes honest error states, and never imports an LLM;
 *  - the long-history pager exists (paginated real KIS, no new raw endpoint), and the overseas
 *    transport gained a BYMD page cursor;
 *  - chart-ai.astro replaced the Production similarity preparing state with the real analysis UI;
 *  - no sample/synthetic/mock OHLCV or fabricated results in the real path;
 *  - no order/account/balance/trading endpoint; no secret/model/prompt/raw-payload exposure;
 *  - .env/.env.local/.vercel never tracked; working tree in scope.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = 'b2edefb';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const ENGINE = 'src/lib/server/chart-ai/similarity-engine.mjs';
const ROUTE = 'src/pages/api/chart-ai/similarity.json.ts';
const PROVIDER = 'src/lib/server/chart-ai/universalOhlcvProvider.ts';
const NORMALIZE = 'src/lib/server/chart-ai/universal-ohlcv-normalize.mjs';
const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const SMOKE = 'scripts/smoke_phase_3gg_q_fast_real_similarity_engine.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_q_fast_contract.mjs';
const OWNER_SMOKE = 'scripts/owner_smoke_phase_3gg_q_fast_real_similarity.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_q_fast_real_selected_instrument_similarity_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [CHART_AI_PAGE, ENGINE, ROUTE, PROVIDER, NORMALIZE, KIS_CLIENT, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => {
  assertions += 1;
  if (!cond) { failures += 1; console.error(`FAIL: ${message}`); }
};
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' });
const exists = (p) => existsSync(p);
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(exists(f), `Required file missing: ${f}`);

// --- 2. Deterministic engine ---
const engine = read(ENGINE);
for (const token of ['runRealSimilarity', 'computeSimilarityScore', 'computeForwardOutcome', 'minGapBars', 'SIMILARITY_METHOD_VERSION', 'insufficientHistory']) {
  assert(engine.includes(token), `similarity-engine.mjs missing required token: ${token}`);
}
assert(/0\.45/.test(engine) && /0\.35/.test(engine) && /0\.2/.test(engine), 'engine must keep the documented 0.45/0.35/0.20 weighting.');
assert(!/Math\.random/.test(engine), 'engine must not use randomness.');
assert(!/openai|OpenAI|CHART_AI_LLM|gpt-/i.test(engine), 'engine must not reference any LLM.');
assert(!/createMockedOhlcSeries|syntheticOhlcvFixture|SYNTH0|Mocked/.test(engine), 'engine must not import a mock/synthetic OHLCV source.');
// Top-K min-gap selection present.
assert(/selected\.every\([^)]*minGapBars\)/.test(engine) || /Math\.abs\(s\.startIndex - entry\.startIndex\) >= minGapBars/.test(engine), 'engine must enforce a Top-K minimum gap.');

// --- 3. Real similarity route ---
const route = read(ROUTE);
for (const token of ['evaluateProductionChartAiBetaAccess', 'fetchLongHistoryOhlcv', 'runRealSimilarity', 'INSUFFICIENT_HISTORY', 'PROVIDER_UNAVAILABLE', 'prodBetaAccess.allowed', '미래 성과를 예측하거나 보장하지 않습니다']) {
  assert(route.includes(token), `similarity route missing required token: ${token}`);
}
assert(!/openai|OpenAI|runLocalOnlyLlmRuntimeBridge|CHART_AI_LLM/i.test(route), 'similarity route must not use an LLM.');
assert(!/createMockedOhlcSeries|syntheticOhlcvFixture|SYNTH0|Mocked|createMockedOhlc/.test(route), 'similarity route must not import mock/synthetic OHLCV.');

// --- 4. Long-history pager + overseas cursor (no new raw endpoint) ---
const provider = read(PROVIDER);
assert(provider.includes('fetchLongHistoryOhlcv'), 'provider must expose fetchLongHistoryOhlcv.');
assert(/normalizeOhlcvRowsFull/.test(provider) && /normalizeOhlcvRowsFull/.test(read(NORMALIZE)), 'long-history must use the uncapped normalize helper.');
const kis = read(KIS_CLIENT);
assert(/bymd/i.test(kis), 'overseas transport must accept a BYMD page cursor.');
// No new raw KIS endpoint path beyond the OP-FAST-approved market-data ones.
const NEW_KIS_PATHS = (kis.match(/\/uapi\/[a-z0-9\-\/]+/gi) || []);
const APPROVED_KIS_PATHS = [
  '/uapi/domestic-stock/v1/quotations/inquire-price',
  '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
  '/uapi/overseas-price/v1/quotations/dailyprice',
  '/uapi/overseas-price/v1/quotations/price',
  '/oauth2/tokenP',
];
for (const p of NEW_KIS_PATHS) {
  assert(APPROVED_KIS_PATHS.includes(p), `kisClient.ts references a non-approved endpoint path: ${p}`);
}

// --- 5. Production similarity UI in chart-ai.astro ---
const page = read(CHART_AI_PAGE);
for (const token of ['chartAiSimilarityReal', 'chartAiSimilarityStartBtn', '/api/chart-ai/similarity.json', 'resetSelectedSimilarity', '정규화 오버레이', '유사 패턴 분석 시작', '과거 유사 구간의 이후 움직임을 참고용으로 비교합니다']) {
  assert(page.includes(token), `chart-ai.astro missing required token: ${token}`);
}
assert(!page.includes('실제 유사 패턴 분석은 다음 단계에서 연결됩니다.'), 'chart-ai.astro must drop the similarity preparing-state copy.');

// --- 6. Forbidden endpoints / exposure across new+touched files ---
const surface = [ENGINE, ROUTE, PROVIDER, NORMALIZE].map(read).join('\n');
const FORBIDDEN_ENDPOINTS = [/inquire-balance/i, /inquire-psbl-order/i, /order-cash/i, /order-credit/i, /\/trading\//i, /inquire-account/i, /funds?-transfer/i, /portfolio-order/i];
for (const pat of FORBIDDEN_ENDPOINTS) assert(!pat.test(surface), `New surface must not reference forbidden endpoint ${pat}`);
const touched = [CHART_AI_PAGE, ENGINE, ROUTE, PROVIDER].map(read).join('\n');
const FORBIDDEN_EXPOSURE = [/OPENAI_API_KEY\s*=\s*sk-/, /KIS_APP_SECRET\s*=\s*[A-Za-z0-9]/, /console\.log\([^)]*process\.env/, /gpt-4|gpt-3\.5|claude-3/i];
for (const pat of FORBIDDEN_EXPOSURE) assert(!pat.test(touched), `Touched source must not match forbidden exposure ${pat}`);

// --- 7. package.json scripts ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-q-fast"'), 'package.json must define smoke:phase-3gg-q-fast.');
assert(pkg.includes('"check:phase-3gg-q-fast"'), 'package.json must define check:phase-3gg-q-fast.');

// --- 8. Changelog entry ---
const changelog = read(CHANGELOG);
const section = changelog.split('## Phase 3GG-Q-FAST')[1]?.split('\n## ')[0] ?? '';
assert(changelog.includes('## Phase 3GG-Q-FAST'), 'changelog must contain the Phase 3GG-Q-FAST entry.');
const norm = section.replace(/\s+/g, ' ');
for (const token of ['Builds on Phase 3GG-OP-FAST', 'sliding-window similarity', 'Top 5', 'normalized overlay', 'No LLM used for similarity', 'No sample OHLCV fallback', 'Phase 3GG-R-FAST']) {
  assert(norm.includes(token.replace(/\s+/g, ' ')), `changelog entry missing required token: ${token}`);
}

// --- 9. Result doc ---
const doc = read(RESULT_DOC);
for (const token of ['PASS_REAL_SIMILARITY_PRODUCTION_VERIFIED', 'b2edefb', 'Phase 3GG-R-FAST', 'sim-v1-corr045-rmse035-dir020']) {
  assert(doc.includes(token), `result doc missing required token: ${token}`);
}

// --- 10. .env / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 11. Working-tree purity ---
const ALLOWED = new Set([...REQUIRED_FILES, OWNER_SMOKE, PROVIDER, NORMALIZE, KIS_CLIENT, CHANGELOG, PACKAGE_JSON, CHART_AI_PAGE]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore' ||
  /^src\/lib\/server\/chart-ai\//.test(f) ||
  /^src\/pages\/api\/chart-ai\//.test(f) ||
  /^src\/lib\/chart-ai\/portfolio-intelligence\//.test(f) ||
  /^scripts\/(smoke|check|owner_smoke)_phase_3gg_[a-z0-9_]+\.mjs$/.test(f) ||
  /^src\/lib\/server\/providers\/kis\//.test(f) ||
  /^supabase\/migrations\//.test(f) ||
  /^scripts\/[a-z0-9_]+_testsrc\.ts$/.test(f) ||
  /^src\/lib\/chart-ai\//.test(f) ||
  /^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(f);
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-Q-FAST contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
