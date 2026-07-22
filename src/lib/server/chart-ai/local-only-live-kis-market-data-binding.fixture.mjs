// Deterministic fixtures for local-only-live-kis-market-data-binding.mjs.
// No real network, no real credential value, no timestamps generated here
// (callers pass explicit nowMs). Used by the Phase 3GG-D-FAST smoke script.

export const FIXTURE_LOCAL_HOSTNAMES = Object.freeze(['localhost', '127.0.0.1', '::1']);

export const FIXTURE_NON_LOCAL_HOSTNAMES = Object.freeze([
  'example.com',
  'my-app.vercel.app',
  'internal-qa.example.com',
  'beta.example.com',
]);

export const FIXTURE_SYMBOL = '005930';
export const FIXTURE_CATEGORY = 'current_price';

export const FIXTURE_FORBIDDEN_CATEGORIES = Object.freeze([
  'order',
  'cancel_order',
  'modify_order',
  'account',
  'balance',
  'funds',
  'buying_power',
  'sellable_quantity',
  'profit_loss',
  'deposit_withdrawal',
  'trading_history',
  'portfolio_holdings',
  'personal',
]);

export const FIXTURE_UNLISTED_CATEGORY = 'daily_ohlc';

export const buildFixtureLocalEnv = (overrides = {}) => ({ NODE_ENV: 'development', ...overrides });

export const buildFixtureCredentialFlags = (overrides = {}) => ({
  KIS_APP_KEY: true,
  KIS_APP_SECRET: true,
  KIS_BASE_URL: true,
  ...overrides,
});

export const buildFixtureHasEnvValue = (flags = buildFixtureCredentialFlags()) => (name) => Boolean(flags[name]);

export const createFixtureSuccessTransport = ({ callLog, currentPrice = 70000, volume = 123456 } = {}) => async ({ symbol, category }) => {
  if (Array.isArray(callLog)) callLog.push({ symbol, category });
  return { ok: true, data: { currentPrice, volume } };
};

export const createFixtureNeverResolvingTransport = ({ callLog } = {}) => ({ symbol, category }) => {
  if (Array.isArray(callLog)) callLog.push({ symbol, category });
  return new Promise(() => {});
};

export const createFixtureMalformedTransport = ({ callLog } = {}) => async ({ symbol, category }) => {
  if (Array.isArray(callLog)) callLog.push({ symbol, category });
  return { ok: true, data: { currentPrice: 'not-a-number' } };
};

export const createFixtureUnavailableTransport = ({ callLog } = {}) => async ({ symbol, category }) => {
  if (Array.isArray(callLog)) callLog.push({ symbol, category });
  return { ok: false, code: 'PROVIDER_UNAVAILABLE' };
};

export const createFailIfCalledTransport = (label = 'transport') => async () => {
  throw new Error(`${label} must not be called for this scenario.`);
};

export const buildFixtureRequestInput = (overrides = {}) => ({
  hostname: 'localhost',
  env: buildFixtureLocalEnv(),
  symbol: FIXTURE_SYMBOL,
  category: FIXTURE_CATEGORY,
  nowMs: 1_750_000_000_000,
  ...overrides,
});
