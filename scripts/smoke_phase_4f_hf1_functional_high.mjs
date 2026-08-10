/**
 * Phase 4F-HF1 deterministic smoke runner (CHART-05 + PORT-10).
 *
 * Both HF1 test sources are TypeScript with extensionless imports, so this runner bundles each with
 * the project's own esbuild into a temp ESM module and runs it. No network, no Supabase, no env
 * mutation survives the run (each test source restores whatever it changed). Mirrors the existing
 * scripts/smoke_phase_3gj_live_market_dashboard.mjs pattern.
 */

import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const outDir = mkdtempSync(path.join(tmpdir(), 'phase-4f-hf1-'));

const ENTRIES = [
  { entry: 'scripts/phase_4f_hf1_chart_ai_timeframe_testsrc.ts', outfile: 'chart-ai-timeframe.mjs' },
  { entry: 'scripts/phase_4f_hf1_portfolio_valuation_security_testsrc.ts', outfile: 'portfolio-valuation-security.mjs' },
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
