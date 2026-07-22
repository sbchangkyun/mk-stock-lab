#!/usr/bin/env node
/**
 * Phase 3EX-C committed runtime smoke script for the chart similarity engine.
 *
 * This exercises the ACTUAL TypeScript engine code (not a re-implementation) using Node's
 * native TypeScript type-stripping support. Because the repository's import convention is
 * extensionless relative imports (e.g. `from './types'`), and Node's ESM loader requires an
 * explicit extension to resolve a relative specifier, this script copies the chart similarity
 * engine and fixture sources into an OS temp directory and rewrites only the copies' relative
 * import specifiers to add a `.ts` extension. The committed source files under `src/` are never
 * modified. The temp directory is removed in a `finally` block regardless of outcome.
 *
 * No network, no env reads, no dev server, no browser, no dependencies added.
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

const tempRoot = mkdtempSync(path.join(tmpdir(), 'mkstocklab-chartsim-3ex-c-'));

const hasNonFinite = (value) => {
  if (typeof value === 'number') return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasNonFinite);
  if (value && typeof value === 'object') return Object.values(value).some(hasNonFinite);
  return false;
};

let engine = null;
let fixtures = null;
let edgeFixtures = null;

try {
  const libSrc = path.join(repoRoot, 'src', 'lib', 'chartSimilarity');
  const dataSrc = path.join(repoRoot, 'src', 'data', 'chartSimilarity');
  const libDest = path.join(tempRoot, 'lib', 'chartSimilarity');
  const dataDest = path.join(tempRoot, 'data', 'chartSimilarity');

  copyDirWithRewrite(libSrc, libDest);
  copyDirWithRewrite(dataSrc, dataDest);

  try {
    engine = await import(pathToFileURL(path.join(libDest, 'index.ts')).href);
  } catch (importError) {
    console.log('[IMPLEMENTATION NOTE] Node could not execute the copied TypeScript engine sources via native type stripping.');
    console.log(String(importError && importError.stack ? importError.stack : importError));
    console.log('\nSmoke verification could not run. This is reported as a failure, not skipped silently.');
    process.exitCode = 1;
    throw importError;
  }

  fixtures = await import(pathToFileURL(path.join(dataDest, 'syntheticOhlcvFixture.ts')).href);
  edgeFixtures = await import(pathToFileURL(path.join(dataDest, 'edgeCaseOhlcvFixtures.ts')).href);

  const { scanSimilarity } = engine;
  const normalBars = fixtures.buildSyntheticOhlcvFixture();

  check('synthetic fixture length >= 100', normalBars.length >= 100);

  // Normal scenario: finite 0..100 scores, topK respected, currentNormalizedPath starts at 100,
  // forward outcome keys present for d5/d20.
  const normalResult = scanSimilarity(normalBars, {
    baseWindow: 20,
    forwardWindows: [5, 20],
    topK: 5,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 5,
  });

  check('normal scenario returns at most topK matches', normalResult.matches.length <= 5);
  check(
    'normal scenario scores are finite and within 0..100',
    normalResult.matches.every(
      (m) => Number.isFinite(m.similarityScore) && m.similarityScore >= 0 && m.similarityScore <= 100,
    ),
  );
  check(
    'currentNormalizedPath starts at 100 for valid input',
    normalResult.currentNormalizedPath.length > 0 && normalResult.currentNormalizedPath[0].value === 100,
  );
  check(
    'forward outcome keys exist for d5 and d20',
    normalResult.matches.length === 0 ||
      normalResult.matches.every(
        (m) => 'd5' in m.forwardOutcome.forwardReturns && 'd20' in m.forwardOutcome.forwardReturns,
      ),
  );
  check('normal scenario has no NaN/Infinity in output', !hasNonFinite(normalResult));

  // Empty bars: warnings, zero matches, no throw.
  const emptyResult = scanSimilarity([], {
    baseWindow: 20,
    forwardWindows: [5],
    topK: 5,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 0,
  });
  check('empty bars returns zero matches', emptyResult.matches.length === 0);
  check('empty bars returns warnings', emptyResult.warnings.length > 0);
  check('empty bars produces no NaN/Infinity', !hasNonFinite(emptyResult));

  // One-bar input: warnings, zero matches, no throw.
  const oneBarResult = scanSimilarity(edgeFixtures.buildShortSyntheticOhlcvFixture(1), {
    baseWindow: 20,
    forwardWindows: [5],
    topK: 5,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 0,
  });
  check('one-bar input returns zero matches', oneBarResult.matches.length === 0);
  check('one-bar input returns warnings', oneBarResult.warnings.length > 0);
  check('one-bar input produces no NaN/Infinity', !hasNonFinite(oneBarResult));

  // All-identical closes: no NaN/Infinity anywhere, scores stay within range if any matches exist.
  const flatBars = edgeFixtures.buildFlatSyntheticOhlcvFixture(120);
  const flatResult = scanSimilarity(flatBars, {
    baseWindow: 20,
    forwardWindows: [5, 10],
    topK: 5,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 5,
  });
  check('all-identical closes produce no NaN/Infinity', !hasNonFinite(flatResult));
  check(
    'all-identical closes keep scores within 0..100',
    flatResult.matches.every((m) => m.similarityScore >= 0 && m.similarityScore <= 100),
  );

  // Invalid bars (NaN/negative/zero close, infinite volume): filtered or warned safely, no throw.
  const invalidBars = edgeFixtures.buildInvalidSyntheticOhlcvFixture();
  const invalidResult = scanSimilarity(invalidBars, {
    baseWindow: 5,
    forwardWindows: [2],
    topK: 3,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 0,
  });
  check('invalid bars input does not throw and returns warnings', invalidResult.warnings.length > 0);
  check('invalid bars input produces no NaN/Infinity', !hasNonFinite(invalidResult));

  // Extreme excludeRecentBars: zero or fewer matches, no throw.
  const extremeExcludeResult = scanSimilarity(normalBars, {
    baseWindow: 20,
    forwardWindows: [5],
    topK: 5,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 100000,
  });
  check('extreme excludeRecentBars returns zero matches safely', extremeExcludeResult.matches.length === 0);
  check('extreme excludeRecentBars produces no NaN/Infinity', !hasNonFinite(extremeExcludeResult));

  // topK 0: zero matches.
  const topKZeroResult = scanSimilarity(normalBars, {
    baseWindow: 20,
    forwardWindows: [5],
    topK: 0,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 5,
  });
  check('topK 0 returns zero matches', topKZeroResult.matches.length === 0);

  // Negative/zero/duplicate/non-integer forwardWindows: sanitized or ignored safely, no throw.
  const messyForwardWindowsResult = scanSimilarity(normalBars, {
    baseWindow: 20,
    forwardWindows: [5, 5, -3, 0, 2.5, 10],
    topK: 5,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 5,
  });
  check(
    'negative/zero/duplicate/non-integer forwardWindows do not throw',
    Array.isArray(messyForwardWindowsResult.matches),
  );
  check(
    'sanitized forwardWindows only include positive integers, deduplicated',
    messyForwardWindowsResult.matches.every((m) => {
      const keys = Object.keys(m.forwardOutcome.forwardReturns);
      return keys.every((k) => /^d\d+$/.test(k)) && new Set(keys).size === keys.length;
    }),
  );
  check('messy forwardWindows scenario produces no NaN/Infinity', !hasNonFinite(messyForwardWindowsResult));

  // baseWindow <= 0 / non-finite: normalized safely, no throw, zero matches expected.
  const invalidBaseWindowResult = scanSimilarity(normalBars, {
    baseWindow: Number.NaN,
    forwardWindows: [5],
    topK: 5,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 0,
  });
  check('NaN baseWindow does not throw and returns warnings', invalidBaseWindowResult.warnings.length > 0);
  check('NaN baseWindow returns zero matches (guard-safe fallback)', invalidBaseWindowResult.matches.length === 0);
  check('NaN baseWindow produces no NaN/Infinity in output', !hasNonFinite(invalidBaseWindowResult));

  // Unsorted bars: engine sorts internally, no throw.
  const unsortedBars = edgeFixtures.buildUnsortedSyntheticOhlcvFixture(30);
  const unsortedResult = scanSimilarity(unsortedBars, {
    baseWindow: 5,
    forwardWindows: [2],
    topK: 3,
    similarityMethod: 'return_correlation_rmse',
    excludeRecentBars: 0,
  });
  check('unsorted bars input does not throw', Array.isArray(unsortedResult.matches));
  check('unsorted bars produces no NaN/Infinity', !hasNonFinite(unsortedResult));

  console.log(`\nPhase 3EX-C smoke summary: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) {
    console.log('Failed checks:');
    for (const label of failures) console.log(` - ${label}`);
    process.exitCode = 1;
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
