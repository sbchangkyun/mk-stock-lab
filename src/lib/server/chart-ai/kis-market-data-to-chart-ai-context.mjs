// Phase 3GG-E-INTEGRATE local-only KIS market-data -> Chart AI context adapter.
// Pure, dependency-free .mjs module. Wraps the Phase 3GG-D-FAST local-only Live KIS
// market-data binding's sanitized `current_price` response into a Chart AI market-data
// context object. Only ever reads a fixed allowlist of known field names from its
// input, so raw provider payload keys, header/cookie/session/credential-shaped keys,
// and any field outside the current_price shape are never copied through, regardless
// of what the caller passes in.

export const KIS_CHART_AI_CONTEXT_CONTRACT_VERSION = 'kis-market-data-to-chart-ai-context.v0.1';

export const ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS = Object.freeze([
  'symbol',
  'market',
  'currentPrice',
  'volume',
  'timestamp',
  'sourceStatus',
  'cacheStatus',
  'sanitizedErrorCode',
  'providerLabel',
  'integrationMode',
  'warnings',
]);

const OK_SOURCE_STATUSES = Object.freeze(['ok', 'success']);

/**
 * Throws if `context` contains any field outside ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS.
 * Used both internally (defense in depth) and directly by the integration smoke test.
 */
export function assertNoRawKisPayloadInChartAiContext(context) {
  if (!context || typeof context !== 'object') {
    throw new TypeError('Chart AI KIS context must be a plain object.');
  }
  for (const key of Object.keys(context)) {
    if (!ALLOWED_CHART_AI_KIS_CONTEXT_FIELDS.includes(key)) {
      throw new Error(`Unexpected field "${key}" in Chart AI KIS context.`);
    }
  }
  return true;
}

/**
 * Maps a sanitized Phase 3GG-D-FAST `runLocalOnlyLiveKisMarketDataRequest` response
 * (or an equivalent fail-closed shape) into a Chart AI market-data context. Never
 * throws on unavailable/blocked input -- returns a usable fail-closed context with
 * `warnings` populated instead, so the Chart AI local-only flow always has a safe,
 * renderable object to work with.
 */
export function createChartAiKisMarketDataContext(sanitizedResponse, options = {}) {
  const providerLabel = typeof options.providerLabel === 'string' ? options.providerLabel : 'KIS';
  const integrationMode = typeof options.integrationMode === 'string' ? options.integrationMode : 'local-only';

  const source = sanitizedResponse && typeof sanitizedResponse === 'object' ? sanitizedResponse : {};

  const sourceStatus = typeof source.sourceStatus === 'string' ? source.sourceStatus : 'unavailable';
  const sanitizedErrorCode = typeof source.sanitizedErrorCode === 'string' ? source.sanitizedErrorCode : null;

  const warnings = [];
  if (sanitizedErrorCode) warnings.push(`sanitizedErrorCode:${sanitizedErrorCode}`);
  if (!OK_SOURCE_STATUSES.includes(sourceStatus)) warnings.push('source-unavailable');

  const context = {
    symbol: typeof source.symbol === 'string' ? source.symbol : null,
    market: typeof source.market === 'string' ? source.market : null,
    currentPrice: typeof source.currentPrice === 'number' && Number.isFinite(source.currentPrice) ? source.currentPrice : null,
    volume: typeof source.volume === 'number' && Number.isFinite(source.volume) ? source.volume : null,
    timestamp:
      typeof source.timestamp === 'string' || typeof source.timestamp === 'number' ? source.timestamp : null,
    sourceStatus,
    cacheStatus: typeof source.cacheStatus === 'string' ? source.cacheStatus : 'unknown',
    sanitizedErrorCode,
    providerLabel,
    integrationMode,
    warnings,
  };

  assertNoRawKisPayloadInChartAiContext(context);
  return context;
}
