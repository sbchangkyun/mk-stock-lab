/**
 * Phase 3DQ UI Preview Mode Wiring Plan — Static Contract Checker
 * Verifies the 3DQ plan document and changelog satisfy the phase contract.
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

const planDoc    = readFile('docs/planning/phase_3dq_ui_preview_mode_wiring_plan_v0.1.md');
const changelog  = readFile('docs/planning/planning_changelog.md');
const packageJson = readFile('package.json');

// Extract only the Phase 3DQ section of the changelog.
const dqSectionStart = changelog.indexOf('## Phase 3DQ');
const dqSectionEnd   = changelog.indexOf('\n## Phase ', dqSectionStart + 1);
const dqSection =
  dqSectionStart === -1
    ? ''
    : dqSectionEnd === -1
    ? changelog.slice(dqSectionStart)
    : changelog.slice(dqSectionStart, dqSectionEnd);

// ── Group 1: File Existence and Package Script ─────────────────────────────────
console.log('\n=== Group 1: File Existence and Package Script ===');

check('3DQ plan doc exists',
  fileExists('docs/planning/phase_3dq_ui_preview_mode_wiring_plan_v0.1.md'));

check('Planning changelog exists',
  fileExists('docs/planning/planning_changelog.md'));

check('Package script check:phase-3dq-ui-preview-plan exists',
  packageJson.includes('"check:phase-3dq-ui-preview-plan"'));

// ── Group 2: Background and Smoke PASS ────────────────────────────────────────
console.log('\n=== Group 2: Background and Smoke PASS ===');

check('Plan doc references 3DP-OWNER-SMOKE-CLOSEOUT', planDoc.includes('3DP-OWNER-SMOKE-CLOSEOUT'));
check('Plan doc includes HTTP 200',                   planDoc.includes('HTTP 200') || planDoc.includes('`200`'));
check('Plan doc includes source=live',                planDoc.includes('source=live') || planDoc.includes('"live"'));
check('Plan doc includes previewMode=owner',          planDoc.includes('previewMode=owner') || planDoc.includes('previewMode'));
check('Plan doc includes quoteSource=live',           planDoc.includes('quoteSource=live') || planDoc.includes('quoteSource'));
check('Plan doc includes staleState=fresh',           planDoc.includes('staleState=fresh') || planDoc.includes('staleState` | `fresh'));
check('Plan doc includes rowCount=3',                 planDoc.includes('rowCount=3') || planDoc.includes('rowCount` | `3'));
check('Plan doc includes missingQuoteCount=0',        planDoc.includes('missingQuoteCount=0') || planDoc.includes('missingQuoteCount` | `0'));
check('Plan doc includes unavailableRows=0',          planDoc.includes('unavailableRows=0') || planDoc.includes('unavailableRows` | `0'));

// ── Group 3: No Runtime Changes ───────────────────────────────────────────────
console.log('\n=== Group 3: No Runtime Changes ===');

check('Plan doc states no runtime UI changes in this phase',
  /Runtime UI changes.*None in this phase/i.test(planDoc));

check('Plan doc states no API route changes',
  /API route changes.*None/i.test(planDoc));

check('Plan doc states no DB or Supabase changes',
  /DB.*Supabase.*None|Supabase.*None/i.test(planDoc));

check('Plan doc states no production deployment',
  /Vercel production deployment.*Not performed/i.test(planDoc));

check('Plan doc states no live KIS by Claude Code',
  /Live KIS calls by Claude Code.*None/i.test(planDoc));

check('Plan doc states no live API calls by Claude Code',
  /Live API calls by Claude Code.*None/i.test(planDoc));

// ── Group 4: UI Preview Gate ──────────────────────────────────────────────────
console.log('\n=== Group 4: UI Preview Gate ===');

check('Plan proposes owner/developer-only preview',
  /owner.*developer.*only|owner.*preview|developer.*only/i.test(planDoc));

check('Plan gates on local/dev runtime (localhost or 127.0.0.1)',
  planDoc.includes('localhost') && (planDoc.includes('127.0.0.1')));

check('Plan states no production visibility of preview toggle',
  /no.*production.*toggle|not.*show.*production|must not show.*production|no.*production visibility/i.test(planDoc));

check('Plan states fixture remains default',
  /source.*fixture.*remains default|fixture.*default|source.*=.*fixture.*default/i.test(planDoc));

check('Plan states live preview is never the default',
  /never default.*live|live.*never default|not default.*live preview/i.test(planDoc));

check('Plan states public live source remains gated',
  /public.*live.*gated|source.*live.*gated|public.*source.*live.*remain/i.test(planDoc));

// ── Group 5: Request Mapping ──────────────────────────────────────────────────
console.log('\n=== Group 5: Request Mapping ===');

check('Plan includes source: "live" in request body',   planDoc.includes('"source": "live"') || planDoc.includes("source: 'live'") || planDoc.includes('source.*live'));
check('Plan includes previewMode: "owner"',              planDoc.includes('"previewMode": "owner"') || planDoc.includes("previewMode: 'owner'"));
check('Plan includes allowLiveQuotes: true',             planDoc.includes('allowLiveQuotes: true') || planDoc.includes('"allowLiveQuotes": true'));
check('Plan includes baseCurrency: "KRW"',               planDoc.includes('"baseCurrency": "KRW"') || planDoc.includes("baseCurrency: 'KRW'") || planDoc.includes('baseCurrency.*KRW'));
check('Plan mentions symbol 005930',                     planDoc.includes('005930'));
check('Plan mentions symbol 000660',                     planDoc.includes('000660'));
check('Plan mentions symbol 069500',                     planDoc.includes('069500'));
check('Plan specifies KR-only scope',                    /KR.*only|KR-only|market.*KR/i.test(planDoc));
check('Plan specifies max 10 positions',                 /max.*10|10.*positions|≤.*10|positions.*≤\s*10/i.test(planDoc));

// ── Group 6: Freshness Labels ─────────────────────────────────────────────────
console.log('\n=== Group 6: Freshness Labels ===');

check('Plan includes Korean label 조회 시점 기준 (fresh)',         planDoc.includes('조회 시점 기준'));
check('Plan includes Korean label 최근 조회 기준 (stale-but-usable)', planDoc.includes('최근 조회 기준'));
check('Plan includes Korean label 데이터 일시 불가 (unavailable)', planDoc.includes('데이터 일시 불가'));
check('Plan includes Korean label 연동 실패 (API failure)',       planDoc.includes('연동 실패'));
check('Plan warns against using 실시간',                           planDoc.includes('실시간'));
check('Plan warns against realtime accuracy claims',
  /do not.*realtime|not.*imply.*realtime|no.*realtime/i.test(planDoc));
check('Plan warns against 실시간 시세',                            planDoc.includes('실시간 시세'));

// ── Group 7: Partial Data Rules ───────────────────────────────────────────────
console.log('\n=== Group 7: Partial Data Rules ===');

check('Plan covers all-fresh state',             /all.*fresh|All.*Fresh/i.test(planDoc));
check('Plan covers stale-but-usable state',      planDoc.includes('stale-but-usable'));
check('Plan covers unavailable state',           planDoc.includes('unavailable'));
check('Plan references missingQuoteSymbols',     planDoc.includes('missingQuoteSymbols'));
check('Plan references unsupportedSymbols',      planDoc.includes('unsupportedSymbols'));
check('Plan covers unavailable rows behavior',   /unavailableRows|unavailable rows/i.test(planDoc));
check('Plan states no fixture fallback on live failure',
  /no fixture fallback|do not.*substitute fixture|do not.*fall back.*fixture/i.test(planDoc));
check('Plan covers API failure state',           /API failure|연동 실패/i.test(planDoc));

// ── Group 8: Security and Privacy ────────────────────────────────────────────
console.log('\n=== Group 8: Security and Privacy ===');

check('Plan requires no API keys in browser',        /no API keys in browser|API.*keys.*never.*client/i.test(planDoc));
check('Plan requires no KIS credentials in browser', /no KIS credentials in browser|KIS.*credentials.*server-side/i.test(planDoc));
check('Plan requires no account numbers',            /no account numbers|KIS_ACCOUNT_NO.*never/i.test(planDoc));
check('Plan requires no providerMeta exposure',      /no.*providerMeta|providerMeta.*never/i.test(planDoc));
check('Plan requires no raw KIS field names',        /no raw KIS field|stck_prpr.*never|raw KIS.*never/i.test(planDoc));
check('Plan requires no full API response logging',  /no.*console\.log.*response|Do not.*console\.log.*response|no full API response logging/i.test(planDoc));
check('Plan requires no price logging',              /no.*price.*logging|no.*currentPrice.*log|Do not log.*currentPrice/i.test(planDoc));
check('Plan requires no Supabase write of quote data', /no Supabase write|no.*Supabase.*write.*quote/i.test(planDoc));

// ── Group 9: Mobile UX ────────────────────────────────────────────────────────
console.log('\n=== Group 9: Mobile UX ===');

check('Plan covers mobile behavior',
  /mobile/i.test(planDoc));

check('Plan specifies no wide column regression',
  /no wide column|do not add.*column|not add.*column|no new column/i.test(planDoc));

check('Plan specifies compact labels',
  /compact.*label|label.*compact/i.test(planDoc));

check('Plan references Phase 3DJ-HF2 mobile improvements',
  planDoc.includes('3DJ-HF2'));

// ── Group 10: Next Phase ──────────────────────────────────────────────────────
console.log('\n=== Group 10: Next Phase ===');

check('Plan recommends Phase 3DR — Portfolio UI Preview Mode Implementation',
  planDoc.includes('3DR') && /Portfolio UI Preview Mode Implementation/i.test(planDoc));

check('Next phase section exists in plan',
  /Recommended Next Phase|next phase/i.test(planDoc));

// ── Group 11: Changelog ───────────────────────────────────────────────────────
console.log('\n=== Group 11: Changelog ===');

check('Changelog includes Phase 3DQ',
  changelog.includes('Phase 3DQ') || changelog.includes('3DQ'));

check('Changelog 3DQ section includes UI Preview Mode Wiring Plan',
  /UI Preview Mode Wiring Plan|ui.*preview.*mode.*wiring/i.test(dqSection));

check('Changelog 3DQ section states owner/developer-only',
  /owner.*developer.*only|developer.*only|owner.*only/i.test(dqSection));

check('Changelog 3DQ section states no runtime UI changes',
  /no runtime UI changes|no.*UI changes|runtime UI.*None/i.test(dqSection));

check('Changelog 3DQ section states no API changes',
  /no API.*changes|no.*API route.*changes/i.test(dqSection));

check('Changelog 3DQ section mentions next phase Phase 3DR',
  dqSection.includes('3DR'));

// ── Group 12: Forbidden Patterns ─────────────────────────────────────────────
console.log('\n=== Group 12: Forbidden Patterns ===');

check('Plan contains no setInterval', !planDoc.includes('setInterval'));
check('Plan contains no setTimeout',  !planDoc.includes('setTimeout'));
check('Plan contains no cron reference', !planDoc.includes('cron'));
check('Plan contains no SQL execution',
  !planDoc.includes('SELECT ') && !planDoc.includes('INSERT INTO'));
check('Plan contains no raw KIS field values (stck_prpr)',
  !planDoc.includes('stck_prpr'));
check('Plan changelog section contains no raw provider payloads',
  !dqSection.includes('stck_prpr') && !dqSection.includes('rt_cd=0'));
check('Plan contains no actual market price values (5+ digits)',
  !/currentPrice.*[0-9]{5,}|marketValue.*[0-9]{5,}/.test(planDoc));
check('Plan contains no production deployment commands',
  !planDoc.includes('vercel deploy') && !planDoc.includes('git push --force'));
check('Plan does not expose public live quotes',
  !/public.*live.*quotes.*enabled|production.*live.*enabled/i.test(planDoc));
check('Plan does not use raw secret placeholders',
  !planDoc.includes('KIS_APP_KEY=') && !planDoc.includes('KIS_APP_SECRET='));
check('Owner smoke script contains no setTimeout',
  !readFile('scripts/owner_smoke_portfolio_live_preview_api.mjs').includes('setTimeout'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailed checks:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
