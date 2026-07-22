import type { OhlcBar } from '../chartSimilarity/types';

export type ChartAiKisOhlcProviderIdentity = 'kis_ohlc';

export type ChartAiKisOhlcProviderMode = 'disabled' | 'fixture_only';

export type ChartAiKisOhlcProviderFixtureName = 'deterministic_safe' | 'malformed_provider_shape';

export type ChartAiKisOhlcProviderShapedBar = {
  stck_bsop_date: string;
  stck_oprc: string;
  stck_hgpr: string;
  stck_lwpr: string;
  stck_clpr: string;
  acml_vol: string;
};

export type ChartAiKisOhlcProviderShapedInput = {
  provider: ChartAiKisOhlcProviderIdentity;
  mode: 'fixture_only';
  market: 'KRX';
  symbol: 'KIS_SAFE_FIXTURE';
  bars: ChartAiKisOhlcProviderShapedBar[];
};

export type ChartAiKisOhlcRedactedDiagnostics = {
  provider: ChartAiKisOhlcProviderIdentity;
  providerMode: ChartAiKisOhlcProviderMode;
  sourceLabel: 'kis_ohlc_fixture_only' | 'kis_ohlc_disabled';
  inputShape: 'provider_shaped_fixture' | 'unavailable';
  liveClient: 'disabled';
  credentialRead: 'none';
  payloadExposure: 'redacted';
  barCountBucket: 'none' | 'small' | 'large';
  warnings: string[];
};

export type ChartAiKisOhlcProviderSuccess = {
  ok: true;
  status: 'kis_ohlc_fixture_ready';
  bars: OhlcBar[];
  diagnostics: ChartAiKisOhlcRedactedDiagnostics;
};

export type ChartAiKisOhlcProviderBlocked = {
  ok: false;
  status: 'kis_ohlc_disabled' | 'kis_ohlc_malformed' | 'kis_ohlc_fail_closed';
  bars: [];
  diagnostics: ChartAiKisOhlcRedactedDiagnostics;
};

export type ChartAiKisOhlcProviderResult =
  | ChartAiKisOhlcProviderSuccess
  | ChartAiKisOhlcProviderBlocked;

export type ChartAiKisOhlcProviderBoundarySmokeReport = {
  ok: boolean;
  assertionCount: number;
  fixtureCount: number;
  failures: string[];
};
