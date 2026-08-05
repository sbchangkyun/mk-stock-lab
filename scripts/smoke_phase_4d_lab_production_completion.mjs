/**
 * Phase 4D deterministic smoke runner.
 *
 * The real executable/data logic Phase 4D introduces (src/lib/exportCardImage.ts's
 * exportStatusMessage helper, and the labReturnMatrices.json fixture it renders from) is bundled
 * from the test source (scripts/phase_4d_lab_production_completion_testsrc.ts) with the project's
 * own esbuild into a temp ESM module and run, following the same pattern as the other phase smoke
 * runners. No network, no Supabase, no env reads.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'lab-production-completion-4d-'));
const outFile = path.join(outDir, 'tests.mjs');

try {
  await build({
    entryPoints: ['scripts/phase_4d_lab_production_completion_testsrc.ts'],
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
