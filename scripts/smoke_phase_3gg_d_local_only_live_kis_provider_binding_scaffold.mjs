// Phase 3GG-D smoke test. Imports only the new scaffold and fixture
// modules. No network. No env read. No KIS provider module import. No API
// route import.
import assert from 'node:assert/strict';
import {
  evaluateLocalOnlyLiveKisProviderBindingScaffold,
  evaluateEndpointAllowlist,
  evaluateLocalOnlyCachePolicy,
  createSanitizedKisMarketDataPreview,
  createMinimalKisAuditLogPreview,
  createLocalOnlyLiveKisRollbackDecision,
  assertNoLocalOnlyLiveKisRuntimeActivation,
} from '../src/lib/server/chart-ai/local-only-live-kis-provider-binding-scaffold.mjs';
import {
  createDefaultLocalOnlyLiveKisScaffoldFixture,
  createAcknowledgedLocalOnlyScaffoldFixture,
  createNonLocalLiveKisScaffoldAttemptFixture,
  createPublicLiveKisScaffoldAttemptFixture,
  createBetaLiveKisScaffoldAttemptFixture,
  createInternalQaLiveKisScaffoldAttemptFixture,
  createLiveKisProviderModeAttemptFixture,
  createForbiddenEndpointAttemptFixture,
  createUnlistedEndpointAttemptFixture,
  createRateLimitExceededAttemptFixture,
  createCacheHitFixture,
  createRawPayloadExposureAttemptFixture,
  createLlmHandoffAttemptFixture,
} from '../src/lib/server/chart-ai/local-only-live-kis-provider-binding-scaffold.fixture.mjs';

let assertions = 0;
function check(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}

// 1. default fixture fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createDefaultLocalOnlyLiveKisScaffoldFixture());
  check(decision.failClosed === true, 'case 1: default fixture must fail closed');
  check(decision.providerCallAllowed === false, 'case 1: default fixture providerCallAllowed must be false');
}

// 2. acknowledged local scaffold fixture may return scaffold_only but providerCallAllowed remains false
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createAcknowledgedLocalOnlyScaffoldFixture());
  check(decision.decisionType === 'scaffold_only', 'case 2: acknowledged local fixture should reach scaffold_only');
  check(decision.providerCallAllowed === false, 'case 2: scaffold_only decision must still have providerCallAllowed false');
}

// 3. non-local request fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createNonLocalLiveKisScaffoldAttemptFixture());
  check(decision.failClosed === true, 'case 3: non-local request must fail closed');
  check(decision.providerCallAllowed === false, 'case 3: non-local providerCallAllowed must be false');
}

// 4. public request fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createPublicLiveKisScaffoldAttemptFixture());
  check(decision.failClosed === true, 'case 4: public request must fail closed');
  check(decision.publicEnabled === false, 'case 4: publicEnabled must be false');
}

// 5. beta request fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createBetaLiveKisScaffoldAttemptFixture());
  check(decision.failClosed === true, 'case 5: beta request must fail closed');
  check(decision.betaEnabled === false, 'case 5: betaEnabled must be false');
}

// 6. internal QA request fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createInternalQaLiveKisScaffoldAttemptFixture());
  check(decision.failClosed === true, 'case 6: internal QA request must fail closed');
  check(decision.internalQaEnabled === false, 'case 6: internalQaEnabled must be false');
}

// 7. providerMode live_kis attempt fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createLiveKisProviderModeAttemptFixture());
  check(decision.failClosed === true, 'case 7: live_kis providerMode attempt must fail closed');
  check(decision.liveKisActivated === false, 'case 7: liveKisActivated must be false');
}

// 8. forbidden endpoint category fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createForbiddenEndpointAttemptFixture());
  check(decision.failClosed === true, 'case 8: forbidden endpoint category must fail closed');
  check(decision.endpointClassification === 'forbidden', 'case 8: endpoint classification must be forbidden');
}

// 9. unlisted endpoint category fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createUnlistedEndpointAttemptFixture());
  check(decision.failClosed === true, 'case 9: unlisted endpoint category must fail closed');
  check(decision.endpointClassification === 'unlisted', 'case 9: endpoint classification must be unlisted');
}

// 10. allowed endpoint category is recognized but does not allow provider call
{
  const endpointEval = evaluateEndpointAllowlist('current_price');
  check(endpointEval.endpointAllowed === true, 'case 10: approved endpoint category must be recognized as allowed');
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createDefaultLocalOnlyLiveKisScaffoldFixture());
  check(decision.providerCallAllowed === false, 'case 10: recognized endpoint category still must not allow provider call');
}

// 11. rate limit exceeded fails closed and blocks, not queues
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createRateLimitExceededAttemptFixture());
  check(decision.failClosed === true, 'case 11: rate limit exceeded must fail closed');
  check(decision.rateLimit.blocked === true, 'case 11: rate limit must report blocked');
  check(decision.rateLimit.queued === false, 'case 11: rate limit must block, not queue');
}

// 12. cache hit skips provider call
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createCacheHitFixture());
  check(decision.cache.cacheHit === true, 'case 12: cache hit fixture must report cacheHit true');
  check(decision.cache.skipsProviderCall === true, 'case 12: cache hit must skip provider call');
  check(decision.providerCallAllowed === false, 'case 12: cache hit still must not allow provider call in this phase');
}

// 13. cache key excludes PII/session/JWT/cookie/email
{
  const cacheEval = evaluateLocalOnlyCachePolicy({
    symbol: '005930',
    market: 'KRX',
    endpointCategory: 'current_price',
    email: 'EMAIL_PLACEHOLDER_NOT_REAL',
    jwt: 'JWT_PLACEHOLDER_NOT_REAL',
    cookie: 'COOKIE_PLACEHOLDER_NOT_REAL',
    session: 'SESSION_PLACEHOLDER_NOT_REAL',
    cacheHit: false,
  });
  check(cacheEval.cacheKey === 'kis-market-data:KRX:005930:current_price', 'case 13: cache key must be built only from symbol/market/endpointCategory');
  check(!cacheEval.cacheKey.includes('PLACEHOLDER'), 'case 13: cache key must exclude PII/session/JWT/cookie/email fields');
}

// 14. cost uncertainty fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold({
    ...createDefaultLocalOnlyLiveKisScaffoldFixture(),
    costStatus: 'uncertain',
  });
  check(decision.failClosed === true, 'case 14: cost uncertainty must fail closed');
}

// 15. missing credential fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold({
    ...createDefaultLocalOnlyLiveKisScaffoldFixture(),
    credentialStatus: 'missing',
  });
  check(decision.failClosed === true, 'case 15: missing credential must fail closed');
  check(decision.credentialReadAllowed === false, 'case 15: credentialReadAllowed must be false');
}

// 16. invalid credential fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold({
    ...createDefaultLocalOnlyLiveKisScaffoldFixture(),
    credentialStatus: 'invalid',
  });
  check(decision.failClosed === true, 'case 16: invalid credential must fail closed');
}

// 17. timeout fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold({
    ...createDefaultLocalOnlyLiveKisScaffoldFixture(),
    simulateTimeout: true,
  });
  check(decision.failClosed === true, 'case 17: simulated timeout must fail closed');
}

// 18. malformed response fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold({
    ...createDefaultLocalOnlyLiveKisScaffoldFixture(),
    simulateMalformedResponse: true,
  });
  check(decision.failClosed === true, 'case 18: simulated malformed response must fail closed');
}

// 19. provider exception fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold({
    ...createDefaultLocalOnlyLiveKisScaffoldFixture(),
    simulateProviderException: true,
  });
  check(decision.failClosed === true, 'case 19: simulated provider exception must fail closed');
}

// 20. sanitizer failure fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold({
    ...createDefaultLocalOnlyLiveKisScaffoldFixture(),
    simulateSanitizerFailure: true,
  });
  check(decision.failClosed === true, 'case 20: simulated sanitizer failure must fail closed');
}

// 21. raw payload exposure attempt fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createRawPayloadExposureAttemptFixture());
  check(decision.failClosed === true, 'case 21: raw payload exposure attempt must fail closed');
  check(decision.rawPayloadExposureAllowed === false, 'case 21: rawPayloadExposureAllowed must be false');
}

// 22. LLM handoff attempt fails closed
{
  const decision = evaluateLocalOnlyLiveKisProviderBindingScaffold(createLlmHandoffAttemptFixture());
  check(decision.failClosed === true, 'case 22: LLM handoff attempt must fail closed');
  check(decision.llmHandoffAllowed === false, 'case 22: llmHandoffAllowed must be false');
}

// 23. audit log preview contains only allowed fields
{
  const preview = createMinimalKisAuditLogPreview({
    timestamp: 'FIXTURE_TIMESTAMP',
    symbol: '005930',
    market: 'KRX',
    providerMode: 'fixture_only',
    success: true,
    sanitizedErrorCode: null,
    latencyMs: 12,
    cacheHit: false,
    rateLimitBlocked: false,
    accessToken: 'SHOULD_NOT_APPEAR',
    accountNumber: 'SHOULD_NOT_APPEAR',
  });
  const allowedKeys = ['timestamp', 'symbol', 'market', 'providerMode', 'success', 'sanitizedErrorCode', 'latencyMs', 'cacheHit', 'rateLimitBlocked'];
  check(Object.keys(preview).sort().join(',') === [...allowedKeys].sort().join(','), 'case 23: audit log preview must contain only allowed fields');
}

// 24. sanitized preview contains only allowed output families
{
  const preview = createSanitizedKisMarketDataPreview({
    symbol: '005930',
    market: 'KRX',
    timestamp: 'FIXTURE_TIMESTAMP',
    ohlc: { open: 1, high: 2, low: 0.5, close: 1.5 },
    currentPrice: 1.5,
    volume: 1000,
    selectedMarketDataSummary: 'fixture summary',
    sourceStatus: 'fixture_only',
    cacheStatus: 'miss',
    sanitizedErrorCode: null,
    rawProviderResponse: 'SHOULD_NOT_APPEAR',
    accountBalance: 'SHOULD_NOT_APPEAR',
  });
  const allowedKeys = ['symbol', 'market', 'timestamp', 'ohlc', 'currentPrice', 'volume', 'selectedMarketDataSummary', 'sourceStatus', 'cacheStatus', 'sanitizedErrorCode'];
  check(Object.keys(preview).sort().join(',') === [...allowedKeys].sort().join(','), 'case 24: sanitized preview must contain only allowed output families');
}

// 25. rollback decision returns fixture-only/no-live-KIS
{
  const rollback = createLocalOnlyLiveKisRollbackDecision();
  check(rollback.rollbackTarget === 'fixture-only/no-live-KIS', 'case 25: rollback target must be fixture-only/no-live-KIS');
  check(rollback.liveKisEnabled === false, 'case 25: rollback liveKisEnabled must be false');
  check(rollback.providerModeLiveKisBlocked === true, 'case 25: rollback providerModeLiveKisBlocked must be true');
  check(rollback.apiRouteActivationEnabled === false, 'case 25: rollback apiRouteActivationEnabled must be false');
  check(rollback.providerCallAllowed === false, 'case 25: rollback providerCallAllowed must be false');
  check(rollback.deployRequired === false, 'case 25: rollback deployRequired must be false');
  check(rollback.validationRequired === true, 'case 25: rollback validationRequired must be true');
}

// 26. assertNoLocalOnlyLiveKisRuntimeActivation rejects providerCallAllowed true
{
  const base = evaluateLocalOnlyLiveKisProviderBindingScaffold(createDefaultLocalOnlyLiveKisScaffoldFixture());
  assert.throws(() => assertNoLocalOnlyLiveKisRuntimeActivation({ ...base, providerCallAllowed: true }), 'case 26: must throw on providerCallAllowed true');
  assertions += 1;
}

// 27. rejects credentialReadAllowed true
{
  const base = evaluateLocalOnlyLiveKisProviderBindingScaffold(createDefaultLocalOnlyLiveKisScaffoldFixture());
  assert.throws(() => assertNoLocalOnlyLiveKisRuntimeActivation({ ...base, credentialReadAllowed: true }), 'case 27: must throw on credentialReadAllowed true');
  assertions += 1;
}

// 28. rejects apiRouteActivationAllowed true
{
  const base = evaluateLocalOnlyLiveKisProviderBindingScaffold(createDefaultLocalOnlyLiveKisScaffoldFixture());
  assert.throws(() => assertNoLocalOnlyLiveKisRuntimeActivation({ ...base, apiRouteActivationAllowed: true }), 'case 28: must throw on apiRouteActivationAllowed true');
  assertions += 1;
}

// 29. rejects rawPayloadExposureAllowed true
{
  const base = evaluateLocalOnlyLiveKisProviderBindingScaffold(createDefaultLocalOnlyLiveKisScaffoldFixture());
  assert.throws(() => assertNoLocalOnlyLiveKisRuntimeActivation({ ...base, rawPayloadExposureAllowed: true }), 'case 29: must throw on rawPayloadExposureAllowed true');
  assertions += 1;
}

// 30. rejects llmHandoffAllowed true
{
  const base = evaluateLocalOnlyLiveKisProviderBindingScaffold(createDefaultLocalOnlyLiveKisScaffoldFixture());
  assert.throws(() => assertNoLocalOnlyLiveKisRuntimeActivation({ ...base, llmHandoffAllowed: true }), 'case 30: must throw on llmHandoffAllowed true');
  assertions += 1;
}

// sanity: assertNoLocalOnlyLiveKisRuntimeActivation must NOT throw on a genuinely fail-closed decision
{
  const base = evaluateLocalOnlyLiveKisProviderBindingScaffold(createDefaultLocalOnlyLiveKisScaffoldFixture());
  check(assertNoLocalOnlyLiveKisRuntimeActivation(base) === true, 'sanity: fail-closed decision must not trigger the runtime-activation guard');
}

console.log(`PASS: phase 3GG-D local-only Live KIS provider binding scaffold smoke test (${assertions} assertions)`);
