/**
 * Phase 3GG-T-HF3B-HF2-HF2A3 static contract checker — protected Preview API transport hotfix.
 *
 * Verifies the authoritative same-origin authenticated fetch helper, migration of every protected
 * Chart AI call off `credentials: 'omit'`, the transport/response classification, the search diagnostics
 * + init-ready marker, and re-asserts that master / workflow / token / migrations were NOT touched.
 * Baseline = the HF2A2 commit e922cc4.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = 'e922cc4';

const HELPER = 'src/lib/chart-ai/chart-ai-authenticated-fetch.ts';
const PAGE = 'src/pages/chart-ai.astro';
const SEARCH_ROUTE = 'src/pages/api/chart-ai/instruments/search.json.ts';
const MASTER = 'src/data/chart-ai/universalInstrumentMaster.json';
const MANIFEST = 'src/data/chart-ai/universalInstrumentMaster.manifest.json';
const ARCHIVE = 'src/data/chart-ai/universalInstrumentMaster.archive.json';
const STATE = 'src/data/chart-ai/universalInstrumentMaster.refreshState.json';
const GENERATOR = 'scripts/generate_chart_ai_instrument_master.mjs';
const WORKFLOW = '.github/workflows/kis-instrument-master-refresh.yml';
const KIS_TOKEN_STORE = 'src/lib/server/chart-ai/kisTokenStore.ts';
const INTEGRITY = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf3b_hf2_hf2a3_preview_transport_hotfix.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf3b_hf2_hf2a3_preview_transport_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf3b_hf2_hf2a3_preview_transport_hotfix_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [HELPER, PAGE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };
const diffEmpty = (p) => runGit(['diff', BASELINE, '--', p]).trim() === '';

for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const helper = read(HELPER);
const page = read(PAGE);

// --- 1. Helper transport contract ---
assert(/export const chartAiAuthenticatedFetch/.test(helper), 'helper must export chartAiAuthenticatedFetch.');
assert(/export const fetchChartAiJson/.test(helper) && /export const classifyChartAiResponse/.test(helper), 'helper must export fetchChartAiJson + classifyChartAiResponse.');
assert(/credentials:\s*['"]same-origin['"]/.test(helper), "helper must use credentials: 'same-origin'.");
// strip comments (the header comment legitimately explains the old credentials: 'omit' root cause)
const helperNoComments = helper.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/^\s*\*.*$/gm, '');
assert(!/credentials:\s*['"](omit|include)['"]/.test(helperNoComments), 'helper must not use omit/include credentials.');
assert(/new Headers\(init\.headers\)/.test(helper), 'helper must merge headers via new Headers(init.headers).');
assert(/getCurrentSession/.test(helper) && /Authorization/.test(helper) && /Bearer/.test(helper), 'helper must attach the Supabase Bearer token from the session.');
assert(/resolved\.origin !== origin/.test(helper) && /cross-origin/.test(helper), 'helper must reject a cross-origin target.');
assert(!/console\.(log|info|warn|error)\([^)]*(token|Authorization|cookie|session|access_token)/i.test(helper), 'helper must not log tokens/cookies/session.');
assert(!/let\s+\w*[tT]oken|const\s+cachedToken|globalThis\.\w*token/i.test(helper), 'helper must not cache the access token in module state.');
assert(/\.\.\.init/.test(helper), 'helper must preserve caller RequestInit (method/body/signal).');

// --- 2. Response classification states present ---
for (const s of ['SUCCESS', 'NO_RESULTS', 'APP_AUTH_REQUIRED', 'APP_AUTH_INVALID', 'PREVIEW_DEPLOYMENT_AUTH_REQUIRED', 'API_RESPONSE_INVALID', 'API_REQUEST_FAILED']) {
  assert(helper.includes(s), `helper must define transport state ${s}.`);
}
assert(/redirected/.test(helper) && /text\/html/.test(helper), 'classifier must detect off-origin redirect + HTML (deployment protection).');

// --- 3. Page migration: no protected fetch uses credentials: omit; all use the helper ---
assert(/import \{ chartAiAuthenticatedFetch, fetchChartAiJson \} from '\.\.\/lib\/chart-ai\/chart-ai-authenticated-fetch'/.test(page), 'page must import the transport helper.');
// no credentials:'omit' remains in executable code (comments referencing it are allowed)
const pageNoComments = page.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
assert(!/credentials:\s*['"]omit['"]/.test(pageNoComments), "no protected Chart AI fetch may keep credentials: 'omit'.");
// each protected route now goes through the helper
assert(/fetchChartAiJson\(\s*`\/api\/chart-ai\/instruments\/search\.json/.test(page), 'instrument search must use fetchChartAiJson.');
assert(/chartAiAuthenticatedFetch\(`\/api\/chart-ai\/instruments\/search\.json\?\$\{buildSearchParams\(offsetToLoad\)/.test(page), 'load-more must use the helper.');
assert(/chartAiAuthenticatedFetch\(`\/api\/chart-ai\/instruments\/search\.json\?\$\{params/.test(page), 'suggested-instrument search must use the helper.');
assert(/chartAiAuthenticatedFetch\(`\/api\/chart-ai\/market\/ohlcv\.json/.test(page), 'OHLCV must use the helper.');
assert(/chartAiAuthenticatedFetch\(url, \{ method: 'GET', signal \}\)/.test(page), 'Similarity + MK Analysis must use the helper.');
// no bare fetch remains on the protected JSON routes
assert(!/fetch\(`\/api\/chart-ai\/(instruments|market\/ohlcv|similarity\.json|mk-analysis)/.test(page), 'no bare fetch may remain on a protected Chart AI JSON route.');

// --- 4. Search diagnostics + transport message + init marker ---
for (const a of ['data-chart-ai-search-state', 'data-chart-ai-search-http-status', 'data-chart-ai-search-master-version', 'data-chart-ai-search-request-host']) {
  assert(page.includes(a), `search UI must expose diagnostic attribute ${a}.`);
}
assert(/setSearchDiagnostics/.test(page), 'search must set transport diagnostics.');
assert(/transport:\s*'Preview 접근 인증/.test(page), 'search must show a deployment-protection transport message (not zero results).');
assert(/state === 'PREVIEW_DEPLOYMENT_AUTH_REQUIRED' \? 'transport'/.test(page), 'search must map deployment-protection to the transport state.');
assert(/data-chart-ai-search-ready/.test(page) && /if \(typeof chartAiAuthenticatedFetch === 'function'\)/.test(page), 'search-ready marker must be set only after listeners bound + helper available.');
// diagnostics must not expose secrets
assert(!/data-chart-ai-search-[a-z-]*.*(Authorization|access_token|cookie|Bearer)/i.test(page), 'diagnostic attributes must not expose secrets.');

// --- 5. Preserved HF2A2 behaviors ---
assert(/window\.clearTimeout\(searchDebounceId\)/.test(page), 'explicit search must still cancel the debounce.');
assert(/normalizeQueryText/.test(page), 'query canonicalization retained.');
assert(/if \(ok && items\[0\]\) updateSelection\(items\[0\]\)/.test(page), 'explicit search selects from the fresh page.');
const route = read(SEARCH_ROUTE);
assert(/private, no-store/.test(route) && /Vary/.test(route) && /X-MK-Instrument-Master-Version/.test(route), 'search route cache-safety + master-version header retained.');
assert(/validateUserFromBearerToken/.test(route), 'search route stays fail-closed.');

// --- 6. Runtime invariants ---
assert(!page.includes('시장 인텔리전스'), 'Market Intelligence UI stays absent.');
assert(!page.includes('universalInstrumentMaster'), 'page must not embed the master.');
assert(/integrity\.beginAnalysis\(/.test(page) && !/DEFAULT_INSTRUMENT|selectedSymbol = '005930'/.test(page), 'HF3A guard intact; no Samsung default.');

// --- 7. Out-of-scope files unchanged vs baseline ---
assert(diffEmpty(MASTER) && diffEmpty(MANIFEST) && diffEmpty(ARCHIVE) && diffEmpty(STATE), 'generated master/manifest/archive/state must be unchanged.');
assert(diffEmpty(GENERATOR), 'generator unchanged.');
assert(diffEmpty(WORKFLOW), 'refresh workflow unchanged.');
assert(diffEmpty(KIS_TOKEN_STORE), 'KIS token store unchanged.');
assert(diffEmpty(INTEGRITY), 'selected-symbol integrity unchanged.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'supabase/migrations']).trim() === '', 'no migration change.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json']).trim() === '', 'no lockfile change.');

// --- 8. No secret; no account/order/trading in new surface ---
for (const f of [HELPER]) {
  const body = read(f);
  assert(!/sk-[A-Za-z0-9]{20,}/.test(body), `${f} must not embed a secret.`);
  for (const pat of [/inquire-balance/i, /order-cash/i, /\/trading\//i]) assert(!pat.test(body), `${f} must not add a forbidden endpoint.`);
}

// --- 9. package.json scripts + docs ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf3b-hf2-hf2a3"') && pkg.includes('"check:phase-3gg-t-hf3b-hf2-hf2a3"'), 'package.json must define HF2A3 scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF3B-HF2-HF2A3'), 'changelog must contain the HF2A3 entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['credentials', 'same-origin', 'deployment protection', 'root cause', 'transport']) assert(doc.includes(t), `result doc missing token: ${t}`);

// --- 10. Working-tree purity ---
const ALLOWED = new Set([...REQUIRED_FILES, PAGE, SEARCH_ROUTE, CHANGELOG, PACKAGE_JSON,
  // Sibling checkers narrowly reconciled: response classification moved into the transport helper (HF2A2
  // checker) and protected fetches now use the helper's auth (HF1 checker).
  'scripts/check_phase_3gg_t_hf3b_hf2_hf2a2_preview_search_contract.mjs',
  'scripts/check_phase_3gg_t_hf1_contract.mjs',
  'docs/planning/phase_3gg_t_hf3b_hf2_hf2a2_preview_alphanumeric_search_hotfix_result_v0.1.md',
  'docs/planning/phase_3gg_t_hf3b_hf2_premerge_remediation_preview_qa_result_v0.1.md']);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) => ALLOWED.has(f) || KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) || f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change: ${unexpected.join(', ')}`);

if (failures === 0) { console.log(`PASS: Phase 3GG-T-HF3B-HF2-HF2A3 contract checker (${assertions}/${assertions} assertions).`); process.exit(0); }
console.error(`FAILED: ${failures}/${assertions} assertions failed.`); process.exit(1);
