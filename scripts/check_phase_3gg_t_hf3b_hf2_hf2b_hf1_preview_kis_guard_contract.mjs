/**
 * Phase 3GG-T-HF3B-HF2-HF2B-HF1 static contract checker (read-only).
 *
 * Verifies the protected-Preview KIS access guard hotfix: (1) the beta guard is VERCEL_ENV-authoritative
 * (a valid Vercel Preview with NODE_ENV=production is no longer fail-closed; Production stays fail-closed),
 * (2) the OHLCV route classifies the blocked stage into sanitized, non-secret codes + coarse headers with a
 * KIS readiness pre-check BEFORE any provider/token work, (3) the client maps each code to an honest Korean
 * message (no ambiguous access-rights catch-all), and (4) the KIS durable-token implementation, scoring
 * engine, master, and migrations are UNCHANGED. Baseline = the HF2B commit ca8a506.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = 'ca8a506';

const GUARD = 'src/lib/server/chart-ai/protected-preview-beta-guard.mjs';
const ROUTE = 'src/pages/api/chart-ai/market/ohlcv.json.ts';
const PAGE = 'src/pages/chart-ai.astro';
const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const KIS_TOKEN_STORE = 'src/lib/server/chart-ai/kisTokenStore.ts';
const INTEGRITY = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const SIM_ENGINE = 'src/lib/server/chart-ai/similarity-engine.mjs';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf3b_hf2_hf2b_hf1_preview_kis_guard_hotfix.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf3b_hf2_hf2b_hf1_preview_kis_guard_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf3b_hf2_hf2b_hf1_preview_kis_guard_hotfix_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [GUARD, ROUTE, PAGE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };
const diffEmpty = (p) => runGit(['diff', '--name-only', BASELINE, '--', p]).trim() === '';

for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const guard = read(GUARD);
const route = read(ROUTE);
const page = read(PAGE);

// --- 1. Guard: VERCEL_ENV-authoritative precedence; NODE_ENV must not override an explicit preview ---
assert(!/vercelEnv === 'production' \|\| nodeEnv === 'production'/.test(guard), 'the combined vercel||node production short-circuit (the bug) must be gone.');
assert(/if \(vercelEnv === 'production'\) \{\s*return \{ allowed: false, reason: 'production_fail_closed' \}/.test(guard), 'explicit Vercel production must fail closed first.');
assert(/if \(vercelEnv === 'preview'\) \{/.test(guard), 'the preview branch must be evaluated independently of NODE_ENV.');
// Inside the preview branch: flag + query still mandatory, then allow.
const previewBranch = (guard.match(/if \(vercelEnv === 'preview'\) \{[\s\S]*?return \{ allowed: true, reason: 'protected_preview_beta_allowed' \};\s*\}/) || [''])[0];
assert(/betaFlag !== 'true'/.test(previewBranch) && /betaQueryOptIn !== true/.test(previewBranch), 'preview branch must keep the flag + query as mandatory.');
assert(!/nodeEnv === 'production'/.test(previewBranch), 'the preview branch must not reject on NODE_ENV=production.');
// Fallbacks: non-empty other VERCEL_ENV -> not_preview_env; absent VERCEL_ENV + NODE=production -> fail-closed.
assert(/vercelEnv !== ''\)\s*\{\s*return \{ allowed: false, reason: 'not_preview_env' \}/.test(guard), 'any other explicit VERCEL_ENV value must deny not_preview_env.');
assert(/if \(nodeEnv === 'production'\) \{\s*return \{ allowed: false, reason: 'production_fail_closed' \}/.test(guard), 'absent VERCEL_ENV + NODE_ENV=production must fail closed.');
assert(/NODE_ENV represents the application BUILD\/RUNTIME mode|must NOT override an explicit VERCEL_ENV/.test(guard), 'guard must carry the explanatory NODE_ENV precedence comment.');
// Production evaluator must be untouched (still requires VERCEL_ENV=production).
assert(/vercelEnv !== 'production'\)\s*\{\s*return \{ allowed: false, reason: 'not_production_env' \}/.test(guard), 'the production beta evaluator must remain fail-closed and unchanged.');

// --- 2. OHLCV route: sanitized stage classification + readiness pre-check BEFORE provider/token ---
assert(/import \{ getKisQuoteConfigReadiness \} from '.*kisClient'/.test(route), 'route must import the read-only KIS readiness check.');
for (const code of ['PREVIEW_BETA_GUARD_BLOCKED', 'KIS_PREVIEW_GUARD_REQUIRED', 'KIS_DISABLED', 'KIS_CONFIG_MISSING', 'KIS_PROVIDER_UNAVAILABLE']) {
  assert(route.includes(code), `route must define sanitized code: ${code}`);
}
assert(/X-MK-Chart-AI-Access-Stage/.test(route) && /X-MK-KIS-Readiness-State/.test(route), 'route must expose the coarse access-stage + readiness-state headers.');
assert(/betaOptInPresent \? CHART_AI_ACCESS_CODE\.PREVIEW_BETA_GUARD_BLOCKED : CHART_AI_ACCESS_CODE\.NON_LOCAL_REQUEST/.test(route), 'guard-block must distinguish beta-opt-in from a plain non-local request.');
// Ordering: readiness pre-check + its early return must appear BEFORE the provider fetch (no token when blocked).
const readinessIdx = route.indexOf('getKisQuoteConfigReadiness({');
const readinessBlockIdx = route.indexOf('READINESS_BLOCKED');
const providerIdx = route.indexOf('fetchUniversalOhlcv({ instrument');
assert(readinessIdx > 0 && providerIdx > 0 && readinessIdx < providerIdx && readinessBlockIdx > 0 && readinessBlockIdx < providerIdx, 'readiness must be checked (and can block) BEFORE the provider/token fetch.');
assert(/sourceStatus: 'blocked'/.test(read(ROUTE)) || /blockedResponse\(range, code\)/.test(route), 'readiness/guard block must return a sanitized blocked response.');
// The headers must be fixed enums, never an env value (no readEnvValue output placed into a header).
assert(!/setHeader|headers\[[^\]]*\] = readServerEnvValue/.test(route), 'no env value may be written into a response header.');

// --- 3. Client: honest per-code messages; blocked is no longer the ambiguous access-rights catch-all ---
assert(/ohlcvStageMessage/.test(page), 'client must map the sanitized code to an honest message.');
assert(!/실시간 시세 접근 권한을 확인하는 중입니다\. 잠시 후 다시 시도해 주세요\.', 'error'\);/.test(page), 'the ambiguous access-rights catch-all string must no longer be the blocked fallback.');
for (const msg of ['Preview 차트 테스트 권한이 활성화되지 않았습니다.', 'Preview의 KIS 시세 조회 권한이 활성화되지 않았습니다.', 'Preview 시세 조회 설정을 확인하고 있습니다.', 'KIS 시세 데이터를 불러오지 못했습니다']) {
  assert(page.includes(msg), `client must include honest message: ${msg}`);
}
assert(/case 'PREVIEW_BETA_GUARD_BLOCKED'/.test(page) && /case 'KIS_PROVIDER_UNAVAILABLE'/.test(page), 'client must switch on the sanitized codes.');
// Do not expose internal env-variable names in the USER-FACING message copy (scoped to the stage-message
// function body — env names legitimately appear in the client's capability-gating code comments elsewhere).
const stageMsgBlock = (page.match(/const ohlcvStageMessage[\s\S]*?\n {12}\};/) || [''])[0];
for (const name of ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL', 'KIS_ENABLE_PREVIEW_LIVE_QUOTES', 'CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA']) {
  assert(!stageMsgBlock.includes(name), `UI copy must not expose the env variable name: ${name}`);
}

// --- 4. Immutability: token implementation, engine formula, master, migrations UNCHANGED ---
assert(diffEmpty(KIS_CLIENT), 'kisClient token/readiness implementation must be unchanged (guard fix only).');
assert(diffEmpty(KIS_TOKEN_STORE), 'KIS durable-token store must be unchanged.');
assert(diffEmpty(INTEGRITY), 'selected-symbol integrity must be unchanged.');
assert(diffEmpty(SIM_ENGINE), 'similarity engine (scoring formula) must be unchanged this phase.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'src/data/chart-ai/universalInstrumentMaster.json', 'src/data/chart-ai/universalInstrumentMaster.manifest.json']).trim() === '', 'instrument master + manifest must be unchanged.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'supabase', '.github/workflows']).trim() === '', 'migrations + workflow must be unchanged.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'src/lib/server/providers/kis']).trim() === '', 'KIS durable-token provider dir must be unchanged.');

// --- 5. No account/order scope; no secret; no dependency change ---
for (const pat of [/inquire-balance/i, /order-cash/i, /\/trading\//i, /KIS_ACCOUNT_NO/]) {
  assert(!pat.test(route), `route must not add account/order scope: ${pat}`);
}
for (const src of [guard, route, page]) {
  for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/]) {
    assert(!pat.test(src), `secret-scan violation: ${pat}`);
  }
}
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// --- 6. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf3b-hf2-hf2b-hf1"') && pkg.includes('"check:phase-3gg-t-hf3b-hf2-hf2b-hf1"'), 'package.json must define the HF2B-HF1 scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF3B-HF2-HF2B-HF1'), 'changelog must contain the HF2B-HF1 entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['guard', 'node_env', 'preview', 'readiness', 'token', 'blocked stage', 'owner']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// --- 7. Working-tree purity ---
// Phase 3GG-U added a shared usage guard in front of Similarity/MK Analysis (this checker's scope is the
// OHLCV route + Preview guard, not those two routes) and reconciled three sibling checkers' tolerance lists
// for its own new/changed files -- out of this checker's own scope to assert on.
const PHASE_3GG_U_FILES = [
  'src/lib/server/chartAiUsage.ts',
  'src/pages/api/chart-ai/analyze.ts',
  'src/pages/api/chart-ai/mk-analysis.json.ts',
  'src/pages/api/chart-ai/similarity.json.ts',
  'scripts/chart_ai_usage_testsrc.ts',
  'scripts/smoke_phase_3gg_u_chart_ai_usage.mjs',
  'scripts/check_phase_3gg_u_chart_ai_live_usage_guard_contract.mjs',
  'supabase/migrations/20260723_chart_ai_live_usage_guard.sql',
  'docs/planning/phase_3gg_u_chart_ai_live_usage_guard_result_v0.1.md',
  'scripts/check_phase_3gg_r_fast_contract.mjs',
  'scripts/check_phase_3gg_t_hf1_contract.mjs',
  'scripts/check_phase_3gg_t_hf3b_hf2_hf2b_similarity_explainability_contract.mjs',
];
const ALLOWED = new Set([...REQUIRED_FILES, ROUTE, PAGE, CHANGELOG, PACKAGE_JSON, ...PHASE_3GG_U_FILES]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) => ALLOWED.has(f) || KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) || f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF3B-HF2-HF2B-HF1 contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
