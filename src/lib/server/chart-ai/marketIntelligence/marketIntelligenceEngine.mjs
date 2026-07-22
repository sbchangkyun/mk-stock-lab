/**
 * Phase 3GG-T-FAST — market-intelligence engine (pure, server-safe, deterministic).
 *
 * Takes ALREADY-FETCHED real series (selected / benchmark / sector / gold / oil as [{date, close}]) +
 * the FX context, and produces the canonical market-context object: equity context, relative strength,
 * volatility, commodity, currency, rate (honestly unavailable this phase), and a deterministic market
 * regime + data completeness. No network, no LLM, no randomness, no future data. Partial success is
 * first-class: any missing sub-context is marked unavailable (never zero) and lowers completeness.
 */

import { sma, smaSlope, annualizedVolatility, trendScore } from '../mkAiAnalysis/analysisScoring.mjs';
import { computeRelativeStrength } from './relativeStrength.mjs';
import { classifyMarketRegime } from './marketRegime.mjs';
import { MARKET_INTEL_METHOD_VERSION, THRESHOLDS, MI_SANITIZED_ERROR_CODES } from './marketContextTypes.mjs';

const round2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const closesOf = (series) => (Array.isArray(series) ? series : []).map((p) => p && p.close).filter((c) => Number.isFinite(c) && c > 0);
const windowChangePct = (series, window = 21) => {
  const c = closesOf(series);
  if (c.length < window + 1) return null;
  const base = c[c.length - 1 - window];
  const last = c[c.length - 1];
  return base > 0 ? round2(((last - base) / base) * 100) : null;
};

const volatilityLabel = (vol) => {
  if (!Number.isFinite(vol)) return null;
  if (vol < THRESHOLDS.volLow) return '낮음';
  if (vol < THRESHOLDS.volNormal) return '보통';
  if (vol < THRESHOLDS.volHigh) return '높음';
  return '매우 높음';
};

const unavailable = (code = MI_SANITIZED_ERROR_CODES.UNAVAILABLE, extra = {}) => ({ available: false, sanitizedErrorCode: code, ...extra });

export const runMarketIntelligence = (input = {}) => {
  const {
    instrument, benchmark, benchmarkMapping, sector,
    selectedSeries, benchmarkSeries, sectorSeries, goldSeries, oilSeries, fx, asOf,
  } = input;

  const sourceParts = [];
  const mark = (available) => sourceParts.push(available ? 1 : 0);

  // ----- Equity (benchmark) context -----
  const benchCloses = closesOf(benchmarkSeries);
  let equityContext;
  let equityTrendScoreValue = null;
  let benchAnnualVol = null;
  if (benchCloses.length >= 60) {
    equityTrendScoreValue = trendScore({
      lastClose: benchCloses[benchCloses.length - 1],
      sma20: sma(benchCloses, 20),
      sma60: sma(benchCloses, 60),
      slope20: smaSlope(benchCloses, 20, 20),
    });
    benchAnnualVol = annualizedVolatility(benchCloses, 60);
    equityContext = {
      available: true,
      source: benchmark ? 'kis' : null,
      asOf,
      isDelayed: true,
      trendScore: equityTrendScoreValue,
      momentum1mPct: windowChangePct(benchmarkSeries, 21),
      momentum3mPct: windowChangePct(benchmarkSeries, 63),
      annualizedVolatilityPct: benchAnnualVol !== null ? round2(benchAnnualVol * 100) : null,
      barCount: benchCloses.length,
      sanitizedErrorCode: MI_SANITIZED_ERROR_CODES.NONE,
    };
  } else {
    equityContext = unavailable(MI_SANITIZED_ERROR_CODES.INSUFFICIENT_DATA, { source: benchmark ? 'kis' : null });
  }
  mark(equityContext.available);

  // ----- Relative strength (same currency) -----
  const sameCurrency = instrument && benchmark && instrument.currency === benchmark.currency;
  const rsVsBenchmark = benchmark ? computeRelativeStrength(selectedSeries, benchmarkSeries, { currencyMatch: sameCurrency }) : unavailable();
  const rsVsSector = sector && sector.available && sectorSeries
    ? computeRelativeStrength(selectedSeries, sectorSeries, { currencyMatch: instrument && sector.sectorProxy && instrument.currency === sector.sectorProxy.currency })
    : unavailable(MI_SANITIZED_ERROR_CODES.NOT_SOURCED, { reasonText: sector?.reasonText });
  const sectorVsBenchmark = sector && sector.available && sectorSeries && benchmark
    ? computeRelativeStrength(sectorSeries, benchmarkSeries, { currencyMatch: sector.sectorProxy && benchmark && sector.sectorProxy.currency === benchmark.currency })
    : unavailable(MI_SANITIZED_ERROR_CODES.NOT_SOURCED);
  const relativeStrength = { available: rsVsBenchmark.available === true, vsBenchmark: rsVsBenchmark, vsSector: rsVsSector, sectorVsBenchmark };
  mark(relativeStrength.available);

  // ----- Volatility context -----
  const selCloses = closesOf(selectedSeries);
  const selVol = selCloses.length >= 40 ? annualizedVolatility(selCloses, 20) : null;
  const volatilityContext = benchAnnualVol !== null
    ? {
        available: true, source: 'kis', asOf, isDelayed: true,
        broadAnnualizedVolatilityPct: round2(benchAnnualVol * 100),
        broadLabel: volatilityLabel(benchAnnualVol),
        instrumentAnnualizedVolatilityPct: selVol !== null ? round2(selVol * 100) : null,
        instrumentLabel: selVol !== null ? volatilityLabel(selVol) : null,
        sanitizedErrorCode: MI_SANITIZED_ERROR_CODES.NONE,
      }
    : unavailable(MI_SANITIZED_ERROR_CODES.INSUFFICIENT_DATA);
  mark(volatilityContext.available);

  // ----- Commodity context -----
  const goldChangePct = windowChangePct(goldSeries, 21);
  const oilChangePct = windowChangePct(oilSeries, 21);
  const commodityAvailable = goldChangePct !== null || oilChangePct !== null;
  const commodityContext = commodityAvailable
    ? {
        available: true, source: 'kis-overseas', asOf, isDelayed: true,
        gold: goldChangePct !== null ? { available: true, change1mPct: goldChangePct } : { available: false },
        oil: oilChangePct !== null ? { available: true, change1mPct: oilChangePct } : { available: false },
        sanitizedErrorCode: MI_SANITIZED_ERROR_CODES.NONE,
      }
    : unavailable(MI_SANITIZED_ERROR_CODES.NOT_SOURCED);
  mark(commodityContext.available);

  // ----- Currency (FX) context -----
  const currencyContext = fx && fx.available
    ? { available: true, source: fx.source, pair: 'USD/KRW', rate: fx.rate, change1mPct: fx.changePct, asOf: fx.asOf, isDelayed: fx.isDelayed, sanitizedErrorCode: MI_SANITIZED_ERROR_CODES.NONE }
    : unavailable(MI_SANITIZED_ERROR_CODES.NOT_SOURCED, { pair: 'USD/KRW', source: fx?.source ?? 'frankfurter-ecb' });
  mark(currencyContext.available);

  // ----- Rate context (honestly not sourced this phase) -----
  const rateContext = unavailable(MI_SANITIZED_ERROR_CODES.NOT_SOURCED, {
    note: '금리 데이터는 이번 단계에서 신뢰 가능한 무료 공식 소스를 확보하지 못해 제공되지 않습니다.',
  });
  // rate intentionally not counted toward completeness denominator below (it is a known gap).

  // ----- Market regime -----
  const marketRegime = classifyMarketRegime({
    equityTrendScore: equityTrendScoreValue,
    equityMomentumPct: equityContext.available ? equityContext.momentum1mPct : null,
    annualizedVolatility: benchAnnualVol,
    fxChangePct: currencyContext.available ? currencyContext.change1mPct : null,
    goldChangePct,
    oilChangePct,
  });

  // ----- Data completeness (over the sub-contexts we attempt to source) -----
  const attempted = sourceParts.length; // equity, RS, volatility, commodity, currency
  const available = sourceParts.reduce((a, b) => a + b, 0);
  const dataCompleteness = attempted > 0 ? round2((available / attempted) * 100) : 0;

  const coreOk = equityContext.available && relativeStrength.available;
  return {
    ok: coreOk,
    methodVersion: MARKET_INTEL_METHOD_VERSION,
    instrument: instrument ? { symbol: instrument.symbol, displayName: instrument.displayName, country: instrument.country, assetType: instrument.assetType, currency: instrument.currency, exchange: instrument.exchange } : null,
    benchmark: benchmark ? { symbol: benchmark.symbol, displayName: benchmark.displayName, country: benchmark.country, currency: benchmark.currency } : null,
    benchmarkMapping: benchmarkMapping || null,
    sector: sector && sector.available
      ? { available: true, name: sector.sectorName, proxySymbol: sector.sectorProxy.symbol, reason: sector.reason }
      : { available: false, reasonText: sector?.reasonText ?? '업종 기준 데이터 미제공' },
    equityContext,
    relativeStrength,
    volatilityContext,
    commodityContext,
    currencyContext,
    rateContext,
    marketRegime,
    dataCompleteness,
    asOf: asOf ?? null,
    sanitizedErrorCode: coreOk ? MI_SANITIZED_ERROR_CODES.NONE : MI_SANITIZED_ERROR_CODES.INSUFFICIENT_DATA,
  };
};
