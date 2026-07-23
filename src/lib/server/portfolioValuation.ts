import { assertServerRuntime } from './providers/serverOnly';
import type { FxRateSnapshot } from './providers/fxTypes';
import type {
  FallbackState,
  KrPortfolioValuationResult,
  KrPortfolioValuationRow,
  PortfolioPositionInput,
  PortfolioValuationRecordInput,
  PortfolioValuationRow,
  PortfolioValuationSummary,
  PortfolioValuationUnsupportedReason,
  QuoteSnapshot,
} from './providers/types';

const KR_SYMBOL_PATTERN = /^[0-9A-Z]{6}$/;

// Classifies a persisted position for the Phase 3GH KR/KRW live-valuation MVP.
// Returns the sanitized unsupported reason, or null when the position is
// eligible for a KIS quote lookup (market=KR, currency=KRW, valid symbol).
const classifyPositionSupport = (
  position: PortfolioValuationRecordInput,
): PortfolioValuationUnsupportedReason | null => {
  if (!position.symbol || !position.symbol.trim()) return 'missing_symbol';
  if (!Number.isFinite(position.quantity) || position.quantity <= 0) return 'invalid_position_data';
  if (!Number.isFinite(position.buyPrice) || position.buyPrice < 0) return 'invalid_position_data';
  if (position.market !== 'KR') return 'unsupported_market';
  if (position.currency !== 'KRW') return 'market_currency_mismatch';
  if (!KR_SYMBOL_PATTERN.test(position.symbol)) return 'invalid_position_data';
  return null;
};

// Builds the authenticated, server-authoritative KR/KRW live valuation result
// for Phase 3GH. Never fabricates a quote: positions with no usable entry in
// quotesBySymbol are reported as quote_unavailable, never substituted with cost
// basis. Weight is computed only among rows that produced a usable market value.
export const buildKrPortfolioValuation = (input: {
  positions: PortfolioValuationRecordInput[];
  quotesBySymbol: Record<string, QuoteSnapshot | null>;
}): KrPortfolioValuationResult => {
  assertServerRuntime(moduleName);

  const totalPositionCount = input.positions.length;

  if (totalPositionCount === 0) {
    return {
      state: 'empty',
      rows: [],
      supportedCostBasis: 0,
      supportedMarketValue: null,
      supportedUnrealizedPnl: null,
      supportedUnrealizedPnlPct: null,
      supportedPositionCount: 0,
      unsupportedPositionCount: 0,
      unavailableQuoteCount: 0,
      totalPositionCount: 0,
      staleState: 'unavailable',
    };
  }

  const rows: KrPortfolioValuationRow[] = input.positions.map((position) => {
    const costBasis = Number.isFinite(position.buyPrice) && Number.isFinite(position.quantity)
      ? position.buyPrice * position.quantity
      : 0;
    const unsupportedReason = classifyPositionSupport(position);
    const displayName = position.name || position.symbol;

    if (unsupportedReason) {
      return {
        positionId: position.positionId,
        portfolioId: position.portfolioId,
        sourcePortfolioName: position.sourcePortfolioName,
        symbol: position.symbol,
        displayName,
        market: position.market,
        assetType: position.assetType,
        currency: position.currency,
        quantity: position.quantity,
        buyPrice: position.buyPrice,
        costBasis,
        supported: false,
        currentPrice: null,
        marketValue: null,
        unrealizedPnl: null,
        unrealizedPnlPct: null,
        weightPct: null,
        quoteAsOf: null,
        staleState: null,
        unsupportedReason,
      };
    }

    const quote = input.quotesBySymbol[position.symbol] ?? null;
    if (!quote) {
      return {
        positionId: position.positionId,
        portfolioId: position.portfolioId,
        sourcePortfolioName: position.sourcePortfolioName,
        symbol: position.symbol,
        displayName,
        market: position.market,
        assetType: position.assetType,
        currency: position.currency,
        quantity: position.quantity,
        buyPrice: position.buyPrice,
        costBasis,
        supported: true,
        currentPrice: null,
        marketValue: null,
        unrealizedPnl: null,
        unrealizedPnlPct: null,
        weightPct: null,
        quoteAsOf: null,
        staleState: null,
        unsupportedReason: 'quote_unavailable',
      };
    }

    const currentPrice = quote.price;
    const marketValue = currentPrice * position.quantity;
    const unrealizedPnl = marketValue - costBasis;
    const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null;

    return {
      positionId: position.positionId,
      portfolioId: position.portfolioId,
      sourcePortfolioName: position.sourcePortfolioName,
      symbol: position.symbol,
      displayName,
      market: position.market,
      assetType: position.assetType,
      currency: position.currency,
      quantity: position.quantity,
      buyPrice: position.buyPrice,
      costBasis,
      supported: true,
      currentPrice,
      marketValue,
      unrealizedPnl,
      unrealizedPnlPct,
      weightPct: null,
      quoteAsOf: quote.asOf,
      staleState: quote.staleState,
      unsupportedReason: null,
    };
  });

  const valuedRows = rows.filter((row) => row.marketValue !== null);
  const supportedMarketValueSum = valuedRows.reduce((sum, row) => sum + (row.marketValue ?? 0), 0);
  for (const row of valuedRows) {
    row.weightPct = supportedMarketValueSum > 0 ? ((row.marketValue ?? 0) / supportedMarketValueSum) * 100 : null;
  }

  const unsupportedPositionCount = rows.filter(
    (row) => row.unsupportedReason && row.unsupportedReason !== 'quote_unavailable',
  ).length;
  const unavailableQuoteCount = rows.filter((row) => row.unsupportedReason === 'quote_unavailable').length;
  const supportedPositionCount = valuedRows.length;

  const supportedCostBasis = valuedRows.reduce((sum, row) => sum + row.costBasis, 0);
  const supportedMarketValue = valuedRows.length > 0 ? supportedMarketValueSum : null;
  const supportedUnrealizedPnl = supportedMarketValue !== null ? supportedMarketValue - supportedCostBasis : null;
  const supportedUnrealizedPnlPct =
    supportedUnrealizedPnl !== null && supportedCostBasis > 0
      ? (supportedUnrealizedPnl / supportedCostBasis) * 100
      : null;

  const state: KrPortfolioValuationResult['state'] =
    supportedPositionCount === 0
      ? 'unavailable'
      : unsupportedPositionCount === 0 && unavailableQuoteCount === 0
        ? 'full'
        : 'partial';

  const staleState: KrPortfolioValuationResult['staleState'] =
    valuedRows.length === 0
      ? 'unavailable'
      : valuedRows.every((row) => row.staleState === 'fresh')
        ? 'fresh'
        : 'stale-but-usable';

  return {
    state,
    rows,
    supportedCostBasis,
    supportedMarketValue,
    supportedUnrealizedPnl,
    supportedUnrealizedPnlPct,
    supportedPositionCount,
    unsupportedPositionCount,
    unavailableQuoteCount,
    totalPositionCount,
    staleState,
  };
};

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

// Provider-neutral snapshot accepted by the valuation helper. Invalid or
// unavailable snapshots fail closed and never produce aggregate FX totals.
type FxRateInput = FxRateSnapshot;
type UsableFxRateInput = FxRateInput & { rate: number; asOf: string };

const getUsableFxRateInput = (fxRate: FxRateInput | null | undefined): UsableFxRateInput | null => {
  if (
    !fxRate ||
    typeof fxRate.rate !== 'number' ||
    !Number.isFinite(fxRate.rate) ||
    fxRate.rate <= 0 ||
    typeof fxRate.asOf !== 'string' ||
    !Number.isFinite(Date.parse(fxRate.asOf)) ||
    fxRate.source === 'unavailable' ||
    fxRate.staleState === 'unavailable' ||
    fxRate.errorCode !== undefined
  ) {
    return null;
  }

  return fxRate as UsableFxRateInput;
};

const convertFxAmount = (
  amount: number,
  fromCurrency: 'KRW' | 'USD',
  toCurrency: 'KRW' | 'USD',
  fxRate: UsableFxRateInput,
): number | null => {
  if (fromCurrency === toCurrency) return amount;
  if (fxRate.baseCurrency === fromCurrency && fxRate.quoteCurrency === toCurrency) {
    return amount * fxRate.rate;
  }
  if (fxRate.baseCurrency === toCurrency && fxRate.quoteCurrency === fromCurrency) {
    return amount / fxRate.rate;
  }
  return null;
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

  let totalCostBasis = rows.reduce((sum, row) => sum + row.costBasis, 0);
  const quotedRows = rows.filter((row) => row.currentPrice !== null);
  const allQuoted = rows.length > 0 && quotedRows.length === rows.length;
  const allSameCurrency = rows.every((row) => row.valuationCurrency === input.baseCurrency);
  const usableFxRate = getUsableFxRateInput(input.fxRate);

  let totalMarketValue: number | null = null;
  let totalUnrealizedPnl: number | null = null;
  let fxConversionApplied = false;

  if (allQuoted && allSameCurrency) {
    totalMarketValue = rows.reduce((sum, row) => sum + (row.marketValue ?? 0), 0);
    totalUnrealizedPnl = totalMarketValue - totalCostBasis;
  } else if (!allSameCurrency && usableFxRate) {
    // Cross-currency aggregation: convert each row's marketValue to baseCurrency.
    // Conversion direction uses standard FX semantics:
    //   fxRate.baseCurrency/fxRate.quoteCurrency = fxRate.rate
    //   e.g., USD/KRW = 1350: 1 USD = 1350 KRW
    //   To convert USD → KRW: multiply by rate.
    //   To convert KRW → USD: divide by rate.
    const fx = usableFxRate;
    const convertedCostBasis = rows.map((row) =>
      convertFxAmount(row.costBasis, row.valuationCurrency, input.baseCurrency, fx),
    );
    if (convertedCostBasis.every((amount): amount is number => amount !== null)) {
      totalCostBasis = convertedCostBasis.reduce((sum, amount) => sum + amount, 0);
    }
    if (allQuoted) {
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
  }

  const isMockedFx = fxConversionApplied && input.fxRate?.source === 'mocked';

  const staleSummary: FallbackState =
    rows.length === 0
      ? 'unavailable'
      : !allSameCurrency && !usableFxRate
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
