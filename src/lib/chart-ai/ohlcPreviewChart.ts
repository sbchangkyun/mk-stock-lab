/**
 * Adapter converting an owner-local OHLC preview point (nullable numeric fields, as returned by
 * `/api/chart-ai/owner-local-ohlc-preview`) into the existing mocked chart geometry point shape
 * (`MockedOhlcPoint`, non-nullable numeric fields) so the existing `buildMockedChartGeometry`
 * renderer can be reused without rewriting the chart geometry code.
 */

import type { MockedOhlcPoint } from './mockedOhlc';

export type OwnerLocalOhlcPreviewPoint = {
  dateTime: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

/** Drops any point missing a required OHLC field; volume defaults to 0 when absent. */
export function toMockedOhlcPoints(points: readonly OwnerLocalOhlcPreviewPoint[]): MockedOhlcPoint[] {
  return points
    .filter(
      (point): point is OwnerLocalOhlcPreviewPoint & { open: number; high: number; low: number; close: number } =>
        typeof point.open === 'number' &&
        typeof point.high === 'number' &&
        typeof point.low === 'number' &&
        typeof point.close === 'number',
    )
    .map((point) => ({
      date: point.dateTime,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: typeof point.volume === 'number' ? point.volume : 0,
    }));
}
