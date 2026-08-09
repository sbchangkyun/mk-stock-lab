import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'phase-4f-hf2-'));

const ENTRIES = [
  { entry: 'scripts/phase_4f_hf2_resolver_testsrc.ts', outfile: 'resolver.mjs' },
  { entry: 'scripts/phase_4f_hf2_legacy_compatibility_testsrc.ts', outfile: 'legacy-compatibility.mjs' },
  { entry: 'scripts/phase_4f_hf2_create_edit_contract_testsrc.ts', outfile: 'create-edit-contract.mjs' },
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
