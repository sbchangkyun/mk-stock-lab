/** Deterministic smoke suite for the Phase 3FD-I all-gates-off guard foundation. */

import {
  assertChartAiServerGuardDecisionIsSafe,
  evaluateChartAiServerGuard,
} from './chartAiGuardFoundation';
import {
  chartAiGuardFoundationFixtureMap,
  chartAiGuardFoundationFixtures,
} from './chartAiGuardFoundationFixtures';
import type {
  ChartAiGuardFoundationSmokeReport,
  ChartAiServerGuardDecision,
} from './chartAiGuardFoundationTypes';

const EXPECTED_DECISION_KEYS = [
  'audit',
  'cache',
  'capabilities',
  'cooldown',
  'cost',
  'ok',
  'reason',
  'requestKind',
  'role',
  'routeSuccessAllowed',
  'runtimeGates',
  'status',
  'subjectState',
  'usage',
];

const decisionContainsUnsafeData = (decision: ChartAiServerGuardDecision): boolean => {
  const serialized = JSON.stringify(decision);
  return /@|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|subject_mock|access.?token|refresh.?token|service.?role|credential/i.test(serialized);
};

export const runChartAiGuardFoundationSmoke = (): ChartAiGuardFoundationSmokeReport => {
  let assertionCount = 0;
  const failures: string[] = [];
  const assertTrue = (condition: boolean, message: string) => {
    assertionCount += 1;
    if (!condition) failures.push(message);
  };
  const assertEqual = (actual: unknown, expected: unknown, message: string) => {
    assertionCount += 1;
    if (actual !== expected) failures.push(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  };

  const decisions = new Map<string, ChartAiServerGuardDecision>();
  for (const fixture of chartAiGuardFoundationFixtures) {
    const decision = evaluateChartAiServerGuard(fixture.input);
    decisions.set(fixture.name, decision);
    assertEqual(decision.status, fixture.expectedStatus, `${fixture.name}: expected status`);
    assertEqual(decision.routeSuccessAllowed, false, `${fixture.name}: route success disabled`);
    assertEqual(decision.runtimeGates.routeSuccessAllowed, false, `${fixture.name}: runtime route gate disabled`);
    assertEqual(decision.runtimeGates.providerExecutionAllowed, false, `${fixture.name}: provider execution disabled`);
    assertEqual(decision.runtimeGates.liveKisAllowed, false, `${fixture.name}: live KIS disabled`);
    assertEqual(decision.runtimeGates.llmAllowed, false, `${fixture.name}: LLM disabled`);
    assertEqual(decision.capabilities.canUseLiveKis, false, `${fixture.name}: KIS capability disabled`);
    assertEqual(decision.capabilities.canUseLlm, false, `${fixture.name}: LLM capability disabled`);
    assertTrue(!decisionContainsUnsafeData(decision), `${fixture.name}: sanitized decision`);
    assertEqual(JSON.stringify(Object.keys(decision).sort()), JSON.stringify(EXPECTED_DECISION_KEYS), `${fixture.name}: stable decision shape`);
    let safe = true;
    try {
      assertChartAiServerGuardDecisionIsSafe(decision);
    } catch {
      safe = false;
    }
    assertTrue(safe, `${fixture.name}: safety assertion accepts decision`);
    assertEqual(
      JSON.stringify(evaluateChartAiServerGuard(fixture.input)),
      JSON.stringify(decision),
      `${fixture.name}: deterministic output`,
    );
  }

  const anonymousPage = decisions.get('anonymous_page_access')!;
  assertEqual(anonymousPage.ok, false, 'anonymous page blocked');
  assertEqual(anonymousPage.capabilities.canAccessChartAi, false, 'anonymous access capability denied');
  assertEqual(anonymousPage.subjectState, 'anonymous', 'anonymous subject state');

  const userPage = decisions.get('authenticated_user_page_access')!;
  assertEqual(userPage.ok, true, 'authenticated page capability allowed');
  assertEqual(userPage.status, 'allowed_mocked_only', 'authenticated page mocked-only status');
  assertEqual(userPage.capabilities.canAccessChartAi, true, 'authenticated access capability');
  assertEqual(userPage.capabilities.canBypassAnalysisCooldown, false, 'normal user cooldown bypass denied');

  const userRouteDisabled = decisions.get('authenticated_user_similar_pattern_route_success_disabled')!;
  assertEqual(userRouteDisabled.ok, false, 'analysis route execution blocked');
  assertEqual(userRouteDisabled.status, 'blocked_route_success_disabled', 'analysis route success disabled status');

  const cooldown = decisions.get('authenticated_user_cooldown_active')!;
  assertEqual(cooldown.status, 'blocked_cooldown', 'normal user cooldown enforced');
  assertEqual(cooldown.cooldown.active, true, 'normal user cooldown active');

  const usage = decisions.get('authenticated_user_usage_limited')!;
  assertEqual(usage.status, 'blocked_usage_limited', 'usage limited status');
  assertEqual(usage.usage.status, 'limited', 'usage decision limited');
  assertEqual(usage.usage.persistenceAllowed, false, 'usage persistence disabled');

  const masterPage = decisions.get('authenticated_master_page_access')!;
  assertEqual(masterPage.capabilities.canBypassAnalysisCooldown, true, 'master bypass capability represented');
  assertEqual(masterPage.routeSuccessAllowed, false, 'master cannot enable route success');

  const masterSimilar = decisions.get('authenticated_master_similar_pattern_cooldown_bypass_route_disabled')!;
  assertEqual(masterSimilar.cooldown.status, 'bypassed_capability', 'master cooldown capability applied');
  assertEqual(masterSimilar.cooldown.active, false, 'master client cooldown not active');
  assertEqual(masterSimilar.status, 'blocked_route_success_disabled', 'master analysis remains route disabled');

  const masterMkAi = decisions.get('authenticated_master_mk_ai_llm_disabled')!;
  assertEqual(masterMkAi.status, 'blocked_provider_disabled', 'master MK AI provider disabled');
  assertEqual(masterMkAi.reason, 'llm_provider_disabled', 'master MK AI LLM reason');

  const unknown = decisions.get('authenticated_unknown_role')!;
  assertEqual(unknown.status, 'fail_closed', 'unknown role fails closed');
  assertEqual(unknown.capabilities.canRunSimilarPattern, false, 'unknown role execution denied');

  const missing = decisions.get('missing_dependency_fail_closed')!;
  assertEqual(missing.status, 'fail_closed', 'missing dependency fails closed');
  assertEqual(missing.reason, 'required_dependency_unavailable', 'missing dependency safe reason');

  assertTrue(chartAiGuardFoundationFixtures.length >= 12, 'fixture coverage includes at least twelve scenarios');
  assertTrue(Boolean(chartAiGuardFoundationFixtureMap.authenticated_user_cost_blocked), 'cost-blocked fixture exists');
  assertTrue(Boolean(chartAiGuardFoundationFixtureMap.authenticated_user_provider_disabled), 'provider-disabled fixture exists');
  assertTrue(assertionCount >= 80, `smoke must run at least 80 assertions; ran ${assertionCount}`);

  return {
    ok: failures.length === 0,
    assertionCount,
    failures,
    fixtureCount: chartAiGuardFoundationFixtures.length,
  };
};
