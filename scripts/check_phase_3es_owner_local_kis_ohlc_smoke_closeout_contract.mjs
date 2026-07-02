/**
 * Phase 3ES-OWNER-SMOKE-CLOSEOUT documentation/tooling contract.
 * Static only: no network, browser, dev server, API, provider, live smoke, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3ES owner-smoke closeout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'd84884b';
// No ending commit is pinned yet: this closeout has not been committed at checker-authoring time,
// so the diff intentionally extends to the current working tree.
const paths = {
  closeout: 'docs/planning/phase_3es_owner_local_kis_ohlc_smoke_closeout_result_v0.1.md',
  result: 'docs/planning/phase_3es_owner_local_kis_ohlc_smoke_result_v0.1.md',
  checker: 'scripts/check_phase_3es_owner_local_kis_ohlc_smoke_closeout_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  registry: 'src/lib/server/providers/kis/kisOhlcEndpointRegistry.ts',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3ES-OWNER-SMOKE-CLOSEOUT - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) => path.startsWith('src/lib/server/providers/'));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

// Shared redaction guards applied to both the result and closeout docs.
const NO_OHLC_VALUE = (text) =>
  !/(open|high|low|close)[^\n]{0,40}\b\d{3,}(\.\d+)?\b/i.test(text.replace(/pointCount[^\n]*27/gi, ''));
const NO_RAW_RESPONSE = (text) =>
  !/rt_cd|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|stck_bsop_date|acml_vol/i.test(text);
const NO_SECRET_VALUE = (text) =>
  !/Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) &&
  !/KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) &&
  !/KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) &&
  !/KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) &&
  !/authorization:\s*Bearer/i.test(text);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3ES-OWNER-SMOKE-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Closeout result document exists', existsSync(join(root, paths.closeout)));                        // 1
check('Static checker exists', existsSync(join(root, paths.checker)));                                    // 2
check('Package checker command exists',                                                                   // 3
  packageJson.scripts?.['check:phase-3es-owner-local-kis-ohlc-smoke-closeout'] ===
    'node scripts/check_phase_3es_owner_local_kis_ohlc_smoke_closeout_contract.mjs');
check('Changelog contains Phase 3ES-OWNER-SMOKE-CLOSEOUT', phaseSection.length > 0);                       // 4
process.stdout.write('\n');

process.stdout.write('Decision and owner-run evidence:\n');
check('Closeout decision records PASS_WITH_OWNER_LOCAL_RUN',
  source.closeout.includes('`PASS_WITH_OWNER_LOCAL_RUN`'));                                                // 5
check('Phase 3ES result document records owner-run PASS',
  source.result.includes('PASS_WITH_OWNER_LOCAL_RUN') && source.result.includes('### 5.3 Owner-run attempt (PASS'));   // 6
check('Phase 3ES result preserves automated-session BLOCKED note',
  source.result.includes('Automated-session attempt') && source.result.includes('BLOCKED') &&
  source.result.includes('not-run'));                                                                      // 7
check('Owner-run evidence records KR / 005930 / stock / 1m',
  source.closeout.includes('KR') && source.closeout.includes('005930') &&
  source.closeout.includes('stock') && source.closeout.includes('1m'));                                    // 8
check('Owner-run evidence records endpointKey KR_STOCK_DAILY_OHLC',
  source.closeout.includes('KR_STOCK_DAILY_OHLC'));                                                        // 9
check('Owner-run evidence records endpointVerified true',
  /endpointVerified:\s*`true`/.test(source.closeout));                                                     // 10
check('Owner-run evidence records httpStatusClass 2xx',
  /httpStatusClass:\s*`2xx`/.test(source.closeout));                                                        // 11
check('Owner-run evidence records pointCount 27',
  /pointCount:\s*`27`/.test(source.closeout));                                                              // 12
check('Owner-run evidence records renderable true',
  /renderable:\s*`true`/.test(source.closeout));                                                            // 13
check('Owner-run evidence records open/high/low/close/volume booleans true',
  /open\s*`true`,\s*high\s*`true`,\s*low\s*`true`,\s*close\s*`true`,\s*volume\s*`true`/.test(source.closeout)); // 14
check('Owner-run evidence records source kis-local',
  /source:\s*`kis-local`/.test(source.closeout));                                                           // 15
check('Owner-run evidence records freshness delayed',
  /freshness:\s*`delayed`/.test(source.closeout));                                                          // 16
check('Owner-run evidence records isLive true',
  /isLive:\s*`true`/.test(source.closeout));                                                                // 17
check('Owner-run evidence records providerStatus ok',
  /providerStatus:\s*`ok`/.test(source.closeout));                                                          // 18
check('Owner-run evidence records rawResponsePrinted false',
  /rawResponsePrinted:\s*`false`/.test(source.closeout));                                                   // 19
check('Owner-run evidence records secretsPrinted false',
  /secretsPrinted:\s*`false`/.test(source.closeout));                                                       // 20
process.stdout.write('\n');

process.stdout.write('Endpoint verification:\n');
check('Endpoint verification records inquire-daily-itemchartprice',
  source.closeout.includes('inquire-daily-itemchartprice'));                                                // 21
check('Endpoint verification records FHKST03010100', source.closeout.includes('FHKST03010100'));            // 22
check('Intraday remains unverified',
  source.closeout.toLowerCase().includes('intraday') && /intraday[^\n]*unverified/i.test(source.closeout) &&
  /KR_STOCK_INTRADAY_OHLC[\s\S]{0,200}verification:\s*'unverified'/.test(source.registry));                 // 23
check('US remains unverified',
  /US[^\n]*unverified/i.test(source.closeout) &&
  /US_STOCK_DAILY_OHLC[\s\S]{0,200}verification:\s*'unverified'/.test(source.registry));                    // 24
process.stdout.write('\n');

process.stdout.write('Sanitization (no OHLC values, raw response, or secrets):\n');
check('No actual OHLC values recorded', NO_OHLC_VALUE(source.closeout) && NO_OHLC_VALUE(source.result));    // 25
check('No raw KIS response fields recorded',
  NO_RAW_RESPONSE(source.closeout) && NO_RAW_RESPONSE(source.result));                                      // 26
check('No secret-looking values recorded',
  NO_SECRET_VALUE(source.closeout) && NO_SECRET_VALUE(source.result));                                      // 27
process.stdout.write('\n');

process.stdout.write('Documentation-only boundaries:\n');
check('No src runtime files changed in this closeout', srcChanges.length === 0);                            // 28
check('No API route changed', apiChanges.length === 0);                                                     // 29
check('No provider runtime changed', providerChanges.length === 0);                                         // 30
check('No image files added', addedImages.length === 0);                                                    // 31
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));             // 32
check('No Supabase/SQL/migration added',
  ![...phaseChanges].some((path) => /supabase|migration|\.sql$/i.test(path)));                              // 33
check('Changelog records no deployment', /no deployment/i.test(phaseSection));                              // 34
check('Changelog records no push', /no push/i.test(phaseSection));                                          // 35
check('Recommended next phase is Phase 3ET',
  source.closeout.includes('Phase 3ET — Chart AI Owner-Local OHLC Preview Wiring'));                        // 36
check('Known legacy checker notes preserved',
  source.closeout.includes('check:kis-quote-adapter-mocked') && source.closeout.includes('100/101'));       // 37
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3ES owner-smoke closeout checker.') && !fetchAttempted); // 38
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3ES-OWNER-SMOKE-CLOSEOUT checks passed.\n');
}
