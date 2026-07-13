/**
 * Phase 3GG-T-HF2: the single authoritative wrapper every KIS transport uses to obtain a token and run
 * its data request. Emergency refresh is IMPLEMENTED but DISABLED by default (empty token-invalid
 * allowlist + KIS_TOKEN_EMERGENCY_REFRESH_ENABLED off), so generic provider/data errors never trigger a
 * refresh. When enabled, a clearly-token-invalid response invalidates only the current generation,
 * forces at most one refresh, and retries the original request at most once.
 */

import { createProviderError } from '../providerErrors';
import type { ProviderResult } from '../types';
import type { KisDurableTokenConfig } from './kisTokenConfig';
import type { KisTokenManager } from './kisTokenManager';
import type { KisTokenTelemetry } from './kisTokenTelemetry';
import type { KisRequestContext, KisTokenHandle } from './kisTokenTypes';
import { isClearlyTokenInvalid } from './kisTokenErrorClassifier';

export interface KisExecutorDeps {
  manager: KisTokenManager;
  config: KisDurableTokenConfig;
  telemetry: KisTokenTelemetry;
}

const tokenUnavailable = (): ProviderResult<never> =>
  createProviderError('PROVIDER_UNAVAILABLE', 'KIS access token is unavailable.', {
    provider: 'kis',
    staleState: 'unavailable',
  });

export const executeKisRequestWithToken = async <T>(
  deps: KisExecutorDeps,
  context: KisRequestContext,
  requestFn: (handle: KisTokenHandle) => Promise<ProviderResult<T>>,
): Promise<ProviderResult<T>> => {
  const first = await deps.manager.getTokenHandle(context);
  if (!first.ok) return tokenUnavailable();

  const result = await requestFn(first.handle);

  // Emergency refresh: disabled by default. Only a confirmed token-invalid signal (allowlist) may pass.
  if (
    deps.config.emergencyRefreshEnabled &&
    result &&
    (result as { ok?: boolean }).ok === false &&
    isClearlyTokenInvalid({ internalCode: (result as { code?: string }).code ?? null })
  ) {
    // Invalidate ONLY the generation that just failed (never a newer one).
    await deps.manager.invalidateGeneration(first.handle.generationId);
    void deps.telemetry.record({
      scopeKey: deps.config.scopeKey,
      eventType: 'TOKEN_REFRESH_FORCED',
      generationId: first.handle.generationId,
      routeCategory: context.routeCategory,
    });
    const second = await deps.manager.getTokenHandle(context);
    if (!second.ok) return tokenUnavailable();
    // Retry the original request AT MOST once.
    return requestFn(second.handle);
  }

  return result;
};
