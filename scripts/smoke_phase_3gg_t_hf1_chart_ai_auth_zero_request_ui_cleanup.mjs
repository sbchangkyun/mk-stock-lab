/**
 * Phase 3GG-T-HF1 deterministic smoke — Chart AI Authentication Gate, Zero-Request Entry, UI Cleanup.
 *
 * Credential-free, no network. Static source verification of the hotfix contract:
 *  - Chart AI uses the SAME Supabase browser-session source as the Portfolio page (no new auth scheme),
 *    renders the Portfolio-style lock gate when signed out, hides the workspace body by default, and
 *    only initializes the workspace (the sole owner of every fetch) for an authenticated session.
 *  - The deployed Chart AI API routes require an authenticated Supabase user (validateUserFromBearerToken)
 *    and fail closed; the client attaches the Bearer token to every Chart AI fetch.
 *  - Opening the page is zero-request: no auto-selected default symbol, no auto OHLCV/search/analysis
 *    fetch; a ?symbol only becomes a click-to-load suggestion.
 *  - Chart-overlapping labels are gone (moved to a below-plot metadata row); obsolete sample/scaffold
 *    stock-card copy is gone; the three-line MK AI 시세 요약 is absent from the Production DOM and the
 *    route is Production-disabled; the Portfolio Intelligence workspace is removed from Chart AI.
 *  - Deterministic MK AI analysis + Market Intelligence + real chart + similarity are preserved.
 *  - The KIS token client keeps cache-until-expiry + expiry skew and adds single-in-flight issuance.
 * Exits non-zero on any failure.
 */

import { existsSync, readFileSync } from 'node:fs';

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

const CHART_AI = 'src/pages/chart-ai.astro';
const PORTFOLIO = 'src/pages/portfolio.astro';
const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const SUPABASE_ADMIN = 'src/lib/server/supabaseAdmin.ts';
const SUMMARY_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const AUTHED_ROUTES = [
  'src/pages/api/chart-ai/instruments/search.json.ts',
  'src/pages/api/chart-ai/market/ohlcv.json.ts',
  'src/pages/api/chart-ai/similarity.json.ts',
  'src/pages/api/chart-ai/mk-analysis.json.ts',
  'src/pages/api/chart-ai/market-intelligence.json.ts',
];

const page = read(CHART_AI);
const portfolio = read(PORTFOLIO);
const kis = read(KIS_CLIENT);

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) passed += 1; else failed += 1; console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`); };

// ---- Authentication: same source as Portfolio, real gate, fail-closed routes ----
check('Chart AI imports the same Supabase browser session source as Portfolio', /from '\.\.\/lib\/supabase'/.test(page) && /getBrowserSupabaseClient/.test(page) && /getCurrentSession/.test(page));
check('Portfolio page uses the same Supabase browser session source (parity)', /getBrowserSupabaseClient/.test(portfolio));
check('Chart AI has a real auth gate (session check + boot)', page.includes('runChartAiAuthGate') && page.includes('bootChartAi') && /supa\.auth\.getSession\(\)/.test(page));
check('signed-out path renders the Portfolio-aligned lock card', page.includes('chart-ai-auth-gate') && page.includes('접속 필요') && page.includes('로그인이 필요합니다') && page.includes('🔐'));
check('login CTA opens the shared auth modal (mk:open-auth)', page.includes("new CustomEvent('mk:open-auth')"));
check('reacts to global auth-state changes', page.includes("addEventListener('mk:auth-state'"));
check('workspace body is hidden by default (not rendered into the unauthenticated DOM)', /data-chart-ai-auth-body hidden/.test(page));
check('setup() (the fetch owner) only runs for an authenticated session', /if \(authed\) setup\(\);/.test(page));

for (const r of AUTHED_ROUTES) {
  const src = read(r);
  check(`route requires auth + fails closed: ${r}`, /validateUserFromBearerToken/.test(src) && /auth\.status/.test(src));
}
check('summary route is Production-disabled (production beta path removed from the guard)', !/!localOwnerAllowed && !betaAccess\.allowed && !prodBetaAccess\.allowed/.test(read(SUMMARY_ROUTE)) && /!localOwnerAllowed && !betaAccess\.allowed\b/.test(read(SUMMARY_ROUTE)));
check('server auth reuses the existing Bearer-token validator (no new scheme)', /export const validateUserFromBearerToken/.test(read(SUPABASE_ADMIN)));

// ---- Client attaches the Bearer token to every Chart AI fetch ----
check('client builds Chart AI auth headers from the session token', /chartAiAuthHeaders/.test(page) && /Authorization: `Bearer \$\{session\.access_token\}`/.test(page));
check('ohlcv + search + similarity + mk-analysis + market-intel fetches send auth headers', (page.match(/chartAiAuthHeaders\(\)/g) || []).length >= 5);

// ---- Zero-request entry ----
check('idle chart copy present (no auto-load)', page.includes('종목을 검색해 선택하면 실제 차트를 불러옵니다.'));
check('no auto-select of a default symbol on entry', !/if \(!sym\) \{\s*updateSelection\(DEFAULT_INSTRUMENT\)/.test(page));
check('?symbol becomes a click-to-load suggestion, not an auto-fetch', page.includes('suggestedInstrument') && page.includes('loadSuggestedInstrument') && page.includes('이 종목 차트 불러오기'));
check('initProductionInstrument no longer auto-fetches OHLCV/search on load', /const initProductionInstrument = \(\) => \{/.test(page));

// ---- Chart overlay cleanup ----
check('in-plot period-label overlay markup removed', !page.includes('<div class="chart-plot-heading"') && !page.includes('<span id="chartAiChartPeriodLabel"'));
check('in-plot data-status overlay markup removed from the chart container', !/<div class="chart-safety-note">/.test(page));
check('chart data status moved to a below-plot metadata row', page.includes('chart-real-meta') && page.includes('chartAiRealChartMeta'));
check('source-note + as-of are outside the SVG plotting container', page.includes('chartAiRealChartSourceNote') && page.includes('chartAiRealChartAsOf'));

// ---- Stock information card cleanup (obsolete sample/scaffold copy gone) ----
const OBSOLETE = [
  '실시간 지연 시세 기반의 실제 OHLCV 캔들·거래량 차트를 제공합니다.',
  '정식 기업 데이터 연동 전까지는 참고용 구조 예시로 제공됩니다.',
  '정식 기업 공시 데이터가 아닌 화면 구성용 요약 정보입니다.',
  '샘플 정보 · 실제 투자 판단용 정보가 아닙니다.',
];
for (const s of OBSOLETE) check(`obsolete card copy removed: "${s.slice(0, 18)}…"`, !page.includes(s));

// ---- Three-line summary removed from Production; Portfolio Intelligence removed from Chart AI ----
check('three-line MK AI 시세 요약 panel is gated OUT of the Production DOM', /\{!isVercelProductionRuntime && \(\s*<section\s+id="chartAiOwnerLocalKisLlmSummaryPanel"/.test(page.replace(/\s+/g, ' ')) || /!isVercelProductionRuntime[\s\S]{0,220}chartAiOwnerLocalKisLlmSummaryPanel/.test(page));
check('Portfolio Intelligence workspace removed from Chart AI DOM', !page.includes('chartAiPortfolioWorkspace') && !page.includes('data-pf-tab'));
check('Portfolio Intelligence client init + imports removed', !page.includes('portfolio-intelligence') && !page.includes('recordSelectionForPortfolio'));
check('separate Portfolio page is untouched by this smoke target', existsSync(PORTFOLIO));

// ---- Preserved features ----
check('real similarity analysis preserved', page.includes('chartAiSimilarityReal') && page.includes('/api/chart-ai/similarity.json'));
check('deterministic MK AI analysis preserved', page.includes('chartAiMkAiReal') && page.includes('/api/chart-ai/mk-analysis.json') && page.includes('MK AI 분석 시작'));
check('Market Intelligence preserved', page.includes('chartAiMarketIntel') && page.includes('/api/chart-ai/market-intelligence.json'));
check('real OHLCV chart preserved', page.includes('/api/chart-ai/market/ohlcv.json') && page.includes('loadRealChart'));

// ---- KIS token client: authoritative reuse + single issuance (Phase 3GG-T-HF2 durable manager) ----
// T-HF2 superseded the process-local cache/single-flight with a durable shared token manager
// (L1 memory + L2 Supabase store + distributed lease). The reuse + single-issuance guarantee moved there.
check('kisClient routes through the durable token manager', /createKisTokenManager/.test(kis) && /executeKisRequestWithToken/.test(kis));
check('single authoritative /oauth2/tokenP issuer retained', /issueKisTokenFromEndpoint/.test(kis) && (kis.match(/\$\{config\.baseUrl\}\$\{tokenPath\}/g) || []).length === 1);
check('no token/secret logging introduced', !/console\.(log|info|debug|warn|error)\([^)]*(access_token|accessToken|appsecret|Bearer)/i.test(kis));

// ---- No forbidden endpoints / no recommendation regressions on the Chart AI surface ----
const surface = [page, ...AUTHED_ROUTES.map(read), read(SUMMARY_ROUTE)].join('\n');
const FORBIDDEN_ENDPOINTS = [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /\/api\/(order|account|balance|funds|portfolio\/trade|trading)\b/i];
for (const pat of FORBIDDEN_ENDPOINTS) check(`no forbidden endpoint ${pat}`, !pat.test(surface));

console.log('');
console.log(`SMOKE SUMMARY :: passed=${passed} failed=${failed} total=${passed + failed}`);
if (failed > 0) { console.error('SMOKE RESULT :: FAIL'); process.exit(1); }
console.log('SMOKE RESULT :: PASS');
