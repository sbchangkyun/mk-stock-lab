// Phase 3GG-D-FAST smoke: local-only Live KIS minimal end-to-end market-data
// path. Exercises the pure binding module (scenarios 1-10) with fixture
// transports, then wires the REAL kisClient.ts transport for a single
// local-only, single-endpoint (current_price) call attempt (scenario 11),
// reusing the TS-compile-and-dynamic-import pattern from
// scripts/owner_smoke_kis_quote_live.mjs. No credential value is ever read,
// printed, or logged. No order/account/balance/funds/personal endpoint is
// ever referenced.

import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import {
  ALLOWED_ENDPOINT_CATEGORIES,
  ALLOWED_SANITIZED_RESPONSE_FIELDS,
  FORBIDDEN_ENDPOINT_CATEGORIES,
  SANITIZED_ERROR_CODES,
  createQuoteCache,
  createRateLimiter,
  evaluateEndpointAllowlist,
  runLocalOnlyLiveKisMarketDataRequest,
} from '../src/lib/server/chart-ai/local-only-live-kis-market-data-binding.mjs';
import {
  FIXTURE_CATEGORY,
  FIXTURE_FORBIDDEN_CATEGORIES,
  FIXTURE_SYMBOL,
  FIXTURE_UNLISTED_CATEGORY,
  buildFixtureCredentialFlags,
  buildFixtureHasEnvValue,
  buildFixtureRequestInput,
  createFailIfCalledTransport,
  createFixtureSuccessTransport,
} from '../src/lib/server/chart-ai/local-only-live-kis-market-data-binding.fixture.mjs';

const repoRoot = process.cwd();

const forbiddenOutputPattern =
  /KIS_APP_SECRET|KIS_APP_KEY|OPENAI_API_KEY|GEMINI_API_KEY|OPENDART_API_KEY|SUPABASE_SERVICE_ROLE_KEY|access_token|appsecret|appkey|authorization|Bearer|KIS_ACCOUNT_NO|account_no|connectionString|jwt|password|stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|\boutput\b|stack/i;

let failures = 0;

const logSafe = (message) => {
  if (forbiddenOutputPattern.test(message)) {
    console.log('phase3ggdfast step=safe-output-guard status=blocked code=SAFE_OUTPUT_BLOCKED sanitized=true');
    throw new Error('Unsafe smoke output blocked.');
  }
  console.log(message);
};

const logStep = (step, status, extra = {}) => {
  const parts = [`phase3ggdfast step=${step} status=${status}`];
  for (const [k, v] of Object.entries(extra)) parts.push(`${k}=${v}`);
  parts.push('sanitized=true');
  logSafe(parts.join(' '));
  if (status === 'failed') failures += 1;
};

const assertCase = (name, condition, extra = {}) => {
  logStep(name, condition ? 'passed' : 'failed', extra);
};

const noopLogger = () => {};

// --- Scenarios 1-10: pure binding module with fixture transports ---------

const runFixtureScenarios = async () => {
  // 1. Local-only guard passes for localhost; full success path.
  {
    const callLog = [];
    const result = await runLocalOnlyLiveKisMarketDataRequest(
      buildFixtureRequestInput({ hostname: 'localhost' }),
      {
        rateLimiter: createRateLimiter(),
        cache: createQuoteCache(),
        hasEnvValue: buildFixtureHasEnvValue(),
        fetchQuote: createFixtureSuccessTransport({ callLog }),
        logger: noopLogger,
        now: () => 0,
      },
    );
    assertCase('local-guard-pass', result.sourceStatus === 'ok' && callLog.length === 1, {
      sourceStatus: result.sourceStatus,
      transportCalls: callLog.length,
    });
  }

  // 2. Non-local guard fails; transport must never be invoked.
  {
    const result = await runLocalOnlyLiveKisMarketDataRequest(
      buildFixtureRequestInput({ hostname: 'example.com' }),
      {
        rateLimiter: createRateLimiter(),
        cache: createQuoteCache(),
        hasEnvValue: buildFixtureHasEnvValue(),
        fetchQuote: createFailIfCalledTransport('scenario-2-transport'),
        logger: noopLogger,
        now: () => 0,
      },
    );
    assertCase(
      'non-local-guard-fails-closed',
      result.sourceStatus === 'blocked' && result.sanitizedErrorCode === SANITIZED_ERROR_CODES.NON_LOCAL_REQUEST,
      { sanitizedErrorCode: result.sanitizedErrorCode },
    );
  }

  // 3. Missing credential fails closed without printing any value.
  {
    const result = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput(), {
      rateLimiter: createRateLimiter(),
      cache: createQuoteCache(),
      hasEnvValue: buildFixtureHasEnvValue(buildFixtureCredentialFlags({ KIS_APP_SECRET: false })),
      fetchQuote: createFailIfCalledTransport('scenario-3-transport'),
      logger: noopLogger,
      now: () => 0,
    });
    const serialized = JSON.stringify(result);
    assertCase(
      'missing-credential-fails-closed',
      result.sanitizedErrorCode === SANITIZED_ERROR_CODES.MISSING_CREDENTIAL && !forbiddenOutputPattern.test(serialized),
      { sanitizedErrorCode: result.sanitizedErrorCode },
    );
  }

  // 4. Forbidden endpoint category fails closed.
  {
    const category = FIXTURE_FORBIDDEN_CATEGORIES[0];
    const result = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput({ category }), {
      rateLimiter: createRateLimiter(),
      cache: createQuoteCache(),
      hasEnvValue: buildFixtureHasEnvValue(),
      fetchQuote: createFailIfCalledTransport('scenario-4-transport'),
      logger: noopLogger,
      now: () => 0,
    });
    assertCase(
      'forbidden-endpoint-fails-closed',
      result.sanitizedErrorCode === SANITIZED_ERROR_CODES.ENDPOINT_FORBIDDEN,
      { category, sanitizedErrorCode: result.sanitizedErrorCode },
    );
  }

  // 5. Unlisted (non-forbidden but not allowlisted) endpoint fails closed.
  {
    const result = await runLocalOnlyLiveKisMarketDataRequest(
      buildFixtureRequestInput({ category: FIXTURE_UNLISTED_CATEGORY }),
      {
        rateLimiter: createRateLimiter(),
        cache: createQuoteCache(),
        hasEnvValue: buildFixtureHasEnvValue(),
        fetchQuote: createFailIfCalledTransport('scenario-5-transport'),
        logger: noopLogger,
        now: () => 0,
      },
    );
    assertCase(
      'unlisted-endpoint-fails-closed',
      result.sanitizedErrorCode === SANITIZED_ERROR_CODES.ENDPOINT_NOT_ALLOWLISTED,
      { category: FIXTURE_UNLISTED_CATEGORY, sanitizedErrorCode: result.sanitizedErrorCode },
    );
  }

  // 6. Rate limit exceeded blocks (distinct symbols to avoid cache hits masking the count).
  {
    const rateLimiter = createRateLimiter();
    const cache = createQuoteCache();
    const callLog = [];
    const symbols = ['005930', '000660', '005380', '035420', '051910', '105560'];
    const results = [];
    for (const symbol of symbols) {
      // eslint-disable-next-line no-await-in-loop
      const result = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput({ symbol }), {
        rateLimiter,
        cache,
        hasEnvValue: buildFixtureHasEnvValue(),
        fetchQuote: createFixtureSuccessTransport({ callLog }),
        logger: noopLogger,
        now: () => 0,
      });
      results.push(result);
    }
    const firstFiveOk = results.slice(0, 5).every((r) => r.sourceStatus === 'ok');
    const sixthBlocked = results[5].sanitizedErrorCode === SANITIZED_ERROR_CODES.RATE_LIMITED;
    assertCase('rate-limit-exceeded-blocks', firstFiveOk && sixthBlocked && callLog.length === 5, {
      transportCalls: callLog.length,
      sixthErrorCode: results[5].sanitizedErrorCode,
    });
  }

  // 7. Cache hit skips the provider call.
  {
    const callLog = [];
    const rateLimiter = createRateLimiter();
    const cache = createQuoteCache();
    const deps = {
      rateLimiter,
      cache,
      hasEnvValue: buildFixtureHasEnvValue(),
      fetchQuote: createFixtureSuccessTransport({ callLog }),
      logger: noopLogger,
      now: () => 0,
    };
    const first = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput(), deps);
    const second = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput(), deps);
    assertCase(
      'cache-hit-skips-provider-call',
      first.cacheStatus === 'miss' && second.cacheStatus === 'hit' && callLog.length === 1 && second.currentPrice === first.currentPrice,
      { transportCalls: callLog.length, secondCacheStatus: second.cacheStatus },
    );
  }

  // 8. Sanitized response contains only allowed fields.
  {
    const result = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput({ symbol: '900001' }), {
      rateLimiter: createRateLimiter(),
      cache: createQuoteCache(),
      hasEnvValue: buildFixtureHasEnvValue(),
      fetchQuote: createFixtureSuccessTransport(),
      logger: noopLogger,
      now: () => 0,
    });
    const keys = Object.keys(result).sort();
    const expected = [...ALLOWED_SANITIZED_RESPONSE_FIELDS].sort();
    assertCase('sanitized-response-fields-only', JSON.stringify(keys) === JSON.stringify(expected), {
      fieldCount: keys.length,
    });
  }

  // 9. Raw payload is never exposed in the sanitized response.
  {
    const result = await runLocalOnlyLiveKisMarketDataRequest(buildFixtureRequestInput({ symbol: '900002' }), {
      rateLimiter: createRateLimiter(),
      cache: createQuoteCache(),
      hasEnvValue: buildFixtureHasEnvValue(),
      fetchQuote: createFixtureSuccessTransport(),
      logger: noopLogger,
      now: () => 0,
    });
    const serialized = JSON.stringify(result);
    assertCase('raw-payload-not-exposed', !forbiddenOutputPattern.test(serialized));
  }

  // 10. No forbidden endpoint category is ever reachable through the allowlist.
  {
    const onlyCurrentPrice = ALLOWED_ENDPOINT_CATEGORIES.length === 1 && ALLOWED_ENDPOINT_CATEGORIES[0] === FIXTURE_CATEGORY;
    const allForbiddenRejected = FIXTURE_FORBIDDEN_CATEGORIES.every((category) => {
      const check = evaluateEndpointAllowlist(category);
      return check.allowed === false && FORBIDDEN_ENDPOINT_CATEGORIES.includes(category);
    });
    assertCase('no-forbidden-endpoint-category-reachable', onlyCurrentPrice && allForbiddenRejected, {
      allowedCategoryCount: ALLOWED_ENDPOINT_CATEGORIES.length,
    });
  }
};

// --- Scenario 11: real kisClient.ts transport, local-only, single endpoint --

const rewriteImports = (content) =>
  content
    .replace(/from '([^']+)';/g, (match, specifier) => {
      if (!specifier.startsWith('.')) return match;
      return specifier.endsWith('.js') ? match : `from '${specifier}.js';`;
    })
    .replace(/import\('([^']+)'\)/g, (match, specifier) => {
      if (!specifier.startsWith('.')) return match;
      return specifier.endsWith('.js') ? match : `import('${specifier}.js')`;
    });

const compileFile = (file, outDir) => {
  const source = path.join(repoRoot, file);
  const target = path.join(outDir, file).replace(/\.ts$/, '.js');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const compiled = rewriteImports(
    ts.transpileModule(fs.readFileSync(source, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
      },
    }).outputText,
  );
  fs.writeFileSync(target, compiled, 'utf8');
};

const providerDependencies = [
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/providerErrors.ts',
];

const createCompiledKisClientRuntime = () => {
  const astroTempDir = path.join(repoRoot, '.astro');
  fs.mkdirSync(astroTempDir, { recursive: true });
  const tempRoot = fs.mkdtempSync(path.join(astroTempDir, 'phase3ggdfast-smoke-'));
  const outDir = path.join(tempRoot, 'out');

  for (const file of providerDependencies) compileFile(file, outDir);
  // Only kisClient.ts is compiled -- it exports current-price quote access
  // only (getKisQuoteSnapshot / getKisDomesticQuoteSnapshot). No OHLC, order,
  // or account module is compiled or reachable from this runtime.
  compileFile('src/lib/server/providers/kisClient.ts', outDir);

  const kisClientTarget = path.join(outDir, 'src/lib/server/providers/kisClient.js');

  return {
    providerUrl: pathToFileURL(kisClientTarget).href,
    cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }),
  };
};

const runRealTransportScenario = async () => {
  logStep('real-transport-runtime-setup', 'started');
  let runtime;
  try {
    runtime = createCompiledKisClientRuntime();
  } catch {
    logStep('real-transport-runtime-setup', 'failed', { code: 'RUNTIME_SETUP_FAILED' });
    return;
  }
  logStep('real-transport-runtime-setup', 'passed');

  try {
    logStep('real-transport-provider-import', 'started');
    let provider;
    try {
      provider = await import(runtime.providerUrl);
    } catch {
      logStep('real-transport-provider-import', 'failed', { code: 'PROVIDER_IMPORT_FAILED' });
      return;
    }
    const singleEndpointOnly = typeof provider.getKisQuoteSnapshot === 'function';
    logStep('real-transport-provider-import', singleEndpointOnly ? 'passed' : 'failed', {
      singleEndpointOnly: String(singleEndpointOnly),
    });
    if (!singleEndpointOnly) return;

    const fetchQuote = async ({ symbol }) => {
      let result;
      try {
        result = await provider.getKisQuoteSnapshot({ market: 'KR', symbol });
      } catch {
        return { ok: false, code: 'PROVIDER_UNAVAILABLE' };
      }
      if (!result || result.ok !== true) {
        return { ok: false, code: 'PROVIDER_UNAVAILABLE' };
      }
      const { price, volume } = result.data ?? {};
      return { ok: true, data: { currentPrice: price, volume } };
    };

    logStep('real-transport-request', 'started', { hostname: 'localhost', category: FIXTURE_CATEGORY });
    const result = await runLocalOnlyLiveKisMarketDataRequest(
      { hostname: 'localhost', env: { NODE_ENV: 'development' }, symbol: FIXTURE_SYMBOL, category: FIXTURE_CATEGORY, nowMs: 0 },
      {
        rateLimiter: createRateLimiter(),
        cache: createQuoteCache(),
        hasEnvValue: (name) => Boolean(process.env[name]),
        fetchQuote,
        logger: noopLogger,
        now: () => Date.now(),
      },
    );

    const serialized = JSON.stringify(result);
    const outputSafe = !forbiddenOutputPattern.test(serialized);
    const scopeRespected = result.sourceStatus === 'ok' || result.sourceStatus === 'unavailable' || result.sourceStatus === 'blocked';
    logStep('real-transport-request', outputSafe && scopeRespected ? 'passed' : 'failed', {
      sourceStatus: result.sourceStatus,
      cacheStatus: result.cacheStatus,
      sanitizedErrorCode: result.sanitizedErrorCode ?? 'none',
    });
  } finally {
    runtime.cleanup();
  }
};

const TOTAL_SCENARIOS = 11;

const main = async () => {
  await runFixtureScenarios();
  await runRealTransportScenario();

  logStep('final-result', failures === 0 ? 'passed' : 'failed', { failures: String(failures) });
  if (failures > 0) {
    console.log(`FAIL: ${TOTAL_SCENARIOS - failures}/${TOTAL_SCENARIOS} scenarios passed.`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${TOTAL_SCENARIOS}/${TOTAL_SCENARIOS} scenarios passed.`);
  }
};

main().catch(() => {
  console.log('phase3ggdfast step=unexpected-catch status=failed code=UNEXPECTED_SAFE_FAILURE sanitized=true');
  process.exitCode = 1;
});
