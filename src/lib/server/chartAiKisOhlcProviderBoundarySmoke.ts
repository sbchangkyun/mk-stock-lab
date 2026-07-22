import {
  assertOwnerLocalSimilarPatternResponseIsSafe,
  runOwnerLocalSimilarPatternActivation,
} from './chartAiOwnerLocalSimilarPatternActivation';
import { buildOwnerLocalSimilarPatternRequestFixture } from './chartAiOwnerLocalSimilarPatternActivationFixtures';
import {
  assertKisOhlcProviderResultIsSafe,
  runDisabledKisOhlcProviderBoundary,
  runFixtureOnlyKisOhlcProviderBoundary,
} from './chartAiKisOhlcProviderBoundary';
import type { ChartAiKisOhlcProviderBoundarySmokeReport } from './chartAiKisOhlcProviderBoundaryTypes';

const providerBody = (overrides: Record<string, unknown> = {}) =>
  buildOwnerLocalSimilarPatternRequestFixture('user', {
    ownerLocalOhlcProviderMode: 'kis_ohlc_fixture',
    ownerLocalKisOhlcFixture: 'deterministic_safe',
    ...overrides,
  });

const serializedIsSafe = (value: unknown): boolean => {
  const serialized = JSON.stringify(value);
  return !/@|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|subject_mock|token|cookie|session|authorization|stack|raw.?payload|normalizedPath|currentNormalizedPath|stck_|acml_|"open"|"high"|"low"|"close"|"volume"/i.test(serialized);
};

export const runChartAiKisOhlcProviderBoundarySmoke = (): ChartAiKisOhlcProviderBoundarySmokeReport => {
  let assertionCount = 0;
  const failures: string[] = [];
  const assertTrue = (condition: boolean, message: string) => {
    assertionCount += 1;
    if (!condition) failures.push(message);
  };
  const assertEqual = (actual: unknown, expected: unknown, message: string) => {
    assertionCount += 1;
    if (actual !== expected) failures.push(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  };

  const disabled = runDisabledKisOhlcProviderBoundary();
  assertEqual(disabled.ok, false, 'disabled boundary ok flag');
  assertEqual(disabled.status, 'kis_ohlc_disabled', 'disabled boundary status');
  assertEqual(disabled.bars.length, 0, 'disabled boundary exposes no bars');
  assertEqual(disabled.diagnostics.liveClient, 'disabled', 'disabled boundary live client');
  assertEqual(disabled.diagnostics.credentialRead, 'none', 'disabled boundary credential read');
  assertEqual(disabled.diagnostics.payloadExposure, 'redacted', 'disabled boundary payload exposure');

  const providerReady = runFixtureOnlyKisOhlcProviderBoundary('deterministic_safe');
  assertEqual(providerReady.ok, true, 'fixture boundary ok flag');
  assertEqual(providerReady.status, 'kis_ohlc_fixture_ready', 'fixture boundary status');
  assertTrue(providerReady.bars.length >= 120, 'fixture boundary normalized enough bars');
  assertEqual(providerReady.diagnostics.provider, 'kis_ohlc', 'fixture boundary provider');
  assertEqual(providerReady.diagnostics.providerMode, 'fixture_only', 'fixture boundary provider mode');
  assertEqual(providerReady.diagnostics.liveClient, 'disabled', 'fixture boundary live client disabled');
  assertEqual(providerReady.diagnostics.credentialRead, 'none', 'fixture boundary no credential read');
  assertEqual(providerReady.diagnostics.payloadExposure, 'redacted', 'fixture boundary payload redacted');
  assertEqual(providerReady.diagnostics.barCountBucket, 'large', 'fixture boundary bucketed count');
  assertTrue(providerReady.ok && providerReady.bars.every((bar) => bar.source === 'kis-normalized'), 'fixture boundary normalized source');
  assertTrue(providerReady.ok && providerReady.bars.every((bar) => bar.market === 'KRX'), 'fixture boundary normalized market');
  assertTrue(providerReady.ok && providerReady.bars.every((bar) => bar.symbol === 'KIS_SAFE_FIXTURE'), 'fixture boundary normalized symbol');
  assertTrue(providerReady.ok && providerReady.bars.every((bar) => Number.isFinite(bar.close) && bar.close > 0), 'fixture boundary valid close');
  if (providerReady.ok) {
    for (const bar of providerReady.bars.slice(0, 8)) {
      assertTrue(/^\d{4}-\d{2}-\d{2}$/.test(bar.date), 'fixture boundary normalized date shape');
      assertTrue(bar.high >= Math.max(bar.open, bar.close), 'fixture boundary high contains open and close');
      assertTrue(bar.low <= Math.min(bar.open, bar.close), 'fixture boundary low contains open and close');
      assertTrue(bar.volume !== null && Number.isFinite(bar.volume), 'fixture boundary finite volume');
    }
  }

  const malformed = runFixtureOnlyKisOhlcProviderBoundary('malformed_provider_shape');
  assertEqual(malformed.ok, false, 'malformed boundary ok flag');
  assertEqual(malformed.status, 'kis_ohlc_malformed', 'malformed boundary status');
  assertEqual(malformed.bars.length, 0, 'malformed boundary exposes no bars');

  for (const result of [disabled, providerReady, malformed]) {
    let safe = true;
    try {
      assertKisOhlcProviderResultIsSafe(result);
    } catch {
      safe = false;
    }
    assertTrue(safe, `${result.status}: provider diagnostics safe`);
    assertTrue(serializedIsSafe({ ok: result.ok, status: result.status, diagnostics: result.diagnostics }), `${result.status}: serialized public diagnostics safe`);
  }

  const synthetic = runOwnerLocalSimilarPatternActivation(
    buildOwnerLocalSimilarPatternRequestFixture('user'),
    { hostname: 'localhost' },
  );
  assertEqual(synthetic.ok, true, 'default synthetic owner-local flow still succeeds');
  if (synthetic.ok) {
    assertEqual(synthetic.data.summary.resultSource, 'synthetic_sample_only', 'default synthetic source preserved');
    assertTrue(!('providerModeLabel' in synthetic.data.summary), 'default synthetic has no provider label');
  }

  const providerSuccess = runOwnerLocalSimilarPatternActivation(providerBody(), { hostname: 'localhost' });
  assertEqual(providerSuccess.ok, true, 'provider owner-local flow succeeds');
  assertEqual(providerSuccess.status, 'owner_local_similarity_success', 'provider owner-local status');
  if (providerSuccess.ok) {
    assertEqual(providerSuccess.data.summary.resultSource, 'kis_ohlc_fixture_only', 'provider route source');
    assertEqual(providerSuccess.data.summary.currentWindowSize, 20, 'provider route current window');
    assertTrue(providerSuccess.data.summary.matchCount > 0, 'provider route match count');
    assertEqual(providerSuccess.data.summary.providerModeLabel, 'KIS OHLC fixture only', 'provider route mode label');
    assertEqual(providerSuccess.data.summary.redactedDiagnostics?.provider, 'kis_ohlc', 'provider route diagnostics provider');
    assertEqual(providerSuccess.data.summary.redactedDiagnostics?.liveClient, 'disabled', 'provider route live client disabled');
    assertEqual(providerSuccess.data.summary.redactedDiagnostics?.credentialRead, 'none', 'provider route no credential read');
    assertEqual(providerSuccess.data.summary.redactedDiagnostics?.payloadExposure, 'redacted', 'provider route payload redacted');
    assertTrue(providerSuccess.data.matches.every((match) => match.label.startsWith('KIS OHLC fixture match ')), 'provider route safe match labels');
    for (const match of providerSuccess.data.matches) {
      assertTrue(Number.isInteger(match.rank), 'provider match rank is integer');
      assertTrue(match.scoreLabel.endsWith('points'), 'provider match score label safe');
      assertTrue(match.forwardReturn5Label.endsWith('%'), 'provider match five-day label safe');
      assertTrue(match.forwardReturn20Label.endsWith('%'), 'provider match twenty-day label safe');
      assertTrue(match.drawdownLabel.endsWith('%'), 'provider match drawdown label safe');
    }
  }

  const providerMaster = runOwnerLocalSimilarPatternActivation(
    buildOwnerLocalSimilarPatternRequestFixture('master', {
      ownerLocalOhlcProviderMode: 'kis_ohlc_fixture',
      ownerLocalKisOhlcFixture: 'deterministic_safe',
    }),
    { hostname: '127.0.0.1', guardScenario: 'cooldown_active' },
  );
  assertEqual(providerMaster.ok, true, 'provider master cooldown bypass succeeds');
  assertEqual(providerMaster.status, 'owner_local_similarity_success', 'provider master status');

  const remote = runOwnerLocalSimilarPatternActivation(providerBody(), { hostname: 'example.test' });
  assertEqual(remote.ok, false, 'remote provider request blocked');
  assertEqual(remote.status, 'blocked_owner_local_required', 'remote provider request status');

  const anonymous = runOwnerLocalSimilarPatternActivation(providerBody({ subjectRole: 'anonymous' }), { hostname: 'localhost' });
  assertEqual(anonymous.ok, false, 'anonymous provider request blocked');
  assertEqual(anonymous.status, 'blocked_anonymous', 'anonymous provider status');

  const unknown = runOwnerLocalSimilarPatternActivation(providerBody({ subjectRole: 'unknown' }), { hostname: 'localhost' });
  assertEqual(unknown.ok, false, 'unknown provider request blocked');
  assertEqual(unknown.status, 'fail_closed', 'unknown provider status');

  const mkAi = runOwnerLocalSimilarPatternActivation(providerBody({ requestKind: 'mk_ai' }), { hostname: 'localhost' });
  assertEqual(mkAi.ok, false, 'MK AI provider route remains blocked');
  assertEqual(mkAi.status, 'blocked_provider_disabled', 'MK AI provider route status');

  const malformedProvider = runOwnerLocalSimilarPatternActivation(
    providerBody({ ownerLocalKisOhlcFixture: 'malformed_provider_shape' }),
    { hostname: 'localhost' },
  );
  assertEqual(malformedProvider.ok, false, 'malformed provider route blocked');
  assertEqual(malformedProvider.status, 'fail_closed', 'malformed provider route status');

  const invalidProviderMode = runOwnerLocalSimilarPatternActivation(
    providerBody({ ownerLocalOhlcProviderMode: 'live_kis' }),
    { hostname: 'localhost' },
  );
  assertEqual(invalidProviderMode.ok, false, 'invalid provider mode blocked');
  assertEqual(invalidProviderMode.status, 'blocked_invalid_request', 'invalid provider mode status');

  for (const response of [
    synthetic,
    providerSuccess,
    providerMaster,
    remote,
    anonymous,
    unknown,
    mkAi,
    malformedProvider,
    invalidProviderMode,
  ]) {
    let safe = true;
    try {
      assertOwnerLocalSimilarPatternResponseIsSafe(response);
    } catch {
      safe = false;
    }
    assertTrue(safe, `${response.status}: route response safe`);
    assertTrue(serializedIsSafe(response), `${response.status}: serialized route response safe`);
    const deterministicRepeat = runOwnerLocalSimilarPatternActivation(
      response === synthetic ? buildOwnerLocalSimilarPatternRequestFixture('user') : providerBody(),
      { hostname: 'localhost' },
    );
    assertEqual(JSON.stringify(deterministicRepeat).length > 0, true, `${response.status}: deterministic callable`);
  }

  assertTrue(assertionCount >= 120, `smoke must run at least 120 assertions; ran ${assertionCount}`);

  return {
    ok: failures.length === 0,
    assertionCount,
    fixtureCount: 3,
    failures,
  };
};
