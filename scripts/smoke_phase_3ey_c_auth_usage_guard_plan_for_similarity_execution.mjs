#!/usr/bin/env node
/**
 * Phase 3EY-C committed runtime smoke script for the server-only auth/usage execution guard
 * foundation for Chart Similarity execution.
 *
 * This exercises the ACTUAL TypeScript guard policy/evaluator/fixture code (not a
 * re-implementation) using Node's native TypeScript type-stripping support. Because the
 * repository's import convention is extensionless relative imports, and Node's ESM loader
 * requires an explicit extension to resolve a relative specifier, this script copies
 * `src/lib/server/chartSimilarity/**` and `src/lib/chartSimilarity/types.ts` into an OS temp
 * directory and rewrites only the copies' relative import specifiers to add a `.ts` extension.
 * The committed source files under `src/` are never modified. The temp directory is removed in
 * a `finally` block regardless of outcome.
 *
 * No network, no env reads, no dev server, no browser, no dependencies added, no live KIS call,
 * no real auth provider.
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

const tempRoot = mkdtempSync(path.join(tmpdir(), 'mkstocklab-chartsim-3ey-c-'));

let guardModule = null;

try {
  const serverSrc = path.join(repoRoot, 'src', 'lib', 'server', 'chartSimilarity');
  const serverDest = path.join(tempRoot, 'lib', 'server', 'chartSimilarity');
  copyDirWithRewrite(serverSrc, serverDest);

  const typesSrc = path.join(repoRoot, 'src', 'lib', 'chartSimilarity', 'types.ts');
  const typesDest = path.join(tempRoot, 'lib', 'chartSimilarity', 'types.ts');
  copyFileWithRewrite(typesSrc, typesDest);

  try {
    guardModule = await import(pathToFileURL(path.join(serverDest, 'index.ts')).href);
  } catch (importError) {
    console.log('[IMPLEMENTATION NOTE] Node could not execute the copied TypeScript guard sources via native type stripping.');
    console.log(String(importError && importError.stack ? importError.stack : importError));
    console.log('\nSmoke verification could not run. This is reported as a failure, not skipped silently.');
    process.exitCode = 1;
    throw importError;
  }

  const {
    buildDefaultSimilarityExecutionGuardPolicy,
    getRoleDailyLimit,
    buildUsageSnapshot,
    evaluateSimilarityExecutionGuard,
    buildMockedAnonymousSimilarityGuardRequest,
    buildMockedAuthenticatedSimilarityGuardRequest,
    buildMockedBetaSimilarityGuardRequest,
    buildMockedOwnerSimilarityGuardRequest,
    buildMockedInvalidSimilarityGuardRequest,
  } = guardModule;

  // 1-5: default policy shape.
  const defaultPolicy = buildDefaultSimilarityExecutionGuardPolicy();
  check('1. default policy has enabled false', defaultPolicy.enabled === false);
  check('2. default policy requires auth', defaultPolicy.requireAuth === true);
  check('3. default policy requires usage guard', defaultPolicy.requireUsageGuard === true);
  check('4. default policy allows anonymous mocked preview', defaultPolicy.allowAnonymousMockedPreview === true);
  check('5. default policy disallows public KIS execution', defaultPolicy.allowPublicKisExecution === false);

  // 6-9: role daily limits.
  check('6. role daily limit for anonymous/default is 3', getRoleDailyLimit('anonymous', defaultPolicy) === 3);
  check('7. role daily limit for beta is 10', getRoleDailyLimit('beta', defaultPolicy) === 10);
  check('8. role daily limit for owner is 50', getRoleDailyLimit('owner', defaultPolicy) === 50);
  check('9. role daily limit for admin is 100', getRoleDailyLimit('admin', defaultPolicy) === 100);

  // 10: mocked anonymous preview allowed when policy disabled.
  const mockedAnonymousResult = evaluateSimilarityExecutionGuard(buildMockedAnonymousSimilarityGuardRequest(), {
    policy: defaultPolicy,
  });
  check(
    '10. mocked anonymous request is allowed when policy disabled and anonymous preview allowed',
    mockedAnonymousResult.ok === true && mockedAnonymousResult.status === 'allowed',
  );

  // 11: anonymous kis-normalized request is not allowed.
  const anonymousKisResult = evaluateSimilarityExecutionGuard(
    { ...buildMockedAnonymousSimilarityGuardRequest(), source: 'kis-normalized' },
    { policy: defaultPolicy },
  );
  check(
    '11. anonymous kis-normalized request returns feature_disabled or auth_required, never allowed',
    anonymousKisResult.ok === false &&
      (anonymousKisResult.status === 'feature_disabled' || anonymousKisResult.status === 'auth_required'),
  );

  // 12: authenticated kis-normalized request with disabled policy returns feature_disabled.
  const disabledAuthenticatedResult = evaluateSimilarityExecutionGuard(buildMockedAuthenticatedSimilarityGuardRequest(), {
    policy: defaultPolicy,
  });
  check(
    '12. authenticated kis-normalized request with disabled policy returns feature_disabled',
    disabledAuthenticatedResult.status === 'feature_disabled',
  );

  // 13: authenticated kis-normalized request with enabled policy and missing usage returns not_configured.
  const enabledPolicy = { ...buildDefaultSimilarityExecutionGuardPolicy(), enabled: true };
  const notConfiguredResult = evaluateSimilarityExecutionGuard(buildMockedAuthenticatedSimilarityGuardRequest(), {
    policy: enabledPolicy,
  });
  check(
    '13. authenticated request with enabled policy and missing usage returns not_configured',
    notConfiguredResult.status === 'not_configured',
  );

  // 14: authenticated request with usage remaining > 0 returns allowed.
  const authenticatedLimit = getRoleDailyLimit('authenticated', enabledPolicy);
  const authenticatedUsageOk = buildUsageSnapshot('daily', 1, authenticatedLimit);
  const allowedResult = evaluateSimilarityExecutionGuard(buildMockedAuthenticatedSimilarityGuardRequest(), {
    policy: enabledPolicy,
    usage: authenticatedUsageOk,
  });
  check(
    '14. authenticated request with usage remaining > 0 returns allowed',
    allowedResult.ok === true && allowedResult.status === 'allowed',
  );

  // 15: authenticated request with used >= limit returns usage_limited.
  const authenticatedUsageLimited = buildUsageSnapshot('daily', authenticatedLimit, authenticatedLimit);
  const usageLimitedResult = evaluateSimilarityExecutionGuard(buildMockedAuthenticatedSimilarityGuardRequest(), {
    policy: enabledPolicy,
    usage: authenticatedUsageLimited,
  });
  check(
    '15. authenticated request with used >= limit returns usage_limited',
    usageLimitedResult.ok === false && usageLimitedResult.status === 'usage_limited',
  );

  // 16: beta request uses the beta daily limit.
  const betaLimit = getRoleDailyLimit('beta', enabledPolicy);
  const betaUsage = buildUsageSnapshot('daily', 2, betaLimit);
  const betaResult = evaluateSimilarityExecutionGuard(buildMockedBetaSimilarityGuardRequest(), {
    policy: enabledPolicy,
    usage: betaUsage,
  });
  check(
    '16. beta request uses beta limit',
    betaLimit === 10 && betaResult.status === 'allowed' && betaResult.usage.limit === 10,
  );

  // 17: owner-local request uses the owner daily limit and is allowed for the owner role.
  const ownerLimit = getRoleDailyLimit('owner', enabledPolicy);
  const ownerUsage = buildUsageSnapshot('daily', 5, ownerLimit);
  const ownerResult = evaluateSimilarityExecutionGuard(buildMockedOwnerSimilarityGuardRequest(), {
    policy: enabledPolicy,
    usage: ownerUsage,
  });
  check(
    '17. owner request uses owner limit',
    ownerLimit === 50 && ownerResult.status === 'allowed' && ownerResult.usage.limit === 50,
  );

  // 18: owner-local request is not allowed for anonymous role.
  const ownerLocalAnonymousResult = evaluateSimilarityExecutionGuard(
    { ...buildMockedOwnerSimilarityGuardRequest(), role: 'anonymous', authState: 'missing', userId: undefined },
    { policy: enabledPolicy },
  );
  check(
    '18. owner-local request is not allowed for anonymous role',
    ownerLocalAnonymousResult.ok === false && ownerLocalAnonymousResult.status === 'auth_required',
  );

  // 19: owner-local request is allowed for admin role only with enabled policy and valid usage.
  const adminLimit = getRoleDailyLimit('admin', enabledPolicy);
  const adminUsage = buildUsageSnapshot('daily', 0, adminLimit);
  const adminResult = evaluateSimilarityExecutionGuard(
    { ...buildMockedOwnerSimilarityGuardRequest(), role: 'admin', authState: 'admin', userId: 'mock-user-admin' },
    { policy: enabledPolicy, usage: adminUsage },
  );
  check(
    '19. owner-local request can be allowed only for owner/admin with enabled policy and valid usage',
    adminLimit === 100 && adminResult.ok === true && adminResult.status === 'allowed',
  );

  // 20-23: invalid request field validation.
  const invalidSymbolResult = evaluateSimilarityExecutionGuard(buildMockedInvalidSimilarityGuardRequest(), {
    policy: enabledPolicy,
  });
  check('20. invalid symbol returns blocked', invalidSymbolResult.status === 'blocked');

  const invalidMarketResult = evaluateSimilarityExecutionGuard(
    { ...buildMockedAuthenticatedSimilarityGuardRequest(), market: 'US' },
    { policy: enabledPolicy },
  );
  check('21. invalid market returns blocked', invalidMarketResult.status === 'blocked');

  const invalidAssetTypeResult = evaluateSimilarityExecutionGuard(
    { ...buildMockedAuthenticatedSimilarityGuardRequest(), assetType: 'bond' },
    { policy: enabledPolicy },
  );
  check('22. invalid assetType returns blocked', invalidAssetTypeResult.status === 'blocked');

  const invalidPurposeResult = evaluateSimilarityExecutionGuard(
    { ...buildMockedAuthenticatedSimilarityGuardRequest(), purpose: 'other' },
    { policy: enabledPolicy },
  );
  check('23. invalid purpose returns blocked', invalidPurposeResult.status === 'blocked');

  // 24-29: cross-cutting safety checks across every collected result.
  const allResults = [
    mockedAnonymousResult,
    anonymousKisResult,
    disabledAuthenticatedResult,
    notConfiguredResult,
    allowedResult,
    usageLimitedResult,
    betaResult,
    ownerResult,
    ownerLocalAnonymousResult,
    adminResult,
    invalidSymbolResult,
    invalidMarketResult,
    invalidAssetTypeResult,
    invalidPurposeResult,
  ];
  check(
    '24. result safeMessage exists for every path',
    allResults.every((result) => typeof result.safeMessage === 'string' && result.safeMessage.length > 0),
  );

  const serializedResults = JSON.stringify(allResults);
  check('25. no output contains token-like values', !TOKEN_LIKE_PATTERN.test(serializedResults));
  check('26. no output contains raw auth provider payload', !AUTH_PROVIDER_PAYLOAD_PATTERN.test(serializedResults));
  check('27. no output contains KIS credential names', !KIS_CREDENTIAL_PATTERN.test(serializedResults));
  check(
    '28. no output contains account/trading/order/balance fields',
    !ACCOUNT_TRADING_PATTERN.test(serializedResults),
  );
  check('29. no result contains NaN/Infinity', !hasNonFinite(allResults));

  // 30: guard evaluation never touches process.env.
  const originalEnv = process.env;
  let envAccessed = false;
  process.env = new Proxy(originalEnv, {
    get(target, prop) {
      envAccessed = true;
      return target[prop];
    },
  });
  try {
    evaluateSimilarityExecutionGuard(buildMockedAuthenticatedSimilarityGuardRequest(), {
      policy: enabledPolicy,
      usage: authenticatedUsageOk,
    });
    buildDefaultSimilarityExecutionGuardPolicy();
    getRoleDailyLimit('owner', enabledPolicy);
  } finally {
    process.env = originalEnv;
  }
  check('30. no env access occurs during guard evaluation', envAccessed === false);

  console.log(`\nPhase 3EY-C smoke summary: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) {
    console.log('Failed checks:');
    for (const label of failures) console.log(` - ${label}`);
    process.exitCode = 1;
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
