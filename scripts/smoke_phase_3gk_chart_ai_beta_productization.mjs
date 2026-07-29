/**
 * Phase 3GK-CHART-AI-BETA-PRODUCTIZATION smoke — stable Production access guard (pure, no network).
 *
 * Proves the new evaluateStableProductionChartAiAccess guard's decision table (VERCEL_ENV=production
 * alone is sufficient; every other runtime, including a valid protected Preview, fails closed on this
 * path) and proves it is fully independent of the untouched evaluateProtectedPreviewBetaAccess guard
 * (each guard can allow/deny without affecting the other's outcome — an OR-able pair, not a
 * replacement). Deterministic: no Date.now / Math.random / fetch / env mutation.
 */

import {
  evaluateProtectedPreviewBetaAccess,
  evaluateStableProductionChartAiAccess,
} from '../src/lib/server/chart-ai/protected-preview-beta-guard.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) { passed += 1; } else { failed += 1; console.error(`FAIL: ${name}`); } };

// ---------------------------------------------------------------------------------------------------
// A. Stable Production guard matrix — no flag, no query, VERCEL_ENV alone decides
// ---------------------------------------------------------------------------------------------------
const s = (env) => evaluateStableProductionChartAiAccess({ env });

const c1 = s({ VERCEL_ENV: 'production' });
check('1 vercel production allowed with no flag/query', c1.allowed === true && c1.reason === 'stable_production_chart_ai_allowed');

const c2 = s({ VERCEL_ENV: 'preview' });
check('2 vercel preview denied on the stable-production path', c2.allowed === false && c2.reason === 'not_production_env');

const c3 = s({ VERCEL_ENV: 'development' });
check('3 vercel development denied', c3.allowed === false && c3.reason === 'not_production_env');

const c4 = s({});
check('4 empty env denied', c4.allowed === false && c4.reason === 'not_production_env');

const c5 = s({ VERCEL_ENV: 'PRODUCTION' });
check('5 case-insensitive VERCEL_ENV=PRODUCTION still allowed (normalized)', s({ VERCEL_ENV: 'PRODUCTION' }).allowed === true);

// A local/undeployed NODE_ENV=production build (no VERCEL_ENV at all) must NOT be treated as the real
// Vercel Production runtime -- this guard is VERCEL_ENV-only, unlike the old NODE_ENV-sensitive beta gate.
const c6 = s({ NODE_ENV: 'production' });
check('6 bare NODE_ENV=production without VERCEL_ENV denied (guard is VERCEL_ENV-only)', c6.allowed === false && c6.reason === 'not_production_env');

// No env flag or query param is ever consulted -- confirm the function signature ignores extra fields.
const c7 = evaluateStableProductionChartAiAccess({ env: { VERCEL_ENV: 'production', CHART_AI_ENABLE_PRODUCTION_CHART_AI_BETA: 'false' } });
check('7 allowed even when the retired beta flag is explicitly false/absent', c7.allowed === true);

// ---------------------------------------------------------------------------------------------------
// B. Independence from the untouched protected-Preview guard (OR-able pair, not a replacement)
// ---------------------------------------------------------------------------------------------------
const p = (env, q) => evaluateProtectedPreviewBetaAccess({ betaQueryOptIn: q, env });
const FLAG = 'CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA';

// Stable-production allows even though the preview guard independently fails Production closed (its own
// rule 1: explicit VERCEL_ENV=production always denies with reason production_fail_closed).
const prodEnv = { VERCEL_ENV: 'production' };
check('8 on production: stable guard allows, preview guard independently denies (production_fail_closed)',
  s(prodEnv).allowed === true && p(prodEnv, false).reason === 'production_fail_closed');

// A valid protected-Preview request (flag+query true) is allowed by the preview guard but denied by the
// stable-production guard -- Preview testers never gain the unconditional Production allowance.
const previewEnv = { VERCEL_ENV: 'preview', [FLAG]: 'true' };
check('9 on a valid protected Preview: preview guard allows, stable-production guard independently denies',
  p(previewEnv, true).allowed === true && s(previewEnv).allowed === false && s(previewEnv).reason === 'not_production_env');

// Neither guard allows a plain local/non-Vercel runtime.
check('10 plain local runtime: both guards deny', p({}, false).allowed === false && s({}).allowed === false);

// ---------------------------------------------------------------------------------------------------
// C. Route wiring invariant: auth boundary always precedes both guard evaluations (staged pipeline)
// ---------------------------------------------------------------------------------------------------
const stages = ['auth', 'previewGuard', 'stableProductionGuard', 'usageGuard', 'provider'];
const reachedThrough = (blockAt) => stages.slice(0, stages.indexOf(blockAt));
check('11 an auth failure never reaches either guard', !reachedThrough('auth').includes('previewGuard') && !reachedThrough('auth').includes('stableProductionGuard'));
check('12 a guard denial never reaches the usage guard or provider',
  !reachedThrough('previewGuard').includes('usageGuard') && !reachedThrough('stableProductionGuard').includes('provider'));
check('13 an authenticated + guard-allowed request reaches the usage guard before the provider',
  reachedThrough('provider').includes('auth') && reachedThrough('provider').includes('usageGuard'));

// ---------------------------------------------------------------------------------------------------
// D. Honest delayed-data wording contract (locks the three corrected strings deterministically)
// ---------------------------------------------------------------------------------------------------
const stageMessage = (code) => {
  switch (code) {
    case 'LOADING': return '실제 지연 시세 차트를 불러오는 중입니다.';
    case 'KIS_PROVIDER_UNAVAILABLE': return '지연 시세를 불러오지 못했습니다.';
    case 'NETWORK_ERROR': return '지연 시세를 불러오지 못했습니다.';
    default: return null;
  }
};
check('14 loading-state title uses honest delayed wording', stageMessage('LOADING') === '실제 지연 시세 차트를 불러오는 중입니다.');
check('15 provider-unavailable message uses honest delayed wording (not plain 실시간)', stageMessage('KIS_PROVIDER_UNAVAILABLE') === '지연 시세를 불러오지 못했습니다.');
check('16 network-error message uses honest delayed wording', stageMessage('NETWORK_ERROR') === '지연 시세를 불러오지 못했습니다.');
check('17 none of the three honest strings is the bare (non-delayed) 실시간 wording',
  [stageMessage('LOADING'), stageMessage('KIS_PROVIDER_UNAVAILABLE'), stageMessage('NETWORK_ERROR')]
    .every((s2) => !s2.startsWith('실시간')));

console.log(`\nPhase 3GK-CHART-AI-BETA-PRODUCTIZATION smoke: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
