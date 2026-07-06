/** Server-only deterministic owner-local Similar Pattern activation for Phase 3FD-J. */

import { buildSyntheticOhlcvFixture } from '../../data/chartSimilarity/syntheticOhlcvFixture';
import { scanSimilarity } from '../chartSimilarity';
import {
  assertChartAiServerGuardDecisionIsSafe,
  evaluateChartAiServerGuard,
} from './chartAiGuardFoundation';
import {
  buildAllGatesOffChartAiGuardDependencies,
  buildMockedChartAiGuardSubject,
} from './chartAiGuardFoundationFixtures';
import type { ChartAiGuardRole } from './chartAiGuardFoundationTypes';
import type {
  ChartAiOwnerLocalGuardScenario,
  ChartAiOwnerLocalSimilarPatternBlocked,
  ChartAiOwnerLocalSimilarPatternContext,
  ChartAiOwnerLocalSimilarPatternRequest,
  ChartAiOwnerLocalSimilarPatternResponse,
  ChartAiOwnerLocalSimilarPatternStatus,
  ChartAiOwnerLocalTestRole,
} from './chartAiOwnerLocalSimilarPatternActivationTypes';

const MODE = 'owner-local-similar-pattern-route' as const;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

const blocked = (
  status: Exclude<ChartAiOwnerLocalSimilarPatternStatus, 'owner_local_similarity_success'>,
  code: string,
  message: string,
): ChartAiOwnerLocalSimilarPatternBlocked => ({
  ok: false,
  status,
  mode: MODE,
  data: null,
  error: { code, message },
});

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const normalizeRole = (value: unknown): ChartAiOwnerLocalTestRole | null => {
  if (value === 'user' || value === 'master' || value === 'anonymous' || value === 'unknown') return value;
  return null;
};

export const isOwnerLocalHostname = (hostname: string): boolean => LOCAL_HOSTS.has(hostname.toLowerCase());

export const isOwnerLocalSimilarPatternGuardedBranchBody = (body: unknown): boolean => {
  const record = asRecord(body);
  return Boolean(
    record &&
    record.mode === 'guarded-runtime-scaffold' &&
    record.source === 'mocked-provider-compatible' &&
    record.guardedRuntimeScaffold === true,
  );
};

export const normalizeOwnerLocalSimilarPatternRequest = (
  body: unknown,
): ChartAiOwnerLocalSimilarPatternRequest | null => {
  const record = asRecord(body);
  if (!record || !isOwnerLocalSimilarPatternGuardedBranchBody(record)) return null;
  if (record.ownerLocalSimilarPatternRouteActivation !== true) return null;
  if (record.requestKind !== 'similar_pattern') return null;
  if (record.subjectRole !== 'user' && record.subjectRole !== 'master') return null;
  return {
    mode: 'guarded-runtime-scaffold',
    source: 'mocked-provider-compatible',
    guardedRuntimeScaffold: true,
    ownerLocalSimilarPatternRouteActivation: true,
    requestKind: 'similar_pattern',
    subjectRole: record.subjectRole,
  };
};

const guardOverridesForScenario = (scenario: ChartAiOwnerLocalGuardScenario) => {
  if (scenario === 'feature_disabled') return { featureEnabled: false };
  if (scenario === 'cooldown_active') {
    return { cooldown: { state: 'active' as const, remainingBucket: 'short' as const } };
  }
  if (scenario === 'usage_limited') {
    return { usage: { state: 'limited' as const, remainingBucket: 'none' as const } };
  }
  if (scenario === 'cost_blocked') {
    return { cost: { state: 'blocked' as const, budgetBucket: 'none' as const } };
  }
  if (scenario === 'provider_unavailable') return { providerFoundationReady: false };
  return {};
};

const toPercentLabel = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`
    : 'not_available';

const toScoreLabel = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(2)} points` : 'not_available';

const guardStatusMessage = (status: ChartAiOwnerLocalSimilarPatternStatus): string => {
  const messages: Record<string, string> = {
    blocked_anonymous: 'Authentication is required for this owner-local verification path.',
    blocked_feature_disabled: 'The Similar Pattern feature guard is disabled.',
    blocked_usage_limited: 'The mocked usage guard blocked this request.',
    blocked_cooldown: 'The mocked cooldown guard blocked this request.',
    blocked_cost_guard: 'The mocked cost guard blocked this request.',
    blocked_provider_disabled: 'The requested provider foundation is disabled.',
    blocked_route_success_disabled: 'Public route success remains disabled.',
    fail_closed: 'The request failed closed.',
  };
  return messages[status] ?? 'The request was safely blocked.';
};

export const runOwnerLocalSimilarPatternActivation = (
  body: unknown,
  context: ChartAiOwnerLocalSimilarPatternContext,
): ChartAiOwnerLocalSimilarPatternResponse => {
  const record = asRecord(body);
  if (!record || !isOwnerLocalSimilarPatternGuardedBranchBody(record)) {
    return blocked('blocked_invalid_request', 'invalid_request', 'The request shape is invalid.');
  }
  if (record.ownerLocalSimilarPatternRouteActivation !== true) {
    return blocked(
      'blocked_explicit_activation_required',
      'explicit_activation_required',
      'Explicit owner-local activation is required.',
    );
  }
  if (!isOwnerLocalHostname(context.hostname)) {
    return blocked('blocked_owner_local_required', 'owner_local_required', 'A local host is required.');
  }
  if (record.requestKind === 'mk_ai') {
    return blocked('blocked_provider_disabled', 'llm_provider_disabled', 'MK AI route execution is disabled.');
  }
  if (record.requestKind !== 'similar_pattern') {
    return blocked('blocked_invalid_request', 'invalid_request_kind', 'Only Similar Pattern is supported.');
  }

  const role = normalizeRole(record.subjectRole);
  if (!role) return blocked('blocked_invalid_request', 'invalid_role', 'The mocked-safe role is invalid.');
  if (role === 'anonymous') {
    return blocked('blocked_anonymous', 'authentication_required', 'Authentication is required.');
  }

  const guardScenario = context.guardScenario ?? 'ready';
  const subject = role === 'unknown'
    ? buildMockedChartAiGuardSubject('unknown')
    : buildMockedChartAiGuardSubject(role as ChartAiGuardRole);
  const guardDecision = evaluateChartAiServerGuard({
    requestKind: 'similar_pattern',
    subject,
    dependencies: buildAllGatesOffChartAiGuardDependencies({
      featureEnabled: true,
      providerFoundationReady: true,
      ...guardOverridesForScenario(guardScenario),
    }),
  });
  assertChartAiServerGuardDecisionIsSafe(guardDecision);

  if (guardDecision.status !== 'blocked_route_success_disabled') {
    return blocked(
      guardDecision.status,
      guardDecision.reason,
      guardStatusMessage(guardDecision.status),
    );
  }

  const analysis = scanSimilarity(buildSyntheticOhlcvFixture(), {
    baseWindow: 20,
    forwardWindows: [5, 20],
    topK: 5,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 40,
  });
  const matches = analysis.matches.map((match) => ({
    rank: match.rank,
    label: `Synthetic match ${match.rank}`,
    scoreLabel: toScoreLabel(match.similarityScore),
    forwardReturn5Label: toPercentLabel(match.forwardOutcome.forwardReturns.d5),
    forwardReturn20Label: toPercentLabel(match.forwardOutcome.forwardReturns.d20),
    drawdownLabel: toPercentLabel(match.forwardOutcome.maxDrawdownPct),
  }));

  return {
    ok: true,
    status: 'owner_local_similarity_success',
    mode: MODE,
    data: {
      summary: {
        resultSource: 'synthetic_sample_only',
        matchCount: matches.length,
        currentWindowSize: analysis.currentWindow.bars.length,
        scoreLabel: matches[0]?.scoreLabel ?? 'not_available',
      },
      matches,
    },
    error: null,
  };
};

export const assertOwnerLocalSimilarPatternResponseIsSafe = (
  response: ChartAiOwnerLocalSimilarPatternResponse,
): void => {
  const serialized = JSON.stringify(response);
  const forbidden = /@|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|subject_mock|access.?token|refresh.?token|authorization|cookie|session|stack|normalizedPath|currentNormalizedPath|"open"|"high"|"low"|"close"|"volume"/i;
  if (forbidden.test(serialized)) throw new Error('Owner-local Similar Pattern response failed safety validation.');
};
