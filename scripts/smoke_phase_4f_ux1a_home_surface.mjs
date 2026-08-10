import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'phase-4f-ux1a-'));

const ENTRIES = [
  { entry: 'scripts/phase_4f_ux1a_home_surface_guard_testsrc.ts', outfile: 'home-surface-guard.mjs' },
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
