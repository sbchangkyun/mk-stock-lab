/**
 * Phase 4A deterministic smoke runner.
 *
 * The one piece of real executable logic Phase 4A introduces is TypeScript
 * (src/lib/shell/navActiveLink.ts), so this runner bundles the test source
 * (scripts/phase_4a_home_common_shell_testsrc.ts) with the project's own esbuild into a temp ESM
 * module and runs it, following the same pattern as the other phase smoke runners. No network, no
 * Supabase, no env reads.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'home-common-shell-4a-'));
const outFile = path.join(outDir, 'tests.mjs');

try {
  await build({
    entryPoints: ['scripts/phase_4a_home_common_shell_testsrc.ts'],
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
