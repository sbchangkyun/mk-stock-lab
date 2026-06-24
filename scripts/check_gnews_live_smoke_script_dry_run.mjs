/**
 * Dry-run behavioral validation for Phase 3BD owner-run GNews live smoke script.
 * Imports and invokes the exported runDryRun function with a captured output collector.
 * Monkey-patches globalThis.fetch to throw before invoking dry-run, verifying no network occurs.
 * No live GNews call. No env reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;
let passes = 0;
const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (pass) passes++;
  else failures++;
};

log('=== GNews Live Smoke Script Dry-Run Checker (Phase 3BD) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: Pre-flight — verify the smoke script exists and is importable
// ---------------------------------------------------------------------------
log('--- Group 1: Pre-flight ---');

const SMOKE_SCRIPT_PATH = join(root, 'scripts', 'owner_smoke_gnews_live_fetch.mjs');
check('Smoke script file exists before import', existsSync(SMOKE_SCRIPT_PATH));

if (!existsSync(SMOKE_SCRIPT_PATH)) {
  log('ERROR: Smoke script missing — cannot import. Aborting.');
  process.exitCode = 1;
  log(`Checks passed: ${passes}/${passes + failures}. Result: FAIL`);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Group 2: Monkey-patch globalThis.fetch to block any accidental network call
// ---------------------------------------------------------------------------
log('--- Group 2: Network guard setup ---');

let networkCallAttempted = false;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (..._args) => {
  networkCallAttempted = true;
  throw new Error('Network access blocked in dry-run checker — fetch must not be called in dry-run mode.');
};

check('globalThis.fetch monkey-patched to block network', true);

// ---------------------------------------------------------------------------
// Group 3: Import runDryRun from smoke script
// ---------------------------------------------------------------------------
log('--- Group 3: Import runDryRun ---');

let runDryRun;
let importError = null;
try {
  const module = await import('./owner_smoke_gnews_live_fetch.mjs');
  runDryRun = module.runDryRun;
} catch (err) {
  importError = err?.message ?? 'unknown_import_error';
}

check('Smoke script imports without error', importError === null);
check('runDryRun export is a function', typeof runDryRun === 'function');

if (typeof runDryRun !== 'function') {
  log('ERROR: runDryRun is not a function — cannot proceed with behavioral checks.');
  // Restore fetch before exit
  globalThis.fetch = originalFetch;
  process.exitCode = 1;
  log(`Checks passed: ${passes}/${passes + failures}. Result: FAIL`);
  process.exit(1);
}

log('');

// ---------------------------------------------------------------------------
// Group 4: Execute runDryRun with captured output
// ---------------------------------------------------------------------------
log('--- Group 4: Execute runDryRun ---');

const capturedLines = [];
let threwDuringDryRun = false;
let dryRunError = null;

try {
  runDryRun((msg) => capturedLines.push(String(msg)));
} catch (err) {
  threwDuringDryRun = true;
  dryRunError = err?.message ?? 'unknown_error';
}

// Restore fetch
globalThis.fetch = originalFetch;

check('runDryRun completed without throwing', !threwDuringDryRun);
check('Network was not called during dry-run', !networkCallAttempted);
check('Captured output has at least one line', capturedLines.length > 0);
log('');

// ---------------------------------------------------------------------------
// Group 5: Required output content
// ---------------------------------------------------------------------------
log('--- Group 5: Required output content ---');

const allOutput = capturedLines.join('\n');

check(
  'Dry-run output includes mode=dry-run',
  allOutput.includes('mode=dry-run'),
);
check(
  'Dry-run output includes liveAttempted=false',
  allOutput.includes('liveAttempted=false'),
);
check(
  'Dry-run output includes maxRequests=2 or maxThemes=2',
  allOutput.includes('maxRequests=2') || allOutput.includes('maxThemes=2'),
);
check(
  'Dry-run output includes result=PASS',
  allOutput.includes('result=PASS'),
);
check(
  'Dry-run output confirms live is blocked',
  allOutput.includes('live-blocked') || allOutput.includes('live_blocked') || allOutput.includes('live-requires'),
);
check(
  'Dry-run output confirms no-network-no-env-reads',
  allOutput.includes('no-network') || allOutput.includes('no-env'),
);
check(
  'Dry-run output confirms route is fixture-backed',
  allOutput.includes('source=fixture') || allOutput.includes("source='fixture'"),
);
check(
  'Dry-run output includes sanitized=true marker on all lines',
  capturedLines.every((line) => line === '' || line.includes('sanitized=true')),
);
log('');

// ---------------------------------------------------------------------------
// Group 6: Forbidden output content (no leaked data)
// ---------------------------------------------------------------------------
log('--- Group 6: Forbidden output content ---');

// Check for patterns that indicate data leakage
const FORBIDDEN_CHECKS = [
  {
    label: 'No raw URLs in output (no https:// or http:// patterns)',
    pattern: /https?:\/\/\S+/,
  },
  {
    label: 'No API key value patterns in output (GNEWS_API_KEY=<value>)',
    pattern: /GNEWS_API_KEY=\S/,
  },
  {
    label: 'No PUBLIC_GNEWS_API_KEY value patterns in output',
    pattern: /PUBLIC_GNEWS_API_KEY=\S/,
  },
  {
    label: 'No raw JSON articles array in output',
    pattern: /"articles"\s*:\s*\[/,
  },
  {
    label: 'No raw title fields in output',
    pattern: /"title"\s*:\s*"/,
  },
  {
    label: 'No raw description fields in output',
    pattern: /"description"\s*:\s*"/,
  },
  {
    label: 'No stack traces in output',
    pattern: /^\s+at\s+\w/m,
  },
  {
    label: 'No gnews.io domain reference in output',
    pattern: /gnews\.io/i,
  },
];

for (const { label, pattern } of FORBIDDEN_CHECKS) {
  check(label, !pattern.test(allOutput));
}
log('');

// ---------------------------------------------------------------------------
// Group 7: Process state
// ---------------------------------------------------------------------------
log('--- Group 7: Process state ---');

// process.exitCode is set by main(), not by runDryRun() directly.
// Since main() was not called (guarded by process.argv[1] check),
// exitCode should remain undefined (treated as 0) unless this checker sets it.
// We verify dry-run did not leave exitCode as 1.
const currentExitCode = process.exitCode ?? 0;
check(
  'process.exitCode is 0 after dry-run invocation (no failure code set)',
  currentExitCode === 0,
);
check(
  'No dry-run error was thrown',
  !threwDuringDryRun,
);
log('');

// ---------------------------------------------------------------------------
// Group 8: Output line count sanity
// ---------------------------------------------------------------------------
log('--- Group 8: Output sanity ---');
check('Dry-run produced between 3 and 20 output lines', capturedLines.length >= 3 && capturedLines.length <= 20);
check(
  'Each output line is reasonably short (no raw payload lines over 500 chars)',
  capturedLines.every((line) => line.length <= 500),
);
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Result ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}. ${failures === 0 ? 'Result: PASS' : 'Result: FAIL'}`);
if (failures === 0) {
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
