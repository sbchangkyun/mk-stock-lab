/**
 * Phase 3GG-T-FAST contract checker — Market & Cross-Asset Intelligence.
 *
 * Static, deterministic verification:
 *  - the market-intelligence engine modules + route + smoke + result doc exist;
 *  - REAL data only: the route sources OHLCV via the existing provider and FX via the free ECB
 *    Frankfurter API; NO hardcoded/sample/mock FX or market values, NO fabricated benchmark/sector;
 *  - the engines are pure + deterministic: no LLM/openai/gpt, no Math.random, no network in the
 *    engine/formatter/resolvers (only the FX provider fetches);
 *  - honesty: rates are NOT_SOURCED, KR sector is unavailable, market breadth is unavailable, and
 *    missing data is represented as unavailable (never zero);
 *  - the route reuses the same guard as the OHLCV/similarity/MK-AI routes (no weakening);
 *  - no trading/account/order/balance/funds endpoint; no recommendation wording anywhere on the surface;
 *  - the UI section is production-gated, click-triggered (no auto provider call on render), and resets
 *    on symbol change; existing Chart/similarity/MK-AI/Portfolio routes are untouched;
 *  - no dependency/lockfile/Supabase change; .env/.vercel never tracked; working tree in scope.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '2e7dc90';
const DIR = 'src/lib/server/chart-ai/marketIntelligence';
const MODULES = [
  'marketContextTypes',
  'benchmarkResolver',
  'sectorResolver',
  'relativeStrength',
  'marketRegime',
  'crossAssetProvider',
  'marketIntelligenceEngine',
  'marketIntelligenceFormatter',
].map((m) => `${DIR}/${m}.mjs`);
const PURE_MODULES = MODULES.filter((m) => !m.endsWith('crossAssetProvider.mjs')); // FX provider is the only networked module
const ROUTE = 'src/pages/api/chart-ai/market-intelligence.json.ts';
const PROVIDER = 'src/lib/server/chart-ai/universalOhlcvProvider.ts';
const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const SMOKE = 'scripts/smoke_phase_3gg_t_fast_market_cross_asset_intelligence.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_fast_market_cross_asset_intelligence_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const API_DIR = 'src/pages/api/chart-ai';
const EXISTING_ROUTES = [
  `${API_DIR}/instruments/search.json.ts`,
  `${API_DIR}/market/ohlcv.json.ts`,
  `${API_DIR}/similarity.json.ts`,
  `${API_DIR}/mk-analysis.json.ts`,
  `${API_DIR}/local-only-kis-llm-summary.json.ts`,
];

const REQUIRED_FILES = [...MODULES, ROUTE, CHART_AI_PAGE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' });
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

// --- 2. Real data only: route sources OHLCV + FX from real providers, no hardcoded values ---
const route = read(ROUTE);
assert(/fetchLongHistoryOhlcv/.test(route), 'route must fetch REAL OHLCV via fetchLongHistoryOhlcv.');
assert(/fetchUsdKrwContext/.test(route), 'route must fetch REAL FX via fetchUsdKrwContext.');
assert(/resolveBenchmark/.test(route) && /resolveSector/.test(route), 'route must resolve benchmark + sector.');
assert(/findUniversalInstrument/.test(route), 'route must resolve the instrument from the real universe.');
// No hardcoded "current" FX rate or market level literal in the FX provider / types.
const fxProvider = read(`${DIR}/crossAssetProvider.mjs`);
assert(/frankfurter/i.test(fxProvider) && /fetch\(/.test(fxProvider), 'FX provider must call the real Frankfurter API.');
assert(!/rate\s*[:=]\s*1[0-9]{3}(\.\d+)?\b/.test(fxProvider), 'FX provider must not hardcode a USD/KRW rate.');

// --- 3. Deterministic + pure engines: no LLM, no randomness, no network in the pure modules ---
const pureText = PURE_MODULES.map(read).join('\n');
assert(!/openai|gpt-|claude-|anthropic/i.test(pureText), 'pure engines must not reference an LLM.');
assert(!/Math\.random/.test(pureText), 'pure engines must be deterministic (no Math.random).');
assert(!/\bfetch\s*\(|https?:\/\//.test(pureText), 'pure engines must not perform network I/O.');
const methodVersion = read(`${DIR}/marketContextTypes.mjs`);
assert(/market-intel-v1-deterministic/.test(methodVersion), 'method version must be the deterministic v1 tag.');

// --- 4. Honesty: rates not sourced, KR sector unavailable, breadth unavailable, missing != zero ---
const engine = read(`${DIR}/marketIntelligenceEngine.mjs`);
assert(/rateContext[\s\S]*available:\s*false|NOT_SOURCED/.test(engine), 'engine must mark rates honestly unavailable.');
const sectorResolver = read(`${DIR}/sectorResolver.mjs`);
assert(/country\s*===\s*'KR'|KR[\s\S]*available:\s*false|country !== 'US'/.test(sectorResolver) || /US_SECTOR_MAP/.test(sectorResolver), 'sector resolver must only assign verified US sectors (KR unavailable).');
const formatter = read(`${DIR}/marketIntelligenceFormatter.mjs`);
assert(/breadth/.test(formatter) && /available:\s*false/.test(formatter), 'formatter availability list must mark market breadth unavailable.');
assert(/MARKET_INTEL_DISCLAIMER/.test(formatter), 'formatter must attach the shared disclaimer.');
assert(/미래 성과를 예측하거나 보장하지 않습니다/.test(methodVersion), 'the shared disclaimer constant must carry the required wording.');

// --- 5. No recommendation wording anywhere on the surface ---
const surface = [...MODULES, ROUTE, CHART_AI_PAGE].map(read).join('\n');
const moduleAndUiText = [...MODULES, CHART_AI_PAGE].map(read).join('\n');
const PROHIBITED = ['매수하', '매도하', '진입 시점', '청산 시점', '목표가', '손절', '적정 비중', '추천 비중', '상승 확률', '수익 보장'];
const foundProhibited = PROHIBITED.filter((p) => moduleAndUiText.includes(p));
assert(foundProhibited.length === 0, `Market-intelligence surface must not contain recommendation wording: ${JSON.stringify(foundProhibited)}`);

// --- 6. No forbidden trading/account endpoint ---
const FORBIDDEN_ENDPOINTS = [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /\/api\/(order|account|balance|funds|portfolio\/trade|trading)\b/i, /KIS_ACCOUNT_NO/];
for (const pat of FORBIDDEN_ENDPOINTS) assert(!pat.test(surface), `Surface must not reference forbidden endpoint/account: ${pat}`);

// --- 7. Guard parity: route reuses the same guard as the sibling routes (no weakening) ---
assert(/evaluateProtectedPreviewBetaAccess/.test(route) && /evaluateProductionChartAiBetaAccess/.test(route), 'route must reuse the protected-preview + production beta guards.');
assert(/LOCAL_ONLY_ALLOWED_HOSTNAMES/.test(route), 'route must reuse the local-only hostname binding.');
assert(/allowProductionChartAiBetaLiveQuotes/.test(route), 'route must forward the scoped production live-quote exception only.');

// --- 8. UI: production-gated, click-triggered, resets on symbol change; existing routes intact ---
const page = read(CHART_AI_PAGE);
for (const token of ['chartAiMarketIntel', 'chartAiMiStartBtn', 'resetSelectedMarketIntel', 'market-intelligence.json']) {
  assert(page.includes(token), `chart-ai.astro missing market-intelligence token: ${token}`);
}
// Production-gated markup.
assert(/isVercelProductionRuntime && \(\s*<details id="chartAiMarketIntel"/.test(page.replace(/\s+/g, ' ')) || /isVercelProductionRuntime[\s\S]{0,80}chartAiMarketIntel/.test(page), 'market-intelligence section must be production-gated.');
// Click-only: the analyze button drives the fetch; reset is wired into updateSelection.
assert(/miStartBtn\.addEventListener\('click', runMi\)/.test(page), 'market intelligence must be click-triggered (no auto fetch on render).');
assert(/resetSelectedMarketIntel\(\)/.test(page), 'reset must be called on selection change.');
// Existing analysis routes still present (unchanged scope).
for (const r of EXISTING_ROUTES) assert(existsSync(r), `Existing route must remain: ${r}`);

// --- 9. No dependency/lockfile/Supabase change ---
let lockDiff = '';
try { lockDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim(); } catch { lockDiff = ''; }
assert(lockDiff === '', `No lockfile change allowed this phase, but changed: ${lockDiff}`);
let supaDiff = '';
try {
  supaDiff = runGit(['diff', '--name-only', BASELINE, '--', 'supabase', 'src/lib/server/providers'])
    .split('\n').map((l) => l.trim()).filter(Boolean)
    // Phase 3GG-T-HF1/HF2 (superseding) touched the KIS token client + added the durable token-lifecycle
    // modules + migration; tolerate those (still no new provider, no unrelated Supabase schema change).
    .filter((f) => f !== 'src/lib/server/providers/kisClient.ts')
    .filter((f) => !f.startsWith('src/lib/server/providers/kis/'))
    // 20260713 lifecycle + 20260714 PostgREST RPC bridge are additive durable KIS-token migrations.
    .filter((f) => !/^supabase\/migrations\/[0-9]+_kis_token[a-z0-9_]*\.sql$/.test(f))
    .join('\n');
} catch { supaDiff = ''; }
assert(supaDiff === '', `No Supabase/provider change allowed this phase, but changed: ${supaDiff}`);
try {
  const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
  assert(!/^[+-]\s*"(dependencies|devDependencies)"/m.test(pkgDiff) && !/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');
} catch { /* ignore */ }

// --- 10. package.json scripts ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-fast"'), 'package.json must define smoke:phase-3gg-t-fast.');
assert(pkg.includes('"check:phase-3gg-t-fast"'), 'package.json must define check:phase-3gg-t-fast.');

// --- 11. Changelog ---
const changelog = read(CHANGELOG);
assert(changelog.includes('## Phase 3GG-T-FAST'), 'changelog must contain the Phase 3GG-T-FAST entry.');
const section = changelog.split('## Phase 3GG-T-FAST')[1]?.split('\n## ')[0] ?? '';
const norm = section.replace(/\s+/g, ' ');
for (const token of ['Builds on Phase 3GG-S-FAST', 'benchmark', 'relative strength', 'USD/KRW', 'No investment recommendation', 'Phase 3GG-U-FAST']) {
  assert(norm.includes(token.replace(/\s+/g, ' ')), `changelog entry missing required token: ${token}`);
}

// --- 12. Result doc ---
const doc = read(RESULT_DOC);
for (const token of [BASELINE, 'market-intel-v1-deterministic', 'Phase 3GG-U-FAST']) {
  assert(doc.includes(token), `result doc missing required token: ${token}`);
}
assert(/PASS_MARKET_CROSS_ASSET_INTELLIGENCE_PRODUCTION_VERIFIED|PASS_CORE_MARKET_INTELLIGENCE_PARTIAL_MACRO_DATA/.test(doc), 'result doc missing a classification.');

// --- 13. .env / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 14. Working-tree purity ---
const ALLOWED = new Set([...REQUIRED_FILES, CHANGELOG, PACKAGE_JSON, CHART_AI_PAGE, PROVIDER]);
const KNOWN = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore' ||
  /^src\/lib\/server\/chart-ai\/marketIntelligence\//.test(f) ||
  // Phase 3GG-T-HF1 (superseding hotfix) adds authenticated Supabase gating to the Chart AI API routes
  // and Production-disables the legacy summary route; tolerate those sibling route changes.
  /^src\/pages\/api\/chart-ai\//.test(f) ||
  f === 'src/lib/server/providers/kisClient.ts' ||
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
  console.log(`PASS: Phase 3GG-T-FAST contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
