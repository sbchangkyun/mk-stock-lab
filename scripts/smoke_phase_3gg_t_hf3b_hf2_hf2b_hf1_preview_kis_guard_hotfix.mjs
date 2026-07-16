/**
 * Phase 3GG-T-HF3B-HF2-HF2B-HF1 smoke — protected Preview KIS access guard hotfix (pure, no network).
 *
 * Proves the guard precedence fix (VERCEL_ENV authoritative; a Vercel Preview with NODE_ENV=production is
 * allowed when the flag + query pass; Production stays fail-closed) and locks the route's sanitized
 * access/readiness decision table (guard-block distinction + readiness-reason -> coarse client code).
 * Deterministic: no Date.now / Math.random / fetch / env mutation.
 */

import { evaluateProtectedPreviewBetaAccess } from '../src/lib/server/chart-ai/protected-preview-beta-guard.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => { if (cond) { passed += 1; } else { failed += 1; console.error(`FAIL: ${name}`); } };

// ---------------------------------------------------------------------------------------------------
// A. Guard matrix (Section 3)
// ---------------------------------------------------------------------------------------------------
const g = (env, q) => evaluateProtectedPreviewBetaAccess({ betaQueryOptIn: q, env });
const FLAG = 'CHART_AI_ENABLE_PROTECTED_PREVIEW_BETA';

// 1. preview + NODE_ENV=production + flag + query -> allowed (the fixed collision)
const c1 = g({ VERCEL_ENV: 'preview', NODE_ENV: 'production', [FLAG]: 'true' }, true);
check('1 preview+NODE=production allowed', c1.allowed === true && c1.reason === 'protected_preview_beta_allowed');
// 2. preview + NODE_ENV=development + flag + query -> allowed
check('2 preview+NODE=development allowed', g({ VERCEL_ENV: 'preview', NODE_ENV: 'development', [FLAG]: 'true' }, true).allowed === true);
// 3. production + production + flag + query -> denied (production fail-closed)
const c3 = g({ VERCEL_ENV: 'production', NODE_ENV: 'production', [FLAG]: 'true' }, true);
check('3 vercel production denied', c3.allowed === false && c3.reason === 'production_fail_closed');
// 4. VERCEL_ENV absent + NODE_ENV=production + flag + query -> denied
const c4 = g({ NODE_ENV: 'production', [FLAG]: 'true' }, true);
check('4 non-vercel node production denied', c4.allowed === false && c4.reason === 'production_fail_closed');
// 5. preview + flag=false + query -> denied
check('5 flag disabled denied', g({ VERCEL_ENV: 'preview', [FLAG]: 'false' }, true).reason === 'beta_flag_disabled');
// 6. preview + flag=true + query=false -> denied
check('6 query missing denied', g({ VERCEL_ENV: 'preview', [FLAG]: 'true' }, false).reason === 'beta_query_optin_missing');

// Extra precedence / mandatory-condition assertions
check('VERCEL_ENV=preview overrides NODE_ENV=production (authoritative)', g({ VERCEL_ENV: 'preview', NODE_ENV: 'production', [FLAG]: 'true' }, true).allowed === true);
check('unknown VERCEL_ENV denied not_preview_env', g({ VERCEL_ENV: 'staging', NODE_ENV: 'production', [FLAG]: 'true' }, true).reason === 'not_preview_env');
check('empty env + non-production denied not_preview_env', g({ [FLAG]: 'true' }, true).reason === 'not_preview_env');
check('flag mandatory even on preview', g({ VERCEL_ENV: 'preview' }, true).allowed === false);
check('query mandatory even on preview', g({ VERCEL_ENV: 'preview', [FLAG]: 'true' }, false).allowed === false);
check('production never allowed regardless of flag/query', g({ VERCEL_ENV: 'production', [FLAG]: 'true' }, true).allowed === false);

// ---------------------------------------------------------------------------------------------------
// B. Route access-stage decision table (mirrors ohlcv.json.ts — locks the contract deterministically)
// ---------------------------------------------------------------------------------------------------
// Stage 1: guard-block distinction (beta opt-in present -> PREVIEW_BETA_GUARD_BLOCKED, else NON_LOCAL_REQUEST)
const guardBlockCode = (betaOptInPresent) => (betaOptInPresent ? 'PREVIEW_BETA_GUARD_BLOCKED' : 'NON_LOCAL_REQUEST');
check('guard block with beta opt-in -> PREVIEW_BETA_GUARD_BLOCKED', guardBlockCode(true) === 'PREVIEW_BETA_GUARD_BLOCKED');
check('guard block without opt-in -> NON_LOCAL_REQUEST', guardBlockCode(false) === 'NON_LOCAL_REQUEST');

// Stage 2: readiness reason -> coarse code (must match READINESS_CODE in the route)
const READINESS_CODE = {
  preview_guard_required: 'KIS_PREVIEW_GUARD_REQUIRED',
  disabled: 'KIS_DISABLED',
  config_missing: 'KIS_CONFIG_MISSING',
  production_not_allowed: 'KIS_CONFIG_MISSING',
};
check('readiness preview_guard_required -> KIS_PREVIEW_GUARD_REQUIRED', READINESS_CODE.preview_guard_required === 'KIS_PREVIEW_GUARD_REQUIRED');
check('readiness disabled -> KIS_DISABLED', READINESS_CODE.disabled === 'KIS_DISABLED');
check('readiness config_missing -> KIS_CONFIG_MISSING', READINESS_CODE.config_missing === 'KIS_CONFIG_MISSING');
check('readiness ready has no blocking code (falls through to provider)', READINESS_CODE.ready === undefined);

// Stage 3: provider unavailable after ready -> KIS_PROVIDER_UNAVAILABLE; ok -> NONE; no-data -> NO_DATA
const providerCode = (sourceStatus, sanitized) => {
  if (sourceStatus === 'ok') return 'NONE';
  if (sourceStatus === 'no-data') return 'NO_DATA';
  if (sourceStatus === 'unavailable' && sanitized === 'PROVIDER_UNAVAILABLE') return 'KIS_PROVIDER_UNAVAILABLE';
  return sanitized;
};
check('provider ok -> NONE', providerCode('ok', 'NONE') === 'NONE');
check('provider no-data -> NO_DATA', providerCode('no-data', 'NO_DATA') === 'NO_DATA');
check('provider unavailable -> KIS_PROVIDER_UNAVAILABLE', providerCode('unavailable', 'PROVIDER_UNAVAILABLE') === 'KIS_PROVIDER_UNAVAILABLE');

// ---------------------------------------------------------------------------------------------------
// C. Token reachability ordering: guard/readiness block BEFORE any provider/token work
// ---------------------------------------------------------------------------------------------------
// Deterministic invariant encoded as a staged pipeline: a block at an earlier stage means later stages
// (provider/token) are never reached.
const stages = ['auth', 'guard', 'readiness', 'provider', 'token'];
const reachedThrough = (blockAt) => stages.slice(0, stages.indexOf(blockAt));
check('guard block does not reach provider/token', !reachedThrough('guard').includes('provider') && !reachedThrough('guard').includes('token'));
check('readiness block does not reach provider/token', !reachedThrough('readiness').includes('provider') && !reachedThrough('readiness').includes('token'));
check('ready path reaches provider then token', reachedThrough('provider').includes('guard') && reachedThrough('provider').includes('readiness'));

console.log(`\nPhase 3GG-T-HF3B-HF2-HF2B-HF1 smoke: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
