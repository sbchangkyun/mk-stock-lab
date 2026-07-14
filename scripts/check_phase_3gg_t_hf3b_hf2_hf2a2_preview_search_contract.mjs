/**
 * Phase 3GG-T-HF3B-HF2-HF2A2 static contract checker — Preview alphanumeric-search Hotfix.
 *
 * Verifies the OAuth redirect preservation, the auth-gated search-response cache safety + master-version
 * header, and the search-client hardening (auth errors not disguised as zero results, explicit search
 * cancels debounce + uses the fresh page, query canonicalization), and re-asserts that the generated
 * master / generator / workflow / migrations / token / similarity / MK were NOT touched. Baseline = the
 * remediation commit b1dafbe.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = 'b1dafbe';

const GOOGLE_LOGIN = 'src/components/Auth/GoogleLogin.astro';
const SEARCH_ROUTE = 'src/pages/api/chart-ai/instruments/search.json.ts';
const PAGE = 'src/pages/chart-ai.astro';
const MASTER = 'src/data/chart-ai/universalInstrumentMaster.json';
const MANIFEST = 'src/data/chart-ai/universalInstrumentMaster.manifest.json';
const GENERATOR = 'scripts/generate_chart_ai_instrument_master.mjs';
const WORKFLOW = '.github/workflows/kis-instrument-master-refresh.yml';
const KIS_TOKEN_STORE = 'src/lib/server/chart-ai/kisTokenStore.ts';
const SIM_V2 = 'src/lib/chart-ai/similarity-explainability-v2.mjs';
const MKAI_V2 = 'src/lib/chart-ai/mk-agent-experience-v2.mjs';
const INTEGRITY = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf3b_hf2_hf2a2_preview_search_hotfix.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf3b_hf2_hf2a2_preview_search_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf3b_hf2_hf2a2_preview_alphanumeric_search_hotfix_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [GOOGLE_LOGIN, SEARCH_ROUTE, PAGE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };
const diffEmpty = (p) => runGit(['diff', BASELINE, '--', p]).trim() === '';

for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const login = read(GOOGLE_LOGIN);
const route = read(SEARCH_ROUTE);
const page = read(PAGE);

// --- 1. OAuth redirect preservation (CASE A) ---
assert(/\$\{window\.location\.origin\}\$\{window\.location\.pathname\}\$\{window\.location\.search\}/.test(login), 'GoogleLogin must build redirectTo from origin + pathname + search.');
assert(!/redirectTo:\s*window\.location\.origin\s*,/.test(login), 'GoogleLogin must not use origin-only redirectTo (the bug).');
assert(!/mkstocklab\.vercel\.app|mkstocklab-[a-z0-9]+-|sbchangkyun-2946s-projects\.vercel\.app/i.test(login), 'GoogleLogin must not hardcode a Production/Preview host.');
assert(!/window\.location\.hash/.test(login), 'GoogleLogin must not copy the URL hash (OAuth token fragment).');

// --- 2. Search route: auth-gated cache safety + master-version header ---
assert(/Cache-Control['"\]]?\s*:\s*['"]private, no-store['"]/.test(route), 'search route must be Cache-Control: private, no-store.');
assert(/Vary['"\]]?\s*:\s*['"]Authorization['"]/.test(route), 'search route must Vary on Authorization.');
assert(/X-MK-Instrument-Master-Version/.test(route) && /getUniversalMasterVersion\(\)/.test(route), 'search route must expose X-MK-Instrument-Master-Version.');
assert(!/public,\s*max-age/.test(route), 'search route must not use a public shared cache.');
assert(/validateUserFromBearerToken/.test(route) && /AUTH_REQUIRED/.test(route), 'search route must keep the fail-closed auth gate.');
assert(!/prerender\s*=\s*true/.test(route), 'search route must not be prerendered.');

// --- 3. Client hardening (chart-ai.astro) ---
assert(/lastSearchState/.test(page) && /SEARCH_STATE_MESSAGES/.test(page), 'search UI must track a search-outcome state.');
assert(/auth:\s*'로그인이 필요합니다/.test(page), 'auth outcome must show a login-required message, not "no results".');
// Phase 3GG-T-HF3B-HF2-HF2A3: response classification (401/403/AUTH_REQUIRED/AUTH_INVALID + data.ok +
// deployment-protection) moved into the transport helper (classifyChartAiResponse); runSearch now maps the
// classified state. The intent — auth/transport errors are never shown as zero results — is preserved.
assert(/state === 'APP_AUTH_REQUIRED' \|\| state === 'APP_AUTH_INVALID'/.test(page), 'runSearch must map app auth-error states.');
assert(/state === 'APP_AUTH_REQUIRED' \|\| state === 'APP_AUTH_INVALID' \? 'auth'/.test(page), 'runSearch must set the auth state on an auth error (no zero-results disguise).');
assert(/state === 'SUCCESS' \|\| state === 'NO_RESULTS'/.test(page), 'runSearch must render only on a classified successful/no-results response.');
assert(/window\.clearTimeout\(searchDebounceId\)/.test(page), 'explicit runSearch must cancel the pending debounce timer.');
assert(/const \{ ok, items \} = await runSearch\(true\)/.test(page) && /if \(ok && items\[0\]\) updateSelection\(items\[0\]\)/.test(page), 'explicit search must select from the fresh returned page (not the async global).');
assert(/normalizeQueryText/.test(page) && /\^\[0-9A-Za-z\]\{6\}\$/.test(page) && /toUpperCase\(\)/.test(page), 'client must canonicalize a six-char KR-like code to uppercase.');
assert(/Promise<\{ ok: boolean; items: any\[\] \}>/.test(page), 'runSearch must return the fresh page + outcome.');
// load-more still hidden on zero
assert(/loadMoreBtn\.hidden = !\(open && searchHasMore && visibleRecords\.length > 0\)/.test(page), 'load-more must stay hidden when there are zero results.');

// --- 4. Runtime invariants preserved ---
assert(!page.includes('시장 인텔리전스'), 'Market Intelligence UI must stay absent.');
assert(!page.includes('universalInstrumentMaster'), 'page must not embed the master.');
assert(/integrity\.beginAnalysis\(/.test(page) && !/DEFAULT_INSTRUMENT|selectedSymbol = '005930'/.test(page), 'HF3A guard intact; no Samsung default.');
assert(page.includes('similarity-explainability-v2.mjs') && page.includes('mk-agent-experience-v2.mjs'), 'Similarity V2 + MK Agent V2 still wired.');

// --- 5. Out-of-scope files must be UNCHANGED vs baseline (this is a targeted hotfix) ---
assert(diffEmpty(MASTER), 'generated master must be unchanged (root cause was not the master).');
assert(diffEmpty(MANIFEST), 'manifest must be unchanged.');
assert(diffEmpty(GENERATOR), 'generator must be unchanged.');
assert(diffEmpty(WORKFLOW), 'refresh workflow must be unchanged.');
assert(diffEmpty(KIS_TOKEN_STORE), 'KIS token store must be unchanged.');
assert(diffEmpty(SIM_V2) && diffEmpty(MKAI_V2), 'Similarity/MK modules must be unchanged.');
assert(diffEmpty(INTEGRITY), 'selected-symbol integrity must be unchanged.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'supabase/migrations']).trim() === '', 'no migration change.');
assert(runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json']).trim() === '', 'no lockfile change.');

// --- 6. No account/order/trading; no external LLM; no secret ---
for (const f of [GOOGLE_LOGIN, SEARCH_ROUTE]) {
  const body = read(f);
  for (const pat of [/inquire-balance/i, /order-cash/i, /\/trading\//i]) assert(!pat.test(body), `${f} must not add a forbidden endpoint.`);
  assert(!/sk-[A-Za-z0-9]{20,}/.test(body), `${f} must not embed a secret.`);
}

// --- 7. package.json scripts + docs ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf3b-hf2-hf2a2"') && pkg.includes('"check:phase-3gg-t-hf3b-hf2-hf2a2"'), 'package.json must define the HF2A2 scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF3B-HF2-HF2A2'), 'changelog must contain the HF2A2 entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['0000d0', 'redirect', 'cache', 'preview', 'root cause']) assert(doc.includes(t), `result doc missing token: ${t}`);

// --- 8. Working-tree purity ---
const ALLOWED = new Set([...REQUIRED_FILES, PAGE, CHANGELOG, PACKAGE_JSON,
  // The explicit-run-button assertion in the HF3B-HF4C checker was narrowly reconciled for the new
  // updateSelection(items[0]) pattern (still pending-only) — see that file's comment.
  'scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs',
  'docs/planning/phase_3gg_t_hf3b_hf2_premerge_remediation_preview_qa_result_v0.1.md']);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) => ALLOWED.has(f) || KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) || f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change: ${unexpected.join(', ')}`);

if (failures === 0) { console.log(`PASS: Phase 3GG-T-HF3B-HF2-HF2A2 contract checker (${assertions}/${assertions} assertions).`); process.exit(0); }
console.error(`FAILED: ${failures}/${assertions} assertions failed.`); process.exit(1);
