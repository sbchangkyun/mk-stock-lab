/**
 * Phase 3DV production deployment documentation static contract.
 * This checker performs no network, Vercel, browser, credential, or live data calls.
 */

globalThis.fetch = () => {
  throw new Error('Network access is blocked in the Phase 3DV static checker.');
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const resultPath = 'docs/planning/phase_3dv_mobile_home_ad_banner_production_deployment_result_v0.1.md';
const changelogPath = 'docs/planning/planning_changelog.md';
const packagePath = 'package.json';

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const result = read(resultPath);
const changelog = read(changelogPath);
const packageJson = read(packagePath);

const sectionStart = changelog.indexOf('## Phase 3DV -');
const sectionEnd = changelog.indexOf('\n## Phase ', sectionStart + 1);
const phaseSection = sectionStart === -1
  ? ''
  : sectionEnd === -1
    ? changelog.slice(sectionStart)
    : changelog.slice(sectionStart, sectionEnd);

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

process.stdout.write('=== Phase 3DV Production Deployment Static Contract ===\n\n');

process.stdout.write('Files and package script:\n');
check('Deployment result document exists', existsSync(join(root, resultPath)));
check('Planning changelog exists', existsSync(join(root, changelogPath)));
check('Package script exists',
  packageJson.includes('"check:phase-3dv-production-deployment"') &&
  packageJson.includes('check_phase_3dv_production_deployment_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Deployment baseline and target:\n');
check('Result states deployed to production', result.includes('Deployed to production'));
check('Result references deployed baseline ec41d41', result.includes('ec41d41'));
check('Result references canonical production URL',
  result.includes('https://mkstocklab.vercel.app'));
check('Result references canonical Vercel project',
  result.includes('Vercel project target: `mkstocklab`'));
check('Result states no temporary project was created',
  result.includes('Temporary/non-canonical project created: no'));
check('Result states pre-existing non-canonical project was not used',
  result.includes('Pre-existing non-canonical project used: no'));
check('Result records production deployment URL',
  /Deployment URL: `https:\/\/mkstocklab-[^`]+\.vercel\.app`/.test(result));
check('Result records READY inspection', result.includes('Deployment inspection: READY'));
process.stdout.write('\n');

process.stdout.write('Validation and public checks:\n');
check('Pre-deploy validation section exists', result.includes('## 4. Validation Before Deployment'));
check('All required pre-deploy commands are recorded',
  [
    'check:phase-3du-owner-review-closeout',
    'check:phase-3du-hf2-banner-admin-persistence',
    'check:phase-3du-mobile-home-ad-banner',
    'check:home-rail-banner-settings',
    'check:home-ad-slots',
    'check:production-domain',
    'npm run build',
    'git diff --check',
  ].every((command) => result.includes(command)));
check('Post-deploy public checks section exists', result.includes('## 6. Post-Deploy Public Checks'));
check('Canonical root HTTP 200 is recorded',
  /mkstocklab\.vercel\.app`: HTTP 200/.test(result));
check('Canonical mypage HTTP 200 is recorded',
  /mkstocklab\.vercel\.app\/mypage`: HTTP 200/.test(result));
check('Wrong temporary project was not used', result.includes('Wrong temporary project used: no'));
process.stdout.write('\n');

process.stdout.write('Safety and owner follow-up:\n');
check('No secrets were read or printed', result.includes('No secrets were read or printed'));
check('No live Supabase rows were inspected',
  result.includes('No live Supabase database rows were inspected'));
check('No SQL or migration occurred',
  result.includes('No SQL was executed and no migration was added'));
check('No Supabase Storage upload occurred',
  result.includes('No Supabase Storage upload was performed'));
check('No Vercel environment changes occurred',
  result.includes('No Vercel environment variable or project setting was changed'));
check('No browser automation or push occurred',
  result.includes('No browser automation was run') && result.includes('No push was performed'));
check('Owner post-deploy check is pending', result.includes('Owner post-deploy check is pending'));
check('Owner post-deploy checklist covers mobile, desktop, admin, and persistence',
  result.includes('Mobile banner remains hidden at 860px+') &&
  result.includes('PC rail appears at 1440px+') &&
  result.includes('MyPage PC/mobile banner admin') &&
  result.includes('PC banner save persistence remains fixed'));
process.stdout.write('\n');

process.stdout.write('Planning changelog:\n');
check('Changelog contains exact Phase 3DV section', sectionStart !== -1);
check('Changelog marks deployment complete', phaseSection.includes('Deployed to production'));
check('Changelog references canonical project and URL',
  phaseSection.includes('mkstocklab') && phaseSection.includes('https://mkstocklab.vercel.app'));
check('Changelog references deployed baseline ec41d41', phaseSection.includes('ec41d41'));
check('Changelog says no new temporary project was created',
  phaseSection.includes('No new temporary project was created'));
check('Changelog records validation and public checks',
  phaseSection.includes('public HTTP 200 checks'));
check('Changelog records owner post-deploy check pending',
  phaseSection.includes('Owner post-deploy check') && phaseSection.includes('pending'));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
