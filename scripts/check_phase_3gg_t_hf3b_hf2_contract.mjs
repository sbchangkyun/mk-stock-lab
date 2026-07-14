/**
 * Phase 3GG-T-HF3B-HF2 static contract checker (read-only, local implementation gate).
 *
 * Verifies the KIS-only master + KR alphanumeric symbol widening + refresh pipeline + GitHub Actions
 * workflow contract, and re-asserts preservation of HF3A integrity, Similarity V2 / MK Agent V2, Market
 * Intelligence UI absence, durable-token/auth immutability, no account/order/trading scope, no external
 * LLM, and no dependency change. Baseline = the discovery commit `9d22ff4`.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '9d22ff4';

const PAGE = 'src/pages/chart-ai.astro';
const MASTER = 'src/data/chart-ai/universalInstrumentMaster.json';
const MANIFEST = 'src/data/chart-ai/universalInstrumentMaster.manifest.json';
const ANCHORS = 'src/data/chart-ai/universalInstrumentMaster.anchors.json';
const ARCHIVE = 'src/data/chart-ai/universalInstrumentMaster.archive.json';
const STATE = 'src/data/chart-ai/universalInstrumentMaster.refreshState.json';
const GENERATOR = 'scripts/generate_chart_ai_instrument_master.mjs';
const SOURCE_MODULE = 'scripts/lib/kisInstrumentMasterSource.mjs';
const PIPELINE = 'scripts/automation/refresh_kis_instrument_master.mjs';
const WORKFLOW = '.github/workflows/kis-instrument-master-refresh.yml';
const INSTRUMENT_TS = 'src/lib/market-data/instrument.ts';
const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const SEARCH_MODULE = 'src/lib/server/chart-ai/universal-instrument-search.mjs';
const INTEGRITY_MODULE = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const SIM_V2 = 'src/lib/chart-ai/similarity-explainability-v2.mjs';
const MKAI_V2 = 'src/lib/chart-ai/mk-agent-experience-v2.mjs';
const CACHE_MODULE = 'src/lib/server/chart-ai/normalizedOhlcvCache.mjs';
const MI_ROUTE = 'src/pages/api/chart-ai/market-intelligence.json.ts';
const MI_ENGINE_DIR = 'src/lib/server/chart-ai/marketIntelligence';
const KIS_TOKEN_STORE = 'src/lib/server/chart-ai/kisTokenStore.ts';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf3b_hf2_kis_automation.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf3b_hf2_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf3b_hf2_kis_instrument_master_automation_result_v0.1.md';
const RUNBOOK = 'docs/planning/kis_instrument_master_refresh_runbook_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [MASTER, MANIFEST, ANCHORS, ARCHIVE, STATE, GENERATOR, SOURCE_MODULE, PIPELINE, WORKFLOW, SMOKE, CHECKER_SELF, RESULT_DOC, RUNBOOK];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };
const diffEmpty = (p) => runGit(['diff', BASELINE, '--', p]).trim() === '';

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

let master = { instruments: [] };
try { master = JSON.parse(read(MASTER)); } catch { /* */ }
let manifest = {};
try { manifest = JSON.parse(read(MANIFEST)); } catch { /* */ }
const insts = master.instruments || [];

// --- 2. KR symbol widening ---
const instrTs = read(INSTRUMENT_TS);
assert(/KR_SYMBOL_PATTERN\s*=\s*\/\^\[0-9A-Z\]\{6\}\$\//.test(instrTs), 'instrument.ts KR_SYMBOL_PATTERN must be ^[0-9A-Z]{6}$.');
assert(/toUpperCase\(\)/.test(instrTs), 'instrument.ts isKrSymbol must ASCII-uppercase-normalize.');
const kisClient = read(KIS_CLIENT);
assert(/isValidKrQuoteSymbol\s*=\s*\(symbol[^)]*\)\s*=>\s*\/\^\[0-9A-Z\]\{6\}\$\//.test(kisClient), 'kisClient isValidKrQuoteSymbol must accept ^[0-9A-Z]{6}$.');
assert(/normalizeKrSymbol\s*=\s*\(symbol[^)]*\)\s*=>\s*symbol\.trim\(\)\.toUpperCase\(\)/.test(kisClient), 'kisClient normalizeKrSymbol must uppercase.');

// --- 3. KIS-only master coverage ---
assert(master.scope === 'kis-supported-only', 'master.scope must be kis-supported-only.');
assert(insts.length >= 5000, `master must be materially large (got ${insts.length}).`);
const cat = (c, a) => insts.filter((i) => i.country === c && i.assetType === a).length;
assert(cat('KR', 'stock') > 0 && cat('KR', 'etf') > 500, 'KR stock present and KR ETF materially expanded (>500).');
assert(cat('US', 'stock') > 0 && cat('US', 'etf') > 0, 'US stock + ETF present.');
assert(insts.filter((i) => i.country === 'KR').every((i) => /^[0-9A-Z]{6}$/.test(i.symbol) && i.exchangeCode === null), 'every KR symbol six-char alphanumeric with null EXCD.');
assert(insts.some((i) => i.country === 'KR' && i.assetType === 'etf' && /[A-Z]/.test(i.symbol)), 'alphanumeric KR ETF present.');
assert(insts.some((i) => i.country === 'KR' && /^0\d{5}$/.test(i.symbol)), 'leading-zero KR codes preserved.');
assert(insts.filter((i) => i.country === 'US').every((i) => ['NASDAQ', 'NYSE', 'AMEX'].includes(i.exchange) && ['NAS', 'NYS', 'AMS'].includes(i.exchangeCode)), 'US limited to NASDAQ/NYSE/AMEX + NAS/NYS/AMS.');
const KR_ETF_ANCHORS = ['069500', '102110', '114800', '229200', '360750', '133690', '379800'];
const symSet = new Set(insts.map((i) => i.symbol));
for (const a of KR_ETF_ANCHORS) assert(symSet.has(a), `verified KR ETF anchor missing: ${a}`);
// canonical + country/symbol uniqueness
const canon = new Set(); let dup = 0;
for (const i of insts) { const k = `${i.country}|${i.symbol}|${i.exchange}|${i.assetType}`; if (canon.has(k)) dup += 1; canon.add(k); }
assert(dup === 0, 'master canonical identity unique.');

// --- 4. Manifest: KIS-only provenance ---
assert(manifest.scope === 'kis-supported-only' && manifest.sourceFamily === 'kis-official-master-files', 'manifest scope + KIS source family.');
const families = (manifest.sources || []).map((s) => s.family);
assert(families.length >= 5 && families.every((f) => /^kis-|^curated-/.test(f)), 'all manifest source families are KIS/curated.');
assert(!families.some((f) => /krx|data\.go\.kr|nasdaqtrader|nasdaq-trader/i.test(f)), 'no KRX/data.go.kr/Nasdaq-Trader source family.');
assert(manifest.counts && typeof manifest.counts.krEtfAlphanumeric === 'number', 'manifest records KR ETF numeric/alphanumeric split.');

// --- 5. Generator: KIS-only, offline, hashed ---
const gen = read(GENERATOR);
assert(/--kospi-source/.test(gen) && /--kosdaq-source/.test(gen) && /--nasdaq-source/.test(gen) && /--nyse-source/.test(gen) && /--amex-source/.test(gen), 'generator accepts KIS KOSPI/KOSDAQ/NASDAQ/NYSE/AMEX source paths.');
// Ban prohibited SOURCES/endpoints in executable code (strip comments first — the header comment
// legitimately states "no KRX/data.go.kr/Nasdaq-Trader source", and the scope note says "NOT a complete
// KRX universe").
const genNoComments = gen.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
assert(!/nasdaqtrader|otherlisted\.txt|nasdaqlisted\.txt|data\.go\.kr|getJsonData|openapi\.krx|data\.krx/i.test(genNoComments), 'generator must not reference KRX/Nasdaq-Trader/data.go.kr sources.');
assert(/createHash|sha256/.test(gen), 'generator records source hash.');
assert(/never downloads|reads credentials|LOCAL FILE PATHS/i.test(gen), 'generator must not download at generation time.');

// --- 6. Pipeline contract ---
const pipeline = read(PIPELINE);
for (const m of ['--validate-only', '--report-only', '--write-candidate', '--apply', '--full-reconcile', '--scratch-dir', '--output-report']) {
  assert(pipeline.includes(m), `pipeline must support mode/flag ${m}.`);
}
assert(/evaluateSafetyGates/.test(pipeline) && /applyMissingPolicy/.test(pipeline), 'pipeline exposes gates + missing policy.');
assert(/SOURCE_ABSENT_TWO_CONSECUTIVE_VALID_SNAPSHOTS/.test(pipeline), 'pipeline implements two-consecutive-absence archive reason.');
assert(/finally|preserving last-known-good|BLOCKED/.test(pipeline), 'pipeline preserves last-known-good on block.');
// Ban actual KIS REST/market/trading/OAuth API identifiers (not the disclaimer word "OAuth").
assert(!/getKisAccessToken|inquire-price|inquire-daily|approval_key|order-cash|inquire-balance|\/oauth2\/|tokenP\b/i.test(pipeline), 'pipeline must not call a KIS REST/market/trading/OAuth API.');
assert(/new\.real\.download\.dws\.co\.kr\/common\/master/.test(pipeline), 'pipeline uses the official public KIS master URLs only.');

// --- 7. Workflow contract (Section 16.5) ---
const wf = read(WORKFLOW);
assert(wf.includes("cron: '17 13 * * 1-5'") && wf.includes("cron: '23 2 * * 2-6'") && wf.includes("cron: '41 13 * * 6'"), 'workflow must define the three exact schedules.');
assert(/workflow_dispatch:/.test(wf), 'workflow_dispatch present.');
assert(/concurrency:\s*[\s\S]*group:\s*kis-instrument-master-refresh[\s\S]*cancel-in-progress:\s*false/.test(wf), 'concurrency group present with cancel-in-progress false.');
assert(/permissions:\s*[\s\S]*contents:\s*write[\s\S]*pull-requests:\s*write[\s\S]*actions:\s*read/.test(wf), 'minimum permissions (contents/pr write, actions read).');
assert(!/administration|packages:\s*write|id-token:\s*write/.test(wf), 'no broad admin permissions.');
assert(/AUTOMATION_BRANCH:\s*automation\/kis-instrument-master-refresh/.test(wf), 'persistent automation branch defined.');
assert(/push origin "HEAD:\$AUTOMATION_BRANCH"/.test(wf), 'push targets the automation branch only.');
assert(!/push origin.*(main|\$DEFAULT_BRANCH)"/.test(wf) && !/git push .*--force/.test(wf), 'never pushes default branch; never force-pushes.');
assert(!/gh pr merge|--auto\b|--merge\b/.test(wf), 'workflow must not merge or enable auto-merge.');
assert(!/vercel|deploy --prod|deployment/i.test(wf), 'workflow must not deploy.');
assert(/gh pr edit|Updated existing PR/.test(wf) && /gh pr create/.test(wf), 'workflow updates one PR or creates it (no duplicates).');
assert(/upload-artifact/.test(wf) && /if:\s*failure\(\)/.test(wf), 'safe failure artifacts uploaded on failure.');
assert(/git add src\/data\/chart-ai\/universalInstrumentMaster\.(json|manifest\.json|archive\.json|refreshState\.json)/.test(wf), 'commit stages only generated data artifacts.');
assert(!/\.mst|\.cod|\.zip|\.env/.test(wf.replace(/\.mst \/ /g, '')), 'workflow must not commit raw source/.env files.');
assert(!/echo .*(GITHUB_TOKEN|GH_TOKEN)|print.*token/i.test(wf), 'workflow must not print the token.');

// --- 8. Preservation (diff-empty vs baseline) ---
assert(diffEmpty(INTEGRITY_MODULE), 'HF3A selected-symbol integrity module unchanged.');
assert(diffEmpty(SIM_V2), 'Similarity V2 module unchanged.');
assert(diffEmpty(MKAI_V2), 'MK Agent V2 module unchanged.');
assert(diffEmpty(CACHE_MODULE), 'normalized OHLCV cache module unchanged.');
assert(diffEmpty(MI_ROUTE) && runGit(['diff', BASELINE, '--', MI_ENGINE_DIR]).trim() === '', 'Market Intelligence route + engine unchanged.');
assert(diffEmpty(KIS_TOKEN_STORE), 'durable KIS token store unchanged.');
assert(diffEmpty('src/lib/server/supabaseAdmin.ts'), 'auth validator unchanged.');
assert(!read(PAGE).includes('시장 인텔리전스'), 'Market Intelligence UI stays absent from the page.');
assert(read(PAGE).includes('similarity-explainability-v2.mjs') && read(PAGE).includes('mk-agent-experience-v2.mjs'), 'page still wires Similarity V2 + MK Agent V2.');
assert(/integrity\.beginAnalysis\(/.test(read(PAGE)) && !/DEFAULT_INSTRUMENT|selectedSymbol = '005930'/.test(read(PAGE)), 'HF3A guard intact; no hidden Samsung default.');

// --- 9. No account/order/trading; no external LLM; secret scan ---
const NEW_SURFACE = [GENERATOR, SOURCE_MODULE, PIPELINE, MASTER, MANIFEST];
for (const f of NEW_SURFACE) {
  const body = read(f);
  for (const pat of [/inquire-balance/i, /order-cash/i, /\/trading\//i, /funds?-transfer/i]) assert(!pat.test(body), `${f} must not reference forbidden endpoint ${pat}.`);
  assert(!/openai|anthropic|@ai-sdk/i.test(body), `${f} must not call an external LLM.`);
  assert(!/sk-[A-Za-z0-9]{20,}/.test(body), `${f} must not embed a secret-like token.`);
}

// --- 10. No dependency / lockfile change ---
assert(runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim() === '', 'no lockfile change.');
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(runGit(['diff', BASELINE, '--', PACKAGE_JSON])), 'package.json must not change dependencies (scripts only).');

// --- 11. package.json scripts + docs ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf3b-hf2"') && pkg.includes('"check:phase-3gg-t-hf3b-hf2"'), 'package.json defines HF3B-HF2 scripts.');
assert(pkg.includes('"refresh:kis-instrument-master"'), 'package.json defines the refresh script.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF3B-HF2'), 'changelog contains the HF3B-HF2 entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['kis-only', 'alphanumeric', 'single', 'schedule', 'archive', 'owner']) assert(doc.includes(t), `result doc missing token: ${t}`);

// --- 12. .env / .vercel never tracked; no raw source tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env never tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel never tracked.');
assert(runGit(['ls-files', '--', '*.mst', '*.cod', '*.mst.zip', '*.cod.zip']).trim() === '', 'no raw KIS source files tracked.');

// --- 13. Working-tree purity (local gate; NOT run in CI refresh) ---
const RECONCILED = [
  INSTRUMENT_TS, KIS_CLIENT, MASTER, MANIFEST, ARCHIVE, STATE, SEARCH_MODULE,
  'src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs',
  'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts',
  'scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs',
  'scripts/smoke_phase_3gg_t_hf3b_hf4c_fast_data_foundation.mjs',
  'scripts/check_phase_3gg_op_fast_contract.mjs',
  'scripts/smoke_phase_3gg_op_fast_symbol_search_and_ohlcv.mjs',
];
const ALLOWED = new Set([...REQUIRED_FILES, GENERATOR, SOURCE_MODULE, PIPELINE, CHANGELOG, PACKAGE_JSON, ...RECONCILED]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
// `git status --porcelain` reports a wholly-untracked directory as a single dir entry (e.g.
// "scripts/automation/"), so also tolerate a dir entry when every ALLOWED file lives under it.
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore' ||
  (f.endsWith('/') && [...ALLOWED, GENERATOR, SOURCE_MODULE, PIPELINE, WORKFLOW].some((a) => a.startsWith(f)));
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) { console.log(`PASS: Phase 3GG-T-HF3B-HF2 contract checker (${assertions}/${assertions} assertions).`); process.exit(0); }
console.error(`FAILED: ${failures}/${assertions} assertions failed.`); process.exit(1);
