/**
 * Phase 3GI deterministic smoke runner.
 *
 * The user-retention validation contract is TypeScript with extensionless imports, so this runner
 * bundles the TS test source (scripts/phase_3gi_user_retention_persistence_testsrc.ts) with the
 * project's own esbuild into a temp ESM module and runs it. No network, no Supabase, no env reads.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'user-retention-3gi-'));
const outFile = path.join(outDir, 'tests.mjs');

try {
  await build({
    entryPoints: ['scripts/phase_3gi_user_retention_persistence_testsrc.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile: outFile,
    logLevel: 'warning',
  });
  const mod = await import(pathToFileURL(outFile).href);
  const code = await mod.runAll();
  process.exitCode = code;
} catch (error) {
  console.error('SMOKE RUNNER ERROR ::', error && error.message ? error.message : error);
  process.exitCode = 1;
} finally {
  try {
    rmSync(outDir, { recursive: true, force: true });
  } catch {
    /* ignore temp cleanup */
  }
}
