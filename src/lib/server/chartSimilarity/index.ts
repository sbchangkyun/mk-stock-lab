/**
 * Public exports for the server-only KIS OHLC provider foundation (Phase 3EY-A), its mocked
 * adapter / test harness (Phase 3EY-B), and its auth/usage execution guard foundation
 * (Phase 3EY-C).
 *
 * Server-only: do not import this module from client-accessible page or API code. Live KIS
 * execution remains feature-flag off; see `kisOhlcProviderPolicy.ts` for policy defaults and
 * `serverOnlyKisOhlcProvider.ts` for the disabled-by-default provider foundation. The mocked
 * adapter (`mockedKisOhlcAdapter.ts`) is a non-live test harness only. The execution guard
 * (`similarityExecutionGuard.ts`) is a disabled-by-default, policy-first evaluator only — it
 * implements no real auth, no usage storage, and is not wired into any API route.
 */

export type {
  ServerOnlyKisOhlcProviderStatus,
  ServerOnlyKisOhlcRequest,
  ServerOnlyKisOhlcPolicy,
  ServerOnlyKisOhlcResult,
  NormalizedDailyOhlcInput,
  NormalizedDailyOhlcMeta,
} from './kisOhlcProviderTypes';

export {
  CHART_AI_SIMILARITY_KIS_OHLC_ENABLED,
  CHART_AI_SIMILARITY_REQUIRE_AUTH,
  CHART_AI_SIMILARITY_REQUIRE_USAGE_GUARD,
  buildDefaultServerOnlyKisOhlcPolicy,
} from './kisOhlcProviderPolicy';

export type { ServerOnlyKisOhlcRequestValidation } from './serverOnlyKisOhlcProvider';

export {
  normalizeServerOnlyKisOhlcRequest,
  validateServerOnlyKisOhlcRequest,
  getServerOnlyKisOhlcForSimilarity,
  toSimilarityOhlcBarsFromNormalizedDailyBars,
} from './serverOnlyKisOhlcProvider';

export type { MockedServerOnlyKisOhlcAdapterInput } from './mockedKisOhlcAdapter';

export { getMockedServerOnlyKisOhlcForSimilarity } from './mockedKisOhlcAdapter';

export {
  buildMockedNormalizedDailyOhlcInput,
  buildInvalidMockedNormalizedDailyOhlcInput,
} from './mockedKisOhlcFixtures';

export type {
  SimilarityExecutionRole,
  SimilarityExecutionAuthState,
  SimilarityExecutionUsageWindow,
  SimilarityExecutionGuardStatus,
  SimilarityExecutionPurpose,
  SimilarityExecutionSource,
  SimilarityExecutionGuardRequest,
  SimilarityExecutionUsageSnapshot,
  SimilarityExecutionGuardPolicy,
  SimilarityExecutionGuardResult,
} from './similarityExecutionGuardTypes';

export {
  CHART_AI_SIMILARITY_EXECUTION_ENABLED,
  CHART_AI_SIMILARITY_AUTH_REQUIRED,
  CHART_AI_SIMILARITY_USAGE_GUARD_REQUIRED,
  buildDefaultSimilarityExecutionGuardPolicy,
} from './similarityExecutionGuardPolicy';

export type { SimilarityExecutionGuardRequestValidation } from './similarityExecutionGuard';

export {
  normalizeSimilarityExecutionGuardRequest,
  buildUsageSnapshot,
  getRoleDailyLimit,
  evaluateSimilarityExecutionGuard,
} from './similarityExecutionGuard';

export {
  buildMockedAnonymousSimilarityGuardRequest,
  buildMockedAuthenticatedSimilarityGuardRequest,
  buildMockedBetaSimilarityGuardRequest,
  buildMockedOwnerSimilarityGuardRequest,
  buildMockedInvalidSimilarityGuardRequest,
  buildMockedUsageSnapshot,
} from './mockedSimilarityExecutionGuardFixtures';

export type {
  SimilarityApiResponseStatus,
  SimilarityApiResponseSource,
  SimilarityApiResponseMode,
  SimilarityApiSafeRequest,
  SimilarityApiSafeUsage,
  SimilarityApiSafeError,
  SimilarityApiMockedMatch,
  SimilarityApiMockedSuccessData,
  SimilarityApiResponse,
} from './similarityApiResponseTypes';

export {
  toSimilarityApiSafeRequest,
  toSimilarityApiSafeUsage,
  mapGuardStatusToApiStatus,
  buildSimilarityApiErrorFromGuard,
  buildSimilarityApiResponseFromGuard,
  buildMockedSimilarityApiSuccessData,
  buildMockedAllowedSimilarityApiResponse,
} from './similarityApiResponseBuilder';

export {
  buildMockedSimilarityApiAllowedResponse,
  buildMockedSimilarityApiAuthRequiredResponse,
  buildMockedSimilarityApiUsageLimitedResponse,
  buildMockedSimilarityApiFeatureDisabledResponse,
  buildMockedSimilarityApiNotConfiguredResponse,
  buildMockedSimilarityApiBlockedResponse,
} from './mockedSimilarityApiResponseFixtures';

export type {
  SimilarityAuthProviderKind,
  SimilarityAuthIntegrationStatus,
  SimilarityAuthSubjectKind,
  SimilarityAuthSubject,
  SimilarityAuthRoleMappingPolicy,
  SimilarityAuthIntegrationDesignResult,
} from './similarityAuthIntegrationDesignTypes';

export type { SimilarityGuardRequestDesignInput } from './similarityAuthIntegrationDesign';

export {
  buildDefaultSimilarityAuthRoleMappingPolicy,
  buildAnonymousSimilarityAuthSubject,
  buildMockedAuthenticatedSimilarityAuthSubject,
  buildMockedBetaSimilarityAuthSubject,
  buildMockedOwnerSimilarityAuthSubject,
  buildMockedAdminSimilarityAuthSubject,
  mapAuthSubjectToGuardRole,
  mapAuthSubjectToGuardAuthState,
  buildSimilarityAuthIntegrationDesignResult,
  buildGuardRequestFromAuthDesign,
} from './similarityAuthIntegrationDesign';

export type {
  SimilarityUsageStorageBackendKind,
  SimilarityUsageStorageStatus,
  SimilarityUsageWindowKind,
  SimilarityUsageChargeTiming,
  SimilarityUsageChargeOutcome,
  SimilarityUsageExecutionOutcome,
  SimilarityUsageStorageKey,
  SimilarityUsageStoragePolicy,
  SimilarityUsageChargeDecision,
  SimilarityUsageStorageDesignResult,
} from './similarityUsageStorageDesignTypes';

export type { SimilarityUsageStorageKeyInput } from './similarityUsageStorageDesign';

export {
  buildDefaultSimilarityUsageStoragePolicy,
  buildUsageWindowStartIso,
  buildSimilarityUsageStorageKey,
  getUsageLimitForGuardRole,
  decideSimilarityUsageCharge,
  buildSimilarityUsageStorageDesignResult,
} from './similarityUsageStorageDesign';

export {
  buildMockedSimilarityUsageStoragePolicy,
  buildMockedAuthenticatedDailyUsageKey,
  buildMockedBetaDailyUsageKey,
  buildMockedOwnerDailyUsageKey,
  buildMockedUsageChargeSuccessDecision,
  buildMockedUsageChargeAuthRequiredDecision,
  buildMockedUsageChargeProviderErrorDecision,
  buildMockedUsageStorageDesignResult,
} from './mockedSimilarityUsageStorageDesignFixtures';

export type {
  SimilarityApiRouteShellStatus,
  SimilarityApiRouteShellPolicy,
  SimilarityApiRouteShellRequest,
  SimilarityApiRouteShellResult,
} from './similarityApiRouteShellTypes';

export {
  buildDefaultSimilarityApiRouteShellPolicy,
  normalizeSimilarityApiRouteShellRequest,
  buildFeatureFlagOffSimilarityApiRouteShellResult,
  buildSimilarityApiRouteShellResult,
} from './similarityApiRouteShell';

export type {
  SimilarityOwnerLocalExecutionPlanStatus,
  SimilarityOwnerLocalExecutionStage,
  SimilarityOwnerLocalExecutionSource,
  SimilarityOwnerLocalExecutionGate,
  SimilarityOwnerLocalProviderExpectation,
  SimilarityOwnerLocalExecutionPlanPolicy,
  SimilarityOwnerLocalExecutionPlanResult,
} from './similarityOwnerLocalExecutionPlanTypes';

export {
  buildDefaultSimilarityOwnerLocalExecutionPlanPolicy,
  buildOwnerLocalProviderExpectation,
  buildOwnerLocalExecutionStages,
  buildOwnerLocalExecutionGates,
  buildSimilarityOwnerLocalExecutionPlanResult,
  isOwnerLocalExecutionAllowedByPlan,
} from './similarityOwnerLocalExecutionPlan';

export {
  buildMockedOwnerLocalExecutionPlanPolicy,
  buildMockedOwnerLocalProviderExpectation,
  buildMockedOwnerLocalExecutionGates,
  buildMockedOwnerLocalExecutionPlanResult,
  buildMockedOwnerLocalExecutionDeniedResult,
} from './mockedSimilarityOwnerLocalExecutionPlanFixtures';

export type {
  SimilarityOwnerLocalSmokePlanStatus,
  SimilarityOwnerLocalSmokeStage,
  SimilarityOwnerLocalSmokeGate,
  SimilarityOwnerLocalSmokeRedactionPolicy,
  SimilarityOwnerLocalSmokeCheckOutcome,
  SimilarityOwnerLocalSmokeReportTemplate,
  SimilarityOwnerLocalSmokePlanPolicy,
  SimilarityOwnerLocalSmokePlanResult,
} from './similarityOwnerLocalSmokePlanTypes';

export {
  buildDefaultSimilarityOwnerLocalSmokePlanPolicy,
  buildOwnerLocalSmokeStages,
  buildOwnerLocalSmokeGates,
  buildOwnerLocalSmokeRedactionPolicy,
  buildOwnerLocalSmokeReportTemplate,
  buildSimilarityOwnerLocalSmokePlanResult,
  isOwnerLocalSmokeAllowedByPlan,
} from './similarityOwnerLocalSmokePlan';

export {
  buildMockedOwnerLocalSmokePlanPolicy,
  buildMockedOwnerLocalSmokeStages,
  buildMockedOwnerLocalSmokeGates,
  buildMockedOwnerLocalSmokeRedactionPolicy,
  buildMockedOwnerLocalSmokeReportTemplate,
  buildMockedOwnerLocalSmokePlanResult,
  buildMockedOwnerLocalSmokeDeniedResult,
} from './mockedSimilarityOwnerLocalSmokePlanFixtures';

export type {
  SimilarityOwnerLocalSmokeHarnessStatus,
  SimilarityOwnerLocalSmokeHarnessMode,
  SimilarityOwnerLocalSmokeHarnessStep,
  SimilarityOwnerLocalSmokeHarnessCheck,
  SimilarityOwnerLocalSmokeHarnessPolicy,
  SimilarityOwnerLocalSmokeHarnessReport,
  SimilarityOwnerLocalSmokeHarnessResult,
} from './similarityOwnerLocalSmokeHarnessTypes';

export {
  buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy,
  buildOwnerLocalSmokeHarnessSteps,
  buildOwnerLocalSmokeHarnessChecks,
  buildOwnerLocalSmokeHarnessBlockedReport,
  runOwnerLocalSmokeHarnessDisabled,
  isOwnerLocalSmokeHarnessEnabled,
} from './similarityOwnerLocalSmokeHarness';

export {
  buildMockedOwnerLocalSmokeHarnessPolicy,
  buildMockedOwnerLocalSmokeHarnessSteps,
  buildMockedOwnerLocalSmokeHarnessChecks,
  buildMockedOwnerLocalSmokeHarnessBlockedReport,
  buildMockedOwnerLocalSmokeHarnessResult,
} from './mockedSimilarityOwnerLocalSmokeHarnessFixtures';

export type {
  SimilarityOwnerLocalSmokeCloseoutStatus,
  SimilarityOwnerLocalSmokeCloseoutDecision,
  SimilarityOwnerLocalSmokeCloseoutCheckStatus,
  SimilarityOwnerLocalSmokeCloseoutCheck,
  SimilarityOwnerLocalSmokeCloseoutPolicy,
  SimilarityOwnerLocalSmokeCloseoutReport,
  SimilarityOwnerLocalSmokeCloseoutResult,
} from './similarityOwnerLocalSmokeCloseoutTypes';

export {
  buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy,
  buildOwnerLocalSmokeCloseoutChecks,
  buildOwnerLocalSmokeCloseoutReport,
  buildSimilarityOwnerLocalSmokeCloseoutResult,
  isOwnerLocalManualSmokeExecutionClosed,
  isOwnerLocalManualSmokeReadyForSeparateApproval,
} from './similarityOwnerLocalSmokeCloseout';

export {
  buildMockedOwnerLocalSmokeCloseoutPolicy,
  buildMockedOwnerLocalSmokeCloseoutChecks,
  buildMockedOwnerLocalSmokeCloseoutReport,
  buildMockedOwnerLocalSmokeCloseoutResult,
  buildMockedOwnerLocalSmokeCloseoutBlockedResult,
} from './mockedSimilarityOwnerLocalSmokeCloseoutFixtures';

export type {
  SimilarityOwnerLocalManualRunStatus,
  SimilarityOwnerLocalManualRunDecision,
  SimilarityOwnerLocalManualRunCheckStatus,
  SimilarityOwnerLocalManualRunCheck,
  SimilarityOwnerLocalManualRunPolicy,
  SimilarityOwnerLocalManualRunProviderProbe,
  SimilarityOwnerLocalManualRunEngineContractCheck,
  SimilarityOwnerLocalManualRunRedactionCheck,
  SimilarityOwnerLocalManualRunReport,
  SimilarityOwnerLocalManualRunResult,
} from './similarityOwnerLocalManualRunTypes';

export {
  buildDefaultSimilarityOwnerLocalManualRunPolicy,
  buildApprovedSimilarityOwnerLocalManualRunPolicy,
  buildOwnerLocalManualRunPreflightChecks,
  buildOwnerLocalManualRunBlockedReport,
  buildOwnerLocalManualRunRedactedReport,
  buildOwnerLocalManualRunResult,
  bucketNormalizedBarCount,
  sanitizeManualRunSerializedOutput,
  assertManualRunReportIsRedacted,
} from './similarityOwnerLocalManualRun';

export {
  buildMockedOwnerLocalManualRunDefaultPolicy,
  buildMockedOwnerLocalManualRunApprovedPolicy,
  buildMockedOwnerLocalManualRunBlockedReport,
  buildMockedOwnerLocalManualRunExecutedRedactedReport,
  buildMockedOwnerLocalManualRunFailedRedactedReport,
  buildMockedOwnerLocalManualRunResult,
} from './mockedSimilarityOwnerLocalManualRunFixtures';
