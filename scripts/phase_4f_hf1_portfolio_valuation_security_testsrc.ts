/**
 * Phase 4F-HF1 (PORT-10) test source (bundled + run by
 * scripts/smoke_phase_4f_hf1_functional_high.mjs via esbuild).
 *
 * Exercises the REAL getKisQuoteConfigReadiness() readiness gate in
 * src/lib/server/providers/kisClient.ts directly (proven safe to import in this esbuild+node
 * harness by the existing Phase 3GJ market-dashboard test, which already transitively imports this
 * same module chain) -- never the actual network-calling quote/OHLC functions, so this stays fully
 * credential-free and makes no HTTP calls. Covers the §5 fail-closed matrix for the new
 * allowProductionPortfolioValuationLiveData exception (PORT-10) without weakening any existing
 * Chart AI (3GK) / Market Dashboard (3GJ) exception behavior.
 */

import { getKisQuoteConfigReadiness } from '../src/lib/server/providers/kisClient';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

const KIS_ENV_NAMES = [
  'VERCEL_ENV',
  'NODE_ENV',
  'KIS_APP_KEY',
  'KIS_APP_SECRET',
  'KIS_BASE_URL',
  'KIS_ACCOUNT_NO',
  'KIS_ENABLE_LIVE_QUOTES',
  'KIS_ENABLE_PREVIEW_LIVE_QUOTES',
  'KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD',
  'KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION',
];

const SYNTHETIC_CREDS = {
  KIS_APP_KEY: 'synthetic-app-key-not-real',
  KIS_APP_SECRET: 'synthetic-app-secret-not-real',
  KIS_BASE_URL: 'https://example-synthetic-kis-endpoint.invalid',
};

const savedEnv: Record<string, string | undefined> = {};
for (const name of KIS_ENV_NAMES) savedEnv[name] = process.env[name];

const clearKisEnv = () => {
  for (const name of KIS_ENV_NAMES) delete process.env[name];
};

const restoreEnv = () => {
  for (const name of KIS_ENV_NAMES) {
    const value = savedEnv[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
};

const setEnv = (overrides: Record<string, string>) => {
  clearKisEnv();
  for (const [key, value] of Object.entries(overrides)) process.env[key] = value;
};

const READY_PRODUCTION_BASE = {
  VERCEL_ENV: 'production',
  ...SYNTHETIC_CREDS,
  KIS_ENABLE_LIVE_QUOTES: 'true',
  KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION: 'true',
};

export const runAll = async (): Promise<number> => {
  try {
    // 1. Production + scoped option + feature flag + normal readiness -> ready.
    setEnv(READY_PRODUCTION_BASE);
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: true });
      check('Portfolio exception: full valid combination -> ready', readiness.ready === true);
      check('Portfolio exception: full valid combination -> reason ready', readiness.reason === 'ready');
    }

    // 2. Production WITHOUT the scoped option -> blocked (this is the generic getKisQuoteSnapshot
    //    call shape -- proves the generic wrapper stays fail-closed in Production).
    {
      const readiness = getKisQuoteConfigReadiness();
      check('Portfolio exception: Production without scoped option -> blocked', readiness.ready === false);
      check(
        'Portfolio exception: Production without scoped option -> production_not_allowed',
        readiness.reason === 'production_not_allowed',
      );
    }
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: false });
      check('Portfolio exception: option explicitly false -> blocked', readiness.ready === false);
    }

    // 3. Scoped option true but feature flag false -> blocked.
    setEnv({ ...READY_PRODUCTION_BASE, KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION: 'false' });
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: true });
      check('Portfolio exception: feature flag false -> blocked', readiness.ready === false);
      check('Portfolio exception: feature flag false -> production_not_allowed', readiness.reason === 'production_not_allowed');
    }

    // 4. Scoped option true but feature flag missing entirely -> blocked.
    setEnv({
      VERCEL_ENV: 'production',
      ...SYNTHETIC_CREDS,
      KIS_ENABLE_LIVE_QUOTES: 'true',
    });
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: true });
      check('Portfolio exception: feature flag missing -> blocked', readiness.ready === false);
      check('Portfolio exception: feature flag missing -> production_not_allowed', readiness.reason === 'production_not_allowed');
    }

    // 5. KIS_ACCOUNT_NO present -> blocked even with the Portfolio option + flag both true.
    setEnv({ ...READY_PRODUCTION_BASE, KIS_ACCOUNT_NO: '12345678-01' });
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: true });
      check('Portfolio exception: KIS_ACCOUNT_NO present -> blocked', readiness.ready === false);
      check(
        'Portfolio exception: KIS_ACCOUNT_NO present -> production_not_allowed (hard safety, not config_missing)',
        readiness.reason === 'production_not_allowed',
      );
    }

    // 6. Missing KIS credentials (even with option + flag + account absent) -> blocked (config_missing).
    setEnv({
      VERCEL_ENV: 'production',
      KIS_ENABLE_LIVE_QUOTES: 'true',
      KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION: 'true',
      // KIS_APP_KEY / KIS_APP_SECRET / KIS_BASE_URL intentionally omitted.
    });
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: true });
      check('Portfolio exception: missing KIS credentials -> blocked', readiness.ready === false);
      check('Portfolio exception: missing KIS credentials -> config_missing', readiness.reason === 'config_missing');
    }

    // 7. KIS_ENABLE_LIVE_QUOTES disabled (everything else valid) -> blocked (disabled).
    setEnv({
      VERCEL_ENV: 'production',
      ...SYNTHETIC_CREDS,
      KIS_ENABLE_LIVE_QUOTES: 'false',
      KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION: 'true',
    });
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: true });
      check('Portfolio exception: KIS_ENABLE_LIVE_QUOTES disabled -> blocked', readiness.ready === false);
      check('Portfolio exception: KIS_ENABLE_LIVE_QUOTES disabled -> reason disabled', readiness.reason === 'disabled');
    }

    // 8. Regression: outside Production, existing behavior (no Portfolio option needed) is unchanged.
    setEnv({
      VERCEL_ENV: '',
      NODE_ENV: 'development',
      ...SYNTHETIC_CREDS,
      KIS_ENABLE_LIVE_QUOTES: 'true',
    });
    {
      const readiness = getKisQuoteConfigReadiness();
      check('Portfolio exception: local/dev runtime unaffected by new flag -> ready', readiness.ready === true);
    }

    // 9. Regression: the other two independent Production exceptions (3GK Chart AI, 3GJ Market
    //    Dashboard) still work unchanged and are not accidentally coupled to the new Portfolio flag.
    setEnv({
      VERCEL_ENV: 'production',
      ...SYNTHETIC_CREDS,
      KIS_ENABLE_LIVE_QUOTES: 'true',
      // KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION intentionally absent/false.
    });
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionChartAiLiveData: true });
      check('Chart AI exception: still independently functional (unaffected by Portfolio flag)', readiness.ready === true);
    }
    setEnv({
      VERCEL_ENV: 'production',
      ...SYNTHETIC_CREDS,
      KIS_ENABLE_LIVE_QUOTES: 'true',
      KIS_ENABLE_PRODUCTION_MARKET_DASHBOARD: 'true',
    });
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionMarketDashboardLiveData: true });
      check('Market Dashboard exception: still independently functional', readiness.ready === true);
    }
    {
      // Portfolio option alone (without ITS OWN flag) must not accidentally ride on the market
      // dashboard flag being true -- exceptions must not cross-satisfy each other.
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: true });
      check(
        'Portfolio exception: does not cross-satisfy via the Market Dashboard flag',
        readiness.ready === false && readiness.reason === 'production_not_allowed',
      );
    }

    // 10. Secret hygiene: no forbidden secret-shaped values ever appear in a readiness result.
    setEnv(READY_PRODUCTION_BASE);
    {
      const readiness = getKisQuoteConfigReadiness({ allowProductionPortfolioValuationLiveData: true });
      const serialized = JSON.stringify(readiness);
      check(
        'Portfolio exception: readiness result never echoes raw credential values',
        !serialized.includes(SYNTHETIC_CREDS.KIS_APP_KEY) &&
          !serialized.includes(SYNTHETIC_CREDS.KIS_APP_SECRET) &&
          !/access_token|authorization|Bearer/i.test(serialized),
      );
    }
  } finally {
    restoreEnv();
  }

  console.log(`\nphase_4f_hf1_portfolio_valuation_security_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
