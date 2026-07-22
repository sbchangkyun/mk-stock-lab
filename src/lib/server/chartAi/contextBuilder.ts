import { assertServerRuntime } from '../providers/serverOnly';
import type { ChartAiContextPackage, SecurityIdentity } from '../providers/types';

const moduleName = 'chartAi/contextBuilder';

export const buildChartAiContextReadiness = (input: {
  security: SecurityIdentity & { name?: string | null; displayName?: string | null };
  generatedAt?: string;
}): ChartAiContextPackage => {
  assertServerRuntime(moduleName);
  return {
    security: {
      market: input.security.market,
      symbol: input.security.symbol,
      name: input.security.name || input.security.symbol,
      displayName: input.security.displayName || input.security.name || input.security.symbol,
      assetType: 'stock',
      currency: input.security.market === 'US' ? 'USD' : 'KRW',
      isSupported: false,
      updatedAt: input.generatedAt || new Date(0).toISOString(),
    },
    dataLimitations: [
      'Quote provider is not connected.',
      'Chart provider is not connected.',
      'AI provider execution is not connected.',
      'This context is a readiness shell only.',
    ],
    generatedAt: input.generatedAt || new Date(0).toISOString(),
  };
};

export const chartAiContextPolicy = {
  allowed: [
    'Descriptive chart interpretation after approved provider integration',
    'Risk factors after approved provider integration',
    'Data limitation notes',
  ],
  forbidden: [
    'Buy, sell, or hold recommendations',
    'Guaranteed return claims',
    'Personalized financial advice',
    'Raw token or secret propagation',
  ],
} as const;
