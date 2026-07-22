/**
 * Phase 3EL-OWNER-REVIEW-CLOSEOUT documentation/tooling contract.
 * Static only: no network, browser, dev server, API, provider, smoke, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL owner review closeout checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '742d115';
const phaseEnd = 'f00c8c2';
const paths = {
  result: 'docs/planning/phase_3el_owner_review_chart_ai_domestic_symbol_search_closeout_result_v0.1.md',
  checker: 'scripts/check_phase_3el_owner_review_closeout_static_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog
  .split('## Phase 3EL-OWNER-REVIEW-CLOSEOUT - 2026-06-30')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = git('diff', '--name-only', startingCommit, phaseEnd).split(/\r?\n/).filter(Boolean);
const srcChanges = git('diff', '--name-only', startingCommit, phaseEnd, '--', 'src').split(/\r?\n/).filter(Boolean);
const uiChanges = srcChanges.filter((path) =>
  path.startsWith('src/pages/') || path.startsWith('src/components/') || path.startsWith('src/layouts/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const imageChanges = phaseChanges.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});
const lockfileUnchanged = !phaseChanges.includes('package-lock.json');

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`  [PASS] ${label}\n`);
  } else {
    failed += 1;
    failures.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
};

process.stdout.write('=== Phase 3EL-OWNER-REVIEW-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files, command, status, and decision:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-owner-review-closeout'] ===
    'node scripts/check_phase_3el_owner_review_closeout_static_contract.mjs');
check('Changelog contains Phase 3EL-OWNER-REVIEW-CLOSEOUT', phaseSection.length > 0);
check('Closeout records failed product direction status',
  source.result.includes('Closed — owner review failed due to product direction; UX redesign required.'));
check('Closeout records FAIL_PRODUCT_DIRECTION', source.result.includes('FAIL_PRODUCT_DIRECTION'));
check('Closeout records UX_REDESIGN_REQUIRED', source.result.includes('UX_REDESIGN_REQUIRED'));
check('Closeout blocks deployment in current UI form',
  source.result.includes('Phase 3EL should not proceed to deployment or deeper quote integration in its current UI form.'));
process.stdout.write('\n');

process.stdout.write('Background and evidence:\n');
for (const phase of ['Phase 3EK', 'Phase 3EL', 'Phase 3EL-OWNER-REVIEW']) {
  check(`Closeout references ${phase}`, source.result.includes(phase));
}
check('Closeout records local owner review',
  source.result.includes('owner reviewed the local Chart AI page'));
check('Closeout records screenshots are not committed', source.result.includes('Screenshots are not committed'));
check('Closeout records no image files added', source.result.includes('no image files are added'));
check('Closeout records sanitized feedback only', source.result.includes('sanitized owner feedback only'));
check('Closeout excludes sensitive evidence',
  ['raw API response', 'secrets', 'cookies', 'browser storage', 'price payloads', 'account data', 'provider payloads']
    .every((value) => source.result.includes(value)));
process.stdout.write('\n');

process.stdout.write('Failure analysis and redesign direction:\n');
for (const section of [
  'Product Identity Failed', 'Chart Expectation Failed', 'Search Interaction Failed',
  'Information Hierarchy Failed', 'AI-First Interaction Failed', 'Missing Company/Profile Direction',
]) {
  check(`Closeout includes ${section}`, source.result.includes(section));
}
check('Closeout references familiar securities UX', source.result.includes('Familiar securities UX references'));
for (const reference of [
  'Naver Securities', 'Toss Securities', 'AlphaSquare', 'NH Investment & Securities “차분이”',
]) {
  check(`Closeout references ${reference}`, source.result.includes(reference));
}
check('Closeout includes target stock-detail pattern',
  source.result.includes('search → stock header → candlestick chart → basic stock/company information → optional MK AI analysis'));
check('Closeout includes preferred lookup label', source.result.includes('`조회`'));
check('Closeout includes MK AI activation', source.result.includes('`MK AI`'));
check('Closeout includes staged loading', /staged loading/i.test(source.result));
check('Closeout includes sequential analysis sections', /sequential analysis sections/i.test(source.result));
for (const section of ['국면·수급', '매매 전략', '가격 패턴', '기술적 지표', '지지·저항', '리스크 체크']) {
  check(`Closeout includes analysis section ${section}`, source.result.includes(section));
}
check('Closeout includes all ten redesign principles',
  Array.from({ length: 10 }, (_, index) => `${index + 1}.`).every((number) => source.result.includes(number)));
check('Closeout includes future target information architecture',
  source.result.includes('## 8. Future Target Information Architecture') &&
  source.result.includes('Candlestick chart with volume') && source.result.includes('Primary tabs'));
process.stdout.write('\n');

process.stdout.write('Company profile and next phase:\n');
check('Closeout includes company/profile data note',
  source.result.includes('## 9. Company/Profile Data Note'));
check('KIS company description availability must be verified later',
  source.result.includes('natural-language company description availability must be verified later'));
check('Closeout makes no final KIS profile-field claim',
  source.result.includes('no final KIS company-description field is claimed'));
check('Closeout starts company profile mocked/static first',
  source.result.includes('mocked/static `companyProfile`'));
check('Closeout recommends Phase 3EL-UXR',
  source.result.includes('Phase 3EL-UXR — Chart AI Stock Lookup & MK AI Interaction Redesign Plan'));
check('Closeout recommends no alternative before UXR',
  source.result.includes('Alternative: None recommended before Phase 3EL-UXR.'));
check('Closeout classifies failure as structural',
  source.result.includes('The failure is structural, not a narrow hotfix.'));
process.stdout.write('\n');

process.stdout.write('Safety and historical Phase 3EL closeout boundaries:\n');
for (const statement of [
  'No runtime changes', 'No UI changes', 'No API route changes', 'No provider changes',
  'No screenshot committed', 'No image file added', 'No dev server launched by Codex',
  'No browser automation', 'No live KIS call', 'No live FX call', 'No production API call',
  'No dependency added', 'No deployment', 'No push',
]) {
  check(`Closeout records ${statement}`, source.result.includes(statement));
}
check('Closeout records no Supabase/SQL/migration',
  source.result.includes('No Supabase access, SQL, or migration'));
check('Closeout records no Vercel changes',
  source.result.includes('No Vercel environment or project change'));
check('No src runtime file changed during the closeout', srcChanges.length === 0);
check('No UI page file changed during the closeout', uiChanges.length === 0);
check('No API route file changed during the closeout', apiChanges.length === 0);
check('No provider file changed during the closeout', providerChanges.length === 0);
check('No image file was added during the closeout', imageChanges.length === 0);
check('No dependency was added during the closeout', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records failure decision',
  phaseSection.includes('FAIL_PRODUCT_DIRECTION / UX_REDESIGN_REQUIRED'));
check('Changelog recommends Phase 3EL-UXR', phaseSection.includes('Phase 3EL-UXR'));
check('Changelog records no deployment or push',
  /no deployment/i.test(phaseSection) && /no push/i.test(phaseSection));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL owner review closeout checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read .env files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL-OWNER-REVIEW-CLOSEOUT checks passed.\n');
