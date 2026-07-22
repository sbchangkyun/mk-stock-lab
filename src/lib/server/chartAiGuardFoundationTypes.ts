/**
 * Server-only Chart AI guard foundation types for Phase 3FD-I.
 *
 * These contracts model future real-auth-compatible decisions using injected, deterministic input
 * only. They contain no token, email, raw identity, request context, provider payload, or live data.
 */

export type ChartAiGuardSubjectState = 'anonymous' | 'authenticated';

export type ChartAiGuardRole = 'user' | 'master' | 'beta' | 'admin' | 'unknown';

export type ChartAiGuardSubjectSource = 'mocked' | 'real-compatible-disabled' | 'unavailable';

export type ChartAiGuardRequestKind = 'page_access' | 'similar_pattern' | 'mk_ai';

export type ChartAiGuardStatus =
  | 'allowed_mocked_only'
  | 'blocked_anonymous'
  | 'blocked_feature_disabled'
  | 'blocked_usage_limited'
  | 'blocked_cooldown'
  | 'blocked_cost_guard'
  | 'blocked_provider_disabled'
  | 'blocked_route_success_disabled'
  | 'fail_closed';

export type ChartAiGuardSubject = {
  state: ChartAiGuardSubjectState;
  subjectId: string | null;
  role: ChartAiGuardRole;
  source: ChartAiGuardSubjectSource;
};

export type ChartAiGuardCapabilities = {
  canAccessChartAi: boolean;
  canRunSimilarPattern: boolean;
  canRunMkAi: boolean;
  canBypassAnalysisCooldown: boolean;
  canUseOwnerLocalPanels: boolean;
  canUseLiveKis: false;
  canUseLlm: false;
};

export type ChartAiGuardCooldownInput = {
  state: 'ready' | 'active' | 'unavailable';
  remainingBucket: 'none' | 'short' | 'long' | 'unknown';
};

export type ChartAiGuardUsageInput = {
  state: 'available' | 'limited' | 'unavailable';
  remainingBucket: 'none' | 'low' | 'available' | 'unknown';
};

export type ChartAiGuardCacheInput = {
  state: 'hit' | 'miss' | 'unavailable';
  reusable: boolean;
};

export type ChartAiGuardCostInput = {
  state: 'allowed' | 'blocked' | 'unavailable';
  budgetBucket: 'none' | 'low' | 'available' | 'unknown';
};

export type ChartAiGuardAuditInput = {
  state: 'ready' | 'unavailable';
  safeAuditRef: 'audit_mocked_only' | null;
};

export type ChartAiGuardDependencies = {
  subjectResolved: boolean;
  capabilitiesResolved: boolean;
  featureEnabled: boolean;
  cooldown: ChartAiGuardCooldownInput;
  usage: ChartAiGuardUsageInput;
  cache: ChartAiGuardCacheInput;
  cost: ChartAiGuardCostInput;
  audit: ChartAiGuardAuditInput;
  providerFoundationReady: boolean;
  liveKisEnabled: false;
  llmEnabled: false;
  routeSuccessEnabled: false;
};

export type ChartAiGuardFoundationInput = {
  requestKind: ChartAiGuardRequestKind;
  subject: ChartAiGuardSubject | null;
  dependencies: ChartAiGuardDependencies | null;
};

export type ChartAiGuardCooldownDecision = {
  status: 'not_applicable' | 'ready' | 'active' | 'bypassed_capability' | 'unavailable';
  active: boolean;
  bypassCapability: boolean;
  remainingBucket: ChartAiGuardCooldownInput['remainingBucket'];
};

export type ChartAiGuardUsageDecision = {
  status: 'not_applicable' | 'available' | 'limited' | 'unavailable';
  remainingBucket: ChartAiGuardUsageInput['remainingBucket'];
  persistenceAllowed: false;
};

export type ChartAiGuardCacheDecision = {
  status: 'not_applicable' | 'hit' | 'miss' | 'unavailable';
  reusable: boolean;
  readAllowed: false;
  writeAllowed: false;
};

export type ChartAiGuardCostDecision = {
  status: 'not_applicable' | 'allowed' | 'blocked' | 'unavailable';
  budgetBucket: ChartAiGuardCostInput['budgetBucket'];
  chargeAllowed: false;
};

export type ChartAiGuardAuditDecision = {
  status: 'not_applicable' | 'prepared' | 'unavailable';
  safeAuditRef: 'audit_mocked_only' | null;
  writeAllowed: false;
};

export type ChartAiGuardRuntimeGates = {
  realAuthAllowed: false;
  realDbAllowed: false;
  supabaseClientAllowed: false;
  envReadAllowed: false;
  requestContextReadAllowed: false;
  jwtVerificationAllowed: false;
  usagePersistenceAllowed: false;
  cachePersistenceAllowed: false;
  liveKisAllowed: false;
  llmAllowed: false;
  providerExecutionAllowed: false;
  routeSuccessAllowed: false;
  publicActivationAllowed: false;
};

export type ChartAiServerGuardDecision = {
  ok: boolean;
  status: ChartAiGuardStatus;
  reason: string;
  requestKind: ChartAiGuardRequestKind;
  subjectState: ChartAiGuardSubjectState | 'unavailable';
  role: ChartAiGuardRole;
  capabilities: ChartAiGuardCapabilities;
  cooldown: ChartAiGuardCooldownDecision;
  usage: ChartAiGuardUsageDecision;
  cache: ChartAiGuardCacheDecision;
  cost: ChartAiGuardCostDecision;
  audit: ChartAiGuardAuditDecision;
  runtimeGates: ChartAiGuardRuntimeGates;
  routeSuccessAllowed: false;
};

export type ChartAiGuardFoundationFixture = {
  name: string;
  expectedStatus: ChartAiGuardStatus;
  input: ChartAiGuardFoundationInput;
};

export type ChartAiGuardFoundationSmokeReport = {
  ok: boolean;
  assertionCount: number;
  failures: string[];
  fixtureCount: number;
};
