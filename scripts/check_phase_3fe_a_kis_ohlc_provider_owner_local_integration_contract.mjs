import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let assertionCount = 0;
const failures = [];

const assertTrue = (condition, message) => {
  assertionCount += 1;
  if (!condition) failures.push(message);
};

const readSource = (relativePath) => {
  const fullPath = path.join(repoRoot, relativePath);
  assertTrue(existsSync(fullPath), `Expected file to exist: ${relativePath}`);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
};

const assertIncludesAll = (source, phrases, label) => {
  for (const phrase of phrases) assertTrue(source.includes(phrase), `${label} must include: ${phrase}`);
};

const extractChangelogEntry = (source, heading) => {
  const start = source.indexOf(heading);
  if (start === -1) return '';
  const next = source.indexOf('\n## ', start + heading.length);
  return next === -1 ? source.slice(start) : source.slice(start, next);
};

const ROUTE_PATH = 'src/pages/api/chart-ai/similarity.ts';
const UI_PATH = 'src/pages/chart-ai.astro';
const BOUNDARY_TYPES_PATH = 'src/lib/server/chartAiKisOhlcProviderBoundaryTypes.ts';
const BOUNDARY_PATH = 'src/lib/server/chartAiKisOhlcProviderBoundary.ts';
const BOUNDARY_FIXTURES_PATH = 'src/lib/server/chartAiKisOhlcProviderBoundaryFixtures.ts';
const BOUNDARY_SMOKE_PATH = 'src/lib/server/chartAiKisOhlcProviderBoundarySmoke.ts';
const ACTIVATION_TYPES_PATH = 'src/lib/server/chartAiOwnerLocalSimilarPatternActivationTypes.ts';
const ACTIVATION_PATH = 'src/lib/server/chartAiOwnerLocalSimilarPatternActivation.ts';
const ACTIVATION_FIXTURES_PATH = 'src/lib/server/chartAiOwnerLocalSimilarPatternActivationFixtures.ts';
const ACTIVATION_SMOKE_PATH = 'src/lib/server/chartAiOwnerLocalSimilarPatternActivationSmoke.ts';
const INDEX_PATH = 'src/lib/server/index.ts';
const SMOKE_SCRIPT_PATH = 'scripts/smoke_phase_3fe_a_kis_ohlc_provider_owner_local_integration.mjs';
const CHECKER_PATH = 'scripts/check_phase_3fe_a_kis_ohlc_provider_owner_local_integration_contract.mjs';
const RESULT_PATH = 'docs/planning/phase_3fe_a_kis_ohlc_provider_owner_local_integration_result_v0.1.md';
const CHANGELOG_PATH = 'docs/planning/planning_changelog.md';
const PACKAGE_PATH = 'package.json';
const PHASE_J_RESULT_PATH = 'docs/planning/phase_3fd_j_similar_pattern_route_owner_local_activation_result_v0.1.md';
const HANDOFF_CURRENT_PATH = 'docs/handoff/chart-ai-new-chat/01_CURRENT_STATE.md';

const route = readSource(ROUTE_PATH);
const ui = readSource(UI_PATH);
const boundaryTypes = readSource(BOUNDARY_TYPES_PATH);
const boundary = readSource(BOUNDARY_PATH);
const boundaryFixtures = readSource(BOUNDARY_FIXTURES_PATH);
const boundarySmoke = readSource(BOUNDARY_SMOKE_PATH);
const activationTypes = readSource(ACTIVATION_TYPES_PATH);
const activation = readSource(ACTIVATION_PATH);
const activationFixtures = readSource(ACTIVATION_FIXTURES_PATH);
const activationSmoke = readSource(ACTIVATION_SMOKE_PATH);
const indexSource = readSource(INDEX_PATH);
const smokeScript = readSource(SMOKE_SCRIPT_PATH);
const checker = readSource(CHECKER_PATH);
const result = readSource(RESULT_PATH);
const changelog = readSource(CHANGELOG_PATH);
const packageSource = readSource(PACKAGE_PATH);
const packageJson = JSON.parse(packageSource);
const phaseJResult = readSource(PHASE_J_RESULT_PATH);
const handoffCurrent = readSource(HANDOFF_CURRENT_PATH);

assertTrue(packageJson.scripts?.['check:phase-3fe-a-kis-ohlc-provider-owner-local-integration'] === 'node scripts/check_phase_3fe_a_kis_ohlc_provider_owner_local_integration_contract.mjs', 'Package checker script must be exact.');
assertTrue(packageJson.scripts?.['smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration'] === 'node scripts/smoke_phase_3fe_a_kis_ohlc_provider_owner_local_integration.mjs', 'Package smoke script must be exact.');
assertTrue(!packageSource.includes('"package-lock"'), 'Package metadata must not add lockfile metadata.');

assertIncludesAll(boundaryTypes, [
  'ChartAiKisOhlcProviderIdentity',
  "'kis_ohlc'",
  'ChartAiKisOhlcProviderMode',
  "'disabled' | 'fixture_only'",
  'ChartAiKisOhlcProviderShapedBar',
  'ChartAiKisOhlcProviderShapedInput',
  'ChartAiKisOhlcRedactedDiagnostics',
  'liveClient: \'disabled\'',
  'credentialRead: \'none\'',
  'payloadExposure: \'redacted\'',
  'ChartAiKisOhlcProviderResult',
], 'Boundary types');

assertIncludesAll(boundary, [
  'Server-only KIS OHLC provider boundary',
  'Live execution is unavailable',
  'normalizeKisOhlcProviderShapedInput',
  'runDisabledKisOhlcProviderBoundary',
  'runFixtureOnlyKisOhlcProviderBoundary',
  'assertKisOhlcProviderResultIsSafe',
  "source: 'kis-normalized'",
  "liveClient: 'disabled'",
  "credentialRead: 'none'",
  "payloadExposure: 'redacted'",
  'provider_shape_rejected',
  'provider_bars_rejected',
  'live_kis_ohlc_client_disabled',
], 'Boundary implementation');

assertIncludesAll(boundaryFixtures, [
  'buildDeterministicKisOhlcProviderFixture',
  'buildMalformedKisOhlcProviderFixture',
  'buildKisOhlcProviderFixture',
  "provider: 'kis_ohlc'",
  "mode: 'fixture_only'",
  "market: 'KRX'",
  "symbol: 'KIS_SAFE_FIXTURE'",
  'stck_bsop_date',
  'stck_oprc',
  'stck_hgpr',
  'stck_lwpr',
  'stck_clpr',
  'acml_vol',
], 'Boundary fixtures');

assertIncludesAll(activationTypes, [
  "ownerLocalOhlcProviderMode?: 'synthetic_sample' | 'kis_ohlc_fixture'",
  "ownerLocalKisOhlcFixture?: 'deterministic_safe' | 'malformed_provider_shape'",
  "resultSource: 'synthetic_sample_only' | 'kis_ohlc_fixture_only'",
  'providerModeLabel?: string',
  'redactedDiagnostics?',
  "provider: 'kis_ohlc'",
  "liveClient: 'disabled'",
  "credentialRead: 'none'",
  "payloadExposure: 'redacted'",
], 'Activation types');

assertIncludesAll(activation, [
  'runFixtureOnlyKisOhlcProviderBoundary',
  'ownerLocalOhlcProviderMode',
  'ownerLocalKisOhlcFixture',
  'resolveBarsForOwnerLocalRequest',
  "'synthetic_sample_only'",
  "'kis_ohlc_fixture_only'",
  "'KIS OHLC fixture only'",
  'redactedDiagnostics',
  'providerResult.bars',
  'KIS OHLC fixture match',
  'The owner-local KIS OHLC fixture failed closed.',
  'invalid_provider_mode',
  'record.requestKind === \'mk_ai\'',
  'role === \'anonymous\'',
  'guardDecision.status !== \'blocked_route_success_disabled\'',
], 'Activation helper');

assertIncludesAll(activationFixtures, [
  'local_kis_ohlc_fixture_user_success',
  'local_kis_ohlc_fixture_malformed_fail_closed',
  "ownerLocalOhlcProviderMode: 'kis_ohlc_fixture'",
  "ownerLocalKisOhlcFixture: 'deterministic_safe'",
  "ownerLocalKisOhlcFixture: 'malformed_provider_shape'",
], 'Activation fixtures');

assertIncludesAll(activationSmoke, [
  'PROVIDER_SUMMARY_KEYS',
  'local_kis_ohlc_fixture_user_success',
  'kis_ohlc_fixture_only',
  'KIS OHLC fixture only',
  'live client disabled',
  'no credential read',
  'payload redacted',
  'malformed provider fixture fails closed',
], 'Activation smoke');

assertIncludesAll(boundarySmoke, [
  'runChartAiKisOhlcProviderBoundarySmoke',
  'runDisabledKisOhlcProviderBoundary',
  'runFixtureOnlyKisOhlcProviderBoundary',
  'default synthetic owner-local flow still succeeds',
  'provider owner-local flow succeeds',
  'remote provider request blocked',
  'anonymous provider request blocked',
  'unknown provider request blocked',
  'MK AI provider route remains blocked',
  'malformed provider route blocked',
  'invalid provider mode blocked',
  'assertionCount >= 120',
], 'Boundary smoke');

assertIncludesAll(route, [
  'Phase 3FE-A',
  'ownerLocalOhlcProviderMode',
  'ownerLocalKisOhlcFixture',
  'runOwnerLocalSimilarPatternActivation',
  'new URL(request.url).hostname',
  'isGuardedRuntimeScaffoldSimilarityRequestBody(body)',
  'ownerLocalSimilarPatternRouteActivation',
], 'Route integration');

assertIncludesAll(ui, [
  'ownerLocalSimilarPatternRoute',
  'fetch(\'/api/chart-ai/similarity\'',
  'ownerLocalSimilarPatternRouteEnabled',
  'chartAiMockLoggedOut',
  'chartAiMockMaster',
  'canBypassAnalysisCooldown',
  'ANALYSIS_COOLDOWN_MS',
  'ownerLocalMocked',
  'ownerLocalAuthUsageBridge',
], 'UI preservation');
assertTrue(!ui.includes('ownerLocalOhlcProviderMode'), 'UI must not expose provider fixture controls in Phase 3FE-A.');

assertIncludesAll(indexSource, [
  "from './chartAiKisOhlcProviderBoundaryTypes'",
  "from './chartAiKisOhlcProviderBoundary'",
  "from './chartAiKisOhlcProviderBoundaryFixtures'",
  "from './chartAiKisOhlcProviderBoundarySmoke'",
], 'Server index exports');

assertIncludesAll(smokeScript, [
  'runChartAiKisOhlcProviderBoundarySmoke',
  'globalThis.fetch',
  'Unexpected network call.',
  'report.assertionCount < 120',
  'Phase 3FE-A smoke: PASS',
], 'Smoke script');

assertIncludesAll(result, [
  '# Phase 3FE-A — KIS OHLC Provider Owner-local Integration Result',
  '## 1. Status',
  '## 2. Implemented Scope',
  '## 3. Provider Boundary Result',
  '## 4. Route Integration Result',
  '## 5. Sanitized Response Policy',
  '## 6. Security and Boundary Preservation',
  '## 7. Validation Results',
  '## 8. Changed Files',
  '## 9. Not Completed / Deferred',
  '## 10. Recommended Next Phase',
  'No live KIS call occurred.',
  'No `.env` or environment credential was read.',
  'No Supabase client was created.',
  'No database connection occurred.',
  'No cookie/header/session/JWT parsing occurred.',
  'No raw KIS payload or raw OHLC row is exposed.',
  'No public or beta activation occurred.',
  'MK AI remains mocked.',
  'LLM remains deferred.',
  'Deploy and push did not occur.',
], 'Result document');

const phaseEntry = extractChangelogEntry(changelog, '## Phase 3FE-A - 2026-07-07');
assertIncludesAll(phaseEntry, [
  '## Phase 3FE-A - 2026-07-07',
  '### KIS OHLC Provider Owner-local Integration (Implemented)',
  'fixture-only KIS OHLC provider boundary',
  'owner-local Similar Pattern route',
  'No live KIS call',
  'no environment read',
  'no Supabase',
  'no database',
  'no LLM',
  'no MK AI route activation',
  'no public/beta activation',
  'Phase 3FF-A',
], 'Changelog Phase 3FE-A entry');

assertTrue(phaseJResult.includes('Phase 3FD-J — Similar Pattern Route Owner-local Activation Result'), 'Phase 3FD-J result must remain present.');
assertTrue(handoffCurrent.includes('Owner-local Similar Pattern route-backed flow is complete.'), 'Handoff current state remains readable.');

const newRuntimeSources = [boundaryTypes, boundary, boundaryFixtures, boundarySmoke, activationTypes, activation, activationFixtures, activationSmoke, indexSource, route].join('\n');
assertTrue(!/@supabase\//.test(newRuntimeSources), 'No Supabase import may be introduced.');
assertTrue(!/createClient\s*\(/.test(newRuntimeSources), 'No Supabase/client creation may be introduced.');
assertTrue(!/process\.env(?:\.|\[)|import\.meta\.env/.test(newRuntimeSources), 'No environment value read may be introduced.');
assertTrue(!/\bfetch\s*\(|axios|XMLHttpRequest|WebSocket/.test([boundary, boundaryFixtures, boundarySmoke, activation].join('\n')), 'No network call may be introduced in provider path.');
assertTrue(!/request\.headers|get\(['"]cookie|authorization\s*[:=]|verifyJwt\s*\(|parseSession\s*\(|decodeJwt\s*\(/i.test([boundary, activation].join('\n')), 'No cookie/header/session/JWT parsing may be introduced.');
assertTrue(!/\.from\s*\(|\.rpc\s*\(|database|dbConnection|pool\.query/.test([boundary, activation].join('\n')), 'No database connection/query may be introduced.');
assertTrue(!/openai|gemini|anthropic|chatCompletion\s*\(|createCompletion\s*\(|model\s*:/.test([boundary, activation].join('\n')), 'No LLM or MK AI runtime may be introduced.');
assertTrue(!/routeSuccessEnabled\s*:\s*true|publicActivationAllowed\s*:\s*true|beta/i.test([boundary, activation].join('\n')), 'No public or beta route success may be introduced.');
assertTrue(!/MASTER_EMAIL\s*[:=]\s*['"]|MASTER_USER_ID\s*[:=]\s*['"]/.test(newRuntimeSources), 'No raw master placeholder assignment may be introduced.');
assertTrue(!/\baccount(?:No|Number|Id)?\s*[:=]|\border(?:No|Id)?\s*[:=]|\bbalance\s*[:=]|\btrading\s*[:=]/i.test([boundary, boundaryFixtures, activation].join('\n')), 'No account/order/balance/trading executable fields may be introduced.');

const sensitiveScan = [newRuntimeSources, result, phaseEntry].join('\n');
const emailLiteralPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const uuidLiteralPattern = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
assertTrue(!emailLiteralPattern.test(sensitiveScan), 'No email literal may be introduced.');
assertTrue(!uuidLiteralPattern.test(sensitiveScan), 'No UUID literal may be introduced.');
assertTrue(!/access.?token|refresh.?token|app.?secret|app.?key|authorization\s*[:=]/i.test([boundary, boundaryFixtures, activation].join('\n')), 'No credential/token/session material may be introduced.');
assertTrue(!/providerPayload\s*:|normalizedPath\s*:|currentNormalizedPath\s*:/.test([activation, route].join('\n')), 'Route-visible output must not expose raw payloads, raw OHLC, or normalized paths.');
assertTrue(checker.includes('emailLiteralPattern') && checker.includes('uuidLiteralPattern'), 'Checker must use generic sensitive literal regexes.');

assertTrue(packageSource.includes('"dependencies"'), 'Package dependencies block remains present.');
assertTrue(!packageSource.includes('"@kis/'), 'No KIS dependency may be added.');
assertTrue(!packageSource.includes('"openai"'), 'No LLM dependency may be added.');

assertTrue(assertionCount >= 130, `Checker must run at least 130 assertions; ran ${assertionCount}.`);
assertTrue(assertionCount <= 190, `Checker must run at most 190 assertions; ran ${assertionCount}.`);

if (failures.length > 0) {
  console.error(`Phase 3FE-A check FAILED: ${failures.length}/${assertionCount} assertions failed.`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Phase 3FE-A check passed: ${assertionCount}/${assertionCount} assertions passed.`);
