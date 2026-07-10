// Phase 3GG-F-FAST smoke: local-only Chart AI KIS current_price UX polish.
// Static-source-only smoke (no server start, no network call). Re-checks the
// Phase 3GG-E-INTEGRATE contract (panel gating, route scope, adapter allowlist)
// still holds after this phase's presentational edits, and adds targeted checks
// for the new UX-polish content: endpoint/symbol meta, safety notices, readable
// unavailable/error copy, formatted currentPrice/volume, and absence of raw
// payload / credential / forbidden-investment / LLM-handoff content in the new
// markup and script additions.

import assert from 'node:assert/strict';
import fs from 'node:fs';

import { ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS } from '../src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';

const ROUTE_FILE = 'src/pages/api/chart-ai/local-only-kis-current-price.json.ts';
const ADAPTER_FILE = 'src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';
const CHART_AI_PAGE = 'src/pages/chart-ai.astro';

const FORBIDDEN_RAW_PAYLOAD_KEYS = ['rt_cd', 'stck_prpr', 'acml_vol', 'prdy_vrss', 'prdy_ctrt'];

const FORBIDDEN_CREDENTIAL_TOKENS = [
  'KIS_APP_SECRET',
  'KIS_APP_KEY',
  'access_token',
  'appsecret',
  'appkey',
  'Authorization',
  'Bearer',
];

const FORBIDDEN_ENDPOINT_TOKENS = [
  'order',
  'cancel_order',
  'modify_order',
  'account',
  'balance',
  'funds',
  'buying_power',
  'sellable_quantity',
  'profit_loss',
  'deposit_withdrawal',
  'trading_history',
  'portfolio',
  'personal',
];

const FORBIDDEN_INVESTMENT_LANGUAGE = [
  '매수하세요',
  '매도하세요',
  '지금 진입',
  '목표가는',
  '손절가는',
  '강력 추천',
  '상승이 확정',
  '하락이 확정',
];

const FORBIDDEN_LLM_TOKENS = ['api.openai.com', 'anthropic.com', 'generativelanguage.googleapis.com', 'gpt-', 'chatCompletion'];

const AUTO_RUN_TOKENS = ['mk-agent', 'mkAgent', 'similar-pattern-agent', 'similarPatternAgent'];

let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  assert.ok(condition, message);
};
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.equal(actual, expected, message);
};

// --- Adapter: allowlist contract unchanged -----------------------------------

check(fs.existsSync(ADAPTER_FILE), `${ADAPTER_FILE} must exist.`);
equal(ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS.length, 11, 'adapter allowlist must still contain exactly 11 fields.');
for (const field of [
  'symbol',
  'market',
  'currentPrice',
  'volume',
  'timestamp',
  'sourceStatus',
  'cacheStatus',
  'sanitizedErrorCode',
  'providerLabel',
  'integrationMode',
  'warnings',
]) {
  check(ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS.includes(field), `adapter allowlist must still include "${field}".`);
}

// --- Route: current_price only, opt-in required, sanitized context only ------

check(fs.existsSync(ROUTE_FILE), `${ROUTE_FILE} must exist.`);
const routeSource = fs.readFileSync(ROUTE_FILE, 'utf8');

check(routeSource.includes("category: 'current_price'"), 'route must still only ever request the current_price category.');
check(
  routeSource.includes("searchParams.get('ownerLocalKisIntegration') === '1'"),
  'route must still require the explicit ownerLocalKisIntegration=1 opt-in.',
);
check(
  routeSource.includes('createChartAiKisMarketDataContext'),
  'route must still build its response through the sanitized context adapter.',
);
for (const token of FORBIDDEN_ENDPOINT_TOKENS) {
  check(!routeSource.toLowerCase().includes(token), `route source must not reference forbidden endpoint token: ${token}`);
}

// --- Chart AI UI: locate this phase's touched regions -------------------------

check(fs.existsSync(CHART_AI_PAGE), `${CHART_AI_PAGE} must exist.`);
const pageSource = fs.readFileSync(CHART_AI_PAGE, 'utf8');

const panelSectionStart = pageSource.indexOf('id="chartAiOwnerLocalKisIntegrationPanel"');
check(panelSectionStart !== -1, 'panel section must exist in page source.');
const panelSectionEnd = pageSource.indexOf('</section>', panelSectionStart);
const panelSectionMarkup = pageSource.slice(panelSectionStart, panelSectionEnd);

const gatingBlockStart = pageSource.indexOf('const ownerLocalKisIntegrationOptIn =');
check(gatingBlockStart !== -1, 'gating logic block must exist in page source.');
const gatingBlockEnd = pageSource.indexOf("authGateCta?.addEventListener('click'", gatingBlockStart);
const gatingBlockMarkup = pageSource.slice(gatingBlockStart, gatingBlockEnd);

const clickHandlerBlockStart = pageSource.indexOf(
  '// Owner-local KIS current_price -> Chart AI context execution panel (Phase',
);
check(clickHandlerBlockStart !== -1, 'click-handler block must exist in page source.');
const clickHandlerBlockEnd = pageSource.indexOf(
  '// Owner-local auth/usage runtime bridge verification panel (Phase 3FB-E).',
  clickHandlerBlockStart,
);
const clickHandlerBlockMarkup = pageSource.slice(clickHandlerBlockStart, clickHandlerBlockEnd);

const newPanelContent = panelSectionMarkup + gatingBlockMarkup + clickHandlerBlockMarkup;

// --- 1. Gate presence: hidden by default, localhost AND opt-in required -------

check(panelSectionMarkup.includes('hidden'), 'panel must be hidden by default in markup.');
check(
  gatingBlockMarkup.includes("chartAiQuery.get('ownerLocalKisIntegration') === '1'"),
  'gating logic must require the explicit ownerLocalKisIntegration=1 opt-in.',
);
check(
  gatingBlockMarkup.includes('isLocalOwnerHostname() &&\n        ownerLocalKisIntegrationOptIn'),
  'gating logic must AND the localhost guard with the query opt-in.',
);
check(
  gatingBlockMarkup.includes('ownerLocalKisIntegrationPanel.hidden = !ownerLocalKisIntegrationEnabled'),
  'panel visibility toggle must be driven by the local-only + opt-in guard.',
);

// --- 2. Explicit click only, no automatic fetch --------------------------------

check(
  clickHandlerBlockMarkup.includes('ownerLocalKisIntegrationRunBtn.addEventListener'),
  'the local-only KIS request must be wired to an explicit click listener.',
);
const fetchIndex = clickHandlerBlockMarkup.indexOf('fetch(');
const clickListenerIndex = clickHandlerBlockMarkup.indexOf('ownerLocalKisIntegrationRunBtn.addEventListener');
check(fetchIndex > clickListenerIndex, 'the fetch call must be nested inside the click listener, not run eagerly.');
check(
  !gatingBlockMarkup.includes('fetch('),
  'the visibility-gating block must never itself call fetch (no auto-fetch on page load).',
);

// --- 3. Endpoint/symbol meta and safety notices --------------------------------

check(panelSectionMarkup.includes('current_price 전용'), 'panel must state the endpoint is current_price only.');
check(panelSectionMarkup.includes('005930'), 'panel must show the default symbol 005930.');
const safetyNoticesStart = pageSource.indexOf('const OWNER_LOCAL_KIS_INTEGRATION_SAFETY_NOTICES');
check(safetyNoticesStart !== -1, 'page must define the owner-local KIS safety notices list.');
const safetyNoticesEnd = pageSource.indexOf('];', safetyNoticesStart);
const safetyNoticesMarkup = pageSource.slice(safetyNoticesStart, safetyNoticesEnd);
check(panelSectionMarkup.includes('OWNER_LOCAL_KIS_INTEGRATION_SAFETY_NOTICES'), 'panel markup must render the safety notices list.');
check(safetyNoticesMarkup.includes('로컬 전용 테스트'), 'safety copy must state this is a local-only test.');
check(safetyNoticesMarkup.includes('투자 자문이 아닙니다'), 'safety copy must state this is not investment advice.');
check(
  safetyNoticesMarkup.includes('current_price'),
  'safety copy must state current_price-only scope.',
);
check(
  safetyNoticesMarkup.includes('원본 응답 데이터와 인증 정보는 표시되지 않습니다'),
  'safety copy must state raw response data and credentials are not displayed.',
);

// --- 4. Loading state and fail-closed unavailable state ------------------------

check(
  clickHandlerBlockMarkup.includes("'loading'"),
  'click handler must render a distinct loading-state variant.',
);
check(
  clickHandlerBlockMarkup.includes('OWNER_LOCAL_KIS_INTEGRATION_ERROR_MESSAGES'),
  'click handler must map sanitized error codes to readable unavailable messages.',
);
check(
  clickHandlerBlockMarkup.includes('PROVIDER_UNAVAILABLE'),
  'unavailable-message map must cover the PROVIDER_UNAVAILABLE sanitized error code.',
);
check(
  clickHandlerBlockMarkup.includes("thrownError.name === 'AbortError'"),
  'click handler must distinguish a timeout (AbortError) from other failures.',
);
check(
  !/\bat \S+\.(js|ts|mjs):\d+/.test(clickHandlerBlockMarkup),
  'click handler must never render a stack-trace-shaped string.',
);

// --- 5. Sanitized fields only, formatted for readability ------------------------

for (const label of ['종목', '시장', '현재가', '거래량', '기준 시각', '소스 상태', '캐시 상태']) {
  check(clickHandlerBlockMarkup.includes(`'${label}'`), `result rendering must include the sanitized field label: ${label}`);
}
check(
  clickHandlerBlockMarkup.includes('formatOwnerLocalKisIntegrationNumber'),
  'currentPrice and volume must be passed through a number formatter for readability.',
);
check(clickHandlerBlockMarkup.includes("}원`"), 'currentPrice must be rendered with a 원 unit suffix.');
check(clickHandlerBlockMarkup.includes("}주`"), 'volume must be rendered with a 주 unit suffix.');

// --- 6. No raw KIS payload keys in the new content ------------------------------

for (const key of FORBIDDEN_RAW_PAYLOAD_KEYS) {
  check(!newPanelContent.includes(key), `new panel content must not reference raw KIS payload key: ${key}`);
}
check(!/\boutput\b/i.test(newPanelContent), 'new panel content must not reference a raw "output" payload field.');

// --- 7. No credential field names/values in the new content --------------------

for (const token of FORBIDDEN_CREDENTIAL_TOKENS) {
  check(
    !newPanelContent.toLowerCase().includes(token.toLowerCase()),
    `new panel content must not reference credential token: ${token}`,
  );
}

// --- 8. No forbidden investment language, no LLM handoff -----------------------

for (const phrase of FORBIDDEN_INVESTMENT_LANGUAGE) {
  check(!pageSource.includes(phrase), `page source must not contain forbidden investment language: ${phrase}`);
}
for (const token of FORBIDDEN_LLM_TOKENS) {
  check(!pageSource.toLowerCase().includes(token.toLowerCase()), `page source must not reference LLM handoff token: ${token}`);
}
check(!panelSectionMarkup.includes('매수하세요'), 'panel copy must not use a buy-recommendation directive.');
check(!panelSectionMarkup.includes('매도하세요'), 'panel copy must not use a sell-recommendation directive.');
check(
  panelSectionMarkup.includes('추천') ? panelSectionMarkup.includes('추천 또는 투자자문이 아닙니다') : true,
  'any mention of "추천" in panel copy must be part of the disclaimer, not a recommendation.',
);

// --- 9. No MK Agent / Similar Pattern Agent auto-run added ----------------------

for (const token of AUTO_RUN_TOKENS) {
  check(!newPanelContent.includes(token), `new panel content must not reference or auto-run: ${token}`);
}

// --- 10. Isolation: existing panels / default behavior untouched ----------------

check(
  pageSource.includes('/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930'),
  'panel must still call the local-only KIS current-price route with the explicit opt-in and default symbol.',
);
check(pageSource.includes("fetch('/api/chart-ai/similarity'"), 'existing owner-local mocked panel fetch call must remain intact.');

console.log(`Phase 3GG-F-FAST smoke: PASS (${assertions}/${assertions} assertions passed)`);
