/**
 * Phase 3GG-T-FAST Market & Cross-Asset Intelligence — shared constants, labels, thresholds, and the
 * INTERNAL cross-asset instrument registry (client/server-safe, pure).
 *
 * No network, no credentials, no env, no LLM. Every benchmark/sector/commodity mapping is a documented
 * deterministic constant tied to a REAL, fetchable instrument (representative ETF via KIS domestic /
 * overseas). No fabricated index/sector assignment. Missing data is represented honestly (an
 * unavailable sub-context), never as zero.
 */

export const MARKET_INTEL_METHOD_VERSION = 'market-intel-v1-deterministic';

export const MARKET_INTEL_DISCLAIMER =
  '시장·환율·금리·변동성 데이터를 종합한 참고용 환경 분석입니다. 미래 성과를 예측하거나 보장하지 않습니다.';

export const MI_SANITIZED_ERROR_CODES = {
  NONE: 'NONE',
  UNAVAILABLE: 'UNAVAILABLE',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  NOT_SOURCED: 'NOT_SOURCED',
};

/** Build a cross-asset instrument in the shape the OHLCV provider consumes (never user-searchable). */
function usEtf(symbol, exchangeCode, displayName, exchange) {
  return {
    symbol,
    displayName,
    country: 'US',
    exchange: exchange || (exchangeCode === 'NAS' ? 'NASDAQ' : 'NYSE Arca'),
    market: '미국',
    assetType: 'etf',
    currency: 'USD',
    provider: 'kis-overseas',
    providerSymbol: symbol,
    exchangeCode,
    isActive: true,
  };
}
function krEtf(symbol, displayName) {
  return {
    symbol,
    displayName,
    country: 'KR',
    exchange: 'KOSPI',
    market: '국내',
    assetType: 'etf',
    currency: 'KRW',
    provider: 'kis-domestic',
    providerSymbol: symbol,
    exchangeCode: null,
    isActive: true,
  };
}

/** Representative benchmark ETFs (real, fetchable). */
export const BENCHMARKS = {
  KOSPI: krEtf('069500', 'KODEX 200 (KOSPI 대표 ETF)'),
  KOSDAQ: krEtf('229200', 'KODEX 코스닥150 (KOSDAQ 대표 ETF)'),
  SP500: usEtf('SPY', 'AMS', 'SPDR S&P 500 (S&P500 대표 ETF)'),
  NASDAQ100: usEtf('QQQ', 'NAS', 'Invesco QQQ (NASDAQ100 대표 ETF)'),
};

/** Cross-asset (commodity / risk-asset) proxies via US-listed ETFs (real, fetchable). */
export const CROSS_ASSETS = {
  gold: usEtf('GLD', 'AMS', 'SPDR Gold (금 ETF)'),
  oil: usEtf('USO', 'AMS', 'United States Oil (원유 ETF)'),
};

/** Sector ETFs (US, NYSE Arca -> AMS). Only used where a verified GICS mapping exists. */
export const SECTOR_ETFS = {
  technology: usEtf('XLK', 'AMS', 'Technology Select Sector (기술 섹터 ETF)'),
  financials: usEtf('XLF', 'AMS', 'Financial Select Sector (금융 섹터 ETF)'),
  'consumer-discretionary': usEtf('XLY', 'AMS', 'Consumer Discretionary Select (경기소비재 섹터 ETF)'),
  'consumer-staples': usEtf('XLP', 'AMS', 'Consumer Staples Select (필수소비재 섹터 ETF)'),
  energy: usEtf('XLE', 'AMS', 'Energy Select Sector (에너지 섹터 ETF)'),
  healthcare: usEtf('XLV', 'AMS', 'Health Care Select Sector (헬스케어 섹터 ETF)'),
};

/**
 * Curated, source-backed (public GICS classification) US-large-cap -> sector map. Deliberately small
 * and explicit: a sector is assigned ONLY for tickers with a well-known, verifiable classification;
 * every other instrument (incl. all KR) is honestly reported as sector-unavailable (never inferred
 * from names).
 */
export const US_SECTOR_MAP = {
  AAPL: { key: 'technology', name: '기술 (Technology)' },
  MSFT: { key: 'technology', name: '기술 (Technology)' },
  NVDA: { key: 'technology', name: '기술 (Technology)' },
  GOOGL: { key: 'technology', name: '기술 (Technology)' },
  META: { key: 'technology', name: '기술 (Technology)' },
  AMZN: { key: 'consumer-discretionary', name: '경기소비재 (Consumer Discretionary)' },
  TSLA: { key: 'consumer-discretionary', name: '경기소비재 (Consumer Discretionary)' },
  JPM: { key: 'financials', name: '금융 (Financials)' },
  KO: { key: 'consumer-staples', name: '필수소비재 (Consumer Staples)' },
};

/** Relative-strength classification labels (Korean, neutral - never buy/sell). */
export const RS_LABELS = {
  strong_out: '뚜렷한 상대 강세',
  moderate_out: '완만한 상대 강세',
  neutral: '벤치마크와 비슷',
  moderate_under: '완만한 상대 약세',
  strong_under: '뚜렷한 상대 약세',
};

/** Market-regime labels. */
export const REGIME_LABELS = {
  'risk-on': '위험선호',
  neutral: '중립',
  'risk-off': '위험회피',
  'high-vol-transition': '변동성 전환',
  'data-insufficient': '데이터 부족',
};

/** Documented deterministic thresholds (v1). */
export const THRESHOLDS = {
  rsStrongPct: 8,
  rsModeratePct: 2.5,
  volLow: 0.14,
  volNormal: 0.24,
  volHigh: 0.40,
  regimeWeights: { trend: 0.30, momentum: 0.25, volatility: 0.25, commodity: 0.10, fx: 0.10 },
};

export const RS_WINDOWS = [21, 63, 126];
export const RS_WINDOW_LABELS = { 21: '1개월', 63: '3개월', 126: '6개월' };
