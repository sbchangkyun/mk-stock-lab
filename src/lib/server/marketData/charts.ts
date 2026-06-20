import { getKisChartSeries } from '../providers/kisClient';
import { createProviderError } from '../providers/providerErrors';
import { assertServerRuntime } from '../providers/serverOnly';
import type { ChartInterval, ChartSeries, ProviderResult, SecurityIdentity } from '../providers/types';

const moduleName = 'marketData/charts';
const supportedIntervals = new Set<ChartInterval>(['1d', '1w', '1m']);

export const getChartSeriesReadiness = async (
  identity: SecurityIdentity,
  interval: ChartInterval,
): Promise<ProviderResult<ChartSeries>> => {
  assertServerRuntime(moduleName);
  if (!identity.symbol || !identity.market || !supportedIntervals.has(interval)) {
    return createProviderError('VALIDATION_FAILED', 'Chart readiness requires market, symbol, and supported interval.');
  }

  return getKisChartSeries({ ...identity, interval });
};
