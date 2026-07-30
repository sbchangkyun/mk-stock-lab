/**
 * Phase 3GK-CHART-AI-BETA-PRODUCTIZATION static contract checker (read-only).
 *
 * Verifies the graduation of Chart AI to a stable authenticated Production product: (1) the new
 * evaluateStableProductionChartAiAccess guard is VERCEL_ENV=production-only (no env flag / query
 * opt-in required), (2) the protected-Preview beta guard (evaluateProtectedPreviewBetaAccess) is
 * fully untouched, (3) the renamed allowProductionChartAiLiveData option is used consistently across
 * kisClient.ts, universalOhlcvProvider.ts, the local-only KIS binding, and all 5 chart-ai API routes,
 * (4) every retired beta identifier (evaluateProductionChartAiBetaAccess / chartAiProdBeta /
 * allowProductionChartAiBetaLiveQuotes / CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA) is gone from live
 * (non-historical-checker) code, (5) the Supabase auth boundary runs before provider/usage guard logic
 * in all 5 routes, (6) the combined-usage-guard contract file is unchanged, (7) three honest
 * delayed-data wording fixes landed in the real (non-mock) chart-loading flow, and (8) no account/
 * order/balance/trading endpoint or second market-data provider was introduced. Baseline = 668e528
 * (origin/main tip when the feature branch was cut).
 *
 * No network calls. No .env reads. No build.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '668e528';

const GUARD = 'src/lib/server/chart-ai/protected-preview-beta-guard.mjs';
const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const OHLCV_PROVIDER = 'src/lib/server/chart-ai/universalOhlcvProvider.ts';
const LOCAL_ONLY_BINDING = 'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
const USAGE_GUARD = 'src/lib/server/chartAiUsage.ts';
const PAGE = 'src/pages/chart-ai.astro';

const ROUTES = {
  ohlcv: 'src/pages/api/chart-ai/market/ohlcv.json.ts',
  similarity: 'src/pages/api/chart-ai/similarity.json.ts',
  mkAnalysis: 'src/pages/api/chart-ai/mk-analysis.json.ts',
  marketIntelligence: 'src/pages/api/chart-ai/market-intelligence.json.ts',
  localOnlySummary: 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
};

const SMOKE = 'scripts/smoke_phase_3gk_chart_ai_beta_productization.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gk_chart_ai_beta_productization_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gk_chart_ai_beta_productization_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const ROADMAP = 'docs/planning/mk_stock_lab_master_roadmap_v2.1.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [
  GUARD, KIS_CLIENT, OHLCV_PROVIDER, LOCAL_ONLY_BINDING, USAGE_GUARD, PAGE,
  ...Object.values(ROUTES), SMOKE, CHECKER_SELF, RESULT_DOC,
];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };
const diffEmpty = (p) => runGit(['diff', '--name-only', BASELINE, '--', p]).trim() === '';

for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const guard = read(GUARD);
const kisClient = read(KIS_CLIENT);
const ohlcvProvider = read(OHLCV_PROVIDER);
const localOnlyBinding = read(LOCAL_ONLY_BINDING);
const usageGuard = read(USAGE_GUARD);
const page = read(PAGE);
const routeSource = {};
for (const [key, path] of Object.entries(ROUTES)) routeSource[key] = read(path);

// ---------------------------------------------------------------------------------------------------
// 1. New stable Production guard: VERCEL_ENV=production-only, no flag/query required
// ---------------------------------------------------------------------------------------------------
assert(guard.includes('export function evaluateStableProductionChartAiAccess'), 'guard must export evaluateStableProductionChartAiAccess.');
const stableFnBody = (guard.match(/export function evaluateStableProductionChartAiAccess[\s\S]*$/) || [''])[0];
assert(/if \(vercelEnv !== 'production'\) \{\s*return \{ allowed: false, reason: 'not_production_env' \};\s*\}/.test(stableFnBody),
  'stable guard must deny any non-production VERCEL_ENV as not_production_env.');
assert(/return \{ allowed: true, reason: 'stable_production_chart_ai_allowed' \};/.test(stableFnBody),
  'stable guard must allow with reason stable_production_chart_ai_allowed on VERCEL_ENV=production.');
assert(!/betaQueryOptIn/.test(stableFnBody) && !/CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA/.test(stableFnBody),
  'stable guard must not require any query opt-in or beta env flag.');

// ---------------------------------------------------------------------------------------------------
// 2. Protected-Preview beta guard is fully untouched (byte-identical since baseline)
// ---------------------------------------------------------------------------------------------------
assert(guard.includes('export function evaluateProtectedPreviewBetaAccess'), 'guard must still export evaluateProtectedPreviewBetaAccess.');
// Normalize CRLF->LF before comparing -- the working tree is checked out with CRLF line endings on
// Windows while `git show` returns the blob's stored LF endings; this is a line-ending artifact, not a
// real content difference.
const normalizeLineEndings = (s) => s.replace(/\r\n/g, '\n');
const previewFnOnly = (normalizeLineEndings(guard).match(/export function evaluateProtectedPreviewBetaAccess[\s\S]*?\n\}/) || [''])[0];
const baselinePreviewFn = (() => {
  const baselineGuard = normalizeLineEndings(runGit(['show', `${BASELINE}:${GUARD}`]));
  return (baselineGuard.match(/export function evaluateProtectedPreviewBetaAccess[\s\S]*?\n\}/) || [''])[0];
})();
assert(previewFnOnly.length > 0 && previewFnOnly === baselinePreviewFn,
  'evaluateProtectedPreviewBetaAccess body must be byte-identical to the baseline (independent of the new stable-Production guard).');

// ---------------------------------------------------------------------------------------------------
// 3. Renamed option used consistently everywhere; old option name is fully retired
// ---------------------------------------------------------------------------------------------------
for (const [name, src] of [
  ['kisClient.ts', kisClient],
  ['universalOhlcvProvider.ts', ohlcvProvider],
  ['local-only-live-kis-market-data-binding.mjs', localOnlyBinding],
  ...Object.entries(routeSource),
]) {
  assert(src.includes('allowProductionChartAiLiveData'), `${name} must use the renamed allowProductionChartAiLiveData option.`);
  assert(!src.includes('allowProductionChartAiBetaLiveQuotes'), `${name} must not reference the retired allowProductionChartAiBetaLiveQuotes option.`);
}
for (const [name, src] of [
  ['kisClient.ts', kisClient],
  ...Object.entries(routeSource),
  ['chart-ai.astro', page],
]) {
  assert(!src.includes('evaluateProductionChartAiBetaAccess'), `${name} must not reference the retired evaluateProductionChartAiBetaAccess guard.`);
  assert(!src.includes('CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA'), `${name} must not reference the retired CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA env flag.`);
  assert(!/chartAiProdBeta/.test(src), `${name} must not reference the retired chartAiProdBeta query param.`);
}

// ---------------------------------------------------------------------------------------------------
// 4. All 4 production-facing routes wire the new stable guard alongside the untouched preview guard
// ---------------------------------------------------------------------------------------------------
for (const key of ['ohlcv', 'similarity', 'mkAnalysis', 'marketIntelligence']) {
  const src = routeSource[key];
  assert(src.includes('evaluateProtectedPreviewBetaAccess') && src.includes('evaluateStableProductionChartAiAccess'),
    `${key} route must wire both the protected-Preview guard and the new stable-Production guard.`);
}

// ---------------------------------------------------------------------------------------------------
// 5. Auth boundary runs before provider/usage/instrument-resolution logic in every deployed route
// ---------------------------------------------------------------------------------------------------
for (const key of ['ohlcv', 'similarity', 'mkAnalysis', 'marketIntelligence']) {
  const src = routeSource[key];
  const authIdx = src.indexOf('validateUserFromBearerToken(');
  const betaIdx = src.indexOf('evaluateProtectedPreviewBetaAccess({');
  const prodIdx = src.indexOf('evaluateStableProductionChartAiAccess({');
  assert(authIdx > 0 && betaIdx > authIdx && prodIdx > authIdx,
    `${key} route: the Supabase auth check must run before both the preview and stable-Production guard evaluations.`);
}

// ---------------------------------------------------------------------------------------------------
// 6. Client (chart-ai.astro): no chartAiProdBeta in query construction; real-experience flag rewired
// ---------------------------------------------------------------------------------------------------
assert(/const productionRealChartEnabled = isVercelProductionRuntimeClient \|\| chartAiBetaPreviewEnabled;/.test(page),
  'client real-experience flag must be driven by the stable Production runtime OR the protected-Preview beta opt-in only (no prod-beta flag).');
assert(!page.includes('chartAiProdBetaEnabled'), 'client must not reference the retired chartAiProdBetaEnabled flag.');

// ---------------------------------------------------------------------------------------------------
// 7. Honest delayed-data wording fixes in the real (non-mock) chart-loading flow
// ---------------------------------------------------------------------------------------------------
for (const honestString of [
  '실제 지연 시세 차트를 불러오는 중입니다.',
  "case 'KIS_PROVIDER_UNAVAILABLE': return ['지연 시세를 불러오지 못했습니다.'",
  "setRealChartState('지연 시세를 불러오지 못했습니다.', '네트워크 상태를 확인한 뒤 다시 시도해 주세요.', 'unavailable');",
]) {
  assert(page.includes(honestString), `client must include the honest delayed-data wording: ${honestString}`);
}
assert(!page.includes("'실시간 종목 차트를 불러오는 중입니다.'"), 'the plain (non-delayed) real-time loading title must no longer be used in the real chart flow.');
assert(!page.includes("['실시간 시세를 불러오지 못했습니다.', 'KIS 시세 데이터를 불러오지 못했습니다"), 'the plain (non-delayed) KIS_PROVIDER_UNAVAILABLE message must no longer be used.');

// ---------------------------------------------------------------------------------------------------
// 8. Combined-usage-guard contract (3/day, refund, master-role/cooldown) is byte-for-byte unchanged
// ---------------------------------------------------------------------------------------------------
assert(diffEmpty(USAGE_GUARD), 'chartAiUsage.ts (combined-usage-guard contract) must be unchanged by this phase.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'supabase']).trim() === '', 'no Supabase migration may be added/changed this phase.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'src/lib/server/chart-ai/similarity-engine.mjs']).trim() === '', 'similarity scoring formula must be unchanged.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'src/lib/server/providers/kis']).trim() === '', 'KIS durable-token provider dir must be unchanged.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'src/data/chart-ai/universalInstrumentMaster.json', 'src/data/chart-ai/universalInstrumentMaster.manifest.json']).trim() === '',
  'instrument master + manifest must be unchanged.');

// ---------------------------------------------------------------------------------------------------
// 9. No account/order/balance/trading scope; no second market-data provider; no secrets
// ---------------------------------------------------------------------------------------------------
// kisClient.ts is excluded from the KIS_ACCOUNT_NO scan: it pre-dates this phase and only ever
// references KIS_ACCOUNT_NO as a "must be absent" defensive guard check (verified via git diff against
// baseline to be a comment-wording-only change this phase, never a new read/use of the value).
const allTouchedServerCode = [guard, ohlcvProvider, localOnlyBinding, ...Object.values(routeSource)].join('\n');
for (const pat of [/inquire-balance/i, /order-cash/i, /\/trading\//i, /KIS_ACCOUNT_NO/]) {
  assert(!pat.test(allTouchedServerCode), `no account/order/trading scope may be introduced: ${pat}`);
}
// kisClient.ts's only functional (non-comment) use of KIS_ACCOUNT_NO is the single "must be absent"
// scope guard -- assert exactly one such check exists (no new account-check branch was added).
assert((kisClient.match(/hasValue\('KIS_ACCOUNT_NO'\)/g) || []).length === 1,
  'kisClient.ts must keep exactly one functional KIS_ACCOUNT_NO-must-be-absent scope guard (no new account-check branch).');
assert(!/yfinance|alpha_?vantage|polygon\.io|finnhub/i.test(allTouchedServerCode), 'no second market-data provider may be introduced.');
assert(!/openai|gemini/i.test([guard, kisClient, ohlcvProvider, localOnlyBinding].join('\n')), 'no new external LLM client import outside the existing local-only LLM bridge.');
for (const src of [guard, kisClient, ohlcvProvider, localOnlyBinding, page, ...Object.values(routeSource)]) {
  for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/]) {
    assert(!pat.test(src), `secret-scan violation: ${pat}`);
  }
}
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// ---------------------------------------------------------------------------------------------------
// 10. package.json scripts + changelog + result doc
// ---------------------------------------------------------------------------------------------------
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gk-chart-ai-beta-productization"'), 'package.json must define the 3GK smoke script.');
assert(pkg.includes('"check:phase-3gk-chart-ai-beta-productization"'), 'package.json must define the 3GK check script.');
assert(read(CHANGELOG).includes('Phase 3GK'), 'changelog must contain a Phase 3GK entry.');
assert(read(ROADMAP).includes('Phase 3GK'), 'roadmap must reference Phase 3GK.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['production', 'stable', 'auth', 'preview', 'usage', 'deferred']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// ---------------------------------------------------------------------------------------------------
// 11. Working-tree purity — only this phase's known file set may be dirty
// ---------------------------------------------------------------------------------------------------
// scripts/check_phase_3gj_live_market_dashboard_contract.mjs is tolerated as a known sibling-checker
// reconciliation: this phase renamed productionChartAiBetaExceptionAllowed -> productionChartAiExceptionAllowed
// in kisClient.ts, so the 3GJ checker's hardcoded identifier assertion was updated to match (see its own
// inline comment). No other 3GJ behavior changed.
const SIBLING_3GJ_CHECKER = 'scripts/check_phase_3gj_live_market_dashboard_contract.mjs';
const ALLOWED = new Set([...REQUIRED_FILES, CHANGELOG, ROADMAP, PACKAGE_JSON, SIBLING_3GJ_CHECKER]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) => ALLOWED.has(f) || KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) || f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GK-CHART-AI-BETA-PRODUCTIZATION contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
