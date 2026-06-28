/**
 * Phase 3DU-OWNER-REVIEW-CLOSEOUT static documentation contract.
 * No network, credentials, browser, dev server, live Supabase, or external APIs.
 */

globalThis.fetch = () => {
  throw new Error('Network access is blocked in the owner-review closeout checker.');
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const closeoutPath = 'docs/planning/phase_3du_owner_review_closeout_result_v0.1.md';
const changelogPath = 'docs/planning/planning_changelog.md';
const packagePath = 'package.json';

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const closeout = read(closeoutPath);
const changelog = read(changelogPath);
const packageJson = read(packagePath);

const sectionStart = changelog.indexOf('## Phase 3DU-OWNER-REVIEW-CLOSEOUT -');
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

process.stdout.write('=== Phase 3DU-OWNER-REVIEW-CLOSEOUT Static Contract ===\n\n');

process.stdout.write('Files and package script:\n');
check('Closeout document exists', existsSync(join(root, closeoutPath)));
check('Planning changelog exists', existsSync(join(root, changelogPath)));
check('Package script exists',
  packageJson.includes('"check:phase-3du-owner-review-closeout"') &&
  packageJson.includes('check_phase_3du_owner_review_closeout_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Baseline and status:\n');
check('Closeout identifies exact phase',
  closeout.includes('Phase 3DU-OWNER-REVIEW-CLOSEOUT'));
check('Closeout states owner review PASS',
  closeout.includes('Completed — owner review PASS'));
check('Closeout references implementation commit 06549cc', closeout.includes('06549cc'));
check('Closeout references review preparation commit 18dcc83', closeout.includes('18dcc83'));
check('Closeout references HF2 commit 937596a', closeout.includes('937596a'));
check('Closeout states production deployment not performed',
  /Production deployment: not performed|No production deployment was performed/i.test(closeout));
process.stdout.write('\n');

process.stdout.write('Owner review acceptance:\n');
check('PC slots 1-5 PASS is recorded', closeout.includes('PC slots 1–5: PASS'));
check('Mobile slots 1-5 PASS is recorded', closeout.includes('Mobile slots 1–5: PASS'));
check('URL-only workflow PASS is recorded', closeout.includes('URL-only workflow: PASS'));
check('No file upload UI PASS is recorded', closeout.includes('No file upload UI: PASS'));
check('Mobile placement PASS is recorded',
  closeout.includes('MY PORTFOLIO') && closeout.includes('MARKET SNAPSHOT') &&
  /placement.*PASS/i.test(closeout));
check('390px, 430px, and 859px checks are recorded',
  ['390px', '430px', '859px'].every((width) => closeout.includes(width)));
check('860px hidden check is recorded', closeout.includes('860px') && /hidden.*PASS/i.test(closeout));
check('1440px+ PC rail regression PASS is recorded',
  closeout.includes('1440px+') && /PC rail regression.*PASS/i.test(closeout));
check('Zero, one, and multiple states PASS is recorded',
  /Zero, one, and multiple banner states: PASS/i.test(closeout));
check('5000ms rotation PASS is recorded', closeout.includes('5000ms rotation behavior: PASS'));
check('Storage compatibility PASS is recorded', closeout.includes('Storage compatibility: PASS'));
process.stdout.write('\n');

process.stdout.write('HF2 re-test acceptance:\n');
check('PC slot 2 link persistence PASS is recorded',
  closeout.includes('PC slot 2 link URL persistence: PASS'));
check('PC slot 3 active persistence PASS is recorded',
  closeout.includes('PC slot 3 active checkbox persistence: PASS'));
check('Unchecked PC slot exclusion PASS is recorded',
  /PC slot 3 excluded from desktop rail when unchecked: PASS/i.test(closeout));
check('PC/mobile slots 1-5 regression PASS is recorded',
  closeout.includes('PC/mobile slots 1–5 regression: PASS'));
check('Original settings restored PASS is recorded',
  closeout.includes('Original banner settings restored after test: PASS'));
process.stdout.write('\n');

process.stdout.write('Accepted policy and safety:\n');
check('Checked-slot eligibility is documented',
  /Checked slots with valid HTTP\(S\) image URLs are eligible/i.test(closeout));
check('Unchecked-slot exclusion is documented',
  /Unchecked slots are excluded even when image URLs exist/i.test(closeout));
check('Both storage shapes remain supported',
  /Legacy array-shaped and object-shaped storage remain supported/i.test(closeout));
check('No secrets shared is documented', /No secrets were shared/i.test(closeout));
check('No raw database rows shared is documented', /No raw database rows were shared/i.test(closeout));
check('No live Supabase by Codex is documented', /No live Supabase calls were made by Codex/i.test(closeout));
check('No SQL or migration is documented',
  /No SQL was executed and no migration was added/i.test(closeout));
check('No Vercel and no push are documented',
  /No Vercel command was run/i.test(closeout) && /No push was performed/i.test(closeout));
process.stdout.write('\n');

process.stdout.write('Next phase and changelog:\n');
check('Closeout routes to Phase 3DV', closeout.includes('Phase 3DV'));
check('Closeout requires explicit deployment approval',
  /only after explicit owner approval to deploy/i.test(closeout));
check('Changelog contains exact closeout section', sectionStart !== -1);
check('Changelog section states completed owner PASS',
  phaseSection.includes('Completed — owner review PASS'));
check('Changelog section records HF2 re-test PASS',
  phaseSection.includes('PC slot 2 link URL persistence PASS') &&
  phaseSection.includes('PC slot 3 active checkbox persistence PASS'));
check('Changelog section states no runtime changes or deployment',
  /No runtime changes/i.test(phaseSection) && /No production deployment/i.test(phaseSection));
check('Changelog routes deployment only after explicit approval',
  phaseSection.includes('Phase 3DV') && /only after explicit owner approval/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
