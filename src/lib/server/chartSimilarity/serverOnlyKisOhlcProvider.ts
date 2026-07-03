/**
 * Server-only KIS OHLC provider foundation (Phase 3EY-A).
 *
 * `getServerOnlyKisOhlcForSimilarity` is a safe foundation only: it never calls `fetch`, never
 * imports a KIS provider/client module, never reads `process.env` or `.env`, and never returns
 * real market data. When the supplied policy is disabled (the default), it returns a
 * `disabled` result. When the policy is enabled, it still returns `not_implemented`, because
 * live provider wiring is deferred to a later, separately authorized phase.
 */

import type {
  NormalizedDailyOhlcInput,
  NormalizedDailyOhlcMeta,
  ServerOnlyKisOhlcPolicy,
  ServerOnlyKisOhlcRequest,
  ServerOnlyKisOhlcResult,
} from './kisOhlcProviderTypes';
import { buildDefaultServerOnlyKisOhlcPolicy } from './kisOhlcProviderPolicy';
import type { OhlcBar } from '../../chartSimilarity/types';

const MAX_LOOKBACK_YEARS = 5;
const MAX_BARS = 1500;

export type ServerOnlyKisOhlcRequestValidation = {
  ok: boolean;
  request: ServerOnlyKisOhlcRequest;
  errorCode?: string;
  reason?: string;
};

const clampPositiveInt = (value: number, max: number, fallback: number): number => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  const rounded = Math.floor(value);
  return Math.min(rounded, max);
};

/**
 * Normalizes a candidate request into a safe shape. Out-of-range numeric fields are clamped
 * rather than rejected; structurally invalid fields are left as-is for `validate` to reject.
 */
export const normalizeServerOnlyKisOhlcRequest = (
  request: ServerOnlyKisOhlcRequest,
): ServerOnlyKisOhlcRequest => ({
  market: request.market,
  symbol: typeof request.symbol === 'string' ? request.symbol.trim() : request.symbol,
  assetType: request.assetType,
  timeframe: request.timeframe,
  lookbackYears: clampPositiveInt(request.lookbackYears, MAX_LOOKBACK_YEARS, 1),
  maxBars: clampPositiveInt(request.maxBars, MAX_BARS, MAX_BARS),
  purpose: request.purpose,
});

/** Validates a normalized request. Returns a structured result instead of throwing. */
export const validateServerOnlyKisOhlcRequest = (
  request: ServerOnlyKisOhlcRequest,
): ServerOnlyKisOhlcRequestValidation => {
  if (typeof request.symbol !== 'string' || request.symbol.length === 0) {
    return { ok: false, request, errorCode: 'invalid_symbol', reason: 'symbol must be a non-empty string.' };
  }
  if (request.market !== 'KR') {
    return { ok: false, request, errorCode: 'invalid_market', reason: 'market must be "KR".' };
  }
  if (request.timeframe !== 'daily') {
    return { ok: false, request, errorCode: 'invalid_timeframe', reason: 'timeframe must be "daily".' };
  }
  if (request.assetType !== 'stock' && request.assetType !== 'etf') {
    return { ok: false, request, errorCode: 'invalid_asset_type', reason: 'assetType must be "stock" or "etf".' };
  }
  if (request.purpose !== 'chart-similarity') {
    return { ok: false, request, errorCode: 'invalid_purpose', reason: 'purpose must be "chart-similarity".' };
  }
  return { ok: true, request };
};

const buildDisabledResult = (request: ServerOnlyKisOhlcRequest): ServerOnlyKisOhlcResult => ({
  ok: false,
  status: 'disabled',
  request,
  bars: [],
  warnings: ['Real KIS OHLC execution is feature-flag off. This is a foundation-only response.'],
  safeMessage: 'KIS OHLC execution is currently disabled by policy.',
});

const buildNotImplementedResult = (request: ServerOnlyKisOhlcRequest): ServerOnlyKisOhlcResult => ({
  ok: false,
  status: 'not_implemented',
  request,
  bars: [],
  warnings: ['Live KIS OHLC provider wiring is deferred to a later, separately authorized phase.'],
  safeMessage: 'KIS OHLC execution is not yet implemented.',
});

const buildBlockedResult = (
  request: ServerOnlyKisOhlcRequest,
  validation: ServerOnlyKisOhlcRequestValidation,
): ServerOnlyKisOhlcResult => ({
  ok: false,
  status: 'blocked',
  request,
  bars: [],
  warnings: [`Request rejected: ${validation.reason ?? 'invalid request.'}`],
  errorCode: validation.errorCode,
  safeMessage: 'KIS OHLC request could not be processed.',
});

/**
 * Safe foundation entry point. Never calls `fetch`, never imports a KIS provider/client
 * module, never reads environment or secret values, and never returns real market data.
 */
export const getServerOnlyKisOhlcForSimilarity = async (
  request: ServerOnlyKisOhlcRequest,
  policy: ServerOnlyKisOhlcPolicy = buildDefaultServerOnlyKisOhlcPolicy(),
): Promise<ServerOnlyKisOhlcResult> => {
  const normalized = normalizeServerOnlyKisOhlcRequest(request);
  const validation = validateServerOnlyKisOhlcRequest(normalized);
  if (!validation.ok) {
    return buildBlockedResult(normalized, validation);
  }
  if (!policy.enabled) {
    return buildDisabledResult(normalized);
  }
  return buildNotImplementedResult(normalized);
};

/**
 * Pure adapter placeholder: maps an already-normalized, safe daily bar input into the chart
 * similarity engine's `OhlcBar` shape. It never accepts a raw KIS payload and never calls a
 * provider. Invalid rows are dropped with a warning rather than throwing.
 */
export const toSimilarityOhlcBarsFromNormalizedDailyBars = (
  input: NormalizedDailyOhlcInput[],
  meta: NormalizedDailyOhlcMeta,
): { bars: OhlcBar[]; warnings: string[] } => {
  const warnings: string[] = [];
  const bars: OhlcBar[] = [];

  for (const row of input) {
    const values = [row.open, row.high, row.low, row.close];
    const isFiniteRow =
      typeof row.date === 'string' &&
      row.date.length > 0 &&
      values.every((value) => typeof value === 'number' && Number.isFinite(value));

    if (!isFiniteRow) {
      warnings.push(`Dropped invalid normalized bar for date "${String(row.date)}".`);
      continue;
    }

    bars.push({
      market: meta.market,
      symbol: meta.symbol,
      date: row.date,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: typeof row.volume === 'number' && Number.isFinite(row.volume) ? row.volume : null,
      adjusted: false,
      source: 'kis-normalized',
    });
  }

  return { bars, warnings };
};
