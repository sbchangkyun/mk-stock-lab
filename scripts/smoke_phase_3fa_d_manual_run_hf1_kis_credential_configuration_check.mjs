#!/usr/bin/env node
/**
 * Phase 3FA-D-MANUAL-RUN-HF1 owner-local KIS credential configuration check smoke script.
 *
 * This script is the ONLY place in this phase permitted to read `process.env`. It reads only
 * presence (a boolean: is the key set to a non-empty string?), never the actual value, never a
 * value length, never a value prefix/suffix, and never a value hash. It never reads `.env`,
 * `.env.local`, or any `.env*` file, never imports `dotenv`, never calls KIS, and never calls the
 * `/api/chart-ai/similarity` route.
 *
 * It prints only a redacted JSON readiness report and exits 0 for any safely-redacted result
 * (configured, partial, or missing). It exits non-zero only if the no-secret-echo redaction
 * assertion fails, which would indicate a defect in this script or the underlying module, not a
 * missing credential.
 */

import { build } from 'esbuild';

const root = process.cwd();

// Presence-only check, mirroring the established `defaultHasEnvValue` pattern used by the
// existing owner-local KIS OHLC client. Only a boolean is ever produced here — the actual value is
// never read into a variable that is logged, returned, or persisted.
const hasEnvValue = (name) => {
  const raw = process.env[name];
  return typeof raw === 'string' && raw.trim().length > 0;
};

const loadCredentialCheckModule = async () => {
  const entryContents = [
    "export {",
    "  buildDefaultSimilarityOwnerLocalCredentialCheckPolicy,",
    "  buildOwnerLocalCredentialKeyRequirements,",
    "  buildOwnerLocalCredentialCheckReport,",
    "  buildOwnerLocalCredentialCheckResult,",
    "  assertCredentialCheckReportHasNoSecretEcho,",
    "} from './src/lib/server/chartSimilarity/similarityOwnerLocalCredentialCheck.ts';",
  ].join('\n');

  const bundle = await build({
    stdin: {
      contents: entryContents,
      resolveDir: root,
      sourcefile: 'credential-check-entry.ts',
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

const main = async () => {
  const mod = await loadCredentialCheckModule();

  const policy = mod.buildDefaultSimilarityOwnerLocalCredentialCheckPolicy();
  const requirements = mod.buildOwnerLocalCredentialKeyRequirements();

  const presence = {};
  for (const requirement of requirements) {
    presence[requirement.name] = hasEnvValue(requirement.name);
  }

  const report = mod.buildOwnerLocalCredentialCheckReport(requirements, presence);
  const result = mod.buildOwnerLocalCredentialCheckResult(policy, report);

  const serialized = JSON.stringify(result, null, 2);

  if (!mod.assertCredentialCheckReportHasNoSecretEcho(serialized)) {
    console.error(
      JSON.stringify(
        {
          status: 'blocked',
          decision: 'blocked_by_no_secret_echo_policy',
          safeMessage:
            'Redaction assertion failed; refusing to print a report that may contain secret echo.',
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.log(serialized);
  process.exitCode = 0;
};

main();
