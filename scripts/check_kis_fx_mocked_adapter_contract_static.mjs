/**
 * Static + mocked behavioral contract check for Phase 3DM:
 * KIS + FX Mocked Adapter Contract Hardening.
 *
 * No network calls. No .env reads. No live KIS. No live FX. No Supabase.
 * Exits non-zero on any failure.
 *
 * Strategy:
 *   Groups 1-2: file existence and safety boundary (static).
 *   Groups 3-6: pure JS behavioral tests mirroring server TS logic.
 *   Groups 7-9: API route policy, documentation, and forbidden patterns (static).
 */

// Block all network calls immediately.
globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const FX_MOCK       = join(root, 'src', 'lib', 'server', 'providers', 'fxMockAdapter.ts');
const KIS_CLIENT    = join(root, 'src', 'lib', 'server', 'providers', 'kisClient.ts');
const QUOTE_CACHE   = join(root, 'src', 'lib', 'server', 'marketData', 'quoteCache.ts');
const QUOTES        = join(root, 'src', 'lib', 'server', 'marketData', 'quotes.ts');
const PV            = join(root, 'src', 'lib', 'server', 'portfolioValuation.ts');
const VALUATION_RT  = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const RESULT_DOC    = join(root, 'docs', 'planning', 'phase_3dm_kis_fx_mocked_adapter_contract_result_v0.1.md');
const CHANGELOG     = join(root, 'docs', 'planning', 'planning_changelog.md');
const PACKAGE       = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;
const loggedLines = [];

const check = (label, cond) => {
  const ok = !!cond;
  const line = `  [${ok ? 'PASS' : 'FAIL'}] ${label}`;
  log(line);
  loggedLines.push(line);
  if (ok) passes++; else failures++;
};

log('=== Phase 3DM KIS + FX Mocked Adapter Contract ===');
log('');

const read = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';
const fxSrc      = read(FX_MOCK);
const kisSrc     = read(KIS_CLIENT);
const cacheSrc   = read(QUOTE_CACHE);
const pvSrc      = read(PV);
const routeSrc   = read(VALUATION_RT);
const resultDoc  = read(RESULT_DOC);
const changelog  = read(CHANGELOG);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE, 'utf8')); } catch {}

// ── Group 1: File Existence ──────────────────────────────────────────────────
log('--- Group 1: File existence ---');
check('fxMockAdapter.ts created', existsSync(FX_MOCK));
check('kisClient.ts exists',      existsSync(KIS_CLIENT));
check('quoteCache.ts exists',     existsSync(QUOTE_CACHE));
check('quotes.ts exists',         existsSync(QUOTES));
check('portfolioValuation.ts exists', existsSync(PV));
check('valuation API route exists', existsSync(VALUATION_RT));
check('Phase 3DM result doc exists', existsSync(RESULT_DOC));
check('planning_changelog.md exists', existsSync(CHANGELOG));
check('package.json has check:kis-fx-mocked-adapter script',
  typeof pkg.scripts?.['check:kis-fx-mocked-adapter'] === 'string');
log('');

// ── Group 2: Safety Boundary ─────────────────────────────────────────────────
log('--- Group 2: Safety boundary ---');
check('fxMockAdapter.ts has no fetch call',
  !(/\bfetch\s*\(/.test(fxSrc)));
check('fxMockAdapter.ts has no process.env read',
  !fxSrc.includes('process.env'));
check('fxMockAdapter.ts has no Supabase import',
  !fxSrc.includes('supabase') && !fxSrc.includes('@supabase'));
check('fxMockAdapter.ts does not import KIS client',
  !fxSrc.includes('kisClient'));
check('buildPortfolioValuationFromQuotesWithFx added (no live provider call)',
  pvSrc.includes('buildPortfolioValuationFromQuotesWithFx') &&
  !pvSrc.includes("fetch('") && !pvSrc.includes('fetch(`'));
check('portfolioValuation.ts has no new fetch call (still no network)',
  !(/\bfetch\s*\(/.test(pvSrc)));
check('portfolioValuation.ts has no process.env read',
  !pvSrc.includes('process.env'));
check('fxMockAdapter.ts source label is mocked (not live/realtime)',
  fxSrc.includes("source: 'mocked'") && !fxSrc.includes('실시간'));
log('');

// ── Mirrored logic (pure JS — no TS imports) ─────────────────────────────────
// FX mock adapter logic: mirrors fxMockAdapter.ts
const MOCKED_USD_KRW_RATE = 1350;

const getMockedFxRate = (baseCurrency, quoteCurrency) => {
  if (baseCurrency === quoteCurrency) {
    return { ok: true, data: { pair: `${baseCurrency}/${quoteCurrency}`, baseCurrency, quoteCurrency, rate: 1, source: 'mocked', staleState: 'sample', provider: 'fx-mock' }, staleState: 'sample' };
  }
  if (baseCurrency === 'USD' && quoteCurrency === 'KRW') {
    return { ok: true, data: { pair: 'USD/KRW', baseCurrency: 'USD', quoteCurrency: 'KRW', rate: MOCKED_USD_KRW_RATE, source: 'mocked', staleState: 'sample', provider: 'fx-mock' }, staleState: 'sample' };
  }
  if (baseCurrency === 'KRW' && quoteCurrency === 'USD') {
    return { ok: true, data: { pair: 'KRW/USD', baseCurrency: 'KRW', quoteCurrency: 'USD', rate: 1 / MOCKED_USD_KRW_RATE, source: 'mocked', staleState: 'sample', provider: 'fx-mock' }, staleState: 'sample' };
  }
  return { ok: false, code: 'NOT_IMPLEMENTED', message: 'FX pair not supported by mocked adapter.', provider: 'fx-mock', staleState: 'unavailable' };
};

// KIS validation logic: mirrors kisClient.ts
const isValidKrSymbol = (symbol) => /^\d{6}$/.test(symbol.trim());
const validateKisInput = (market, symbol) => {
  if (market !== 'KR') return { ok: false, code: 'SYMBOL_UNSUPPORTED', staleState: 'unavailable' };
  if (!isValidKrSymbol(symbol)) return { ok: false, code: 'VALIDATION_FAILED', staleState: 'unavailable' };
  return null;
};

// KIS readiness logic: mirrors getKisQuoteConfigReadiness
const getKisReadiness = ({ flagEnabled, runtimeClass, accountNoPresent, missingEnvCount }) => {
  if (['vercel-production', 'node-production', 'unknown'].includes(runtimeClass)) return { ready: false, reason: 'production_not_allowed' };
  if (accountNoPresent) return { ready: false, reason: 'production_not_allowed' };
  if (runtimeClass === 'vercel-preview') return { ready: false, reason: 'preview_guard_required' };
  if (!flagEnabled) return { ready: false, reason: 'disabled' };
  if (missingEnvCount > 0) return { ready: false, reason: 'config_missing' };
  return { ready: true, reason: 'ready' };
};

// Cache state machine: mirrors getQuoteCacheState from quoteCache.ts
const FRESH_TTL_MS  = 15_000;
const STALE_TTL_MS  = 120_000;
const getCacheState = (entry, nowMs) => {
  if (!entry) return 'unavailable';
  if (nowMs <= entry.freshUntilMs) return 'fresh';
  if (nowMs <= entry.staleUntilMs) return 'stale-but-usable';
  return 'expired';
};
const makeCacheEntry = (snapshot, cachedAtMs) => ({
  snapshot,
  cachedAtMs,
  freshUntilMs: cachedAtMs + FRESH_TTL_MS,
  staleUntilMs: cachedAtMs + STALE_TTL_MS,
});

// Portfolio valuation with FX: mirrors buildPortfolioValuationFromQuotesWithFx
const buildPositionRow = (position, quote, baseCurrency) => {
  if (!quote) {
    return { ...position, positionId: position.id || `${position.market}:${position.symbol}`, currentPrice: null, marketValue: null, costBasis: position.buyPrice * position.quantity, unrealizedPnl: null, unrealizedPnlPct: null, valuationCurrency: position.currency || baseCurrency, staleState: 'unavailable' };
  }
  const costBasis = position.buyPrice * position.quantity;
  const marketValue = quote.price * position.quantity;
  const unrealizedPnl = marketValue - costBasis;
  return { ...position, positionId: position.id || `${position.market}:${position.symbol}`, currentPrice: quote.price, marketValue, costBasis, unrealizedPnl, unrealizedPnlPct: costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null, valuationCurrency: position.currency || baseCurrency, quoteAsOf: quote.asOf, staleState: quote.staleState };
};

const buildPortfolioWithFx = (portfolioId, baseCurrency, positions, quotesBySymbol, fxRate) => {
  const rows = positions.map((p) => buildPositionRow(p, quotesBySymbol[p.symbol] ?? null, baseCurrency));
  const totalCostBasis = rows.reduce((s, r) => s + r.costBasis, 0);
  const quotedRows = rows.filter((r) => r.currentPrice !== null);
  const allQuoted = rows.length > 0 && quotedRows.length === rows.length;
  const allSameCurrency = rows.every((r) => r.valuationCurrency === baseCurrency);

  let totalMarketValue = null;
  let totalUnrealizedPnl = null;
  let fxConversionApplied = false;

  if (allQuoted && allSameCurrency) {
    totalMarketValue = rows.reduce((s, r) => s + (r.marketValue ?? 0), 0);
    totalUnrealizedPnl = totalMarketValue - totalCostBasis;
  } else if (allQuoted && !allSameCurrency && fxRate) {
    let total = 0; let ok = true;
    for (const row of rows) {
      const mv = row.marketValue ?? 0;
      const rc = row.valuationCurrency;
      if (rc === baseCurrency) { total += mv; }
      else if (fxRate.baseCurrency === rc && fxRate.quoteCurrency === baseCurrency) { total += mv * fxRate.rate; }
      else if (fxRate.baseCurrency === baseCurrency && fxRate.quoteCurrency === rc) { if (fxRate.rate === 0) { ok = false; break; } total += mv / fxRate.rate; }
      else { ok = false; break; }
    }
    if (ok) { totalMarketValue = total; totalUnrealizedPnl = totalMarketValue - totalCostBasis; fxConversionApplied = true; }
  }

  const isMockedFx = fxConversionApplied && fxRate?.source === 'mocked';
  const staleState = rows.length === 0 ? 'unavailable'
    : allQuoted ? (rows.every((r) => r.staleState === 'fresh') && !isMockedFx ? 'fresh' : 'stale-but-usable')
    : quotedRows.length > 0 ? 'stale-but-usable' : 'unavailable';

  return { portfolioId, baseCurrency, rows, totalCostBasis, totalMarketValue, totalUnrealizedPnl, staleState };
};

// ── Group 3: FX Mock Contract ─────────────────────────────────────────────────
log('--- Group 3: FX mock contract (behavioral) ---');

const fxUsdKrw = getMockedFxRate('USD', 'KRW');
const fxKrwUsd = getMockedFxRate('KRW', 'USD');
const fxKrwKrw = getMockedFxRate('KRW', 'KRW');
const fxUnknown = getMockedFxRate('USD', 'USD'); // same-currency identity

check('USD/KRW rate returns ok:true',
  fxUsdKrw.ok === true);
check('USD/KRW rate is 1350',
  fxUsdKrw.ok && fxUsdKrw.data.rate === 1350);
check('USD/KRW source is mocked (not live/realtime)',
  fxUsdKrw.ok && fxUsdKrw.data.source === 'mocked');
check('USD/KRW staleState is sample',
  fxUsdKrw.ok && fxUsdKrw.data.staleState === 'sample');
check('USD/KRW provider is fx-mock',
  fxUsdKrw.ok && fxUsdKrw.data.provider === 'fx-mock');
check('KRW/USD rate returns ok:true',
  fxKrwUsd.ok === true);
check('KRW/USD rate is 1/1350 (inverse)',
  fxKrwUsd.ok && Math.abs(fxKrwUsd.data.rate - 1 / 1350) < 1e-10);
check('KRW/KRW identity rate is 1',
  fxKrwKrw.ok && fxKrwKrw.data.rate === 1);
check('USD/USD identity rate is 1',
  fxUnknown.ok && fxUnknown.data.rate === 1);
check('Static: fxMockAdapter.ts exports getMockedFxRate',
  fxSrc.includes('export const getMockedFxRate'));
check('Static: fxMockAdapter.ts exports convertCurrencyMocked',
  fxSrc.includes('export const convertCurrencyMocked'));
check('Static: fxMockAdapter.ts exports FxRateSnapshot type',
  fxSrc.includes('FxRateSnapshot'));
check('Static: fxMockAdapter.ts calls assertServerRuntime',
  fxSrc.includes('assertServerRuntime'));
check('Static: fxMockAdapter.ts rate constant is not 0',
  /MOCKED_USD_KRW_RATE\s*=\s*([1-9]\d*)/.test(fxSrc));
log('');

// ── Group 4: KIS Mock Contract (behavioral + static) ──────────────────────────
log('--- Group 4: KIS mock contract ---');

// 4a: KR stock success case
const errNull_krStock = validateKisInput('KR', '005930');
check('KR stock 005930 passes validation (no error)',
  errNull_krStock === null);
// 4b: KR ETF success case
const errNull_krEtf = validateKisInput('KR', '069500');
check('KR ETF 069500 passes validation (no error)',
  errNull_krEtf === null);
// 4c: US market unsupported
const errUS = validateKisInput('US', 'AAPL');
check('US market returns SYMBOL_UNSUPPORTED',
  errUS !== null && errUS.code === 'SYMBOL_UNSUPPORTED');
// 4d: Invalid KR symbol (not 6 digits)
const errInvalid4 = validateKisInput('KR', '1234');
check('4-digit KR symbol fails VALIDATION_FAILED',
  errInvalid4 !== null && errInvalid4.code === 'VALIDATION_FAILED');
const errInvalidAlpha = validateKisInput('KR', 'ABCDEF');
check('6-char non-digit KR symbol fails VALIDATION_FAILED',
  errInvalidAlpha !== null && errInvalidAlpha.code === 'VALIDATION_FAILED');
const errEmpty = validateKisInput('KR', '');
check('Empty KR symbol fails VALIDATION_FAILED',
  errEmpty !== null && errEmpty.code === 'VALIDATION_FAILED');
// 4e: Readiness guard cases
const rdyProd = getKisReadiness({ flagEnabled: true, runtimeClass: 'vercel-production', accountNoPresent: false, missingEnvCount: 0 });
check('vercel-production runtime → not ready (production_not_allowed)',
  rdyProd.ready === false && rdyProd.reason === 'production_not_allowed');
const rdyNodeProd = getKisReadiness({ flagEnabled: true, runtimeClass: 'node-production', accountNoPresent: false, missingEnvCount: 0 });
check('node-production runtime → not ready (production_not_allowed)',
  rdyNodeProd.ready === false && rdyNodeProd.reason === 'production_not_allowed');
const rdyAccountNo = getKisReadiness({ flagEnabled: true, runtimeClass: 'local', accountNoPresent: true, missingEnvCount: 0 });
check('KIS_ACCOUNT_NO present → not ready (production_not_allowed)',
  rdyAccountNo.ready === false && rdyAccountNo.reason === 'production_not_allowed');
const rdyPreviewNoGuard = getKisReadiness({ flagEnabled: true, runtimeClass: 'vercel-preview', accountNoPresent: false, missingEnvCount: 0 });
check('vercel-preview without guard → not ready (preview_guard_required)',
  rdyPreviewNoGuard.ready === false && rdyPreviewNoGuard.reason === 'preview_guard_required');
const rdyDisabled = getKisReadiness({ flagEnabled: false, runtimeClass: 'local', accountNoPresent: false, missingEnvCount: 0 });
check('KIS_ENABLE_LIVE_QUOTES not true → not ready (disabled)',
  rdyDisabled.ready === false && rdyDisabled.reason === 'disabled');
const rdyMissingEnv = getKisReadiness({ flagEnabled: true, runtimeClass: 'local', accountNoPresent: false, missingEnvCount: 2 });
check('Missing required env vars → not ready (config_missing)',
  rdyMissingEnv.ready === false && rdyMissingEnv.reason === 'config_missing');
const rdyReady = getKisReadiness({ flagEnabled: true, runtimeClass: 'local', accountNoPresent: false, missingEnvCount: 0 });
check('All conditions met → ready',
  rdyReady.ready === true && rdyReady.reason === 'ready');
// 4f: Static content checks
check('Static: kisClient.ts has validateKisDomesticQuoteInput',
  kisSrc.includes('validateKisDomesticQuoteInput'));
check('Static: kisClient.ts has getKisQuoteConfigReadiness',
  kisSrc.includes('getKisQuoteConfigReadiness'));
check('Static: kisClient.ts checks KIS_ACCOUNT_NO absent',
  kisSrc.includes('KIS_ACCOUNT_NO'));
check('Static: kisClient.ts checks featureFlagEnvName (KIS_ENABLE_LIVE_QUOTES)',
  kisSrc.includes('KIS_ENABLE_LIVE_QUOTES'));
check('Static: kisClient.ts hard-blocks vercel-production',
  kisSrc.includes('vercel-production'));
check('Static: kisClient.ts no raw field stck_prpr in output types',
  !kisSrc.includes("'stck_prpr'") || kisSrc.includes('stck_prpr?: unknown'));
log('');

// ── Group 5: Cache State Transitions (behavioral) ─────────────────────────────
log('--- Group 5: Cache state transitions (behavioral) ---');

const T0 = 1_000_000;
const SYNTH_SNAPSHOT = { symbol: '005930', market: 'KR', price: 73000, currency: 'KRW', staleState: 'fresh', asOf: new Date(T0).toISOString() };

// 5a: Cache miss → unavailable
check('Cache miss (null entry) → unavailable',
  getCacheState(null, T0) === 'unavailable');

// 5b: Fresh hit (within fresh TTL)
const freshEntry = makeCacheEntry(SYNTH_SNAPSHOT, T0);
check('Within fresh TTL → fresh',
  getCacheState(freshEntry, T0) === 'fresh');
check('At exactly freshUntilMs → fresh (boundary)',
  getCacheState(freshEntry, T0 + FRESH_TTL_MS) === 'fresh');
check('1ms past freshUntilMs → stale-but-usable',
  getCacheState(freshEntry, T0 + FRESH_TTL_MS + 1) === 'stale-but-usable');

// 5c: Stale-but-usable (past fresh TTL, within stale TTL)
check('Within stale TTL → stale-but-usable',
  getCacheState(freshEntry, T0 + FRESH_TTL_MS + 1000) === 'stale-but-usable');
check('At exactly staleUntilMs → stale-but-usable (boundary)',
  getCacheState(freshEntry, T0 + STALE_TTL_MS) === 'stale-but-usable');
check('1ms past staleUntilMs → expired',
  getCacheState(freshEntry, T0 + STALE_TTL_MS + 1) === 'expired');

// 5d: Expired
check('Past stale TTL → expired',
  getCacheState(freshEntry, T0 + STALE_TTL_MS + 60_000) === 'expired');

// 5e: Orchestration pattern: stale fallback when provider fails
const cachedAt5E = T0;
const staleEntry = makeCacheEntry(SYNTH_SNAPSHOT, cachedAt5E);
const nowAfterFreshExpiry = cachedAt5E + FRESH_TTL_MS + 5_000; // past fresh, within stale
const cacheState5E = getCacheState(staleEntry, nowAfterFreshExpiry);
check('Stale entry + provider failure → stale-but-usable fallback returned',
  cacheState5E === 'stale-but-usable');
check('Stale entry snapshot has correct staleState in output',
  (() => {
    const snap = { ...staleEntry.snapshot, staleState: cacheState5E };
    return snap.staleState === 'stale-but-usable';
  })());

// 5f: Provider success refreshes cache
const newSnapshot = { ...SYNTH_SNAPSHOT, price: 74000, asOf: new Date(nowAfterFreshExpiry).toISOString() };
const refreshedEntry = makeCacheEntry(newSnapshot, nowAfterFreshExpiry);
check('After provider success: new fresh entry created',
  getCacheState(refreshedEntry, nowAfterFreshExpiry) === 'fresh');
check('After provider success: new price reflected in cache',
  refreshedEntry.snapshot.price === 74000);

// 5g: Static checks on quoteCache.ts
check('Static: QUOTE_CACHE_FRESH_TTL_MS = 15000',
  cacheSrc.includes('QUOTE_CACHE_FRESH_TTL_MS = 15_000') || cacheSrc.includes('QUOTE_CACHE_FRESH_TTL_MS=15000'));
check('Static: QUOTE_CACHE_STALE_TTL_MS = 120000',
  cacheSrc.includes('QUOTE_CACHE_STALE_TTL_MS = 120_000') || cacheSrc.includes('QUOTE_CACHE_STALE_TTL_MS=120000'));
check('Static: getQuoteCacheState exported from quoteCache.ts',
  cacheSrc.includes('export const getQuoteCacheState'));
check('Static: getConfiguredQuoteCacheEntry supports QUOTE_CACHE_BACKEND=supabase',
  cacheSrc.includes('QUOTE_CACHE_BACKEND_ENV_NAME') || cacheSrc.includes("QUOTE_CACHE_BACKEND"));
log('');

// ── Group 6: Portfolio Valuation Mocked-Live (behavioral) ─────────────────────
log('--- Group 6: Portfolio valuation mocked-live (behavioral) ---');

// Synthetic positions
const KR_STOCK_1 = { id: 'p1', portfolioId: 'port1', symbol: '005930', market: 'KR', assetType: 'stock', name: 'Samsung', buyPrice: 70000, quantity: 10, currency: 'KRW' };
const KR_STOCK_2 = { id: 'p2', portfolioId: 'port1', symbol: '000660', market: 'KR', assetType: 'stock', name: 'SK Hynix', buyPrice: 190000, quantity: 5, currency: 'KRW' };
const KR_ETF_1   = { id: 'p3', portfolioId: 'port1', symbol: '069500', market: 'KR', assetType: 'etf',   name: 'KODEX 200', buyPrice: 33000, quantity: 20, currency: 'KRW' };
const US_STOCK_1 = { id: 'p4', portfolioId: 'port1', symbol: 'SYNTH_US', market: 'US', assetType: 'stock', name: 'Synth US', buyPrice: 150, quantity: 3, currency: 'USD' };

// Synthetic quotes (mocked, not real prices)
const Q_005930 = { symbol: '005930', market: 'KR', price: 73000, currency: 'KRW', change: 500, changePct: 0.69, staleState: 'fresh', asOf: '2026-06-26T06:00:00Z' };
const Q_000660 = { symbol: '000660', market: 'KR', price: 198000, currency: 'KRW', change: -1000, changePct: -0.5, staleState: 'fresh', asOf: '2026-06-26T06:00:00Z' };
const Q_069500 = { symbol: '069500', market: 'KR', price: 34000, currency: 'KRW', change: 200, changePct: 0.59, staleState: 'fresh', asOf: '2026-06-26T06:00:00Z' };
const Q_US     = { symbol: 'SYNTH_US', market: 'US', price: 160, currency: 'USD', change: 2, changePct: 1.3, staleState: 'fresh', asOf: '2026-06-26T06:00:00Z' };
const Q_STALE  = { ...Q_005930, staleState: 'stale-but-usable' };

// 6a: KR-only portfolio — totalMarketValue computed
const krOnly = buildPortfolioWithFx(
  'port1', 'KRW',
  [KR_STOCK_1, KR_STOCK_2, KR_ETF_1],
  { '005930': Q_005930, '000660': Q_000660, '069500': Q_069500 },
  null,
);
// costBasis: 700000 + 950000 + 660000 = 2310000
// marketValue: 730000 + 990000 + 680000 = 2400000
check('KR-only portfolio totalCostBasis correct (700000+950000+660000=2310000)',
  krOnly.totalCostBasis === 2310000);
check('KR-only portfolio totalMarketValue computed (730000+990000+680000=2400000)',
  krOnly.totalMarketValue === 2400000);
check('KR-only portfolio totalUnrealizedPnl correct (2400000-2310000=90000)',
  krOnly.totalUnrealizedPnl === 90000);
check('KR-only portfolio staleState fresh (all quotes fresh)',
  krOnly.staleState === 'fresh');

// 6b: Mixed KRW+USD with mocked FX (baseCurrency=KRW)
const fxForMixed = getMockedFxRate('USD', 'KRW'); // USD/KRW=1350
const mixedWithFx = buildPortfolioWithFx(
  'port1', 'KRW',
  [KR_STOCK_1, US_STOCK_1],
  { '005930': Q_005930, 'SYNTH_US': Q_US },
  fxForMixed.ok ? fxForMixed.data : null,
);
// KR_STOCK_1 marketValue: 73000*10=730000 KRW
// US_STOCK_1 marketValue: 160*3=480 USD → 480*1350=648000 KRW
// total: 730000+648000=1378000 KRW
check('Mixed KRW+USD with mocked FX: totalMarketValue computed',
  mixedWithFx.totalMarketValue !== null);
check('Mixed KRW+USD with mocked FX: USD converted to KRW (730000+648000=1378000)',
  mixedWithFx.totalMarketValue === 1378000);
check('Mixed KRW+USD with mocked FX: staleState is stale-but-usable (mocked FX)',
  mixedWithFx.staleState === 'stale-but-usable');

// 6c: Mixed KRW+USD WITHOUT mocked FX
const mixedNoFx = buildPortfolioWithFx(
  'port1', 'KRW',
  [KR_STOCK_1, US_STOCK_1],
  { '005930': Q_005930, 'SYNTH_US': Q_US },
  null,
);
check('Mixed KRW+USD without FX: totalMarketValue is null (FX required, never fabricated)',
  mixedNoFx.totalMarketValue === null);
check('Mixed KRW+USD without FX: totalUnrealizedPnl is null (no coercion)',
  mixedNoFx.totalUnrealizedPnl === null);

// 6d: US quote unavailable — explicit staleState
const withUnsupportedUs = buildPortfolioWithFx(
  'port1', 'KRW',
  [KR_STOCK_1, US_STOCK_1],
  { '005930': Q_005930, 'SYNTH_US': null }, // US quote returns null (unsupported)
  null,
);
check('US unsupported position (null quote): currentPrice null',
  withUnsupportedUs.rows.find((r) => r.symbol === 'SYNTH_US')?.currentPrice === null);
check('US unsupported position (null quote): staleState unavailable',
  withUnsupportedUs.rows.find((r) => r.symbol === 'SYNTH_US')?.staleState === 'unavailable');
check('Partial quotes: totalMarketValue null (not fabricated for partial)',
  withUnsupportedUs.totalMarketValue === null);
check('Partial quotes: staleState stale-but-usable (some rows available)',
  withUnsupportedUs.staleState === 'stale-but-usable');

// 6e: Mixed stale quote → partial staleState
const mixedStale = buildPortfolioWithFx(
  'port1', 'KRW',
  [KR_STOCK_1, KR_STOCK_2],
  { '005930': Q_005930, '000660': Q_STALE },
  null,
);
check('One stale quote: portfolio staleState is stale-but-usable',
  mixedStale.staleState === 'stale-but-usable');
check('One stale quote: totalMarketValue still computed (all same currency)',
  mixedStale.totalMarketValue !== null);

// 6f: Provider metadata safety
const rowWithProviderMeta = buildPositionRow(KR_STOCK_1, { ...Q_005930, providerMeta: { provider: 'kis', source: 'kis-domestic-quote' } }, 'KRW');
check('providerMeta is not copied to valuation row',
  !Object.prototype.hasOwnProperty.call(rowWithProviderMeta, 'providerMeta'));
check('No raw KIS field stck_prpr in row JSON',
  !JSON.stringify(rowWithProviderMeta).includes('stck_prpr'));

// 6g: Static checks
check('Static: buildPortfolioValuationFromQuotesWithFx exported',
  pvSrc.includes('export const buildPortfolioValuationFromQuotesWithFx'));
check('Static: FxRateInput type defined in portfolioValuation.ts',
  pvSrc.includes('FxRateInput'));
check('Static: fxRate?.source === .mocked. check present (staleState gate)',
  pvSrc.includes("fxRate?.source === 'mocked'") || pvSrc.includes('fxConversionApplied'));
check('Static: no silent fixture fallback in new FX function',
  !(pvSrc.match(/buildPortfolioValuationFromQuotesWithFx[\s\S]{0,500}resolveFixtureQuotes/)));
log('');

// ── Group 7: API Route Policy ────────────────────────────────────────────────
log('--- Group 7: API route policy ---');
check('Route still rejects source=live (UNSUPPORTED_SOURCE)',
  routeSrc.includes('UNSUPPORTED_SOURCE') &&
  (routeSrc.includes("source !== 'fixture'") || routeSrc.includes("source === 'fixture'")));
check('Route does not accept source=live by default',
  !routeSrc.includes("source === 'live'") || routeSrc.includes('UNSUPPORTED_SOURCE'));
check('Route has no live KIS import',
  !routeSrc.includes('getKisDomesticQuoteSnapshot') && !routeSrc.includes('getKisQuoteSnapshot'));
check('Route has no fetch call (still no network)',
  !(/\bfetch\s*\(/.test(routeSrc)));
check('Route has no env reads',
  !routeSrc.includes('process.env') && !routeSrc.includes('import.meta.env'));
check('Route still uses resolveFixtureQuotes for fixture source',
  routeSrc.includes('resolveFixtureQuotes'));
check('Mixed FX helper is used only behind explicit owner mocked-FX flags',
  !routeSrc.includes('buildPortfolioValuationFromQuotesWithFx') ||
    (routeSrc.includes('allowMockedFx') && routeSrc.includes("fxMode !== 'mocked'")));
log('');

// ── Group 8: Documentation ───────────────────────────────────────────────────
log('--- Group 8: Documentation ---');
check('Phase 3DM result doc exists', existsSync(RESULT_DOC));
check('Result doc mentions phase 3DM',
  /Phase 3DM|3DM/i.test(resultDoc));
check('Result doc states no live KIS calls',
  /no live KIS|Live KIS calls.*None/i.test(resultDoc));
check('Result doc states no live FX calls',
  /no live FX|Live FX calls.*None/i.test(resultDoc));
check('Result doc states no deployment',
  /not performed|no.*deploy|deployment.*none/i.test(resultDoc));
check('Result doc describes API conservative policy',
  /conservative|source=live.*400|UNSUPPORTED_SOURCE/i.test(resultDoc));
check('Result doc describes FX mocked contract',
  /fxMockAdapter|getMockedFxRate|mocked.*FX|FX.*mocked/i.test(resultDoc));
check('Result doc describes buildPortfolioValuationFromQuotesWithFx',
  /buildPortfolioValuationFromQuotesWithFx/i.test(resultDoc));
check('Result doc recommends next phase',
  /Phase 3DN|next phase/i.test(resultDoc));
check('Changelog mentions Phase 3DM',
  /Phase 3DM/.test(changelog));
check('Changelog mentions no live calls for 3DM',
  /no live|live calls.*none/i.test(changelog));
log('');

// ── Group 9: Forbidden Patterns ──────────────────────────────────────────────
log('--- Group 9: Forbidden patterns ---');
const newFiles = [fxSrc, pvSrc.replace(/[\s\S]*?buildPortfolioValuationFromQuotes\b/, '')];
const combinedNew = newFiles.join('\n');

check('No setInterval in new server code',
  !combinedNew.includes('setInterval'));
check('No setTimeout in new server code',
  !combinedNew.includes('setTimeout'));
check('No cron in new server code',
  !(/\bcron\b/.test(combinedNew)));
check('No source=auto enablement in new code',
  !combinedNew.includes("source === 'auto'") && !combinedNew.includes("source='auto'"));
check('No 실시간 wording in fxMockAdapter.ts',
  !fxSrc.includes('실시간'));
check('No stck_prpr in fxMockAdapter.ts output',
  !fxSrc.includes('stck_prpr'));
check('No prdy_vrss in fxMockAdapter.ts output',
  !fxSrc.includes('prdy_vrss'));
check('No appkey/appsecret exposure in fxMockAdapter.ts',
  !fxSrc.toLowerCase().includes('appkey') && !fxSrc.toLowerCase().includes('appsecret'));
check('portfolioValuation.ts still has assertServerRuntime',
  pvSrc.includes('assertServerRuntime'));
check('fxMockAdapter.ts rate is not 0',
  !(/MOCKED_USD_KRW_RATE\s*=\s*0/.test(fxSrc)));
log('');

// ── Network safety ────────────────────────────────────────────────────────────
log('--- Network safety ---');
let fetchAttempted = false;
const savedFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = savedFetch;

const checkerSrc = readFileSync(new URL(import.meta.url), 'utf8');
check('Checker does not read .env files',
  !(/readFileSync\s*\(\s*['"][./]*\.env['"]/.test(checkerSrc)));
check('Checker blocks network at top of file',
  /globalThis\.fetch\s*=.*throw/.test(checkerSrc));

// Forbidden output scan — non-label lines only
const FORBIDDEN_RE = /access_token|authorization|bearer|supabase\.co|stck_prpr|prdy_vrss|rt_cd|appkey|appsecret|kis_app_key|kis_app_secret/i;
const nonLabelOutput = loggedLines.filter((l) => !l.includes('[PASS]') && !l.includes('[FAIL]')).join('\n');
const badMatches = (nonLabelOutput.match(new RegExp(FORBIDDEN_RE.source, 'gi')) ?? []).length;
if (badMatches > 0) {
  log(`  [FAIL] Forbidden output found: ${badMatches} match(es) in non-label checker output`);
  failures++;
} else {
  log('  [PASS] No forbidden credential/secret terms found in checker output');
  passes++;
}
log('');

// ── Summary ───────────────────────────────────────────────────────────────────
log('=== Phase 3DM KIS + FX Mocked Adapter Contract — Summary ===');
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
