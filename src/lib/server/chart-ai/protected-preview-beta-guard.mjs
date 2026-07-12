// Phase 3GG-L-BETA-ACTIVATE protected Preview-only beta access guard.
//
// Pure, dependency-free, server-only. Decides whether an incoming Chart AI KIS + LLM summary request
// is an authorized *protected Vercel Preview beta* request. This is intentionally separate from the
// existing localhost owner path (which is unchanged) and is fail-closed by construction: it grants
// access ONLY when every one of the following holds simultaneously —
//   - the runtime is a Vercel Preview deployment (VERCEL_ENV === 'preview'),
//   - the runtime is NOT production (neither VERCEL_ENV nor NODE_ENV is 'production'),
//   - the owner-set flag CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA is exactly 'true',
//   - the request carries the explicit `chartAiBetaPreview=1` opt-in query.
// Any missing/unknown/production condition returns { allowed: false } with a coarse reason. This
// module never reads secrets, never prints anything, and exposes no KIS/LLM/model/prompt/numeric data.
// It performs no network call and contacts no KIS endpoint of any kind.

const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

export const PROTECTED_PREVIEW_BETA_FLAG_ENV_NAME = 'CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA';
export const PROTECTED_PREVIEW_BETA_QUERY_PARAM = 'chartAiBetaPreview';

// `env` carries only the coarse runtime signals the caller has already resolved (never secrets):
// { VERCEL_ENV, NODE_ENV, CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA }. `betaQueryOptIn` is a boolean.
export function evaluateProtectedPreviewBetaAccess({ betaQueryOptIn = false, env = {} } = {}) {
  const vercelEnv = normalize(env.VERCEL_ENV);
  const nodeEnv = normalize(env.NODE_ENV);
  const betaFlag = normalize(env.CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA);

  // Production must always fail closed, regardless of any other signal.
  if (vercelEnv === 'production' || nodeEnv === 'production') {
    return { allowed: false, reason: 'production_fail_closed' };
  }

  // Only Vercel Preview deployments are eligible for beta activation.
  if (vercelEnv !== 'preview') {
    return { allowed: false, reason: 'not_preview_env' };
  }

  // The owner-controlled activation flag must be explicitly enabled.
  if (betaFlag !== 'true') {
    return { allowed: false, reason: 'beta_flag_disabled' };
  }

  // The request must carry the explicit beta opt-in query.
  if (betaQueryOptIn !== true) {
    return { allowed: false, reason: 'beta_query_optin_missing' };
  }

  return { allowed: true, reason: 'protected_preview_beta_allowed' };
}

// Phase 3GG-M-PROD-BETA-DEPLOY production beta access guard.
//
// Separate, fail-closed evaluator for the actual Vercel Production URL. Does not weaken or replace
// the Preview guard above (evaluateProtectedPreviewBetaAccess is unchanged). Grants access ONLY when
// every one of the following holds simultaneously —
//   - the runtime is a Vercel Production deployment (VERCEL_ENV === 'production'),
//   - the owner-set flag CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA is exactly 'true',
//   - the request carries the explicit `chartAiProdBeta=1` opt-in query.
// Any missing/unknown/non-production condition returns { allowed: false } with a coarse reason. This
// module never reads secrets, never prints anything, and exposes no KIS/LLM/model/prompt/numeric data.
// It performs no network call and contacts no KIS endpoint of any kind.

export const PRODUCTION_CHART_AI_BETA_FLAG_ENV_NAME = 'CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA';
export const PRODUCTION_CHART_AI_BETA_QUERY_PARAM = 'chartAiProdBeta';

// `env` carries only the coarse runtime signals the caller has already resolved (never secrets):
// { VERCEL_ENV, CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA }. `betaQueryOptIn` is a boolean.
export function evaluateProductionChartAiBetaAccess({ betaQueryOptIn = false, env = {} } = {}) {
  const vercelEnv = normalize(env.VERCEL_ENV);
  const betaFlag = normalize(env.CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA);

  // Only the actual Vercel Production deployment is eligible for production beta activation. A
  // non-production runtime (including Preview) must always fail closed on this path -- Preview
  // testers use the separate chartAiBetaPreview=1 guard above instead.
  if (vercelEnv !== 'production') {
    return { allowed: false, reason: 'not_production_env' };
  }

  // The owner-controlled activation flag must be explicitly enabled.
  if (betaFlag !== 'true') {
    return { allowed: false, reason: 'production_beta_flag_disabled' };
  }

  // The request must carry the explicit production beta opt-in query.
  if (betaQueryOptIn !== true) {
    return { allowed: false, reason: 'production_beta_query_optin_missing' };
  }

  return { allowed: true, reason: 'production_chart_ai_beta_allowed' };
}
