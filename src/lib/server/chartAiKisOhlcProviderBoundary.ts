/** Server-only KIS OHLC provider boundary for Phase 3FE-A. Live execution is unavailable. */

import type { OhlcBar } from '../chartSimilarity/types';
import { buildKisOhlcProviderFixture } from './chartAiKisOhlcProviderBoundaryFixtures';
import type {
  ChartAiKisOhlcProviderFixtureName,
  ChartAiKisOhlcProviderMode,
  ChartAiKisOhlcProviderResult,
  ChartAiKisOhlcProviderShapedBar,
  ChartAiKisOhlcProviderShapedInput,
  ChartAiKisOhlcRedactedDiagnostics,
} from './chartAiKisOhlcProviderBoundaryTypes';

const DATE_PATTERN = /^\d{8}$/;

const diagnostics = (
  providerMode: ChartAiKisOhlcProviderMode,
  overrides: Partial<ChartAiKisOhlcRedactedDiagnostics> = {},
): ChartAiKisOhlcRedactedDiagnostics => ({
  provider: 'kis_ohlc',
  providerMode,
  sourceLabel: providerMode === 'fixture_only' ? 'kis_ohlc_fixture_only' : 'kis_ohlc_disabled',
  inputShape: providerMode === 'fixture_only' ? 'provider_shaped_fixture' : 'unavailable',
  liveClient: 'disabled',
  credentialRead: 'none',
  payloadExposure: 'redacted',
  barCountBucket: 'none',
  warnings: [],
  ...overrides,
});

const toIsoDate = (value: string): string | null => {
  if (!DATE_PATTERN.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

const toFiniteNumber = (value: string): number | null => {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeBar = (
  bar: ChartAiKisOhlcProviderShapedBar,
  market: string,
  symbol: string,
): OhlcBar | null => {
  const date = toIsoDate(bar.stck_bsop_date);
  const open = toFiniteNumber(bar.stck_oprc);
  const high = toFiniteNumber(bar.stck_hgpr);
  const low = toFiniteNumber(bar.stck_lwpr);
  const close = toFiniteNumber(bar.stck_clpr);
  const volume = toFiniteNumber(bar.acml_vol);
  if (!date || open === null || high === null || low === null || close === null || volume === null) return null;
  if (close <= 0 || high < Math.max(open, close) || low > Math.min(open, close)) return null;
  return {
    market,
    symbol,
    date,
    open,
    high,
    low,
    close,
    volume,
    adjusted: false,
    source: 'kis-normalized',
  };
};

const bucketBars = (count: number): ChartAiKisOhlcRedactedDiagnostics['barCountBucket'] => {
  if (count <= 0) return 'none';
  if (count < 80) return 'small';
  return 'large';
};

export const normalizeKisOhlcProviderShapedInput = (
  input: ChartAiKisOhlcProviderShapedInput,
): ChartAiKisOhlcProviderResult => {
  if (
    input.provider !== 'kis_ohlc' ||
    input.mode !== 'fixture_only' ||
    input.market !== 'KRX' ||
    input.symbol !== 'KIS_SAFE_FIXTURE' ||
    !Array.isArray(input.bars)
  ) {
    return {
      ok: false,
      status: 'kis_ohlc_malformed',
      bars: [],
      diagnostics: diagnostics('fixture_only', {
        barCountBucket: 'none',
        warnings: ['provider_shape_rejected'],
      }),
    };
  }

  const normalized = input.bars
    .map((bar) => normalizeBar(bar, input.market, input.symbol))
    .filter((bar): bar is OhlcBar => bar !== null);

  if (normalized.length < 80 || normalized.length !== input.bars.length) {
    return {
      ok: false,
      status: 'kis_ohlc_malformed',
      bars: [],
      diagnostics: diagnostics('fixture_only', {
        barCountBucket: bucketBars(normalized.length),
        warnings: ['provider_bars_rejected'],
      }),
    };
  }

  return {
    ok: true,
    status: 'kis_ohlc_fixture_ready',
    bars: normalized,
    diagnostics: diagnostics('fixture_only', {
      barCountBucket: bucketBars(normalized.length),
      warnings: [],
    }),
  };
};

export const runDisabledKisOhlcProviderBoundary = (): ChartAiKisOhlcProviderResult => ({
  ok: false,
  status: 'kis_ohlc_disabled',
  bars: [],
  diagnostics: diagnostics('disabled', {
    warnings: ['live_kis_ohlc_client_disabled'],
  }),
});

export const runFixtureOnlyKisOhlcProviderBoundary = (
  fixtureName: ChartAiKisOhlcProviderFixtureName = 'deterministic_safe',
): ChartAiKisOhlcProviderResult =>
  normalizeKisOhlcProviderShapedInput(buildKisOhlcProviderFixture(fixtureName));

export const assertKisOhlcProviderResultIsSafe = (result: ChartAiKisOhlcProviderResult): void => {
  const publicView = {
    ok: result.ok,
    status: result.status,
    diagnostics: result.diagnostics,
  };
  const serialized = JSON.stringify(publicView);
  const forbidden = /@|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|token|cookie|session|authorization|credential_value|app.?key|app.?secret|raw.?payload|stck_|acml_|"open"|"high"|"low"|"close"|"volume"|stack/i;
  if (forbidden.test(serialized)) throw new Error('KIS OHLC provider boundary exposed unsafe diagnostics.');
};
