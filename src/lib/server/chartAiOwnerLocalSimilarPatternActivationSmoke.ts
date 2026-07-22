import {
  assertOwnerLocalSimilarPatternResponseIsSafe,
  runOwnerLocalSimilarPatternActivation,
} from './chartAiOwnerLocalSimilarPatternActivation';
import {
  chartAiOwnerLocalSimilarPatternFixtureMap,
  chartAiOwnerLocalSimilarPatternFixtures,
} from './chartAiOwnerLocalSimilarPatternActivationFixtures';
import type {
  ChartAiOwnerLocalSimilarPatternResponse,
  ChartAiOwnerLocalSimilarPatternSmokeReport,
} from './chartAiOwnerLocalSimilarPatternActivationTypes';

const SUCCESS_KEYS = ['data', 'error', 'mode', 'ok', 'status'];
const SUMMARY_KEYS = ['currentWindowSize', 'matchCount', 'resultSource', 'scoreLabel'];
const PROVIDER_SUMMARY_KEYS = [
  'currentWindowSize',
  'matchCount',
  'providerModeLabel',
  'redactedDiagnostics',
  'resultSource',
  'scoreLabel',
];
const MATCH_KEYS = [
  'drawdownLabel',
  'forwardReturn20Label',
  'forwardReturn5Label',
  'label',
  'rank',
  'scoreLabel',
];

export const runChartAiOwnerLocalSimilarPatternActivationSmoke = (
): ChartAiOwnerLocalSimilarPatternSmokeReport => {
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

  const responses = new Map<string, ChartAiOwnerLocalSimilarPatternResponse>();
  for (const fixture of chartAiOwnerLocalSimilarPatternFixtures) {
    const response = runOwnerLocalSimilarPatternActivation(fixture.body, fixture.context);
    responses.set(fixture.name, response);
    assertEqual(response.status, fixture.expectedStatus, `${fixture.name}: expected status`);
    assertEqual(response.mode, 'owner-local-similar-pattern-route', `${fixture.name}: stable mode`);
    assertEqual(response.ok, fixture.expectedStatus === 'owner_local_similarity_success', `${fixture.name}: ok flag`);
    assertEqual(response.ok ? response.error : response.data, null, `${fixture.name}: mutually exclusive payload`);
    assertEqual(JSON.stringify(Object.keys(response).sort()), JSON.stringify(SUCCESS_KEYS), `${fixture.name}: stable top-level shape`);
    let safe = true;
    try {
      assertOwnerLocalSimilarPatternResponseIsSafe(response);
    } catch {
      safe = false;
    }
    assertTrue(safe, `${fixture.name}: response safety assertion`);
    const serialized = JSON.stringify(response);
    assertTrue(!serialized.includes('subject_mock'), `${fixture.name}: no subject reference`);
    assertTrue(!serialized.includes('normalizedPath'), `${fixture.name}: no normalized path`);
    assertTrue(!serialized.includes('currentNormalizedPath'), `${fixture.name}: no current normalized path`);
    assertTrue(!/"(?:open|high|low|close|volume)"\s*:/.test(serialized), `${fixture.name}: no raw OHLC fields`);
    assertTrue(!/@/.test(serialized), `${fixture.name}: no email literal`);
    assertTrue(!/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(serialized), `${fixture.name}: no UUID literal`);
    assertTrue(!/token|cookie|session|authorization|stack/i.test(serialized), `${fixture.name}: no sensitive runtime data`);
    assertEqual(
      JSON.stringify(runOwnerLocalSimilarPatternActivation(fixture.body, fixture.context)),
      serialized,
      `${fixture.name}: deterministic repeat`,
    );
  }

  for (const fixtureName of ['local_explicit_user_success', 'local_explicit_master_success', 'local_master_cooldown_bypass']) {
    const response = responses.get(fixtureName)!;
    assertEqual(response.ok, true, `${fixtureName}: success`);
    if (!response.ok) continue;
    assertEqual(response.status, 'owner_local_similarity_success', `${fixtureName}: success status`);
    assertEqual(response.data.summary.resultSource, 'synthetic_sample_only', `${fixtureName}: synthetic source`);
    assertTrue(response.data.summary.matchCount > 0, `${fixtureName}: match count`);
    assertEqual(response.data.summary.currentWindowSize, 20, `${fixtureName}: current window size`);
    assertTrue(response.data.summary.scoreLabel.endsWith('points'), `${fixtureName}: score label`);
    assertEqual(JSON.stringify(Object.keys(response.data.summary).sort()), JSON.stringify(SUMMARY_KEYS), `${fixtureName}: summary shape`);
    assertEqual(response.data.matches.length, response.data.summary.matchCount, `${fixtureName}: match count consistency`);
    for (const match of response.data.matches) {
      assertEqual(JSON.stringify(Object.keys(match).sort()), JSON.stringify(MATCH_KEYS), `${fixtureName}: match shape`);
      assertTrue(Number.isInteger(match.rank) && match.rank > 0, `${fixtureName}: safe rank`);
      assertTrue(match.label.startsWith('Synthetic match '), `${fixtureName}: safe label`);
      assertTrue(match.scoreLabel.endsWith('points'), `${fixtureName}: labeled score`);
      assertTrue(match.forwardReturn5Label.endsWith('%'), `${fixtureName}: labeled five-day return`);
      assertTrue(match.forwardReturn20Label.endsWith('%'), `${fixtureName}: labeled twenty-day return`);
      assertTrue(match.drawdownLabel.endsWith('%'), `${fixtureName}: labeled drawdown`);
    }
  }

  const providerFixture = responses.get('local_kis_ohlc_fixture_user_success');
  assertEqual(providerFixture?.ok, true, 'provider fixture: success');
  if (providerFixture?.ok) {
    assertEqual(providerFixture.data.summary.resultSource, 'kis_ohlc_fixture_only', 'provider fixture: source label');
    assertEqual(providerFixture.data.summary.providerModeLabel, 'KIS OHLC fixture only', 'provider fixture: mode label');
    assertEqual(JSON.stringify(Object.keys(providerFixture.data.summary).sort()), JSON.stringify(PROVIDER_SUMMARY_KEYS), 'provider fixture: summary shape');
    assertEqual(providerFixture.data.summary.redactedDiagnostics?.provider, 'kis_ohlc', 'provider fixture: provider label');
    assertEqual(providerFixture.data.summary.redactedDiagnostics?.providerMode, 'fixture_only', 'provider fixture: fixture mode');
    assertEqual(providerFixture.data.summary.redactedDiagnostics?.liveClient, 'disabled', 'provider fixture: live client disabled');
    assertEqual(providerFixture.data.summary.redactedDiagnostics?.credentialRead, 'none', 'provider fixture: no credential read');
    assertEqual(providerFixture.data.summary.redactedDiagnostics?.payloadExposure, 'redacted', 'provider fixture: payload redacted');
    assertEqual(providerFixture.data.summary.redactedDiagnostics?.barCountBucket, 'large', 'provider fixture: bucketed bar count');
    assertTrue(providerFixture.data.matches.every((match) => match.label.startsWith('KIS OHLC fixture match ')), 'provider fixture: safe match labels');
  }

  assertEqual(responses.get('remote_explicit_user_blocked')?.status, 'blocked_owner_local_required', 'remote request blocked');
  assertEqual(responses.get('local_missing_explicit_activation')?.status, 'blocked_explicit_activation_required', 'explicit activation required');
  assertEqual(responses.get('local_anonymous_blocked')?.status, 'blocked_anonymous', 'anonymous blocked');
  assertEqual(responses.get('local_unknown_role_fail_closed')?.status, 'fail_closed', 'unknown role fails closed');
  assertEqual(responses.get('local_mk_ai_provider_disabled')?.status, 'blocked_provider_disabled', 'MK AI provider disabled');
  assertEqual(responses.get('local_user_cooldown_active')?.status, 'blocked_cooldown', 'normal user cooldown blocked');
  assertEqual(responses.get('local_usage_limited')?.status, 'blocked_usage_limited', 'usage limited blocked');
  assertEqual(responses.get('local_cost_blocked')?.status, 'blocked_cost_guard', 'cost guard blocked');
  assertEqual(responses.get('local_provider_unavailable')?.status, 'blocked_provider_disabled', 'provider unavailable blocked');
  assertEqual(responses.get('local_kis_ohlc_fixture_malformed_fail_closed')?.status, 'fail_closed', 'malformed provider fixture fails closed');
  assertEqual(responses.get('malformed_input_safe_blocked')?.status, 'blocked_invalid_request', 'malformed input blocked');
  assertTrue(chartAiOwnerLocalSimilarPatternFixtures.length >= 14, 'fixture coverage includes fourteen scenarios');
  assertTrue(assertionCount >= 120, `smoke must run at least 120 assertions; ran ${assertionCount}`);

  return {
    ok: failures.length === 0,
    assertionCount,
    fixtureCount: chartAiOwnerLocalSimilarPatternFixtures.length,
    failures,
  };
};
