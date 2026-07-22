/**
 * Phase 3GG-T-HF5-HF6AB deterministic smoke — exercises the two pure presentation modules that back
 * the Similarity V2 overlay/table/aggregate-interpretation UI and the MK Agent V2 score-cards/strategy-
 * checkpoints/accordion UI. Fully offline: no DOM, no network, no login, no KIS/Supabase/Production
 * request. All instrument/candle/similarity fixtures below are clearly labeled TEST fixtures (not live
 * defaults or hidden fallbacks).
 */

import {
  SIMILARITY_OVERLAY_COLORS,
  SIMILARITY_CURRENT_COLOR,
  formatSimilarityScore,
  formatSignedPct,
  buildOverlaySeries,
  defaultVisibleSeriesKeys,
  buildAxisTicks,
  resolveVisibleTooltipValues,
  buildMatchRows,
  DISPERSION_THRESHOLDS,
  classifyDispersion,
  buildAggregateInterpretation,
  buildSimilarityExplainability,
} from '../src/lib/chart-ai/similarity-explainability-v2.mjs';

import {
  pickParticle,
  topicParticle,
  subjectParticle,
  objectParticle,
  buildOneSentenceConclusion,
  buildFlowStatus,
  buildScoreCards,
  buildStrategyCheckpoints,
  buildAccordionDescriptors,
  buildDataQualityExplanation,
  resolveCommonDisclaimer,
  buildMkAgentExperience,
} from '../src/lib/chart-ai/mk-agent-experience-v2.mjs';

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// ---- TEST fixtures (not production defaults) ----
const match = (rank, overrides = {}) => ({
  rank,
  startDate: `2024-0${rank}-01`,
  endDate: `2024-0${rank}-20`,
  normalizedPath: [100, 101, 99, 102],
  similarityScore: 90 - rank,
  forwardReturns: { d5: 0.01 * rank, d20: 0.02 * rank, d60: 0.03 * rank },
  maxDrawdownPct: -0.01 * rank,
  maxUpsidePct: 0.04 * rank,
  dataComplete: { d60: true },
  ...overrides,
});

const SIM_OK = {
  ok: true,
  currentNormalizedPath: [100, 103, 101, 105],
  matches: [match(1), match(2), match(3), match(4), match(5), match(6)],
  aggregate: {
    matchCount: 5,
    positiveCountByWindow: { d20: 4 },
    averageForwardReturnByWindow: { d5: 0.021, d20: 0.034 },
    medianForwardReturnByWindow: { d20: 0.03 },
    averageMaxDrawdownPct: -0.025,
    averageMaxUpsidePct: 0.06,
  },
};

const MKAI_DIMENSIONS = {
  trend: { label: 'moderate_up', labelText: '완만한 상승', score: 64, metrics: { lastClose: 105, sma20: 100, sma60: 95, recentSwingHigh20: 108, recentSwingLow20: 96 } },
  momentum: { label: 'steady', labelText: '안정적 상승', score: 55, metrics: { aboveMaRatioPct: 72 } },
  volatility: { label: 'normal', labelText: '보통', metrics: { annualizedVolatility20Pct: 28, annualizedVolatility60Pct: 30 } },
  similarity: { score: 82, matchCount: 5, metrics: { averageMaxDrawdownPct: -2.5 } },
  scenario: { label: 'recovered', labelText: '회복' },
  risk: { label: 'moderate', labelText: '보통', score: 45 },
};

const MKAI_OK = {
  ok: true,
  insufficient: false,
  methodVersion: 'v1',
  instrument: { symbol: '005930', displayName: '삼성전자', country: 'KR', exchange: 'KOSPI', assetType: 'stock', currency: 'KRW' },
  dataStatus: { barCount: 300, similarityOk: true, candidateCount: 400, matchCount: 5 },
  dimensions: MKAI_DIMENSIONS,
  scores: { trend: 64, momentum: 55, volatilityStability: 70, similarity: 82, risk: 45 },
  dataCompletenessConfidence: 88,
  formatted: {
    ok: true,
    disclaimer: '본 분석은 과거 데이터 기반의 참고 정보이며 투자 조언이 아닙니다.',
    sections: [
      { key: 'trend', title: '추세 상세', body: '추세 상세 설명입니다.' },
      { key: 'momentum', title: '모멘텀 상세', body: '모멘텀 상세 설명입니다.' },
      { key: 'risk', title: '위험 상세', body: '위험 상세 설명입니다.' },
    ],
    technicalBullets: ['SMA20: 100', 'SMA60: 95'],
  },
};

// ==================================================================================
// SIMILARITY EXPLAINABILITY V2
// ==================================================================================

// ---- 1. Formatters never fabricate a value ----
{
  check('1.1 similarity score formats one decimal + 점', formatSimilarityScore(90.456) === '90.5점');
  check('1.2 similarity score dash on null', formatSimilarityScore(null) === '—');
  check('1.3 similarity score dash on non-number', formatSimilarityScore(undefined) === '—');
  check('1.4 signed pct adds + for positive', formatSignedPct(0.0512) === '+5.12%');
  check('1.5 signed pct keeps - for negative', formatSignedPct(-0.031) === '-3.10%');
  check('1.6 signed pct dash on null', formatSignedPct(null) === '—');
  check('1.7 signed pct zero renders +0.00% (not fabricated dash)', formatSignedPct(0) === '+0.00%');
}

// ---- 2. Overlay series: current first, fixed color, Top-5 cap, stable colors ----
{
  const series = buildOverlaySeries(SIM_OK);
  check('2.1 current series is first', series[0].key === 'current' && series[0].current === true);
  check('2.2 current uses the fixed dark color', series[0].color === SIMILARITY_CURRENT_COLOR);
  check('2.3 six input matches capped to Top-5 overlay series (+1 current = 6 total)', series.length === 6);
  check('2.4 match series carry rank + start-date legend label', series[1].label === '#1 · 2024-01-01 시작');
  check('2.5 match colors cycle through the fixed palette', series[1].color === SIMILARITY_OVERLAY_COLORS[0] && series[5].color === SIMILARITY_OVERLAY_COLORS[4 % SIMILARITY_OVERLAY_COLORS.length]);
  check('2.6 default-visible keys include every built series', defaultVisibleSeriesKeys(series).length === series.length);
  check('2.7 missing normalizedPath degrades to an empty values array (never fabricated)', buildOverlaySeries({ matches: [{ rank: 1 }] })[1].values.length === 0);
}

// ---- 3. Axis ticks: D+ labels, dedup, short-length guard ----
{
  check('3.1 axis ticks empty for length < 2', buildAxisTicks(1).length === 0);
  check('3.2 axis ticks empty for null/undefined length', buildAxisTicks(null).length === 0 && buildAxisTicks(undefined).length === 0);
  const ticks = buildAxisTicks(21, 5);
  check('3.3 axis ticks span from D+0', ticks[0].label === 'D+0' && ticks[0].index === 0);
  check('3.4 axis ticks reach the final index', ticks[ticks.length - 1].index === 20 && ticks[ticks.length - 1].label === 'D+20');
  const shortTicks = buildAxisTicks(2, 5);
  check('3.5 axis ticks dedup when length is shorter than tickCount', shortTicks.length === 2 && shortTicks[0].index === 0 && shortTicks[1].index === 1);
}

// ---- 4. Tooltip resolves only visible series, drops nulls ----
{
  const series = buildOverlaySeries(SIM_OK);
  const visibleAll = defaultVisibleSeriesKeys(series);
  const valuesAll = resolveVisibleTooltipValues(series, visibleAll, 0);
  check('4.1 all-visible tooltip returns one row per series with data at index 0', valuesAll.length === series.length);
  const visibleCurrentOnly = ['current'];
  const valuesFiltered = resolveVisibleTooltipValues(series, visibleCurrentOnly, 0);
  check('4.2 toggled-off series never appear even if hovered', valuesFiltered.length === 1 && valuesFiltered[0].key === 'current');
  const valuesOutOfRange = resolveVisibleTooltipValues(series, visibleAll, 999);
  check('4.3 out-of-range index yields zero rows (no fabricated values)', valuesOutOfRange.length === 0);
  check('4.4 empty visible-key list yields zero rows', resolveVisibleTooltipValues(series, [], 0).length === 0);
}

// ---- 5. Match rows: Top-5 table/card source, "—" not 0 for unavailable fields ----
{
  const rows = buildMatchRows(SIM_OK);
  check('5.1 match rows include every match (table/card render decides display cap)', rows.length === 6);
  check('5.2 rank passes through', rows[0].rank === 1);
  check('5.3 forward-return labels are signed percentages', rows[0].d5Label === '+1.00%');
  check('5.4 past-range label combines start/end dates', rows[0].pastRangeLabel === '2024-01-01 ~ 2024-01-20');
  const missingRangeRow = buildMatchRows({ matches: [{ rank: 1 }] })[0];
  check('5.5 missing date range renders as "—", never a fabricated range', missingRangeRow.pastRangeLabel === '—');
  check('5.6 missing forward-return renders as "—", never 0', missingRangeRow.d5Label === '—' && missingRangeRow.d20Label === '—' && missingRangeRow.d60Label === '—');
  check('5.7 missing drawdown/upside render as "—", never 0', missingRangeRow.maxDrawdownLabel === '—' && missingRangeRow.maxUpsideLabel === '—');
  check('5.8 no matches yields an empty row list', buildMatchRows({}).length === 0);
}

// ---- 6. Dispersion classification: fixed thresholds, boundary cases ----
{
  check('6.1 thresholds are exactly 0.8 (consistent) / 0.6 (mixed)', DISPERSION_THRESHOLDS.consistent === 0.8 && DISPERSION_THRESHOLDS.mixed === 0.6);
  const consistentMatches = [{ forwardReturns: { d20: 0.1 } }, { forwardReturns: { d20: 0.2 } }, { forwardReturns: { d20: 0.3 } }, { forwardReturns: { d20: -0.05 } }, { forwardReturns: { d20: 0.15 } }];
  check('6.2 agreement exactly at 0.8 classifies consistent', classifyDispersion(consistentMatches, 'd20').code === 'consistent');
  const mixedMatches = [{ forwardReturns: { d20: 0.1 } }, { forwardReturns: { d20: 0.2 } }, { forwardReturns: { d20: 0.3 } }, { forwardReturns: { d20: -0.05 } }, { forwardReturns: { d20: -0.15 } }];
  check('6.3 agreement exactly at 0.6 classifies mixed', classifyDispersion(mixedMatches, 'd20').code === 'mixed');
  const divergentMatches = [{ forwardReturns: { d20: 0.1 } }, { forwardReturns: { d20: 0.2 } }, { forwardReturns: { d20: 0.15 } }, { forwardReturns: { d20: -0.05 } }, { forwardReturns: { d20: -0.15 } }, { forwardReturns: { d20: -0.2 } }, { forwardReturns: { d20: -0.25 } }];
  check('6.4 agreement below 0.6 classifies divergent', classifyDispersion(divergentMatches, 'd20').code === 'divergent');
  check('6.5 fewer than 3 usable values is insufficient data, never a fabricated verdict', classifyDispersion([{ forwardReturns: { d20: 0.1 } }], 'd20').code === 'insufficient');
  check('6.6 non-array input degrades to insufficient', classifyDispersion(undefined, 'd20').code === 'insufficient');
}

// ---- 7. Aggregate interpretation: deterministic Korean sentence, null on empty ----
{
  const text = buildAggregateInterpretation(SIM_OK);
  check('7.1 aggregate interpretation states the positive-outcome count', text.includes('상위 5개 유사 구간 중 4개가 20일 후 상승 마감'));
  check('7.2 aggregate interpretation states avg 5d/20d returns', text.includes('평균 5일 후 수익률은 +2.10%') && text.includes('평균 20일 후 수익률은 +3.40%'));
  check('7.3 aggregate interpretation states best/worst 20d outcome from the raw matches', text.includes('20일 후 최고 수익률은') && text.includes('최저 수익률은'));
  check('7.4 aggregate interpretation states avg/worst drawdown', text.includes('평균 최대 낙폭은 -2.50%') && text.includes('가장 컸던 낙폭은'));
  check('7.5 aggregate interpretation states the dispersion classification label', /비교적 일관됨|다소 엇갈림|결과 편차가 큼/.test(text));
  check('7.6 zero matchCount yields null (nothing to summarize)', buildAggregateInterpretation({ aggregate: { matchCount: 0 }, matches: [] }) === null);
  check('7.7 missing aggregate entirely yields null when there are also no matches', buildAggregateInterpretation({}) === null);
}

// ---- 8. Full composed Similarity model + ok!==true guard ----
{
  check('8.1 sim.ok !== true returns null (never partial/fabricated UI)', buildSimilarityExplainability({ ok: false }) === null);
  check('8.2 missing sim entirely returns null', buildSimilarityExplainability(null) === null);
  const model = buildSimilarityExplainability(SIM_OK);
  check('8.3 composed model carries series/axisTicks/matchRows/aggregateInterpretation/dispersion', Boolean(model.series) && Boolean(model.axisTicks) && Boolean(model.matchRows) && Boolean(model.aggregateInterpretation) && Boolean(model.dispersion));
  check('8.4 composed model default-visible keys match the built series', model.defaultVisibleKeys.length === model.series.length);
}

// ==================================================================================
// MK AGENT EXPERIENCE V2
// ==================================================================================

// ---- 9. Korean particle selection (batchim-aware; fixes the literal "은(는)" bug) ----
{
  check('9.1 topicParticle picks 은 after a final-consonant syllable (삼성전자 ends in 자, no batchim -> 는)', topicParticle('삼성전자') === '는');
  check('9.2 topicParticle picks 은 after a batchim-ending word', topicParticle('삼성') === '은');
  check('9.3 subjectParticle picks 이/가 by batchim', subjectParticle('삼성') === '이' && subjectParticle('카카오') === '가');
  check('9.4 objectParticle picks 을/를 by batchim', objectParticle('삼성') === '을' && objectParticle('카카오') === '를');
  check('9.5 non-Hangul (English ticker) endings deterministically fall back to no-final-consonant form', topicParticle('AAPL') === '는' && subjectParticle('AAPL') === '가' && objectParticle('AAPL') === '를');
  check('9.6 pickParticle is a pure passthrough of the batchim decision', pickParticle('삼성', '받침있음', '받침없음') === '받침있음' && pickParticle('카카오', '받침있음', '받침없음') === '받침없음');
  check('9.7 empty-string word never throws and falls back to no-final-consonant form', topicParticle('') === '는');
}

// ---- 10. One-sentence conclusion ----
{
  const conclusion = buildOneSentenceConclusion(MKAI_OK);
  check('10.1 conclusion names the instrument with the correct particle', conclusion.startsWith('삼성전자는'));
  check('10.2 conclusion states trend/momentum/risk labels', conclusion.includes('완만한 상승') && conclusion.includes('안정적 상승') && conclusion.includes('보통'));
  check('10.3 conclusion never issues a buy/sell command', !/사세요|파세요|매수하세요|매도하세요/.test(conclusion));
  const insufficientConclusion = buildOneSentenceConclusion({ instrument: { displayName: '삼성전자' } });
  check('10.4 missing dimensions degrades to an honest insufficient-data sentence (never fabricated labels)', insufficientConclusion.includes('데이터가 충분하지 않습니다'));
}

// ---- 11. Current flow status ----
{
  const status = buildFlowStatus(MKAI_OK);
  check('11.1 flow status states real bar count and similarity comparison state', status.label.includes('300거래일') && status.label.includes('5건 비교 완료'));
  const noSimilarityStatus = buildFlowStatus({ dataStatus: { barCount: 250, similarityOk: false, matchCount: 0 } });
  check('11.2 similarityOk=false states comparison unavailable, never a fabricated match count', noSimilarityStatus.label.includes('과거 유사 구간 비교 불가'));
  const missingStatus = buildFlowStatus({});
  check('11.3 missing dataStatus degrades to an honest unknown-status label', missingStatus.label.includes('데이터 상태를 확인할 수 없습니다'));
}

// ---- 12. Score cards: six direction-aware cards, correct semantics, score-band boundaries ----
{
  const cards = buildScoreCards(MKAI_OK);
  check('12.1 exactly six score cards', cards.length === 6);
  const keys = cards.map((c) => c.key);
  check('12.2 all six expected dimensions present', ['trend', 'momentum', 'stability', 'similarity', 'risk', 'dataQuality'].every((k) => keys.includes(k)));
  const trendCard = cards.find((c) => c.key === 'trend');
  check('12.3 trend direction is higher-stronger-trend (higher = favorable)', trendCard.direction === 'higher-stronger-trend');
  const riskCard = cards.find((c) => c.key === 'risk');
  check('12.4 risk direction explicitly marks higher as NOT better', riskCard.direction === 'higher-more-risk-not-better');
  const simCard = cards.find((c) => c.key === 'similarity');
  check('12.5 similarity direction explicitly marks higher as NOT more-likely-to-rise', simCard.direction === 'higher-more-similar-not-more-likely-to-rise');
  const dqCard = cards.find((c) => c.key === 'dataQuality');
  check('12.6 data-quality direction explicitly marks higher as NOT confidence', dqCard.direction === 'higher-more-complete-not-confidence');
  check('12.7 data-quality score reads from dataCompletenessConfidence, not a similarity/trend score', dqCard.score === 88);
  const bandCards = buildScoreCards({ scores: { trend: 80, momentum: 60, volatilityStability: 40, similarity: 20, risk: 0 }, dataCompletenessConfidence: null });
  check('12.8 score >= 80 bands as 매우 강함 (favorable) / 매우 높음 (risk)', bandCards.find((c) => c.key === 'trend').statusLabel === '매우 강함');
  check('12.9 score exactly 60 bands as 강함, not 보통 (boundary is inclusive)', bandCards.find((c) => c.key === 'momentum').statusLabel === '강함');
  check('12.10 null score (no data) bands as 데이터 부족, never a fabricated numeric label', bandCards.find((c) => c.key === 'dataQuality').statusLabel === '데이터 부족');
  check('12.11 visualPercent is 0 (not null) for a null score, so the bar never renders a negative/NaN width', bandCards.find((c) => c.key === 'dataQuality').visualPercent === 0);
  for (const c of cards) check(`12.12 meaning text is non-empty for ${c.key}`, typeof c.meaning === 'string' && c.meaning.length > 0);
}

// ---- 13. Strategy checkpoints: four groups, real-value-only, out-of-scope indicators absent ----
{
  const checkpoints = buildStrategyCheckpoints(MKAI_OK);
  check('13.1 checkpoints has exactly groups A/B/C/D', Object.keys(checkpoints).sort().join(',') === 'groupA,groupB,groupC,groupD');
  check('13.2 group A title matches the spec exactly', checkpoints.groupA.title === 'A. 상승 전환 확인 조건');
  check('13.3 group B title matches the spec exactly', checkpoints.groupB.title === 'B. 하락 위험 확대 조건');
  check('13.4 group C title matches the spec exactly', checkpoints.groupC.title === 'C. 현재 관찰 우선순위');
  check('13.5 group D title matches the spec exactly', checkpoints.groupD.title === 'D. 핵심 가격대');
  check('13.6 group D price levels use calculation-basis labels, never "지지선"/"저항선"', checkpoints.groupD.items.every((i) => !/지지선|저항선|support|resistance/i.test(i.label)));
  check('13.7 group D includes the recent-swing-low/high and MA labels', checkpoints.groupD.items.some((i) => i.label.includes('최근 저점')) && checkpoints.groupD.items.some((i) => i.label.includes('최근 고점')) && checkpoints.groupD.items.some((i) => i.label.includes('20일 이동평균')) && checkpoints.groupD.items.some((i) => i.label.includes('60일 이동평균')));
  const allText = JSON.stringify(checkpoints);
  check('13.8 no out-of-scope indicators (RSI/MACD/Bollinger/ATR) appear anywhere in the checkpoints', !/RSI|MACD|Bollinger|볼린저|ATR/i.test(allText));
  check('13.9 no direct buy/sell command language', !/사세요|파세요|매수하세요|매도하세요/.test(allText));
  const emptyCheckpoints = buildStrategyCheckpoints({ dimensions: {} });
  check('13.10 empty metrics still produce an honest fallback bullet per group (never fabricated conditions)', emptyCheckpoints.groupA.items[0].includes('데이터가 아직 충분하지 않습니다') && emptyCheckpoints.groupB.items[0].includes('데이터가 아직 충분하지 않습니다'));
  check('13.11 missing dimensions entirely returns null', buildStrategyCheckpoints({}) === null);
}

// ---- 14. Accordion descriptors: default-open limited to the first section ----
{
  const sections = buildAccordionDescriptors(MKAI_OK.formatted);
  check('14.1 three accordion sections carried through', sections.length === 3);
  check('14.2 only the first section defaults open', sections[0].defaultOpen === true && sections.slice(1).every((s) => s.defaultOpen === false));
  check('14.3 titles/bodies pass through unchanged', sections[0].title === '추세 상세' && sections[0].body === '추세 상세 설명입니다.');
  check('14.4 missing sections degrades to an empty accordion list, never fabricated sections', buildAccordionDescriptors({}).length === 0);
}

// ---- 15. Data-quality explanation: explicitly disclaims prediction confidence ----
{
  const explanation = buildDataQualityExplanation(MKAI_OK);
  check('15.1 data-quality explanation states the real score', explanation.includes('88점'));
  check('15.2 data-quality explanation explicitly denies being a prediction-confidence measure', explanation.includes('예측 신뢰도나 확률을 의미하지 않습니다'));
  const noScoreExplanation = buildDataQualityExplanation({});
  check('15.3 missing score degrades to an honest 데이터 부족 label, never a fabricated number', noScoreExplanation.includes('데이터 부족'));
}

// ---- 16. Common disclaimer: single source, never duplicated/invented ----
{
  check('16.1 disclaimer resolves from the server-approved formatted.disclaimer', resolveCommonDisclaimer(MKAI_OK) === MKAI_OK.formatted.disclaimer);
  check('16.2 missing formatted.disclaimer resolves to null (never a fabricated disclaimer)', resolveCommonDisclaimer({}) === null);
}

// ---- 17. Full composed MK Agent model + ok/formatted.ok guards ----
{
  check('17.1 mkai.ok !== true returns null', buildMkAgentExperience({ ok: false }) === null);
  check('17.2 mkai.formatted.ok !== true returns null', buildMkAgentExperience({ ...MKAI_OK, formatted: { ...MKAI_OK.formatted, ok: false } }) === null);
  check('17.3 missing mkai.formatted entirely returns null', buildMkAgentExperience({ ok: true, insufficient: false }) === null);
  check('17.4 missing mkai entirely returns null', buildMkAgentExperience(null) === null);
  const experience = buildMkAgentExperience(MKAI_OK);
  check('17.5 composed model carries all seven fields', ['conclusion', 'flowStatus', 'scoreCards', 'strategyCheckpoints', 'accordionSections', 'dataQualityExplanation', 'disclaimer'].every((k) => k in experience));
  check('17.6 composed model score cards count matches buildScoreCards', experience.scoreCards.length === buildScoreCards(MKAI_OK).length);
  check('17.7 composed model disclaimer matches the server-approved text', experience.disclaimer === MKAI_OK.formatted.disclaimer);
}

console.log('');
console.log(`HF5-HF6AB-ANALYSIS-EXPERIENCE-V2-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
process.exit(failed > 0 ? 1 : 0);
