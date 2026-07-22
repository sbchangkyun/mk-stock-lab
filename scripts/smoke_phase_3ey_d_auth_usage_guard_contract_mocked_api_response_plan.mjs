#!/usr/bin/env node
/**
 * Phase 3EY-D committed runtime smoke script for the sanitized mocked Chart Similarity API
 * response contract (built on top of the Phase 3EY-C auth/usage execution guard).
 *
 * This exercises the ACTUAL TypeScript response-type/builder/fixture code (not a
 * re-implementation) using Node's native TypeScript type-stripping support. Because the
 * repository's import convention is extensionless relative imports, and Node's ESM loader
 * requires an explicit extension to resolve a relative specifier, this script copies
 * `src/lib/server/chartSimilarity/**` and `src/lib/chartSimilarity/types.ts` into an OS temp
 * directory and rewrites only the copies' relative import specifiers to add a `.ts` extension.
 * The committed source files under `src/` are never modified. The temp directory is removed in
 * a `finally` block regardless of outcome.
 *
 * No network, no env reads, no dev server, no browser, no dependencies added, no live KIS call,
 * no real auth provider, no API route.
 */

import { mkdtempSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let passCount = 0;
let failCount = 0;
const failures = [];

const check = (label, condition) => {
  if (condition) {
    passCount += 1;
    console.log(`[PASS] ${label}`);
  } else {
    failCount += 1;
    failures.push(label);
    console.log(`[FAIL] ${label}`);
  }
};

const IMPORT_SPECIFIER_PATTERN = /(from\s+['"])(\.[^'"]+)(['"])/g;

const rewriteRelativeImports = (source) =>
  source.replace(IMPORT_SPECIFIER_PATTERN, (full, prefix, specifier, suffix) => {
    if (/\.[a-zA-Z0-9]+$/.test(specifier)) return full;
    return `${prefix}${specifier}.ts${suffix}`;
  });

const copyDirWithRewrite = (srcDir, destDir) => {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirWithRewrite(srcPath, destPath);
      continue;
    }
    if (!entry.endsWith('.ts')) continue;
    const original = readFileSync(srcPath, 'utf8');
    writeFileSync(destPath, rewriteRelativeImports(original), 'utf8');
  }
};

const copyFileWithRewrite = (srcFile, destFile) => {
  mkdirSync(path.dirname(destFile), { recursive: true });
  const original = readFileSync(srcFile, 'utf8');
  writeFileSync(destFile, rewriteRelativeImports(original), 'utf8');
};

const hasNonFinite = (value) => {
  if (typeof value === 'number') return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasNonFinite);
  if (value && typeof value === 'object') return Object.values(value).some(hasNonFinite);
  return false;
};

const TOKEN_LIKE_PATTERN = /(access_token|session_token|refresh_token|bearer\s+[a-z0-9]|sk-[a-z0-9])/i;
const AUTH_PROVIDER_PAYLOAD_PATTERN = /(oauth|id_token|provider_token|auth0|supabase\.auth|jwt)/i;
const KIS_CREDENTIAL_PATTERN = /(appkey|appsecret|kis_app_key|kis_app_secret|kis_access_token)/i;
const ACCOUNT_TRADING_PATTERN = /(account[_-]?no|placeorder|trading[_-]?api|order[_-]?api|balance[_-]?api|kis_account)/i;
const USER_ID_FIELD_PATTERN = /"userId"\s*:/;
const ROLE_AUTH_STATE_FIELD_PATTERN = /"(role|authState)"\s*:/;
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const tempRoot = mkdtempSync(path.join(tmpdir(), 'mkstocklab-chartsim-3ey-d-'));

let apiModule = null;

try {
  const serverSrc = path.join(repoRoot, 'src', 'lib', 'server', 'chartSimilarity');
  const serverDest = path.join(tempRoot, 'lib', 'server', 'chartSimilarity');
  copyDirWithRewrite(serverSrc, serverDest);

  const typesSrc = path.join(repoRoot, 'src', 'lib', 'chartSimilarity', 'types.ts');
  const typesDest = path.join(tempRoot, 'lib', 'chartSimilarity', 'types.ts');
  copyFileWithRewrite(typesSrc, typesDest);

  try {
    apiModule = await import(pathToFileURL(path.join(serverDest, 'index.ts')).href);
  } catch (importError) {
    console.log('[IMPLEMENTATION NOTE] Node could not execute the copied TypeScript API response sources via native type stripping.');
    console.log(String(importError && importError.stack ? importError.stack : importError));
    console.log('\nSmoke verification could not run. This is reported as a failure, not skipped silently.');
    process.exitCode = 1;
    throw importError;
  }

  const {
    mapGuardStatusToApiStatus,
    buildSimilarityApiErrorFromGuard,
    buildSimilarityApiResponseFromGuard,
    toSimilarityApiSafeUsage,
    buildMockedSimilarityApiAllowedResponse,
    buildMockedSimilarityApiAuthRequiredResponse,
    buildMockedSimilarityApiUsageLimitedResponse,
    buildMockedSimilarityApiFeatureDisabledResponse,
    buildMockedSimilarityApiNotConfiguredResponse,
    buildMockedSimilarityApiBlockedResponse,
  } = apiModule;

  // 1-6: allowed/success shape checks.
  const allowedResponse = buildMockedSimilarityApiAllowedResponse();
  check('1. allowed response has ok true', allowedResponse.ok === true);
  check('2. allowed response has status success', allowedResponse.status === 'success');
  check('3. allowed response has mode mocked-plan', allowedResponse.mode === 'mocked-plan');
  check('4. allowed response has non-null data', allowedResponse.data !== null);
  check('5. allowed response has null error', allowedResponse.error === null);
  check(
    '6. allowed response request has mocked source, KR market, non-empty symbol',
    allowedResponse.request.source === 'mocked' &&
      allowedResponse.request.market === 'KR' &&
      typeof allowedResponse.request.symbol === 'string' &&
      allowedResponse.request.symbol.length > 0,
  );

  // 7-11: auth_required shape checks.
  const authRequiredResponse = buildMockedSimilarityApiAuthRequiredResponse();
  check('7. auth_required response has ok false', authRequiredResponse.ok === false);
  check('8. auth_required response has status auth_required', authRequiredResponse.status === 'auth_required');
  check('9. auth_required response has mode guard-blocked', authRequiredResponse.mode === 'guard-blocked');
  check('10. auth_required response has null data', authRequiredResponse.data === null);
  check(
    '11. auth_required response has structured error with code auth_required',
    authRequiredResponse.error !== null && authRequiredResponse.error.code === 'auth_required',
  );

  // 12-14: usage_limited shape checks.
  const usageLimitedResponse = buildMockedSimilarityApiUsageLimitedResponse();
  check('12. usage_limited response has status usage_limited', usageLimitedResponse.status === 'usage_limited');
  check('13. usage_limited response error is retryable', usageLimitedResponse.error !== null && usageLimitedResponse.error.retryable === true);
  check(
    '14. usage_limited response usage has zero remaining',
    usageLimitedResponse.usage !== null && usageLimitedResponse.usage.remaining === 0,
  );

  // 15: feature_disabled shape check.
  const featureDisabledResponse = buildMockedSimilarityApiFeatureDisabledResponse();
  check(
    '15. feature_disabled response has status feature_disabled and mode feature-flag-off',
    featureDisabledResponse.status === 'feature_disabled' && featureDisabledResponse.mode === 'feature-flag-off',
  );

  // 16: not_configured shape check.
  const notConfiguredResponse = buildMockedSimilarityApiNotConfiguredResponse();
  check(
    '16. not_configured response has status not_configured and null usage',
    notConfiguredResponse.status === 'not_configured' && notConfiguredResponse.usage === null,
  );

  // 17: blocked shape check. The invalid-symbol fixture surfaces the guard's specific
  // `invalid_symbol` errorCode rather than the generic `blocked_request` default, since the
  // builder preserves any errorCode already supplied by the guard result.
  const blockedResponse = buildMockedSimilarityApiBlockedResponse();
  check(
    '17. blocked response has status blocked and a non-empty structured error code',
    blockedResponse.status === 'blocked' &&
      blockedResponse.error !== null &&
      blockedResponse.error.code === 'invalid_symbol',
  );

  const allResponses = [
    allowedResponse,
    authRequiredResponse,
    usageLimitedResponse,
    featureDisabledResponse,
    notConfiguredResponse,
    blockedResponse,
  ];
  const serialized = JSON.stringify(allResponses);

  // 18-24: secret/token/auth/KIS/account safety checks.
  check('18. no output contains token-like values', !TOKEN_LIKE_PATTERN.test(serialized));
  check('19. no output contains raw auth provider payload markers', !AUTH_PROVIDER_PAYLOAD_PATTERN.test(serialized));
  check('20. no output contains KIS credential names', !KIS_CREDENTIAL_PATTERN.test(serialized));
  check('21. no output contains account/trading/order/balance fields', !ACCOUNT_TRADING_PATTERN.test(serialized));
  check('22. no output contains a userId field', !USER_ID_FIELD_PATTERN.test(serialized));
  check('23. no output contains a role or authState field', !ROLE_AUTH_STATE_FIELD_PATTERN.test(serialized));
  check('24. no output contains an email-shaped value', !EMAIL_PATTERN.test(serialized));

  // 25-28: mocked data quality checks.
  check(
    '25. allowed response mocked data has exactly 3 ranked matches',
    Array.isArray(allowedResponse.data.matches) &&
      allowedResponse.data.matches.length === 3 &&
      allowedResponse.data.matches.every((m, i) => m.rank === i + 1),
  );
  check('26. allowed response mocked data has no NaN/Infinity values', !hasNonFinite(allowedResponse.data));
  check(
    '27. allowed response mocked data disclaimer mentions mocked data',
    typeof allowedResponse.data.summary.disclaimer === 'string' &&
      /mock/i.test(allowedResponse.data.summary.disclaimer),
  );
  check(
    '28. allowed response narrative title references the request symbol',
    typeof allowedResponse.data.narrative.title === 'string' &&
      allowedResponse.data.narrative.title.includes(allowedResponse.request.symbol),
  );

  // 29-32: builder status-mapping checks.
  check('29. mapGuardStatusToApiStatus maps allowed to success', mapGuardStatusToApiStatus('allowed') === 'success');
  check(
    '30. mapGuardStatusToApiStatus is identity for non-allowed statuses',
    mapGuardStatusToApiStatus('blocked') === 'blocked' &&
      mapGuardStatusToApiStatus('usage_limited') === 'usage_limited' &&
      mapGuardStatusToApiStatus('not_configured') === 'not_configured' &&
      mapGuardStatusToApiStatus('feature_disabled') === 'feature_disabled' &&
      mapGuardStatusToApiStatus('error') === 'error',
  );
  const syntheticOkGuardResult = {
    ok: true,
    status: 'allowed',
    request: { purpose: 'chart-similarity', source: 'mocked', role: 'anonymous', authState: 'missing', symbol: 'X', market: 'KR', assetType: 'stock' },
    usage: null,
    safeMessage: 'ok',
    warnings: [],
  };
  check('31. buildSimilarityApiErrorFromGuard returns null for an ok guard result', buildSimilarityApiErrorFromGuard(syntheticOkGuardResult) === null);
  check(
    '32. buildSimilarityApiResponseFromGuard never throws for a synthetic guard result and toSimilarityApiSafeUsage(null) is null',
    (() => {
      try {
        const response = buildSimilarityApiResponseFromGuard(syntheticOkGuardResult);
        return response.ok === true && toSimilarityApiSafeUsage(null) === null;
      } catch {
        return false;
      }
    })(),
  );

  // 33: building every mocked response fixture never touches process.env.
  const originalEnv = process.env;
  let envAccessed = false;
  process.env = new Proxy(originalEnv, {
    get(target, prop) {
      envAccessed = true;
      return target[prop];
    },
  });
  try {
    buildMockedSimilarityApiAllowedResponse();
    buildMockedSimilarityApiAuthRequiredResponse();
    buildMockedSimilarityApiUsageLimitedResponse();
    buildMockedSimilarityApiFeatureDisabledResponse();
    buildMockedSimilarityApiNotConfiguredResponse();
    buildMockedSimilarityApiBlockedResponse();
  } finally {
    process.env = originalEnv;
  }
  check('33. no env access occurs while building mocked API responses', envAccessed === false);

  console.log(`\nPhase 3EY-D smoke summary: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) {
    console.log('Failed checks:');
    for (const label of failures) console.log(` - ${label}`);
    process.exitCode = 1;
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
