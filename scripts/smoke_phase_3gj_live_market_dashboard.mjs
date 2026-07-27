/**
 * Phase 3GJ deterministic smoke runner.
 *
 * The live market dashboard modules are TypeScript with extensionless imports, so this runner bundles
 * the TS test source (scripts/market_dashboard_testsrc.ts) with the project's own esbuild into a temp
 * ESM module and runs it. No network, no Supabase, no env reads.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'market-dashboard-3gj-'));
const outFile = path.join(outDir, 'tests.mjs');

try {
  await build({
    entryPoints: ['scripts/market_dashboard_testsrc.ts'],
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
