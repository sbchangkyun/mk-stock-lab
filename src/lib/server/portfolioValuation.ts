import { assertServerRuntime } from './providers/serverOnly';
import type { FxRateSnapshot } from './providers/fxTypes';
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

// Provider-neutral usable subset accepted by the valuation helper.
// source='mocked' keeps the aggregate stale state conservative.
type FxRateInput = Pick<FxRateSnapshot, 'baseCurrency' | 'quoteCurrency' | 'source'> & {
  rate: number;
};

// Build portfolio valuation with optional FX rate for cross-currency aggregation.
// If all positions share baseCurrency, behaves identically to buildPortfolioValuationFromQuotes.
// If positions span multiple currencies and fxRate is provided, converts all marketValues
// to baseCurrency before summing. When fxRate.source is 'mocked', the summary staleState
// is capped at stale-but-usable (not fresh) to signal preview/mocked data quality.
// If fxRate is absent and currencies are mixed, totalMarketValue remains null — never
// fabricated or silently falls back to fixture.
// No live calls. No env reads. Safe for no-network mocked contract tests.
export const buildPortfolioValuationFromQuotesWithFx = (input: {
  portfolioId: string;
  baseCurrency: 'KRW' | 'USD';
  positions: Array<PortfolioPositionInput & { id?: string }>;
  quotesBySymbol: Record<string, QuoteSnapshot | null>;
  fxRate?: FxRateInput | null;
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
  let fxConversionApplied = false;

  if (allQuoted && allSameCurrency) {
    totalMarketValue = rows.reduce((sum, row) => sum + (row.marketValue ?? 0), 0);
    totalUnrealizedPnl = totalMarketValue - totalCostBasis;
  } else if (allQuoted && !allSameCurrency && input.fxRate) {
    // Cross-currency aggregation: convert each row's marketValue to baseCurrency.
    // Conversion direction uses standard FX semantics:
    //   fxRate.baseCurrency/fxRate.quoteCurrency = fxRate.rate
    //   e.g., USD/KRW = 1350: 1 USD = 1350 KRW
    //   To convert USD → KRW: multiply by rate.
    //   To convert KRW → USD: divide by rate.
    const fx = input.fxRate;
    let total = 0;
    let ok = true;
    for (const row of rows) {
      const mv = row.marketValue ?? 0;
      const rowCurrency = row.valuationCurrency;
      if (rowCurrency === input.baseCurrency) {
        total += mv;
      } else if (fx.baseCurrency === rowCurrency && fx.quoteCurrency === input.baseCurrency) {
        // row currency is FX base → multiply to get FX quote (= portfolioBase)
        // e.g., row USD, portfolio KRW, rate USD/KRW=1350: USD × 1350 = KRW
        total += mv * fx.rate;
      } else if (fx.baseCurrency === input.baseCurrency && fx.quoteCurrency === rowCurrency) {
        // row currency is FX quote → divide to get FX base (= portfolioBase)
        // e.g., row KRW, portfolio USD, rate USD/KRW=1350: KRW / 1350 = USD
        if (fx.rate === 0) { ok = false; break; }
        total += mv / fx.rate;
      } else {
        ok = false;
        break;
      }
    }
    if (ok) {
      totalMarketValue = total;
      totalUnrealizedPnl = totalMarketValue - totalCostBasis;
      fxConversionApplied = true;
    }
  }

  const isMockedFx = fxConversionApplied && input.fxRate?.source === 'mocked';

  const staleSummary: FallbackState =
    rows.length === 0
      ? 'unavailable'
      : allQuoted
        ? rows.every((r) => r.staleState === 'fresh') && !isMockedFx
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
