#!/usr/bin/env node
/**
 * Phase 3EY-B committed runtime smoke script for the server-only KIS OHLC provider foundation
 * and its mocked adapter / test harness.
 *
 * This exercises the ACTUAL TypeScript provider foundation and mocked adapter code (not a
 * re-implementation) using Node's native TypeScript type-stripping support. Because the
 * repository's import convention is extensionless relative imports, and Node's ESM loader
 * requires an explicit extension to resolve a relative specifier, this script copies
 * `src/lib/server/chartSimilarity/**` and `src/lib/chartSimilarity/types.ts` into an OS temp
 * directory and rewrites only the copies' relative import specifiers to add a `.ts` extension.
 * The committed source files under `src/` are never modified. The temp directory is removed in
 * a `finally` block regardless of outcome.
 *
 * No network, no env reads, no dev server, no browser, no dependencies added, no live KIS call.
 */

import { mkdtempSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let passCount = 0;
let failCount = 0;
const failures = [];

const check = (label, condition) => {
  if (condition) {
    passCount += 1;
    console.log(`[PASS] ${label}`);
  } else {
    failCount += 1;
    failures.push(label);
    console.log(`[FAIL] ${label}`);
  }
};

const IMPORT_SPECIFIER_PATTERN = /(from\s+['"])(\.[^'"]+)(['"])/g;

const rewriteRelativeImports = (source) =>
  source.replace(IMPORT_SPECIFIER_PATTERN, (full, prefix, specifier, suffix) => {
    if (/\.[a-zA-Z0-9]+$/.test(specifier)) return full;
    return `${prefix}${specifier}.ts${suffix}`;
  });

const copyDirWithRewrite = (srcDir, destDir) => {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirWithRewrite(srcPath, destPath);
      continue;
    }
    if (!entry.endsWith('.ts')) continue;
    const original = readFileSync(srcPath, 'utf8');
    writeFileSync(destPath, rewriteRelativeImports(original), 'utf8');
  }
};

const copyFileWithRewrite = (srcFile, destFile) => {
  mkdirSync(path.dirname(destFile), { recursive: true });
  const original = readFileSync(srcFile, 'utf8');
  writeFileSync(destFile, rewriteRelativeImports(original), 'utf8');
};

const hasNonFinite = (value) => {
  if (typeof value === 'number') return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasNonFinite);
  if (value && typeof value === 'object') return Object.values(value).some(hasNonFinite);
  return false;
};

const RAW_KIS_FIELD_PATTERN =
  /(stck_bsop_date|stck_clpr|stck_oprc|stck_hgpr|stck_lwpr|acml_vol|output1|output2|appkey|appsecret|access_token)/i;
const SECRET_LOOKING_PATTERN = /(sk-[a-z0-9]|bearer\s+[a-z0-9]|api[_-]?key\s*[:=]|app[_-]?secret\s*[:=]|password\s*[:=])/i;

const tempRoot = mkdtempSync(path.join(tmpdir(), 'mkstocklab-chartsim-3ey-b-'));

let providerModule = null;

try {
  const serverSrc = path.join(repoRoot, 'src', 'lib', 'server', 'chartSimilarity');
  const serverDest = path.join(tempRoot, 'lib', 'server', 'chartSimilarity');
  copyDirWithRewrite(serverSrc, serverDest);

  const typesSrc = path.join(repoRoot, 'src', 'lib', 'chartSimilarity', 'types.ts');
  const typesDest = path.join(tempRoot, 'lib', 'chartSimilarity', 'types.ts');
  copyFileWithRewrite(typesSrc, typesDest);

  try {
    providerModule = await import(pathToFileURL(path.join(serverDest, 'index.ts')).href);
  } catch (importError) {
    console.log('[IMPLEMENTATION NOTE] Node could not execute the copied TypeScript provider sources via native type stripping.');
    console.log(String(importError && importError.stack ? importError.stack : importError));
    console.log('\nSmoke verification could not run. This is reported as a failure, not skipped silently.');
    process.exitCode = 1;
    throw importError;
  }

  const {
    buildDefaultServerOnlyKisOhlcPolicy,
    getServerOnlyKisOhlcForSimilarity,
    normalizeServerOnlyKisOhlcRequest,
    getMockedServerOnlyKisOhlcForSimilarity,
    buildMockedNormalizedDailyOhlcInput,
    buildInvalidMockedNormalizedDailyOhlcInput,
  } = providerModule;

  const validRequest = {
    market: 'KR',
    symbol: 'MOCKSYM01',
    assetType: 'stock',
    timeframe: 'daily',
    lookbackYears: 3,
    maxBars: 500,
    purpose: 'chart-similarity',
  };

  // 1-6: default policy shape.
  const defaultPolicy = buildDefaultServerOnlyKisOhlcPolicy();
  check('1. default policy has enabled false', defaultPolicy.enabled === false);
  check('2. default policy requires auth', defaultPolicy.requireAuth === true);
  check('3. default policy requires usage guard', defaultPolicy.requireUsageGuard === true);
  check('4. default policy disallows public execution', defaultPolicy.allowPublicExecution === false);
  check('5. default policy disallows client secret exposure', defaultPolicy.allowClientSecretExposure === false);
  check('6. default policy disallows raw provider payload', defaultPolicy.allowRawProviderPayload === false);

  // 7-9: disabled provider foundation paths.
  const disabledResult = await getServerOnlyKisOhlcForSimilarity(validRequest);
  check('7. disabled provider returns status "disabled" with default policy', disabledResult.status === 'disabled');

  const enabledPolicy = { ...buildDefaultServerOnlyKisOhlcPolicy(), enabled: true };
  const notImplementedResult = await getServerOnlyKisOhlcForSimilarity(validRequest, enabledPolicy);
  check(
    '8. disabled provider returns status "not_implemented" when policy.enabled true',
    notImplementedResult.status === 'not_implemented',
  );

  const invalidSymbolResult = await getServerOnlyKisOhlcForSimilarity({ ...validRequest, symbol: '' });
  check('9. invalid request returns status "blocked"', invalidSymbolResult.status === 'blocked');

  // 10-11: request normalization clamps.
  const normalizedLookback = normalizeServerOnlyKisOhlcRequest({ ...validRequest, lookbackYears: 999 });
  check('10. request normalization clamps lookbackYears to <= 5', normalizedLookback.lookbackYears <= 5);

  const normalizedMaxBars = normalizeServerOnlyKisOhlcRequest({ ...validRequest, maxBars: 999999 });
  check('11. request normalization clamps maxBars to <= 1500', normalizedMaxBars.maxBars <= 1500);

  // 12-13: mocked fixture shape.
  const mockedBars = buildMockedNormalizedDailyOhlcInput();
  check('12. mocked fixture returns at least 60 bars', mockedBars.length >= 60);
  check(
    '13. mocked fixture values are finite',
    mockedBars.every(
      (bar) =>
        Number.isFinite(bar.open) &&
        Number.isFinite(bar.high) &&
        Number.isFinite(bar.low) &&
        Number.isFinite(bar.close) &&
        (bar.volume === null || Number.isFinite(bar.volume)),
    ),
  );

  // 14-20: mocked adapter ready path.
  const mockedDisabledResult = getMockedServerOnlyKisOhlcForSimilarity({
    request: validRequest,
    normalizedBars: mockedBars,
  });
  check('14. mocked adapter with default policy returns "disabled"', mockedDisabledResult.status === 'disabled');

  const mockedEnabledPolicy = { ...buildDefaultServerOnlyKisOhlcPolicy(), enabled: true };
  const mockedReadyResult = getMockedServerOnlyKisOhlcForSimilarity({
    request: validRequest,
    normalizedBars: mockedBars,
    policy: mockedEnabledPolicy,
  });
  check('15. mocked adapter with enabled mock policy returns ok true', mockedReadyResult.ok === true);
  check('16. mocked adapter with enabled mock policy returns status "ready"', mockedReadyResult.status === 'ready');
  check(
    '17. mocked adapter returns OhlcBar[] with source "kis-normalized"',
    mockedReadyResult.bars.length > 0 && mockedReadyResult.bars.every((bar) => bar.source === 'kis-normalized'),
  );
  check('18. mocked adapter returns only market "KR"', mockedReadyResult.bars.every((bar) => bar.market === 'KR'));
  check(
    '19. mocked adapter returns the requested symbol',
    mockedReadyResult.bars.every((bar) => bar.symbol === validRequest.symbol),
  );
  check('20. mocked adapter result contains no NaN/Infinity', !hasNonFinite(mockedReadyResult));

  // 21-23: invalid/empty normalized bars handling.
  const invalidMockedBars = buildInvalidMockedNormalizedDailyOhlcInput();
  const invalidBarsResult = getMockedServerOnlyKisOhlcForSimilarity({
    request: validRequest,
    normalizedBars: invalidMockedBars,
    policy: mockedEnabledPolicy,
  });
  check(
    '21. invalid mocked bars are dropped or warned safely',
    invalidBarsResult.bars.length === 0 && invalidBarsResult.warnings.length > 0,
  );

  let emptyBarsResult;
  let emptyBarsThrew = false;
  try {
    emptyBarsResult = getMockedServerOnlyKisOhlcForSimilarity({
      request: validRequest,
      normalizedBars: [],
      policy: mockedEnabledPolicy,
    });
  } catch {
    emptyBarsThrew = true;
  }
  check('22. empty normalized bars do not throw', emptyBarsThrew === false);
  check('23. empty normalized bars do not return ok true', Boolean(emptyBarsResult) && emptyBarsResult.ok === false);

  // 24-27: request field validation paths.
  const nonKrResult = await getServerOnlyKisOhlcForSimilarity({ ...validRequest, market: 'US' });
  check('24. non-KR market request is blocked', nonKrResult.status === 'blocked');

  const nonDailyResult = await getServerOnlyKisOhlcForSimilarity({ ...validRequest, timeframe: 'weekly' });
  check('25. non-daily timeframe request is blocked', nonDailyResult.status === 'blocked');

  const invalidAssetTypeResult = await getServerOnlyKisOhlcForSimilarity({ ...validRequest, assetType: 'bond' });
  check('26. invalid assetType request is blocked', invalidAssetTypeResult.status === 'blocked');

  const invalidPurposeResult = await getServerOnlyKisOhlcForSimilarity({ ...validRequest, purpose: 'other' });
  check('27. invalid purpose request is blocked', invalidPurposeResult.status === 'blocked');

  // 28-30: safeMessage presence and raw/secret safety across all collected results.
  const allResults = [
    disabledResult,
    notImplementedResult,
    invalidSymbolResult,
    mockedDisabledResult,
    mockedReadyResult,
    invalidBarsResult,
    emptyBarsResult,
    nonKrResult,
    nonDailyResult,
    invalidAssetTypeResult,
    invalidPurposeResult,
  ];
  check(
    '28. result safeMessage exists for all paths',
    allResults.every((result) => typeof result.safeMessage === 'string' && result.safeMessage.length > 0),
  );

  const serializedResults = JSON.stringify(allResults);
  check('29. no output contains raw KIS field names', !RAW_KIS_FIELD_PATTERN.test(serializedResults));
  check('30. no output contains secret-looking values', !SECRET_LOOKING_PATTERN.test(serializedResults));

  console.log(`\nPhase 3EY-B smoke summary: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) {
    console.log('Failed checks:');
    for (const label of failures) console.log(` - ${label}`);
    process.exitCode = 1;
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
