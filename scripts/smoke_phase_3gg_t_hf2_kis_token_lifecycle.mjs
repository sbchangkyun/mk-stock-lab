/**
 * Phase 3GG-T-HF2 deterministic smoke runner.
 *
 * The durable KIS token lifecycle is TypeScript with extensionless imports, so this runner bundles the
 * TS test source (scripts/kis_token_lifecycle_testsrc.ts) with the project's own esbuild into a temp ESM
 * module and runs it. It NEVER calls the real KIS token endpoint (a mock issuer + a faithful in-memory
 * mock of the durable store/lease is used) and never touches Supabase.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'kis-thf2-'));
const outFile = path.join(outDir, 'tests.mjs');

try {
  await build({
    entryPoints: ['scripts/kis_token_lifecycle_testsrc.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile: outFile,
    // Type-only imports of the Supabase-backed store are erased; nothing pulls in the SDK. Keep it
    // external as a belt-and-suspenders so the bundle can never require real credentials.
    external: ['@supabase/supabase-js', 'node:crypto'],
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
