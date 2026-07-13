/**
 * Phase 3GG-T-HF1 contract checker — Chart AI Authentication Gate, Zero-Request Entry, UI Cleanup.
 *
 * Static, deterministic verification:
 *  - the smoke, checker, and result doc exist; package.json + changelog are wired;
 *  - Chart AI reuses the Portfolio Supabase session source and renders a real login gate; the workspace
 *    body is not rendered into the unauthenticated DOM; the deployed Chart AI API routes require an
 *    authenticated Supabase user (server-side, not CSS-only) and fail closed;
 *  - the legacy three-line summary is absent from the Production UI and the route is Production-disabled;
 *  - Portfolio Intelligence is removed from Chart AI (DOM + client init), while the separate /portfolio
 *    page is preserved; deterministic MK AI + Market Intelligence + real chart + similarity remain;
 *  - the KIS token client keeps cache-until-expiry + skew and adds single-in-flight issuance;
 *  - no trading/account endpoint added; no lockfile change; .env/.env.local/.vercel/.gitignore never
 *    staged; working tree stays within this phase's scope.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '1594ecb';
const CHART_AI = 'src/pages/chart-ai.astro';
const PORTFOLIO = 'src/pages/portfolio.astro';
const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const SUPABASE_ADMIN = 'src/lib/server/supabaseAdmin.ts';
const SUMMARY_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf1_chart_ai_auth_zero_request_ui_cleanup.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf1_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf1_chart_ai_auth_zero_request_ui_cleanup_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';
const AUTHED_ROUTES = [
  'src/pages/api/chart-ai/instruments/search.json.ts',
  'src/pages/api/chart-ai/market/ohlcv.json.ts',
  'src/pages/api/chart-ai/similarity.json.ts',
  'src/pages/api/chart-ai/mk-analysis.json.ts',
  'src/pages/api/chart-ai/market-intelligence.json.ts',
];
const REQUIRED_FILES = [CHART_AI, PORTFOLIO, KIS_CLIENT, SUPABASE_ADMIN, SUMMARY_ROUTE, ...AUTHED_ROUTES, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' });
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const page = read(CHART_AI);

// --- 2. Auth gate reuses the Portfolio session source; real gate, hidden body ---
assert(/from '\.\.\/lib\/supabase'/.test(page) && /getBrowserSupabaseClient/.test(page) && /getCurrentSession/.test(page), 'Chart AI must reuse the Portfolio Supabase browser session source.');
assert(/getBrowserSupabaseClient/.test(read(PORTFOLIO)), 'Portfolio page must use the same session source (parity anchor).');
assert(page.includes('runChartAiAuthGate') && /supa\.auth\.getSession\(\)/.test(page), 'Chart AI must perform a real Supabase session check.');
assert(page.includes('접속 필요') && page.includes('로그인이 필요합니다') && page.includes('chart-ai-auth-gate'), 'Chart AI must render the Portfolio-aligned lock gate.');
assert(page.includes("new CustomEvent('mk:open-auth')"), 'login CTA must open the shared auth modal.');
assert(/data-chart-ai-auth-body hidden/.test(page), 'workspace body must be hidden by default (not rendered into the unauthenticated DOM).');
assert(/if \(authed\) setup\(\);/.test(page), 'workspace init (the fetch owner) must run only for an authenticated session.');

// --- 3. Server routes are auth-protected (server-side, not CSS-only) and fail closed ---
assert(/export const validateUserFromBearerToken/.test(read(SUPABASE_ADMIN)), 'the reused Bearer-token validator must exist.');
for (const r of AUTHED_ROUTES) {
  const src = read(r);
  assert(/validateUserFromBearerToken/.test(src) && /auth\.status/.test(src), `route must require auth + fail closed: ${r}`);
}
const summary = read(SUMMARY_ROUTE);
assert(!/!localOwnerAllowed && !betaAccess\.allowed && !prodBetaAccess\.allowed/.test(summary) && /!localOwnerAllowed && !betaAccess\.allowed\b/.test(summary), 'summary route must be Production-disabled (production beta path removed).');
assert(/runLocalOnlyLlmRuntimeBridge/.test(summary), 'summary route must keep the frozen LLM prompt contract (bridge).');

// --- 4. Client attaches the Bearer token to every Chart AI fetch ---
assert(/chartAiAuthHeaders/.test(page) && /Authorization: `Bearer \$\{session\.access_token\}`/.test(page), 'client must attach the Supabase Bearer token to Chart AI fetches.');
assert((page.match(/chartAiAuthHeaders\(\)/g) || []).length >= 5, 'all Chart AI production fetches must send auth headers.');

// --- 5. Zero-request entry ---
assert(page.includes('종목을 검색해 선택하면 실제 차트를 불러옵니다.'), 'idle chart copy must be present.');
assert(!/if \(!sym\) \{\s*updateSelection\(DEFAULT_INSTRUMENT\)/.test(page), 'entry must not auto-select a default symbol.');
assert(page.includes('suggestedInstrument') && page.includes('loadSuggestedInstrument') && page.includes('이 종목 차트 불러오기'), '?symbol must be a click-to-load suggestion (no auto-fetch).');

// --- 6. Chart overlay + stock-card cleanup ---
assert(!page.includes('<div class="chart-plot-heading"') && !/<div class="chart-safety-note">/.test(page), 'in-plot overlays must be removed from the chart container.');
assert(page.includes('chart-real-meta') && page.includes('chartAiRealChartMeta'), 'chart data status must live in a below-plot metadata row.');
for (const s of [
  '실시간 지연 시세 기반의 실제 OHLCV 캔들·거래량 차트를 제공합니다.',
  '정식 기업 데이터 연동 전까지는 참고용 구조 예시로 제공됩니다.',
  '정식 기업 공시 데이터가 아닌 화면 구성용 요약 정보입니다.',
  '샘플 정보 · 실제 투자 판단용 정보가 아닙니다.',
]) assert(!page.includes(s), `obsolete stock-card copy must be removed: "${s.slice(0, 16)}…"`);

// --- 7. Three-line summary removed from Production; Portfolio Intelligence removed from Chart AI ---
assert(/!isVercelProductionRuntime[\s\S]{0,220}chartAiOwnerLocalKisLlmSummaryPanel/.test(page), 'summary panel must be gated out of the Production DOM.');
assert(!page.includes('chartAiPortfolioWorkspace') && !page.includes('data-pf-tab'), 'Portfolio Intelligence workspace must be removed from Chart AI DOM.');
assert(!page.includes('portfolio-intelligence') && !page.includes('recordSelectionForPortfolio'), 'Portfolio Intelligence client init + imports must be removed.');
assert(existsSync(PORTFOLIO), 'the separate /portfolio page must be preserved.');

// --- 8. Preserved features ---
assert(page.includes('chartAiSimilarityReal') && page.includes('/api/chart-ai/similarity.json'), 'similarity preserved.');
assert(page.includes('chartAiMkAiReal') && page.includes('MK AI 분석 시작') && page.includes('/api/chart-ai/mk-analysis.json'), 'deterministic MK AI preserved.');
assert(page.includes('chartAiMarketIntel') && page.includes('/api/chart-ai/market-intelligence.json'), 'Market Intelligence preserved.');
assert(page.includes('loadRealChart') && page.includes('/api/chart-ai/market/ohlcv.json'), 'real OHLCV chart preserved.');

// --- 9. KIS token client: authoritative reuse + single-flight ---
// Phase 3GG-T-HF2 SUPERSEDED the process-local cache/single-flight (accessTokenInFlight/
// issueKisAccessTokenNow/tokenCacheSkewMs) with a durable, shared token manager (L1 memory + L2
// Supabase store + distributed lease). The reuse + single-issuance guarantee now lives in the manager.
const kis = read(KIS_CLIENT);
assert(/createKisTokenManager/.test(kis) && /executeKisRequestWithToken/.test(kis), 'kisClient must route through the authoritative durable token manager (supersedes the old process guard).');
assert(/issueKisTokenFromEndpoint/.test(kis), 'kisClient must keep exactly one authoritative /oauth2/tokenP issuer.');
assert(!/console\.(log|info|debug|warn|error)\([^)]*(access_token|accessToken|appsecret|Bearer)/i.test(kis), 'token client must not log tokens/secrets.');

// --- 10. No forbidden endpoint / no lockfile change / no Supabase schema change ---
const surface = [page, ...AUTHED_ROUTES.map(read), summary].join('\n');
for (const pat of [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /\/api\/(order|account|balance|funds|portfolio\/trade|trading)\b/i]) {
  assert(!pat.test(surface), `surface must not reference forbidden endpoint ${pat}`);
}
let lockDiff = '';
try { lockDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim(); } catch { lockDiff = ''; }
assert(lockDiff === '', `No lockfile change allowed, but changed: ${lockDiff}`);
let supaDiff = '';
try { supaDiff = runGit(['diff', '--name-only', BASELINE, '--', 'supabase']).trim(); } catch { supaDiff = ''; }
assert(supaDiff === '', `No Supabase schema change allowed, but changed: ${supaDiff}`);
try {
  const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
  assert(!/^[+-]\s*"(dependencies|devDependencies)"/m.test(pkgDiff) && !/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');
} catch { /* ignore */ }

// --- 11. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf1"') && pkg.includes('"check:phase-3gg-t-hf1"'), 'package.json must define the phase scripts.');
const changelog = read(CHANGELOG);
assert(changelog.includes('## Phase 3GG-T-HF1 - 2026-07-13'), 'changelog must contain the Phase 3GG-T-HF1 entry.');
const section = changelog.split('## Phase 3GG-T-HF1')[1]?.split('\n## ')[0] ?? '';
const norm = section.replace(/\s+/g, ' ');
for (const token of ['Builds on Phase 3GG-T-FAST', 'Requires login', 'no provider calls', 'Removes Portfolio Intelligence from Chart AI', 'Preserves', 'Phase 3GG-U-FAST']) {
  assert(norm.includes(token.replace(/\s+/g, ' ')), `changelog entry missing token: ${token}`);
}
const doc = read(RESULT_DOC);
for (const token of [BASELINE, 'Classification', 'Baseline', 'KIS token', 'Zero-request', 'Phase 3GG-U-FAST']) {
  assert(doc.includes(token), `result doc missing token: ${token}`);
}
assert(/PASS_CHART_AI_AUTH_ZERO_REQUEST_UI_CLEANUP_PRODUCTION_VERIFIED|PASS_SOURCE_READY_PRODUCTION_DEPLOY_REQUIRED|BLOCKED_[A-Z_]+|STILL_BLOCKED_UNKNOWN/.test(doc), 'result doc must carry a classification.');

// --- 12. .env / .vercel / .gitignore never staged; no committed secrets ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');
let staged = [];
try { staged = runGit(['diff', '--cached', '--name-only']).split('\n').map((l) => l.trim()).filter(Boolean); } catch { staged = []; }
assert(!staged.includes('.env') && !staged.includes('.env.local') && !staged.some((f) => f === '.vercel' || f.startsWith('.vercel/')) && !staged.includes('.gitignore'), '.env/.env.local/.vercel/.gitignore must never be staged.');

// --- 13. Working-tree purity ---
const ALLOWED = new Set([...REQUIRED_FILES, CHANGELOG, PACKAGE_JSON]);
const KNOWN = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore' ||
  /^src\/pages\/api\/chart-ai\//.test(f) ||
  f === KIS_CLIENT ||
  /^scripts\/(smoke|check|owner_smoke)_phase_3gg_[a-z0-9_]+\.mjs$/.test(f) ||
  /^src\/lib\/server\/providers\/kis\//.test(f) ||
  /^supabase\/migrations\//.test(f) ||
  f === 'scripts/kis_token_lifecycle_testsrc.ts' ||
  /^docs\/planning\/phase_3gg_[a-z0-9_]+_result(_v[0-9.]+)?\.md$/.test(f);
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF1 contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
