// check_kis_runtime_guard_policy.mjs
// Validates KIS runtime guard classification policy using synthetic env values only.
// No network calls. No TypeScript imports. No live KIS, Supabase, SQL, or Vercel operations.

const forbiddenOutputPattern = /access_token|authorization|Bearer|connectionString|jwt|password|supabase\.co/i;

// Mirrors classifyRuntime() in src/lib/server/providers/kisClient.ts
const classifyRuntime = () => {
  const norm = (v) => (typeof v === 'string' ? v.trim() : '');
  const vercelEnv = norm(process.env.VERCEL_ENV).toLowerCase();
  const nodeEnv = norm(process.env.NODE_ENV).toLowerCase();
  if (vercelEnv === 'production') return 'vercel-production';
  if (vercelEnv === 'preview') return 'vercel-preview';
  if (vercelEnv === 'development') return 'vercel-development';
  if (vercelEnv !== '') return 'unknown';
  if (nodeEnv === 'production') return 'node-production';
  return 'local';
};

// Mirrors getKisQuoteConfigReadiness() in src/lib/server/providers/kisClient.ts
const checkKisReadiness = () => {
  const norm = (v) => (typeof v === 'string' ? v.trim() : '');
  const hasValue = (name) => norm(process.env[name]).length > 0;
  const runtimeClass = classifyRuntime();
  const requiredEnvNames = ['KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_BASE_URL'];

  if (runtimeClass === 'vercel-production' || runtimeClass === 'node-production' || runtimeClass === 'unknown') {
    return { ready: false, reason: 'production_not_allowed', runtimeClass };
  }
  if (hasValue('KIS_ACCOUNT_NO')) {
    return { ready: false, reason: 'production_not_allowed', runtimeClass };
  }
  if (runtimeClass === 'vercel-preview' && process.env.KIS_ENABLE_PREVIEW_LIVE_QUOTES !== 'true') {
    return { ready: false, reason: 'preview_guard_required', runtimeClass };
  }
  if (process.env.KIS_ENABLE_LIVE_QUOTES !== 'true') {
    return { ready: false, reason: 'disabled', runtimeClass };
  }
  const missing = requiredEnvNames.filter((n) => !hasValue(n));
  if (missing.length > 0) {
    return { ready: false, reason: 'config_missing', runtimeClass };
  }
  return { ready: true, reason: 'ready', runtimeClass };
};

// Synthetic credential placeholders used to satisfy hasValue() checks — never printed in output
const SYNTHETIC_CREDS = {
  KIS_APP_KEY: 'synthetic-app-key-for-guard-test',
  KIS_APP_SECRET: 'synthetic-app-secret-for-guard-test',
  KIS_BASE_URL: 'synthetic-base-url-for-guard-test',
};

const savedEnv = Object.assign({}, process.env);

const clearKisEnv = () => {
  for (const key of [
    'VERCEL_ENV',
    'NODE_ENV',
    'KIS_ENABLE_LIVE_QUOTES',
    'KIS_ENABLE_PREVIEW_LIVE_QUOTES',
    'KIS_APP_KEY',
    'KIS_APP_SECRET',
    'KIS_BASE_URL',
    'KIS_ACCOUNT_NO',
  ]) {
    delete process.env[key];
  }
};

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in savedEnv)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(savedEnv)) {
    process.env[key] = value;
  }
};

const loggedLines = [];
const log = (line) => {
  loggedLines.push(line);
  console.log(line);
};

let failCount = 0;

const runTest = (name, setup, expected) => {
  clearKisEnv();
  for (const [key, value] of Object.entries(setup)) {
    if (value === null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const result = checkKisReadiness();
  const readyMatch = result.ready === expected.ready;
  const reasonMatch = result.reason === expected.reason;
  const pass = readyMatch && reasonMatch;

  if (!pass) failCount++;

  log(
    `check:kis-runtime-guard step=${name}` +
      ` status=${pass ? 'pass' : 'fail'}` +
      ` expected-ready=${expected.ready}` +
      ` actual-ready=${result.ready}` +
      ` expected-reason=${expected.reason}` +
      ` actual-reason=${result.reason}` +
      ` runtimeClass=${result.runtimeClass}` +
      ` sanitized=true`,
  );
};

const main = () => {
  log('check:kis-runtime-guard step=start status=running sanitized=true');

  // Test 1: Local non-production allowed
  runTest(
    'local-non-production-allowed',
    { NODE_ENV: 'development', KIS_ENABLE_LIVE_QUOTES: 'true', ...SYNTHETIC_CREDS },
    { ready: true, reason: 'ready' },
  );

  // Test 2: Vercel Production blocked unconditionally even with all opt-ins set
  runTest(
    'vercel-production-blocked',
    {
      VERCEL_ENV: 'production',
      NODE_ENV: 'production',
      KIS_ENABLE_LIVE_QUOTES: 'true',
      KIS_ENABLE_PREVIEW_LIVE_QUOTES: 'true',
      ...SYNTHETIC_CREDS,
    },
    { ready: false, reason: 'production_not_allowed' },
  );

  // Test 3: Vercel Preview blocked when KIS_ENABLE_PREVIEW_LIVE_QUOTES is absent
  runTest(
    'vercel-preview-blocked-no-preview-guard',
    { VERCEL_ENV: 'preview', NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', ...SYNTHETIC_CREDS },
    { ready: false, reason: 'preview_guard_required' },
  );

  // Test 4: Vercel Preview allowed when explicit Preview guard is set
  runTest(
    'vercel-preview-allowed-with-preview-guard',
    {
      VERCEL_ENV: 'preview',
      NODE_ENV: 'production',
      KIS_ENABLE_LIVE_QUOTES: 'true',
      KIS_ENABLE_PREVIEW_LIVE_QUOTES: 'true',
      ...SYNTHETIC_CREDS,
    },
    { ready: true, reason: 'ready' },
  );

  // Test 5: Non-Vercel NODE_ENV=production blocked as fallback
  runTest(
    'non-vercel-node-production-blocked',
    { NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', ...SYNTHETIC_CREDS },
    { ready: false, reason: 'production_not_allowed' },
  );

  // Test 6: Unknown VERCEL_ENV value blocked fail-closed
  runTest(
    'unknown-vercel-env-blocked',
    { VERCEL_ENV: 'staging', NODE_ENV: 'production', KIS_ENABLE_LIVE_QUOTES: 'true', ...SYNTHETIC_CREDS },
    { ready: false, reason: 'production_not_allowed' },
  );

  // Test 7: KIS_ACCOUNT_NO present blocks even when all other guards would pass
  runTest(
    'account-no-present-blocked',
    {
      NODE_ENV: 'development',
      KIS_ENABLE_LIVE_QUOTES: 'true',
      ...SYNTHETIC_CREDS,
      KIS_ACCOUNT_NO: 'synthetic-account-no-for-guard-test',
    },
    { ready: false, reason: 'production_not_allowed' },
  );

  const totalTests = 7;
  const passCount = totalTests - failCount;

  log(
    `check:kis-runtime-guard step=summary` +
      ` status=${failCount === 0 ? 'pass' : 'fail'}` +
      ` passed=${passCount}` +
      ` failed=${failCount}` +
      ` total=${totalTests}` +
      ` sanitized=true`,
  );

  const violations = loggedLines.filter((line) => forbiddenOutputPattern.test(line));
  if (violations.length > 0) {
    console.error(`check:kis-runtime-guard step=forbidden-output-check status=fail count=${violations.length} sanitized=true`);
    process.exitCode = 1;
    return;
  }
  log('check:kis-runtime-guard step=forbidden-output-check status=pass sanitized=true');

  if (failCount > 0) {
    process.exitCode = 1;
  }
};

try {
  main();
} finally {
  restoreEnv();
}
