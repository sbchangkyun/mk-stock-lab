import { assertServerRuntime } from './providers/serverOnly';
import type {
  FallbackState,
  PortfolioPositionInput,
  PortfolioValuationRow,
  PortfolioValuationSummary,
  QuoteSnapshot,
} from './providers/types';

const moduleName = 'portfolioValuation';
const placeholderState: FallbackState = 'unavailable';

const buildPlaceholderRow = (
  position: PortfolioPositionInput & { id?: string; sourcePortfolioNames?: string[] },
  fallbackCurrency: 'KRW' | 'USD',
): PortfolioValuationRow => ({
  ...position,
  positionId: position.id || `${position.market}:${position.symbol}`,
  displayName: position.name || position.symbol,
  currentPrice: null,
  marketValue: null,
  costBasis: position.buyPrice * position.quantity,
  unrealizedPnl: null,
  unrealizedPnlPct: null,
  valuationCurrency: position.currency || fallbackCurrency,
  staleState: placeholderState,
  sourcePortfolioNames: position.sourcePortfolioNames,
});

// Compute a single position valuation row from a resolved QuoteSnapshot.
// providerMeta is intentionally excluded from PortfolioValuationRow output —
// never forward raw provider metadata beyond the server provider boundary.
const buildPositionValuationFromQuote = (
  position: PortfolioPositionInput & { id?: string; sourcePortfolioNames?: string[] },
  quote: QuoteSnapshot | null,
  fallbackCurrency: 'KRW' | 'USD',
): PortfolioValuationRow => {
  if (quote === null) {
    return buildPlaceholderRow(position, fallbackCurrency);
  }

  const costBasis = position.buyPrice * position.quantity;
  const currentPrice = quote.price;
  const marketValue = currentPrice * position.quantity;
  const unrealizedPnl = marketValue - costBasis;
  const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null;

  return {
    ...position,
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

export const buildPortfolioValuationReadiness = (input: {
  portfolioId: string;
  baseCurrency: 'KRW' | 'USD';
  positions: Array<PortfolioPositionInput & { id?: string }>;
}): PortfolioValuationSummary => {
  assertServerRuntime(moduleName);
  const rows = input.positions.map((position) => buildPlaceholderRow(position, input.baseCurrency));
  return {
    scope: 'single',
    portfolioId: input.portfolioId,
    rows,
    totalCostBasis: rows.reduce((sum, row) => sum + row.costBasis, 0),
    totalMarketValue: null,
    totalUnrealizedPnl: null,
    baseCurrency: input.baseCurrency,
    staleState: placeholderState,
  };
};

// Build portfolio valuation from positions and a map of resolved QuoteSnapshots.
// Positions with no entry (or null) in quotesBySymbol are treated as quote-unavailable.
// Cross-currency aggregation (KRW + USD positions) requires FX, which is not yet
// implemented — totalMarketValue remains null when positions span multiple currencies.
export const buildPortfolioValuationFromQuotes = (input: {
  portfolioId: string;
  baseCurrency: 'KRW' | 'USD';
  positions: Array<PortfolioPositionInput & { id?: string }>;
  quotesBySymbol: Record<string, QuoteSnapshot | null>;
}): PortfolioValuationSummary => {
  assertServerRuntime(moduleName);

  const rows = input.positions.map((position) =>
    buildPositionValuationFromQuote(
      position,
      input.quotesBySymbol[position.symbol] ?? null,
      input.baseCurrency,
    ),
  );

  const totalCostBasis = rows.reduce((sum, row) => sum + row.costBasis, 0);
  const quotedRows = rows.filter((row) => row.currentPrice !== null);
  const allQuoted = rows.length > 0 && quotedRows.length === rows.length;
  const allSameCurrency = rows.every((row) => row.valuationCurrency === input.baseCurrency);

  let totalMarketValue: number | null = null;
  let totalUnrealizedPnl: number | null = null;

  if (allQuoted && allSameCurrency) {
    totalMarketValue = rows.reduce((sum, row) => sum + (row.marketValue ?? 0), 0);
    totalUnrealizedPnl = totalMarketValue - totalCostBasis;
  }

  const staleSummary: FallbackState =
    rows.length === 0
      ? 'unavailable'
      : allQuoted
        ? rows.every((r) => r.staleState === 'fresh')
          ? 'fresh'
          : 'stale-but-usable'
        : quotedRows.length > 0
          ? 'stale-but-usable'
          : 'unavailable';

  return {
    scope: 'single',
    portfolioId: input.portfolioId,
    rows,
    totalCostBasis,
    totalMarketValue,
    totalUnrealizedPnl,
    baseCurrency: input.baseCurrency,
    staleState: staleSummary,
  };
};

export const buildAggregatePortfolioValuationReadiness = (input: {
  positions: Array<PortfolioPositionInput & { id?: string; sourcePortfolioNames?: string[] }>;
}): PortfolioValuationSummary => {
  assertServerRuntime(moduleName);
  const rows = input.positions.map((position) => buildPlaceholderRow(position, position.currency));
  return {
    scope: 'all',
    rows,
    totalCostBasis: rows.reduce((sum, row) => sum + row.costBasis, 0),
    totalMarketValue: null,
    totalUnrealizedPnl: null,
    baseCurrency: 'MIXED',
    staleState: placeholderState,
  };
};
