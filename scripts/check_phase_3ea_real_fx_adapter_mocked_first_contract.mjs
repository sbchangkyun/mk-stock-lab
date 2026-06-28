/**
 * Phase 3EA static and deterministic behavioral contract.
 * No network, browser, credentials, Supabase, or external provider calls.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EA checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const paths = {
  types: 'src/lib/server/providers/fxTypes.ts',
  adapter: 'src/lib/server/providers/fxAdapter.ts',
  mock: 'src/lib/server/providers/fxMockAdapter.ts',
  valuation: 'src/lib/server/portfolioValuation.ts',
  route: 'src/pages/api/portfolio/valuation.ts',
  ui: 'src/pages/portfolio.astro',
  result: 'docs/planning/phase_3ea_real_fx_adapter_mocked_first_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  checker: 'scripts/check_phase_3ea_real_fx_adapter_mocked_first_contract.mjs',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, read(value)]));
const packageJson = JSON.parse(source.package || '{}');
const fxSource = [source.types, source.adapter, source.mock].join('\n');
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

process.stdout.write('=== Phase 3EA Real FX Adapter Mocked-First Contract ===\n\n');

process.stdout.write('Files and package command:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package command exists',
  packageJson.scripts?.['check:phase-3ea-real-fx-adapter-mocked-first'] ===
    'node scripts/check_phase_3ea_real_fx_adapter_mocked_first_contract.mjs');
process.stdout.write('\n');

process.stdout.write('Provider-neutral types:\n');
for (const marker of [
  "export type SupportedFxCurrency = 'KRW' | 'USD'",
  'export type FxRateRequest',
  'baseCurrency: SupportedFxCurrency',
  'quoteCurrency: SupportedFxCurrency',
  'asOf?: string',
  'export type FxRateSource',
  "'mocked' | 'live' | 'cache' | 'unavailable'",
  'export type FxStaleState',
  "'fresh' | 'stale-but-usable' | 'sample' | 'unavailable'",
  'export type FxErrorCode',
  'export type FxRateSnapshot',
  'rate: number | null',
  'asOf: string | null',
  'providerCode?: string',
  'errorCode?: FxErrorCode',
  'export type FxRateResult',
]) {
  check(`FX types include ${marker}`, source.types.includes(marker));
}
for (const code of [
  'FX_CONFIG_MISSING', 'FX_AUTH_REQUIRED', 'FX_PROVIDER_RATE_LIMITED',
  'FX_PROVIDER_UNAVAILABLE', 'FX_SYMBOL_UNSUPPORTED', 'FX_RESPONSE_UNEXPECTED',
  'FX_STALE_BEYOND_LIMIT', 'FX_UNKNOWN_ERROR',
]) {
  check(`FX error type includes ${code}`, source.types.includes(`'${code}'`));
}
check('Types contain no provider-specific response schema',
  !/stck_prpr|rt_cd|responseBody|rawPayload/.test(source.types));
process.stdout.write('\n');

process.stdout.write('Normalization helper contract:\n');
for (const helper of [
  'normalizeFxCurrency', 'buildUnavailableFxSnapshot', 'buildIdentityFxSnapshot',
  'deriveInverseFxSnapshot', 'normalizeFxRateSnapshot', 'isUsableFxRateSnapshot',
  'buildUnsupportedFxResult',
]) {
  check(`Adapter exports ${helper}`, source.adapter.includes(`export const ${helper}`));
}
check('Currency normalization is case-insensitive',
  source.adapter.includes('.trim().toUpperCase()'));
check('Rate validation requires a finite positive number',
  source.adapter.includes('Number.isFinite(candidate.rate)') && source.adapter.includes('candidate.rate <= 0'));
check('Timestamp normalization produces ISO strings',
  source.adapter.includes('Date.parse(value)') && source.adapter.includes('.toISOString()'));
check('Unavailable snapshot nulls rate and timestamp',
  source.adapter.includes('rate: null') && source.adapter.includes('asOf: null'));
check('Unavailable snapshot uses unavailable source and stale state',
  source.adapter.includes("source: 'unavailable'") && source.adapter.includes("staleState: 'unavailable'"));
check('Provider code is allow-listed', source.adapter.includes('safeProviderCodePattern'));
process.stdout.write('\n');

process.stdout.write('Mock adapter static contract:\n');
check('Mock adapter imports provider-neutral helpers',
  source.mock.includes("from './fxAdapter'"));
check('Mock adapter imports provider-neutral types',
  source.mock.includes("from './fxTypes'"));
check('Mock adapter re-exports provider-neutral types',
  source.mock.includes('export type { FxRateResult, FxRateSnapshot, SupportedFxCurrency }'));
check('Mock USD/KRW rate remains 1350',
  /MOCKED_USD_KRW_RATE\s*=\s*1350/.test(source.mock));
check('Mock timestamp is deterministic', source.mock.includes('2026-01-01T00:00:00.000Z'));
check('Identity path occurs before canonical rate creation',
  source.mock.indexOf('normalizedBase === normalizedQuote') < source.mock.indexOf('const usdKrw'));
check('Inverse uses provider-neutral derivation helper', source.mock.includes('deriveInverseFxSnapshot(usdKrw)'));
check('Mock source stays mocked', source.mock.includes("source: 'mocked'"));
check('Mock stale state stays sample', source.mock.includes("staleState: 'sample'"));
check('Mock comments reject live/current/real-time claims',
  source.mock.includes('not a live, current, or real-time FX rate'));
process.stdout.write('\n');

process.stdout.write('Deterministic behavioral contract:\n');
let fx;
try {
  const bundled = await build({
    stdin: {
      contents: [
        "export * from './src/lib/server/providers/fxAdapter.ts';",
        "export * from './src/lib/server/providers/fxMockAdapter.ts';",
      ].join('\n'),
      resolveDir: root,
      sourcefile: 'phase-3ea-check-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    write: false,
    logLevel: 'silent',
  });
  const code = bundled.outputFiles[0]?.text ?? '';
  fx = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  check('Local FX modules bundle and import without network', Boolean(fx));
} catch {
  check('Local FX modules bundle and import without network', false);
}

if (fx) {
  const usdKrw = fx.getMockedFxRate('usd', 'krw');
  const krwUsd = fx.getMockedFxRate('KRW', 'USD');
  const krwKrw = fx.getMockedFxRate('KRW', 'KRW');
  const usdUsd = fx.getMockedFxRate('USD', 'USD');
  const unsupported = fx.getMockedFxRate('EUR', 'KRW');
  const invalidRate = fx.normalizeFxRateSnapshot(
    { baseCurrency: 'USD', quoteCurrency: 'KRW' },
    { rate: 0, asOf: '2026-01-01T00:00:00Z', source: 'mocked', staleState: 'sample' },
  );
  const invalidTimestamp = fx.normalizeFxRateSnapshot(
    { baseCurrency: 'USD', quoteCurrency: 'KRW' },
    { rate: 1350, asOf: 'not-a-timestamp', source: 'mocked', staleState: 'sample' },
  );

  check('USD/KRW mocked result succeeds', usdKrw.ok === true);
  check('USD/KRW mocked rate is 1350', usdKrw.ok && usdKrw.data.rate === 1350);
  check('USD/KRW source is mocked', usdKrw.ok && usdKrw.data.source === 'mocked');
  check('USD/KRW stale state is sample', usdKrw.ok && usdKrw.data.staleState === 'sample');
  check('USD/KRW timestamp is normalized ISO',
    usdKrw.ok && usdKrw.data.asOf === '2026-01-01T00:00:00.000Z');
  check('KRW/USD mocked result succeeds', krwUsd.ok === true);
  check('KRW/USD is finite and positive',
    krwUsd.ok && Number.isFinite(krwUsd.data.rate) && krwUsd.data.rate > 0);
  check('KRW/USD is derived inverse',
    krwUsd.ok && Math.abs(krwUsd.data.rate - (1 / 1350)) < Number.EPSILON);
  check('KRW/USD preserves canonical timestamp',
    krwUsd.ok && usdKrw.ok && krwUsd.data.asOf === usdKrw.data.asOf);
  check('KRW/KRW identity succeeds with rate 1', krwKrw.ok && krwKrw.data.rate === 1);
  check('USD/USD identity succeeds with rate 1', usdUsd.ok && usdUsd.data.rate === 1);
  check('Identity pairs do not attempt provider/network access', fetchAttempted === false);
  check('Unsupported currency fails safely', unsupported.ok === false);
  check('Unsupported currency uses FX_SYMBOL_UNSUPPORTED',
    !unsupported.ok && unsupported.code === 'FX_SYMBOL_UNSUPPORTED');
  check('Unsupported currency is unavailable',
    !unsupported.ok && unsupported.staleState === 'unavailable');
  check('Invalid rate becomes unavailable',
    invalidRate.rate === null && invalidRate.staleState === 'unavailable');
  check('Invalid rate uses FX_RESPONSE_UNEXPECTED',
    invalidRate.errorCode === 'FX_RESPONSE_UNEXPECTED');
  check('Invalid timestamp becomes unavailable',
    invalidTimestamp.asOf === null && invalidTimestamp.staleState === 'unavailable');
  check('Invalid timestamp uses FX_RESPONSE_UNEXPECTED',
    invalidTimestamp.errorCode === 'FX_RESPONSE_UNEXPECTED');
  check('Usable snapshot predicate accepts mocked USD/KRW',
    usdKrw.ok && fx.isUsableFxRateSnapshot(usdKrw.data));
  check('Usable snapshot predicate rejects invalid snapshot',
    !fx.isUsableFxRateSnapshot(invalidRate));
  check('Mock conversion preserves deterministic amount',
    fx.convertCurrencyMocked(2, 'USD', 'KRW')?.convertedAmount === 2700);
  const exposed = JSON.stringify([usdKrw, krwUsd, krwKrw, unsupported, invalidRate]);
  check('Behavior does not expose raw payload containers',
    !/rawPayload|responseBody|requestBody|authorization|access_token/i.test(exposed));
}
process.stdout.write('\n');

process.stdout.write('No-network and provider boundaries:\n');
check('FX modules contain no fetch call', !/\bfetch\s*\(/.test(fxSource));
check('FX modules contain no process.env access', !fxSource.includes('process.env'));
check('FX modules contain no import.meta.env access', !fxSource.includes('import.meta.env'));
check('FX modules contain no Supabase import or call', !/supabase|@supabase/i.test(fxSource));
check('FX modules contain no KIS import', !/kisClient|getKis/i.test(fxSource));
check('FX modules contain no provider endpoint', !/https?:\/\//i.test(fxSource));
check('FX modules contain no raw known provider fields',
  !/stck_prpr|prdy_vrss|rt_cd|access_token|authorization|appkey|appsecret/i.test(fxSource));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read an env file',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));
check('Checker installs a blocking fetch guard',
  source.checker.includes('Network access is blocked in the Phase 3EA checker.'));
process.stdout.write('\n');

process.stdout.write('Portfolio and source-policy preservation:\n');
check('Valuation imports only the provider-neutral FX type',
  source.valuation.includes("import type { FxRateSnapshot } from './providers/fxTypes'"));
check('Valuation keeps FxRateInput compatibility alias', source.valuation.includes('type FxRateInput'));
check('Valuation keeps mixed-currency helper',
  source.valuation.includes('buildPortfolioValuationFromQuotesWithFx'));
check('Valuation keeps mocked freshness cap',
  source.valuation.includes("input.fxRate?.source === 'mocked'"));
check('Valuation contains no fetch or env access',
  !/\bfetch\s*\(/.test(source.valuation) && !source.valuation.includes('process.env'));
check('Public route keeps fixture resolver', source.route.includes('resolveFixtureQuotes'));
check('Public route defaults to fixture', source.route.includes("b.source ?? 'fixture'"));
check('Public live remains explicit owner-gated',
  source.route.includes("source === 'live'") && source.route.includes("previewMode !== 'owner'"));
check('Public auto remains unsupported',
  source.route.includes("source === 'auto'") && source.route.includes('UNSUPPORTED_SOURCE'));
check('Public route does not import a live FX adapter',
  !source.route.includes('fxLiveAdapter'));
check('Later mixed-currency FX use remains explicit owner-preview only',
  !source.route.includes('buildPortfolioValuationFromQuotesWithFx') ||
    (source.route.includes('allowMockedFx') && source.route.includes("fxMode !== 'mocked'")));
check('Portfolio UI does not import FX modules',
  !source.ui.includes('fxAdapter') && !source.ui.includes('fxMockAdapter'));
process.stdout.write('\n');

process.stdout.write('Documentation and changelog:\n');
for (const heading of [
  '## 1. Status', '## 2. Background', '## 3. Implemented Scope',
  '## 4. Runtime Behavior Preserved', '## 5. Mocked FX Contract',
  '## 6. Safety', '## 7. Validation', '## 8. Next Phase',
]) {
  check(`Result document contains ${heading}`, source.result.includes(heading));
}
check('Result records mocked-first foundation ready',
  /mocked-first FX adapter foundation ready/i.test(source.result));
check('Result records no live provider calls', /no live provider calls/i.test(source.result));
check('Result recommends Phase 3EB', source.result.includes('Phase 3EB'));
const phaseSection = source.changelog.split('## Phase 3EA - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Changelog contains Phase 3EA', phaseSection.length > 0);
check('Changelog records preserved source policy',
  phaseSection.includes('source=fixture') && phaseSection.includes('source=live') && phaseSection.includes('source=auto'));
check('Changelog recommends Phase 3EB', phaseSection.includes('Phase 3EB'));
process.stdout.write('\n');

process.stdout.write('Change-scope audit:\n');
let sourceChanges = [];
let routeChanged = true;
let uiChanged = true;
let lockChanged = true;
try {
  sourceChanges = execFileSync('git', ['diff', '--name-only', '760f58c', '9b96477', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
  const changed = (relativePath) => sourceChanges.includes(relativePath);
  routeChanged = changed(paths.route);
  uiChanged = changed(paths.ui);
  lockChanged = execFileSync('git', ['diff', '--name-only', '760f58c', '9b96477', '--', 'package-lock.json'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().length > 0;
} catch {
  sourceChanges = ['<git-diff-unavailable>'];
}
const allowedSourceChanges = new Set([paths.types, paths.adapter, paths.mock, paths.valuation]);
check('Only intended FX/valuation runtime files changed',
  sourceChanges.length > 0 && sourceChanges.every((path) => allowedSourceChanges.has(path)));
check('Public Portfolio API route is unchanged', !routeChanged);
check('Portfolio UI is unchanged', !uiChanged);
check('Dependency lockfile is unchanged', !lockChanged);
check('No real adapter provider client was added',
  !existsSync(join(root, 'src/lib/server/providers/fxLiveAdapter.ts')));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
