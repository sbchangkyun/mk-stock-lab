/**
 * Phase 3GL — shared Home live-market orchestrator (server-only).
 *
 * Serves BOTH the Home page's 9-item ticker belt and its 9-card Market Snapshot from ONE closed,
 * server-owned instrument registry and ONE bounded-concurrency resolution pass per request — the
 * snapshot is the same resolved ticker items (in a fixed display order/labeling), so a single request
 * never triggers a duplicate provider call for a symbol that appears in both surfaces.
 *
 * Phase 3GL-HF1: each KIS-backed item is resolved quote-first (getKisDomesticQuoteSnapshot /
 * getKisOverseasQuoteSnapshot — the same existing endpoints/TR IDs already used elsewhere, never a
 * new one) with a same-item OHLCV fallback (fetchLongHistoryOhlcv) only when the quote call did not
 * succeed. Every item carries a closed `dataBasis` (current_quote | latest_close | reference_fx |
 * unavailable) and `freshness` (fresh | cached | stale | unavailable) so the UI can render an honest
 * basis disclosure. Reuses the existing authoritative instrument resolver (findUniversalInstrument),
 * the existing bounded-concurrency helper and freshness diagnosis (marketDashboard.ts), and the
 * existing non-KIS FX source (fetchUsdKrwContext) for USD/KRW. No new KIS endpoint/TR ID and no new FX
 * provider are introduced here. Every proxy item is honestly labeled with its basis (e.g. "대표 ETF
 * 기준") — never presented as the literal underlying index/commodity. An individual item that cannot
 * be resolved degrades to status 'unavailable' on its own; it never fails the whole response.
 *
 * Phase 3GL-HF3 §6-§7: every item also carries a compact historical sparkline for the Snapshot mini
 * line chart. For the 8 KIS-backed items, `fetchLongHistoryOhlcv` is now called unconditionally (once
 * per item, not only as a quote-failure fallback) — the SAME fetched result is reused both for the
 * legacy fallback-headline computation (only used when the quote call failed) and for the sparkline
 * (attempted independently of the quote outcome). A valid current quote is never replaced by a
 * historical close merely because the sparkline could not be built. For USD/KRW, a new sibling
 * function `fetchUsdKrwSparklineSeries` (same Frankfurter/ECB source, no new provider) supplies a
 * reference-FX series. Relies on `fetchLongHistoryOhlcv`'s own existing 6-hour in-process cache
 * (keyed by instrument + targetBars) rather than adding a second sparkline-specific cache layer, since
 * it already exceeds the spec's 15-minute recommendation.
 */

import { findUniversalInstrument } from '../chart-ai/universal-instrument-search.mjs';
import { fetchLongHistoryOhlcv } from '../chart-ai/universalOhlcvProvider';
import { fetchUsdKrwContext, fetchUsdKrwSparklineSeries } from '../chart-ai/marketIntelligence/crossAssetProvider.mjs';
import { getKisDomesticQuoteSnapshot, getKisOverseasQuoteSnapshot } from '../providers/kisClient';
import type { QuoteSnapshot } from '../providers/types';
import { mapWithConcurrency, resolveFreshnessDiagnosis, MARKET_DASHBOARD_SANITIZED_ERROR_CODES } from '../marketDashboard/marketDashboard';
import { computePeriodReturnPct } from '../../market-dashboard/metrics';

const CONCURRENCY_LIMIT = 3;
/**
 * Phase 3GL-HF3: bumped from 10 to comfortably cover both the legacy 1-day-change fallback calc and a
 * 20-point daily-close sparkline (daily OHLCV bars are trading days only, so a small margin over 20
 * covers provider paging quirks without over-fetching).
 */
const HOME_HISTORY_TARGET_BARS = 30;
const HOME_SPARKLINE_POINTS = 20;
const KIS_SPARKLINE_PERIOD_LABEL = '최근 20거래일 종가 추이';
const FX_SPARKLINE_PERIOD_LABEL = '최근 20공시일 환율 추이';

type HomeTickerCountry = 'KR' | 'US';

type HomeDataBasis = 'current_quote' | 'latest_close' | 'reference_fx' | 'unavailable';
type HomeFreshness = 'fresh' | 'cached' | 'stale' | 'unavailable';
type HomeSparklineStatus = 'ok' | 'unavailable';
type HomeSparklineBasis = 'daily_close' | 'reference_fx' | 'unavailable';

export type HomeSparklinePoint = { date: string; value: number };

type HomeSparklineFields = {
  sparklineStatus: HomeSparklineStatus;
  sparklineBasis: HomeSparklineBasis;
  sparklinePeriodLabel: string | null;
  sparkline: HomeSparklinePoint[];
};

const UNAVAILABLE_SPARKLINE: HomeSparklineFields = {
  sparklineStatus: 'unavailable',
  sparklineBasis: 'unavailable',
  sparklinePeriodLabel: null,
  sparkline: [],
};

type HomeTickerRegistryEntry = {
  id: string;
  label: string;
  kind: 'kis' | 'fx';
  symbol?: string;
  country?: HomeTickerCountry;
  currency: 'KRW' | 'USD';
  /** Korean UI disclosure of the proxy/source — always names it explicitly, never claims to be the literal index. */
  proxyLabel: string;
  periodLabel: string;
};

/**
 * Closed 9-item registry (Phase 3GL spec). Every KIS-backed symbol was already verified to resolve
 * in src/data/chart-ai/universalInstrumentMaster.json; the KR benchmark proxies (069500 / 229200) are
 * the same ones already used by the Phase 3GJ market dashboard/overview.
 */
const HOME_TICKER_REGISTRY: HomeTickerRegistryEntry[] = [
  { id: 'sp500', label: 'S&P 500', kind: 'kis', symbol: 'SPY', country: 'US', currency: 'USD', proxyLabel: '대표 ETF 기준 (SPDR S&P 500 ETF)', periodLabel: '전일 대비' },
  { id: 'nasdaq100', label: '나스닥 100', kind: 'kis', symbol: 'QQQ', country: 'US', currency: 'USD', proxyLabel: '대표 ETF 기준 (Invesco QQQ)', periodLabel: '전일 대비' },
  { id: 'dowjones', label: '다우존스', kind: 'kis', symbol: 'DIA', country: 'US', currency: 'USD', proxyLabel: '대표 ETF 기준 (SPDR Dow Jones Industrial Average ETF)', periodLabel: '전일 대비' },
  { id: 'kospi', label: '코스피', kind: 'kis', symbol: '069500', country: 'KR', currency: 'KRW', proxyLabel: '대표 ETF 기준 (KODEX 200)', periodLabel: '전일 대비' },
  { id: 'kosdaq', label: '코스닥', kind: 'kis', symbol: '229200', country: 'KR', currency: 'KRW', proxyLabel: '대표 ETF 기준 (KODEX 코스닥150)', periodLabel: '전일 대비' },
  { id: 'usdkrw', label: '원/달러', kind: 'fx', currency: 'KRW', proxyLabel: 'Frankfurter(ECB) 최근 공시환율', periodLabel: '최근 1개월 변동' },
  { id: 'dollarindex', label: '달러 인덱스', kind: 'kis', symbol: 'UUP', country: 'US', currency: 'USD', proxyLabel: '대표 ETF 기준 (Invesco DB US Dollar Index Bullish Fund)', periodLabel: '전일 대비' },
  { id: 'gold', label: '금', kind: 'kis', symbol: 'GLD', country: 'US', currency: 'USD', proxyLabel: '대표 ETF 기준 (SPDR Gold Shares)', periodLabel: '전일 대비' },
  { id: 'wti', label: 'WTI 원유', kind: 'kis', symbol: 'USO', country: 'US', currency: 'USD', proxyLabel: '대표 ETF 기준 (United States Oil Fund)', periodLabel: '전일 대비' },
];

/**
 * Phase 3GL-HF3 §4: the Market Snapshot now covers all 9 resolved ticker items (grown from the HF1
 * 4-card subset) in this exact required identity/order — still never a second fetch, since it is the
 * same resolved `ticker` array re-labeled for Snapshot display.
 */
const HOME_SNAPSHOT_IDS = ['kospi', 'kosdaq', 'sp500', 'nasdaq100', 'dowjones', 'usdkrw', 'dollarindex', 'gold', 'wti'];

/** Closed Snapshot-only display registry (Phase 3GL-HF1 §9, extended HF3 §4) — distinct from the ticker belt's compact labels. */
const HOME_SNAPSHOT_DISPLAY_LABELS: Record<string, string> = {
  kospi: 'KOSPI200',
  kosdaq: 'KOSDAQ150',
  sp500: 'S&P500',
  nasdaq100: 'NASDAQ100',
  dowjones: 'DOW30',
  usdkrw: 'USD/KRW',
  dollarindex: '달러 인덱스',
  gold: '금',
  wti: 'WTI 원유',
};

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
  dataBasis: HomeDataBasis;
  freshness: HomeFreshness;
} & HomeSparklineFields;

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
  fetchUsdKrwSparklineSeries: typeof fetchUsdKrwSparklineSeries;
  getKisDomesticQuoteSnapshot: typeof getKisDomesticQuoteSnapshot;
  getKisOverseasQuoteSnapshot: typeof getKisOverseasQuoteSnapshot;
  now: () => number;
};

const defaultDeps: HomeLiveMarketDeps = {
  fetchLongHistoryOhlcv,
  findUniversalInstrument,
  fetchUsdKrwContext,
  fetchUsdKrwSparklineSeries,
  getKisDomesticQuoteSnapshot,
  getKisOverseasQuoteSnapshot,
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

// Phase 3GL-HF2: the current-price quote endpoints are current-price SNAPSHOT reads (called once per
// Home request), not the KIS WebSocket real-time tick stream -- '조회 기준' rather than '실시간' avoids
// implying tick-by-tick real-time delivery.
const CURRENT_QUOTE_BASIS_TEXT = 'KIS 현재가 조회 기준';
const LATEST_CLOSE_BASIS_TEXT = '최근 거래일 종가 기준';

const unavailableItem = (entry: HomeTickerRegistryEntry): HomeLiveMarketItem => ({
  id: entry.id,
  label: entry.label,
  status: 'unavailable',
  price: null,
  changeAmount: null,
  changePct: null,
  asOf: null,
  currency: entry.currency,
  basisLabel: entry.proxyLabel,
  periodLabel: entry.periodLabel,
  dataBasis: 'unavailable',
  freshness: 'unavailable',
  ...UNAVAILABLE_SPARKLINE,
});

/**
 * Maps a successful current-price QuoteSnapshot into a Home ticker item.
 *
 * Phase 3GL-HF2 §7: the provider layer (kisClient.ts) is the authoritative source of a trustworthy
 * sign, but this is a final defensive check before the value reaches the browser -- if the two
 * normalized fields still disagree in direction, the amount is nulled rather than shipped
 * contradictory. changePct is kept as-is since it already came from the provider's normalization.
 */
const toCurrentQuoteItem = (entry: HomeTickerRegistryEntry, quote: QuoteSnapshot): HomeLiveMarketItem => {
  const changeAmount = quote.change !== null ? round2(quote.change) : null;
  const changePct = quote.changePct;
  const directionsConflict =
    changeAmount !== null &&
    changePct !== null &&
    changeAmount !== 0 &&
    changePct !== 0 &&
    Math.sign(changeAmount) !== Math.sign(changePct);

  return {
    id: entry.id,
    label: entry.label,
    status: 'ok',
    price: round2(quote.price),
    changeAmount: directionsConflict ? null : changeAmount,
    changePct,
    asOf: toYyyymmdd(quote.asOf) ?? toYyyymmdd(new Date(quote.asOf).toISOString()),
    currency: entry.currency,
    basisLabel: `${entry.proxyLabel} · ${CURRENT_QUOTE_BASIS_TEXT}`,
    periodLabel: entry.periodLabel,
    dataBasis: 'current_quote',
    freshness: 'fresh',
    ...UNAVAILABLE_SPARKLINE,
  };
};

const mapOhlcvFreshness = (freshness: ReturnType<typeof resolveFreshnessDiagnosis>['freshness']): HomeFreshness => {
  if (freshness === 'fresh') return 'fresh';
  if (freshness === 'stale-but-usable') return 'stale';
  return 'unavailable';
};

type LongHistoryOhlcvResult = Awaited<ReturnType<typeof fetchLongHistoryOhlcv>>;

/**
 * OHLCV-derived fallback for one KIS-backed item — only ever used after a current-quote attempt did
 * not succeed. Phase 3GL-HF3: takes the already-fetched history result (fetched exactly once per item
 * by the caller) instead of fetching it itself, so this and the sparkline below never issue a second
 * history request for the same symbol. Sets dataBasis 'latest_close'.
 */
const buildOhlcvFallbackItem = (
  entry: HomeTickerRegistryEntry,
  result: LongHistoryOhlcvResult,
  nowMs: number,
): HomeLiveMarketItem => {
  const { freshness } = resolveFreshnessDiagnosis(result, nowMs);
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
    basisLabel: `${entry.proxyLabel} · ${LATEST_CLOSE_BASIS_TEXT}`,
    periodLabel: entry.periodLabel,
    dataBasis: 'latest_close',
    freshness: mapOhlcvFreshness(freshness),
    ...UNAVAILABLE_SPARKLINE,
  };
};

/**
 * Phase 3GL-HF3 §5-§6: builds the Snapshot mini-line-chart series from the SAME OHLCV history result
 * already fetched for this item (never a second request). Independent of quote/fallback outcome — a
 * failed or thin history here only marks the sparkline unavailable, it never touches the headline
 * price. Dedupes by date defensively, sorts ascending, and keeps only the most recent 20 valid
 * (finite, positive) daily closes; fewer than 2 valid points is reported as unavailable.
 */
const buildKisSparkline = (result: LongHistoryOhlcvResult, nowMs: number): HomeSparklineFields => {
  const { freshness } = resolveFreshnessDiagnosis(result, nowMs);
  if (freshness === 'unavailable') return UNAVAILABLE_SPARKLINE;

  const byDate = new Map<string, number>();
  for (const candle of result.candles) {
    const date = toYyyymmdd(candle.timestamp);
    if (date && Number.isFinite(candle.close) && candle.close > 0) {
      byDate.set(date, round2(candle.close));
    }
  }

  const sparkline: HomeSparklinePoint[] = Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .slice(-HOME_SPARKLINE_POINTS)
    .map(([date, value]) => ({ date, value }));

  if (sparkline.length < 2) return UNAVAILABLE_SPARKLINE;

  return { sparklineStatus: 'ok', sparklineBasis: 'daily_close', sparklinePeriodLabel: KIS_SPARKLINE_PERIOD_LABEL, sparkline };
};

/**
 * Quote-first resolution for one KIS-backed registry item (Phase 3GL-HF1 §6, extended HF3 §6). Calls
 * the existing current-price quote snapshot, then unconditionally fetches OHLCV history exactly once
 * (regardless of the quote outcome) — reused both as the legacy fallback-headline source (only used
 * when the quote call did not yield a usable price) and, independently, as the sparkline source. A
 * fully unavailable headline stays unavailable (with an unavailable sparkline); otherwise the
 * independently-computed sparkline fields are merged in without ever altering the headline price.
 */
const resolveKisTickerItem = async (
  entry: HomeTickerRegistryEntry,
  deps: HomeLiveMarketDeps,
  allowProductionMarketDashboardLiveData: boolean,
): Promise<HomeLiveMarketItem> => {
  const instrument = deps.findUniversalInstrument(entry.symbol as string, entry.country as HomeTickerCountry);
  if (!instrument) return unavailableItem(entry);

  const quoteResult =
    entry.country === 'KR'
      ? await deps.getKisDomesticQuoteSnapshot(
          { market: 'KR', symbol: instrument.symbol },
          { allowProductionMarketDashboardLiveData },
        )
      : await deps.getKisOverseasQuoteSnapshot(
          { symbol: instrument.providerSymbol ?? instrument.symbol, exchangeCode: instrument.exchangeCode ?? '' },
          { allowProductionMarketDashboardLiveData },
        );

  const quoteOk = quoteResult.ok && Number.isFinite(quoteResult.data.price) && quoteResult.data.price > 0;

  const historyResult = await deps.fetchLongHistoryOhlcv({
    instrument,
    allowProductionMarketDashboardLiveData,
    targetBars: HOME_HISTORY_TARGET_BARS,
  });

  const headline = quoteOk
    ? toCurrentQuoteItem(entry, quoteResult.data)
    : buildOhlcvFallbackItem(entry, historyResult, deps.now());

  if (headline.status === 'unavailable') return headline;

  return { ...headline, ...buildKisSparkline(historyResult, deps.now()) };
};

const resolveFxTickerItem = async (
  entry: HomeTickerRegistryEntry,
  deps: HomeLiveMarketDeps,
): Promise<HomeLiveMarketItem> => {
  const fx = await deps.fetchUsdKrwContext({ now: deps.now });
  if (!fx.available || fx.rate === null) return unavailableItem(entry);

  // Phase 3GL-HF3 §7: an independent reference-FX sparkline call — a failure here never affects the
  // already-resolved headline rate/change above.
  const sparklineResult = await deps.fetchUsdKrwSparklineSeries({ now: deps.now });
  const sparklineFields: HomeSparklineFields = sparklineResult.available
    ? { sparklineStatus: 'ok', sparklineBasis: 'reference_fx', sparklinePeriodLabel: FX_SPARKLINE_PERIOD_LABEL, sparkline: sparklineResult.series }
    : UNAVAILABLE_SPARKLINE;

  return {
    id: entry.id,
    label: entry.label,
    status: 'ok',
    price: fx.rate,
    changeAmount: null,
    changePct: fx.changePct,
    asOf: toYyyymmdd(fx.asOf),
    currency: entry.currency,
    basisLabel: entry.proxyLabel,
    periodLabel: entry.periodLabel,
    dataBasis: 'reference_fx',
    freshness: 'fresh',
    ...sparklineFields,
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

/** Builds the fixed 9-card Snapshot from the resolved ticker items, applying the Snapshot-only display labels. */
const buildSnapshot = (ticker: HomeLiveMarketItem[]): HomeLiveMarketItem[] => {
  const byId = new Map(ticker.map((item) => [item.id, item]));
  return HOME_SNAPSHOT_IDS.map((id) => {
    const item = byId.get(id);
    const entry = HOME_TICKER_REGISTRY.find((candidate) => candidate.id === id) as HomeTickerRegistryEntry;
    const base = item ?? unavailableItem(entry);
    return { ...base, label: HOME_SNAPSHOT_DISPLAY_LABELS[id] ?? base.label };
  });
};

/**
 * Resolves all 9 registry items at concurrency<=3 and derives the 9-card snapshot from the same
 * results. Returns ok:false only when every single item failed to resolve (nothing renderable); any
 * partial coverage still returns ok:true so the client can render what succeeded and mark the rest
 * 'unavailable' individually. The Snapshot array is always exactly 9 items, even under total failure
 * (Phase 3GL-HF1 §9, extended HF3 §4) — unavailable cards stay present rather than being dropped.
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
  const snapshot = buildSnapshot(ticker);

  if (successfulCount === 0) {
    return {
      ok: false,
      generatedAt,
      ticker,
      snapshot,
      sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.MARKET_DATA_UNAVAILABLE,
    };
  }

  return {
    ok: true,
    generatedAt,
    ticker,
    snapshot,
    sanitizedErrorCode: MARKET_DASHBOARD_SANITIZED_ERROR_CODES.NONE,
  };
};
