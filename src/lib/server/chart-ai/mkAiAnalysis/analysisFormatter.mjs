/**
 * Phase 3GG-R-FAST MK AI analysis formatter (server-side, pure, deterministic).
 *
 * Turns the structured analysis object into human-readable Korean sections using fixed templates and
 * the real computed metrics. No LLM, no network, no randomness. Neutral, descriptive wording only:
 * never a target price, buy/sell/entry/exit/stop-loss instruction, probability-of-gain claim,
 * guarantee, or future prediction. Missing metrics render as "데이터 부족", never fabricated.
 */

import { MK_AI_DISCLAIMER } from './analysisTypes.mjs';

const num = (v, suffix = '') => (typeof v === 'number' && Number.isFinite(v) ? `${v}${suffix}` : '데이터 부족');
const signed = (v, suffix = '') =>
  typeof v === 'number' && Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v}${suffix}` : '데이터 부족';

/**
 * @param {object} analysis structured object from runMkAiAnalysis
 * @returns { ok, sections:[{key,title,body}], technicalBullets:[string], conclusion, disclaimer,
 *   confidenceNote, methodVersion }
 */
export const formatMkAiAnalysis = (analysis) => {
  if (!analysis || analysis.ok !== true) {
    return {
      ok: false,
      insufficient: analysis?.insufficient === true,
      reason: analysis?.reason ?? 'UNAVAILABLE',
      sections: [],
      technicalBullets: [],
      conclusion: null,
      disclaimer: MK_AI_DISCLAIMER,
      methodVersion: analysis?.methodVersion ?? null,
    };
  }

  const d = analysis.dimensions;
  const name = analysis.instrument.displayName;
  const tm = d.trend.metrics;
  const mm = d.momentum.metrics;
  const vm = d.volatility.metrics;
  const sm = d.similarity.metrics;
  const rm = d.risk.metrics;

  const sections = [
    {
      key: 'trend',
      title: '추세',
      body:
        `최근 ${analysis.dataStatus.barCount}거래일 종가 흐름은 ${d.trend.labelText}입니다. ` +
        `현재가는 20일 이동평균 대비 ${signed(tm.priceVsSma20Pct, '%')}, 60일 이동평균 대비 ${signed(tm.priceVsSma60Pct, '%')} 수준이며, ` +
        `20일 이동평균의 최근 20거래일 변화율은 ${signed(tm.slope20Pct, '%')}입니다. (추세 점수 ${num(d.trend.score)}점)`,
    },
    {
      key: 'momentum',
      title: '모멘텀',
      body:
        `모멘텀은 ${d.momentum.labelText} 상태입니다. ` +
        `최근 5일과 직전 구간의 평균 수익률 차이(가속도)는 ${signed(mm.accelerationPct, '%p')}, ` +
        `최근 20거래일 중 상승 마감 비율은 ${num(mm.upDayRatioPct, '%')}, 20일 이동평균 상회 비율은 ${num(mm.aboveMaRatioPct, '%')}입니다. ` +
        `추세의 지속성과 일관성을 설명하는 지표이며, 매매 판단을 제공하지 않습니다.`,
    },
    {
      key: 'volatility',
      title: '변동성',
      body:
        `변동성은 ${d.volatility.labelText} 수준입니다. ` +
        `최근 20거래일 연율화 변동성은 약 ${num(vm.annualizedVolatility20Pct, '%')}, 60거래일 기준 약 ${num(vm.annualizedVolatility60Pct, '%')}입니다.`,
    },
    {
      key: 'similarity',
      title: '과거 유사 패턴',
      body:
        `과거 유사 구간 상위 ${d.similarity.matchCount}개의 평균 유사도는 ${num(d.similarity.score)}점입니다. ` +
        `이 구간들의 이후 20거래일 평균 수익률은 ${signed(sm.averageForwardReturn20Pct, '%')}(중앙값 ${signed(sm.medianForwardReturn20Pct, '%')}), ` +
        `상승 마감 사례는 ${num(sm.positiveCount20)}/${d.similarity.matchCount}건, 평균 최대 낙폭은 ${signed(sm.averageMaxDrawdownPct, '%')}였습니다. ` +
        `실제 과거 데이터 집계이며 지어내지 않았습니다.`,
    },
    {
      key: 'scenario',
      title: '과거 시나리오',
      body:
        `유사했던 과거 구간에서는 ${d.scenario.labelText}. ` +
        `이는 과거 유사 구간의 집계 결과일 뿐이며, 미래 성과를 예측하거나 보장하지 않습니다.`,
    },
    {
      key: 'risk',
      title: '리스크',
      body:
        `종합 위험 수준은 ${d.risk.labelText}입니다. ` +
        `연율화 변동성 ${num(rm.annualizedVolatility20Pct, '%')}, 유사 구간 평균 최대 낙폭 ${signed(rm.averageMaxDrawdownPct, '%')}, ` +
        `추세 강도 ${num(rm.trendScore)}점을 종합했습니다. 투자 자문이 아닙니다.`,
    },
  ];

  const technicalBullets = [
    `추세: ${d.trend.labelText} (점수 ${num(d.trend.score)})`,
    `모멘텀: ${d.momentum.labelText} (점수 ${num(d.momentum.score)})`,
    `변동성: ${d.volatility.labelText} (연율 ${num(vm.annualizedVolatility20Pct, '%')})`,
    `유사도: 평균 ${num(d.similarity.score)}점 · 상위 ${d.similarity.matchCount}건`,
    `유사 구간 이후 20일 평균: ${signed(sm.averageForwardReturn20Pct, '%')}`,
    `리스크: ${d.risk.labelText} (점수 ${num(d.risk.score)})`,
  ];

  const conclusion =
    `${name}은(는) 현재 추세 ${d.trend.labelText}, 변동성 ${d.volatility.labelText}, 리스크 ${d.risk.labelText}으로 요약됩니다. ` +
    `과거 유사 구간에서는 ${d.scenario.labelText}. ` +
    `본 분석은 실제 지연 시세와 과거 통계를 결정적 규칙으로 정리한 참고용 정보이며, 특정 시점의 매매나 목표 가격을 제시하지 않습니다.`;

  const confidenceNote =
    `데이터 완성도 ${num(analysis.dataCompletenessConfidence)}점 — 이는 예측 신뢰도가 아니라 분석에 사용된 실제 입력 데이터의 충실도(과거 데이터 길이, 지표·유사 구간 확보 여부)를 나타냅니다.`;

  return {
    ok: true,
    insufficient: false,
    sections,
    technicalBullets,
    conclusion,
    confidenceNote,
    disclaimer: MK_AI_DISCLAIMER,
    methodVersion: analysis.methodVersion,
  };
};
