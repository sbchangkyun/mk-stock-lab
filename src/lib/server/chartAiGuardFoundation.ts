/**
 * Server-only Chart AI guard foundation for Phase 3FD-I.
 *
 * The evaluator is pure and all-gates-off. It consumes injected mocked input, exposes only safe
 * buckets and booleans, and never authorizes provider execution or route success.
 */

import type {
  ChartAiGuardAuditDecision,
  ChartAiGuardCacheDecision,
  ChartAiGuardCapabilities,
  ChartAiGuardCooldownDecision,
  ChartAiGuardCostDecision,
  ChartAiGuardDependencies,
  ChartAiGuardFoundationInput,
  ChartAiGuardRequestKind,
  ChartAiGuardRole,
  ChartAiGuardRuntimeGates,
  ChartAiGuardStatus,
  ChartAiGuardSubject,
  ChartAiGuardUsageDecision,
  ChartAiServerGuardDecision,
} from './chartAiGuardFoundationTypes';

export const CHART_AI_ALL_RUNTIME_GATES_OFF: ChartAiGuardRuntimeGates = {
  realAuthAllowed: false,
  realDbAllowed: false,
  supabaseClientAllowed: false,
  envReadAllowed: false,
  requestContextReadAllowed: false,
  jwtVerificationAllowed: false,
  usagePersistenceAllowed: false,
  cachePersistenceAllowed: false,
  liveKisAllowed: false,
  llmAllowed: false,
  providerExecutionAllowed: false,
  routeSuccessAllowed: false,
  publicActivationAllowed: false,
};

const EMPTY_CAPABILITIES: ChartAiGuardCapabilities = {
  canAccessChartAi: false,
  canRunSimilarPattern: false,
  canRunMkAi: false,
  canBypassAnalysisCooldown: false,
  canUseOwnerLocalPanels: false,
  canUseLiveKis: false,
  canUseLlm: false,
};

const isKnownExecutionRole = (role: ChartAiGuardRole): boolean =>
  role === 'user' || role === 'master' || role === 'beta' || role === 'admin';

export const resolveChartAiGuardCapabilities = (
  subject: ChartAiGuardSubject | null,
): ChartAiGuardCapabilities => {
  if (!subject || subject.source === 'unavailable' || subject.state !== 'authenticated' || !isKnownExecutionRole(subject.role)) {
    return { ...EMPTY_CAPABILITIES };
  }
  const elevated = subject.role === 'master' || subject.role === 'admin';
  return {
    canAccessChartAi: true,
    canRunSimilarPattern: true,
    canRunMkAi: true,
    canBypassAnalysisCooldown: elevated,
    canUseOwnerLocalPanels: elevated,
    canUseLiveKis: false,
    canUseLlm: false,
  };
};

const buildCooldownDecision = (
  requestKind: ChartAiGuardRequestKind,
  dependencies: ChartAiGuardDependencies | null,
  capabilities: ChartAiGuardCapabilities,
): ChartAiGuardCooldownDecision => {
  if (requestKind === 'page_access') {
    return { status: 'not_applicable', active: false, bypassCapability: false, remainingBucket: 'none' };
  }
  if (!dependencies) {
    return { status: 'unavailable', active: false, bypassCapability: false, remainingBucket: 'unknown' };
  }
  if (dependencies.cooldown.state === 'unavailable') {
    return { status: 'unavailable', active: false, bypassCapability: capabilities.canBypassAnalysisCooldown, remainingBucket: 'unknown' };
  }
  if (dependencies.cooldown.state === 'active' && capabilities.canBypassAnalysisCooldown) {
    return {
      status: 'bypassed_capability',
      active: false,
      bypassCapability: true,
      remainingBucket: dependencies.cooldown.remainingBucket,
    };
  }
  return {
    status: dependencies.cooldown.state,
    active: dependencies.cooldown.state === 'active',
    bypassCapability: capabilities.canBypassAnalysisCooldown,
    remainingBucket: dependencies.cooldown.remainingBucket,
  };
};

const buildUsageDecision = (
  requestKind: ChartAiGuardRequestKind,
  dependencies: ChartAiGuardDependencies | null,
): ChartAiGuardUsageDecision => requestKind === 'page_access'
  ? { status: 'not_applicable', remainingBucket: 'none', persistenceAllowed: false }
  : {
      status: dependencies?.usage.state ?? 'unavailable',
      remainingBucket: dependencies?.usage.remainingBucket ?? 'unknown',
      persistenceAllowed: false,
    };

const buildCacheDecision = (
  requestKind: ChartAiGuardRequestKind,
  dependencies: ChartAiGuardDependencies | null,
): ChartAiGuardCacheDecision => requestKind === 'page_access'
  ? { status: 'not_applicable', reusable: false, readAllowed: false, writeAllowed: false }
  : {
      status: dependencies?.cache.state ?? 'unavailable',
      reusable: dependencies?.cache.reusable === true,
      readAllowed: false,
      writeAllowed: false,
    };

const buildCostDecision = (
  requestKind: ChartAiGuardRequestKind,
  dependencies: ChartAiGuardDependencies | null,
): ChartAiGuardCostDecision => requestKind === 'page_access'
  ? { status: 'not_applicable', budgetBucket: 'none', chargeAllowed: false }
  : {
      status: dependencies?.cost.state ?? 'unavailable',
      budgetBucket: dependencies?.cost.budgetBucket ?? 'unknown',
      chargeAllowed: false,
    };

const buildAuditDecision = (
  requestKind: ChartAiGuardRequestKind,
  dependencies: ChartAiGuardDependencies | null,
): ChartAiGuardAuditDecision => requestKind === 'page_access'
  ? { status: 'not_applicable', safeAuditRef: null, writeAllowed: false }
  : {
      status: dependencies?.audit.state === 'ready' ? 'prepared' : 'unavailable',
      safeAuditRef: dependencies?.audit.safeAuditRef ?? null,
      writeAllowed: false,
    };

const buildDecision = (
  input: ChartAiGuardFoundationInput | null,
  status: ChartAiGuardStatus,
  reason: string,
): ChartAiServerGuardDecision => {
  const requestKind = input?.requestKind ?? 'page_access';
  const capabilities = resolveChartAiGuardCapabilities(input?.subject ?? null);
  return {
    ok: status === 'allowed_mocked_only',
    status,
    reason,
    requestKind,
    subjectState: input?.subject?.state ?? 'unavailable',
    role: input?.subject?.role ?? 'unknown',
    capabilities,
    cooldown: buildCooldownDecision(requestKind, input?.dependencies ?? null, capabilities),
    usage: buildUsageDecision(requestKind, input?.dependencies ?? null),
    cache: buildCacheDecision(requestKind, input?.dependencies ?? null),
    cost: buildCostDecision(requestKind, input?.dependencies ?? null),
    audit: buildAuditDecision(requestKind, input?.dependencies ?? null),
    runtimeGates: { ...CHART_AI_ALL_RUNTIME_GATES_OFF },
    routeSuccessAllowed: false,
  };
};

const hasCompleteDependencies = (dependencies: ChartAiGuardDependencies | null): boolean =>
  Boolean(
    dependencies &&
    dependencies.subjectResolved === true &&
    dependencies.capabilitiesResolved === true &&
    typeof dependencies.featureEnabled === 'boolean' &&
    typeof dependencies.cooldown?.state === 'string' &&
    typeof dependencies.cooldown?.remainingBucket === 'string' &&
    typeof dependencies.usage?.state === 'string' &&
    typeof dependencies.usage?.remainingBucket === 'string' &&
    typeof dependencies.cache?.state === 'string' &&
    typeof dependencies.cache?.reusable === 'boolean' &&
    typeof dependencies.cost?.state === 'string' &&
    typeof dependencies.cost?.budgetBucket === 'string' &&
    typeof dependencies.audit?.state === 'string' &&
    typeof dependencies.providerFoundationReady === 'boolean' &&
    dependencies.liveKisEnabled === false &&
    dependencies.llmEnabled === false &&
    dependencies.routeSuccessEnabled === false,
  );

export const evaluateChartAiServerGuard = (
  input: ChartAiGuardFoundationInput | null | undefined,
): ChartAiServerGuardDecision => {
  if (!input || !input.subject || !hasCompleteDependencies(input.dependencies)) {
    return buildDecision(input ?? null, 'fail_closed', 'required_dependency_unavailable');
  }

  const { subject, dependencies, requestKind } = input;
  if (subject.state === 'anonymous') {
    return buildDecision(input, 'blocked_anonymous', 'authentication_required');
  }
  if (subject.source === 'unavailable' || !subject.subjectId) {
    return buildDecision(input, 'fail_closed', 'subject_unavailable');
  }
  if (!isKnownExecutionRole(subject.role)) {
    return buildDecision(input, 'fail_closed', 'unknown_role');
  }

  const capabilities = resolveChartAiGuardCapabilities(subject);
  if (requestKind === 'page_access') {
    return capabilities.canAccessChartAi
      ? buildDecision(input, 'allowed_mocked_only', 'page_access_capability_available')
      : buildDecision(input, 'fail_closed', 'page_access_capability_unavailable');
  }

  if (!dependencies.featureEnabled) {
    return buildDecision(input, 'blocked_feature_disabled', 'analysis_feature_disabled');
  }
  if (dependencies.usage.state === 'unavailable' || dependencies.cache.state === 'unavailable' ||
      dependencies.cost.state === 'unavailable' || dependencies.audit.state === 'unavailable') {
    return buildDecision(input, 'fail_closed', 'guard_dependency_unavailable');
  }
  if (dependencies.usage.state === 'limited') {
    return buildDecision(input, 'blocked_usage_limited', 'usage_limit_reached');
  }
  if (dependencies.cooldown.state === 'unavailable') {
    return buildDecision(input, 'fail_closed', 'cooldown_dependency_unavailable');
  }
  if (dependencies.cooldown.state === 'active' && !capabilities.canBypassAnalysisCooldown) {
    return buildDecision(input, 'blocked_cooldown', 'analysis_cooldown_active');
  }
  if (dependencies.cost.state === 'blocked') {
    return buildDecision(input, 'blocked_cost_guard', 'cost_guard_blocked');
  }
  if (!dependencies.providerFoundationReady) {
    return buildDecision(input, 'blocked_provider_disabled', 'provider_foundation_disabled');
  }
  if (requestKind === 'mk_ai' && !dependencies.llmEnabled) {
    return buildDecision(input, 'blocked_provider_disabled', 'llm_provider_disabled');
  }
  if (dependencies.liveKisEnabled || dependencies.llmEnabled || dependencies.routeSuccessEnabled) {
    return buildDecision(input, 'fail_closed', 'runtime_gate_violation');
  }

  return buildDecision(input, 'blocked_route_success_disabled', 'route_success_disabled');
};

export const assertChartAiServerGuardDecisionIsSafe = (decision: ChartAiServerGuardDecision): void => {
  const serialized = JSON.stringify(decision);
  const forbidden = /@|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|access.?token|refresh.?token|raw.?session|service.?role|credential|authorization/i;
  if (forbidden.test(serialized)) throw new Error('Chart AI guard decision failed safety validation.');
  if (decision.routeSuccessAllowed !== false || decision.runtimeGates.routeSuccessAllowed !== false) {
    throw new Error('Chart AI guard decision attempted to enable route success.');
  }
};
