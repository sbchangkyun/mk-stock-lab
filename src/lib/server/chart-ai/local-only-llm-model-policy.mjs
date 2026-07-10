// Phase 3GG-J-FAST local-only LLM model tier and fallback policy.
//
// Pure, dependency-free module that resolves which model name to use for each LLM role
// (main summary, fallback summary, test/smoke, and future moderation/embedding roles) from an
// injected env object -- never reads the process-global environment directly. Also decides whether a given
// classified LLM call failure is eligible for a one-time conservative fallback attempt. This
// module never calls OpenAI, never performs network I/O, and never logs/returns/exposes any
// resolved model name in a caller-facing response (callers are responsible for keeping model
// names out of any response contract).

export const LOCAL_ONLY_LLM_MODEL_POLICY_CONTRACT_VERSION = 'local-only-llm-model-policy.v0.1';

export const LLM_MODEL_ROLES = Object.freeze({
  MAIN_SUMMARY: 'main_summary',
  FALLBACK_SUMMARY: 'fallback_summary',
  TEST_SUMMARY: 'test_summary',
  MODERATION_FUTURE: 'moderation_future',
  EMBEDDING_FUTURE: 'embedding_future',
});

export const LLM_MODEL_POLICY_ENV_KEYS = Object.freeze({
  MAIN_SUMMARY: 'CHART_AI_LLM_MAIN_MODEL',
  MAIN_SUMMARY_LEGACY: 'CHART_AI_LLM_MODEL',
  FALLBACK_SUMMARY: 'CHART_AI_LLM_FALLBACK_MODEL',
  TEST_SUMMARY: 'CHART_AI_LLM_TEST_MODEL',
  MODERATION_FUTURE: 'CHART_AI_LLM_MODERATION_MODEL',
  EMBEDDING_FUTURE: 'CHART_AI_LLM_EMBEDDING_MODEL',
});

export const ALLOWED_LLM_MODEL_POLICY_FIELDS = Object.freeze([
  'mainSummaryModelPresent',
  'fallbackSummaryModelPresent',
  'testSummaryModelPresent',
  'moderationFutureModelPresent',
  'embeddingFutureModelPresent',
  'fallbackDistinctFromMain',
]);

export const MODEL_POLICY_ERROR_CODES = Object.freeze({
  MODEL_NAME_INVALID: 'MODEL_NAME_INVALID',
  MODEL_ROLE_UNKNOWN: 'MODEL_ROLE_UNKNOWN',
});

// Mirrors the bridge's classified OpenAI failure labels. Deliberately excludes bad_request,
// invalid_api_key, and unknown_openai_error -- those are never eligible for a fallback attempt.
export const FALLBACK_ELIGIBLE_ERROR_CLASSES = Object.freeze([
  'model_not_found',
  'permission_denied',
  'quota_or_rate_limit',
  'billing_or_quota',
  'server_error',
]);

// Reject whitespace, control characters, quotes, slashes, backticks, shell metacharacters, and
// anything containing a credential-like token. A valid model name is a short token of letters,
// digits, dots, dashes, underscores, and colons only.
const VALID_MODEL_NAME_PATTERN = /^[A-Za-z0-9._:-]+$/;
const FORBIDDEN_MODEL_NAME_PATTERN = /api[_-]?key|secret|token|bearer|password/i;

export function normalizeModelName(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed !== value.trim()) return null;
  if (!VALID_MODEL_NAME_PATTERN.test(trimmed)) return null;
  if (FORBIDDEN_MODEL_NAME_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function buildLocalOnlyLlmModelPolicy(env) {
  const safeEnv = env && typeof env === 'object' ? env : {};

  const mainFromRoleKey = normalizeModelName(safeEnv[LLM_MODEL_POLICY_ENV_KEYS.MAIN_SUMMARY]);
  const mainFromLegacyKey = normalizeModelName(safeEnv[LLM_MODEL_POLICY_ENV_KEYS.MAIN_SUMMARY_LEGACY]);
  const mainSummary = mainFromRoleKey || mainFromLegacyKey || null;

  const fallbackSummary = normalizeModelName(safeEnv[LLM_MODEL_POLICY_ENV_KEYS.FALLBACK_SUMMARY]);
  const testSummary = normalizeModelName(safeEnv[LLM_MODEL_POLICY_ENV_KEYS.TEST_SUMMARY]);
  const moderationFuture = normalizeModelName(safeEnv[LLM_MODEL_POLICY_ENV_KEYS.MODERATION_FUTURE]);
  const embeddingFuture = normalizeModelName(safeEnv[LLM_MODEL_POLICY_ENV_KEYS.EMBEDDING_FUTURE]);

  const fallbackDistinctFromMain = Boolean(fallbackSummary && mainSummary && fallbackSummary !== mainSummary);

  return Object.freeze({
    [LLM_MODEL_ROLES.MAIN_SUMMARY]: mainSummary,
    [LLM_MODEL_ROLES.FALLBACK_SUMMARY]: fallbackSummary,
    [LLM_MODEL_ROLES.TEST_SUMMARY]: testSummary,
    [LLM_MODEL_ROLES.MODERATION_FUTURE]: moderationFuture,
    [LLM_MODEL_ROLES.EMBEDDING_FUTURE]: embeddingFuture,
    fallbackDistinctFromMain,
  });
}

export function resolveLlmModelForRole(policy, role) {
  if (!policy || typeof policy !== 'object') return null;
  if (!Object.values(LLM_MODEL_ROLES).includes(role)) return null;
  const value = policy[role];
  return typeof value === 'string' ? value : null;
}

export function shouldAttemptFallbackForLlmFailure(errorClass) {
  return FALLBACK_ELIGIBLE_ERROR_CLASSES.includes(errorClass);
}

export function buildModelPolicySnapshot(policy) {
  const safePolicy = policy && typeof policy === 'object' ? policy : {};
  const snapshot = {
    mainSummaryModelPresent: Boolean(safePolicy[LLM_MODEL_ROLES.MAIN_SUMMARY]),
    fallbackSummaryModelPresent: Boolean(safePolicy[LLM_MODEL_ROLES.FALLBACK_SUMMARY]),
    testSummaryModelPresent: Boolean(safePolicy[LLM_MODEL_ROLES.TEST_SUMMARY]),
    moderationFutureModelPresent: Boolean(safePolicy[LLM_MODEL_ROLES.MODERATION_FUTURE]),
    embeddingFutureModelPresent: Boolean(safePolicy[LLM_MODEL_ROLES.EMBEDDING_FUTURE]),
    fallbackDistinctFromMain: Boolean(safePolicy.fallbackDistinctFromMain),
  };
  for (const key of Object.keys(snapshot)) {
    if (!ALLOWED_LLM_MODEL_POLICY_FIELDS.includes(key)) {
      delete snapshot[key];
    }
  }
  return snapshot;
}
