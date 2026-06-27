/**
 * Phase 3DP-OWNER-SMOKE-CLOSEOUT Static Contract Checker
 * Verifies closeout result doc, updated owner smoke doc, changelog, and package scripts
 * accurately record the Phase 3DP owner API smoke PASS result.
 * No-network: fetch is blocked. Does not call live APIs.
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

const ownerSmokeDoc  = readFile('docs/planning/phase_3dp_owner_smoke_portfolio_live_preview_api_result_v0.1.md');
const closeoutDoc    = readFile('docs/planning/phase_3dp_owner_smoke_closeout_portfolio_live_preview_api_result_v0.1.md');
const contractDoc    = readFile('docs/planning/phase_3dp_portfolio_live_preview_api_contract_result_v0.1.md');
const changelog      = readFile('docs/planning/planning_changelog.md');
const packageJson    = readFile('package.json');

// Extract the Phase 3DP-OWNER-SMOKE-CLOSEOUT section from the changelog only.
const closeoutSectionStart = changelog.indexOf('## Phase 3DP-OWNER-SMOKE-CLOSEOUT');
const closeoutSectionEnd   = changelog.indexOf('\n## Phase ', closeoutSectionStart + 1);
const closeoutSection =
  closeoutSectionStart === -1
    ? ''
    : closeoutSectionEnd === -1
    ? changelog.slice(closeoutSectionStart)
    : changelog.slice(closeoutSectionStart, closeoutSectionEnd);

// ── Group 1: File Existence and Package Script ─────────────────────────────────
console.log('\n=== Group 1: File Existence and Package Script ===');

check('Updated owner smoke result doc exists',
  fileExists('docs/planning/phase_3dp_owner_smoke_portfolio_live_preview_api_result_v0.1.md'));

check('Closeout result doc exists',
  fileExists('docs/planning/phase_3dp_owner_smoke_closeout_portfolio_live_preview_api_result_v0.1.md'));

check('3DP contract result doc exists',
  fileExists('docs/planning/phase_3dp_portfolio_live_preview_api_contract_result_v0.1.md'));

check('Changelog exists',
  fileExists('docs/planning/planning_changelog.md'));

check('Package script check:portfolio-live-preview-owner-smoke-closeout exists',
  packageJson.includes('"check:portfolio-live-preview-owner-smoke-closeout"'));

// ── Group 2: Completion Status ─────────────────────────────────────────────────
console.log('\n=== Group 2: Completion Status ===');

check('Owner smoke result doc status: Completed — owner API smoke PASS',
  ownerSmokeDoc.includes('Completed — owner API smoke PASS'));

check('Closeout doc status: Completed — owner API smoke PASS',
  closeoutDoc.includes('Completed — owner API smoke PASS'));

check('Owner smoke result doc: Local API smoke by owner Completed — PASS',
  ownerSmokeDoc.includes('Completed — PASS'));

check('Owner smoke result doc: Live KIS calls by owner Completed through local API smoke — PASS',
  ownerSmokeDoc.includes('Completed through local API smoke — PASS'));

check('Closeout doc: Local API smoke by owner Completed — PASS',
  closeoutDoc.includes('Local API smoke by owner | Completed — PASS'));

check('Closeout doc: Live KIS calls by owner Completed through local API smoke — PASS',
  closeoutDoc.includes('Completed through local API smoke — PASS'));

check('3DP contract doc updated: live KIS by owner completed',
  contractDoc.includes('Completed through local API smoke — PASS') ||
  contractDoc.includes('OWNER-SMOKE-CLOSEOUT'));

// ── Group 3: Final Safe Summary ───────────────────────────────────────────────
console.log('\n=== Group 3: Final Safe Summary ===');

check('Closeout doc includes HTTP 200', closeoutDoc.includes('HTTP 200') || closeoutDoc.includes('httpStatus=200') || closeoutDoc.includes('`200`'));
check('Closeout doc includes source=live', closeoutDoc.includes('source=live') || closeoutDoc.includes('`live`'));
check('Closeout doc includes previewMode=owner', closeoutDoc.includes('previewMode=owner') || closeoutDoc.includes('previewMode` | `owner'));
check('Closeout doc includes quoteSource=live', closeoutDoc.includes('quoteSource=live') || closeoutDoc.includes('quoteSource` | `live'));
check('Closeout doc includes liveAttempted=true', closeoutDoc.includes('liveAttempted=true') || closeoutDoc.includes('liveAttempted` | `true'));
check('Closeout doc includes providerStored=false', closeoutDoc.includes('providerStored=false'));
check('Closeout doc includes staleState=fresh', closeoutDoc.includes('staleState=fresh') || closeoutDoc.includes('staleState` | `fresh'));
check('Closeout doc includes rowCount=3', closeoutDoc.includes('rowCount=3') || closeoutDoc.includes('rowCount` | `3'));
check('Closeout doc includes missingQuoteCount=0', closeoutDoc.includes('missingQuoteCount=0') || closeoutDoc.includes('`missingQuoteCount` | `0'));
check('Closeout doc includes unsupportedCount=0', closeoutDoc.includes('unsupportedCount=0') || closeoutDoc.includes('`unsupportedCount` | `0'));
check('Closeout doc includes unavailableRows=0', closeoutDoc.includes('unavailableRows=0') || closeoutDoc.includes('`unavailableRows` | `0'));
check('Closeout doc includes apiLivePreview=true', closeoutDoc.includes('apiLivePreview=true') || closeoutDoc.includes('apiLivePreview` | `true'));
check('Closeout doc includes contractValidated=true', closeoutDoc.includes('contractValidated=true') || closeoutDoc.includes('contractValidated` | `true'));

// ── Group 4: Attempt History ──────────────────────────────────────────────────
console.log('\n=== Group 4: Attempt History ===');

check('Closeout doc records Attempt 1 API_CALL_EXCEPTION',
  closeoutDoc.includes('API_CALL_EXCEPTION'));

check('Closeout doc records Attempt 2 staleState=unavailable',
  closeoutDoc.includes('staleState=unavailable'));

check('Closeout doc records Attempt 2 missingQuoteCount=3',
  closeoutDoc.includes('missingQuoteCount=3'));

check('Closeout doc records Attempt 2 unavailableRows=3',
  closeoutDoc.includes('unavailableRows=3'));

check('Closeout doc records Attempt 3 as final PASS with staleState=fresh',
  closeoutDoc.includes('staleState=fresh') &&
  (closeoutDoc.includes('PASS') || closeoutDoc.includes('passed')));

check('Closeout doc records Attempt 3 missingQuoteCount=0',
  closeoutDoc.includes('missingQuoteCount=0'));

check('Closeout doc records Attempt 3 unavailableRows=0',
  closeoutDoc.includes('unavailableRows=0'));

// ── Group 5: Safety Review ────────────────────────────────────────────────────
console.log('\n=== Group 5: Safety Review ===');

check('Closeout doc confirms no full response body shared',
  /no.*full response body|full response body.*No/i.test(closeoutDoc));

check('Closeout doc confirms no actual prices shared',
  /no.*actual prices|actual prices.*No/i.test(closeoutDoc));

check('Closeout doc confirms no valuation numeric fields shared',
  /currentPrice.*No|No.*currentPrice|marketValue.*No|No.*valuation numeric/i.test(closeoutDoc));

check('Closeout doc confirms no raw KIS payload shared',
  /no.*raw KIS|raw KIS.*No/i.test(closeoutDoc));

check('Closeout doc confirms no providerMeta shared',
  /providerMeta.*No|No.*providerMeta/i.test(closeoutDoc));

check('Closeout doc confirms no tokens or secrets shared',
  /no.*tokens|tokens.*No|no.*secrets|secrets.*No/i.test(closeoutDoc));

check('Closeout doc confirms no account numbers shared',
  /no.*account numbers|account numbers.*No/i.test(closeoutDoc));

check('Closeout doc confirms no stack traces shared',
  /no.*stack traces|stack traces.*No/i.test(closeoutDoc));

check('Owner smoke result doc includes safety confirmation section',
  ownerSmokeDoc.includes('Safety Confirmation') || ownerSmokeDoc.includes('safety confirmation'));

// ── Group 6: Source and Product Policy ───────────────────────────────────────
console.log('\n=== Group 6: Source and Product Policy ===');

check('Closeout doc states source=fixture remains default',
  /source.*fixture.*remains default|fixture.*default/i.test(closeoutDoc) ||
  /fixture data only|fixture.*continue/i.test(closeoutDoc));

check('Closeout doc states production UI does not use live quotes',
  /production UI.*fixture|fixture.*production|no.*production UI live|production UI.*live.*not/i.test(closeoutDoc));

check('Closeout doc states no public live API access',
  /no.*public live API|public live API.*not/i.test(closeoutDoc));

check('Closeout doc states no production deployment',
  /Vercel production deployment.*Not performed|no.*production deployment|Not performed/i.test(closeoutDoc));

check('Closeout doc states source=auto remains deferred',
  /source.*auto.*deferred|auto.*deferred|no.*source.*auto/i.test(closeoutDoc) ||
  /triple opt-in.*gate|gate.*remain/i.test(closeoutDoc));

check('Closeout doc states US quotes not validated',
  /US.*not|no.*US quote|US.*gated|does not validate US/i.test(closeoutDoc));

// ── Group 7: Next Phase ───────────────────────────────────────────────────────
console.log('\n=== Group 7: Next Phase ===');

check('Closeout doc recommends Phase 3DQ',
  closeoutDoc.includes('3DQ'));

check('Owner smoke doc recommends Phase 3DQ',
  ownerSmokeDoc.includes('3DQ'));

check('3DP contract doc recommends Phase 3DQ',
  contractDoc.includes('3DQ'));

// ── Group 8: Changelog ────────────────────────────────────────────────────────
console.log('\n=== Group 8: Changelog ===');

check('Changelog includes Phase 3DP-OWNER-SMOKE-CLOSEOUT',
  changelog.includes('3DP-OWNER-SMOKE-CLOSEOUT'));

check('Changelog closeout section includes Completed — owner API smoke PASS',
  closeoutSection.includes('Completed — owner API smoke PASS'));

check('Changelog closeout section mentions HTTP 200',
  closeoutSection.includes('HTTP 200'));

check('Changelog closeout section mentions staleState=fresh',
  closeoutSection.includes('staleState=fresh'));

check('Changelog closeout section mentions missingQuoteCount=0',
  closeoutSection.includes('missingQuoteCount=0'));

check('Changelog closeout section mentions unavailableRows=0',
  closeoutSection.includes('unavailableRows=0'));

check('Changelog closeout section mentions Phase 3DQ',
  closeoutSection.includes('3DQ'));

// ── Group 9: Forbidden Patterns ───────────────────────────────────────────────
console.log('\n=== Group 9: Forbidden Patterns ===');

check('Closeout doc contains no setInterval', !closeoutDoc.includes('setInterval'));
check('Closeout doc contains no setTimeout',  !closeoutDoc.includes('setTimeout'));
check('Closeout doc contains no cron',         !closeoutDoc.includes('cron'));
check('Owner smoke script contains no setInterval', !readFile('scripts/owner_smoke_portfolio_live_preview_api.mjs').includes('setInterval'));
check('Closeout doc contains no SQL execution',
  !closeoutDoc.includes('SELECT ') && !closeoutDoc.includes('INSERT INTO'));
check('Closeout doc contains no raw KIS field names',
  !closeoutDoc.includes('stck_prpr') && !closeoutDoc.includes('prdy_vrss') && !closeoutDoc.includes('rt_cd='));
check('Closeout section changelog contains no raw provider payloads',
  !closeoutSection.includes('stck_prpr') && !closeoutSection.includes('rt_cd=0'));
check('Closeout doc contains no actual price values (5-digit+ numbers)',
  !/currentPrice.*[0-9]{5,}|marketValue.*[0-9]{5,}/.test(closeoutDoc));
check('Closeout doc contains no production deployment commands',
  !closeoutDoc.includes('vercel deploy') && !closeoutDoc.includes('git push --force'));
check('Closeout doc contains no full raw response body examples',
  !closeoutDoc.includes('"stck_') && !closeoutDoc.includes('"rt_cd"'));
check('Owner smoke doc does not expose raw secret placeholders',
  !ownerSmokeDoc.includes('KIS_APP_KEY=') && !ownerSmokeDoc.includes('KIS_APP_SECRET='));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailed checks:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
