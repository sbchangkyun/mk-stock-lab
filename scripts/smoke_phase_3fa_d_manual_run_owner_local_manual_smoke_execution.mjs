/**
 * Owner-local manual smoke execution script (Phase 3FA-D-MANUAL-RUN).
 *
 * This is the ONLY place in this phase where an owner-approved KIS OHLC call may occur. It
 * refuses to attempt any live provider call unless BOTH an explicit CLI flag
 * (`--owner-approved-kis-call`) and an explicit env flag (`MKSTOCKLAB_OWNER_APPROVED_KIS_CALL=1`)
 * are present. When approval is missing, it never reads KIS credentials and never calls KIS — it
 * prints a safe blocked report and exits 0. When approval is present, it reuses the existing,
 * already-approved owner-local KIS OHLC smoke client (`runOwnerLocalKisOhlcSmoke` in
 * `src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts`) rather than creating a new client. It
 * never prints a raw provider payload, an actual OHLC price/volume/timestamp, a similarity score
 * or derived return, a credential, a token, or an environment value — it prints only the final
 * redacted JSON report, after that report has passed `assertManualRunReportIsRedacted`. It never
 * calls the API route, never starts a dev server or browser, never touches a DB/cache, and never
 * calls an account/trading/order/balance API. It writes no generated report file to disk.
 *
 * Blocked (default) run:
 *   npm run smoke:phase-3fa-d-manual-run-owner-local-manual-smoke-execution
 *
 * Owner-approved run (PowerShell):
 *   $env:MKSTOCKLAB_OWNER_APPROVED_KIS_CALL="1"; npm run smoke:phase-3fa-d-manual-run-owner-local-manual-smoke-execution -- --owner-approved-kis-call
 *
 * Owner-approved run (bash-like shells):
 *   MKSTOCKLAB_OWNER_APPROVED_KIS_CALL=1 npm run smoke:phase-3fa-d-manual-run-owner-local-manual-smoke-execution -- --owner-approved-kis-call
 */

import { build } from 'esbuild';

const root = process.cwd();

const OWNER_APPROVAL_CLI_FLAG = '--owner-approved-kis-call';
const OWNER_APPROVAL_ENV_FLAG = 'MKSTOCKLAB_OWNER_APPROVED_KIS_CALL';

// Fixed, safe owner-local test symbol. This is the same widely-known public ticker already used
// by the existing committed Phase 3ES owner-local OHLC smoke script; it is not sensitive and is
// intentionally never printed by this script (only a generic configuration message is emitted).
const OWNER_LOCAL_TEST_REQUEST = { symbol: '005930', market: 'KR', assetType: 'stock', period: '1m' };

const hasCliApproval = (argv) => argv.includes(OWNER_APPROVAL_CLI_FLAG);

const hasEnvApproval = () => process.env[OWNER_APPROVAL_ENV_FLAG] === '1';

const loadManualRunModule = async () => {
  const entryContents = [
    "export {",
    "  buildDefaultSimilarityOwnerLocalManualRunPolicy,",
    "  buildApprovedSimilarityOwnerLocalManualRunPolicy,",
    "  buildOwnerLocalManualRunBlockedReport,",
    "  buildOwnerLocalManualRunRedactedReport,",
    "  buildOwnerLocalManualRunResult,",
    "  bucketNormalizedBarCount,",
    "  assertManualRunReportIsRedacted,",
    "} from './src/lib/server/chartSimilarity/similarityOwnerLocalManualRun.ts';",
    "export { runOwnerLocalKisOhlcSmoke } from './src/lib/server/providers/kis/kisOwnerLocalOhlcClient.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'manual-run-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    write: false,
    logLevel: 'silent',
  });

  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
};

const printBlockedReport = (mod) => {
  const policy = mod.buildDefaultSimilarityOwnerLocalManualRunPolicy();
  const report = mod.buildOwnerLocalManualRunBlockedReport(policy);
  const result = mod.buildOwnerLocalManualRunResult(policy, report);
  const serialized = JSON.stringify(result, null, 2);

  if (!mod.assertManualRunReportIsRedacted(serialized)) {
    process.stdout.write('Owner-local manual smoke: REDACTION_ASSERTION_FAILED\n');
    return 1;
  }

  process.stdout.write(serialized + '\n');
  // Intentional, safe block (not a smoke failure) when approval is missing — exit 0.
  return 0;
};

const buildProviderProbeFromSmokeResult = (mod, smokeResult) => {
  const probeStatus =
    smokeResult.status === 'PASS' ? 'pass' : smokeResult.status === 'FAIL' ? 'fail' : 'blocked';
  return {
    status: probeStatus,
    provider: 'kis',
    market: 'KR',
    timeframe: 'daily',
    normalizedBarsAvailable: smokeResult.pointCount > 0,
    normalizedBarCountBucket: mod.bucketNormalizedBarCount(smokeResult.pointCount),
    safeMessage: typeof smokeResult.message === 'string'
      ? smokeResult.message
      : 'Owner-local KIS OHLC provider probe completed.',
  };
};

const runApprovedManualSmoke = async (mod) => {
  process.stdout.write('Owner-local test symbol configured.\n');

  const policy = mod.buildApprovedSimilarityOwnerLocalManualRunPolicy();
  const context = { mode: 'owner-local', allowNetwork: true, allowKisLive: true };

  let providerProbe;
  try {
    const smokeResult = await mod.runOwnerLocalKisOhlcSmoke(OWNER_LOCAL_TEST_REQUEST, context);
    providerProbe = buildProviderProbeFromSmokeResult(mod, smokeResult);
  } catch {
    // Never surface a raw error object that could embed request/response detail.
    providerProbe = {
      status: 'fail',
      provider: 'kis',
      market: 'KR',
      timeframe: 'daily',
      normalizedBarsAvailable: false,
      normalizedBarCountBucket: 'unknown',
      safeMessage: 'The provider probe raised an error before completion; no raw error detail is included.',
    };
  }

  // Prefer not invoking the deterministic similarity engine in this first live KIS manual smoke.
  const engineContractCheck = {
    status: 'not_run',
    engineInvoked: false,
    safeMessage: 'The deterministic similarity engine was not invoked in this manual run.',
  };

  const redactionCheck = {
    status: 'pass',
    rawProviderPayloadPrinted: false,
    marketValuesPrinted: false,
    credentialsPrinted: false,
    envValuesPrinted: false,
    safeMessage: 'Only redacted status fields are included in this report.',
  };

  const report = mod.buildOwnerLocalManualRunRedactedReport({
    policy,
    providerProbe,
    engineContractCheck,
    redactionCheck,
  });
  const result = mod.buildOwnerLocalManualRunResult(policy, report);
  const serialized = JSON.stringify(result, null, 2);

  if (!mod.assertManualRunReportIsRedacted(serialized)) {
    process.stdout.write('Owner-local manual smoke: FAILED_REDACTION_CHECK\n');
    process.stdout.write('A prohibited pattern was detected in the report; output was suppressed.\n');
    return 1;
  }

  process.stdout.write(serialized + '\n');
  return result.status === 'failed_redacted' ? 1 : 0;
};

const main = async () => {
  const argv = process.argv.slice(2);
  const mod = await loadManualRunModule();

  if (!hasCliApproval(argv) || !hasEnvApproval()) {
    return printBlockedReport(mod);
  }

  return runApprovedManualSmoke(mod);
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch(() => {
    // Sanitized: never print a raw error object that could embed request/response detail.
    process.stdout.write('Owner-local manual smoke: FAIL\n');
    process.stdout.write('reason: manual-run script error.\n');
    process.exitCode = 1;
  });
