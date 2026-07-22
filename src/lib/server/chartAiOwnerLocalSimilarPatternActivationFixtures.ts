import type {
  ChartAiOwnerLocalGuardScenario,
  ChartAiOwnerLocalSimilarPatternFixture,
  ChartAiOwnerLocalTestRole,
} from './chartAiOwnerLocalSimilarPatternActivationTypes';

export const buildOwnerLocalSimilarPatternRequestFixture = (
  subjectRole: ChartAiOwnerLocalTestRole = 'user',
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  mode: 'guarded-runtime-scaffold',
  source: 'mocked-provider-compatible',
  guardedRuntimeScaffold: true,
  ownerLocalSimilarPatternRouteActivation: true,
  requestKind: 'similar_pattern',
  subjectRole,
  ...overrides,
});

const guardedFixture = (
  name: string,
  subjectRole: ChartAiOwnerLocalTestRole,
  guardScenario: ChartAiOwnerLocalGuardScenario,
  expectedStatus: ChartAiOwnerLocalSimilarPatternFixture['expectedStatus'],
): ChartAiOwnerLocalSimilarPatternFixture => ({
  name,
  body: buildOwnerLocalSimilarPatternRequestFixture(subjectRole),
  context: { hostname: 'localhost', guardScenario },
  expectedStatus,
});

export const chartAiOwnerLocalSimilarPatternFixtures: ChartAiOwnerLocalSimilarPatternFixture[] = [
  guardedFixture('local_explicit_user_success', 'user', 'ready', 'owner_local_similarity_success'),
  guardedFixture('local_explicit_master_success', 'master', 'ready', 'owner_local_similarity_success'),
  {
    name: 'remote_explicit_user_blocked',
    body: buildOwnerLocalSimilarPatternRequestFixture('user'),
    context: { hostname: 'example.test' },
    expectedStatus: 'blocked_owner_local_required',
  },
  {
    name: 'local_missing_explicit_activation',
    body: buildOwnerLocalSimilarPatternRequestFixture('user', { ownerLocalSimilarPatternRouteActivation: false }),
    context: { hostname: '127.0.0.1' },
    expectedStatus: 'blocked_explicit_activation_required',
  },
  guardedFixture('local_anonymous_blocked', 'anonymous', 'ready', 'blocked_anonymous'),
  guardedFixture('local_unknown_role_fail_closed', 'unknown', 'ready', 'fail_closed'),
  {
    name: 'local_mk_ai_provider_disabled',
    body: buildOwnerLocalSimilarPatternRequestFixture('user', { requestKind: 'mk_ai' }),
    context: { hostname: '::1' },
    expectedStatus: 'blocked_provider_disabled',
  },
  guardedFixture('local_user_cooldown_active', 'user', 'cooldown_active', 'blocked_cooldown'),
  guardedFixture('local_master_cooldown_bypass', 'master', 'cooldown_active', 'owner_local_similarity_success'),
  guardedFixture('local_usage_limited', 'user', 'usage_limited', 'blocked_usage_limited'),
  guardedFixture('local_cost_blocked', 'user', 'cost_blocked', 'blocked_cost_guard'),
  guardedFixture('local_provider_unavailable', 'user', 'provider_unavailable', 'blocked_provider_disabled'),
  guardedFixture('local_feature_disabled', 'user', 'feature_disabled', 'blocked_feature_disabled'),
  {
    name: 'local_kis_ohlc_fixture_user_success',
    body: buildOwnerLocalSimilarPatternRequestFixture('user', {
      ownerLocalOhlcProviderMode: 'kis_ohlc_fixture',
      ownerLocalKisOhlcFixture: 'deterministic_safe',
    }),
    context: { hostname: 'localhost' },
    expectedStatus: 'owner_local_similarity_success',
  },
  {
    name: 'local_kis_ohlc_fixture_malformed_fail_closed',
    body: buildOwnerLocalSimilarPatternRequestFixture('user', {
      ownerLocalOhlcProviderMode: 'kis_ohlc_fixture',
      ownerLocalKisOhlcFixture: 'malformed_provider_shape',
    }),
    context: { hostname: 'localhost' },
    expectedStatus: 'fail_closed',
  },
  {
    name: 'malformed_input_safe_blocked',
    body: null,
    context: { hostname: 'localhost' },
    expectedStatus: 'blocked_invalid_request',
  },
];

export const chartAiOwnerLocalSimilarPatternFixtureMap = Object.fromEntries(
  chartAiOwnerLocalSimilarPatternFixtures.map((fixture) => [fixture.name, fixture]),
) as Record<string, ChartAiOwnerLocalSimilarPatternFixture>;
