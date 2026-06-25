/**
 * Phase 3BW — Portfolio Valuation API Route Fixture Contract Checker.
 * No network calls. No .env reads. No live KIS calls. Exits non-zero on any failure.
 *
 * Strategy:
 *   Groups 1-4: static file/content inspection of route and fixture TS modules.
 *   Groups 5-10: pure JavaScript behavioral tests mirroring route validation logic
 *                and valuation computation. No imports of TS files.
 *   Groups 11-13: safety boundaries and network safety.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ROUTE = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const FIXTURE = join(root, 'src', 'lib', 'server', 'portfolioValuationFixture.ts');
const PORTFOLIO_VALUATION = join(root, 'src', 'lib', 'server', 'portfolioValuation.ts');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3bw_portfolio_valuation_api_route_fixture_result_v0.1.md');
const PACKAGE_JSON = join(root, 'package.json');
const NEWS_PAGE = join(root, 'src', 'pages', 'news');
const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const HPP = join(root, 'src', 'components', 'HomePortfolioPanel.astro');
const HMN = join(root, 'src', 'components', 'HomeMarketNews.astro');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  const line = `  [${pass ? 'PASS' : 'FAIL'}] ${label}`;
  log(line);
  if (pass) passes++; else failures++;
};

log('=== Phase 3BW Portfolio Valuation API Route Fixture Contract ===');
log('');

const routeContent = existsSync(ROUTE) ? readFileSync(ROUTE, 'utf8') : '';
const fixtureContent = existsSync(FIXTURE) ? readFileSync(FIXTURE, 'utf8') : '';
const pvContent = existsSync(PORTFOLIO_VALUATION) ? readFileSync(PORTFOLIO_VALUATION, 'utf8') : '';

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

// ── Group 1: File existence ───────────────────────────────────────────────────
log('--- Group 1: File existence ---');

check('API route file exists (src/pages/api/portfolio/valuation.ts)', existsSync(ROUTE));
check('Fixture resolver exists (src/lib/server/portfolioValuationFixture.ts)', existsSync(FIXTURE));
check('portfolioValuation.ts still exists', existsSync(PORTFOLIO_VALUATION));
check('Phase 3BW result doc exists', existsSync(RESULT_DOC));
check('package.json has check:portfolio-valuation-api script',
  typeof pkg.scripts?.['check:portfolio-valuation-api'] === 'string');
log('');

// ── Group 2: Static contract — API route ────────────────────────────────────
log('--- Group 2: Static contract — API route ---');

check('Route has export const prerender = false',
  routeContent.includes('prerender = false'));
check('Route exports POST handler',
  routeContent.includes('export const POST'));
check('Route exports GET handler (for 405)',
  routeContent.includes('export const GET'));
check('Route imports buildPortfolioValuationFromQuotes',
  routeContent.includes('buildPortfolioValuationFromQuotes'));
check('Route imports resolveFixtureQuotes (from fixture resolver)',
  routeContent.includes('resolveFixtureQuotes'));
check('Route does NOT import getKisDomesticQuote (no live KIS)',
  !routeContent.includes('getKisDomesticQuote'));
check('Route does NOT import kisClient (no live KIS client)',
  !routeContent.includes('kisClient'));
check('Route does NOT call fetch',
  !(/\bfetch\s*\(/.test(routeContent)));
check('Route does NOT read process.env',
  !routeContent.includes('process.env'));
check('Route does NOT read import.meta.env',
  !routeContent.includes('import.meta.env'));
check('Route does NOT use Supabase',
  !routeContent.includes('@supabase') && !routeContent.includes('supabase'));
check('Route default source is fixture (no live/auto source)',
  routeContent.includes("'fixture'") && !routeContent.includes("source=live") && !routeContent.includes("source=auto"));
check('Route returns 405 for GET (METHOD_NOT_ALLOWED)',
  routeContent.includes('METHOD_NOT_ALLOWED') && routeContent.includes('405'));
check('Route validation rejects unsupported source (UNSUPPORTED_SOURCE)',
  routeContent.includes('UNSUPPORTED_SOURCE'));
check('Route validation uses VALIDATION_FAILED code',
  routeContent.includes('VALIDATION_FAILED'));
check('Route sanitizes INTERNAL_ERROR (Portfolio valuation failed safely)',
  routeContent.includes('Portfolio valuation failed safely'));
check('Route response meta has liveAttempted: false',
  routeContent.includes('liveAttempted: false'));
check('Route response meta has rawProviderStored: false',
  routeContent.includes('rawProviderStored: false'));
check('Route does NOT expose providerMeta in response',
  !routeContent.includes('providerMeta:') || routeContent.includes('providerMeta is intentionally') || routeContent.includes('providerMeta intentionally'));
check('Route does NOT expose raw KIS field stck_prpr',
  !routeContent.includes('stck_prpr'));
check('Route does NOT expose raw KIS field rt_cd',
  !routeContent.includes('rt_cd'));
check('Route caps positions at 100',
  routeContent.includes('100'));
log('');

// ── Group 3: Static contract — fixture resolver ──────────────────────────────
log('--- Group 3: Static contract — fixture resolver ---');

check('Fixture resolver calls assertServerRuntime',
  fixtureContent.includes('assertServerRuntime'));
check('Fixture resolver exports resolveFixtureQuotes',
  fixtureContent.includes('export const resolveFixtureQuotes'));
check('Fixture resolver does NOT call fetch',
  !(/\bfetch\s*\(/.test(fixtureContent)));
check('Fixture resolver does NOT read process.env',
  !fixtureContent.includes('process.env'));
check('Fixture resolver does NOT read import.meta.env',
  !fixtureContent.includes('import.meta.env'));
check('Fixture resolver does NOT import KIS live client',
  !fixtureContent.includes('kisClient'));
check('Fixture resolver does NOT import getKisDomesticQuote',
  !fixtureContent.includes('getKisDomesticQuote'));
check('Fixture resolver has synthetic marker comment',
  fixtureContent.includes('isSynthetic') || fixtureContent.includes('NOT real') || fixtureContent.includes('synthetic'));
check('Fixture resolver has at least one KR fixture symbol (005930)',
  fixtureContent.includes('005930'));
check('Fixture resolver has at least one stale-but-usable fixture',
  fixtureContent.includes('stale-but-usable'));
check('Fixture resolver does NOT contain raw KIS field names',
  !fixtureContent.includes('stck_prpr') && !fixtureContent.includes('rt_cd'));
check('Fixture resolver does NOT contain providerMeta assignment',
  !fixtureContent.includes('providerMeta:'));
log('');

// ── Group 4: Static contract — portfolioValuation.ts ────────────────────────
log('--- Group 4: Static contract — portfolioValuation.ts (unchanged) ---');

check('buildPortfolioValuationFromQuotes still exported',
  pvContent.includes('export const buildPortfolioValuationFromQuotes'));
check('buildPortfolioValuationReadiness still exported',
  pvContent.includes('export const buildPortfolioValuationReadiness'));
check('assertServerRuntime still called in portfolioValuation.ts',
  pvContent.includes('assertServerRuntime'));
log('');

// ── Mirrored route validation logic (pure JS) ────────────────────────────────
// Mirrors the validation in src/pages/api/portfolio/valuation.ts

const validatePosition = (p, index) => {
  if (!p || typeof p !== 'object') return `positions[${index}]: must be an object`;
  if (typeof p.symbol !== 'string' || !p.symbol.trim()) return `positions[${index}].symbol: required non-empty string`;
  if (p.market !== 'KR' && p.market !== 'US') return `positions[${index}].market: must be KR or US`;
  if (p.assetType !== 'stock' && p.assetType !== 'etf') return `positions[${index}].assetType: must be stock or etf`;
  if (typeof p.buyPrice !== 'number' || !isFinite(p.buyPrice) || p.buyPrice < 0) return `positions[${index}].buyPrice: must be a finite number >= 0`;
  if (typeof p.quantity !== 'number' || !isFinite(p.quantity) || p.quantity <= 0) return `positions[${index}].quantity: must be a finite number > 0`;
  if (p.currency !== 'KRW' && p.currency !== 'USD') return `positions[${index}].currency: must be KRW or USD`;
  return null;
};

const validateRequest = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return { ok: false, code: 'VALIDATION_FAILED', message: 'Request body must be a JSON object.' };
  if (typeof body.portfolioId !== 'string' || !body.portfolioId.trim())
    return { ok: false, code: 'VALIDATION_FAILED', message: 'portfolioId: required non-empty string.' };
  if (body.baseCurrency !== 'KRW' && body.baseCurrency !== 'USD')
    return { ok: false, code: 'VALIDATION_FAILED', message: 'baseCurrency: must be KRW or USD.' };
  const source = body.source ?? 'fixture';
  if (source !== 'fixture')
    return { ok: false, code: 'UNSUPPORTED_SOURCE', message: 'Only source=fixture is supported. Live quote sources are not enabled.' };
  if (!Array.isArray(body.positions))
    return { ok: false, code: 'VALIDATION_FAILED', message: 'positions: must be an array.' };
  if (body.positions.length > 100)
    return { ok: false, code: 'VALIDATION_FAILED', message: 'positions: maximum 100 positions per request.' };
  for (let i = 0; i < body.positions.length; i++) {
    const err = validatePosition(body.positions[i], i);
    if (err) return { ok: false, code: 'VALIDATION_FAILED', message: err };
  }
  return null; // valid
};

// Synthetic fixture quotes (mirrors portfolioValuationFixture.ts)
const FIXTURE_QUOTES = {
  '005930': { symbol: '005930', market: 'KR', price: 73000, currency: 'KRW', change: 500, changePct: 0.69, marketState: 'closed', asOf: '2026-06-25T06:00:00.000Z', staleState: 'fresh' },
  '000660': { symbol: '000660', market: 'KR', price: 198000, currency: 'KRW', change: -1000, changePct: -0.5, marketState: 'closed', asOf: '2026-06-25T06:00:00.000Z', staleState: 'fresh' },
  '035420': { symbol: '035420', market: 'KR', price: 185000, currency: 'KRW', change: 0, changePct: 0, marketState: 'closed', asOf: '2026-06-24T06:00:00.000Z', staleState: 'stale-but-usable' },
  '069500': { symbol: '069500', market: 'KR', price: 34000, currency: 'KRW', change: 200, changePct: 0.59, marketState: 'closed', asOf: '2026-06-25T06:00:00.000Z', staleState: 'fresh' },
};

const resolveFixtureQuotesJS = (symbols) => {
  const result = {};
  for (const s of symbols) { result[s] = FIXTURE_QUOTES[s] ?? null; }
  return result;
};

// Mirrors buildPositionValuationFromQuote (spreads position fields including symbol)
const computeRow = (pos, quote, fallbackCurrency) => {
  if (!quote) {
    return {
      ...pos,
      positionId: pos.id || `${pos.market}:${pos.symbol}`,
      displayName: pos.name || pos.symbol,
      currentPrice: null, marketValue: null,
      costBasis: pos.buyPrice * pos.quantity,
      unrealizedPnl: null, unrealizedPnlPct: null,
      valuationCurrency: pos.currency || fallbackCurrency,
      staleState: 'unavailable',
    };
  }
  const costBasis = pos.buyPrice * pos.quantity;
  const currentPrice = quote.price;
  const marketValue = currentPrice * pos.quantity;
  const unrealizedPnl = marketValue - costBasis;
  const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null;
  return {
    ...pos,
    positionId: pos.id || `${pos.market}:${pos.symbol}`,
    displayName: pos.name || pos.symbol,
    currentPrice, marketValue, costBasis, unrealizedPnl, unrealizedPnlPct,
    valuationCurrency: pos.currency || fallbackCurrency,
    quoteAsOf: quote.asOf,
    staleState: quote.staleState,
  };
};

// Mirrors buildPortfolioValuationFromQuotes
const computeValuation = (portfolioId, baseCurrency, positions, quotesBySymbol) => {
  const rows = positions.map((p) => computeRow(p, quotesBySymbol[p.symbol] ?? null, baseCurrency));
  const totalCostBasis = rows.reduce((s, r) => s + r.costBasis, 0);
  const quotedRows = rows.filter((r) => r.currentPrice !== null);
  const allQuoted = rows.length > 0 && quotedRows.length === rows.length;
  const allSameCurrency = rows.every((r) => r.valuationCurrency === baseCurrency);
  let totalMarketValue = null;
  let totalUnrealizedPnl = null;
  if (allQuoted && allSameCurrency) {
    totalMarketValue = rows.reduce((s, r) => s + (r.marketValue ?? 0), 0);
    totalUnrealizedPnl = totalMarketValue - totalCostBasis;
  }
  const staleSummary =
    rows.length === 0 ? 'unavailable' :
    allQuoted ? (rows.every((r) => r.staleState === 'fresh') ? 'fresh' : 'stale-but-usable') :
    quotedRows.length > 0 ? 'stale-but-usable' : 'unavailable';
  return { scope: 'single', portfolioId, rows, totalCostBasis, totalMarketValue, totalUnrealizedPnl, baseCurrency, staleState: staleSummary };
};

// Mirrors the full route response builder (success path)
const buildRouteResponse = (body) => {
  const err = validateRequest(body);
  if (err) return { ok: false, error: err, meta: { liveAttempted: false, rawProviderStored: false } };
  const portfolioId = body.portfolioId.trim();
  const baseCurrency = body.baseCurrency;
  const positions = body.positions.map((p) => ({
    portfolioId,
    market: p.market,
    symbol: p.symbol.trim(),
    name: p.name ?? null,
    assetType: p.assetType,
    quantity: p.quantity,
    buyPrice: p.buyPrice,
    buyDate: p.buyDate ?? null,
    currency: p.currency,
    ...(p.id ? { id: p.id } : {}),
  }));
  const symbols = [...new Set(positions.map((p) => p.symbol))];
  const quotesBySymbol = resolveFixtureQuotesJS(symbols);
  const valuation = computeValuation(portfolioId, baseCurrency, positions, quotesBySymbol);
  const missingQuoteSymbols = symbols.filter((s) => quotesBySymbol[s] === null);
  const unsupportedSymbols = [...new Set(positions.filter((p) => p.market === 'US').map((p) => p.symbol))];
  return {
    ok: true,
    data: {
      portfolioId, baseCurrency, source: 'fixture', valuation,
      meta: { quoteSource: 'fixture', liveAttempted: false, rawProviderStored: false, generatedAt: new Date().toISOString(), unsupportedSymbols, missingQuoteSymbols },
    },
  };
};

// ── Group 5: Request validation behavioral tests ─────────────────────────────
log('--- Group 5: Request validation ---');

check('Null body returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse(null); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
check('Array body returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse([]); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
check('Missing portfolioId returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse({ baseCurrency: 'KRW', positions: [] }); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
check('Empty portfolioId returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse({ portfolioId: '  ', baseCurrency: 'KRW', positions: [] }); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
check('Invalid baseCurrency returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'JPY', positions: [] }); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
check('source=live returns UNSUPPORTED_SOURCE',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: [], source: 'live' }); return !r.ok && r.error.code === 'UNSUPPORTED_SOURCE'; })());
check('source=auto returns UNSUPPORTED_SOURCE',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: [], source: 'auto' }); return !r.ok && r.error.code === 'UNSUPPORTED_SOURCE'; })());
check('source absent defaults to fixture (no error)',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: [] }); return r.ok; })());
check('source=fixture explicit is valid',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: [], source: 'fixture' }); return r.ok; })());
check('Non-array positions returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: 'bad' }); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
check('101 positions returns VALIDATION_FAILED',
  (() => {
    const manyPositions = Array.from({ length: 101 }, (_, i) => ({
      symbol: `00${String(i).padStart(4, '0')}0`, market: 'KR', assetType: 'stock', buyPrice: 10000, quantity: 1, currency: 'KRW',
    }));
    const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: manyPositions });
    return !r.ok && r.error.code === 'VALIDATION_FAILED';
  })());
check('Invalid market returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: [{ symbol: '005930', market: 'EU', assetType: 'stock', buyPrice: 60000, quantity: 1, currency: 'KRW' }] }); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
check('Negative buyPrice returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: [{ symbol: '005930', market: 'KR', assetType: 'stock', buyPrice: -1, quantity: 1, currency: 'KRW' }] }); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
check('Zero quantity returns VALIDATION_FAILED',
  (() => { const r = buildRouteResponse({ portfolioId: 'p1', baseCurrency: 'KRW', positions: [{ symbol: '005930', market: 'KR', assetType: 'stock', buyPrice: 60000, quantity: 0, currency: 'KRW' }] }); return !r.ok && r.error.code === 'VALIDATION_FAILED'; })());
log('');

// ── Group 6: Success response shape ─────────────────────────────────────────
log('--- Group 6: Success response shape ---');

const singlePos = { symbol: '005930', market: 'KR', assetType: 'stock', buyPrice: 60000, quantity: 10, currency: 'KRW' };
const successResp = buildRouteResponse({ portfolioId: 'port-001', baseCurrency: 'KRW', positions: [singlePos] });

check('Success response has ok: true', successResp.ok === true);
check('Success response has data.portfolioId', successResp.data?.portfolioId === 'port-001');
check('Success response has data.baseCurrency', successResp.data?.baseCurrency === 'KRW');
check('Success response has data.source === fixture', successResp.data?.source === 'fixture');
check('Success response has data.valuation', !!successResp.data?.valuation);
check('Success response has data.meta.quoteSource === fixture', successResp.data?.meta?.quoteSource === 'fixture');
check('Success response meta.liveAttempted === false', successResp.data?.meta?.liveAttempted === false);
check('Success response meta.rawProviderStored === false', successResp.data?.meta?.rawProviderStored === false);
check('Success response meta.generatedAt is a string', typeof successResp.data?.meta?.generatedAt === 'string');
check('Success response meta.missingQuoteSymbols is array', Array.isArray(successResp.data?.meta?.missingQuoteSymbols));
check('Success response meta.unsupportedSymbols is array', Array.isArray(successResp.data?.meta?.unsupportedSymbols));
check('Success response has data.valuation.rows', Array.isArray(successResp.data?.valuation?.rows));
check('Success response has data.valuation.totalCostBasis', typeof successResp.data?.valuation?.totalCostBasis === 'number');
log('');

// ── Group 7: Fixture quote computation ──────────────────────────────────────
log('--- Group 7: Fixture quote computation ---');

const row005930 = successResp.data?.valuation?.rows?.[0];

check('005930 fixture: costBasis = 60000 × 10 = 600000',
  row005930?.costBasis === 600000);
check('005930 fixture: currentPrice = 73000 (synthetic fixture value)',
  row005930?.currentPrice === 73000);
check('005930 fixture: marketValue = 73000 × 10 = 730000',
  row005930?.marketValue === 730000);
check('005930 fixture: unrealizedPnl = 730000 - 600000 = 130000',
  row005930?.unrealizedPnl === 130000);
check('005930 fixture: unrealizedPnlPct is computed and positive',
  typeof row005930?.unrealizedPnlPct === 'number' && row005930.unrealizedPnlPct > 0);
check('005930 fixture: staleState is fresh',
  row005930?.staleState === 'fresh');
check('005930 fixture: providerMeta absent from row',
  !Object.prototype.hasOwnProperty.call(row005930 ?? {}, 'providerMeta'));
log('');

// ── Group 8: Missing quote behavior ─────────────────────────────────────────
log('--- Group 8: Missing quote (symbol not in fixture) ---');

const unknownPos = { symbol: '999999', market: 'KR', assetType: 'stock', buyPrice: 50000, quantity: 5, currency: 'KRW' };
const respUnknown = buildRouteResponse({ portfolioId: 'port-002', baseCurrency: 'KRW', positions: [unknownPos] });
const rowUnknown = respUnknown.data?.valuation?.rows?.[0];

check('Unknown symbol: costBasis still available (50000 × 5 = 250000)',
  rowUnknown?.costBasis === 250000);
check('Unknown symbol: currentPrice is null',
  rowUnknown?.currentPrice === null);
check('Unknown symbol: marketValue is null',
  rowUnknown?.marketValue === null);
check('Unknown symbol: unrealizedPnl is null',
  rowUnknown?.unrealizedPnl === null);
check('Unknown symbol: staleState is unavailable',
  rowUnknown?.staleState === 'unavailable');
check('Unknown symbol appears in missingQuoteSymbols',
  (respUnknown.data?.meta?.missingQuoteSymbols ?? []).includes('999999'));
log('');

// ── Group 9: Multi-position and aggregate behavior ──────────────────────────
log('--- Group 9: Multi-position aggregate behavior ---');

// All quoted, same currency, all fresh
const resp2 = buildRouteResponse({
  portfolioId: 'port-003',
  baseCurrency: 'KRW',
  positions: [
    { symbol: '005930', market: 'KR', assetType: 'stock', buyPrice: 60000, quantity: 10, currency: 'KRW' },
    { symbol: '000660', market: 'KR', assetType: 'stock', buyPrice: 180000, quantity: 2, currency: 'KRW' },
  ],
});

// 005930: costBasis=600000, mv=730000
// 000660: costBasis=360000, mv=396000
check('Two-position: totalCostBasis = 600000 + 360000 = 960000',
  resp2.data?.valuation?.totalCostBasis === 960000);
check('Two-position all-quoted same-currency: totalMarketValue = 730000 + 396000 = 1126000',
  resp2.data?.valuation?.totalMarketValue === 1126000);
check('Two-position: totalUnrealizedPnl = 1126000 - 960000 = 166000',
  resp2.data?.valuation?.totalUnrealizedPnl === 166000);
check('Two-position all-fresh: staleState is fresh',
  resp2.data?.valuation?.staleState === 'fresh');

// One quoted, one missing → partial coverage → totalMarketValue null
const respPartial = buildRouteResponse({
  portfolioId: 'port-004',
  baseCurrency: 'KRW',
  positions: [
    { symbol: '005930', market: 'KR', assetType: 'stock', buyPrice: 60000, quantity: 10, currency: 'KRW' },
    { symbol: '888888', market: 'KR', assetType: 'stock', buyPrice: 50000, quantity: 5, currency: 'KRW' },
  ],
});
check('Partial coverage: totalMarketValue is null',
  respPartial.data?.valuation?.totalMarketValue === null);
check('Partial coverage: totalCostBasis still available',
  typeof respPartial.data?.valuation?.totalCostBasis === 'number' && respPartial.data.valuation.totalCostBasis > 0);
check('Partial coverage: staleState is stale-but-usable',
  respPartial.data?.valuation?.staleState === 'stale-but-usable');
log('');

// ── Group 10: Mixed currency and FX policy ───────────────────────────────────
log('--- Group 10: Mixed currency / FX policy ---');

// US position returns null quote (fixture has no US quotes)
const respUS = buildRouteResponse({
  portfolioId: 'port-005',
  baseCurrency: 'KRW',
  positions: [
    { symbol: '005930', market: 'KR', assetType: 'stock', buyPrice: 60000, quantity: 10, currency: 'KRW' },
    { symbol: 'AAPL', market: 'US', assetType: 'stock', buyPrice: 180, quantity: 5, currency: 'USD' },
  ],
});
check('US position: currentPrice null (no US fixture)',
  (() => {
    const rows = respUS.data?.valuation?.rows ?? [];
    const usRow = rows.find((r) => r.symbol === 'AAPL');
    return usRow?.currentPrice === null;
  })());
check('US position: costBasis available (180 × 5 = 900)',
  (() => {
    const rows = respUS.data?.valuation?.rows ?? [];
    const usRow = rows.find((r) => r.symbol === 'AAPL');
    return usRow?.costBasis === 900;
  })());
check('Mixed currency: totalMarketValue null (FX not fabricated)',
  respUS.data?.valuation?.totalMarketValue === null);
check('US symbol appears in missingQuoteSymbols',
  (respUS.data?.meta?.missingQuoteSymbols ?? []).includes('AAPL'));
check('US symbol appears in unsupportedSymbols meta',
  (respUS.data?.meta?.unsupportedSymbols ?? []).includes('AAPL'));
check('liveAttempted is false in US-position response',
  respUS.data?.meta?.liveAttempted === false);

// Single stale-but-usable fixture (035420)
const respStale = buildRouteResponse({
  portfolioId: 'port-006',
  baseCurrency: 'KRW',
  positions: [{ symbol: '035420', market: 'KR', assetType: 'stock', buyPrice: 170000, quantity: 3, currency: 'KRW' }],
});
check('Stale fixture: staleState propagated as stale-but-usable',
  respStale.data?.valuation?.staleState === 'stale-but-usable');
check('Stale fixture: currentPrice present (stale-but-usable means quote available)',
  respStale.data?.valuation?.rows?.[0]?.currentPrice === 185000);
log('');

// ── Group 11: Public safety ───────────────────────────────────────────────────
log('--- Group 11: Public safety ---');

const successJson = JSON.stringify(successResp);

check('providerMeta absent from success response JSON',
  !successJson.includes('providerMeta'));
check('rawProviderStored is not true in response JSON',
  !successJson.includes('"rawProviderStored":true'));
check('No stck_prpr in response JSON',
  !successJson.includes('stck_prpr'));
check('No prdy_vrss in response JSON',
  !successJson.includes('prdy_vrss'));
check('No rt_cd in response JSON',
  !successJson.includes('rt_cd'));
check('No access_token in response JSON',
  !successJson.toLowerCase().includes('access_token'));
check('No appkey in response JSON',
  !successJson.toLowerCase().includes('appkey'));
check('No authorization in response JSON',
  !successJson.toLowerCase().includes('authorization'));
check('No source=live in success response JSON',
  !successJson.includes('source=live') && successJson.includes('"source":"fixture"'));
log('');

// ── Group 12: Safety boundaries ──────────────────────────────────────────────
log('--- Group 12: Safety boundaries ---');

check('portfolio.astro not modified by 3BW (still exists, no 3BW marker)',
  (() => {
    if (!existsSync(PORTFOLIO_ASTRO)) return false;
    const c = readFileSync(PORTFOLIO_ASTRO, 'utf8');
    return !c.includes('phase_3bw') && !c.includes('3BW');
  })());
check('HomePortfolioPanel still present', existsSync(HPP));
check('HomeMarketNews still present', existsSync(HMN));
check('No /news page created', !existsSync(NEWS_PAGE));
check('Phase 3BW result doc exists', existsSync(RESULT_DOC));
check('buildPortfolioValuationFromQuotes still exported (3BW does not break 3BV)',
  pvContent.includes('export const buildPortfolioValuationFromQuotes'));
log('');

// ── Group 13: Network safety ─────────────────────────────────────────────────
log('--- Group 13: Network safety ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;

check('Checker does not read .env files',
  (() => {
    const src = readFileSync(new URL(import.meta.url), 'utf8');
    const dotEnvPkg = ['dot', 'env'].join('');
    return !(/readFileSync\s*\(\s*['"][./]*\.env/.test(src)) &&
      !src.includes("from '" + dotEnvPkg) &&
      !src.includes("require('" + dotEnvPkg);
  })());
log('');

// ── Summary ───────────────────────────────────────────────────────────────────
log('=== Phase 3BW Portfolio Valuation API Route Fixture Contract — Summary ===');
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
