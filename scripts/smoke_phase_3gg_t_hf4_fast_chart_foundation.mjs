/**
 * Phase 3GG-T-HF4-FAST offline smoke test — chart interaction/formatting pure helpers.
 * Deterministic. No DOM, no network, no real KIS token issuance, no Supabase, no secrets.
 */

import assert from 'node:assert/strict';
import {
  candleDirection,
  computeChange,
  formatPrice,
  formatSignedPrice,
  formatPercent,
  formatVolume,
  formatDate,
  estimateTurnover,
  formatEstimatedTurnoverKrw,
  nearestCandleIndex,
  valueToY,
  buildCandleDisplayDatum,
} from '../src/lib/chart-ai/chart-interaction-foundation.mjs';

let passed = 0;
const check = (cond, message) => {
  if (!cond) throw new Error(`SMOKE FAIL: ${message}`);
  passed += 1;
};

const KR_CANDLES = [
  { date: '2026-07-01T00:00:00Z', open: 70000, high: 71200, low: 69800, close: 70500, volume: 12000000 },
  { date: '2026-07-02T00:00:00Z', open: 70500, high: 70900, low: 69000, close: 69200, volume: 15500000 },
  { date: '2026-07-03T00:00:00Z', open: 69200, high: 69200, low: 69200, close: 69200, volume: 8000000 },
  { date: '2026-07-06T00:00:00Z', open: 69200, high: 72000, low: 69100, close: 71800, volume: 20100000 },
];

const US_CANDLES = [
  { date: '2026-07-01T00:00:00Z', open: 210.1, high: 213.2, low: 209.4, close: 212.48, volume: 45000000 },
  { date: '2026-07-02T00:00:00Z', open: 212.48, high: 214.0, low: 210.5, close: 210.33, volume: 39000000 },
];

// --- 19.1 candleDirection: up / down / flat, and defensive on malformed input ---
check(candleDirection({ open: 100, close: 110 }) === 'up', '19.1 close>open must be up.');
check(candleDirection({ open: 110, close: 100 }) === 'down', '19.1 close<open must be down.');
check(candleDirection({ open: 100, close: 100 }) === 'flat', '19.1 close===open must be flat.');
check(candleDirection(null) === 'flat', '19.1 null candle must default to flat, not throw.');
check(candleDirection({ open: NaN, close: 100 }) === 'flat', '19.1 non-finite open must default to flat.');

// --- 19.2 computeChange: previous-candle delta, unavailable at index 0 or on bad previous close ---
const c0 = computeChange(KR_CANDLES, 0);
check(c0.available === false && c0.amount === null, '19.2 index 0 has no previous candle -> unavailable.');
const c1 = computeChange(KR_CANDLES, 1);
check(c1.available === true, '19.2 index 1 must have a previous candle.');
check(Math.abs(c1.amount - (69200 - 70500)) < 1e-9, '19.2 change amount must be close[1]-close[0].');
check(Math.abs(c1.percent - ((69200 - 70500) / 70500) * 100) < 1e-9, '19.2 change percent must be relative to previous close.');
const cZeroPrev = computeChange([{ close: 0 }, { close: 10 }], 1);
check(cZeroPrev.available === false, '19.2 zero previous close must be treated as unavailable (no divide-by-zero).');
check(computeChange(KR_CANDLES, 99).available === false, '19.2 out-of-range index must be unavailable, not throw.');

// --- 19.3 formatPrice / formatSignedPrice / formatPercent: KRW vs USD, signs, zero ---
check(formatPrice(70500, 'KRW') === '70,500원', '19.3 KRW price must be grouped with 원 suffix.');
check(formatPrice(212.48, 'USD') === '$212.48', '19.3 USD price must have 2 decimals with $ prefix.');
check(formatPrice(NaN, 'KRW') === '—', '19.3 non-finite price must render as em dash.');
check(formatSignedPrice(10000, 'KRW') === '▲10,000', '19.3 positive KRW change must use ▲.');
check(formatSignedPrice(-30500, 'KRW') === '▼30,500', '19.3 negative KRW change must use ▼ with absolute magnitude.');
check(formatSignedPrice(2.15, 'USD') === '▲$2.15', '19.3 positive USD change must use ▲ with $ magnitude.');
check(formatPercent(1.02) === '+1.02%', '19.3 positive percent must be signed and rounded to 2 decimals.');
check(formatPercent(-10.7) === '-10.70%', '19.3 negative percent must render with sign and fixed decimals.');
check(formatPercent(0) === '0.00%', '19.3 zero percent must not be signed.');

// --- 19.4 formatVolume / formatDate: locale grouping, string-slice date (no Date object) ---
check(formatVolume(12000000) === '12,000,000', '19.4 volume must be grouped.');
check(formatVolume(-1) === '—', '19.4 negative volume must be rejected.');
check(formatDate('2026-07-06T00:00:00Z') === '2026.07.06', '19.4 date must format via slicing as YYYY.MM.DD.');
check(formatDate('bad') === '—', '19.4 malformed date must render as em dash, not throw.');

// --- 19.5 estimateTurnover / formatEstimatedTurnoverKrw: honesty guard (KRW only, labeled estimate) ---
check(estimateTurnover(70000, 1000) === 70000000, '19.5 turnover estimate must be close*volume.');
check(estimateTurnover(NaN, 1000) === null, '19.5 non-finite close must yield null turnover, not NaN.');
check(formatEstimatedTurnoverKrw(8.11e12) === '8.11조원', '19.5 trillion-scale KRW turnover must render as 조원.');
check(formatEstimatedTurnoverKrw(3.4e8) === '3.4억원', '19.5 hundred-million-scale KRW turnover must render as 억원.');
check(formatEstimatedTurnoverKrw(500000) === '500,000원', '19.5 small KRW turnover must render as plain won.');
check(formatEstimatedTurnoverKrw(-1) === null, '19.5 negative turnover must be rejected.');

// --- 19.6 nearestCandleIndex: clamped mapping from pointer position to candle index ---
check(nearestCandleIndex(24, 24, 800, 4) === 0, '19.6 pointer at plot-left edge must resolve to index 0.');
check(nearestCandleIndex(824 - 1, 24, 800, 4) === 3, '19.6 pointer near plot-right edge must resolve to last index.');
check(nearestCandleIndex(-9999, 24, 800, 4) === 0, '19.6 pointer left of the plot must clamp to index 0.');
check(nearestCandleIndex(9999, 24, 800, 4) === 3, '19.6 pointer right of the plot must clamp to the last index.');
check(nearestCandleIndex(100, 24, 800, 0) === -1, '19.6 zero-candle series must resolve to -1 (no candle).');
check(nearestCandleIndex(100, 24, 800, 1) === 0, '19.6 single-candle series must always resolve to index 0.');

// --- 19.7 valueToY / buildCandleDisplayDatum: pixel mapping + full display datum, incl. edge cases ---
check(valueToY(100, 0, 200, 20, 300) === 170, '19.7 mid-domain value must map to the vertical midpoint of the plot.');
check(valueToY(200, 0, 200, 20, 300) === 20, '19.7 max-domain value must map to plotTop.');
check(valueToY(0, 0, 200, 20, 300) === 320, '19.7 min-domain value must map to plotTop+plotHeight.');
check(valueToY(NaN, 0, 200, 20, 300) === 20, '19.7 non-finite value must fall back to plotTop, not throw/NaN.');
check(valueToY(100, 50, 50, 20, 300) === 170, '19.7 zero-range domain must fall back to the plot midpoint (no divide-by-zero).');

const datum0 = buildCandleDisplayDatum(KR_CANDLES, 1, 'KRW');
check(datum0 !== null, '19.7 buildCandleDisplayDatum must return a datum for a valid index.');
check(datum0.direction === 'down', '19.7 datum direction must match candleDirection for the same candle.');
check(datum0.changeAvailable === true, '19.7 datum at index>0 must have an available change.');
check(datum0.formatted.close === '69,200원', '19.7 datum formatted.close must use formatPrice.');
check(datum0.formatted.change === '▼1,300', '19.7 datum formatted.change must use formatSignedPrice.');
check(typeof datum0.turnoverEstimate === 'number' && datum0.formatted.turnoverEstimate !== null, '19.7 KRW datum must expose a formatted turnover estimate.');

const datumUsd = buildCandleDisplayDatum(US_CANDLES, 1, 'USD');
check(datumUsd !== null, '19.7 USD datum must build successfully.');
check(datumUsd.turnoverEstimate === null && datumUsd.formatted.turnoverEstimate === null, '19.7 USD datum must never expose a turnover estimate (KRW-only honesty guard).');
check(datumUsd.formatted.close === '$210.33', '19.7 USD datum close must be formatted with 2 decimals and $ prefix.');

check(buildCandleDisplayDatum(KR_CANDLES, -1, 'KRW') === null, '19.7 out-of-range negative index must return null.');
check(buildCandleDisplayDatum(KR_CANDLES, 99, 'KRW') === null, '19.7 out-of-range positive index must return null.');
check(buildCandleDisplayDatum([], 0, 'KRW') === null, '19.7 empty candle series must return null.');

const flatDatum = buildCandleDisplayDatum(KR_CANDLES, 2, 'KRW');
check(flatDatum.direction === 'flat', '19.7 a flat candle (open===close) must report direction flat.');

assert.equal(passed > 0, true);
console.log(`PASS: Phase 3GG-T-HF4-FAST chart foundation smoke test (${passed}/${passed} assertions).`);
