/**
 * Phase 4F (F-MED-01) deterministic smoke runner -- Portfolio fetch/loading UX dedup fix.
 *
 * The test source is TypeScript with an extensionless import, so this runner bundles it with the
 * project's own esbuild into a temp ESM module and runs it. No network, no Supabase, no DOM, no env
 * mutation survives the run. Mirrors the existing scripts/smoke_phase_4f_hf1_functional_high.mjs
 * pattern.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'phase-4f-portfolio-load-lifecycle-'));

const ENTRIES = [
  { entry: 'scripts/phase_4f_portfolio_load_lifecycle_testsrc.ts', outfile: 'portfolio-load-lifecycle.mjs' },
];

let exitCode = 0;

try {
  for (const { entry, outfile } of ENTRIES) {
    const outFile = path.join(outDir, outfile);
    await build({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      outfile: outFile,
      logLevel: 'warning',
    });
    const mod = await import(pathToFileURL(outFile).href);
    const code = await mod.runAll();
    if (code !== 0) exitCode = 1;
  }
  process.exitCode = exitCode;
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
