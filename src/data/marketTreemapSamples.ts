export type MarketUniverseId = 'kospi200' | 'kosdaq150' | 'sp500' | 'nasdaq100' | 'my-portfolio';
export type MarketPeriodId = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';

export type MarketConstituent = {
  symbol: string;
  name: string;
  sector: string;
  value: number;
  baseChangePct: number;
  momentum: number;
  trend: number;
};

export type MarketUniverse = {
  id: MarketUniverseId;
  label: string;
  asOf: string;
  currency: string;
  constituents: MarketConstituent[];
};

export const marketPeriods: Array<{ id: MarketPeriodId; label: string; multiplier: number }> = [
  { id: '1d', label: '1일', multiplier: 1 },
  { id: '1w', label: '1주', multiplier: 1.45 },
  { id: '1m', label: '1개월', multiplier: 2.1 },
  { id: '3m', label: '3개월', multiplier: 2.8 },
  { id: '6m', label: '6개월', multiplier: 3.5 },
  { id: '1y', label: '1년', multiplier: 4.4 },
];

export const marketUniverses: MarketUniverse[] = [
  {
    id: 'kospi200',
    label: 'KOSPI200',
    asOf: 'Sample 2026-06-20',
    currency: 'KRW',
    constituents: [
      { symbol: '005930', name: 'Samsung Electronics', sector: 'Technology', value: 480, baseChangePct: 1.6, momentum: 1.4, trend: 5.8 },
      { symbol: '000660', name: 'SK Hynix', sector: 'Technology', value: 290, baseChangePct: 3.2, momentum: 4.2, trend: 7.4 },
      { symbol: '035420', name: 'NAVER', sector: 'Technology', value: 118, baseChangePct: -0.8, momentum: 1.2, trend: -3.8 },
      { symbol: '035720', name: 'Kakao', sector: 'Technology', value: 72, baseChangePct: -1.6, momentum: -0.9, trend: -4.7 },
      { symbol: '005380', name: 'Hyundai Motor', sector: 'Industrials', value: 168, baseChangePct: 0.7, momentum: -0.4, trend: 3.2 },
      { symbol: '000270', name: 'Kia', sector: 'Industrials', value: 142, baseChangePct: 1.1, momentum: 0.8, trend: 3.8 },
      { symbol: '012330', name: 'Hyundai Mobis', sector: 'Industrials', value: 86, baseChangePct: -0.3, momentum: -0.6, trend: 1.6 },
      { symbol: '034020', name: 'Doosan Enerbility', sector: 'Industrials', value: 64, baseChangePct: 2.4, momentum: 2.6, trend: 4.9 },
      { symbol: '068270', name: 'Celltrion', sector: 'Healthcare', value: 128, baseChangePct: 2.0, momentum: 2.3, trend: 4.2 },
      { symbol: '207940', name: 'Samsung Biologics', sector: 'Healthcare', value: 176, baseChangePct: 0.4, momentum: 0.7, trend: 2.8 },
      { symbol: '302440', name: 'SK Bioscience', sector: 'Healthcare', value: 44, baseChangePct: -2.1, momentum: -2.3, trend: -2.5 },
      { symbol: '105560', name: 'KB Financial', sector: 'Financials', value: 118, baseChangePct: 1.3, momentum: 1.0, trend: 4.1 },
      { symbol: '055550', name: 'Shinhan Financial', sector: 'Financials', value: 96, baseChangePct: 0.9, momentum: 0.6, trend: 3.6 },
      { symbol: '086790', name: 'Hana Financial', sector: 'Financials', value: 82, baseChangePct: -0.5, momentum: -0.2, trend: 2.1 },
      { symbol: '032830', name: 'Samsung Life', sector: 'Financials', value: 70, baseChangePct: 0.2, momentum: -0.1, trend: 1.8 },
      { symbol: '051910', name: 'LG Chem', sector: 'Materials', value: 110, baseChangePct: -1.3, momentum: -1.8, trend: -2.2 },
      { symbol: '373220', name: 'LG Energy Solution', sector: 'Materials', value: 196, baseChangePct: -1.6, momentum: -1.4, trend: -2.8 },
      { symbol: '005490', name: 'POSCO Holdings', sector: 'Materials', value: 104, baseChangePct: 1.8, momentum: 1.5, trend: 3.3 },
      { symbol: '051900', name: 'LG H&H', sector: 'Consumer', value: 56, baseChangePct: -0.9, momentum: -0.6, trend: -1.7 },
      { symbol: '097950', name: 'CJ CheilJedang', sector: 'Consumer', value: 48, baseChangePct: 0.6, momentum: 0.4, trend: 1.4 },
    ],
  },
  {
    id: 'kosdaq150',
    label: 'KOSDAQ150',
    asOf: 'Sample 2026-06-20',
    currency: 'KRW',
    constituents: [
      { symbol: '247540', name: 'Ecopro BM', sector: 'Materials', value: 150, baseChangePct: 2.7, momentum: 3.4, trend: 6.3 },
      { symbol: '086520', name: 'Ecopro', sector: 'Materials', value: 132, baseChangePct: -2.1, momentum: -2.6, trend: -3.4 },
      { symbol: '066970', name: 'L&F', sector: 'Materials', value: 80, baseChangePct: -0.4, momentum: 1.1, trend: -1.7 },
      { symbol: '196170', name: 'Alteogen', sector: 'Healthcare', value: 124, baseChangePct: 3.3, momentum: 4.1, trend: 4.9 },
      { symbol: '091990', name: 'Celltrion Healthcare', sector: 'Healthcare', value: 98, baseChangePct: 1.1, momentum: 0.8, trend: 2.2 },
      { symbol: '214450', name: 'Pharma Research', sector: 'Healthcare', value: 54, baseChangePct: 2.2, momentum: 1.9, trend: 3.1 },
      { symbol: '145020', name: 'Hugel', sector: 'Healthcare', value: 46, baseChangePct: -0.7, momentum: -0.5, trend: 1.2 },
      { symbol: '035900', name: 'JYP Ent.', sector: 'Consumer', value: 70, baseChangePct: 0.2, momentum: 0.5, trend: 1.8 },
      { symbol: '122870', name: 'YG Ent.', sector: 'Consumer', value: 42, baseChangePct: -1.2, momentum: -1.1, trend: -2.4 },
      { symbol: '041510', name: 'SM Ent.', sector: 'Consumer', value: 50, baseChangePct: 1.4, momentum: 1.7, trend: 2.9 },
      { symbol: '112040', name: 'Wemade', sector: 'Technology', value: 44, baseChangePct: -2.5, momentum: -2.1, trend: -3.7 },
      { symbol: '263750', name: 'Pearl Abyss', sector: 'Technology', value: 60, baseChangePct: -0.6, momentum: -0.2, trend: -1.2 },
      { symbol: '293490', name: 'Kakao Games', sector: 'Technology', value: 58, baseChangePct: 1.0, momentum: 1.1, trend: 2.0 },
      { symbol: '058470', name: 'Leeno Industrial', sector: 'Technology', value: 76, baseChangePct: 2.6, momentum: 3.0, trend: 5.0 },
      { symbol: '039030', name: 'EO Technics', sector: 'Technology', value: 68, baseChangePct: 1.9, momentum: 2.4, trend: 4.3 },
      { symbol: '240810', name: 'Wonik IPS', sector: 'Technology', value: 52, baseChangePct: 0.8, momentum: 1.0, trend: 2.5 },
      { symbol: '028300', name: 'HLB', sector: 'Healthcare', value: 86, baseChangePct: -3.0, momentum: -3.6, trend: -4.4 },
      { symbol: '357780', name: 'Soulbrain', sector: 'Materials', value: 48, baseChangePct: 0.5, momentum: 0.2, trend: 1.6 },
      { symbol: '078340', name: 'Com2uS', sector: 'Technology', value: 34, baseChangePct: -1.4, momentum: -1.2, trend: -2.0 },
      { symbol: '095660', name: 'Neowiz', sector: 'Technology', value: 30, baseChangePct: 0.3, momentum: 0.4, trend: 1.1 },
    ],
  },
  {
    id: 'sp500',
    label: 'S&P500',
    asOf: 'Sample 2026-06-20',
    currency: 'USD',
    constituents: [
      { symbol: 'AAPL', name: 'Apple', sector: 'Technology', value: 430, baseChangePct: 0.9, momentum: 0.6, trend: 3.2 },
      { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', value: 420, baseChangePct: 1.5, momentum: 1.4, trend: 4.8 },
      { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', value: 390, baseChangePct: 4.2, momentum: 5.2, trend: 8.1 },
      { symbol: 'AVGO', name: 'Broadcom', sector: 'Technology', value: 180, baseChangePct: 2.6, momentum: 2.7, trend: 6.8 },
      { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer', value: 260, baseChangePct: -0.7, momentum: -1.3, trend: 1.6 },
      { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer', value: 190, baseChangePct: -3.4, momentum: -4.5, trend: -5.9 },
      { symbol: 'HD', name: 'Home Depot', sector: 'Consumer', value: 96, baseChangePct: 0.8, momentum: 0.5, trend: 2.0 },
      { symbol: 'COST', name: 'Costco', sector: 'Consumer', value: 116, baseChangePct: 0.5, momentum: 0.8, trend: 2.5 },
      { symbol: 'META', name: 'Meta', sector: 'Communication', value: 210, baseChangePct: 2.1, momentum: 2.4, trend: 5.4 },
      { symbol: 'GOOGL', name: 'Alphabet', sector: 'Communication', value: 240, baseChangePct: 1.0, momentum: 1.2, trend: 3.6 },
      { symbol: 'NFLX', name: 'Netflix', sector: 'Communication', value: 92, baseChangePct: -0.6, momentum: -0.4, trend: 1.1 },
      { symbol: 'JPM', name: 'JPMorgan', sector: 'Financials', value: 150, baseChangePct: -1.2, momentum: -1.5, trend: -0.8 },
      { symbol: 'BAC', name: 'Bank of America', sector: 'Financials', value: 98, baseChangePct: 0.4, momentum: 0.1, trend: 1.7 },
      { symbol: 'V', name: 'Visa', sector: 'Financials', value: 138, baseChangePct: 1.1, momentum: 1.0, trend: 3.0 },
      { symbol: 'MA', name: 'Mastercard', sector: 'Financials', value: 118, baseChangePct: 0.7, momentum: 0.9, trend: 2.6 },
      { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', value: 170, baseChangePct: 2.5, momentum: 2.8, trend: 5.5 },
      { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare', value: 132, baseChangePct: -0.9, momentum: -0.7, trend: -1.1 },
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', value: 105, baseChangePct: 0.2, momentum: 0.1, trend: 0.8 },
      { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', value: 126, baseChangePct: 1.6, momentum: 1.7, trend: 3.2 },
      { symbol: 'CVX', name: 'Chevron', sector: 'Energy', value: 88, baseChangePct: -0.5, momentum: -0.6, trend: 0.4 },
    ],
  },
  {
    id: 'nasdaq100',
    label: 'NASDAQ100',
    asOf: 'Sample 2026-06-20',
    currency: 'USD',
    constituents: [
      { symbol: 'NVDA', name: 'NVIDIA', sector: 'Semiconductors', value: 420, baseChangePct: 4.2, momentum: 5.2, trend: 8.1 },
      { symbol: 'AVGO', name: 'Broadcom', sector: 'Semiconductors', value: 210, baseChangePct: 2.6, momentum: 2.7, trend: 6.8 },
      { symbol: 'AMD', name: 'AMD', sector: 'Semiconductors', value: 120, baseChangePct: 1.9, momentum: 2.4, trend: 2.9 },
      { symbol: 'QCOM', name: 'Qualcomm', sector: 'Semiconductors', value: 92, baseChangePct: 0.6, momentum: 0.8, trend: 2.2 },
      { symbol: 'AAPL', name: 'Apple', sector: 'Mega Cap Tech', value: 390, baseChangePct: 0.9, momentum: 0.6, trend: 3.2 },
      { symbol: 'MSFT', name: 'Microsoft', sector: 'Mega Cap Tech', value: 385, baseChangePct: 1.5, momentum: 1.4, trend: 4.8 },
      { symbol: 'GOOGL', name: 'Alphabet', sector: 'Mega Cap Tech', value: 230, baseChangePct: 1.0, momentum: 1.2, trend: 3.6 },
      { symbol: 'META', name: 'Meta', sector: 'Mega Cap Tech', value: 220, baseChangePct: 2.1, momentum: 2.4, trend: 5.4 },
      { symbol: 'AMZN', name: 'Amazon', sector: 'Digital Consumer', value: 250, baseChangePct: -0.7, momentum: -1.3, trend: 1.6 },
      { symbol: 'TSLA', name: 'Tesla', sector: 'Digital Consumer', value: 180, baseChangePct: -3.4, momentum: -4.5, trend: -5.9 },
      { symbol: 'COST', name: 'Costco', sector: 'Digital Consumer', value: 112, baseChangePct: 0.5, momentum: 0.8, trend: 2.5 },
      { symbol: 'BKNG', name: 'Booking', sector: 'Digital Consumer', value: 82, baseChangePct: 1.1, momentum: 1.4, trend: 3.1 },
      { symbol: 'ADBE', name: 'Adobe', sector: 'Software', value: 98, baseChangePct: -0.6, momentum: -0.9, trend: -1.6 },
      { symbol: 'CRM', name: 'Salesforce', sector: 'Software', value: 92, baseChangePct: 0.8, momentum: 0.7, trend: 2.3 },
      { symbol: 'INTU', name: 'Intuit', sector: 'Software', value: 88, baseChangePct: 1.2, momentum: 1.1, trend: 2.7 },
      { symbol: 'NOW', name: 'ServiceNow', sector: 'Software', value: 76, baseChangePct: 1.8, momentum: 2.0, trend: 3.8 },
      { symbol: 'AMGN', name: 'Amgen', sector: 'Healthcare', value: 78, baseChangePct: -0.4, momentum: -0.3, trend: 0.7 },
      { symbol: 'GILD', name: 'Gilead', sector: 'Healthcare', value: 64, baseChangePct: 0.2, momentum: 0.1, trend: 1.0 },
      { symbol: 'ISRG', name: 'Intuitive Surgical', sector: 'Healthcare', value: 72, baseChangePct: 2.0, momentum: 2.3, trend: 4.1 },
      { symbol: 'REGN', name: 'Regeneron', sector: 'Healthcare', value: 58, baseChangePct: -1.1, momentum: -1.4, trend: -0.9 },
    ],
  },
  {
    id: 'my-portfolio',
    label: 'My Portfolio',
    asOf: 'Sample 2026-06-20',
    currency: 'Mixed',
    constituents: [
      { symbol: 'AAPL', name: 'Apple', sector: 'US Stocks', value: 38, baseChangePct: 0.9, momentum: 0.6, trend: 3.2 },
      { symbol: '005930', name: 'Samsung Electronics', sector: 'KR Stocks', value: 34, baseChangePct: 1.6, momentum: 1.4, trend: 5.8 },
      { symbol: 'NVDA', name: 'NVIDIA', sector: 'US Stocks', value: 28, baseChangePct: 4.2, momentum: 5.2, trend: 8.1 },
      { symbol: '105560', name: 'KB Financial', sector: 'KR Stocks', value: 18, baseChangePct: 1.3, momentum: 1.0, trend: 4.1 },
      { symbol: 'SPY', name: 'S&P500 ETF', sector: 'ETF', value: 44, baseChangePct: 0.7, momentum: 0.8, trend: 2.7 },
      { symbol: 'QQQ', name: 'NASDAQ ETF', sector: 'ETF', value: 32, baseChangePct: 1.4, momentum: 1.6, trend: 4.2 },
      { symbol: 'GLD', name: 'Gold ETF', sector: 'ETF', value: 16, baseChangePct: -0.3, momentum: -0.2, trend: 0.9 },
      { symbol: '068270', name: 'Celltrion', sector: 'KR Stocks', value: 14, baseChangePct: 2.0, momentum: 2.3, trend: 4.2 },
    ],
  },
];
