/**
 * Phase 3GG-OP-FAST OHLCV normalization (server-side, provider-neutral, pure).
 *
 * Turns provider-agnostic raw-ish daily candle rows into a clean, ascending, deduplicated,
 * validated candle array. No network, no credentials, no env, no raw provider payloads. Importable
 * by the OHLCV route (.ts) and the credential-free smoke (.mjs).
 *
 * Numeric OHLCV IS allowed here -- this is the dedicated chart-data path. The separate LLM summary
 * contract still hides raw price/volume; the two contracts must never be mixed.
 */

export const OHLCV_RANGES = ['1m', '3m', '6m', '1y'];
export const OHLCV_DEFAULT_RANGE = '3m';
export const OHLCV_DEFAULT_INTERVAL = '1d';

/** Approximate calendar lookback per range, used to bound provider requests. */
export const RANGE_LOOKBACK_DAYS = {
  '1m': 31,
  '3m': 93,
  '6m': 186,
  '1y': 372,
};

/** Trading-day cap kept per range so the chart shows the intended window, not the full provider page. */
export const RANGE_MAX_CANDLES = {
  '1m': 23,
  '3m': 66,
  '6m': 130,
  '1y': 260,
};

export const isOhlcvRange = (value) => OHLCV_RANGES.includes(value);

export const normalizeOhlcvRange = (value) => (isOhlcvRange(value) ? value : OHLCV_DEFAULT_RANGE);

const toFiniteNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value.replaceAll(',', '').trim());
    if (value.trim() !== '' && Number.isFinite(numeric)) return numeric;
  }
  return null;
};

/** Normalizes a YYYYMMDD or ISO-ish date string to an ISO-8601 date (UTC midnight). null if unusable. */
const normalizeTimestamp = (value) => {
  const raw = String(value ?? '').trim();
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000Z`;
  }
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  return null;
};

/**
 * A candle is valid when all four prices are finite, volume is a finite non-negative number
 * (zero preserved), and the OHLC relationship holds: low <= min(open,close) and
 * high >= max(open,close), and high >= low.
 */
export const isValidCandle = (candle) => {
  if (!candle || typeof candle !== 'object') return false;
  const { open, high, low, close, volume } = candle;
  if (![open, high, low, close].every((v) => typeof v === 'number' && Number.isFinite(v))) return false;
  if (typeof volume !== 'number' || !Number.isFinite(volume) || volume < 0) return false;
  if (high < low) return false;
  if (low > Math.min(open, close)) return false;
  if (high < Math.max(open, close)) return false;
  return true;
};

/**
 * Normalizes raw daily rows into a clean candle array.
 * Steps: map fields -> drop rows with unusable timestamp/prices -> reject malformed candles ->
 * dedupe by timestamp (last wins) -> sort ascending by timestamp -> cap to the range window.
 *
 * @param rawRows array of { dateTime|timestamp|date, open, high, low, close, volume }
 * @param range one of OHLCV_RANGES
 * @returns { candles, candleCount, rejectedCount }
 */
export const normalizeOhlcvRows = (rawRows, range) => {
  const boundedRange = normalizeOhlcvRange(range);
  const rows = Array.isArray(rawRows) ? rawRows : [];
  let rejectedCount = 0;

  const mapped = [];
  for (const row of rows) {
    const timestamp = normalizeTimestamp(row?.timestamp ?? row?.dateTime ?? row?.date);
    if (!timestamp) {
      rejectedCount += 1;
      continue;
    }
    const candle = {
      timestamp,
      open: toFiniteNumber(row?.open),
      high: toFiniteNumber(row?.high),
      low: toFiniteNumber(row?.low),
      close: toFiniteNumber(row?.close),
      volume: toFiniteNumber(row?.volume) ?? 0,
    };
    if (!isValidCandle(candle)) {
      rejectedCount += 1;
      continue;
    }
    mapped.push(candle);
  }

  const byTimestamp = new Map();
  for (const candle of mapped) byTimestamp.set(candle.timestamp, candle);

  const ascending = [...byTimestamp.values()].sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
  );

  const cap = RANGE_MAX_CANDLES[boundedRange];
  const capped = ascending.length > cap ? ascending.slice(ascending.length - cap) : ascending;

  return { candles: capped, candleCount: capped.length, rejectedCount };
};

/** A renderable series needs at least two clean candles. */
export const isRenderableCandleSeries = (candles) => Array.isArray(candles) && candles.length >= 2;
