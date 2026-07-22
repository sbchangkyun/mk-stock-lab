/**
 * Phase 3DS-CLOSEOUT Owner Browser Review Closeout — Static Contract Checker
 * Verifies the 3DS-CLOSEOUT doc, updated 3DS doc, and changelog satisfy the
 * closeout phase contract.
 * No-network: fetch is blocked. Does not modify any source files.
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

const closeoutDoc  = readFile('docs/planning/phase_3ds_closeout_owner_browser_review_portfolio_live_preview_ui_result_v0.1.md');
const reviewDoc    = readFile('docs/planning/phase_3ds_owner_local_browser_review_portfolio_live_preview_ui_result_v0.1.md');
const changelog    = readFile('docs/planning/planning_changelog.md');
const packageJson  = readFile('package.json');

// Combined content for cross-doc checks.
const allDocs = closeoutDoc + '\n' + reviewDoc;

// Extract the Phase 3DS-CLOSEOUT section of the changelog.
const closeSectionStart = changelog.indexOf('## Phase 3DS-CLOSEOUT');
const closeSectionEnd   = changelog.indexOf('\n## Phase ', closeSectionStart + 1);
const closeSection =
  closeSectionStart === -1
    ? ''
    : closeSectionEnd === -1
    ? changelog.slice(closeSectionStart)
    : changelog.slice(closeSectionStart, closeSectionEnd);

// ── Group 1: File Existence and Package Script ─────────────────────────────────
console.log('\n=== Group 1: File Existence and Package Script ===');

check('Updated Phase 3DS review doc exists',
  fileExists('docs/planning/phase_3ds_owner_local_browser_review_portfolio_live_preview_ui_result_v0.1.md'));

check('New Phase 3DS-CLOSEOUT doc exists',
  fileExists('docs/planning/phase_3ds_closeout_owner_browser_review_portfolio_live_preview_ui_result_v0.1.md'));

check('Planning changelog exists',
  fileExists('docs/planning/planning_changelog.md'));

check('Package script check:phase-3ds-owner-browser-review-closeout exists',
  packageJson.includes('"check:phase-3ds-owner-browser-review-closeout"'));

// ── Group 2: Completion Status ────────────────────────────────────────────────
console.log('\n=== Group 2: Completion Status ===');

check('Docs include 3DS-CLOSEOUT phase identifier',
  allDocs.includes('3DS-CLOSEOUT'));

check('Docs include Completed — owner browser review PASS',
  allDocs.includes('Completed — owner browser review PASS'));

check('Docs include Owner review PASS',
  /Owner review PASS|Owner review.*PASS|Owner decision.*PASS/i.test(allDocs));

check('Docs reference commit 63229e1',
  allDocs.includes('63229e1'));

check('Docs reference baseline commit adee857',
  allDocs.includes('adee857'));

check('Docs include source=fixture',
  allDocs.includes('source=fixture'));

check('Docs include source=auto',
  allDocs.includes('source=auto'));

check('Docs reference providerMeta',
  allDocs.includes('providerMeta'));

// ── Group 3: Accepted Behavior ────────────────────────────────────────────────
console.log('\n=== Group 3: Accepted Behavior ===');

check('Docs mention localhost gate',
  allDocs.includes('localhost'));

check('Docs mention 127.0.0.1 gate',
  allDocs.includes('127.0.0.1'));

check('Docs mention ?previewMode=owner',
  allDocs.includes('?previewMode=owner'));

check('Docs state fixture remains default',
  /source=fixture.*remains.*default|fixture.*remains.*default|fixture.*default/i.test(allDocs));

check('Docs state production UI does not use live quotes by default',
  /production.*does not.*use live quotes|production UI.*live quotes.*disabled|does not use live quotes by default/i.test(allDocs));

check('Docs state live preview is not default',
  /live preview is not.*default|live.*not.*default|not the default.*live/i.test(allDocs));

check('Docs state owner preview gate accepted',
  /owner preview gate accepted|preview gate.*accepted/i.test(allDocs));

check('Docs state KPI fallback suppression accepted',
  /KPI fallback suppression accepted|fallback suppression.*accepted/i.test(allDocs));

// ── Group 4: Korean UI Labels ─────────────────────────────────────────────────
console.log('\n=== Group 4: Korean UI Labels ===');

check('Docs include label 조회 시점 기준',  allDocs.includes('조회 시점 기준'));
check('Docs include label 최근 조회 기준',  allDocs.includes('최근 조회 기준'));
check('Docs include label 데이터 일시 불가', allDocs.includes('데이터 일시 불가'));
check('Docs include label 연동 실패',        allDocs.includes('연동 실패'));

// ── Group 5: Safety Confirmation ─────────────────────────────────────────────
console.log('\n=== Group 5: Safety Confirmation ===');

check('Docs state no raw API responses',
  /no raw API responses|raw response bodies.*No|raw.*response.*recorded.*No/i.test(allDocs));

check('Docs state no prices',
  /no prices|prices.*recorded.*No|prices.*valuation.*No/i.test(allDocs));

check('Docs state no screenshots with values',
  /no screenshots with values|screenshots.*values.*No/i.test(allDocs));

check('Docs state no secrets',
  /no secrets|secrets.*recorded.*No/i.test(allDocs));

check('Docs state no tokens',
  /no tokens|tokens.*recorded.*No/i.test(allDocs));

check('Docs state no account numbers',
  /no account numbers|account numbers.*recorded.*No/i.test(allDocs));

check('Docs state no provider payloads',
  /no provider payloads|provider payloads.*recorded.*No/i.test(allDocs));

check('Docs state no request/response bodies',
  /no request.*response bodies|request.*response bodies.*No/i.test(allDocs));

check('Docs state no headers',
  /no headers|headers.*recorded.*No/i.test(allDocs));

check('Docs state no .env read',
  /no.*\.env.*read|\.env.*files.*read.*No|no.*env.*files.*read/i.test(allDocs));

// ── Group 6: Boundary Confirmation ───────────────────────────────────────────
console.log('\n=== Group 6: Boundary Confirmation ===');

check('Docs state no runtime source changes',
  /no runtime source.*changes|no runtime source file changed|runtime source changes.*None/i.test(allDocs));

check('Docs state no API route changes',
  /no API route changes|API route changes.*None/i.test(allDocs));

check('Docs state no DB/Supabase changes',
  /no DB.*Supabase.*changes|DB.*Supabase.*None|Supabase.*None/i.test(allDocs));

check('Docs state no production deployment',
  /no production deployment|Vercel production deployment.*Not performed/i.test(allDocs));

check('Docs state no live KIS/API calls by Claude Code',
  /no live KIS.*API calls|live KIS calls by Claude Code.*None/i.test(allDocs));

check('Docs state no browser launched by Claude Code',
  /no browser launched|Browser launch by Claude Code.*None/i.test(allDocs));

check('Docs state no dev server started by Claude Code',
  /no.*dev server.*started|Local dev server by Claude Code.*None/i.test(allDocs));

// ── Group 7: Known Tracker ────────────────────────────────────────────────────
console.log('\n=== Group 7: Known Tracker ===');

check('Docs mention check:portfolio-holdings-header',
  allDocs.includes('check:portfolio-holdings-header'));

check('Docs mention 85/90 score',
  allDocs.includes('85/90'));

check('Docs identify failure as pre-existing',
  /pre-existing/i.test(allDocs));

check('Docs state failure is non-blocking',
  /non-blocking|not blocking/i.test(allDocs));

// ── Group 8: Deferred Mobile Ad Request ──────────────────────────────────────
console.log('\n=== Group 8: Deferred Mobile Ad Request ===');

check('Docs mention mobile Home ad banner slot',
  /mobile.*Home ad banner|mobile.*banner slot|mobile-only Home ad banner/i.test(allDocs));

check('Docs mention existing PC right-side banner',
  /PC.*right-side.*banner|existing PC.*banner|PC right-side/i.test(allDocs));

check('Docs mention 160×600 PC banner size',
  allDocs.includes('160×600') || allDocs.includes('160x600'));

check('Docs mention master MyPage',
  /master.*MyPage|master account.*MyPage/i.test(allDocs));

check('Docs mention Supabase bucket',
  /Supabase bucket/i.test(allDocs));

check('Docs mention image URL registration',
  /image URL registration|image.*URL.*register/i.test(allDocs));

check('Docs mention max count 5',
  /max.*5|count.*5|max.*banner.*5|banner.*max.*5/i.test(allDocs));

check('Docs mention both PC and mobile banner',
  /PC and mobile|PC.*mobile.*banner|mobile.*PC.*banner/i.test(allDocs));

check('Docs mention same rotation behavior',
  /same.*rotation.*behavior|same.*auto-rotation|same rotation/i.test(allDocs));

check('Docs mention same interval',
  /same.*rotation.*interval|same interval|same.*interval/i.test(allDocs));

check('Docs mention MY PORTFOLIO section anchor',
  allDocs.includes('MY PORTFOLIO'));

check('Docs mention MARKET SNAPSHOT section anchor',
  allDocs.includes('MARKET SNAPSHOT'));

check('Docs mention 720×225 mobile banner size',
  allDocs.includes('720×225') || allDocs.includes('720x225'));

check('Docs state no mobile ad implementation in this phase',
  /no.*mobile ad.*implementation|no implementation.*mobile|no implementation.*this.*phase|deferred.*Phase 3DT/i.test(allDocs));

check('Docs reference Phase 3DT',
  allDocs.includes('Phase 3DT') || allDocs.includes('3DT'));

// ── Group 9: Changelog ────────────────────────────────────────────────────────
console.log('\n=== Group 9: Changelog ===');

check('Changelog includes Phase 3DS-CLOSEOUT',
  changelog.includes('Phase 3DS-CLOSEOUT'));

check('Changelog 3DS-CLOSEOUT section includes Completed — owner browser review PASS',
  closeSection.includes('Completed — owner browser review PASS'));

check('Changelog 3DS-CLOSEOUT section states No runtime source changes',
  /No runtime source changes|no runtime source/i.test(closeSection));

check('Changelog 3DS-CLOSEOUT section references new product request deferred',
  /New product request deferred|product request.*deferred/i.test(closeSection));

check('Changelog 3DS-CLOSEOUT section references Phase 3DT',
  closeSection.includes('Phase 3DT') || closeSection.includes('3DT'));

// ── Group 10: Forbidden Patterns ─────────────────────────────────────────────
console.log('\n=== Group 10: Forbidden Patterns ===');

check('Closeout doc contains no setInterval',    !closeoutDoc.includes('setInterval'));
check('Closeout doc contains no setTimeout',     !closeoutDoc.includes('setTimeout'));
check('Closeout doc contains no cron reference', !closeoutDoc.includes('cron'));
check('Closeout doc contains no SQL execution',
  !closeoutDoc.includes('SELECT ') && !closeoutDoc.includes('INSERT INTO'));
check('Closeout doc contains no raw provider payloads',
  !closeoutDoc.includes('stck_prpr') && !closeoutDoc.includes('rt_cd=0'));
check('Closeout doc contains no production deployment commands',
  !closeoutDoc.includes('vercel deploy') && !closeoutDoc.includes('git push --force'));
check('Closeout doc contains no raw secret placeholders',
  !closeoutDoc.includes('KIS_APP_KEY=') && !closeoutDoc.includes('KIS_APP_SECRET='));
check('Closeout doc does not execute owner smoke',
  !closeoutDoc.includes('npm run smoke:portfolio-live-preview-api:owner'));
check('Closeout doc contains no actual 5-digit+ market price values',
  !/currentPrice.*[0-9]{5,}|marketValue.*[0-9]{5,}/.test(closeoutDoc));
check('Changelog closeout section contains no raw provider payloads',
  !closeSection.includes('stck_prpr') && !closeSection.includes('rt_cd=0'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailed checks:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
