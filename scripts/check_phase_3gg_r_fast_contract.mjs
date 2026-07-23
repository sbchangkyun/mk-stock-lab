/**
 * Phase 3GG-R-FAST contract checker — Real MK AI Analysis Using Selected Instrument, OHLCV & Similarity.
 *
 * Static, deterministic verification:
 *  - the deterministic MK AI engine/scoring/formatter/types (.mjs) exist and are pure (no LLM, no
 *    network, no env, no randomness);
 *  - the formatter/engine contain NO prohibited recommendation/target-price/stop-loss/probability
 *    wording;
 *  - the MK AI route is guarded like the OHLCV/similarity routes, consumes real OHLCV + the real
 *    similarity engine + the deterministic analysis engine, and does NOT call the LLM;
 *  - the existing 3-line LLM summary route + bridge + model policy are UNCHANGED vs baseline (prompt
 *    contract kept, summary preserved);
 *  - chart-ai.astro replaced the MK AI preparing state with the real analysis UI;
 *  - no sample/synthetic import, no order/account/balance/trading endpoint, no secret/model/prompt
 *    exposure; .env/.env.local/.vercel never tracked; working tree in scope.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = 'a1c7c75';
const DIR = 'src/lib/server/chart-ai/mkAiAnalysis';
const TYPES = `${DIR}/analysisTypes.mjs`;
const SCORING = `${DIR}/analysisScoring.mjs`;
const ENGINE = `${DIR}/analysisEngine.mjs`;
const FORMATTER = `${DIR}/analysisFormatter.mjs`;
const ROUTE = 'src/pages/api/chart-ai/mk-analysis.json.ts';
const CHART_AI_PAGE = 'src/pages/chart-ai.astro';
const SMOKE = 'scripts/smoke_phase_3gg_r_fast_mk_ai_analysis.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_r_fast_contract.mjs';
const OWNER_SMOKE = 'scripts/owner_smoke_phase_3gg_r_fast_real_mk_ai_analysis.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_r_fast_real_mk_ai_analysis_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

// The prompt/contract owns the "3-line summary" behavior and lives in the LLM runtime bridge + model
// policy — those stay frozen. Phase 3GG-T-HF1 legitimately Production-disables the summary ROUTE (removes
// the production beta access path so the deployed Production UI cannot call it) WITHOUT rewriting the
// prompt or the summary contract, so the route file itself is no longer part of the frozen set. The
// route's prompt-contract wiring is re-verified below instead of frozen by diff.
const LLM_FROZEN = [
  'src/lib/server/chart-ai/local-only-llm-runtime-bridge.mjs',
  'src/lib/server/chart-ai/local-only-llm-model-policy.mjs',
];
const SUMMARY_ROUTE_FILE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';

const REQUIRED_FILES = [TYPES, SCORING, ENGINE, FORMATTER, ROUTE, CHART_AI_PAGE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' });
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

// --- 2. Engine/scoring/formatter purity ---
const engineSurface = [TYPES, SCORING, ENGINE, FORMATTER].map(read).join('\n');
assert(!/Math\.random/.test(engineSurface), 'analysis engine must not use randomness.');
assert(!/\bfetch\s*\(|process\.env|import\.meta\.env/.test(engineSurface), 'analysis engine must not touch network/env.');
assert(!/openai|OpenAI|runLocalOnlyLlmRuntimeBridge|CHART_AI_LLM|gpt-/i.test(engineSurface), 'analysis engine must not reference an LLM.');
assert(!/createMockedOhlcSeries|syntheticOhlcvFixture|SYNTH0|Mocked/.test(engineSurface), 'analysis engine must not import mock/synthetic data.');
assert(read(ENGINE).includes('runMkAiAnalysis') && read(FORMATTER).includes('formatMkAiAnalysis'), 'engine + formatter must export their entry points.');
assert(/MK_AI_ANALYSIS_METHOD_VERSION|mkai-v1-deterministic/.test(engineSurface), 'engine must expose a deterministic method version.');
// Required analysis dimensions present in the engine.
for (const dim of ['trend', 'momentum', 'volatility', 'similarity', 'scenario', 'risk']) {
  assert(read(ENGINE).includes(dim), `engine must produce the ${dim} dimension.`);
}
assert(read(FORMATTER).includes('technicalBullets') && read(FORMATTER).includes('conclusion'), 'formatter must produce technical bullets + conclusion.');

// --- 3. No prohibited wording in engine/formatter/types source ---
const PROHIBITED = ['목표가', '매수', '매도', '손절', '스탑로스', '진입', '청산', '상승 확률', '강력 매수', '매수하세요', '매도하세요', '보장합니다'];
const foundProhibited = PROHIBITED.filter((p) => engineSurface.includes(p));
assert(foundProhibited.length === 0, `analysis source must not contain prohibited wording: ${JSON.stringify(foundProhibited)}`);

// --- 4. Route: guarded, deterministic composition, no LLM ---
const route = read(ROUTE);
for (const token of ['evaluateProductionChartAiBetaAccess', 'fetchLongHistoryOhlcv', 'runRealSimilarity', 'runMkAiAnalysis', 'formatMkAiAnalysis', 'prodBetaAccess.allowed', 'INSUFFICIENT_HISTORY']) {
  assert(route.includes(token), `MK AI route missing required token: ${token}`);
}
assert(!/openai|OpenAI|runLocalOnlyLlmRuntimeBridge|CHART_AI_LLM/i.test(route), 'MK AI route must not call an LLM.');
assert(!/createMockedOhlcSeries|syntheticOhlcvFixture|SYNTH0|Mocked/.test(route), 'MK AI route must not use mock/synthetic data.');
const FORBIDDEN_ENDPOINTS = [/inquire-balance/i, /order-cash/i, /order-credit/i, /\/trading\//i, /inquire-account/i, /funds?-transfer/i, /portfolio-order/i];
for (const pat of FORBIDDEN_ENDPOINTS) assert(!pat.test(route + engineSurface), `MK AI surface must not reference forbidden endpoint ${pat}`);

// --- 5. Existing 3-line LLM summary contract UNCHANGED vs baseline ---
let llmDiff = '';
try { llmDiff = runGit(['diff', '--name-only', BASELINE, '--', ...LLM_FROZEN]).trim(); } catch { llmDiff = '<git diff failed>'; }
assert(llmDiff === '', `The existing LLM summary bridge/model-policy must remain unchanged (kept the 3-line summary + prompt contract), but changed: ${llmDiff}`);
// The summary route may be Production-disabled by a later phase, but must still wire the SAME prompt
// contract (the runtime bridge) and must not introduce an LLM model rewrite of its own.
const summaryRoute = read(SUMMARY_ROUTE_FILE);
assert(summaryRoute.includes('runLocalOnlyLlmRuntimeBridge'), 'summary route must still use the frozen LLM runtime bridge (prompt contract unchanged).');
assert(!/gpt-4|gpt-5|claude-|text-davinci|o1-preview|o1-mini/i.test(summaryRoute), 'summary route must not hardcode an LLM model.');

// --- 6. chart-ai.astro real MK AI UI ---
const page = read(CHART_AI_PAGE);
for (const token of ['chartAiMkAiReal', 'chartAiMkAiStartBtn', '/api/chart-ai/mk-analysis.json', 'resetSelectedMkAi', 'MK AI 분석 시작']) {
  assert(page.includes(token), `chart-ai.astro missing required token: ${token}`);
}
assert(!page.includes('OHLCV와 유사 패턴 결과를 결합한 확장 분석은 다음 단계에서 제공됩니다.'), 'chart-ai.astro must drop the MK AI preparing-state copy.');

// --- 7. Forbidden exposure across touched surface ---
const touched = [route, engineSurface, page].join('\n');
const FORBIDDEN_EXPOSURE = [/OPENAI_API_KEY\s*=\s*sk-/, /KIS_APP_SECRET\s*=\s*[A-Za-z0-9]/, /console\.log\([^)]*process\.env/, /gpt-4|gpt-3\.5|claude-3/i];
for (const pat of FORBIDDEN_EXPOSURE) assert(!pat.test(touched), `Touched source must not match forbidden exposure ${pat}`);

// --- 8. package.json scripts ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-r-fast"'), 'package.json must define smoke:phase-3gg-r-fast.');
assert(pkg.includes('"check:phase-3gg-r-fast"'), 'package.json must define check:phase-3gg-r-fast.');

// --- 9. Changelog ---
const changelog = read(CHANGELOG);
const section = changelog.split('## Phase 3GG-R-FAST')[1]?.split('\n## ')[0] ?? '';
assert(changelog.includes('## Phase 3GG-R-FAST'), 'changelog must contain the Phase 3GG-R-FAST entry.');
const norm = section.replace(/\s+/g, ' ');
for (const token of ['Builds on Phase 3GG-Q-FAST', 'deterministic MK AI analysis', 'keeps the existing 3-line', 'No LLM', 'No investment recommendation', 'Phase 3GG-S-FAST']) {
  assert(norm.includes(token.replace(/\s+/g, ' ')), `changelog entry missing required token: ${token}`);
}

// --- 10. Result doc ---
const doc = read(RESULT_DOC);
for (const token of ['PASS_REAL_MK_AI_ANALYSIS_PRODUCTION_VERIFIED', 'a1c7c75', 'mkai-v1-deterministic', 'Phase 3GG-S-FAST']) {
  assert(doc.includes(token), `result doc missing required token: ${token}`);
}

// --- 11. .env / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 12. Working-tree purity ---
const ALLOWED = new Set([...REQUIRED_FILES, OWNER_SMOKE, CHANGELOG, PACKAGE_JSON, CHART_AI_PAGE]);
const KNOWN = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore' ||
  /^src\/lib\/server\/chart-ai\//.test(f) ||
  /^src\/pages\/api\/chart-ai\//.test(f) ||
  f === 'src/lib/server/providers/kisClient.ts' ||
  /^src\/lib\/chart-ai\/portfolio-intelligence\//.test(f) ||
  /^scripts\/(smoke|check|owner_smoke)_phase_3gg_[a-z0-9_]+\.mjs$/.test(f) ||
  /^src\/lib\/server\/providers\/kis\//.test(f) ||
  /^supabase\/migrations\//.test(f) ||
  /^scripts\/[a-z0-9_]+_testsrc\.ts$/.test(f) ||
  /^src\/lib\/chart-ai\//.test(f) ||
  /^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(f) ||
  // Phase 3GG-U: new shared server usage-guard module (Similarity + MK Analysis daily limit).
  f === 'src/lib/server/chartAiUsage.ts';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-R-FAST contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
