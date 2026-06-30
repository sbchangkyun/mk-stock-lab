import type { ChartPeriodKey, MockedOhlcPoint } from './mockedOhlc';

export type CandleGeometry = {
  x: number;
  wickTop: number;
  wickBottom: number;
  bodyTop: number;
  bodyHeight: number;
  bodyWidth: number;
  volumeY: number;
  volumeHeight: number;
  direction: 'up' | 'down';
};

export type ChartAxisLabel = {
  x?: number;
  y?: number;
  label: string;
};

export type MockedChartGeometry = {
  viewBox: string;
  plotLeft: number;
  plotRight: number;
  priceTop: number;
  priceBottom: number;
  volumeTop: number;
  volumeBottom: number;
  candles: CandleGeometry[];
  priceLabels: ChartAxisLabel[];
  dateLabels: ChartAxisLabel[];
};

const WIDTH = 960;
const HEIGHT = 440;
const PLOT_LEFT = 24;
const PLOT_RIGHT = 878;
const PRICE_TOP = 22;
const PRICE_BOTTOM = 314;
const VOLUME_TOP = 342;
const VOLUME_BOTTOM = 404;

const formatSampleValue = (value: number): string => Math.round(value).toLocaleString('ko-KR');

const formatDateLabel = (date: string, period: ChartPeriodKey): string => {
  if (period === '1d') return `${date.slice(11, 16)}`;
  if (period === '1y') return `${date.slice(5, 7)}월`;
  return `${date.slice(5, 7)}.${date.slice(8, 10)}`;
};

const selectLabelIndexes = (length: number): number[] => {
  const candidates = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => Math.round((length - 1) * ratio));
  return [...new Set(candidates)];
};

export function buildMockedChartGeometry(
  points: readonly MockedOhlcPoint[],
  period: ChartPeriodKey,
): MockedChartGeometry {
  if (points.length === 0) {
    throw new Error('Mocked chart geometry requires at least one OHLC point.');
  }

  const rawMin = Math.min(...points.map((point) => point.low));
  const rawMax = Math.max(...points.map((point) => point.high));
  const rawRange = Math.max(1, rawMax - rawMin);
  const priceMin = Math.max(0, rawMin - rawRange * 0.08);
  const priceMax = rawMax + rawRange * 0.08;
  const priceRange = Math.max(1, priceMax - priceMin);
  const maxVolume = Math.max(1, ...points.map((point) => point.volume));
  const slotWidth = (PLOT_RIGHT - PLOT_LEFT) / points.length;
  const bodyWidth = Math.max(2.5, Math.min(12, slotWidth * 0.58));
  const priceY = (value: number) =>
    PRICE_TOP + ((priceMax - value) / priceRange) * (PRICE_BOTTOM - PRICE_TOP);

  const candles = points.map((point, index): CandleGeometry => {
    const openY = priceY(point.open);
    const closeY = priceY(point.close);
    const volumeHeight = Math.max(1.5, (point.volume / maxVolume) * (VOLUME_BOTTOM - VOLUME_TOP));
    return {
      x: PLOT_LEFT + slotWidth * (index + 0.5),
      wickTop: priceY(point.high),
      wickBottom: priceY(point.low),
      bodyTop: Math.min(openY, closeY),
      bodyHeight: Math.max(1.5, Math.abs(closeY - openY)),
      bodyWidth,
      volumeY: VOLUME_BOTTOM - volumeHeight,
      volumeHeight,
      direction: point.close >= point.open ? 'up' : 'down',
    };
  });

  const priceLabels = Array.from({ length: 5 }, (_, index): ChartAxisLabel => {
    const ratio = index / 4;
    return {
      y: PRICE_TOP + ratio * (PRICE_BOTTOM - PRICE_TOP),
      label: formatSampleValue(priceMax - ratio * priceRange),
    };
  });

  const dateLabels = selectLabelIndexes(points.length).map((index): ChartAxisLabel => ({
    x: candles[index].x,
    label: formatDateLabel(points[index].date, period),
  }));

  return {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    plotLeft: PLOT_LEFT,
    plotRight: PLOT_RIGHT,
    priceTop: PRICE_TOP,
    priceBottom: PRICE_BOTTOM,
    volumeTop: VOLUME_TOP,
    volumeBottom: VOLUME_BOTTOM,
    candles,
    priceLabels,
    dateLabels,
  };
}
