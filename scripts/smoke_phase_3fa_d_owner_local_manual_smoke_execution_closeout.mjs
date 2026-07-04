#!/usr/bin/env node
/**
 * Phase 3FA-D committed runtime smoke script for the owner-local manual smoke execution closeout.
 *
 * This exercises the ACTUAL TypeScript closeout module code (not a re-implementation) using Node's
 * native TypeScript type-stripping support. Because the repository's import convention is
 * extensionless relative imports, and Node's ESM loader requires an explicit extension to resolve
 * a relative specifier, this script copies `src/lib/server/chartSimilarity/**` into an OS temp
 * directory and rewrites only the copies' relative import specifiers to add a `.ts` extension. The
 * committed source files under `src/` are never modified. The temp directory is removed in a
 * `finally` block regardless of outcome.
 *
 * No network, no env read, no dev server, no browser, no dependencies added, no live KIS call, no
 * real auth provider, no route call. Does not import `src/lib/server/providers/kis/**` or
 * `src/lib/chartSimilarity/**`.
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

const TOKEN_LIKE_PATTERN = /(access_token|session_token|refresh_token|bearer\s+[a-z0-9]|sk-[a-z0-9])/i;
const AUTH_PROVIDER_PAYLOAD_PATTERN = /(oauth|id_token|provider_token|auth0|supabase\.auth|jwt)/i;
const KIS_CREDENTIAL_PATTERN = /(appkey|appsecret|kis_app_key|kis_app_secret|kis_access_token)/i;
const ACCOUNT_TRADING_PATTERN = /(account[_-]?no|placeorder|trading[_-]?api|order[_-]?api|balance[_-]?api|kis_account)/i;
const USER_STATE_FIELD_PATTERN = /"(userId|role|authState)"/;
const EMAIL_IP_PATTERN = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\b\d{1,3}(\.\d{1,3}){3}\b)/i;
const MARKET_DATA_FIELD_PATTERN = /"(open|high|low|close|volume|ohlc|timestamp|similarityScore|return)"/i;
const SOURCE_LIVE_AUTO_PATTERN = /"source"\s*:\s*"(live|auto)"/;

const tempRoot = mkdtempSync(path.join(tmpdir(), 'mkstocklab-chartsim-3fa-d-'));

let closeoutModule = null;

try {
  const serverSrc = path.join(repoRoot, 'src', 'lib', 'server', 'chartSimilarity');
  const serverDest = path.join(tempRoot, 'lib', 'server', 'chartSimilarity');
  copyDirWithRewrite(serverSrc, serverDest);

  try {
    closeoutModule = await import(pathToFileURL(path.join(serverDest, 'similarityOwnerLocalSmokeCloseout.ts')).href);
  } catch (importError) {
    console.log('[IMPLEMENTATION NOTE] Node could not execute the copied TypeScript closeout sources via native type stripping.');
    console.log(String(importError && importError.stack ? importError.stack : importError));
    console.log('\nSmoke verification could not run. This is reported as a failure, not skipped silently.');
    process.exitCode = 1;
    throw importError;
  }

  const {
    buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy,
    buildOwnerLocalSmokeCloseoutChecks,
    buildOwnerLocalSmokeCloseoutReport,
    buildSimilarityOwnerLocalSmokeCloseoutResult,
    isOwnerLocalManualSmokeExecutionClosed,
    isOwnerLocalManualSmokeReadyForSeparateApproval,
  } = closeoutModule;

  // 1: default policy is disabled.
  const defaultPolicy = buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy();
  check('1. default policy has enabled false', defaultPolicy.enabled === false);

  // 2: default policy has liveSmokeExecuted false.
  check('2. default policy has liveSmokeExecuted false', defaultPolicy.liveSmokeExecuted === false);

  // 3-10: default policy execution permissions are all false.
  check('3. default policy disallows live KIS call', defaultPolicy.allowLiveKisCall === false);
  check('4. default policy disallows live similarity execution', defaultPolicy.allowLiveSimilarityExecution === false);
  check('5. default policy disallows route success', defaultPolicy.allowRouteSuccess === false);
  check('6. default policy disallows route call', defaultPolicy.allowRouteCall === false);
  check('7. default policy disallows env read', defaultPolicy.allowEnvRead === false);
  check('8. default policy disallows market data in report', defaultPolicy.allowMarketDataInReport === false);
  check('9. default policy disallows raw provider payload', defaultPolicy.allowRawProviderPayload === false);
  check('10. default policy disallows credential echo', defaultPolicy.allowCredentialEcho === false);

  // 11: default policy requires owner approval and separate manual smoke command.
  check(
    '11. default policy requires owner approval for next phase and a separate manual smoke command',
    defaultPolicy.requireOwnerApprovalForNextPhase === true && defaultPolicy.requireManualSmokeSeparateCommand === true,
  );

  // 12: closeout closed helper is true for default policy.
  check('12. isOwnerLocalManualSmokeExecutionClosed(defaultPolicy) is true', isOwnerLocalManualSmokeExecutionClosed(defaultPolicy) === true);

  // 13: closeout ready-for-separate-approval helper is true for default policy.
  check(
    '13. isOwnerLocalManualSmokeReadyForSeparateApproval(defaultPolicy) is true',
    isOwnerLocalManualSmokeReadyForSeparateApproval(defaultPolicy) === true,
  );

  // 14-16: closeout checks cover the required categories.
  const closeoutChecks = buildOwnerLocalSmokeCloseoutChecks();
  check('14. closeout checks include at least 12 entries', closeoutChecks.length >= 12);
  check(
    '15. closeout checks include an owner-approval-required check that is blocked',
    closeoutChecks.some((entry) => entry.name === 'owner_approval_required_for_next_phase' && entry.status === 'blocked'),
  );
  check(
    '16. closeout checks include a manual-smoke-requires-separate-command check that is blocked',
    closeoutChecks.some((entry) => entry.name === 'manual_smoke_requires_separate_command' && entry.status === 'blocked'),
  );

  // 17: no closeout check reports a live "pass" success for a live-execution-dependent step.
  check(
    '17. live-execution-dependent closeout checks report not_run, not pass',
    closeoutChecks
      .filter((entry) => entry.name.includes('live_') || entry.name.includes('route_call'))
      .every((entry) => entry.status === 'not_run'),
  );

  // 18-24: closeout report field values.
  const closeoutReport = buildOwnerLocalSmokeCloseoutReport();
  check('18. closeout report status is closed_without_execution', closeoutReport.status === 'closed_without_execution');
  check('19. closeout report smokeExecuted is false', closeoutReport.smokeExecuted === false);
  check('20. closeout report harnessStatus is disabled', closeoutReport.harnessStatus === 'disabled');
  check('21. closeout report routeStatus is feature_disabled', closeoutReport.routeStatus === 'feature_disabled');
  check('22. closeout report source is owner-local', closeoutReport.source === 'owner-local');
  check('23. closeout report nextAllowedPhase is 3FA-D-MANUAL-RUN', closeoutReport.nextAllowedPhase === '3FA-D-MANUAL-RUN');
  check('24. closeout report includes checks from the checks builder', Array.isArray(closeoutReport.checks) && closeoutReport.checks.length >= 12);

  // 25-27: closeout result shape under default policy.
  const closeoutResult = buildSimilarityOwnerLocalSmokeCloseoutResult(defaultPolicy);
  check('25. closeout result status is closed_without_execution or blocked', ['closed_without_execution', 'blocked'].includes(closeoutResult.status));
  check('26. closeout result never returns a live success top-level status', !['pass', 'success', 'live'].includes(closeoutResult.status));
  check('27. closeout result report.smokeExecuted is false', closeoutResult.report.smokeExecuted === false);

  // 28: default-argument invocation behaves identically to explicit default policy.
  const defaultInvocationResult = buildSimilarityOwnerLocalSmokeCloseoutResult();
  check(
    '28. buildSimilarityOwnerLocalSmokeCloseoutResult() with no argument returns closed_without_execution or blocked',
    ['closed_without_execution', 'blocked'].includes(defaultInvocationResult.status),
  );

  // 29-36: serialized output must never contain prohibited fields or values.
  const serialized = JSON.stringify({ defaultPolicy, closeoutChecks, closeoutReport, closeoutResult, defaultInvocationResult });
  check('29. no output contains user state fields (userId/role/authState)', !USER_STATE_FIELD_PATTERN.test(serialized));
  check('30. no output contains token-like values', !TOKEN_LIKE_PATTERN.test(serialized));
  check('31. no output contains raw auth provider payload', !AUTH_PROVIDER_PAYLOAD_PATTERN.test(serialized));
  check('32. no output contains KIS credential names', !KIS_CREDENTIAL_PATTERN.test(serialized));
  check('33. no output contains account/trading/order/balance fields', !ACCOUNT_TRADING_PATTERN.test(serialized));
  check('34. no output contains email or IP address values', !EMAIL_IP_PATTERN.test(serialized));
  check('35. no output contains market data fields (OHLC/volume/timestamp/similarityScore/return)', !MARKET_DATA_FIELD_PATTERN.test(serialized));
  check('36. no output contains source=live or source=auto', !SOURCE_LIVE_AUTO_PATTERN.test(serialized));

  // 37: the closeout never performs a network call (global fetch remains untouched/unused).
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = (...args) => {
    fetchCalled = true;
    throw new Error('Network access is forbidden in this smoke script.');
  };
  try {
    buildSimilarityOwnerLocalSmokeCloseoutResult(defaultPolicy);
  } finally {
    globalThis.fetch = originalFetch;
  }
  check('37. no network call occurs during closeout execution', fetchCalled === false);

  // 38: the closeout never reads process.env.
  const originalEnv = process.env;
  let envAccessed = false;
  process.env = new Proxy(originalEnv, {
    get(target, prop) {
      envAccessed = true;
      return target[prop];
    },
  });
  try {
    buildDefaultSimilarityOwnerLocalSmokeCloseoutPolicy();
    buildOwnerLocalSmokeCloseoutChecks();
    buildOwnerLocalSmokeCloseoutReport();
    buildSimilarityOwnerLocalSmokeCloseoutResult();
    isOwnerLocalManualSmokeExecutionClosed(defaultPolicy);
    isOwnerLocalManualSmokeReadyForSeparateApproval(defaultPolicy);
  } finally {
    process.env = originalEnv;
  }
  check('38. no env access occurs during closeout execution', envAccessed === false);

  console.log(`\nPhase 3FA-D smoke summary: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) {
    console.log('Failed checks:');
    for (const label of failures) console.log(` - ${label}`);
    process.exitCode = 1;
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
