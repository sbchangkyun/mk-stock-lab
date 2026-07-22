// Phase 3GG-E-INTEGRATE smoke: local-only KIS current_price -> Chart AI context
// integration. Exercises the pure context adapter directly, exercises its wiring
// against the Phase 3GG-D-FAST binding module with fixture transports, and
// statically checks the local-only API route and chart-ai.astro UI panel source
// for the required guards / absence of forbidden content. Does not require
// KIS_ENABLE_LIVE_QUOTES or any real network call -- every scenario here is
// fixture- or static-source-based, per the phase's acceleration instructions.

import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  createRateLimiter,
  createQuoteCache,
  runLocalOnlyLiveKisMarketDataRequest,
  SANITIZED_ERROR_CODES,
} from '../src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import {
  buildFixtureHasEnvValue,
  buildFixtureRequestInput,
  createFixtureSuccessTransport,
  createFailIfCalledTransport,
} from '../src/lib/server/chart-ai/local-only-live-kis-market-data-binding.fixture.mjs';
import {
  ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS,
  KIS_CHART_AI_CONTEXT_CONTRACT_VERSION,
  assertNoRawKisPayloadInChartAiContext,
  createChartAiKisMarketDataContext,
} from '../src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';

const ROUTE_FILE = 'src/pages/api/chart-ai/local-only-kis-current-price.json.ts';
const ADAPTER_FILE = 'src/lib/server/chart-ai/kis-market-data-to-chart-ai-context.mjs';
const CHART_AI_PAGE = 'src/pages/chart-ai.astro';

const FORBIDDEN_RAW_OUTPUT_PATTERN =
  /KIS_APP_SECRET|KIS_APP_KEY|KIS_BASE_URL|access_token|appsecret|appkey|authorization|Bearer|KIS_ACCOUNT_NO|account_no|jwt|password|stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|\boutput\b|stack/i;

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

let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  assert.ok(condition, message);
};
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.equal(actual, expected, message);
};

const noopLogger = () => {};

// 1. Context adapter accepts sanitized success input.
{
  const context = createChartAiKisMarketDataContext({
    symbol: '005930',
    market: 'KR',
    currentPrice: 70000,
    volume: 123456,
    timestamp: '2026-07-10T00:00:00.000Z',
    sourceStatus: 'ok',
    cacheStatus: 'miss',
    sanitizedErrorCode: null,
  });
  equal(context.sourceStatus, 'ok', 'success input must map to sourceStatus=ok.');
  equal(context.currentPrice, 70000, 'success input must preserve currentPrice.');
  equal(context.symbol, '005930', 'success input must preserve symbol.');
  equal(context.warnings.length, 0, 'success context must carry no warnings.');
  check(
    JSON.stringify(Object.keys(context).sort()) === JSON.stringify([...ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS].sort()),
    'success context must contain exactly the allowed field set.',
  );
}

// 2. Context adapter rejects/removes raw payload keys.
{
  const context = createChartAiKisMarketDataContext({
    symbol: '005930',
    currentPrice: 70000,
    sourceStatus: 'ok',
    rt_cd: '0',
    output: { stck_prpr: '70000', acml_vol: '123456' },
    stck_prpr: '70000',
    rawResponse: { anything: true },
  });
  const keys = Object.keys(context);
  check(!keys.includes('rt_cd'), 'context must not carry through rt_cd.');
  check(!keys.includes('output'), 'context must not carry through output.');
  check(!keys.includes('stck_prpr'), 'context must not carry through stck_prpr.');
  check(!keys.includes('rawResponse'), 'context must not carry through rawResponse.');
  check(!FORBIDDEN_RAW_OUTPUT_PATTERN.test(JSON.stringify(context)), 'serialized context must not match raw payload pattern.');
}

// 3. Context adapter rejects/removes credential-like keys.
{
  const context = createChartAiKisMarketDataContext({
    symbol: '005930',
    currentPrice: 70000,
    sourceStatus: 'ok',
    KIS_APP_KEY: 'sk-fixture',
    KIS_APP_SECRET: 'secret-fixture',
    authorization: 'Bearer fixture-token',
    accessToken: 'fixture-token',
  });
  const keys = Object.keys(context);
  check(!keys.includes('KIS_APP_KEY'), 'context must not carry through KIS_APP_KEY.');
  check(!keys.includes('KIS_APP_SECRET'), 'context must not carry through KIS_APP_SECRET.');
  check(!keys.includes('authorization'), 'context must not carry through authorization.');
  check(!keys.includes('accessToken'), 'context must not carry through accessToken.');
  check(!FORBIDDEN_RAW_OUTPUT_PATTERN.test(JSON.stringify(context)), 'serialized context must not match credential pattern.');
}

// 4. Unavailable provider response becomes a usable fail-closed Chart AI context.
{
  const context = createChartAiKisMarketDataContext({
    sourceStatus: 'unavailable',
    sanitizedErrorCode: SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE,
  });
  equal(context.sourceStatus, 'unavailable', 'unavailable input must preserve sourceStatus=unavailable.');
  equal(context.sanitizedErrorCode, SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE, 'sanitizedErrorCode must be preserved.');
  check(context.warnings.includes('source-unavailable'), 'fail-closed context must carry a source-unavailable warning.');
  check(
    context.warnings.includes(`sanitizedErrorCode:${SANITIZED_ERROR_CODES.PROVIDER_UNAVAILABLE}`),
    'fail-closed context must carry the sanitizedErrorCode warning.',
  );
  check(context.currentPrice === null, 'fail-closed context must not fabricate a currentPrice.');
}

// 5. assertNoRawKisPayloadInChartAiContext throws for any unexpected field.
{
  check(assertNoRawKisPayloadInChartAiContext({ symbol: '005930' }), 'allowed-only object must pass the assertion.');
  let threw = false;
  try {
    assertNoRawKisPayloadInChartAiContext({ symbol: '005930', rawResponse: {} });
  } catch {
    threw = true;
  }
  check(threw, 'assertion must throw when an unexpected field is present.');
}

// 6. Adapter exports the required contract symbols.
{
  equal(typeof KIS_CHART_AI_CONTEXT_CONTRACT_VERSION, 'string', 'contract version must be a string.');
  equal(typeof createChartAiKisMarketDataContext, 'function', 'createChartAiKisMarketDataContext must be exported.');
  equal(typeof assertNoRawKisPayloadInChartAiContext, 'function', 'assertNoRawKisPayloadInChartAiContext must be exported.');
  check(Array.isArray(ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS), 'ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS must be an array.');
}

// 7. End-to-end wiring: Phase 3GG-D-FAST binding (fixture success transport) -> adapter.
{
  const result = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput({ hostname: 'localhost' }), {
    rateLimiter: createRateLimiter(),
    cache: createQuoteCache(),
    hasEnvValue: buildFixtureHasEnvValue(),
    fetchQuote: createFixtureSuccessTransport(),
    logger: noopLogger,
    now: () => 0,
  });
  const context = createChartAiKisMarketDataContext(result);
  equal(context.sourceStatus, 'ok', 'end-to-end success wiring must yield sourceStatus=ok.');
  equal(context.currentPrice, 70000, 'end-to-end success wiring must preserve the fixture currentPrice.');
  check(context.warnings.length === 0, 'end-to-end success wiring must carry no warnings.');
}

// 8. End-to-end wiring fail-closed: non-local hostname -> binding blocks -> adapter fail-closed.
{
  const result = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput({ hostname: 'example.com' }), {
    rateLimiter: createRateLimiter(),
    cache: createQuoteCache(),
    hasEnvValue: buildFixtureHasEnvValue(),
    fetchQuote: createFailIfCalledTransport('scenario-8-transport'),
    logger: noopLogger,
    now: () => 0,
  });
  const context = createChartAiKisMarketDataContext(result);
  equal(context.sourceStatus, 'blocked', 'end-to-end non-local wiring must yield sourceStatus=blocked.');
  equal(context.sanitizedErrorCode, SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST, 'end-to-end non-local wiring must carry NON_LOCAL_REQUEST.');
}

// --- Static source checks: local-only API route ---------------------------

check(fs.existsSync(ROUTE_FILE), `${ROUTE_FILE} must exist.`);
const routeSource = fs.readFileSync(ROUTE_FILE, 'utf8');

// 9. Route source contains a local-only guard.
check(routeSource.includes('LOCAL_ONLY_ALLOWED_HOSTNAMES'), 'route must reuse the Phase 3GG-D-FAST local-only hostname allowlist.');
check(routeSource.includes('resolveLocalHostname'), 'route must resolve and check the request hostname.');

// 10. Route source requires the explicit opt-in.
check(
  routeSource.includes("searchParams.get('ownerLocalKisIntegration') === '1'"),
  'route must require the explicit ownerLocalKisIntegration=1 opt-in.',
);

// 11. Route source supports only current_price.
check(routeSource.includes("category: 'current_price'"), 'route must only ever request the current_price category.');

// 12. Route source does not allow any forbidden endpoint category.
for (const token of FORBIDDEN_ENDPOINT_TOKENS) {
  check(!routeSource.toLowerCase().includes(token), `route source must not reference forbidden endpoint token: ${token}`);
}

// Route must never log/print a credential value or raw provider payload.
check(!FORBIDDEN_RAW_OUTPUT_PATTERN.test(routeSource.replace(/KIS_APP_KEY|KIS_APP_SECRET|KIS_BASE_URL/g, '')), 'route source must not reference raw payload field names.');
check(routeSource.includes("Cache-Control': 'no-store'"), 'route responses must be Cache-Control: no-store.');

// --- Static source checks: adapter module ----------------------------------

check(fs.existsSync(ADAPTER_FILE), `${ADAPTER_FILE} must exist.`);
const adapterSource = fs.readFileSync(ADAPTER_FILE, 'utf8');
for (const token of FORBIDDEN_ENDPOINT_TOKENS) {
  check(!adapterSource.toLowerCase().includes(token), `adapter source must not reference forbidden endpoint token: ${token}`);
}
for (const token of FORBIDDEN_LLM_TOKENS) {
  check(!adapterSource.toLowerCase().includes(token.toLowerCase()), `adapter source must not reference LLM handoff token: ${token}`);
  check(!routeSource.toLowerCase().includes(token.toLowerCase()), `route source must not reference LLM handoff token: ${token}`);
}

// --- Static source checks: chart-ai.astro UI panel --------------------------

check(fs.existsSync(CHART_AI_PAGE), `${CHART_AI_PAGE} must exist.`);
const pageSource = fs.readFileSync(CHART_AI_PAGE, 'utf8');

// 13. chart-ai.astro contains the ownerLocalKisIntegration guard.
check(pageSource.includes('ownerLocalKisIntegration'), 'page must reference the ownerLocalKisIntegration query param.');
check(
  pageSource.includes("chartAiQuery.get('ownerLocalKisIntegration') === '1'"),
  'page must gate the panel behind an explicit ownerLocalKisIntegration=1 opt-in.',
);
check(
  pageSource.includes('isLocalOwnerHostname() &&\n        ownerLocalKisIntegrationOptIn'),
  'panel must AND the localhost guard with the query opt-in.',
);

// 14. Default behavior remains hidden unless opt-in query is present.
const panelSectionStart = pageSource.indexOf('id="chartAiOwnerLocalKisIntegrationPanel"');
check(panelSectionStart !== -1, 'panel section must exist in page source.');
const panelSectionEnd = pageSource.indexOf('</section>', panelSectionStart);
const panelSectionMarkup = pageSource.slice(panelSectionStart, panelSectionEnd);
check(panelSectionMarkup.includes('hidden'), 'panel must be hidden by default in markup.');
check(
  pageSource.includes('ownerLocalKisIntegrationPanel.hidden = !ownerLocalKisIntegrationEnabled'),
  'panel visibility toggle must be driven by the local-only + opt-in guard.',
);

// This phase's three disjoint additions to the 4800-line page: the HTML panel section,
// the visibility-gating logic block, and the click-handler/fetch script block. Scanning
// only these slices (rather than the whole pageSource) for raw-payload/credential patterns
// avoids false positives from earlier phases' pre-existing boundary-copy comments, which
// legitimately mention terms like "JWT" as part of documenting what they do NOT parse.
const gatingBlockStart = pageSource.indexOf('const ownerLocalKisIntegrationOptIn =');
check(gatingBlockStart !== -1, 'gating logic block must exist in page source.');
const gatingBlockEnd = pageSource.indexOf("authGateCta?.addEventListener('click'", gatingBlockStart);
const gatingBlockMarkup = pageSource.slice(gatingBlockStart, gatingBlockEnd);

const clickHandlerBlockStart = pageSource.indexOf('// Owner-local KIS current_price -> Chart AI context execution panel');
check(clickHandlerBlockStart !== -1, 'click-handler block must exist in page source.');
const clickHandlerBlockEnd = pageSource.indexOf(
  '// Owner-local auth/usage runtime bridge verification panel (Phase 3FB-E).',
  clickHandlerBlockStart,
);
const clickHandlerBlockMarkup = pageSource.slice(clickHandlerBlockStart, clickHandlerBlockEnd);

const newPanelContent = panelSectionMarkup + gatingBlockMarkup + clickHandlerBlockMarkup;

// 15. No raw payload / credential exposure in the new content this phase added.
check(
  !FORBIDDEN_RAW_OUTPUT_PATTERN.test(newPanelContent),
  'new panel content must not match the raw payload / credential pattern.',
);
for (const token of FORBIDDEN_ENDPOINT_TOKENS) {
  check(!panelSectionMarkup.toLowerCase().includes(token), `panel markup must not reference forbidden endpoint token: ${token}`);
}

// 16. No forbidden investment language in the new UI copy.
for (const token of FORBIDDEN_INVESTMENT_LANGUAGE) {
  check(!pageSource.includes(token), `page source must not contain forbidden investment language: ${token}`);
}

// 17. No LLM handoff added.
for (const token of FORBIDDEN_LLM_TOKENS) {
  check(!pageSource.toLowerCase().includes(token.toLowerCase()), `page source must not reference LLM handoff token: ${token}`);
}

// 18. Panel calls the correct, isolated local-only route -- and no other panel's fetch call
// was disturbed by this edit (spot-check the existing owner-local mocked panel is intact).
check(
  pageSource.includes('/api/chart-ai/local-only-kis-current-price.json?ownerLocalKisIntegration=1&symbol=005930'),
  'panel must call the local-only KIS current-price route with the explicit opt-in and default symbol.',
);
check(pageSource.includes("fetch('/api/chart-ai/similarity'"), 'existing owner-local mocked panel fetch call must remain intact.');

console.log(`Phase 3GG-E-INTEGRATE smoke: PASS (${assertions}/${assertions} assertions passed)`);
