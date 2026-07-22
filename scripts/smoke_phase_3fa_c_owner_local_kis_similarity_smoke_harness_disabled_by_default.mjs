#!/usr/bin/env node
/**
 * Phase 3FA-C committed runtime smoke script for the disabled-by-default owner-local KIS
 * similarity smoke harness scaffold.
 *
 * This exercises the ACTUAL TypeScript harness module code (not a re-implementation) using Node's
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

const tempRoot = mkdtempSync(path.join(tmpdir(), 'mkstocklab-chartsim-3fa-c-'));

let harnessModule = null;

try {
  const serverSrc = path.join(repoRoot, 'src', 'lib', 'server', 'chartSimilarity');
  const serverDest = path.join(tempRoot, 'lib', 'server', 'chartSimilarity');
  copyDirWithRewrite(serverSrc, serverDest);

  try {
    harnessModule = await import(pathToFileURL(path.join(serverDest, 'similarityOwnerLocalSmokeHarness.ts')).href);
  } catch (importError) {
    console.log('[IMPLEMENTATION NOTE] Node could not execute the copied TypeScript harness sources via native type stripping.');
    console.log(String(importError && importError.stack ? importError.stack : importError));
    console.log('\nSmoke verification could not run. This is reported as a failure, not skipped silently.');
    process.exitCode = 1;
    throw importError;
  }

  const {
    buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy,
    buildOwnerLocalSmokeHarnessSteps,
    buildOwnerLocalSmokeHarnessChecks,
    buildOwnerLocalSmokeHarnessBlockedReport,
    runOwnerLocalSmokeHarnessDisabled,
    isOwnerLocalSmokeHarnessEnabled,
  } = harnessModule;

  // 1: default policy is disabled.
  const defaultPolicy = buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy();
  check('1. default policy has enabled false', defaultPolicy.enabled === false);

  // 2-8: default policy execution permissions are all false, owner-local/manual flags all true.
  check('2. default policy disallows KIS provider call', defaultPolicy.allowKisProviderCall === false);
  check('3. default policy disallows similarity engine run', defaultPolicy.allowSimilarityEngineRun === false);
  check('4. default policy disallows route success', defaultPolicy.allowRouteSuccess === false);
  check('5. default policy disallows market data in report', defaultPolicy.allowMarketDataInReport === false);
  check('6. default policy disallows raw provider payload', defaultPolicy.allowRawProviderPayload === false);
  check('7. default policy disallows env read', defaultPolicy.allowEnvRead === false);
  check('8. default policy disallows credential echo', defaultPolicy.allowCredentialEcho === false);
  check(
    '9. default policy requires owner approval and separate harness enable approval',
    defaultPolicy.requireOwnerApprovalBeforeLiveSmoke === true &&
      defaultPolicy.requireSeparateHarnessEnableApproval === true,
  );
  check(
    '10. default policy is owner-local-only and manual-execution-only',
    defaultPolicy.ownerLocalOnly === true && defaultPolicy.manualExecutionOnly === true,
  );

  // 11: harness enabled helper is false for default policy.
  check('11. isOwnerLocalSmokeHarnessEnabled(defaultPolicy) is false', isOwnerLocalSmokeHarnessEnabled(defaultPolicy) === false);

  // 12: harness enabled helper stays false even with enabled true but permissions still false.
  const partiallyEnabledPolicy = { ...defaultPolicy, enabled: true };
  check(
    '12. isOwnerLocalSmokeHarnessEnabled stays false unless every execution permission is true',
    isOwnerLocalSmokeHarnessEnabled(partiallyEnabledPolicy) === false,
  );

  // 13: harness enabled helper is only true when every required flag is explicitly true.
  const fullyEnabledPolicy = {
    ...defaultPolicy,
    enabled: true,
    allowKisProviderCall: true,
    allowSimilarityEngineRun: true,
    allowRouteSuccess: true,
  };
  check(
    '13. isOwnerLocalSmokeHarnessEnabled is true only when every execution permission is explicitly true',
    isOwnerLocalSmokeHarnessEnabled(fullyEnabledPolicy) === true,
  );

  // 14: ordered steps match the exact required sequence.
  const steps = buildOwnerLocalSmokeHarnessSteps();
  const expectedSteps = [
    'load_smoke_plan',
    'check_harness_policy',
    'verify_route_remains_disabled',
    'verify_redaction_policy',
    'verify_no_live_provider',
    'verify_no_live_engine',
    'build_safe_blocked_report',
  ];
  check('14. harness steps match the exact required ordered sequence', JSON.stringify(steps) === JSON.stringify(expectedSteps));

  // 15: harness checks cover the required categories.
  const checks = buildOwnerLocalSmokeHarnessChecks();
  check('15. harness checks include at least 10 entries', checks.length >= 10);
  check(
    '16. harness checks include a separate-owner-approval-required check that is blocked',
    checks.some((entry) => entry.name === 'separate_owner_approval_required' && entry.status === 'blocked'),
  );
  check(
    '17. all non-approval harness checks report pass',
    checks.filter((entry) => entry.name !== 'separate_owner_approval_required').every((entry) => entry.status === 'pass'),
  );

  // 18-24: blocked report field values.
  const blockedReport = buildOwnerLocalSmokeHarnessBlockedReport();
  check('18. blocked report status is blocked', blockedReport.status === 'blocked');
  check('19. blocked report smokeId is owner-local-kis-similarity-disabled-harness', blockedReport.smokeId === 'owner-local-kis-similarity-disabled-harness');
  check('20. blocked report providerProbe is not_run', blockedReport.providerProbe === 'not_run');
  check('21. blocked report normalizationCheck is not_run', blockedReport.normalizationCheck === 'not_run');
  check('22. blocked report engineContractCheck is not_run', blockedReport.engineContractCheck === 'not_run');
  check('23. blocked report responseRedactionCheck is pass', blockedReport.responseRedactionCheck === 'pass');
  check('24. blocked report source is owner-local', blockedReport.source === 'owner-local');

  // 25-27: disabled harness runner result shape under default policy.
  const disabledResult = runOwnerLocalSmokeHarnessDisabled(defaultPolicy);
  check('25. disabled harness runner returns status disabled or blocked', ['disabled', 'blocked'].includes(disabledResult.status));
  check('26. disabled harness runner never returns a pass/success top-level status', disabledResult.status !== 'pass');
  check(
    '27. disabled harness runner report.status is blocked or not_run',
    ['blocked', 'not_run'].includes(disabledResult.report.status),
  );

  // 28: default-argument invocation behaves identically to explicit default policy.
  const defaultInvocationResult = runOwnerLocalSmokeHarnessDisabled();
  check('28. runOwnerLocalSmokeHarnessDisabled() with no argument returns disabled or blocked', ['disabled', 'blocked'].includes(defaultInvocationResult.status));

  // 29-38: serialized output must never contain prohibited fields or values.
  const serialized = JSON.stringify({ defaultPolicy, checks, blockedReport, disabledResult, defaultInvocationResult });
  check('29. no output contains user state fields (userId/role/authState)', !USER_STATE_FIELD_PATTERN.test(serialized));
  check('30. no output contains token-like values', !TOKEN_LIKE_PATTERN.test(serialized));
  check('31. no output contains raw auth provider payload', !AUTH_PROVIDER_PAYLOAD_PATTERN.test(serialized));
  check('32. no output contains KIS credential names', !KIS_CREDENTIAL_PATTERN.test(serialized));
  check('33. no output contains account/trading/order/balance fields', !ACCOUNT_TRADING_PATTERN.test(serialized));
  check('34. no output contains email or IP address values', !EMAIL_IP_PATTERN.test(serialized));
  check('35. no output contains market data fields (OHLC/volume/timestamp/similarityScore/return)', !MARKET_DATA_FIELD_PATTERN.test(serialized));
  check('36. no output contains source=live or source=auto', !SOURCE_LIVE_AUTO_PATTERN.test(serialized));

  // 37: the harness never performs a network call (global fetch remains untouched/unused).
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = (...args) => {
    fetchCalled = true;
    throw new Error('Network access is forbidden in this smoke script.');
  };
  try {
    runOwnerLocalSmokeHarnessDisabled(defaultPolicy);
  } finally {
    globalThis.fetch = originalFetch;
  }
  check('37. no network call occurs during disabled harness execution', fetchCalled === false);

  // 38: the harness never reads process.env.
  const originalEnv = process.env;
  let envAccessed = false;
  process.env = new Proxy(originalEnv, {
    get(target, prop) {
      envAccessed = true;
      return target[prop];
    },
  });
  try {
    buildDefaultSimilarityOwnerLocalSmokeHarnessPolicy();
    buildOwnerLocalSmokeHarnessSteps();
    buildOwnerLocalSmokeHarnessChecks();
    buildOwnerLocalSmokeHarnessBlockedReport();
    runOwnerLocalSmokeHarnessDisabled();
    isOwnerLocalSmokeHarnessEnabled(defaultPolicy);
  } finally {
    process.env = originalEnv;
  }
  check('38. no env access occurs during disabled harness execution', envAccessed === false);

  console.log(`\nPhase 3FA-C smoke summary: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) {
    console.log('Failed checks:');
    for (const label of failures) console.log(` - ${label}`);
    process.exitCode = 1;
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
