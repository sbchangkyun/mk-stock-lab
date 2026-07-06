import type { ChartAiGuardRole } from './chartAiGuardFoundationTypes';

export type ChartAiOwnerLocalSimilarPatternStatus =
  | 'owner_local_similarity_success'
  | 'blocked_owner_local_required'
  | 'blocked_explicit_activation_required'
  | 'blocked_invalid_request'
  | 'blocked_anonymous'
  | 'blocked_feature_disabled'
  | 'blocked_usage_limited'
  | 'blocked_cooldown'
  | 'blocked_cost_guard'
  | 'blocked_provider_disabled'
  | 'blocked_route_success_disabled'
  | 'fail_closed';

export type ChartAiOwnerLocalSimilarPatternRequest = {
  mode: 'guarded-runtime-scaffold';
  source: 'mocked-provider-compatible';
  guardedRuntimeScaffold: true;
  ownerLocalSimilarPatternRouteActivation: true;
  requestKind: 'similar_pattern';
  subjectRole: 'user' | 'master';
};

export type ChartAiOwnerLocalGuardScenario =
  | 'ready'
  | 'feature_disabled'
  | 'cooldown_active'
  | 'usage_limited'
  | 'cost_blocked'
  | 'provider_unavailable';

export type ChartAiOwnerLocalSimilarPatternContext = {
  hostname: string;
  guardScenario?: ChartAiOwnerLocalGuardScenario;
};

export type ChartAiOwnerLocalSimilarPatternMatch = {
  rank: number;
  label: string;
  scoreLabel: string;
  forwardReturn5Label: string;
  forwardReturn20Label: string;
  drawdownLabel: string;
};

export type ChartAiOwnerLocalSimilarPatternSuccess = {
  ok: true;
  status: 'owner_local_similarity_success';
  mode: 'owner-local-similar-pattern-route';
  data: {
    summary: {
      resultSource: 'synthetic_sample_only';
      matchCount: number;
      currentWindowSize: number;
      scoreLabel: string;
    };
    matches: ChartAiOwnerLocalSimilarPatternMatch[];
  };
  error: null;
};

export type ChartAiOwnerLocalSimilarPatternBlocked = {
  ok: false;
  status: Exclude<ChartAiOwnerLocalSimilarPatternStatus, 'owner_local_similarity_success'>;
  mode: 'owner-local-similar-pattern-route';
  data: null;
  error: {
    code: string;
    message: string;
  };
};

export type ChartAiOwnerLocalSimilarPatternResponse =
  | ChartAiOwnerLocalSimilarPatternSuccess
  | ChartAiOwnerLocalSimilarPatternBlocked;

export type ChartAiOwnerLocalSimilarPatternFixture = {
  name: string;
  body: unknown;
  context: ChartAiOwnerLocalSimilarPatternContext;
  expectedStatus: ChartAiOwnerLocalSimilarPatternStatus;
};

export type ChartAiOwnerLocalSimilarPatternSmokeReport = {
  ok: boolean;
  assertionCount: number;
  fixtureCount: number;
  failures: string[];
};

export type ChartAiOwnerLocalTestRole = ChartAiGuardRole | 'anonymous';
