/**
 * Phase 3DT Mobile Home Ad Banner Slot Implementation Plan — Static Contract Checker
 * Verifies the 3DT plan document and changelog satisfy the phase contract.
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

const planDoc    = readFile('docs/planning/phase_3dt_mobile_home_ad_banner_slot_implementation_plan_v0.1.md');
const changelog  = readFile('docs/planning/planning_changelog.md');
const packageJson = readFile('package.json');

// Extract only the Phase 3DT section of the changelog.
const dtSectionStart = changelog.indexOf('## Phase 3DT');
const dtSectionEnd   = changelog.indexOf('\n## Phase ', dtSectionStart + 1);
const dtSection =
  dtSectionStart === -1
    ? ''
    : dtSectionEnd === -1
    ? changelog.slice(dtSectionStart)
    : changelog.slice(dtSectionStart, dtSectionEnd);

// ── Group 1: File Existence and Package Script ─────────────────────────────────
console.log('\n=== Group 1: File Existence and Package Script ===');

check('Phase 3DT plan doc exists',
  fileExists('docs/planning/phase_3dt_mobile_home_ad_banner_slot_implementation_plan_v0.1.md'));

check('Planning changelog exists',
  fileExists('docs/planning/planning_changelog.md'));

check('Package script check:phase-3dt-mobile-home-ad-banner-plan exists',
  packageJson.includes('"check:phase-3dt-mobile-home-ad-banner-plan"'));

// ── Group 2: Metadata ─────────────────────────────────────────────────────────
console.log('\n=== Group 2: Metadata ===');

check('Plan doc includes Phase 3DT',
  planDoc.includes('Phase 3DT'));

check('Plan doc includes Mobile Home Ad Banner Slot Implementation Plan',
  /Mobile Home Ad Banner Slot Implementation Plan/i.test(planDoc));

check('Plan doc includes Planned — implementation pending',
  planDoc.includes('Planned — implementation pending'));

check('Plan doc references commit f2bbfc3',
  planDoc.includes('f2bbfc3'));

check('Plan doc includes canonical production URL',
  planDoc.includes('https://mkstocklab.vercel.app'));

check('Plan doc states no runtime source changes in this phase',
  /Runtime source changes.*None|no runtime source changes/i.test(planDoc));

check('Plan doc states no production deployment',
  /Vercel production deployment.*Not performed|no production deployment/i.test(planDoc));

// ── Group 3: Existing PC Banner Baseline ──────────────────────────────────────
console.log('\n=== Group 3: Existing PC Banner Baseline ===');

check('Plan doc includes 160×600 banner size',
  planDoc.includes('160×600') || planDoc.includes('160x600'));

check('Plan doc mentions PC Home right-side banner',
  /PC.*Home.*right|PC.*right.*banner|PC right-side|PC Home right/i.test(planDoc));

check('Plan doc mentions master MyPage',
  /master MyPage|master.*마이페이지/i.test(planDoc));

check('Plan doc mentions Supabase bucket',
  /Supabase bucket/i.test(planDoc));

check('Plan doc mentions image URL registration',
  /image URL registration|image.*URL.*register|imageUrl.*registration/i.test(planDoc));

check('Plan doc states current max count is 3',
  /max.*count.*3|3 slots|max.*3|slot.*1.*2.*3/i.test(planDoc));

check('Plan doc mentions automatic rotation',
  /automatic rotation|auto-rotation|autorotation/i.test(planDoc));

check('Plan doc mentions rotation interval (5000ms)',
  planDoc.includes('5000') || /5 seconds|rotation interval/i.test(planDoc));

// ── Group 4: Mobile Banner Requirement ───────────────────────────────────────
console.log('\n=== Group 4: Mobile Banner Requirement ===');

check('Plan doc mentions mobile-only Home banner slot',
  /mobile.*only.*Home.*banner|mobile-only.*Home.*banner|mobile.*Home.*banner slot/i.test(planDoc));

check('Plan doc mentions placement between MY PORTFOLIO and MARKET SNAPSHOT',
  planDoc.includes('MY PORTFOLIO') && planDoc.includes('MARKET SNAPSHOT'));

check('Plan doc includes 720×225 mobile banner size',
  planDoc.includes('720×225') || planDoc.includes('720x225'));

check('Plan doc states max 5 banners',
  /max.*5|5.*banners|max count.*5|count.*5/i.test(planDoc));

check('Plan doc mentions same management pattern',
  /same management pattern|same.*registration.*pattern|same.*pattern/i.test(planDoc));

check('Plan doc mentions same rotation behavior',
  /same.*rotation.*behavior|same.*auto-rotation|same rotation/i.test(planDoc));

check('Plan doc mentions same interval',
  /same.*interval|same.*rotation.*interval|reuse.*interval/i.test(planDoc));

check('Plan doc mentions Supabase URL workflow for mobile',
  /Supabase.*URL.*workflow|Supabase.*key.*home_mobile|home_mobile_banners/i.test(planDoc));

// ── Group 5: Existing Source Findings ─────────────────────────────────────────
console.log('\n=== Group 5: Existing Source Findings ===');

check('Plan doc includes render file finding (HomeRailAd.astro)',
  planDoc.includes('HomeRailAd.astro'));

check('Plan doc includes registration/editing file finding (mypage.astro)',
  planDoc.includes('mypage.astro'));

check('Plan doc includes data structure finding (HomeRailBanner type)',
  planDoc.includes('HomeRailBanner'));

check('Plan doc includes max-count validation finding (siteSettingsClient.ts)',
  planDoc.includes('siteSettingsClient.ts'));

check('Plan doc includes rotation implementation finding',
  /setupRailCarousel|rotation.*setInterval|setInterval.*rotation/i.test(planDoc));

check('Plan doc includes rotation interval value (5000)',
  planDoc.includes('5000'));

check('Plan doc includes image URL storage finding',
  /imageUrl.*stored|image URL.*storage|imageUrl.*Supabase/i.test(planDoc));

check('Plan doc includes link URL storage finding',
  /linkUrl.*stored|link URL.*storage|linkUrl.*optional/i.test(planDoc));

check('Plan doc includes master/admin access finding',
  /isCurrentUserSiteAdmin|site_admins|admin.*check/i.test(planDoc));

// ── Group 6: Future Implementation Plan ──────────────────────────────────────
console.log('\n=== Group 6: Future Implementation Plan ===');

check('Plan doc includes update max count from 3 to 5',
  /3.*to.*5|from.*3.*to.*5|max.*3.*→.*5|3.*→.*5/i.test(planDoc));

check('Plan doc includes add mobile banner list max 5',
  /mobile.*max.*5|mobile.*5.*slot|5.*mobile.*slot/i.test(planDoc));

check('Plan doc includes update master MyPage UI',
  /update.*master MyPage|master MyPage.*update|update.*mypage/i.test(planDoc));

check('Plan doc includes add Home mobile slot',
  /add.*Home.*mobile.*slot|HomeMobileAd|mobile.*slot.*Home/i.test(planDoc));

check('Plan doc includes hide mobile slot on desktop',
  /hide.*mobile.*desktop|mobile.*hidden.*desktop|display.*none.*desktop/i.test(planDoc));

check('Plan doc includes preserve desktop PC banner',
  /preserve.*PC.*banner|PC.*banner.*preserved|existing.*HomeRailAd.*preserved/i.test(planDoc));

check('Plan doc includes reuse existing rotation',
  /reuse.*rotation|same.*rotation.*logic|reuse.*carousel/i.test(planDoc));

check('Plan doc includes add/update checker for Phase 3DU',
  /add.*checker|update.*checker|Phase 3DU.*checker/i.test(planDoc));

check('Plan doc includes owner review after implementation',
  /owner review.*after implementation|local.*owner.*review|owner.*review.*implementation/i.test(planDoc));

// ── Group 7: Non-Goals and Boundaries ────────────────────────────────────────
console.log('\n=== Group 7: Non-Goals and Boundaries ===');

check('Plan doc states no implementation in Phase 3DT',
  /no implementation in Phase 3DT|no.*implementation.*3DT/i.test(planDoc));

check('Plan doc states no runtime source changes',
  /no runtime source changes|Runtime source changes.*None/i.test(planDoc));

check('Plan doc states no Supabase bucket upload',
  /no Supabase bucket upload|URL-only workflow|no.*bucket.*upload/i.test(planDoc));

check('Plan doc states no new database schema',
  /no new database schema|no.*new.*schema|existing.*site_settings/i.test(planDoc));

check('Plan doc states no new ad management system',
  /no new ad management system|Extension of existing|extend.*existing/i.test(planDoc));

check('Plan doc states no production deployment',
  /no production deployment|Not performed/i.test(planDoc));

check('Plan doc states no live calls by Claude Code',
  /no live.*calls by Claude Code|no live Supabase|no.*KIS.*calls/i.test(planDoc));

// ── Group 8: Changelog ────────────────────────────────────────────────────────
console.log('\n=== Group 8: Changelog ===');

check('Changelog includes Phase 3DT',
  changelog.includes('Phase 3DT'));

check('Changelog 3DT section includes Mobile Home Ad Banner Slot Implementation Plan',
  /Mobile Home Ad Banner Slot Implementation Plan/i.test(dtSection));

check('Changelog 3DT section states Planned — implementation pending',
  dtSection.includes('Planned — implementation pending'));

check('Changelog 3DT section includes 720×225',
  dtSection.includes('720×225') || dtSection.includes('720x225'));

check('Changelog 3DT section includes 160×600',
  dtSection.includes('160×600') || dtSection.includes('160x600'));

check('Changelog 3DT section mentions PC banners max 3 → 5',
  /max.*3.*5|3.*→.*5|3 → 5/i.test(dtSection));

check('Changelog 3DT section mentions mobile Home banners max 5',
  /mobile.*max.*5|mobile.*Home.*banner.*5/i.test(dtSection));

check('Changelog 3DT section references Phase 3DU',
  dtSection.includes('Phase 3DU') || dtSection.includes('3DU'));

// ── Group 9: Forbidden Patterns ──────────────────────────────────────────────
console.log('\n=== Group 9: Forbidden Patterns ===');

check('Plan doc contains no implementation code from src/',
  !planDoc.includes('src/components/HomeMobileAd') ||
  /create.*HomeMobileAd|HomeMobileAd.*new file/i.test(planDoc));

// The plan may mention window.setInterval only in the findings/documentation sections (§3.x).
// Check that any occurrence appears under a section header containing "3." or "Finding" or "Rotation".
check('Plan doc does not introduce new setInterval outside documentation context',
  (() => {
    const idx = planDoc.indexOf('window.setInterval(');
    if (idx === -1) return true;
    // Find the last section header before this occurrence.
    const before = planDoc.slice(0, idx);
    const lastHashIdx = before.lastIndexOf('##');
    const sectionHeader = planDoc.slice(lastHashIdx, Math.min(lastHashIdx + 120, idx));
    return /3\.\d|[Ff]inding|[Rr]otation|[Ee]xisting|[Ii]nspect/i.test(sectionHeader);
  })());

check('Plan doc contains no SQL execution',
  !planDoc.includes('SELECT ') && !planDoc.includes('INSERT INTO'));

check('Plan doc contains no production deployment commands',
  !planDoc.includes('vercel deploy') && !planDoc.includes('git push --force'));

check('Plan doc contains no raw secret placeholders',
  !planDoc.includes('SUPABASE_SERVICE_KEY=') && !planDoc.includes('KIS_APP_KEY='));

check('Plan doc does not execute npm run dev in automated context',
  !planDoc.includes('$ npm run dev') && !planDoc.includes('&& npm run dev'));

check('Plan doc contains no raw provider payload examples',
  !planDoc.includes('stck_prpr') && !planDoc.includes('rt_cd=0'));

check('Plan doc contains no Supabase upload commands',
  !planDoc.includes('supabase storage cp') && !planDoc.includes('bucket.upload('));

check('Plan doc contains no browser automation (Playwright/Puppeteer)',
  !planDoc.includes('playwright') && !planDoc.includes('puppeteer'));

check('Changelog 3DT section contains no raw provider payloads',
  !dtSection.includes('stck_prpr') && !dtSection.includes('rt_cd=0'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailed checks:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
