import type { APIRoute } from 'astro';
import { buildKrPortfolioValuation } from '../../../lib/server/portfolioValuation';
import {
  ensurePortfolioOwned,
  getPortfolioRequestContext,
  jsonResponse,
  listPortfolios,
  listPositions,
  methodNotAllowed,
  readJsonBody,
  toErrorResponse,
} from '../../../lib/server/portfolio';
import { getQuoteSnapshot } from '../../../lib/server/marketData/quotes';
import type { PortfolioValuationRecordInput, QuoteSnapshot } from '../../../lib/server/providers/types';

export const prerender = false;

// Reserved aggregate identifier already part of the client contract
// (see aggregatePortfolioId in src/pages/portfolio.astro).
const AGGREGATE_PORTFOLIO_ID = '__all_portfolios__';

const MAX_POSITIONS = 50;
const MAX_UNIQUE_KR_SYMBOLS = 30;
const QUOTE_CONCURRENCY = 3;
const KR_SYMBOL_PATTERN = /^[0-9A-Z]{6}$/;

type LoadedPosition = {
  id: string;
  portfolioId: string;
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf';
  name: string | null;
  buyPrice: number;
  quantity: number;
  currency: 'KRW' | 'USD';
};

const toRecordInput = (
  position: LoadedPosition,
  sourcePortfolioName?: string,
): PortfolioValuationRecordInput => ({
  positionId: position.id,
  portfolioId: position.portfolioId,
  market: position.market,
  symbol: position.symbol,
  name: position.name,
  assetType: position.assetType,
  quantity: position.quantity,
  buyPrice: position.buyPrice,
  currency: position.currency,
  sourcePortfolioName,
});

type OwnedPortfolio = { id: string; name: string };
type PositionLoadResult =
  | { ok: true; data: LoadedPosition[] }
  | { ok: false; status: number; code: string; message: string };
type AggregateLoadResult =
  | { ok: true; records: PortfolioValuationRecordInput[] }
  | { ok: false; failure: { ok: false; status: number; code: string; message: string } };

/**
 * Fail-closed aggregate position loader, extracted so its control flow (never converting an
 * authoritative position-load failure into an empty position set) is directly testable without
 * a real Supabase client. `loadPositions` is injected so production wiring calls the real
 * ownership-scoped `listPositions`, while tests can simulate success/failure per portfolio.
 */
export const loadAggregateRecords = async (
  portfolios: OwnedPortfolio[],
  loadPositions: (portfolioId: string) => Promise<PositionLoadResult>,
): Promise<AggregateLoadResult> => {
  const records: PortfolioValuationRecordInput[] = [];
  for (const portfolio of portfolios) {
    const positionsResult = await loadPositions(portfolio.id);
    if (!positionsResult.ok) return { ok: false, failure: positionsResult };
    records.push(...positionsResult.data.map((position) => toRecordInput(position, portfolio.name)));
  }
  return { ok: true, records };
};

export const POST: APIRoute = async ({ request }) => {
  const context = await getPortfolioRequestContext(request);
  if (!context.ok) return toErrorResponse(context);
  const userId = context.data.user.id;

  const body = await readJsonBody(request);
  if (!body.ok) return toErrorResponse(body);

  const portfolioIdValue = body.data.portfolioId;
  if (typeof portfolioIdValue !== 'string' || !portfolioIdValue.trim()) {
    return toErrorResponse({
      ok: false,
      status: 400,
      code: 'INVALID_PAYLOAD',
      message: '포트폴리오 ID가 필요합니다.',
    });
  }

  const isAggregate = portfolioIdValue === AGGREGATE_PORTFOLIO_ID;

  let records: PortfolioValuationRecordInput[];

  if (isAggregate) {
    const portfoliosResult = await listPortfolios(userId);
    if (!portfoliosResult.ok) return toErrorResponse(portfoliosResult);

    // Sequential, fail-closed load: an authoritative position-load failure for any owned
    // portfolio must abort the whole aggregate request rather than silently degrade to an
    // incomplete "partial" valuation built from only the portfolios that happened to succeed.
    // Portfolio count per user is expected to be small, so sequential loading over a
    // Promise.all-with-fallback is preferred for correctness over marginal concurrency.
    const aggregateResult = await loadAggregateRecords(portfoliosResult.data, (portfolioId) =>
      listPositions(userId, portfolioId),
    );
    if (!aggregateResult.ok) return toErrorResponse(aggregateResult.failure);
    records = aggregateResult.records;
  } else {
    const owned = await ensurePortfolioOwned(userId, portfolioIdValue);
    if (!owned.ok) return toErrorResponse(owned);

    const positionsResult = await listPositions(userId, owned.data);
    if (!positionsResult.ok) return toErrorResponse(positionsResult);
    records = positionsResult.data.map((position: LoadedPosition) => toRecordInput(position));
  }

  if (records.length > MAX_POSITIONS) {
    return toErrorResponse({
      ok: false,
      status: 400,
      code: 'PORTFOLIO_VALUATION_LIMIT_EXCEEDED',
      message: `평가 가능한 보유 종목 수(최대 ${MAX_POSITIONS}개)를 초과했습니다.`,
    });
  }

  const uniqueKrSymbols = Array.from(
    new Set(
      records
        .filter((record) => record.market === 'KR' && record.currency === 'KRW' && KR_SYMBOL_PATTERN.test(record.symbol))
        .map((record) => record.symbol),
    ),
  );

  if (uniqueKrSymbols.length > MAX_UNIQUE_KR_SYMBOLS) {
    return toErrorResponse({
      ok: false,
      status: 400,
      code: 'PORTFOLIO_VALUATION_LIMIT_EXCEEDED',
      message: `평가 가능한 국내 종목 수(최대 ${MAX_UNIQUE_KR_SYMBOLS}개)를 초과했습니다.`,
    });
  }

  if (records.length === 0) {
    return jsonResponse({
      ok: true,
      valuation: {
        portfolioId: portfolioIdValue,
        scope: isAggregate ? 'all' : 'single',
        state: 'empty',
        generatedAt: new Date().toISOString(),
        rows: [],
        totals: {
          supportedCostBasis: 0,
          supportedMarketValue: null,
          supportedUnrealizedPnl: null,
          supportedUnrealizedPnlPct: null,
          supportedPositionCount: 0,
          unsupportedPositionCount: 0,
          unavailableQuoteCount: 0,
          totalPositionCount: 0,
        },
        staleState: 'unavailable',
      },
    });
  }

  const quoteMap: Record<string, QuoteSnapshot | null> = {};

  try {
    for (let i = 0; i < uniqueKrSymbols.length; i += QUOTE_CONCURRENCY) {
      const batch = uniqueKrSymbols.slice(i, i + QUOTE_CONCURRENCY);
      const results = await Promise.all(
        batch.map((symbol) => getQuoteSnapshot({ market: 'KR', symbol })),
      );
      batch.forEach((symbol, index) => {
        const result = results[index];
        quoteMap[symbol] = result.ok ? result.data : null;
      });
    }
  } catch {
    return toErrorResponse({
      ok: false,
      status: 502,
      code: 'PORTFOLIO_VALUATION_UNAVAILABLE',
      message: '현재 시세를 불러오지 못했습니다.',
    });
  }

  const result = buildKrPortfolioValuation({ positions: records, quotesBySymbol: quoteMap });

  return jsonResponse({
    ok: true,
    valuation: {
      portfolioId: portfolioIdValue,
      scope: isAggregate ? 'all' : 'single',
      state: result.state,
      generatedAt: new Date().toISOString(),
      rows: result.rows,
      totals: {
        supportedCostBasis: result.supportedCostBasis,
        supportedMarketValue: result.supportedMarketValue,
        supportedUnrealizedPnl: result.supportedUnrealizedPnl,
        supportedUnrealizedPnlPct: result.supportedUnrealizedPnlPct,
        supportedPositionCount: result.supportedPositionCount,
        unsupportedPositionCount: result.unsupportedPositionCount,
        unavailableQuoteCount: result.unavailableQuoteCount,
        totalPositionCount: result.totalPositionCount,
      },
      staleState: result.staleState,
    },
  });
};

export const ALL = methodNotAllowed;
