/**
 * Pure, deterministic helpers for the Phase 3GG-T-HF4-FAST chart interaction layer.
 * No DOM, no window, no fetch, no wall-clock reads, no randomness, no environment access,
 * no provider imports, no secrets.
 */

export function candleDirection(candle) {
  if (!candle || !Number.isFinite(candle.open) || !Number.isFinite(candle.close)) return 'flat';
  if (candle.close > candle.open) return 'up';
  if (candle.close < candle.open) return 'down';
  return 'flat';
}

export function computeChange(candles, index) {
  if (!Array.isArray(candles) || index == null || index < 0 || index >= candles.length) {
    return { amount: null, percent: null, available: false };
  }
  const current = candles[index];
  const previous = index > 0 ? candles[index - 1] : null;
  if (!current || !Number.isFinite(current.close) || !previous || !Number.isFinite(previous.close) || previous.close === 0) {
    return { amount: null, percent: null, available: false };
  }
  const amount = current.close - previous.close;
  const percent = (amount / previous.close) * 100;
  return { amount, percent, available: true };
}

export function formatPrice(value, currency) {
  if (!Number.isFinite(value)) return '—';
  if (currency === 'USD') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function formatSignedPrice(value, currency) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return currency === 'USD' ? '$0.00' : '0';
  const arrow = value > 0 ? '▲' : '▼';
  const abs = Math.abs(value);
  const magnitude = currency === 'USD'
    ? `$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : Math.round(abs).toLocaleString('ko-KR');
  return `${arrow}${magnitude}`;
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatVolume(value) {
  if (!Number.isFinite(value) || value < 0) return '—';
  return Math.round(value).toLocaleString('ko-KR');
}

export function formatDate(value) {
  if (typeof value !== 'string' || value.length < 10) return '—';
  const year = value.slice(0, 4);
  const month = value.slice(5, 7);
  const day = value.slice(8, 10);
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return '—';
  return `${year}.${month}.${day}`;
}

export function estimateTurnover(close, volume) {
  if (!Number.isFinite(close) || !Number.isFinite(volume) || close < 0 || volume < 0) return null;
  return close * volume;
}

export function formatEstimatedTurnoverKrw(value) {
  if (!Number.isFinite(value) || value < 0) return null;
  const JO = 1e12;
  const EOK = 1e8;
  if (value >= JO) return `${(value / JO).toFixed(2)}조원`;
  if (value >= EOK) return `${(value / EOK).toFixed(1)}억원`;
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function nearestCandleIndex(pointerX, plotLeft, plotWidth, count) {
  if (!Number.isFinite(count) || count <= 0) return -1;
  if (count === 1) return 0;
  if (!Number.isFinite(plotWidth) || plotWidth <= 0) return 0;
  if (!Number.isFinite(pointerX) || !Number.isFinite(plotLeft)) return 0;
  const slot = plotWidth / count;
  const raw = Math.floor((pointerX - plotLeft) / slot);
  return Math.min(count - 1, Math.max(0, raw));
}

export function valueToY(value, min, max, plotTop, plotHeight) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    !Number.isFinite(plotTop) ||
    !Number.isFinite(plotHeight)
  ) {
    return plotTop;
  }
  const range = max - min;
  if (range <= 0) return plotTop + plotHeight / 2;
  const ratio = (max - value) / range;
  const clamped = Math.min(1, Math.max(0, ratio));
  return plotTop + clamped * plotHeight;
}

export function buildCandleDisplayDatum(candles, index, currency) {
  if (!Array.isArray(candles) || index == null || index < 0 || index >= candles.length) return null;
  const candle = candles[index];
  if (!candle) return null;
  const change = computeChange(candles, index);
  const direction = candleDirection(candle);
  const turnover = currency === 'USD' ? null : estimateTurnover(candle.close, candle.volume);
  return {
    date: candle.date ?? null,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    direction,
    change: change.amount,
    changePercent: change.percent,
    changeAvailable: change.available,
    turnoverEstimate: turnover,
    formatted: {
      date: formatDate(candle.date),
      open: formatPrice(candle.open, currency),
      high: formatPrice(candle.high, currency),
      low: formatPrice(candle.low, currency),
      close: formatPrice(candle.close, currency),
      volume: formatVolume(candle.volume),
      change: change.available ? formatSignedPrice(change.amount, currency) : '—',
      changePercent: change.available ? formatPercent(change.percent) : '—',
      turnoverEstimate: turnover != null && currency !== 'USD' ? formatEstimatedTurnoverKrw(turnover) : null,
    },
  };
}
