/**
 * Phase 3GL — shared Home live-market orchestrator (server-only).
 *
 * Serves BOTH the Home page's 9-item ticker belt and its 4-card Market Snapshot from ONE closed,
 * server-owned instrument registry and ONE bounded-concurrency resolution pass per request — the
 * snapshot is a subset of the same resolved ticker items, so a single request never triggers a
 * duplicate provider call for a symbol that appears in both surfaces.
 *
 * Reuses the existing shared KIS OHLCV orchestration (fetchLongHistoryOhlcv), the existing
 * authoritative instrument resolver (findUniversalInstrument), the existing bounded-concurrency
 * helper and freshness diagnosis (marketDashboard.ts), and the existing non-KIS FX source
 * (fetchUsdKrwContext) for USD/KRW. No new KIS endpoint/TR ID and no new FX provider are introduced
 * here. Every proxy item is honestly labeled with its basis (e.g. "대표 ETF 기준") — never presented
 * as the literal underlying index/commodity. An individual item that cannot be resolved degrades to
 * status 'unavailable' on its own; it never fails the whole response.
 */

import { findUniversalInstrument } from '../chart-ai/universal-instrument-search.mjs';
import { fetchLongHistoryOhlcv } from '../chart-ai/universalOhlcvProvider';
import { fetchUsdKrwContext } from '../chart-ai/marketIntelligence/crossAssetProvider.mjs';
import { mapWithConcurrency, resolveFreshnessDiagnosis, MARKET_DASHBOARD_SANITIZED_ERROR_CODES } from '../marketDashboard/marketDashboard';
import { computePeriodReturnPct } from '../../market-dashboard/metrics';

const CONCURRENCY_LIMIT = 3;
/** Only ~1 week of daily bars is needed to compute a 1-day change; a small margin covers holidays. */
const HOME_TICKER_TARGET_BARS = 10;

type HomeTickerCountry = 'KR' | 'US';

type HomeTickerRegistryEntry = {
  id: string;
  label: string;
  kind: 'kis' | 'fx';
  symbol?: string;
  country?: HomeTickerCountry;
  currency: 'KRW' | 'USD';
  /** Korean UI disclosure — always names the proxy/source explicitly, never claims to be the literal index. */
  basisLabel: string;
  periodLabel: string;
};

/**
 * Closed 9-item registry (Phase 3GL spec). Every KIS-backed symbol was already verified to resolve
 * in src/data/chart-ai/universalInstrumentMaster.json; the KR benchmark proxies (069500 / 229200) are
 * the same ones already used by the Phase 3GJ market dashboard/overview.
 */
const HOME_TICKER_REGISTRY: HomeTickerRegistryEntry[] = [
  { id: 'sp500', label: 'S&P 500', kind: 'kis', symbol: 'SPY', country: 'US', currency: 'USD', basisLabel: '대표 ETF 기준 (SPDR S&P 500 ETF)', periodLabel: '전일 대비' },
  { id: 'nasdaq100', label: '나스닥 100', kind: 'kis', symbol: 'QQQ', country: 'US', currency: 'USD', basisLabel: '대표 ETF 기준 (Invesco QQQ)', periodLabel: '전일 대비' },
  { id: 'dowjones', label: '다우존스', kind: 'kis', symbol: 'DIA', country: 'US', currency: 'USD', basisLabel: '대표 ETF 기준 (SPDR Dow Jones Industrial Average ETF)', periodLabel: '전일 대비' },
  { id: 'kospi', label: '코스피', kind: 'kis', symbol: '069500', country: 'KR', currency: 'KRW', basisLabel: '대표 ETF 기준 (KODEX 200)', periodLabel: '전일 대비' },
  { id: 'kosdaq', label: '코스닥', kind: 'kis', symbol: '229200', country: 'KR', currency: 'KRW', basisLabel: '대표 ETF 기준 (KODEX 코스닥150)', periodLabel: '전일 대비' },
  { id: 'usdkrw', label: '원/달러', kind: 'fx', currency: 'KRW', basisLabel: 'Frankfurter(ECB) 공시 기준환율', periodLabel: '최근 1개월 변동' },
  { id: 'dollarindex', label: '달러 인덱스', kind: 'kis', symbol: 'UUP', country: 'US', currency: 'USD', basisLabel: '대표 ETF 기준 (Invesco DB US Dollar Index Bullish Fund)', periodLabel: '전일 대비' },
  { id: 'gold', label: '금', kind: 'kis', symbol: 'GLD', country: 'US', currency: 'USD', basisLabel: '대표 ETF 기준 (SPDR Gold Shares)', periodLabel: '전일 대비' },
  { id: 'wti', label: 'WTI 원유', kind: 'kis', symbol: 'USO', country: 'US', currency: 'USD', basisLabel: '대표 ETF 기준 (United States Oil Fund)', periodLabel: '전일 대비' },
];

/** The 4-card Market Snapshot is a fixed subset of the same 9 resolved items — never a second fetch. */
const HOME_SNAPSHOT_IDS = ['kospi', 'kosdaq', 'sp500', 'nasdaq100'];

export type HomeLiveMarketItem = {
  id: string;
  label: string;
  status: 'ok' | 'unavailable';
  price: number | null;
  changeAmount: number | null;
  changePct: number | null;
  /** YYYYMMDD, or null when unavailable. */
  asOf: string | null;
  currency: 'KRW' | 'USD';
  basisLabel: string;
  periodLabel: string;
};

export type HomeLiveMarketResult = {
  ok: boolean;
  generatedAt: string;
  ticker: HomeLiveMarketItem[];
  snapshot: HomeLiveMarketItem[];
  sanitizedErrorCode: string;
};

export type HomeLiveMarketDeps = {
  fetchLongHistoryOhlcv: typeof fetchLongHistoryOhlcv;
  findUniversalInstrument: typeof findUniversalInstrument;
  fetchUsdKrwContext: typeof fetchUsdKrwContext;
  now: () => number;
};

const defaultDeps: HomeLiveMarketDeps = {
  fetchLongHistoryOhlcv,
  findUniversalInstrument,
  fetchUsdKrwContext,
  now: () => Date.now(),
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Accepts either a full ISO timestamp or a bare YYYY-MM-DD date and returns YYYYMMDD, or null. */
const toYyyymmdd = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  return `${match[1]}${match[2]}${match[3]}`;
};

const unavailableItem = (entry: HomeTickerRegistryEntry): HomeLiveMarketItem => ({
  id: entry.id,
  label: entry.label,
  status: 'unavailable',
  price: null,
  changeAmount: null,
  changePct: null,
  asOf: null,
  currency: entry.currency,
  basisLabel: entry.basisLabel,
  periodLabel: entry.periodLabel,
});

const resolveKisTickerItem = async (
  entry: HomeTickerRegistryEntry,
  deps: HomeLiveMarketDeps,
  allowProductionMarketDashboardLiveData: boolean,
): Promise<HomeLiveMarketItem> => {
  const instrument = deps.findUniversalInstrument(entry.symbol as string, entry.country as HomeTickerCountry);
  if (!instrument) return unavailableItem(entry);

  const result = await deps.fetchLongHistoryOhlcv({
    instrument,
    allowProductionMarketDashboardLiveData,
    targetBars: HOME_TICKER_TARGET_BARS,
  });

  const { freshness } = resolveFreshnessDiagnosis(result, deps.now());
  if (freshness === 'unavailable') return unavailableItem(entry);

  const closes = result.candles
    .map((candle) => candle.close)
    .filter((close) => Number.isFinite(close) && close > 0);
  if (closes.length < 2) return unavailableItem(entry);

  const lastClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];

  return {
    id: entry.id,
    label: entry.label,
    status: 'ok',
    price: round2(lastClose),
    changeAmount: round2(lastClose - prevClose),
    changePct: computePeriodReturnPct(closes, '1d'),
    asOf: toYyyymmdd(result.historyRange?.end ?? null),
    currency: entry.currency,
    basisLabel: entry.basisLabel,
    periodLabel: entry.periodLabel,
  };
};

const resolveFxTickerItem = async (
  entry: HomeTickerRegistryEntry,
  deps: HomeLiveMarketDeps,
): Promise<HomeLiveMarketItem> => {
  const fx = await deps.fetchUsdKrwContext({ now: deps.now });
  if (!fx.available || fx.rate === null) return unavailableItem(entry);

  return {
    id: entry.id,
    label: entry.label,
    status: 'ok',
    price: fx.rate,
    changeAmount: null,
    changePct: fx.changePct,
    asOf: toYyyymmdd(fx.asOf),
    currency: entry.currency,
    basisLabel: entry.basisLabel,
    periodLabel: entry.periodLabel,
  };
};

const resolveHomeTickerItem = (
  entry: HomeTickerRegistryEntry,
  deps: HomeLiveMarketDeps,
  allowProductionMarketDashboardLiveData: boolean,
): Promise<HomeLiveMarketItem> =>
  entry.kind === 'fx'
    ? resolveFxTickerItem(entry, deps)
    : resolveKisTickerItem(entry, deps, allowProductionMarketDashboardLiveData);

/**
 * Resolves all 9 registry items at concurrency<=3 and derives the 4-card snapshot as a subset of the
 * same results. Returns ok:false only when every single item failed to resolve (nothing renderable);
 * any partial coverage still returns ok:true so the client can render what succeeded and mark the
 * rest 'unavailable' individually.
 */
export const getHomeLiveMarket = async (
  input: { allowProductionMarketDashboardLiveData?: boolean } = {},
  deps: Partial<HomeLiveMarketDeps> = {},
): Promise<HomeLiveMarketResult> => {
  const resolvedDeps: HomeLiveMarketDeps = { ...defaultDeps, ...deps };
  const allow = input.allowProductionMarketDashboardLiveData === true;

  const ticker = await mapWithConcurrency(HOME_TICKER_REGISTRY, CONCURRENCY_LIMIT, (entry) =>
    resolveHomeTickerItem(entry, resolvedDeps, allow),
  );

  const generatedAt = new Date(resolvedDeps.now()).toISOString();
  const successfulCount = ticker.filter((item) => item.status === 'ok').length;

  if (successfulCount === 0) {
    return {
      ok: false,
      generatedAt,
      ticker,
      snapshot: [],
      sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_UNAVAILABLE,
    };
  }

  const byId = new Map(ticker.map((item) => [item.id, item]));
  const snapshot = HOME_SNAPSHOT_IDS.map((id) => byId.get(id)).filter((item): item is HomeLiveMarketItem => Boolean(item));

  return {
    ok: true,
    generatedAt,
    ticker,
    snapshot,
    sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.NONE,
  };
};
