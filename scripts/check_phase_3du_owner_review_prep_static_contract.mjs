/**
 * Phase 3DU-OWNER-REVIEW preparation static contract.
 * Documentation-only: no credentials, network, browser, dev server, or live calls.
 */

globalThis.fetch = () => {
  throw new Error('Network access is blocked in the owner-review preparation checker.');
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const runbookPath = 'docs/planning/phase_3du_owner_review_mobile_home_ad_banner_runbook_v0.1.md';
const reportPath = 'docs/planning/phase_3du_owner_review_mobile_home_ad_banner_report_template_v0.1.md';
const changelogPath = 'docs/planning/planning_changelog.md';
const packagePath = 'package.json';

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const runbook = read(runbookPath);
const report = read(reportPath);
const changelog = read(changelogPath);
const packageJson = read(packagePath);

const sectionStart = changelog.indexOf('## Phase 3DU-OWNER-REVIEW -');
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

process.stdout.write('=== Phase 3DU-OWNER-REVIEW Preparation Static Contract ===\n\n');

process.stdout.write('Files and package script:\n');
check('Owner review runbook exists', existsSync(join(root, runbookPath)));
check('Owner report template exists', existsSync(join(root, reportPath)));
check('Planning changelog exists', existsSync(join(root, changelogPath)));
check('Package script exists',
  packageJson.includes('"check:phase-3du-owner-review-prep"') &&
  packageJson.includes('check_phase_3du_owner_review_prep_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Runbook baseline and execution boundary:\n');
check('Runbook identifies Phase 3DU-OWNER-REVIEW', runbook.includes('Phase 3DU-OWNER-REVIEW'));
check('Runbook references implementation commit 06549cc', runbook.includes('06549cc'));
check('Runbook states owner review is pending',
  /Prepared.*owner manual browser\/admin review pending/i.test(runbook));
check('Runbook says Codex does not start the dev server or browser',
  /Codex does not start the dev server, open a browser/i.test(runbook));
check('Runbook provides owner-only local URLs',
  runbook.includes('http://localhost:4321/') && runbook.includes('http://localhost:4321/mypage'));
check('Runbook requires reversible baseline and restoration',
  /record the current active state/i.test(runbook) && /Restore baseline/i.test(runbook));
process.stdout.write('\n');

process.stdout.write('Owner review coverage:\n');
check('MyPage admin review is included', /Admin gate and MyPage structure/i.test(runbook));
check('PC slots 1-5 are covered', runbook.includes('PC slots 1–5'));
check('Mobile slots 1-5 are covered', runbook.includes('Mobile slots 1–5'));
check('PC size guidance is covered', runbook.includes('160×600'));
check('Mobile size guidance is covered', runbook.includes('720×225'));
check('URL-only and no-upload workflow is covered',
  /no file upload input/i.test(runbook) && /URL validation and preview/i.test(runbook));
check('Blocked URL schemes are covered',
  ['javascript:', 'data:', 'file:', 'vbscript:'].every((scheme) => runbook.includes(scheme)));
check('Legacy array compatibility is covered', runbook.includes('legacy array-shaped'));
check('Saving each group preserves the other group',
  /mobile group remains unchanged/i.test(runbook) && /PC slots 1–5 remain unchanged/i.test(runbook));
check('Zero, one, and multiple mobile states are covered',
  /zero-banner state/i.test(runbook) && /one-banner state/i.test(runbook) && /multiple-banner rotation/i.test(runbook));
check('5000ms rotation is covered', runbook.includes('5000ms'));
check('Placement labels are covered',
  runbook.includes('MY PORTFOLIO') && runbook.includes('MARKET SNAPSHOT'));
check('Contained fit and aspect ratio are covered',
  runbook.includes('object-fit: contain') && runbook.includes('720 / 225'));
check('Required mobile widths are covered',
  ['390px', '430px', '859px', '860px'].every((width) => runbook.includes(width)));
check('Wide desktop PC rail regression is covered',
  runbook.includes('1440px+') && /PC Home rail regression/i.test(runbook));
check('Desktop and mobile mutual exclusion is covered',
  /never visible together/i.test(runbook));
process.stdout.write('\n');

process.stdout.write('Safety and reporting:\n');
check('Runbook prohibits sharing secrets and Supabase keys',
  /Do not share.*Supabase keys/i.test(runbook) && runbook.includes('secrets'));
check('Runbook prohibits raw database rows and responses',
  /Do not share raw database rows/i.test(runbook) && /Supabase responses/i.test(runbook));
check('Runbook protects screenshots with private admin data',
  /screenshots exposing.*admin\/session data/i.test(runbook));
check('Runbook states no production review or deployment',
  /Do not test against the production URL/i.test(runbook) && /has not been deployed/i.test(runbook));
check('Runbook requires sanitized result fields',
  /only pass\/fail status/i.test(runbook) && /Sanitized Result Format/i.test(runbook));
process.stdout.write('\n');

process.stdout.write('Report template:\n');
check('Template contains Review Environment', report.includes('## 1. Review Environment'));
check('Template contains MyPage Admin Review', report.includes('## 2. MyPage Admin Review'));
check('Template contains Home Mobile Review', report.includes('## 3. Home Mobile Review'));
check('Template contains PC Rail Regression', report.includes('## 4. PC Rail Regression'));
check('Template contains Storage Compatibility', report.includes('## 5. Storage Compatibility'));
check('Template contains PASS / FAIL decision',
  report.includes('Final decision: `PASS / FAIL`'));
check('Template asserts no sensitive data included',
  report.includes('Secrets or sensitive data included: `no`'));
check('Template contains all next-phase routes',
  ['Phase 3DU-OWNER-REVIEW-CLOSEOUT', 'Phase 3DU-HF1', 'Phase 3DU-HF2', 'Phase 3DV']
    .every((phase) => report.includes(phase)));
process.stdout.write('\n');

process.stdout.write('Planning changelog:\n');
check('Changelog contains the exact owner-review phase section', sectionStart !== -1);
check('Changelog status is prepared and pending',
  phaseSection.includes('Prepared — owner manual browser/admin review pending'));
check('Changelog references Phase 3DU commit', phaseSection.includes('06549cc'));
check('Changelog states no runtime source changes', /No runtime source changes/i.test(phaseSection));
check('Changelog states no production deployment', /No production deployment/i.test(phaseSection));
check('Changelog assigns manual execution to owner', /owner performs the review manually/i.test(phaseSection));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
