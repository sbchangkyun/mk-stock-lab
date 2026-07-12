/**
 * Phase 3GG-T-FAST — deterministic benchmark resolver (pure, client/server-safe).
 *
 * Maps a normalized instrument to a REAL representative benchmark ETF using only its market metadata
 * (country + exchange). Every mapping carries a reason code + a mapping-completeness confidence
 * ('verified' | 'inferred-from-market' | 'broad-market-fallback' | 'unavailable'). No invented index
 * or sector classification. When the selected instrument IS its own benchmark, that limitation is
 * flagged (selfBenchmark) so relative strength versus itself is skipped by the caller.
 */

import { BENCHMARKS } from './marketContextTypes.mjs';

export const resolveBenchmark = (instrument) => {
  if (!instrument || (instrument.country !== 'KR' && instrument.country !== 'US')) {
    return { benchmark: null, mappingReason: 'unavailable', mappingConfidence: 'unavailable', selfBenchmark: false };
  }

  let benchmark;
  let mappingReason;
  let mappingConfidence;

  if (instrument.country === 'KR') {
    const isKosdaq = String(instrument.exchange || '').toUpperCase().includes('KOSDAQ');
    benchmark = isKosdaq ? BENCHMARKS.KOSDAQ : BENCHMARKS.KOSPI;
    mappingReason = isKosdaq ? 'kr-kosdaq' : 'kr-kospi';
    mappingConfidence = 'inferred-from-market';
  } else {
    const exch = String(instrument.exchange || '').toUpperCase();
    const isNasdaq = exch.includes('NASDAQ');
    benchmark = isNasdaq ? BENCHMARKS.NASDAQ100 : BENCHMARKS.SP500;
    mappingReason = isNasdaq ? 'us-nasdaq-listed' : 'us-nyse-broad';
    mappingConfidence = 'inferred-from-market';
  }

  const selfBenchmark = benchmark && benchmark.symbol === instrument.symbol && benchmark.country === instrument.country;
  if (selfBenchmark) {
    // Comparing an instrument to itself is meaningless; fall back to the opposite broad benchmark so the
    // user still gets a market comparison, and label the limitation.
    if (instrument.country === 'US') {
      benchmark = benchmark.symbol === BENCHMARKS.SP500.symbol ? BENCHMARKS.NASDAQ100 : BENCHMARKS.SP500;
      mappingReason = 'us-self-benchmark-crosscheck';
    } else {
      benchmark = benchmark.symbol === BENCHMARKS.KOSPI.symbol ? BENCHMARKS.KOSDAQ : BENCHMARKS.KOSPI;
      mappingReason = 'kr-self-benchmark-crosscheck';
    }
    mappingConfidence = 'broad-market-fallback';
  }

  return { benchmark, mappingReason, mappingConfidence, selfBenchmark };
};
