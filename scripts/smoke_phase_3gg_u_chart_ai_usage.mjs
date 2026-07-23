/**
 * Phase 3GG-U chart AI usage guard smoke runner. Bundles the TS usage test with esbuild and runs it.
 * Uses a fake recording client (no network, no Supabase, no real user data).
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'chart-ai-usage-'));
const outFile = path.join(outDir, 'usage.mjs');

try {
  await build({
    entryPoints: ['scripts/chart_ai_usage_testsrc.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile: outFile,
    // Bundle the Supabase SDK in (the fake client factory + isConfigured=false paths mean createClient
    // is never invoked, so no network/env is used); this keeps the temp bundle self-contained. Node
    // builtins stay external.
    packages: undefined,
    logLevel: 'warning',
  });
  const mod = await import(pathToFileURL(outFile).href);
  process.exitCode = await mod.runAll();
} catch (error) {
  console.error('CHART-AI-USAGE SMOKE RUNNER ERROR ::', error && error.message ? error.message : error);
  process.exitCode = 1;
} finally {
  try {
    rmSync(outDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}
