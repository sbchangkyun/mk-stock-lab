import type {
  ChartAiKisOhlcProviderFixtureName,
  ChartAiKisOhlcProviderShapedBar,
  ChartAiKisOhlcProviderShapedInput,
} from './chartAiKisOhlcProviderBoundaryTypes';

const pad = (value: number): string => String(value).padStart(2, '0');

const buildFixtureDates = (count: number): string[] => {
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(2012, 0, 2));
  while (dates.length < count) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(`${cursor.getUTCFullYear()}${pad(cursor.getUTCMonth() + 1)}${pad(cursor.getUTCDate())}`);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

const round = (value: number): number => Math.round(value);

const buildProviderShapedBars = (count = 260): ChartAiKisOhlcProviderShapedBar[] => {
  const dates = buildFixtureDates(count);
  return dates.map((date, index) => {
    const trend = index * 3;
    const cycle = 750 * Math.sin((2 * Math.PI * index) / 40);
    const close = round(Math.max(1000, 50000 + trend + cycle));
    const open = round(close + 90 * Math.sin((2 * Math.PI * (index + 4)) / 9));
    const high = Math.max(open, close) + 180;
    const low = Math.max(1, Math.min(open, close) - 180);
    const volume = round(1000000 + 25000 * Math.sin((2 * Math.PI * index) / 13));
    return {
      stck_bsop_date: date,
      stck_oprc: String(open),
      stck_hgpr: String(high),
      stck_lwpr: String(low),
      stck_clpr: String(close),
      acml_vol: String(volume),
    };
  });
};

export const buildDeterministicKisOhlcProviderFixture = (): ChartAiKisOhlcProviderShapedInput => ({
  provider: 'kis_ohlc',
  mode: 'fixture_only',
  market: 'KRX',
  symbol: 'KIS_SAFE_FIXTURE',
  bars: buildProviderShapedBars(),
});

export const buildMalformedKisOhlcProviderFixture = (): ChartAiKisOhlcProviderShapedInput => ({
  provider: 'kis_ohlc',
  mode: 'fixture_only',
  market: 'KRX',
  symbol: 'KIS_SAFE_FIXTURE',
  bars: [
    {
      stck_bsop_date: 'malformed',
      stck_oprc: 'not_available',
      stck_hgpr: 'not_available',
      stck_lwpr: 'not_available',
      stck_clpr: 'not_available',
      acml_vol: 'not_available',
    },
  ],
});

export const buildKisOhlcProviderFixture = (
  fixtureName: ChartAiKisOhlcProviderFixtureName,
): ChartAiKisOhlcProviderShapedInput =>
  fixtureName === 'malformed_provider_shape'
    ? buildMalformedKisOhlcProviderFixture()
    : buildDeterministicKisOhlcProviderFixture();
