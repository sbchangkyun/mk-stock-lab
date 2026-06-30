export type MockedOhlcPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export const CHART_PERIOD_KEYS = ['1d', '1w', '1m', '3m', '1y'] as const;

export type ChartPeriodKey = (typeof CHART_PERIOD_KEYS)[number];

export const CHART_PERIOD_LABELS: Record<ChartPeriodKey, string> = {
  '1d': '1일',
  '1w': '1주',
  '1m': '1개월',
  '3m': '3개월',
  '1y': '1년',
};

const PERIOD_CONFIG: Record<ChartPeriodKey, { count: number; stepMinutes: number }> = {
  '1d': { count: 24, stepMinutes: 30 },
  '1w': { count: 7, stepMinutes: 24 * 60 },
  '1m': { count: 22, stepMinutes: 24 * 60 },
  '3m': { count: 42, stepMinutes: 2 * 24 * 60 },
  '1y': { count: 56, stepMinutes: 7 * 24 * 60 },
};

const MOCKED_ANCHOR_UTC = Date.UTC(2026, 5, 30, 15, 0, 0);

const hashText = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createDeterministicRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const roundPrice = (value: number): number => Math.max(1, Math.round(value));

export function isChartPeriodKey(value: string | undefined): value is ChartPeriodKey {
  return CHART_PERIOD_KEYS.includes(value as ChartPeriodKey);
}

export function createMockedOhlcSeries(
  symbol: string,
  period: ChartPeriodKey,
): MockedOhlcPoint[] {
  const normalizedSymbol = symbol.trim() || '005930';
  const { count, stepMinutes } = PERIOD_CONFIG[period];
  const random = createDeterministicRandom(hashText(`${normalizedSymbol}:${period}:mk-stock-lab`));
  const symbolSeed = hashText(normalizedSymbol);
  const baseline = 28_000 + (symbolSeed % 132_000);
  const volatility = period === '1d' ? 0.006 : period === '1w' ? 0.012 : 0.018;
  const stepMs = stepMinutes * 60 * 1000;
  let previousClose = baseline * (0.96 + random() * 0.08);

  return Array.from({ length: count }, (_, index) => {
    const cycle = Math.sin((index / Math.max(1, count - 1)) * Math.PI * 2 + random());
    const open = roundPrice(previousClose * (1 + (random() - 0.5) * volatility * 0.65));
    const close = roundPrice(open * (1 + (random() - 0.48) * volatility + cycle * volatility * 0.18));
    const wickScale = Math.max(open, close) * volatility * (0.22 + random() * 0.48);
    const high = roundPrice(Math.max(open, close) + wickScale);
    const low = roundPrice(Math.max(1, Math.min(open, close) - wickScale * (0.55 + random() * 0.65)));
    const volume = Math.max(0, Math.round(190_000 + random() * 1_800_000 + Math.abs(close - open) * 34));
    previousClose = close;

    return {
      date: new Date(MOCKED_ANCHOR_UTC - (count - 1 - index) * stepMs).toISOString(),
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume,
    };
  });
}

export function isValidMockedOhlcSeries(points: readonly MockedOhlcPoint[]): boolean {
  return points.length > 0 && points.every((point) =>
    Number.isFinite(point.open) &&
    Number.isFinite(point.high) &&
    Number.isFinite(point.low) &&
    Number.isFinite(point.close) &&
    Number.isFinite(point.volume) &&
    point.high >= Math.max(point.open, point.close) &&
    point.low <= Math.min(point.open, point.close) &&
    point.volume >= 0);
}
