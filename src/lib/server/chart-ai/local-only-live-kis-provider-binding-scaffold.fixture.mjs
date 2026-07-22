// Phase 3GG-D local-only Live KIS provider binding scaffold fixtures.
// Deterministic, server-only request builders for the scaffold in
// local-only-live-kis-provider-binding-scaffold.mjs. No secrets, no env
// values, no raw user identifiers, no email addresses, no JWT-like values,
// no real KIS response payload. Ticker symbols used here are synthetic
// public identifiers and do not imply any real provider call.

import { DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS } from './local-only-live-kis-provider-binding-scaffold.mjs';

function baseLocalOnlyContext(overrides = {}) {
  return {
    hostname: 'localhost',
    audience: 'owner-local',
    isDeployed: false,
    isVercel: false,
    providerMode: 'fixture_only',
    endpointCategory: 'current_price',
    flags: { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS },
    scaffoldOnlyAcknowledged: false,
    rateLimitUsage: { requestsInLastMinute: 0, requestsInLastHour: 0, requestsInLastDay: 0 },
    cacheContext: { symbol: '005930', market: 'KRX', endpointCategory: 'current_price', cacheHit: false },
    credentialStatus: 'not_read',
    costStatus: 'within_free_tier',
    simulateTimeout: false,
    simulateMalformedResponse: false,
    simulateProviderException: false,
    simulateSanitizerFailure: false,
    rawPayloadExposureRequested: false,
    llmHandoffRequested: false,
    ...overrides,
  };
}

export function createDefaultLocalOnlyLiveKisScaffoldFixture() {
  return baseLocalOnlyContext();
}

export function createAcknowledgedLocalOnlyScaffoldFixture() {
  return baseLocalOnlyContext({
    flags: { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS, localOnlyBindingEnabled: true },
    scaffoldOnlyAcknowledged: true,
  });
}

export function createNonLocalLiveKisScaffoldAttemptFixture() {
  return baseLocalOnlyContext({
    hostname: 'mk-stock-lab-preview.example-deployment.invalid',
    isDeployed: true,
    isVercel: true,
  });
}

export function createPublicLiveKisScaffoldAttemptFixture() {
  return baseLocalOnlyContext({
    audience: 'public',
    flags: { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS, allowPublic: true },
  });
}

export function createBetaLiveKisScaffoldAttemptFixture() {
  return baseLocalOnlyContext({
    audience: 'beta',
    flags: { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS, allowBeta: true },
  });
}

export function createInternalQaLiveKisScaffoldAttemptFixture() {
  return baseLocalOnlyContext({
    audience: 'internal-qa',
    flags: { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS, allowInternalQa: true },
  });
}

export function createLiveKisProviderModeAttemptFixture() {
  return baseLocalOnlyContext({
    providerMode: 'live_kis',
    flags: { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS, liveKisEnabled: true, allowLiveKisProviderMode: true },
  });
}

export function createForbiddenEndpointAttemptFixture() {
  return baseLocalOnlyContext({ endpointCategory: 'account' });
}

export function createUnlistedEndpointAttemptFixture() {
  return baseLocalOnlyContext({ endpointCategory: 'not_a_recognized_endpoint_category' });
}

export function createRateLimitExceededAttemptFixture() {
  return baseLocalOnlyContext({
    rateLimitUsage: { requestsInLastMinute: 5, requestsInLastHour: 10, requestsInLastDay: 20 },
  });
}

export function createCacheHitFixture() {
  return baseLocalOnlyContext({
    cacheContext: { symbol: '005930', market: 'KRX', endpointCategory: 'current_price', cacheHit: true },
  });
}

export function createRawPayloadExposureAttemptFixture() {
  return baseLocalOnlyContext({
    rawPayloadExposureRequested: true,
    flags: { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS, allowRawPayloadExposure: true },
  });
}

export function createLlmHandoffAttemptFixture() {
  return baseLocalOnlyContext({
    llmHandoffRequested: true,
    flags: { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS, allowLlmHandoff: true },
  });
}

export function createRollbackFixture() {
  return {
    requestedBy: 'owner',
    targetState: 'fixture-only/no-live-KIS',
    reason: 'owner-directed rollback request fixture',
  };
}
