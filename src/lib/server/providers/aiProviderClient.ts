import { createProviderError } from './providerErrors';
import { assertServerRuntime } from './serverOnly';
import type { ChartAiContextPackage, ChartAiNarrative, ProviderConfigReadiness, ProviderResult } from './types';

const moduleName = 'aiProviderClient';
const requiredEnvNames = ['OPENAI_API_KEY', 'GEMINI_API_KEY'];
const secretLikeFieldPattern = /token|secret|password|service_role|api[_-]?key|connection/i;

const containsSecretLikeField = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) => (
    secretLikeFieldPattern.test(key) || containsSecretLikeField(nested)
  ));
};

export const getAiProviderReadiness = (): ProviderConfigReadiness => {
  assertServerRuntime(moduleName);
  return {
    provider: 'openai',
    ready: false,
    reason: 'approval_required',
    requiredEnvNames,
  };
};

export const generateChartAiNarrative = async (
  context: ChartAiContextPackage,
): Promise<ProviderResult<ChartAiNarrative>> => {
  assertServerRuntime(moduleName);
  if (containsSecretLikeField(context)) {
    return createProviderError('VALIDATION_FAILED', 'Chart AI context contains unsupported secret-like fields.', { provider: 'openai' });
  }

  return createProviderError('NOT_IMPLEMENTED', 'AI narrative generation requires a separate approval-gated phase.', {
    provider: 'openai',
    staleState: 'unavailable',
  });
};

export const chartAiNarrativePolicy = {
  allowed: [
    'Descriptive chart interpretation',
    'Risk factors',
    'Data limitation notes',
  ],
  forbidden: [
    'Buy, sell, or hold recommendations',
    'Guaranteed return claims',
    'Personalized financial advice',
  ],
} as const;
