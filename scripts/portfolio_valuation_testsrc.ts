/**
 * Phase 3GH test source (bundled + run by smoke_phase_3gh_portfolio_live_valuation_mvp.mjs via esbuild).
 *
 * Exercises the pure KR/KRW live-valuation calculation contract in
 * src/lib/server/portfolioValuation.ts. No network, no Supabase, no env reads.
 */

import { buildKrPortfolioValuation } from '../src/lib/server/portfolioValuation';
import { loadAggregateRecords } from '../src/pages/api/portfolio/valuation';
import type { PortfolioValuationRecordInput, QuoteSnapshot } from '../src/lib/server/providers/types';

let passed = 0;
let failed = 0;
const logs: string[] = [];
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  const line = `${cond ? 'PASS' : 'FAIL'} :: ${name}`;
  logs.push(line);
  console.log(line);
};

const krPosition = (overrides: Partial<PortfolioValuationRecordInput> = {}): PortfolioValuationRecordInput => ({
  positionId: 'pos-1',
  portfolioId: 'pf-1',
  market: 'KR',
  symbol: '005930',
  name: '삼성전자',
  assetType: 'stock',
  quantity: 10,
  buyPrice: 60000,
  currency: 'KRW',
  ...overrides,
});

const freshQuote = (overrides: Partial<QuoteSnapshot> = {}): QuoteSnapshot => ({
  market: 'KR',
  symbol: '005930',
  price: 70000,
  currency: 'KRW',
  change: 1000,
  changePct: 1.45,
  marketState: 'open',
  asOf: '2026-07-24T05:00:00.000Z',
  staleState: 'fresh',
  ...overrides,
});

// 1. Empty positions -> state=empty, no rows, no fabricated totals.
{
  const result = buildKrPortfolioValuation({ positions: [], quotesBySymbol: {} });
  check('empty positions -> state empty', result.state === 'empty');
  check('empty positions -> zero rows', result.rows.length === 0);
  check('empty positions -> supportedMarketValue null', result.supportedMarketValue === null);
  check('empty positions -> staleState unavailable', result.staleState === 'unavailable');
}

// 2. Single supported KR/KRW position with a fresh quote -> state=full, correct calc.
{
  const result = buildKrPortfolioValuation({
    positions: [krPosition()],
    quotesBySymbol: { '005930': freshQuote() },
  });
  check('single fresh quote -> state full', result.state === 'full');
  check('single fresh quote -> costBasis correct', result.rows[0].costBasis === 600000);
  check('single fresh quote -> marketValue correct', result.rows[0].marketValue === 700000);
  check('single fresh quote -> unrealizedPnl correct', result.rows[0].unrealizedPnl === 100000);
  check(
    'single fresh quote -> unrealizedPnlPct correct',
    Math.abs((result.rows[0].unrealizedPnlPct ?? 0) - (100000 / 600000) * 100) < 1e-9,
  );
  check('single fresh quote -> weightPct 100', result.rows[0].weightPct === 100);
  check('single fresh quote -> staleState fresh', result.staleState === 'fresh');
  check('single fresh quote -> quoteAsOf forwarded', result.rows[0].quoteAsOf === freshQuote().asOf);
  check('single fresh quote -> no providerMeta leak', !('providerMeta' in result.rows[0]));
}

// 3. US market position -> unsupported_market, never calls quote provider (no entry needed in map).
{
  const result = buildKrPortfolioValuation({
    positions: [krPosition({ positionId: 'pos-us', symbol: 'AAPL', market: 'US', currency: 'USD' })],
    quotesBySymbol: {},
  });
  check('US position -> supported false', result.rows[0].supported === false);
  check('US position -> unsupported_market reason', result.rows[0].unsupportedReason === 'unsupported_market');
  check('US position -> currentPrice null', result.rows[0].currentPrice === null);
  check('US position -> state unavailable (only position)', result.state === 'unavailable');
}

// 4. KR market but USD currency (mismatch) -> market_currency_mismatch.
{
  const result = buildKrPortfolioValuation({
    positions: [krPosition({ positionId: 'pos-mismatch', currency: 'USD' })],
    quotesBySymbol: {},
  });
  check(
    'KR/USD mismatch -> market_currency_mismatch reason',
    result.rows[0].unsupportedReason === 'market_currency_mismatch',
  );
}

// 5. Missing symbol -> missing_symbol reason.
{
  const result = buildKrPortfolioValuation({
    positions: [krPosition({ positionId: 'pos-missing', symbol: '' })],
    quotesBySymbol: {},
  });
  check('missing symbol -> missing_symbol reason', result.rows[0].unsupportedReason === 'missing_symbol');
}

// 6. Invalid quantity/buyPrice -> invalid_position_data.
{
  const result = buildKrPortfolioValuation({
    positions: [krPosition({ positionId: 'pos-badqty', quantity: 0 })],
    quotesBySymbol: {},
  });
  check('zero quantity -> invalid_position_data', result.rows[0].unsupportedReason === 'invalid_position_data');

  const result2 = buildKrPortfolioValuation({
    positions: [krPosition({ positionId: 'pos-badprice', buyPrice: -1 })],
    quotesBySymbol: {},
  });
  check('negative buyPrice -> invalid_position_data', result2.rows[0].unsupportedReason === 'invalid_position_data');
}

// 7. Malformed KR symbol (not 6-char numeric/uppercase) -> invalid_position_data.
{
  const result = buildKrPortfolioValuation({
    positions: [krPosition({ positionId: 'pos-badsym', symbol: 'abc' })],
    quotesBySymbol: {},
  });
  check('malformed KR symbol -> invalid_position_data', result.rows[0].unsupportedReason === 'invalid_position_data');
}

// 8. Supported position with no quote in map -> quote_unavailable, never fabricated.
{
  const result = buildKrPortfolioValuation({
    positions: [krPosition()],
    quotesBySymbol: { '005930': null },
  });
  check('missing quote -> quote_unavailable reason', result.rows[0].unsupportedReason === 'quote_unavailable');
  check('missing quote -> currentPrice null (never fabricated)', result.rows[0].currentPrice === null);
  check('missing quote -> marketValue null', result.rows[0].marketValue === null);
  check('missing quote -> state unavailable (only position)', result.state === 'unavailable');
}

// 9. Mixed portfolio: one supported+quoted, one unsupported, one quote-unavailable -> state=partial.
{
  const result = buildKrPortfolioValuation({
    positions: [
      krPosition({ positionId: 'a', symbol: '005930' }),
      krPosition({ positionId: 'b', symbol: 'AAPL', market: 'US', currency: 'USD' }),
      krPosition({ positionId: 'c', symbol: '000660' }),
    ],
    quotesBySymbol: { '005930': freshQuote(), '000660': null },
  });
  check('mixed portfolio -> state partial', result.state === 'partial');
  check('mixed portfolio -> supportedPositionCount 1', result.supportedPositionCount === 1);
  check('mixed portfolio -> unsupportedPositionCount 1', result.unsupportedPositionCount === 1);
  check('mixed portfolio -> unavailableQuoteCount 1', result.unavailableQuoteCount === 1);
  check('mixed portfolio -> totalPositionCount 3', result.totalPositionCount === 3);
  check(
    'mixed portfolio -> supportedMarketValue reflects only valued row',
    result.supportedMarketValue === 700000,
  );
  check('mixed portfolio -> valued row weight 100 among valued rows', result.rows[0].weightPct === 100);
}

// 10. All positions unsupported/unavailable -> state=unavailable, totals null (never "full portfolio" framing).
{
  const result = buildKrPortfolioValuation({
    positions: [
      krPosition({ positionId: 'a', symbol: 'AAPL', market: 'US', currency: 'USD' }),
      krPosition({ positionId: 'b', symbol: '000660' }),
    ],
    quotesBySymbol: { '000660': null },
  });
  check('all unsupported/unavailable -> state unavailable', result.state === 'unavailable');
  check('all unsupported/unavailable -> supportedMarketValue null', result.supportedMarketValue === null);
  check('all unsupported/unavailable -> supportedPositionCount 0', result.supportedPositionCount === 0);
}

// 11. Multiple valued rows -> weight sums to ~100 and stale-but-usable if any row is not fresh.
{
  const result = buildKrPortfolioValuation({
    positions: [
      krPosition({ positionId: 'a', symbol: '005930', quantity: 10, buyPrice: 60000 }),
      krPosition({ positionId: 'b', symbol: '000660', quantity: 5, buyPrice: 100000 }),
    ],
    quotesBySymbol: {
      '005930': freshQuote({ symbol: '005930', price: 70000, staleState: 'fresh' }),
      '000660': freshQuote({ symbol: '000660', price: 120000, staleState: 'stale-but-usable' }),
    },
  });
  const weightSum = result.rows.reduce((sum, row) => sum + (row.weightPct ?? 0), 0);
  check('multi-row weights sum to ~100', Math.abs(weightSum - 100) < 1e-9);
  check('multi-row -> state full (both supported+quoted)', result.state === 'full');
  check(
    'multi-row -> staleState stale-but-usable when any row is not fresh',
    result.staleState === 'stale-but-usable',
  );
}

// 12. Deterministic: same input twice -> identical numeric output (no randomness/hidden state).
{
  const input = {
    positions: [krPosition({ positionId: 'a' })],
    quotesBySymbol: { '005930': freshQuote() },
  };
  const r1 = buildKrPortfolioValuation(input);
  const r2 = buildKrPortfolioValuation(input);
  check('deterministic calc across repeated calls', JSON.stringify(r1) === JSON.stringify(r2));
}

// --- Phase 3GH-HF1: aggregate fail-closed loader (loadAggregateRecords) ---
// Exercises the extracted control-flow helper directly (no Supabase client) to prove an
// authoritative position-load failure for any owned portfolio aborts the whole aggregate
// request instead of silently degrading to a partial result built from the portfolios that
// happened to succeed.

const loadedPosition = (overrides: Record<string, unknown> = {}) => ({
  id: 'pos-a',
  portfolioId: 'pf-a',
  symbol: '005930',
  market: 'KR' as const,
  assetType: 'stock' as const,
  name: '삼성전자',
  buyPrice: 60000,
  quantity: 10,
  currency: 'KRW' as const,
  ...overrides,
});

// 13. Aggregate success: two owned portfolios, both position loads succeed -> all positions
//     appear, tagged with their source portfolio name.
{
  const calls: string[] = [];
  const loadPositions = (portfolioId: string) => {
    calls.push(portfolioId);
    if (portfolioId === 'pf-1') {
      return Promise.resolve({ ok: true as const, data: [loadedPosition({ id: 'p1', portfolioId: 'pf-1', symbol: '005930' })] });
    }
    return Promise.resolve({ ok: true as const, data: [loadedPosition({ id: 'p2', portfolioId: 'pf-2', symbol: '000660' })] });
  };
  const result = await loadAggregateRecords(
    [
      { id: 'pf-1', name: 'Portfolio 1' },
      { id: 'pf-2', name: 'Portfolio 2' },
    ],
    loadPositions,
  );
  check('aggregate success -> ok true', result.ok === true);
  check('aggregate success -> both portfolios queried', calls.length === 2);
  check(
    'aggregate success -> all owned positions appear',
    result.ok && result.records.length === 2 && result.records.some((r) => r.symbol === '005930') && result.records.some((r) => r.symbol === '000660'),
  );
  check(
    'aggregate success -> sourcePortfolioName tagged per row',
    result.ok && result.records.every((r) => typeof r.sourcePortfolioName === 'string' && r.sourcePortfolioName.length > 0),
  );
}

// 14. Aggregate position-load failure: first portfolio succeeds, second fails -> the whole
//     aggregate load fails closed; no rows from only the successful portfolio are returned.
{
  const calls: string[] = [];
  const loadPositions = (portfolioId: string) => {
    calls.push(portfolioId);
    if (portfolioId === 'pf-1') {
      return Promise.resolve({ ok: true as const, data: [loadedPosition({ id: 'p1', portfolioId: 'pf-1' })] });
    }
    return Promise.resolve({
      ok: false as const,
      status: 500,
      code: 'POSITION_LIST_FAILED',
      message: '보유 종목을 불러오지 못했습니다.',
    });
  };
  const result = await loadAggregateRecords(
    [
      { id: 'pf-1', name: 'Portfolio 1' },
      { id: 'pf-2', name: 'Portfolio 2' },
    ],
    loadPositions,
  );
  check('aggregate failure -> ok false (fails closed)', result.ok === false);
  check(
    'aggregate failure -> sanitized failure code surfaced',
    !result.ok && result.failure.code === 'POSITION_LIST_FAILED',
  );
  check(
    'aggregate failure -> no raw Supabase detail beyond sanitized message',
    !result.ok && Object.keys(result.failure).sort().join(',') === 'code,message,ok,status',
  );
}

// 15. Aggregate empty portfolios: owned portfolios exist but every position array is genuinely
//     empty -> succeeds with zero records (caller maps this to state=empty, no provider calls).
{
  const loadPositions = () => Promise.resolve({ ok: true as const, data: [] });
  const result = await loadAggregateRecords(
    [
      { id: 'pf-1', name: 'Portfolio 1' },
      { id: 'pf-2', name: 'Portfolio 2' },
    ],
    loadPositions,
  );
  check('aggregate empty -> ok true', result.ok === true);
  check('aggregate empty -> zero records', result.ok && result.records.length === 0);
}

// 16. No silent omission: a failure on the FIRST portfolio (before any success) also fails
//     closed rather than skipping straight to the next portfolio.
{
  let secondCalled = false;
  const loadPositions = (portfolioId: string) => {
    if (portfolioId === 'pf-1') {
      return Promise.resolve({
        ok: false as const,
        status: 500,
        code: 'POSITION_LIST_FAILED',
        message: '보유 종목을 불러오지 못했습니다.',
      });
    }
    secondCalled = true;
    return Promise.resolve({ ok: true as const, data: [] });
  };
  const result = await loadAggregateRecords(
    [
      { id: 'pf-1', name: 'Portfolio 1' },
      { id: 'pf-2', name: 'Portfolio 2' },
    ],
    loadPositions,
  );
  check('first-portfolio failure -> ok false', result.ok === false);
  check('first-portfolio failure -> stops before querying the next portfolio', secondCalled === false);
}

// 17. Zero owned portfolios -> succeeds with zero records, loader never invoked.
{
  let called = false;
  const loadPositions = () => {
    called = true;
    return Promise.resolve({ ok: true as const, data: [] });
  };
  const result = await loadAggregateRecords([], loadPositions);
  check('zero portfolios -> ok true', result.ok === true);
  check('zero portfolios -> zero records', result.ok && result.records.length === 0);
  check('zero portfolios -> loader never invoked', called === false);
}

// 18. Foreign-data safety (structural): loadAggregateRecords only ever calls loadPositions with
//     the portfolio ids it was given -- it has no independent way to reach any other user's
//     portfolio or position rows (ownership scoping happens in the injected loader itself,
//     which in production is the userId-bound listPositions call).
{
  const givenIds = ['pf-only-mine-1', 'pf-only-mine-2'];
  const seenIds: string[] = [];
  const loadPositions = (portfolioId: string) => {
    seenIds.push(portfolioId);
    return Promise.resolve({ ok: true as const, data: [] });
  };
  await loadAggregateRecords(
    givenIds.map((id) => ({ id, name: id })),
    loadPositions,
  );
  check(
    'aggregate loader only queries the exact portfolio ids it was given',
    seenIds.length === givenIds.length && seenIds.every((id) => givenIds.includes(id)),
  );
}

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
