/**
 * Static contract for the Phase 3DZ FX provider-selection plan.
 * No network, browser, Vercel, credentials, Supabase, or external API calls.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3DZ static checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  plan: 'docs/planning/phase_3dz_fx_provider_selection_real_adapter_plan_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  checker: 'scripts/check_phase_3dz_fx_provider_selection_plan_static_contract.mjs',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const plan = read(paths.plan);
const changelog = read(paths.changelog);
const packageJson = read(paths.package);
let passed = 0;
let failed = 0;
const failures = [];

const check = (label, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`  [PASS] ${label}\n`);
  } else {
    failed += 1;
    failures.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
};

process.stdout.write('=== Phase 3DZ FX Provider Selection Plan Static Contract ===\n\n');

process.stdout.write('Files and package command:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package command exists',
  packageJson.includes('"check:phase-3dz-fx-provider-plan"') &&
  packageJson.includes('check_phase_3dz_fx_provider_selection_plan_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Status and phase continuity:\n');
check('Status says plan completed with no runtime changes',
  /FX provider selection and real adapter plan completed; no runtime changes/i.test(plan));
for (const phase of ['Phase 3DY', 'Phase 3DX', 'Phase 3DW']) {
  check(`Plan references ${phase}`, plan.includes(phase));
}
check('Plan references fxMockAdapter.ts', plan.includes('fxMockAdapter.ts'));
check('Plan states provider is not selected', /real FX provider is not selected/i.test(plan));
check('Plan states US quote endpoint is not implemented', /KIS US quote endpoint is not implemented/i.test(plan));
check('Plan keeps public source=live disabled', plan.includes('Public `source=live` remains disabled'));
check('Plan keeps source=auto deferred', plan.includes('`source=auto` remains deferred'));
check('Plan states no deployment', plan.includes('No deployment was performed'));
check('Plan states no push', plan.includes('No push was performed'));
process.stdout.write('\n');

process.stdout.write('Required sections:\n');
for (const heading of [
  '## 3. Current FX Integration Baseline',
  '## 4. Provider Selection Criteria',
  '## 5. Provider Candidate Categories',
  '## 6. Recommended MVP FX Scope',
  '## 7. Provider-Neutral FX Interface',
  '## 8. Freshness and Stale Policy',
  '## 9. Error Classification',
  '## 10. Caching and Rate-Limit Policy',
  '## 11. Integration with Portfolio Valuation',
  '## 12. Security and Secret Handling',
  '## 13. Owner Decisions Required',
  '## 14. Recommended Next Implementation Phase',
  '## 15. Validation Plan for Phase 3EA',
  '## 16. Final Recommendation',
]) {
  check(`Plan contains ${heading.replace(/^## \d+\. /, '')}`, plan.includes(heading));
}
process.stdout.write('\n');

process.stdout.write('FX baseline:\n');
for (const marker of [
  "fixed synthetic USD/KRW rate of `1350`",
  'Supports USD/KRW directly and KRW/USD by inversion',
  'KRW/KRW and USD/USD return `1`',
  "`source: 'mocked'`",
  "`staleState: 'sample'`",
  'buildPortfolioValuationFromQuotesWithFx()',
  'not wired into this route',
  'not public production behavior',
]) {
  check(`Baseline includes ${marker}`, plan.includes(marker));
}
process.stdout.write('\n');

process.stdout.write('Provider criteria matrix:\n');
check('Criteria matrix has required columns',
  plan.includes('| Criteria | Why it matters | Required for MVP? | Owner decision needed? |'));
for (const criterion of [
  'USD/KRW support', 'KRW/USD support', 'Timestamp availability', 'Freshness granularity',
  'Historical rate support', 'Free vs paid plan', 'Rate limits', 'Commercial usage allowance',
  'Authentication model', 'API reliability/SLA', 'Provider terms', 'Fallback/stale-data permission',
  'Response schema simplicity', 'Server-side use suitability', 'TypeScript integration complexity',
  'No raw provider payload exposure', 'No client-side key exposure',
]) {
  check(`Criteria include ${criterion}`, plan.includes(`| ${criterion} |`));
}
process.stdout.write('\n');

process.stdout.write('Provider categories:\n');
for (const category of [
  '1. Commercial FX API provider',
  '2. Financial market data API provider',
  '3. Bank or central-bank reference-rate source',
  '4. Existing broker/market-data provider, if FX endpoint exists',
  '5. Manual owner-supplied FX source for early testing',
]) {
  check(`Candidate category includes ${category}`, plan.includes(`| ${category} |`));
}
for (const column of ['Strengths', 'Risks', 'Likely cost profile', 'Expected freshness', 'Expected authentication', 'Owner preview', 'Eventual public production']) {
  check(`Category evaluation includes ${column}`, plan.includes(column));
}
check('Plan does not select a provider', plan.includes('No provider is selected by this plan'));
check('Provider facts require owner confirmation', /owner must confirm them directly/i.test(plan));
process.stdout.write('\n');

process.stdout.write('MVP and interface:\n');
check('MVP recommends USD/KRW and KRW/USD',
  plan.includes('only USD/KRW and KRW/USD'));
check('MVP includes identity pairs', plan.includes('KRW/KRW and USD/USD'));
for (const marker of [
  'type FxRateRequest', 'baseCurrency:', 'quoteCurrency:', 'asOf?: string',
  'type FxRateSnapshot', 'rate: number | null', 'asOf: string | null',
  "'mocked' | 'live' | 'cache' | 'unavailable'",
  "'fresh' | 'stale-but-usable' | 'sample' | 'unavailable'",
  'errorCode?: FxErrorCode', 'providerCode?: string',
]) {
  check(`Interface includes ${marker}`, plan.includes(marker));
}
check('Interface defines null handling', plan.includes('`rate` is `null`'));
check('Interface defines timestamp handling', plan.includes('valid normalized UTC timestamp'));
check('Interface strips provider metadata', plan.includes('Provider-specific metadata is stripped'));
process.stdout.write('\n');

process.stdout.write('Freshness and error policy:\n');
for (const marker of [
  '15 minutes', '24 hours', '72 hours', 'Market closed behavior',
  'timestamp is mandatory', 'older than the stale limit',
  'KIS quote timestamp and FX timestamp differ', 'must not claim “real-time”',
]) {
  check(`Freshness policy includes ${marker}`, plan.includes(marker));
}
for (const code of [
  'FX_CONFIG_MISSING', 'FX_AUTH_REQUIRED', 'FX_PROVIDER_RATE_LIMITED',
  'FX_PROVIDER_UNAVAILABLE', 'FX_SYMBOL_UNSUPPORTED', 'FX_RESPONSE_UNEXPECTED',
  'FX_STALE_BEYOND_LIMIT', 'FX_UNKNOWN_ERROR',
]) {
  check(`Error policy includes ${code}`, plan.includes(`\`${code}\``));
}
check('Error table classifies retryability', plan.includes('| Retryable? |'));
check('Error policy identifies owner action', plan.includes('| Owner action |'));
check('Raw provider errors are blocked publicly', plan.includes('blocked from public output'));
process.stdout.write('\n');

process.stdout.write('Cache, valuation, and security:\n');
for (const marker of [
  'in-memory FX cache', 'optional persistent cache', 'fx:{provider}:{base}:{quote}:{asOfBucket}',
  'Coalesce concurrent requests', 'provider terms permit caching',
  'Do not silently fall back to mocked', 'Public production remains blocked',
]) {
  check(`Cache policy includes ${marker}`, plan.includes(marker));
}
for (const marker of [
  'buildPortfolioValuationFromQuotesWithFx()', '`source=fixture` as the default',
  'owner preview path first', 'affected row market value', 'Portfolio totals and KPI summaries',
  'UI freshness badges', 'must not appear in the Portfolio API response',
]) {
  check(`Valuation integration includes ${marker}`, plan.includes(marker));
}
for (const marker of [
  'server-only', 'never enter client bundles', 'No raw provider payload',
  'does not read `.env`', 'must not contain secret values',
  'Provider credentials must not be committed', 'explicit owner approval',
  'must not depend on Supabase Storage or database rows',
]) {
  check(`Security policy includes ${marker}`, plan.includes(marker));
}
process.stdout.write('\n');

process.stdout.write('Owner decisions and next phase:\n');
for (let number = 1; number <= 11; number += 1) {
  check(`Owner decision ${number} exists`, new RegExp(`^${number}\\. `, 'm').test(plan));
}
check('Plan recommends Phase 3EA', plan.includes('Phase 3EA - Real FX Adapter Mocked-First Implementation'));
check('Plan provides unresolved-provider fallback phase', plan.includes('Phase 3DZ-HF1 - Owner FX Provider Decision Closeout'));
check('Final recommendation is exact',
  plan.includes('Proceed to Phase 3EA only after the owner confirms the FX provider category, MVP currency-pair scope, freshness tolerance, and whether a paid provider is acceptable.'));
for (const validation of [
  'Static provider-boundary checker', 'Mocked FX behavioral checker',
  'Portfolio mixed-currency valuation checker', 'Owner-run FX smoke dry-run',
  'No-secret output checker', '`npm run check:portfolio-live-preview-api`',
  '`npm run check:phase-3dx-ui-architecture-plan`', '`npm run check:mobile-baseline`',
  '`npm run guard:production-mobile-geometry`', '`npm run build`', '`git diff --check`',
]) {
  check(`Phase 3EA validation includes ${validation}`, plan.includes(validation));
}
process.stdout.write('\n');

process.stdout.write('Changelog and source boundary:\n');
const phaseSection = changelog.split('## Phase 3DZ - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Planning changelog contains Phase 3DZ', phaseSection.length > 0);
check('Changelog marks provider plan ready', /provider plan ready/i.test(phaseSection));
check('Changelog records MVP scope', phaseSection.includes('USD/KRW and KRW/USD'));
check('Changelog records Phase 3EA decision gate', phaseSection.includes('Phase 3EA'));
check('Changelog records no deployment and no push',
  /\*\*Deployment\*\*:\s*none/i.test(phaseSection) &&
  /\*\*Push\*\*:\s*none/i.test(phaseSection));

let runtimeChanges = [];
try {
  runtimeChanges = execFileSync('git', ['diff', '--name-only', '7d546f6', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
} catch {
  runtimeChanges = ['<git-diff-unavailable>'];
}
check('No runtime source files changed since 7d546f6', runtimeChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
