/**
 * Phase 3EC owner-run local smoke for the Phase 3EB mixed-currency preview API.
 *
 * Default mode is a no-network dry-run. Active local execution is owner-only
 * and requires every Phase 3EC guard below to equal YES.
 */

const requiredGuards = {
  PHASE_3EC_OWNER_SMOKE: 'YES',
  PHASE_3EC_ALLOW_LOCAL_API: 'YES',
  PHASE_3EC_ALLOW_MOCKED_FX: 'YES',
  PHASE_3EC_ALLOW_MIXED_CURRENCY: 'YES',
  PHASE_3EC_SANITIZED_OUTPUT_ONLY: 'YES',
};

const API_TARGET = 'http://127.0.0.1:4321/api/portfolio/valuation';

const safeFieldKeys = new Set([
  'step', 'status', 'guardGroup', 'target', 'httpStatus', 'source', 'previewMode',
  'mixedCurrencyPreview', 'mockedFx', 'rowCount', 'unavailableRows',
  'unsupportedCurrencyRows', 'missingQuoteRows', 'fxSource', 'fxStaleState',
  'rateValuePrinted', 'aggregateState', 'valuesPrinted', 'code', 'result',
  'missingGuardCount',
]);
const safeNumericKeys = new Set([
  'httpStatus', 'rowCount', 'unavailableRows', 'unsupportedCurrencyRows',
  'missingQuoteRows', 'missingGuardCount',
]);
const safeBooleanKeys = new Set([
  'mixedCurrencyPreview', 'mockedFx', 'rateValuePrinted', 'valuesPrinted',
]);
const safeStringValues = {
  step: new Set(['dry-run', 'preflight', 'api-call', 'contract', 'rows', 'fx', 'aggregate', 'provider-leakage']),
  status: new Set(['ready', 'pass', 'fail']),
  guardGroup: new Set(['owner-local-mocked']),
  target: new Set(['local-api']),
  source: new Set(['live']),
  previewMode: new Set(['owner']),
  fxSource: new Set(['mocked']),
  fxStaleState: new Set(['sample']),
  aggregateState: new Set(['null', 'available']),
  code: new Set([
    'LOCAL_SERVER_UNAVAILABLE',
    'HTTP_STATUS_UNEXPECTED',
    'CONTRACT_MISMATCH',
    'MOCKED_FX_NOT_PRESENT',
    'UNSAFE_OUTPUT_BLOCKED',
    'PROVIDER_LEAKAGE_DETECTED',
    'RAW_VALUE_LEAKAGE_DETECTED',
    'PRODUCTION_RUNTIME_BLOCKED',
  ]),
  result: new Set(['PASS', 'FAIL']),
};

const fixedUnsafeOutputLine =
  'phase3ec step=provider-leakage status=fail code=UNSAFE_OUTPUT_BLOCKED sanitized=true';

const emitSafe = (fields) => {
  const parts = ['phase3ec'];
  for (const [key, value] of Object.entries(fields)) {
    if (!safeFieldKeys.has(key)) {
      process.stdout.write(`${fixedUnsafeOutputLine}\n`);
      throw new Error('Blocked output field.');
    }
    if (safeNumericKeys.has(key)) {
      if (!Number.isInteger(value) || value < 0) {
        process.stdout.write(`${fixedUnsafeOutputLine}\n`);
        throw new Error('Blocked output number.');
      }
    } else if (safeBooleanKeys.has(key)) {
      if (typeof value !== 'boolean') {
        process.stdout.write(`${fixedUnsafeOutputLine}\n`);
        throw new Error('Blocked output boolean.');
      }
    } else if (!safeStringValues[key]?.has(value)) {
      process.stdout.write(`${fixedUnsafeOutputLine}\n`);
      throw new Error('Blocked output value.');
    }
    parts.push(`${key}=${value}`);
  }
  parts.push('sanitized=true');
  process.stdout.write(`${parts.join(' ')}\n`);
};

const guardStatus = Object.entries(requiredGuards).map(
  ([name, expected]) => process.env[name] === expected,
);
const activeApproved = guardStatus.every(Boolean);

const isProductionRuntime = () => {
  const nodeEnv = (process.env.NODE_ENV ?? '').trim().toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV ?? '').trim().toLowerCase();
  return nodeEnv === 'production' || vercelEnv === 'production';
};

const buildRequestBody = () => ({
  portfolioId: 'phase3ec-owner-preview-sample',
  source: 'live',
  previewMode: 'owner',
  allowLiveQuotes: true,
  allowMockedFx: true,
  fxMode: 'mocked',
  baseCurrency: 'KRW',
  positions: [
    {
      market: 'KR',
      symbol: '005930',
      assetType: 'stock',
      buyPrice: 1,
      quantity: 1,
      currency: 'KRW',
    },
    {
      market: 'US',
      symbol: 'US-SAMPLE',
      assetType: 'stock',
      buyPrice: 1,
      quantity: 1,
      currency: 'USD',
    },
  ],
});

const providerLeakMarkers = [
  ['provider', 'Meta'].join(''),
  ['raw', 'Payload'].join(''),
  ['authorization'].join(''),
  ['access', '_token'].join(''),
  ['app', 'key'].join(''),
  ['app', 'secret'].join(''),
  ['stck', '_'].join(''),
  ['prdy', '_'].join(''),
  ['rt', '_cd'].join(''),
  ['acml', '_'].join(''),
];

const containsProviderLeakage = (responseText) => {
  const normalized = responseText.toLowerCase();
  return providerLeakMarkers.some((marker) => normalized.includes(marker.toLowerCase()));
};

const emitFailure = (step, code, extra = {}) => {
  emitSafe({ step, status: 'fail', code, ...extra });
  emitSafe({ result: 'FAIL' });
  process.exitCode = 1;
};

const runDryRun = () => {
  const missingGuardCount = guardStatus.filter((ready) => !ready).length;
  emitSafe({
    step: 'dry-run',
    status: 'ready',
    guardGroup: 'owner-local-mocked',
    missingGuardCount,
  });
  emitSafe({ step: 'preflight', status: 'pass', target: 'local-api' });
  emitSafe({ result: 'PASS' });
};

const runActiveSmoke = async () => {
  if (isProductionRuntime()) {
    emitFailure('preflight', 'PRODUCTION_RUNTIME_BLOCKED');
    return;
  }

  emitSafe({ step: 'preflight', status: 'pass', target: 'local-api' });
  const requestBody = buildRequestBody();

  let response;
  try {
    response = await fetch(API_TARGET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch {
    emitFailure('api-call', 'LOCAL_SERVER_UNAVAILABLE');
    return;
  }

  if (response.status !== 200) {
    emitFailure('api-call', 'HTTP_STATUS_UNEXPECTED', { httpStatus: response.status });
    return;
  }
  emitSafe({ step: 'api-call', status: 'pass', httpStatus: response.status });

  let responseText;
  let parsed;
  try {
    responseText = await response.text();
    parsed = JSON.parse(responseText);
  } catch {
    emitFailure('contract', 'CONTRACT_MISMATCH');
    return;
  }

  if (containsProviderLeakage(responseText)) {
    emitFailure('provider-leakage', 'PROVIDER_LEAKAGE_DETECTED');
    return;
  }

  const meta = parsed?.data?.meta;
  const valuation = parsed?.data?.valuation;
  const rows = valuation?.rows;
  const contractOk =
    parsed?.ok === true &&
    parsed?.data?.source === 'live' &&
    parsed?.data?.previewMode === 'owner' &&
    meta?.mixedCurrencyPreview === true &&
    Array.isArray(rows) &&
    Array.isArray(meta?.missingQuoteSymbols) &&
    Array.isArray(meta?.unsupportedCurrencySymbols);
  if (!contractOk) {
    emitFailure('contract', 'CONTRACT_MISMATCH');
    return;
  }

  if (meta.fxSource !== 'mocked' || meta.fxStaleState !== 'sample' || meta.sampleFx !== true) {
    emitFailure('fx', 'MOCKED_FX_NOT_PRESENT');
    return;
  }

  const unavailableRows = rows.filter((row) => row?.staleState === 'unavailable').length;
  const aggregateState =
    valuation.totalMarketValue === null && valuation.totalUnrealizedPnl === null
      ? 'null'
      : 'available';

  emitSafe({
    step: 'contract',
    status: 'pass',
    source: 'live',
    previewMode: 'owner',
    mixedCurrencyPreview: true,
    mockedFx: true,
  });
  emitSafe({
    step: 'rows',
    status: 'pass',
    rowCount: rows.length,
    unavailableRows,
    unsupportedCurrencyRows: meta.unsupportedCurrencySymbols.length,
    missingQuoteRows: meta.missingQuoteSymbols.length,
  });
  emitSafe({
    step: 'fx',
    status: 'pass',
    fxSource: 'mocked',
    fxStaleState: 'sample',
    rateValuePrinted: false,
  });
  emitSafe({
    step: 'aggregate',
    status: 'pass',
    aggregateState,
    valuesPrinted: false,
  });
  emitSafe({ step: 'provider-leakage', status: 'pass' });
  emitSafe({ result: 'PASS' });
};

if (!activeApproved) {
  runDryRun();
} else {
  await runActiveSmoke().catch(() => {
    if (!process.exitCode) emitFailure('contract', 'RAW_VALUE_LEAKAGE_DETECTED');
  });
}
