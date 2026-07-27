/**
 * Phase 3GJ live market dashboard — client-safe display formatting shared by LiveMarketDashboard.astro
 * and HomeLiveMarketSnapshot.astro. No fetching, no DOM, no server import: pure string/label helpers
 * only, so it is safe to bundle into either client script.
 */

import type { FreshnessState } from './metrics';

export const formatSignedPct = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const changeToneClass = (value: number | null): 'positive' | 'negative' | 'neutral' => {
  if (value === null || !Number.isFinite(value)) return 'neutral';
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
};

/** Squarified-treemap-style color ramp keyed off period return, matching the retired sample dashboard's scale. */
export const colorForReturn = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '#9aa4b2';
  if (value >= 5) return '#9d1c22';
  if (value >= 3) return '#d54a3f';
  if (value >= 1) return '#f29a76';
  if (value <= -5) return '#174ea6';
  if (value <= -3) return '#2563eb';
  if (value <= -1) return '#7aa5f8';
  return '#9aa4b2';
};

export const FRESHNESS_LABELS: Record<FreshnessState, string> = {
  fresh: '최신',
  cached: '캐시됨',
  'stale-but-usable': '지연됨',
  partial: '일부 종목 제외',
  unavailable: '이용 불가',
};

export const freshnessLabel = (state: FreshnessState | string | null | undefined): string => {
  if (typeof state === 'string' && state in FRESHNESS_LABELS) return FRESHNESS_LABELS[state as FreshnessState];
  return '이용 불가';
};

export const formatAsOfDate = (asOf: string | null | undefined): string => {
  if (typeof asOf !== 'string' || !/^\d{8}$/.test(asOf)) return '—';
  return `${asOf.slice(0, 4)}.${asOf.slice(4, 6)}.${asOf.slice(6, 8)} 종가 기준`;
};

export const PERIOD_LABELS: Record<string, string> = {
  '1d': '1일',
  '1w': '1주',
  '1m': '1개월',
  '3m': '3개월',
};
