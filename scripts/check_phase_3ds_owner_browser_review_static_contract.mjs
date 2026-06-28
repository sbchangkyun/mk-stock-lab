/**
 * Phase 3DS Owner Browser Review — Static Contract Checker
 * Verifies the 3DS review runbook doc and changelog satisfy the phase contract.
 * No-network: fetch is blocked. Does not run the dev server, open a browser,
 * call KIS, call Supabase, call GNews, call AI providers, or call FX providers.
 */

// Block all network calls at the checker level.
globalThis.fetch = () => {
  throw new Error('Network access blocked in static checker.');
};

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

let passed = 0;
let failed = 0;
const failures = [];

const check = (label, condition) => {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
    failures.push(label);
  }
};

const readFile = (rel) => {
  try {
    return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
  } catch {
    return '';
  }
};

const fileExists = (rel) => fs.existsSync(path.join(repoRoot, rel));

const reviewDoc  = readFile('docs/planning/phase_3ds_owner_local_browser_review_portfolio_live_preview_ui_result_v0.1.md');
const changelog  = readFile('docs/planning/planning_changelog.md');
const packageJson = readFile('package.json');

// Extract only the Phase 3DS section of the changelog.
const dsSectionStart = changelog.indexOf('## Phase 3DS');
const dsSectionEnd   = changelog.indexOf('\n## Phase ', dsSectionStart + 1);
const dsSection =
  dsSectionStart === -1
    ? ''
    : dsSectionEnd === -1
    ? changelog.slice(dsSectionStart)
    : changelog.slice(dsSectionStart, dsSectionEnd);

// ── Group 1: File Existence and Package Script ─────────────────────────────────
console.log('\n=== Group 1: File Existence and Package Script ===');

check('3DS review runbook doc exists',
  fileExists('docs/planning/phase_3ds_owner_local_browser_review_portfolio_live_preview_ui_result_v0.1.md'));

check('Planning changelog exists',
  fileExists('docs/planning/planning_changelog.md'));

check('Package script check:phase-3ds-owner-browser-review exists',
  packageJson.includes('"check:phase-3ds-owner-browser-review"'));

// ── Group 2: Metadata and Baseline ───────────────────────────────────────────
console.log('\n=== Group 2: Metadata and Baseline ===');

check('Doc includes Phase 3DS',                  reviewDoc.includes('Phase 3DS'));
check('Doc includes Owner Local Browser Review', /Owner Local Browser Review/i.test(reviewDoc));
check('Doc includes prepared status',            reviewDoc.includes('Prepared — owner browser review pending'));
check('Doc references commit adee857',           reviewDoc.includes('adee857'));
check('Doc references src/pages/portfolio.astro', reviewDoc.includes('src/pages/portfolio.astro'));
check('Doc references isOwnerPreviewActive',     reviewDoc.includes('isOwnerPreviewActive'));
check('Doc references isLivePreviewEligible',    reviewDoc.includes('isLivePreviewEligible'));
check('Doc references getStaleStateLabel',       reviewDoc.includes('getStaleStateLabel'));
check('Doc states source=fixture is default',    /source=.?fixture.? remains default|source.*fixture.*default|fixture.*default/i.test(reviewDoc));
check('Doc states source=auto is deferred',      /source=.?auto.? remains deferred|source.*auto.*deferred|auto.*deferred/i.test(reviewDoc));

// ── Group 3: Owner Review URLs ────────────────────────────────────────────────
console.log('\n=== Group 3: Owner Review URLs ===');

check('Doc includes local preview URL',
  reviewDoc.includes('http://localhost:4321/portfolio?previewMode=owner'));

check('Doc includes local fixture regression URL',
  reviewDoc.includes('http://localhost:4321/portfolio'));

check('Doc includes production safety check URL',
  reviewDoc.includes('https://mkstocklab.vercel.app/portfolio?previewMode=owner'));

// ── Group 4: Preview Gate Checks ──────────────────────────────────────────────
console.log('\n=== Group 4: Preview Gate Checks ===');

check('Doc mentions localhost gate',      reviewDoc.includes('localhost'));
check('Doc mentions 127.0.0.1 gate',      reviewDoc.includes('127.0.0.1'));
check('Doc mentions ?previewMode=owner',  reviewDoc.includes('?previewMode=owner'));
check('Doc states production hostname does not activate preview',
  /production hostname.*not activate|production hostname.*does NOT activate|production.*does not activate/i.test(reviewDoc));
check('Doc states fixture remains default',
  /fixture.*remains default|fixture.*default|source.*fixture.*default/i.test(reviewDoc));
check('Doc states live preview is not default',
  /live preview is not default|live.*not.*default|not.*default.*live/i.test(reviewDoc));

// ── Group 5: Review Checklist ─────────────────────────────────────────────────
console.log('\n=== Group 5: Review Checklist ===');

check('Checklist includes Normal Fixture Mode group',      /Normal Fixture Mode/i.test(reviewDoc));
check('Checklist includes Owner Preview Activation group', /Owner Preview Activation/i.test(reviewDoc));
check('Checklist includes Live Preview Eligibility group', /Live Preview Eligibility/i.test(reviewDoc));
check('Checklist includes KPI Summary Behavior group',     /KPI Summary Behavior/i.test(reviewDoc));
check('Checklist includes Row Display and Badges group',   /Row Display and Badges/i.test(reviewDoc));
check('Checklist includes Mobile Review group',            /Mobile Review/i.test(reviewDoc));
check('Checklist includes Production-Safety Review group', /Production-Safety Review/i.test(reviewDoc));
check('Checklist includes Browser Console / Network Safety group',
  /Browser Console.*Network Safety|Network Safety/i.test(reviewDoc));

// ── Group 6: Korean UI Labels ─────────────────────────────────────────────────
console.log('\n=== Group 6: Korean UI Labels ===');

check('Doc includes label 조회 시점 기준',                         reviewDoc.includes('조회 시점 기준'));
check('Doc includes label 최근 조회 기준',                         reviewDoc.includes('최근 조회 기준'));
check('Doc includes label 데이터 일시 불가',                       reviewDoc.includes('데이터 일시 불가'));
check('Doc includes label 연동 실패',                              reviewDoc.includes('연동 실패'));
check('Doc includes ineligibility message',
  reviewDoc.includes('현재 포트폴리오는 미리보기 조건을 충족하지 않습니다.'));
check('Doc includes [Owner Preview] 조회 시점 기준 평가 label',
  reviewDoc.includes('[Owner Preview] 조회 시점 기준 평가'));
check('Doc includes Fixture 기준 평가값입니다. label',
  reviewDoc.includes('Fixture 기준 평가값입니다.'));
check('Doc explicitly prohibits 실시간 label',                     reviewDoc.includes('실시간'));
check('Doc explicitly prohibits 실시간 시세 label',                reviewDoc.includes('실시간 시세'));

// ── Group 7: Safety Policy ────────────────────────────────────────────────────
console.log('\n=== Group 7: Safety Policy ===');

check('Doc says do not share screenshots unless redacted',
  /do not share screenshots unless.*redact|screenshots.*redact/i.test(reviewDoc));
check('Doc says do not share full API responses',
  /do not share full API responses|do not share.*API response/i.test(reviewDoc));
check('Doc says do not share request or response bodies',
  /do not share request.*response bodies|request.*response bodies/i.test(reviewDoc));
check('Doc says do not share prices',
  /do not share prices|do not.*share.*prices/i.test(reviewDoc));
check('Doc says do not share tokens',
  /do not share tokens|do not.*share.*tokens/i.test(reviewDoc));
check('Doc says do not share secrets',
  /do not share.*secrets|do not.*secrets/i.test(reviewDoc));
check('Doc says do not share account numbers',
  /do not share account numbers|do not.*account numbers/i.test(reviewDoc));
check('Doc says do not share provider payloads',
  /do not share provider payloads|do not.*provider payloads/i.test(reviewDoc));
check('Doc says do not share headers',
  /do not share request headers|do not share.*headers/i.test(reviewDoc));
check('Doc says do not share raw KIS field names',
  /do not share raw KIS field|raw KIS field.*not|do not.*KIS field/i.test(reviewDoc));
check('Doc says do not expose providerMeta',
  /do not.*providerMeta|providerMeta.*not|providerMeta.*not expose/i.test(reviewDoc));

// ── Group 8: Owner Report Template ───────────────────────────────────────────
console.log('\n=== Group 8: Owner Report Template ===');

check('Report template includes fixture mode section',
  /fixture mode.*pass\/fail|Fixture mode/i.test(reviewDoc));
check('Report template includes owner preview mode section',
  /owner preview mode.*pass\/fail|Owner preview mode/i.test(reviewDoc));
check('Report template includes freshness label fields',
  /Fresh badge.*조회 시점 기준|조회 시점 기준.*pass\/fail/i.test(reviewDoc));
check('Report template includes KPI behavior section',
  /KPI behavior|KPI.*pass\/fail/i.test(reviewDoc));
check('Report template includes eligibility section',
  /Eligibility.*pass\/fail|eligibility section/i.test(reviewDoc) ||
  /Aggregate blocked.*pass\/fail|Eligibility/i.test(reviewDoc));
check('Report template includes mobile section',
  /Mobile.*pass\/fail|390px layout/i.test(reviewDoc));
check('Report template includes safety section',
  /Safety.*pass\/fail|No raw API response/i.test(reviewDoc));
check('Report template includes PASS decision',    reviewDoc.includes('PASS'));
check('Report template includes FAIL decision',    reviewDoc.includes('FAIL'));
check('Report template includes RETRY REQUIRED',   reviewDoc.includes('RETRY REQUIRED'));

// ── Group 9: Decision Rules ───────────────────────────────────────────────────
console.log('\n=== Group 9: Decision Rules ===');

check('Doc references Phase 3DS-CLOSEOUT', reviewDoc.includes('3DS-CLOSEOUT'));
check('Doc references Phase 3DS-Retry',    reviewDoc.includes('3DS-Retry'));
check('Doc references Phase 3DR-HF1',      reviewDoc.includes('3DR-HF1'));

// ── Group 10: Changelog ───────────────────────────────────────────────────────
console.log('\n=== Group 10: Changelog ===');

check('Changelog includes Phase 3DS',
  changelog.includes('Phase 3DS'));

check('Changelog 3DS section includes Owner Local Browser Review',
  /Owner Local Browser Review/i.test(dsSection));

check('Changelog 3DS section states Prepared — owner browser review pending',
  dsSection.includes('Prepared — owner browser review pending'));

check('Changelog 3DS section states no runtime UI changes',
  /no runtime UI changes|No runtime UI|runtime UI.*None/i.test(dsSection));

check('Changelog 3DS section states no API route changes',
  /no API route changes|no.*API.*changes/i.test(dsSection));

check('Changelog 3DS section states no production deployment',
  /no production deployment|No.*production deployment/i.test(dsSection));

check('Changelog 3DS section states owner manual review pending',
  /owner.*manual.*review.*pending|owner performs.*browser review.*manually|owner.*manual/i.test(dsSection));

// ── Group 11: Forbidden Patterns ─────────────────────────────────────────────
console.log('\n=== Group 11: Forbidden Patterns ===');

check('Review doc contains no setInterval',           !reviewDoc.includes('setInterval'));
check('Review doc contains no setTimeout',            !reviewDoc.includes('setTimeout'));
check('Review doc contains no cron references',       !reviewDoc.includes('cron'));
check('Review doc contains no SQL execution',
  !reviewDoc.includes('SELECT ') && !reviewDoc.includes('INSERT INTO'));
check('Changelog 3DS section contains no raw provider payloads',
  !dsSection.includes('stck_prpr') && !dsSection.includes('rt_cd=0'));
check('Review doc contains no actual market price values (5-digit+)',
  !/currentPrice.*[0-9]{5,}|marketValue.*[0-9]{5,}/.test(reviewDoc));
check('Review doc contains no production deployment commands',
  !reviewDoc.includes('vercel deploy') && !reviewDoc.includes('git push --force'));
check('Review doc contains no raw secret placeholders',
  !reviewDoc.includes('KIS_APP_KEY=') && !reviewDoc.includes('KIS_APP_SECRET='));
check('Review doc does not run npm run dev in an automated context',
  !reviewDoc.includes('$ npm run dev') && !reviewDoc.includes('&& npm run dev'));
check('Review doc does not execute owner smoke in automated context',
  !reviewDoc.includes('npm run smoke:portfolio-live-preview-api:owner'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailed checks:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
