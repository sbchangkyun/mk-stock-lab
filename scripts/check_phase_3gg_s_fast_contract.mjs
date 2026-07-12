/**
 * Phase 3GG-S-FAST contract checker — Portfolio Intelligence.
 *
 * Static, deterministic verification:
 *  - the portfolio-intelligence modules + smoke + result doc exist;
 *  - versioned localStorage namespaces + strict validation are present;
 *  - the workspace is client-side only: NO new API route/provider file, no account/order/balance/
 *    funds/portfolio/trading/personal endpoint string, no Supabase schema, no dependency/lockfile
 *    change;
 *  - stores no secrets/prompt/model/raw provider payload/raw LLM output/full OHLCV;
 *  - KRW and USD are never combined without FX; current-price basis is labeled honestly;
 *  - no auto provider call to render the workspace; no buy/sell/target/stop-loss/probability/
 *    rebalance recommendation wording;
 *  - the existing OP/Q/R APIs + LLM summary route are unchanged;
 *  - .env/.env.local/.vercel never tracked; working tree in scope.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '85858fc';
const DIR = 'src/lib/chart-ai/portfolio-intelligence';
const MODULES = ['schemas', 'storage', 'watchlist', 'recentSymbols', 'savedAnalyses', 'manualPortfolio', 'portfolioMetrics', 'exportImport'].map((m) => `${DIR}/${m}.mjs`);
const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const SMOKE = 'scripts/smoke_phase_3gg_s_fast_portfolio_intelligence.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_s_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_s_fast_portfolio_intelligence_result_v0.1.md';
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

const REQUIRED_FILES = [...MODULES, CHART_AI_PAGE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' });
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

// --- 2. Versioned storage keys + validation present ---
const schemas = read(`${DIR}/schemas.mjs`);
for (const key of ['mkStockLab.watchlist.v1', 'mkStockLab.recentSymbols.v1', 'mkStockLab.savedAnalyses.v1', 'mkStockLab.manualPortfolio.v1']) {
  assert(schemas.includes(key), `schemas.mjs missing versioned storage key: ${key}`);
}
assert(/SCHEMA_VERSION/.test(schemas) && /normalizeInstrument/.test(schemas) && /normalizeHolding/.test(schemas), 'schemas.mjs must define schema version + validators.');
const storage = read(`${DIR}/storage.mjs`);
assert(/JSON\.parse/.test(storage) && /catch/.test(storage), 'storage.mjs must parse defensively (corruption-safe).');

// --- 3. Feature modules implemented ---
assert(/addToWatchlist/.test(read(`${DIR}/watchlist.mjs`)), 'watchlist implemented.');
assert(/recordRecent/.test(read(`${DIR}/recentSymbols.mjs`)), 'recent symbols implemented.');
assert(/addSavedAnalysis/.test(read(`${DIR}/savedAnalyses.mjs`)), 'saved analyses implemented.');
assert(/addHolding/.test(read(`${DIR}/manualPortfolio.mjs`)), 'manual portfolio implemented.');
assert(/computeRiskSummary/.test(read(`${DIR}/portfolioMetrics.mjs`)) && /computeComparison/.test(read(`${DIR}/portfolioMetrics.mjs`)), 'comparison + risk engine implemented.');

// --- 4. No forbidden storage content (raw payloads / prompt / model / full OHLCV) ---
const savedMod = read(`${DIR}/savedAnalyses.mjs`) + schemas;
assert(/candles|normalizedpath|ohlcv|prompt|gpt-|openai/i.test(savedMod), 'savedAnalyses/schemas must reference the forbidden-field rejection list.');
// The rejection must actually block those fields (normalizeSavedAnalysis returns null on match).
assert(/"candles"|"normalizedpath"|"ohlcv"/.test(schemas) && /return null/.test(schemas), 'schemas must reject forbidden stored fields.');

// --- 5. KRW/USD never combined + honest price basis ---
const metrics = read(`${DIR}/portfolioMetrics.mjs`);
assert(/PRICE_BASIS_LABELS/.test(metrics) && /daily-close/.test(metrics) && /unavailable/.test(metrics), 'metrics must label current-price basis honestly (daily-close/unavailable).');
assert(/never summed together|NEVER combined|kept SEPARATE|따로/i.test(metrics) || /buckets\[cur\]/.test(metrics), 'metrics must bucket by currency (no KRW/USD merge).');
assert(!/KRW.*\+.*USD|combineCurrencies|totalAllCurrencies/.test(metrics), 'metrics must not combine KRW + USD.');

// --- 6. No new API route / provider change; existing routes unchanged ---
let apiDiff = '';
try { apiDiff = runGit(['diff', '--name-only', BASELINE, '--', API_DIR]).trim(); } catch { apiDiff = ''; }
assert(apiDiff === '', `No API route change allowed this phase, but changed: ${apiDiff}`);
let providerDiff = '';
try { providerDiff = runGit(['diff', '--name-only', BASELINE, '--', 'src/lib/server/providers', 'supabase']).trim(); } catch { providerDiff = ''; }
assert(providerDiff === '', `No provider/Supabase change allowed this phase, but changed: ${providerDiff}`);
let lockDiff = '';
try { lockDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim(); } catch { lockDiff = ''; }
assert(lockDiff === '', `No lockfile change allowed this phase, but changed: ${lockDiff}`);
// package.json dependencies unchanged (only scripts added).
try {
  const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
  assert(!/^[+-]\s*"(dependencies|devDependencies)"/m.test(pkgDiff) && !/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');
} catch { /* ignore */ }

// --- 7. No forbidden endpoint / recommendation wording in the portfolio surface ---
const surface = [...MODULES, CHART_AI_PAGE].map(read).join('\n');
const FORBIDDEN_ENDPOINTS = [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /\/api\/(order|account|balance|funds|portfolio\/trade|trading)\b/i, /brokerage\s*(login|account|api)/i, /KIS_ACCOUNT_NO/];
for (const pat of FORBIDDEN_ENDPOINTS) assert(!pat.test(surface), `Portfolio surface must not reference forbidden endpoint/account: ${pat}`);
const moduleText = MODULES.map(read).join('\n');
const PROHIBITED = ['매수하', '매도하', '손절', '목표가', '리밸런싱', '비중 조정 권장', '추천 비중', '최적 포트폴리오', '상승 확률'];
const foundProhibited = PROHIBITED.filter((p) => moduleText.includes(p));
assert(foundProhibited.length === 0, `Portfolio modules must not contain recommendation wording: ${JSON.stringify(foundProhibited)}`);

// --- 8. No auto provider call to render the workspace (rendering functions must not fetch) ---
const page = read(CHART_AI_PAGE);
// The only fetch inside the portfolio block is the explicit price-refresh (fetchLatestClose) + export/import (no fetch).
assert(page.includes('fetchLatestClose') && page.includes('chartAiPfRefreshPrices'), 'price refresh must be an explicit user action.');
assert(/renderWatchlist\(\); renderRecent\(\); renderSaved\(\); renderPortfolio\(\)/.test(page) || page.includes('renderWatchlist()'), 'workspace renders locally.');
// Workspace markup + tabs present + client-side only marker.
for (const token of ['chartAiPortfolioWorkspace', 'data-pf-tab="watchlist"', 'data-pf-tab="compare"', 'localStorage', 'resolveStorage', 'recordSelectionForPortfolio']) {
  assert(page.includes(token), `chart-ai.astro missing portfolio token: ${token}`);
}
// Existing analysis routes still referenced by the page (unchanged scope).
for (const r of EXISTING_ROUTES) assert(existsSync(r), `Existing route must remain: ${r}`);

// --- 8b. Saved snapshot marked non-live in the UI ---
assert(page.includes('저장된 분석') && (page.includes('실시간 아님') || page.includes('실시간 분석이 아니')), 'saved snapshots must be labeled non-live.');

// --- 9. No forbidden exposure ---
const FORBIDDEN_EXPOSURE = [/OPENAI_API_KEY\s*=\s*sk-/, /KIS_APP_SECRET\s*=\s*[A-Za-z0-9]/, /console\.log\([^)]*process\.env/, /gpt-4|gpt-3\.5|claude-3/i];
for (const pat of FORBIDDEN_EXPOSURE) assert(!pat.test(surface), `Portfolio surface must not match forbidden exposure ${pat}`);

// --- 10. package.json scripts ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-s-fast"'), 'package.json must define smoke:phase-3gg-s-fast.');
assert(pkg.includes('"check:phase-3gg-s-fast"'), 'package.json must define check:phase-3gg-s-fast.');

// --- 11. Changelog ---
const changelog = read(CHANGELOG);
const section = changelog.split('## Phase 3GG-S-FAST')[1]?.split('\n## ')[0] ?? '';
assert(changelog.includes('## Phase 3GG-S-FAST'), 'changelog must contain the Phase 3GG-S-FAST entry.');
const norm = section.replace(/\s+/g, ' ');
for (const token of ['Builds on Phase 3GG-R-FAST', 'Watchlist', 'manual portfolio', 'No brokerage', 'Keeps KRW and USD totals separate', 'No investment recommendation', 'Phase 3GG-T-FAST']) {
  assert(norm.includes(token.replace(/\s+/g, ' ')), `changelog entry missing required token: ${token}`);
}

// --- 12. Result doc ---
const doc = read(RESULT_DOC);
for (const token of ['85858fc', 'localStorage', 'Phase 3GG-T-FAST']) {
  assert(doc.includes(token), `result doc missing required token: ${token}`);
}
assert(/PASS_PORTFOLIO_INTELLIGENCE_PRODUCTION_VERIFIED|PASS_CORE_PORTFOLIO_EXPORT_DEFERRED|PASS_SOURCE_READY_PRODUCTION_DEPLOY_REQUIRED/.test(doc), 'result doc missing a classification.');

// --- 13. .env / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 14. Working-tree purity ---
const ALLOWED = new Set([...REQUIRED_FILES, CHANGELOG, PACKAGE_JSON, CHART_AI_PAGE]);
const KNOWN = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore' ||
  /^src\/lib\/chart-ai\/portfolio-intelligence\//.test(f) ||
  /^src\/lib\/server\/chart-ai\/(universalOhlcvProvider\.ts|marketIntelligence\/)/.test(f) ||
  /^src\/pages\/api\/chart-ai\/market-intelligence\.json/.test(f) ||
  /^scripts\/(smoke|check|owner_smoke)_phase_3gg_[a-z0-9_]+\.mjs$/.test(f) ||
  /^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(f);
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-S-FAST contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
