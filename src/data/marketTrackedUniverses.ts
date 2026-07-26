/**
 * Phase 3GJ live market dashboard — closed, server-owned tracked-universe registry.
 *
 * Static metadata only (symbol / country / display name / sector / configured tracked weight /
 * benchmark-proxy identity). NOT live data: no price, no return, no momentum, no trend, no as-of
 * date lives here — every one of those is computed at request time from real OHLCV via
 * src/lib/server/marketDashboard/marketDashboard.ts. `relativeWeight` is a fixed, hand-curated
 * ranking value used only to size treemap tiles; it is never presented as live market
 * capitalization. Every constituent symbol/country pair below was verified to resolve to an
 * active instrument in src/data/chart-ai/universalInstrumentMaster.json before being added (the
 * same authoritative resolver used by findUniversalInstrument). Bounded to <=12 constituents per
 * universe (Phase 3GJ spec section 6); sector order below is by descending relativeWeight, not a
 * quota.
 */

export type MarketUniverseId = 'kospi200' | 'kosdaq150' | 'sp500' | 'nasdaq100';
export type MarketCountry = 'KR' | 'US';

export type TrackedConstituent = {
  symbol: string;
  country: MarketCountry;
  name: string;
  displayName?: string;
  sector: string;
  /** Configured tracked-weight ranking value for treemap tile sizing only — not live market cap. */
  relativeWeight: number;
};

export type BenchmarkProxy = {
  symbol: string;
  country: MarketCountry;
  /** Korean UI label — always names the proxy explicitly, never claims to be the exact index. */
  label: string;
};

export type TrackedUniverse = {
  id: MarketUniverseId;
  label: string;
  country: MarketCountry;
  currency: 'KRW' | 'USD';
  benchmarkProxy: BenchmarkProxy;
  constituents: TrackedConstituent[];
};

export const MARKET_TRACKED_UNIVERSES: TrackedUniverse[] = [
  {
    id: 'kospi200',
    label: 'KOSPI200',
    country: 'KR',
    currency: 'KRW',
    benchmarkProxy: { symbol: '069500', country: 'KR', label: 'KOSPI200 대표 ETF (KODEX 200)' },
    constituents: [
      { symbol: '005930', country: 'KR', name: 'Samsung Electronics', displayName: '삼성전자', sector: 'Technology', relativeWeight: 720 },
      { symbol: '000660', country: 'KR', name: 'SK Hynix', displayName: 'SK하이닉스', sector: 'Technology', relativeWeight: 420 },
      { symbol: '373220', country: 'KR', name: 'LG Energy Solution', displayName: 'LG에너지솔루션', sector: 'Materials', relativeWeight: 235 },
      { symbol: '207940', country: 'KR', name: 'Samsung Biologics', displayName: '삼성바이오로직스', sector: 'Healthcare', relativeWeight: 176 },
      { symbol: '005380', country: 'KR', name: 'Hyundai Motor', displayName: '현대차', sector: 'Industrials', relativeWeight: 168 },
      { symbol: '000270', country: 'KR', name: 'Kia', displayName: '기아', sector: 'Industrials', relativeWeight: 142 },
      { symbol: '068270', country: 'KR', name: 'Celltrion', displayName: '셀트리온', sector: 'Healthcare', relativeWeight: 128 },
      { symbol: '035420', country: 'KR', name: 'NAVER', displayName: '네이버', sector: 'Technology', relativeWeight: 118 },
      { symbol: '105560', country: 'KR', name: 'KB Financial', displayName: 'KB금융', sector: 'Financials', relativeWeight: 118 },
      { symbol: '051910', country: 'KR', name: 'LG Chem', displayName: 'LG화학', sector: 'Materials', relativeWeight: 110 },
      { symbol: '005490', country: 'KR', name: 'POSCO Holdings', displayName: 'POSCO홀딩스', sector: 'Materials', relativeWeight: 104 },
      { symbol: '055550', country: 'KR', name: 'Shinhan Financial', displayName: '신한지주', sector: 'Financials', relativeWeight: 96 },
    ],
  },
  {
    id: 'kosdaq150',
    label: 'KOSDAQ150',
    country: 'KR',
    currency: 'KRW',
    benchmarkProxy: { symbol: '229200', country: 'KR', label: 'KOSDAQ150 대표 ETF (KODEX 코스닥150)' },
    constituents: [
      { symbol: '247540', country: 'KR', name: 'Ecopro BM', displayName: '에코프로비엠', sector: 'Materials', relativeWeight: 230 },
      { symbol: '086520', country: 'KR', name: 'Ecopro', displayName: '에코프로', sector: 'Materials', relativeWeight: 185 },
      { symbol: '196170', country: 'KR', name: 'Alteogen', displayName: '알테오젠', sector: 'Healthcare', relativeWeight: 124 },
      { symbol: '028300', country: 'KR', name: 'HLB', displayName: 'HLB', sector: 'Healthcare', relativeWeight: 86 },
      { symbol: '066970', country: 'KR', name: 'L&F', displayName: '엘앤에프', sector: 'Materials', relativeWeight: 80 },
      { symbol: '058470', country: 'KR', name: 'Leeno Industrial', displayName: '리노공업', sector: 'Technology', relativeWeight: 76 },
      { symbol: '035900', country: 'KR', name: 'JYP Ent.', displayName: 'JYP엔터테인먼트', sector: 'Consumer', relativeWeight: 70 },
      { symbol: '039030', country: 'KR', name: 'EO Technics', displayName: '이오테크닉스', sector: 'Technology', relativeWeight: 68 },
      { symbol: '263750', country: 'KR', name: 'Pearl Abyss', displayName: '펄어비스', sector: 'Technology', relativeWeight: 60 },
      { symbol: '293490', country: 'KR', name: 'Kakao Games', displayName: '카카오게임즈', sector: 'Technology', relativeWeight: 58 },
      { symbol: '214450', country: 'KR', name: 'Pharma Research', displayName: '파마리서치', sector: 'Healthcare', relativeWeight: 54 },
      { symbol: '240810', country: 'KR', name: 'Wonik IPS', displayName: '원익IPS', sector: 'Technology', relativeWeight: 52 },
    ],
  },
  {
    id: 'sp500',
    label: 'S&P500',
    country: 'US',
    currency: 'USD',
    benchmarkProxy: { symbol: 'SPY', country: 'US', label: 'S&P500 대표 ETF (SPDR S&P 500)' },
    constituents: [
      { symbol: 'AAPL', country: 'US', name: 'Apple', sector: 'Technology', relativeWeight: 650 },
      { symbol: 'MSFT', country: 'US', name: 'Microsoft', sector: 'Technology', relativeWeight: 640 },
      { symbol: 'NVDA', country: 'US', name: 'NVIDIA', sector: 'Technology', relativeWeight: 610 },
      { symbol: 'AMZN', country: 'US', name: 'Amazon', sector: 'Consumer', relativeWeight: 260 },
      { symbol: 'GOOGL', country: 'US', name: 'Alphabet', sector: 'Communication', relativeWeight: 240 },
      { symbol: 'META', country: 'US', name: 'Meta', sector: 'Communication', relativeWeight: 210 },
      { symbol: 'TSLA', country: 'US', name: 'Tesla', sector: 'Consumer', relativeWeight: 190 },
      { symbol: 'AVGO', country: 'US', name: 'Broadcom', sector: 'Technology', relativeWeight: 180 },
      { symbol: 'LLY', country: 'US', name: 'Eli Lilly', sector: 'Healthcare', relativeWeight: 170 },
      { symbol: 'JPM', country: 'US', name: 'JPMorgan', sector: 'Financials', relativeWeight: 150 },
      { symbol: 'V', country: 'US', name: 'Visa', sector: 'Financials', relativeWeight: 138 },
      { symbol: 'UNH', country: 'US', name: 'UnitedHealth', sector: 'Healthcare', relativeWeight: 132 },
    ],
  },
  {
    id: 'nasdaq100',
    label: 'NASDAQ100',
    country: 'US',
    currency: 'USD',
    benchmarkProxy: { symbol: 'QQQ', country: 'US', label: 'NASDAQ100 대표 ETF (Invesco QQQ)' },
    constituents: [
      { symbol: 'NVDA', country: 'US', name: 'NVIDIA', sector: 'Semiconductors', relativeWeight: 620 },
      { symbol: 'AAPL', country: 'US', name: 'Apple', sector: 'Mega Cap Tech', relativeWeight: 610 },
      { symbol: 'MSFT', country: 'US', name: 'Microsoft', sector: 'Mega Cap Tech', relativeWeight: 600 },
      { symbol: 'AVGO', country: 'US', name: 'Broadcom', sector: 'Semiconductors', relativeWeight: 300 },
      { symbol: 'AMZN', country: 'US', name: 'Amazon', sector: 'Digital Consumer', relativeWeight: 250 },
      { symbol: 'GOOGL', country: 'US', name: 'Alphabet', sector: 'Mega Cap Tech', relativeWeight: 230 },
      { symbol: 'META', country: 'US', name: 'Meta', sector: 'Mega Cap Tech', relativeWeight: 220 },
      { symbol: 'TSLA', country: 'US', name: 'Tesla', sector: 'Digital Consumer', relativeWeight: 180 },
      { symbol: 'AMD', country: 'US', name: 'AMD', sector: 'Semiconductors', relativeWeight: 120 },
      { symbol: 'COST', country: 'US', name: 'Costco', sector: 'Digital Consumer', relativeWeight: 112 },
      { symbol: 'ADBE', country: 'US', name: 'Adobe', sector: 'Software', relativeWeight: 98 },
      { symbol: 'QCOM', country: 'US', name: 'Qualcomm', sector: 'Semiconductors', relativeWeight: 92 },
    ],
  },
];

export const findTrackedUniverse = (id: string): TrackedUniverse | null =>
  MARKET_TRACKED_UNIVERSES.find((universe) => universe.id === id) ?? null;

export const MARKET_UNIVERSE_IDS: MarketUniverseId[] = MARKET_TRACKED_UNIVERSES.map((universe) => universe.id);
