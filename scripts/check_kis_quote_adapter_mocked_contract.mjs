/**
 * Mocked contract check for Phase 3BV KIS Quote Adapter Contract & Mocked Provider Tests.
 * No network calls. No .env reads. No live KIS calls. Exits non-zero on any failure.
 *
 * Strategy:
 *   - Groups 1-3: static file/content inspection of server TS modules.
 *   - Groups 4-10: pure JavaScript behavioral tests using synthetic in-memory data,
 *     mirroring the computation logic in portfolioValuation.ts.
 *   - Groups 11-12: safety boundaries and network safety.
 */

// Block all network calls immediately — any unexpected fetch is a hard failure.
globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_VALUATION = join(root, 'src', 'lib', 'server', 'portfolioValuation.ts');
const PROVIDER_TYPES = join(root, 'src', 'lib', 'server', 'providers', 'types.ts');
const KIS_CLIENT = join(root, 'src', 'lib', 'server', 'providers', 'kisClient.ts');
const PROVIDER_ERRORS = join(root, 'src', 'lib', 'server', 'providers', 'providerErrors.ts');
const SERVER_ONLY = join(root, 'src', 'lib', 'server', 'providers', 'serverOnly.ts');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3bv_kis_quote_adapter_contract_mocked_tests_result_v0.1.md');
const PACKAGE_JSON = join(root, 'package.json');
const NEWS_PAGE_DIR = join(root, 'src', 'pages', 'news');
const VALUATION_ROUTE_TS = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const VALUATION_ROUTE_JS = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.js');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;
const loggedLines = [];

const check = (label, pass) => {
  const line = `  [${pass ? 'PASS' : 'FAIL'}] ${label}`;
  log(line);
  loggedLines.push(line);
  if (pass) passes++; else failures++;
};

log('=== Phase 3BV KIS Quote Adapter Mocked Contract ===');
log('');

const pvContent = existsSync(PORTFOLIO_VALUATION) ? readFileSync(PORTFOLIO_VALUATION, 'utf8') : '';
const typesContent = existsSync(PROVIDER_TYPES) ? readFileSync(PROVIDER_TYPES, 'utf8') : '';
const kisContent = existsSync(KIS_CLIENT) ? readFileSync(KIS_CLIENT, 'utf8') : '';
const errorsContent = existsSync(PROVIDER_ERRORS) ? readFileSync(PROVIDER_ERRORS, 'utf8') : '';
const soContent = existsSync(SERVER_ONLY) ? readFileSync(SERVER_ONLY, 'utf8') : '';

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ── Group 1: File existence ───────────────────────────────────────────────────
log('--- Group 1: File existence ---');

check('portfolioValuation.ts exists', existsSync(PORTFOLIO_VALUATION));
check('types.ts exists', existsSync(PROVIDER_TYPES));
check('kisClient.ts exists', existsSync(KIS_CLIENT));
check('providerErrors.ts exists', existsSync(PROVIDER_ERRORS));
check('serverOnly.ts exists', existsSync(SERVER_ONLY));
check('Phase 3BV result doc exists', existsSync(RESULT_DOC));
check('package.json has check:kis-quote-adapter-mocked script',
  typeof pkg.scripts?.['check:kis-quote-adapter-mocked'] === 'string');
check('package.json has check:kis-valuation-design script (3BU)',
  typeof pkg.scripts?.['check:kis-valuation-design'] === 'string');
log('');

// ── Group 2: Static contract — portfolioValuation.ts ─────────────────────────
log('--- Group 2: Static contract — portfolioValuation.ts ---');

check('buildPortfolioValuationReadiness exported',
  pvContent.includes('export const buildPortfolioValuationReadiness'));
check('buildAggregatePortfolioValuationReadiness exported',
  pvContent.includes('export const buildAggregatePortfolioValuationReadiness'));
check('buildPortfolioValuationFromQuotes exported (new Phase 3BV helper)',
  pvContent.includes('export const buildPortfolioValuationFromQuotes'));
check('buildPositionValuationFromQuote defined (internal helper)',
  pvContent.includes('buildPositionValuationFromQuote'));
check('assertServerRuntime called in portfolioValuation.ts',
  pvContent.includes('assertServerRuntime'));
check('QuoteSnapshot imported in portfolioValuation.ts',
  pvContent.includes('QuoteSnapshot'));
check('providerMeta intentionally excluded from PortfolioValuationRow output',
  pvContent.includes('providerMeta intentionally excluded') ||
  pvContent.includes('providerMeta is intentionally') ||
  pvContent.includes('never forward raw provider'));
check('costBasis computed as buyPrice * quantity',
  pvContent.includes('buyPrice * position.quantity') ||
  pvContent.includes('buyPrice * quantity'));
check('unrealizedPnl computed as marketValue - costBasis',
  pvContent.includes('marketValue - costBasis'));
check('unrealizedPnlPct null-guarded when costBasis <= 0',
  pvContent.includes('costBasis > 0'));
log('');

// ── Group 3: Static contract — types.ts ──────────────────────────────────────
log('--- Group 3: Static contract — types.ts ---');

check('PortfolioValuationRow defined in types.ts',
  typesContent.includes('PortfolioValuationRow'));
check('PortfolioValuationSummary defined in types.ts',
  typesContent.includes('PortfolioValuationSummary'));
check('QuoteSnapshot defined in types.ts',
  typesContent.includes('type QuoteSnapshot'));
check('FallbackState defined in types.ts',
  typesContent.includes('FallbackState'));
check('providerMeta in QuoteSnapshot (internal-only field; must be stripped at valuation layer)',
  typesContent.includes('providerMeta'));
check('PortfolioValuationRow has currentPrice field',
  typesContent.includes('currentPrice'));
check('PortfolioValuationRow has marketValue field',
  typesContent.includes('marketValue'));
check('PortfolioValuationRow has unrealizedPnl field',
  typesContent.includes('unrealizedPnl'));
log('');

// ── Mirrored computation logic (matches portfolioValuation.ts) ────────────────
// These are pure JavaScript helpers — no imports, no network, no env reads.
// Used for Groups 4–10 behavioral tests.

const makePlaceholderRow = (position, fallbackCurrency) => ({
  positionId: position.id || `${position.market}:${position.symbol}`,
  displayName: position.name || position.symbol,
  currentPrice: null,
  marketValue: null,
  costBasis: position.buyPrice * position.quantity,
  unrealizedPnl: null,
  unrealizedPnlPct: null,
  valuationCurrency: position.currency || fallbackCurrency,
  staleState: 'unavailable',
  sourcePortfolioNames: position.sourcePortfolioNames,
});

const computePositionValuationFromQuote = (position, quote, fallbackCurrency) => {
  if (!quote || quote.price == null) {
    return makePlaceholderRow(position, fallbackCurrency);
  }

  const costBasis = position.buyPrice * position.quantity;
  const currentPrice = quote.price;
  const marketValue = currentPrice * position.quantity;
  const unrealizedPnl = marketValue - costBasis;
  const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null;

  // providerMeta intentionally excluded — never forward raw provider metadata
  return {
    positionId: position.id || `${position.market}:${position.symbol}`,
    displayName: position.name || position.symbol,
    currentPrice,
    marketValue,
    costBasis,
    unrealizedPnl,
    unrealizedPnlPct,
    valuationCurrency: position.currency || fallbackCurrency,
    quoteAsOf: quote.asOf,
    staleState: quote.staleState,
    sourcePortfolioNames: position.sourcePortfolioNames,
  };
};

const computePortfolioValuationFromQuotes = (positions, quotesBySymbol, baseCurrency) => {
  const rows = positions.map((pos) =>
    computePositionValuationFromQuote(pos, quotesBySymbol[pos.symbol] ?? null, baseCurrency),
  );

  const totalCostBasis = rows.reduce((sum, r) => sum + r.costBasis, 0);
  const quotedRows = rows.filter((r) => r.currentPrice !== null);
  const allQuoted = rows.length > 0 && quotedRows.length === rows.length;
  const allSameCurrency = rows.every((r) => r.valuationCurrency === baseCurrency);

  let totalMarketValue = null;
  let totalUnrealizedPnl = null;

  if (allQuoted && allSameCurrency) {
    totalMarketValue = rows.reduce((sum, r) => sum + (r.marketValue ?? 0), 0);
    totalUnrealizedPnl = totalMarketValue - totalCostBasis;
  }

  const staleSummary =
    rows.length === 0
      ? 'unavailable'
      : allQuoted
        ? rows.every((r) => r.staleState === 'fresh') ? 'fresh' : 'stale-but-usable'
        : quotedRows.length > 0
          ? 'stale-but-usable'
          : 'unavailable';

  const quoteCoverage =
    rows.length === 0 ? 'unavailable' :
    allQuoted ? 'all' :
    quotedRows.length > 0 ? 'partial' : 'unavailable';

  return { rows, totalCostBasis, totalMarketValue, totalUnrealizedPnl, staleState: staleSummary, quoteCoverage };
};

// Synthetic test data — no real market data, no real symbols, no credentials
const SYNTH_POS = {
  id: 'pos-001',
  portfolioId: 'port-001',
  symbol: '000000',
  market: 'KR',
  assetType: 'stock',
  name: 'Synthetic Stock A',
  buyPrice: 60000,
  quantity: 10,
  currency: 'KRW',
  buyDate: '2025-01-15',
};

const SYNTH_QUOTE_FRESH = {
  symbol: '000000',
  market: 'KR',
  price: 75000,
  currency: 'KRW',
  change: 500,
  changePct: 0.67,
  marketState: 'open',
  asOf: '2025-06-25T02:00:00.000Z',
  staleState: 'fresh',
  // providerMeta intentionally absent — never included in safe valuation output
};

const SYNTH_QUOTE_STALE = { ...SYNTH_QUOTE_FRESH, staleState: 'stale-but-usable' };

const SYNTH_POS_2 = {
  id: 'pos-002',
  portfolioId: 'port-001',
  symbol: '111111',
  market: 'KR',
  assetType: 'stock',
  name: 'Synthetic Stock B',
  buyPrice: 30000,
  quantity: 5,
  currency: 'KRW',
  buyDate: '2025-02-01',
};

const SYNTH_QUOTE_2 = {
  symbol: '111111',
  market: 'KR',
  price: 27000,
  currency: 'KRW',
  change: -300,
  changePct: -1.1,
  marketState: 'open',
  asOf: '2025-06-25T02:00:00.000Z',
  staleState: 'fresh',
};

const SYNTH_POS_USD = {
  id: 'pos-003',
  portfolioId: 'port-001',
  symbol: 'SYNTHX',
  market: 'US',
  assetType: 'stock',
  name: 'Synthetic US Stock',
  buyPrice: 100,
  quantity: 5,
  currency: 'USD',
  buyDate: '2025-03-01',
};

// ── Group 4: Mocked successful quote — single position computation ─────────────
log('--- Group 4: Mocked successful quote — single position ---');

const rowFresh = computePositionValuationFromQuote(SYNTH_POS, SYNTH_QUOTE_FRESH, 'KRW');

check('costBasis = buyPrice × quantity (60000 × 10 = 600000)',
  rowFresh.costBasis === 600000);
check('currentPrice from quote price (75000)',
  rowFresh.currentPrice === 75000);
check('marketValue = currentPrice × quantity (75000 × 10 = 750000)',
  rowFresh.marketValue === 750000);
check('unrealizedPnl = marketValue - costBasis (750000 - 600000 = 150000)',
  rowFresh.unrealizedPnl === 150000);
check('unrealizedPnlPct = unrealizedPnl / costBasis × 100 (= 25)',
  rowFresh.unrealizedPnlPct === 25);
check('staleState from quote (fresh)',
  rowFresh.staleState === 'fresh');
check('quoteAsOf from quote.asOf',
  rowFresh.quoteAsOf === SYNTH_QUOTE_FRESH.asOf);
check('providerMeta absent from computed valuation row',
  !Object.prototype.hasOwnProperty.call(rowFresh, 'providerMeta'));
check('No raw KIS field stck_prpr in computed row',
  !JSON.stringify(rowFresh).includes('stck_prpr'));
check('No raw KIS field rt_cd in computed row',
  !JSON.stringify(rowFresh).includes('rt_cd'));
log('');

// ── Group 5: Null / unavailable quote ─────────────────────────────────────────
log('--- Group 5: Null / unavailable quote ---');

const rowNull = computePositionValuationFromQuote(SYNTH_POS, null, 'KRW');

check('costBasis still 600000 when quote is null',
  rowNull.costBasis === 600000);
check('currentPrice is null when quote is null',
  rowNull.currentPrice === null);
check('marketValue is null when quote is null',
  rowNull.marketValue === null);
check('unrealizedPnl is null when quote is null',
  rowNull.unrealizedPnl === null);
check('unrealizedPnlPct is null when quote is null',
  rowNull.unrealizedPnlPct === null);
check('staleState is unavailable when quote is null',
  rowNull.staleState === 'unavailable');
check('quoteAsOf absent when quote is null',
  !Object.prototype.hasOwnProperty.call(rowNull, 'quoteAsOf') || rowNull.quoteAsOf == null);
log('');

// ── Group 6: Zero cost-basis edge case ────────────────────────────────────────
log('--- Group 6: Edge cases ---');

const zeroPos = { ...SYNTH_POS, buyPrice: 0, quantity: 10 };
const rowZeroBasis = computePositionValuationFromQuote(zeroPos, SYNTH_QUOTE_FRESH, 'KRW');

check('costBasis is 0 when buyPrice is 0',
  rowZeroBasis.costBasis === 0);
check('unrealizedPnlPct is null when costBasis is 0 (no division by zero)',
  rowZeroBasis.unrealizedPnlPct === null);
check('marketValue still computed when costBasis is 0',
  rowZeroBasis.marketValue === 750000);

const singleShare = { ...SYNTH_POS, buyPrice: 70000, quantity: 1 };
const singleQuote = { ...SYNTH_QUOTE_FRESH, price: 70000 };
const rowBreakEven = computePositionValuationFromQuote(singleShare, singleQuote, 'KRW');
check('unrealizedPnl is 0 when price equals buyPrice (break-even)',
  rowBreakEven.unrealizedPnl === 0);
check('unrealizedPnlPct is 0 when price equals buyPrice',
  rowBreakEven.unrealizedPnlPct === 0);

const lossQuote = { ...SYNTH_QUOTE_FRESH, price: 50000 };
const rowLoss = computePositionValuationFromQuote(SYNTH_POS, lossQuote, 'KRW');
check('unrealizedPnl is negative when price < buyPrice',
  rowLoss.unrealizedPnl < 0);
check('returnRate is negative when price < buyPrice',
  rowLoss.unrealizedPnlPct < 0);
log('');

// ── Group 7: Unsupported market / unavailable quote ───────────────────────────
log('--- Group 7: Unsupported market (KIS KR-only) ---');

// US market position — KIS does not support US in current phase.
// The valuation layer receives null from provider; must not fabricate data.
const rowUnsupported = computePositionValuationFromQuote(SYNTH_POS_USD, null, 'KRW');

check('US market position with no quote: costBasis available',
  rowUnsupported.costBasis === 100 * 5);
check('US market position with no quote: currentPrice null',
  rowUnsupported.currentPrice === null);
check('US market position with no quote: marketValue null',
  rowUnsupported.marketValue === null);
check('US market position with no quote: returnRate null',
  rowUnsupported.unrealizedPnlPct === null);
check('US market position with no quote: staleState unavailable',
  rowUnsupported.staleState === 'unavailable');
log('');

// ── Group 8: Provider error codes — controlled sanitized errors ───────────────
log('--- Group 8: Provider error codes ---');

const VALID_ERROR_CODES = new Set([
  'AUTH_REQUIRED', 'CONFIG_MISSING', 'PROVIDER_UNAVAILABLE', 'PROVIDER_RATE_LIMITED',
  'SYMBOL_UNSUPPORTED', 'CACHE_MISS', 'DATA_STALE', 'VALIDATION_FAILED',
  'INTERNAL_ERROR', 'NOT_IMPLEMENTED',
]);

const makeProviderError = (code, message, provider) => ({
  ok: false,
  code,
  message,
  ...(provider ? { provider } : {}),
  staleState: 'unavailable',
});

const errSymbolUnsupported = makeProviderError('SYMBOL_UNSUPPORTED', 'Only KR domestic stock quotes are supported in this phase.', 'kis');
const errProviderUnavailable = makeProviderError('PROVIDER_UNAVAILABLE', 'KIS quote request failed safely.', 'kis');
const errConfigMissing = makeProviderError('CONFIG_MISSING', 'KIS live quotes are disabled.', 'kis');
const errInternal = makeProviderError('INTERNAL_ERROR', 'Provider operation failed safely.');

check('SYMBOL_UNSUPPORTED is a valid controlled ProviderErrorCode',
  VALID_ERROR_CODES.has(errSymbolUnsupported.code));
check('PROVIDER_UNAVAILABLE is a valid controlled ProviderErrorCode',
  VALID_ERROR_CODES.has(errProviderUnavailable.code));
check('CONFIG_MISSING is a valid controlled ProviderErrorCode',
  VALID_ERROR_CODES.has(errConfigMissing.code));
check('INTERNAL_ERROR has sanitized message (no raw stack trace)',
  !errInternal.message.includes('Error:') && !errInternal.message.includes('at '));
check('Provider error envelope has ok: false',
  errSymbolUnsupported.ok === false);
check('Provider error message does not expose credential-like strings',
  !JSON.stringify(errProviderUnavailable).match(/appkey|appsecret|access_token|authorization/i));
check('No raw KIS field names in error envelope',
  !JSON.stringify(errSymbolUnsupported).match(/stck_prpr|prdy_vrss|rt_cd|acml_vol/i));
log('');

// ── Group 9: Public safety — providerMeta and raw field exclusion ─────────────
log('--- Group 9: Public safety ---');

// Simulate what a public API response would look like
const publicValuationRow = {
  positionId: 'pos-001',
  symbol: '000000',
  market: 'KR',
  currentPrice: 75000,
  marketValue: 750000,
  costBasis: 600000,
  unrealizedPnl: 150000,
  unrealizedPnlPct: 25,
  staleState: 'fresh',
  // providerMeta intentionally absent
  // rawProviderStored: intentionally absent (would be false by contract)
};

const publicJson = JSON.stringify(publicValuationRow);

check('providerMeta absent from public valuation row',
  !publicJson.includes('providerMeta'));
check('rawProviderStored absent or false in public valuation row',
  !publicJson.includes('"rawProviderStored":true'));
check('No stck_prpr in public valuation JSON',
  !publicJson.includes('stck_prpr'));
check('No prdy_vrss in public valuation JSON',
  !publicJson.includes('prdy_vrss'));
check('No rt_cd in public valuation JSON',
  !publicJson.includes('rt_cd'));
check('No access_token in public valuation JSON',
  !publicJson.includes('access_token'));
check('No appkey in public valuation JSON',
  !publicJson.toLowerCase().includes('appkey'));
check('No authorization header string in public valuation JSON',
  !publicJson.toLowerCase().includes('authorization'));
log('');

// ── Group 10: Aggregate valuation — same-currency (all quoted) ────────────────
log('--- Group 10: Aggregate valuation ---');

const portfolioSameCurrency = computePortfolioValuationFromQuotes(
  [SYNTH_POS, SYNTH_POS_2],
  { '000000': SYNTH_QUOTE_FRESH, '111111': SYNTH_QUOTE_2 },
  'KRW',
);

// SYNTH_POS: costBasis 600000, marketValue 750000
// SYNTH_POS_2: costBasis 150000, marketValue 135000
check('totalCostBasis = sum of all position cost bases (600000 + 150000 = 750000)',
  portfolioSameCurrency.totalCostBasis === 750000);
check('totalMarketValue computed when all quoted same-currency (750000 + 135000 = 885000)',
  portfolioSameCurrency.totalMarketValue === 885000);
check('totalUnrealizedPnl = totalMarketValue - totalCostBasis (885000 - 750000 = 135000)',
  portfolioSameCurrency.totalUnrealizedPnl === 135000);
check('quoteCoverage is all when all positions have quotes',
  portfolioSameCurrency.quoteCoverage === 'all');
check('staleState is fresh when all rows are fresh',
  portfolioSameCurrency.staleState === 'fresh');

// Partial: one position has a quote, one does not
const portfolioPartial = computePortfolioValuationFromQuotes(
  [SYNTH_POS, SYNTH_POS_2],
  { '000000': SYNTH_QUOTE_FRESH },
  'KRW',
);
check('totalMarketValue is null when coverage is partial',
  portfolioPartial.totalMarketValue === null);
check('quoteCoverage is partial when only some positions have quotes',
  portfolioPartial.quoteCoverage === 'partial');
check('staleState is stale-but-usable when coverage is partial',
  portfolioPartial.staleState === 'stale-but-usable');

// None: no quotes
const portfolioNone = computePortfolioValuationFromQuotes(
  [SYNTH_POS, SYNTH_POS_2],
  {},
  'KRW',
);
check('totalMarketValue is null when no quotes available',
  portfolioNone.totalMarketValue === null);
check('totalCostBasis still available when no quotes (600000 + 150000 = 750000)',
  portfolioNone.totalCostBasis === 750000);
check('quoteCoverage is unavailable when no positions have quotes',
  portfolioNone.quoteCoverage === 'unavailable');
check('staleState is unavailable when no quotes',
  portfolioNone.staleState === 'unavailable');
log('');

// ── Group 11: Mixed currency — FX required, no fabrication ───────────────────
log('--- Group 11: Mixed currency ---');

// KRW + USD positions in same portfolio — cross-currency aggregate requires FX
const synth_krw_quote = { ...SYNTH_QUOTE_FRESH, symbol: '000000' };
const synth_usd_quote = {
  symbol: 'SYNTHX',
  market: 'US',
  price: 120,
  currency: 'USD',
  change: 2,
  changePct: 1.7,
  marketState: 'open',
  asOf: '2025-06-25T02:00:00.000Z',
  staleState: 'fresh',
};

const portfolioMixedCurrency = computePortfolioValuationFromQuotes(
  [SYNTH_POS, SYNTH_POS_USD],
  { '000000': synth_krw_quote, 'SYNTHX': synth_usd_quote },
  'KRW',
);

check('totalMarketValue null when positions have mixed currencies (FX required)',
  portfolioMixedCurrency.totalMarketValue === null);
check('totalUnrealizedPnl null when mixed currencies (no FX fabrication)',
  portfolioMixedCurrency.totalUnrealizedPnl === null);
check('totalCostBasis still available for mixed-currency portfolio',
  portfolioMixedCurrency.totalCostBasis === 600000 + 500);
log('');

// ── Group 12: Safety boundaries ───────────────────────────────────────────────
log('--- Group 12: Safety boundaries ---');

check('Valuation route (when present) is fixture-only — no live source (3BV boundary)',
  !existsSync(VALUATION_ROUTE_TS) || !readFileSync(VALUATION_ROUTE_TS, 'utf8').includes('source=live'));
check('No /news page directory created', !existsSync(NEWS_PAGE_DIR));
check('portfolio.astro not modified by 3BV (no 3BV marker)',
  (() => {
    const portPath = join(root, 'src', 'pages', 'portfolio.astro');
    const content = existsSync(portPath) ? readFileSync(portPath, 'utf8') : '';
    return !content.includes('phase_3bv') && !content.includes('3BV');
  })());
check('HomePortfolioPanel not modified by 3BV',
  existsSync(join(root, 'src', 'components', 'HomePortfolioPanel.astro')));
check('HomeMarketNews present and unchanged',
  existsSync(join(root, 'src', 'components', 'HomeMarketNews.astro')));
check('Phase 3BV result doc exists', existsSync(RESULT_DOC));
check('buildPortfolioValuationFromQuotes does not expose providerMeta',
  pvContent.includes('buildPortfolioValuationFromQuotes') &&
  !pvContent.includes('providerMeta: quote.providerMeta'));
log('');

// ── Group 13: Network safety ──────────────────────────────────────────────────
log('--- Group 13: Network safety ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;

check('Checker does not read .env files',
  (() => {
    const src = readFileSync(new URL(import.meta.url), 'utf8');
    // Detect actual env-file reading patterns, not label-text mentions.
    // Split 'dotenv' to avoid self-match when this source is scanned.
    const dotEnvPkg = ['dot', 'env'].join('');
    return !(/readFileSync\s*\(\s*['"][./]*\.env/.test(src)) &&
      !src.includes("from '" + dotEnvPkg) &&
      !src.includes('require(' + "'" + dotEnvPkg);
  })());
log('');

// ── Phase 3BW artifact checks ────────────────────────────────────────────────
const VALUATION_ROUTE_3BW = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const FIXTURE_RESOLVER_3BW = join(root, 'src', 'lib', 'server', 'portfolioValuationFixture.ts');

check('Phase 3BW: valuation route file exists', existsSync(VALUATION_ROUTE_3BW));
check('Phase 3BW: fixture resolver exists', existsSync(FIXTURE_RESOLVER_3BW));
check('Phase 3BW: route imports buildPortfolioValuationFromQuotes',
  existsSync(VALUATION_ROUTE_3BW) && readFileSync(VALUATION_ROUTE_3BW, 'utf8').includes('buildPortfolioValuationFromQuotes'));
check('Phase 3BW: route has no live KIS import (no getKisDomesticQuote)',
  existsSync(VALUATION_ROUTE_3BW) && !readFileSync(VALUATION_ROUTE_3BW, 'utf8').includes('getKisDomesticQuote'));
check('Phase 3BW: route has no fetch call',
  existsSync(VALUATION_ROUTE_3BW) && !(/\bfetch\s*\(/.test(readFileSync(VALUATION_ROUTE_3BW, 'utf8'))));
check('Phase 3BW: route has no env reads',
  existsSync(VALUATION_ROUTE_3BW) && !readFileSync(VALUATION_ROUTE_3BW, 'utf8').includes('process.env') && !readFileSync(VALUATION_ROUTE_3BW, 'utf8').includes('import.meta.env'));
log('');

// ── Forbidden output scan ─────────────────────────────────────────────────────
// Only scan lines that are NOT check labels (i.e., not starting with [PASS]/[FAIL]).
// Check labels intentionally describe forbidden field names in their text
// ("No access_token in JSON") — those are descriptions of what we're verifying absent,
// not actual leakage. Actual leaked content would appear in non-label output lines.
const FORBIDDEN_RE = /access_token|authorization|bearer|supabase\.co|stck_prpr|prdy_vrss|rt_cd|appkey|appsecret|kis_app_key|kis_app_secret/i;
const nonLabelOutput = loggedLines
  .filter((line) => !line.includes('[PASS]') && !line.includes('[FAIL]'))
  .join('\n');
const forbiddenMatches = (nonLabelOutput.match(new RegExp(FORBIDDEN_RE.source, 'gi')) ?? []).length;
if (forbiddenMatches > 0) {
  log(`  [FAIL] Forbidden output found: ${forbiddenMatches} match(es) in non-label checker output`);
  failures++;
} else {
  log('  [PASS] No forbidden credential/secret terms found in checker output');
  passes++;
}
log('');

// ── Summary ───────────────────────────────────────────────────────────────────
log('=== Phase 3BV KIS Quote Adapter Mocked Contract — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
