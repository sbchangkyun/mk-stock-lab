import { assertServerRuntime } from './providers/serverOnly';
import type {
  FallbackState,
  PortfolioPositionInput,
  PortfolioValuationRow,
  PortfolioValuationSummary,
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
