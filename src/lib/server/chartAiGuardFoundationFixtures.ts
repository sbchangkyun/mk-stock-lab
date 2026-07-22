/** Deterministic mocked fixtures for the Phase 3FD-I Chart AI guard foundation. */

import type {
  ChartAiGuardDependencies,
  ChartAiGuardFoundationFixture,
  ChartAiGuardFoundationInput,
  ChartAiGuardRole,
  ChartAiGuardSubject,
} from './chartAiGuardFoundationTypes';

export const CHART_AI_GUARD_SAFE_SUBJECT_REFS = {
  anonymous: 'subject_anonymous',
  user: 'subject_mock_user',
  master: 'subject_mock_master',
} as const;

export const buildMockedChartAiGuardSubject = (
  role: ChartAiGuardRole,
): ChartAiGuardSubject => ({
  state: 'authenticated',
  subjectId: role === 'master'
    ? CHART_AI_GUARD_SAFE_SUBJECT_REFS.master
    : CHART_AI_GUARD_SAFE_SUBJECT_REFS.user,
  role,
  source: 'mocked',
});

export const buildAnonymousChartAiGuardSubject = (): ChartAiGuardSubject => ({
  state: 'anonymous',
  subjectId: null,
  role: 'unknown',
  source: 'mocked',
});

export const buildAllGatesOffChartAiGuardDependencies = (
  overrides: Partial<ChartAiGuardDependencies> = {},
): ChartAiGuardDependencies => ({
  subjectResolved: true,
  capabilitiesResolved: true,
  featureEnabled: false,
  cooldown: { state: 'ready', remainingBucket: 'none' },
  usage: { state: 'available', remainingBucket: 'available' },
  cache: { state: 'miss', reusable: false },
  cost: { state: 'allowed', budgetBucket: 'available' },
  audit: { state: 'ready', safeAuditRef: 'audit_mocked_only' },
  providerFoundationReady: false,
  liveKisEnabled: false,
  llmEnabled: false,
  routeSuccessEnabled: false,
  ...overrides,
});

const buildInput = (
  requestKind: ChartAiGuardFoundationInput['requestKind'],
  subject: ChartAiGuardSubject,
  dependencies: ChartAiGuardDependencies | null,
): ChartAiGuardFoundationInput => ({ requestKind, subject, dependencies });

export const chartAiGuardFoundationFixtures: ChartAiGuardFoundationFixture[] = [
  {
    name: 'anonymous_page_access',
    expectedStatus: 'blocked_anonymous',
    input: buildInput('page_access', buildAnonymousChartAiGuardSubject(), buildAllGatesOffChartAiGuardDependencies()),
  },
  {
    name: 'anonymous_similar_pattern',
    expectedStatus: 'blocked_anonymous',
    input: buildInput('similar_pattern', buildAnonymousChartAiGuardSubject(), buildAllGatesOffChartAiGuardDependencies()),
  },
  {
    name: 'authenticated_user_page_access',
    expectedStatus: 'allowed_mocked_only',
    input: buildInput('page_access', buildMockedChartAiGuardSubject('user'), buildAllGatesOffChartAiGuardDependencies()),
  },
  {
    name: 'authenticated_user_similar_pattern_all_guards_off',
    expectedStatus: 'blocked_feature_disabled',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('user'), buildAllGatesOffChartAiGuardDependencies()),
  },
  {
    name: 'authenticated_user_similar_pattern_route_success_disabled',
    expectedStatus: 'blocked_route_success_disabled',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('user'), buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
      providerFoundationReady: true,
    })),
  },
  {
    name: 'authenticated_user_cooldown_active',
    expectedStatus: 'blocked_cooldown',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('user'), buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
      cooldown: { state: 'active', remainingBucket: 'short' },
    })),
  },
  {
    name: 'authenticated_user_usage_limited',
    expectedStatus: 'blocked_usage_limited',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('user'), buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
      usage: { state: 'limited', remainingBucket: 'none' },
    })),
  },
  {
    name: 'authenticated_user_cost_blocked',
    expectedStatus: 'blocked_cost_guard',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('user'), buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
      cost: { state: 'blocked', budgetBucket: 'none' },
    })),
  },
  {
    name: 'authenticated_user_provider_disabled',
    expectedStatus: 'blocked_provider_disabled',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('user'), buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
    })),
  },
  {
    name: 'authenticated_master_page_access',
    expectedStatus: 'allowed_mocked_only',
    input: buildInput('page_access', buildMockedChartAiGuardSubject('master'), buildAllGatesOffChartAiGuardDependencies()),
  },
  {
    name: 'authenticated_master_similar_pattern_cooldown_bypass_route_disabled',
    expectedStatus: 'blocked_route_success_disabled',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('master'), buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
      cooldown: { state: 'active', remainingBucket: 'long' },
      providerFoundationReady: true,
    })),
  },
  {
    name: 'authenticated_master_mk_ai_llm_disabled',
    expectedStatus: 'blocked_provider_disabled',
    input: buildInput('mk_ai', buildMockedChartAiGuardSubject('master'), buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
      providerFoundationReady: true,
    })),
  },
  {
    name: 'authenticated_unknown_role',
    expectedStatus: 'fail_closed',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('unknown'), buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
    })),
  },
  {
    name: 'missing_dependency_fail_closed',
    expectedStatus: 'fail_closed',
    input: buildInput('similar_pattern', buildMockedChartAiGuardSubject('user'), null),
  },
];

export const chartAiGuardFoundationFixtureMap = Object.fromEntries(
  chartAiGuardFoundationFixtures.map((fixture) => [fixture.name, fixture]),
) as Record<string, ChartAiGuardFoundationFixture>;
