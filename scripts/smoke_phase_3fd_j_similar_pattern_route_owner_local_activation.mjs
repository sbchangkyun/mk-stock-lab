import { build } from 'esbuild';

const root = process.cwd();
const bundle = await build({
  stdin: {
    contents: "export { runChartAiOwnerLocalSimilarPatternActivationSmoke } from './src/lib/server/chartAiOwnerLocalSimilarPatternActivationSmoke.ts';",
    resolveDir: root,
    sourcefile: 'phase-3fd-j-owner-local-similarity-smoke-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  write: false,
  logLevel: 'silent',
});

const bundledSource = bundle.outputFiles[0].text;
const originalFetch = globalThis.fetch;
let fetchCalled = false;
globalThis.fetch = async () => {
  fetchCalled = true;
  throw new Error('Unexpected network call.');
};

try {
  const mod = await import(`data:text/javascript;base64,${Buffer.from(bundledSource).toString('base64')}`);
  const report = mod.runChartAiOwnerLocalSimilarPatternActivationSmoke();
  if (fetchCalled) report.failures.push('Smoke attempted a network call.');
  if (report.assertionCount < 120) report.failures.push(`Smoke assertion count is below 120: ${report.assertionCount}.`);
  if (/@supabase\/|createClient\s*\(|process\.env|import\.meta\.env|\bfetch\s*\(|kisOhlcProvider|aiProviderClient/.test(bundledSource)) {
    report.failures.push('Bundled activation helper contains a forbidden runtime dependency.');
  }
  if (!report.ok || report.failures.length > 0) {
    console.error(`Phase 3FD-J smoke FAILED: ${report.failures.length}/${report.assertionCount} assertions failed.`);
    for (const failure of report.failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`Phase 3FD-J smoke: PASS (${report.assertionCount}/${report.assertionCount} assertions passed; ${report.fixtureCount} fixtures)`);
} finally {
  globalThis.fetch = originalFetch;
}
