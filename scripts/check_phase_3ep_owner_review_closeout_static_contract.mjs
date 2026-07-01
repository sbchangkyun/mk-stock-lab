/**
 * Phase 3EP-OWNER-REVIEW-CLOSEOUT documentation/tooling contract.
 * Static only: no network, browser, dev server, API, provider, live KIS, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EP owner-review closeout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'fde7d42';
const paths = {
  closeout: 'docs/planning/phase_3ep_owner_review_closeout_result_v0.1.md',
  checker: 'scripts/check_phase_3ep_owner_review_closeout_static_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
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
const phaseSection = source.changelog
  .split('## Phase 3EP-OWNER-REVIEW-CLOSEOUT - 2026-07-01')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) => path.startsWith('src/lib/server/providers/'));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const RAW_FIELDS = /stck_prpr|prdy_vrss|prdy_ctrt|acml_vol|rt_cd|msg_cd/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);
// No numeric price value on a price line (booleans/labels only).
const NO_PRICE = (text) =>
  !/(현재가|전일종가|lastPrice|previous close|current price)[^\n]*\b\d{3,}\b/i.test(text);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EP-OWNER-REVIEW-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files, command, and decision:\n');
check('Closeout result document exists', existsSync(join(root, paths.closeout)));
check('Static checker exists', existsSync(join(root, paths.checker)));
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3ep-owner-review-closeout'] ===
    'node scripts/check_phase_3ep_owner_review_closeout_static_contract.mjs');
check('Changelog contains Phase 3EP-OWNER-REVIEW-CLOSEOUT', phaseSection.length > 0);
check('Closeout status records owner review PASS',
  source.closeout.includes('Closed — owner review PASS.'));
check('Closeout decision records PASS', source.closeout.includes('## 2. Decision\n\n`PASS`'));
check('Changelog decision records PASS', phaseSection.includes('**Decision**: `PASS`'));
process.stdout.write('\n');

process.stdout.write('Owner-local review evidence:\n');
check('Records owner-local preview page', source.closeout.includes('/chart-ai?source=owner-local'));
check('Records KIS 로컬 프리뷰 card evidence', source.closeout.includes('KIS 로컬 프리뷰'));
check('Records 삼성전자 / 005930 preview', source.closeout.includes('삼성전자') && source.closeout.includes('005930'));
check('Records quote field presence',
  source.closeout.includes('previous close') && source.closeout.includes('change rate') &&
  source.closeout.includes('volume') && source.closeout.includes('asOf'));
check('Records delayed owner-local KRW label', source.closeout.includes('지연 시세 · 오너 로컬 전용 · KRW'));
check('Records no raw response / no secrets / no stack trace',
  source.closeout.includes('No raw response') && source.closeout.includes('no secrets') &&
  source.closeout.includes('no stack trace'));
process.stdout.write('\n');

process.stdout.write('Sanitization (no prices, raw fields, or secrets):\n');
check('Closeout records no actual numeric prices', NO_PRICE(source.closeout));
check('Closeout contains no raw KIS response fields', !RAW_FIELDS.test(source.closeout));
check('Closeout contains no secret-looking values', !SECRET_VALUE(source.closeout));
process.stdout.write('\n');

process.stdout.write('Production boundary and safety:\n');
check('Vercel env note does not authorize public exposure',
  source.closeout.includes('does NOT') && source.closeout.includes('authorize public live quote exposure'));
check('Production remains blocked/gated',
  source.closeout.includes('Production stays blocked') || source.closeout.includes('remains owner-local gated'));
check('Closeout confirms no live KIS re-run', source.closeout.includes('No live KIS re-run.'));
check('Closeout confirms no deployment', source.closeout.includes('No deployment.'));
check('Closeout confirms no push', source.closeout.includes('No push.'));
process.stdout.write('\n');

process.stdout.write('Documentation-only boundaries:\n');
check('No src file changed in this closeout', srcChanges.length === 0);
check('No API route file changed', apiChanges.length === 0);
check('No provider file changed', providerChanges.length === 0);
check('No image file added', addedImages.length === 0);
check('No dependency added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json'));
check('No Supabase file changed', ![...phaseChanges].some((p) => /supabase/i.test(p)));
check('No SQL/migration file added', ![...phaseChanges].some((p) => /migration|\.sql$/i.test(p)));
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Closeout recommends Phase 3EQ',
  source.closeout.includes('Phase 3EQ — KIS Chart/OHLC Feasibility and Chart Data Integration Plan'));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EP owner-review closeout checker.') && !fetchAttempted);
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EP-OWNER-REVIEW-CLOSEOUT checks passed.\n');
}
