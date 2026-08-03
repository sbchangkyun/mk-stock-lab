/**
 * Phase 3GM deterministic smoke runner.
 *
 * The admin operations modules are TypeScript with extensionless imports, so this runner bundles
 * the test source (scripts/admin_operations_testsrc.ts) with the project's own esbuild into a temp
 * ESM module and runs it. No network, no real Supabase client, no real KIS client -- every
 * dependency exercised is an injected fake (mirrors scripts/smoke_phase_3gl_home_live_data.mjs).
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'admin-operations-3gm-'));
const outFile = path.join(outDir, 'tests.mjs');

try {
  await build({
    entryPoints: ['scripts/admin_operations_testsrc.ts'],
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
