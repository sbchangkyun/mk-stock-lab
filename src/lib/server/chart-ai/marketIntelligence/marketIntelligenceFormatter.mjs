/**
 * Phase 3GG-T-FAST — market-intelligence formatter (pure, deterministic).
 *
 * Turns the market-context object into neutral Korean sections + an honest data-availability list.
 * Template-based, no LLM, no randomness. Descriptive market context only — never a recommendation,
 * target price, allocation, entry/exit, stop-loss, probability, or guarantee. Unavailable data is
 * stated plainly, never hidden or fabricated.
 */

import { MARKET_INTEL_DISCLAIMER } from './marketContextTypes.mjs';

const signed = (v, suffix = '%') =>
  typeof v === 'number' && Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v}${suffix}` : '데이터 없음';
const plain = (v, suffix = '') => (typeof v === 'number' && Number.isFinite(v) ? `${v}${suffix}` : '데이터 없음');

export const formatMarketIntelligence = (ctx) => {
  if (!ctx) {
    return { ok: false, sections: [], availability: [], conclusion: null, disclaimer: MARKET_INTEL_DISCLAIMER, methodVersion: null };
  }
  const eq = ctx.equityContext || {};
  const rs = ctx.relativeStrength || {};
  const vsB = rs.vsBenchmark || {};
  const vsS = rs.vsSector || {};
  const vol = ctx.volatilityContext || {};
  const fx = ctx.currencyContext || {};
  const com = ctx.commodityContext || {};
  const reg = ctx.marketRegime || {};
  const benchName = ctx.benchmark ? ctx.benchmark.displayName : '벤치마크';

  const sections = [];

  sections.push({
    key: 'broad', title: '광의 시장', available: eq.available === true,
    body: eq.available
      ? `벤치마크(${benchName}) 최근 흐름은 추세 점수 ${plain(eq.trendScore)}점, 1개월 ${signed(eq.momentum1mPct)}, 3개월 ${signed(eq.momentum3mPct)}이며, 연율화 변동성은 약 ${plain(eq.annualizedVolatilityPct, '%')}입니다.`
      : '벤치마크 시장 데이터를 충분히 확보하지 못했습니다.',
  });

  sections.push({
    key: 'relative-strength', title: '상대 강도', available: vsB.available === true,
    body: vsB.available
      ? `선택 종목은 벤치마크 대비 ${vsB.classificationLabel} 상태입니다. 1개월 격차 ${signed(vsB.windows?.[21]?.diffPct)}, 3개월 ${signed(vsB.windows?.[63]?.diffPct)}, 6개월 ${signed(vsB.windows?.[126]?.diffPct)}.` +
        (vsS.available ? ` 업종 프록시 대비로는 ${vsS.classificationLabel}입니다.` : ' 업종 프록시 비교는 제공되지 않습니다.')
      : `상대 강도를 계산할 수 없습니다. (${vsB.reasonText || '데이터 부족'})`,
  });

  sections.push({
    key: 'currency', title: '환율', available: fx.available === true,
    body: fx.available
      ? `USD/KRW는 약 ${plain(fx.rate)}원이며 최근 1개월 변화는 ${signed(fx.change1mPct)}입니다. (참고: 원화 약세는 수출·달러 자산에 상대적으로 우호적일 수 있고, 원화 강세는 그 반대의 맥락일 수 있습니다. 인과를 단정하지 않습니다.)`
      : '환율 데이터를 확보하지 못했습니다.',
  });

  sections.push({
    key: 'rates', title: '금리', available: ctx.rateContext?.available === true,
    body: ctx.rateContext?.available ? '' : (ctx.rateContext?.note || '금리 데이터는 이번 단계에서 제공되지 않습니다.'),
  });

  sections.push({
    key: 'volatility', title: '변동성', available: vol.available === true,
    body: vol.available
      ? `광의 시장 변동성은 ${vol.broadLabel} 수준(연율 약 ${plain(vol.broadAnnualizedVolatilityPct, '%')})입니다.` +
        (vol.instrumentLabel ? ` 선택 종목 변동성은 ${vol.instrumentLabel}(연율 약 ${plain(vol.instrumentAnnualizedVolatilityPct, '%')})입니다.` : '')
      : '변동성 데이터를 확보하지 못했습니다.',
  });

  sections.push({
    key: 'cross-asset', title: '원자재·리스크 자산', available: com.available === true,
    body: com.available
      ? `${com.gold?.available ? `금 1개월 ${signed(com.gold.change1mPct)}` : '금 데이터 없음'}, ${com.oil?.available ? `원유 1개월 ${signed(com.oil.change1mPct)}` : '원유 데이터 없음'}. 인과를 단정하지 않는 참고용 맥락입니다.`
      : '원자재 데이터를 확보하지 못했습니다.',
  });

  sections.push({
    key: 'regime', title: '시장 국면', available: reg.regime !== 'data-insufficient',
    body: reg.regime === 'data-insufficient'
      ? '국면 판단에 필요한 데이터가 부족합니다.'
      : `현재 시장 국면은 ${reg.regimeLabel}으로 분류됩니다. 기여 요인: ${(reg.factors || []).map((f) => `${f.label}(${f.tilt === 'risk-on' ? '위험선호' : f.tilt === 'risk-off' ? '위험회피' : '중립'})`).join(', ')}. 데이터 완성도 ${plain(reg.confidence)}점(예측 신뢰도가 아니라 입력 데이터·요인 일치도입니다).`,
  });

  // Availability list (honest, never hidden)
  const availability = [
    { dataset: '벤치마크', available: eq.available === true },
    { dataset: '상대 강도', available: vsB.available === true },
    { dataset: '업종 비교', available: vsS.available === true },
    { dataset: '환율(USD/KRW)', available: fx.available === true },
    { dataset: '금리', available: ctx.rateContext?.available === true },
    { dataset: '변동성', available: vol.available === true },
    { dataset: '원자재', available: com.available === true },
    { dataset: '시장 국면', available: reg.regime !== 'data-insufficient' },
    { dataset: '시장 폭(breadth)', available: false },
  ];

  const supportive = [];
  const weak = [];
  const missing = availability.filter((a) => !a.available).map((a) => a.dataset);
  if (vsB.available && (vsB.classification === 'strong_out' || vsB.classification === 'moderate_out')) supportive.push('벤치마크 대비 상대 강세');
  if (vsB.available && (vsB.classification === 'strong_under' || vsB.classification === 'moderate_under')) weak.push('벤치마크 대비 상대 약세');
  if (eq.available && typeof eq.trendScore === 'number' && eq.trendScore >= 60) supportive.push('벤치마크 상승 추세');
  if (eq.available && typeof eq.trendScore === 'number' && eq.trendScore <= 40) weak.push('벤치마크 하락 추세');
  if (vol.available && (vol.broadLabel === '높음' || vol.broadLabel === '매우 높음')) weak.push('높은 시장 변동성');
  if (reg.regime === 'risk-on') supportive.push('위험선호 국면');
  if (reg.regime === 'risk-off' || reg.regime === 'high-vol-transition') weak.push('위험회피/변동성 전환 국면');

  const conclusion =
    `종합: ${supportive.length ? `우호적 요인 — ${supportive.join(', ')}. ` : ''}${weak.length ? `취약 요인 — ${weak.join(', ')}. ` : ''}` +
    `${missing.length ? `미제공 데이터 — ${missing.join(', ')}. ` : ''}` +
    '이는 시장 환경에 대한 참고용 설명이며, 특정 종목의 매매나 비중을 권하지 않습니다.';

  return { ok: ctx.ok === true, sections, availability, conclusion, disclaimer: MARKET_INTEL_DISCLAIMER, methodVersion: ctx.methodVersion };
};
