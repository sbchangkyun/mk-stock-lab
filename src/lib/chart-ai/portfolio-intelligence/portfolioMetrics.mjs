/**
 * Phase 3GG-S-FAST Portfolio Intelligence — deterministic comparison + risk metrics (client-safe, pure).
 *
 * No network, no provider calls, no LLM, no randomness. Consumes normalized holdings, a caller-
 * supplied price map (from the existing OHLCV route — latest daily close, honestly labeled), and a
 * caller-supplied analysis map (from cached MK AI / similarity). Produces DESCRIPTIVE portfolio
 * statistics only: never a recommendation, target allocation, rebalance instruction, buy/sell, target
 * price, stop-loss, probability of profit, or guaranteed return. KRW and USD are NEVER combined
 * (no FX). Missing data is reported honestly, never fabricated. No NaN/Infinity.
 */

import { instrumentKey } from './schemas.mjs';

/** Documented, neutral concentration thresholds (fraction of a currency bucket / of the whole set). */
export const CONCENTRATION_THRESHOLDS = { singlePosition: 0.40, country: 0.80 };

export const PRICE_BASIS_LABELS = {
  live: '실시간 현재가',
  delayed: '지연 현재가',
  'daily-close': '최신 종가(지연)',
  unavailable: '가격 정보 없음',
};

const round2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const finite = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Per-position value from a holding + optional priceInfo `{ price, basis, asOf }`.
 * `basis` is one of live | delayed | daily-close | unavailable. investedCost is always available.
 */
export const computePosition = (holding, priceInfo) => {
  const investedCost = round2(holding.quantity * holding.averagePrice);
  const basis = priceInfo && PRICE_BASIS_LABELS[priceInfo.basis] ? priceInfo.basis : 'unavailable';
  const price = basis !== 'unavailable' ? finite(priceInfo?.price) : null;
  const hasPrice = price !== null && price > 0;
  const marketValue = hasPrice ? round2(holding.quantity * price) : null;
  const unrealizedAmount = hasPrice ? round2(marketValue - investedCost) : null;
  const unrealizedPct = hasPrice && investedCost > 0 ? round2(((marketValue - investedCost) / investedCost) * 100) : null;
  return {
    id: holding.id,
    instrument: holding.instrument,
    currency: holding.currency,
    quantity: holding.quantity,
    averagePrice: holding.averagePrice,
    investedCost,
    priceBasis: basis,
    priceBasisLabel: PRICE_BASIS_LABELS[basis],
    price: hasPrice ? round2(price) : null,
    marketValue,
    unrealizedAmount,
    unrealizedPct,
    dataAsOf: priceInfo?.asOf ?? null,
    hasPrice,
  };
};

/**
 * Groups positions by currency bucket (KRW/USD kept SEPARATE — never summed together). Allocation
 * weight is cost-based (invested cost / bucket invested cost), always computable and summing to 100.
 */
export const computeCurrencyBuckets = (holdings, priceMap = {}) => {
  const buckets = {};
  for (const holding of holdings) {
    const priceInfo = priceMap[instrumentKey(holding.instrument)];
    const pos = computePosition(holding, priceInfo);
    const cur = holding.currency;
    if (!buckets[cur]) buckets[cur] = { currency: cur, positions: [], totalInvestedCost: 0, totalMarketValue: 0, pricedCount: 0, count: 0 };
    buckets[cur].positions.push(pos);
    buckets[cur].totalInvestedCost += pos.investedCost || 0;
    buckets[cur].count += 1;
    if (pos.hasPrice) { buckets[cur].totalMarketValue += pos.marketValue; buckets[cur].pricedCount += 1; }
  }
  for (const cur of Object.keys(buckets)) {
    const b = buckets[cur];
    const total = b.totalInvestedCost;
    b.positions = b.positions.map((p) => ({ ...p, weightPct: total > 0 ? round2((p.investedCost / total) * 100) : null }));
    b.totalInvestedCost = round2(b.totalInvestedCost);
    b.totalMarketValue = b.pricedCount > 0 ? round2(b.totalMarketValue) : null;
    b.allPriced = b.pricedCount === b.count;
  }
  return buckets;
};

/**
 * Per-instrument comparison rows. `analysisMap` keyed by instrumentKey → cached deterministic scores
 * `{ trend, momentum, volatilityStability, risk, dataCompleteness, similarityMatchCount }`. Instruments
 * without cached analysis are honestly marked `needsAnalysis` (never fabricated).
 */
export const computeComparison = (instruments, analysisMap = {}) =>
  (Array.isArray(instruments) ? instruments : []).map((instrument) => {
    const a = analysisMap[instrumentKey(instrument)];
    if (!a || typeof a !== 'object') {
      return { instrument, needsAnalysis: true, scores: null };
    }
    return {
      instrument,
      needsAnalysis: false,
      scores: {
        trend: finite(a.trend),
        momentum: finite(a.momentum),
        volatilityStability: finite(a.volatilityStability),
        risk: finite(a.risk),
        dataCompleteness: finite(a.dataCompleteness),
        similarityMatchCount: Number.isInteger(a.similarityMatchCount) ? a.similarityMatchCount : null,
      },
    };
  });

const weightedAverage = (pairs) => {
  let num = 0;
  let den = 0;
  for (const [value, weight] of pairs) {
    if (typeof value === 'number' && Number.isFinite(value) && weight > 0) { num += value * weight; den += weight; }
  }
  return den > 0 ? round2(num / den) : null;
};

/** Deterministic, neutral portfolio-level risk/concentration summary. Never advice/rebalance. */
export const computeRiskSummary = (holdings, priceMap = {}, analysisMap = {}) => {
  const list = Array.isArray(holdings) ? holdings : [];
  const buckets = computeCurrencyBuckets(list, priceMap);
  const holdingCount = list.length;
  const krCount = list.filter((h) => h.instrument.country === 'KR').length;
  const usCount = list.filter((h) => h.instrument.country === 'US').length;
  const stockCount = list.filter((h) => h.instrument.assetType === 'stock').length;
  const etfCount = list.filter((h) => h.instrument.assetType === 'etf').length;

  let missingAnalysisCount = 0;
  let missingPriceCount = 0;
  const volPairs = [];
  const riskPairs = [];
  for (const h of list) {
    const a = analysisMap[instrumentKey(h.instrument)];
    const cost = h.quantity * h.averagePrice;
    if (!a) missingAnalysisCount += 1;
    else {
      // volatility "instability" = 100 - stability, so higher = more volatile (for weighted avg context)
      if (typeof a.volatilityStability === 'number') volPairs.push([100 - a.volatilityStability, cost]);
      if (typeof a.risk === 'number') riskPairs.push([a.risk, cost]);
    }
    if (!priceMap[instrumentKey(h.instrument)] || priceMap[instrumentKey(h.instrument)].basis === 'unavailable') missingPriceCount += 1;
  }

  const notices = [];
  const currencyConcentration = {};
  for (const cur of Object.keys(buckets)) {
    const b = buckets[cur];
    const top = b.positions.reduce((m, p) => (p.weightPct !== null && p.weightPct > m.weightPct ? p : m), { weightPct: -1 });
    currencyConcentration[cur] = { topWeightPct: top.weightPct >= 0 ? top.weightPct : null, topSymbol: top.instrument?.symbol ?? null };
    if (top.weightPct >= CONCENTRATION_THRESHOLDS.singlePosition * 100) {
      notices.push(`${cur} 통화 내 단일 종목 비중이 높습니다 (${top.instrument?.displayName ?? top.instrument?.symbol}, 약 ${top.weightPct}% · 투자원금 기준).`);
    }
  }
  if (holdingCount > 0) {
    const krRatio = krCount / holdingCount;
    const usRatio = usCount / holdingCount;
    if (krRatio >= CONCENTRATION_THRESHOLDS.country) notices.push('보유 종목이 국내(KR)에 집중되어 있습니다.');
    else if (usRatio >= CONCENTRATION_THRESHOLDS.country) notices.push('보유 종목이 미국(US)에 집중되어 있습니다.');
  }
  if (missingAnalysisCount > 0) notices.push(`${missingAnalysisCount}개 종목은 아직 분석 데이터가 없어 위험 요약에서 제외되었습니다. (분석 새로고침 필요)`);
  if (missingPriceCount > 0) notices.push(`${missingPriceCount}개 종목은 최신 가격 정보를 불러오지 않아 평가액이 계산되지 않았습니다.`);

  return {
    holdingCount,
    krCount,
    usCount,
    stockCount,
    etfCount,
    currencyBuckets: Object.keys(buckets).map((cur) => ({
      currency: cur,
      count: buckets[cur].count,
      totalInvestedCost: buckets[cur].totalInvestedCost,
      totalMarketValue: buckets[cur].totalMarketValue,
      allPriced: buckets[cur].allPriced,
    })),
    currencyConcentration,
    averageWeightedVolatility: weightedAverage(volPairs),
    averageWeightedRiskScore: weightedAverage(riskPairs),
    missingAnalysisCount,
    missingPriceCount,
    missingDataRatio: holdingCount > 0 ? round2((missingAnalysisCount / holdingCount) * 100) : 0,
    etfOverlap: { available: false, note: 'ETF 구성종목 데이터가 없어 중복 노출 분석은 제공되지 않습니다.' },
    notices,
    disclaimer: '포트폴리오 통계는 직접 입력한 보유 정보와 지연 시세를 결정적 규칙으로 정리한 참고용 요약이며, 매매·비중 조정 권유나 투자 자문이 아닙니다.',
  };
};
