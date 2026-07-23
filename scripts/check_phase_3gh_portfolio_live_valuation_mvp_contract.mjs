/**
 * Static contract check for Phase 3GH — authenticated KR portfolio live valuation MVP.
 * Verifies the authenticated server-only valuation route contract, client integration,
 * UI retirement of old fixture/owner-preview paths, calculation module boundaries,
 * package.json wiring, and absence of leaked/forbidden patterns. No network calls.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const VALUATION_ROUTE = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const VALUATION_LIB = join(root, 'src', 'lib', 'server', 'portfolioValuation.ts');
const PROVIDER_TYPES = join(root, 'src', 'lib', 'server', 'providers', 'types.ts');
const PORTFOLIO_CLIENT = join(root, 'src', 'lib', 'portfolioClient.ts');
const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const PACKAGE_JSON = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

log('=== Phase 3GH Portfolio Live Valuation MVP Static Contract ===');
log('');

const route = readOr(VALUATION_ROUTE);
const lib = readOr(VALUATION_LIB);
const types = readOr(PROVIDER_TYPES);
const client = readOr(PORTFOLIO_CLIENT);
const astro = readOr(PORTFOLIO_ASTRO);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');
check('valuation route exists', existsSync(VALUATION_ROUTE));
check('portfolioValuation.ts exists', existsSync(VALUATION_LIB));
check('portfolioClient.ts exists', existsSync(PORTFOLIO_CLIENT));
check('portfolio.astro exists', existsSync(PORTFOLIO_ASTRO));

// ---------------------------------------------------------------------------
// Group 2: Authenticated server-side boundary (auth before any lookup)
// ---------------------------------------------------------------------------
log('--- Group 2: Authenticated server-side boundary ---');
check('route is server-rendered (prerender = false)', /export const prerender = false/.test(route));
check('route calls getPortfolioRequestContext', route.includes('getPortfolioRequestContext'));
check('route resolves auth before reading body',
  route.indexOf('getPortfolioRequestContext') < route.indexOf('readJsonBody'));
check('route validates ownership via ensurePortfolioOwned', route.includes('ensurePortfolioOwned'));
check('route never reads a browser-supplied user id',
  !/body\.data\.userId|body\.data\.user_id/.test(route));
check('non-POST handled via methodNotAllowed', route.includes('methodNotAllowed'));

// ---------------------------------------------------------------------------
// Group 3: Retired old contract (fixture / owner-preview / mocked-fx)
// ---------------------------------------------------------------------------
log('--- Group 3: Retired old contract ---');
check('route does not reference isLivePreviewGateReady', !route.includes('isLivePreviewGateReady'));
check('route does not reference fixture resolution', !route.includes('portfolioValuationFixture'));
check('route does not accept previewMode from client', !route.includes('previewMode'));
check('route does not accept allowLiveQuotes from client', !route.includes('allowLiveQuotes'));
check('route does not accept allowMockedFx from client', !route.includes('allowMockedFx'));
check('route does not accept fxMode from client', !route.includes('fxMode'));
check('route does not branch on source === "live"', !/source\s*===\s*['"]live['"]/.test(route));

// ---------------------------------------------------------------------------
// Group 4: Scale / provider-safety limits
// ---------------------------------------------------------------------------
log('--- Group 4: Scale / provider-safety limits ---');
check('route enforces MAX_POSITIONS = 50', /MAX_POSITIONS\s*=\s*50/.test(route));
check('route enforces MAX_UNIQUE_KR_SYMBOLS = 30', /MAX_UNIQUE_KR_SYMBOLS\s*=\s*30/.test(route));
check('route caps provider concurrency (QUOTE_CONCURRENCY = 3)', /QUOTE_CONCURRENCY\s*=\s*3/.test(route));
check('route dedupes KR symbols via a Set', route.includes('new Set('));
check('limit checks precede any quote provider call',
  route.lastIndexOf('PORTFOLIO_VALUATION_LIMIT_EXCEEDED') < route.indexOf('getQuoteSnapshot('));

// ---------------------------------------------------------------------------
// Group 5: Aggregate scope isolation
// ---------------------------------------------------------------------------
log('--- Group 5: Aggregate scope isolation ---');
check('route supports the aggregate portfolio id', route.includes("AGGREGATE_PORTFOLIO_ID = '__all_portfolios__'"));
check('aggregate scope loads portfolios by authenticated userId', /listPortfolios\(userId\)/.test(route));
check('aggregate scope loads positions by authenticated userId', /listPositions\(userId,/.test(route));

// ---------------------------------------------------------------------------
// Group 6: Response contract / error codes / no-store / no leakage
// ---------------------------------------------------------------------------
log('--- Group 6: Response contract ---');
for (const code of ['INVALID_PAYLOAD', 'PORTFOLIO_VALUATION_LIMIT_EXCEEDED', 'PORTFOLIO_VALUATION_UNAVAILABLE']) {
  check(`route uses error code ${code}`, route.includes(code));
}
check('route never forwards raw provider quote objects wholesale',
  !/jsonResponse\(\s*result\s*\)|res\.json\(\s*quote\s*\)/.test(route));
check('route builds sanitized valuation via buildKrPortfolioValuation', route.includes('buildKrPortfolioValuation('));

// ---------------------------------------------------------------------------
// Group 7: Sanitized unsupported reasons (calculation module)
// ---------------------------------------------------------------------------
log('--- Group 7: Sanitized unsupported reasons ---');
for (const reason of [
  'unsupported_market',
  'market_currency_mismatch',
  'missing_symbol',
  'invalid_position_data',
  'quote_unavailable',
]) {
  check(`portfolioValuation.ts defines reason ${reason}`, lib.includes(reason));
}
// unsupported_currency is a reserved sanitized reason in the shared type (Group 8) not yet
// reachable from the KR-only MVP classifier (KR + non-KRW already resolves to
// market_currency_mismatch) — asserting the type export is sufficient here.
check('calc module never fabricates a quote (no cost-basis fallback for currentPrice)',
  !/currentPrice:\s*position\.buyPrice/.test(lib));
check('calc module is server-only (assertServerRuntime)', lib.includes('assertServerRuntime('));

// ---------------------------------------------------------------------------
// Group 8: Shared types
// ---------------------------------------------------------------------------
log('--- Group 8: Shared provider types ---');
for (const typeName of [
  'PortfolioValuationUnsupportedReason',
  'PortfolioValuationRecordInput',
  'KrPortfolioValuationRow',
  'KrPortfolioValuationState',
  'KrPortfolioValuationResult',
]) {
  check(`providers/types.ts exports ${typeName}`, types.includes(typeName));
}

// ---------------------------------------------------------------------------
// Group 9: Client integration (authenticated, bearer-auth reused)
// ---------------------------------------------------------------------------
log('--- Group 9: Client integration ---');
check('portfolioClient exposes getValuation', /getValuation:\s*\(portfolioId/.test(client));
check('getValuation uses the shared authenticated requestJson helper',
  /getValuation:[\s\S]{0,120}requestJson</.test(client));
check('getValuation posts to /api/portfolio/valuation', client.includes("'/api/portfolio/valuation'"));
check('getValuation sends only portfolioId in the body',
  /getValuation:[\s\S]{0,200}JSON\.stringify\(\s*\{\s*portfolioId\s*\}\s*\)/.test(client));
check('client defines PortfolioValuationRow type', client.includes('PortfolioValuationRow'));
check('client defines PortfolioValuationTotals type', client.includes('PortfolioValuationTotals'));

// ---------------------------------------------------------------------------
// Group 10: UI retirement of old fixture / owner-preview / mocked-fx paths
// ---------------------------------------------------------------------------
log('--- Group 10: UI retirement ---');
for (const stale of [
  'isOwnerPreviewActive',
  'isMixedMockedFxPreviewActive',
  'isLivePreviewEligible',
  'isMixedMockedFxPreviewEligible',
  'mixed-fx-preview-notice',
  'MixedPreviewMeta',
  'valuationSource',
  'valuationPreviewMode',
  'valuationUiState',
  'missingQuoteSymbols',
  'unsupportedCurrencySymbols',
  'previewMode',
  'allowLiveQuotes',
  'allowMockedFx',
  'fxMode',
]) {
  check(`portfolio.astro no longer references ${stale}`, !astro.includes(stale));
}
check('portfolio.astro calls portfolioApi.getValuation', astro.includes('portfolioApi.getValuation'));
check('portfolio.astro has a request-sequence guard against stale responses',
  /valuationRequestSeq/.test(astro) && /requestSeq !== valuationRequestSeq/.test(astro));
check('portfolio.astro disables refresh while a valuation request is pending',
  /refreshButton\.disabled\s*=\s*state\.valuationState\s*===\s*'loading'/.test(astro));
check('portfolio.astro shows a partial-state "supported positions only" notice',
  astro.includes('지원 종목 기준'));
check('portfolio.astro shows the unsupported-market Korean copy',
  astro.includes('해외 종목 실시간 평가는 다음 단계에서 지원됩니다.'));
check('portfolio.astro shows the missing-quote Korean copy',
  astro.includes('현재 시세를 불러오지 못했습니다.'));

// ---------------------------------------------------------------------------
// Group 11: No account / trading / order surfaces introduced
// ---------------------------------------------------------------------------
log('--- Group 11: No account / trading surfaces ---');
check('route never references KIS_ACCOUNT_NO', !route.includes('KIS_ACCOUNT_NO'));
check('route never references an order/balance/trading endpoint',
  !/\/api\/(?:kis-)?(?:order|trade|balance|account)/i.test(route));
check('route imports no external LLM client', !/openai|gemini/i.test(route));

// ---------------------------------------------------------------------------
// Group 12: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 12: package.json wiring ---');
check('package.json has smoke:phase-3gh-portfolio-live-valuation-mvp script',
  typeof pkg.scripts?.['smoke:phase-3gh-portfolio-live-valuation-mvp'] === 'string');
check('package.json has check:phase-3gh-portfolio-live-valuation-mvp script',
  typeof pkg.scripts?.['check:phase-3gh-portfolio-live-valuation-mvp'] === 'string');
check('package.json no longer has check:portfolio-valuation-api (retired)',
  pkg.scripts?.['check:portfolio-valuation-api'] === undefined);
check('package.json no longer has check:portfolio-ui-valuation-fixture (retired)',
  pkg.scripts?.['check:portfolio-ui-valuation-fixture'] === undefined);
check('package.json no longer has check:portfolio-live-preview-api (retired)',
  pkg.scripts?.['check:portfolio-live-preview-api'] === undefined);
check('package.json no longer has smoke:portfolio-live-preview-api:owner (retired)',
  pkg.scripts?.['smoke:portfolio-live-preview-api:owner'] === undefined);
check('package.json no longer has smoke:portfolio-mixed-currency-preview-api:owner (retired)',
  pkg.scripts?.['smoke:portfolio-mixed-currency-preview-api:owner'] === undefined);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
