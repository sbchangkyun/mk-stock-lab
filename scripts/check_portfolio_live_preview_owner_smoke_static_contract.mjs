/**
 * Phase 3DP-OWNER-SMOKE Static Contract Checker
 * Verifies owner smoke script, result doc, and changelog satisfy the phase contract.
 * No-network: fetch is blocked. Does not run the smoke script.
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
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${label}`);
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

const smokeScript    = readFile('scripts/owner_smoke_portfolio_live_preview_api.mjs');
const resultDoc      = readFile('docs/planning/phase_3dp_owner_smoke_portfolio_live_preview_api_result_v0.1.md');
const changelog      = readFile('docs/planning/planning_changelog.md');
const packageJson    = readFile('package.json');

// Extract only the Phase 3DP-OWNER-SMOKE section to avoid false positives
// from older entries that mention field names in safe context.
const ownerSmokeSectionStart = changelog.indexOf('## Phase 3DP-OWNER-SMOKE');
const ownerSmokeSectionEnd   = changelog.indexOf('\n## Phase ', ownerSmokeSectionStart + 1);
const ownerSmokeSection =
  ownerSmokeSectionStart === -1
    ? ''
    : ownerSmokeSectionEnd === -1
    ? changelog.slice(ownerSmokeSectionStart)
    : changelog.slice(ownerSmokeSectionStart, ownerSmokeSectionEnd);

// ── Group 1: File Existence and Package Scripts ───────────────────────────────
console.log('\n=== Group 1: File Existence and Package Scripts ===');

check('Owner smoke script exists',
  fileExists('scripts/owner_smoke_portfolio_live_preview_api.mjs'));

check('Result doc exists',
  fileExists('docs/planning/phase_3dp_owner_smoke_portfolio_live_preview_api_result_v0.1.md'));

check('Changelog exists',
  fileExists('docs/planning/planning_changelog.md'));

check('Package script smoke:portfolio-live-preview-api:owner exists',
  packageJson.includes('"smoke:portfolio-live-preview-api:owner"'));

check('Package script check:portfolio-live-preview-owner-smoke exists',
  packageJson.includes('"check:portfolio-live-preview-owner-smoke"'));

// ── Group 2: Owner Guard Variables ────────────────────────────────────────────
console.log('\n=== Group 2: Owner Guard Variables ===');

check('Guard var PHASE_3DP_OWNER_API_SMOKE present in smoke script',
  smokeScript.includes('PHASE_3DP_OWNER_API_SMOKE'));

check('Guard var PHASE_3DP_RUNTIME_CONFIRMED present in smoke script',
  smokeScript.includes('PHASE_3DP_RUNTIME_CONFIRMED'));

check('Guard var PHASE_3DP_READ_ONLY_SCOPE_CONFIRMED present in smoke script',
  smokeScript.includes('PHASE_3DP_READ_ONLY_SCOPE_CONFIRMED'));

check('Guard var PHASE_3DP_PROVIDER_QUOTA_RISK_ACCEPTED present in smoke script',
  smokeScript.includes('PHASE_3DP_PROVIDER_QUOTA_RISK_ACCEPTED'));

check('Guard var PHASE_3DP_NO_ACCOUNT_APIS_CONFIRMED present in smoke script',
  smokeScript.includes('PHASE_3DP_NO_ACCOUNT_APIS_CONFIRMED'));

// ── Group 3: Local API Target Safety ──────────────────────────────────────────
console.log('\n=== Group 3: Local API Target Safety ===');

check('Smoke script defaults to http://127.0.0.1:4321',
  smokeScript.includes('http://127.0.0.1:4321'));

check('Smoke script permits http://localhost:4321',
  smokeScript.includes('http://localhost:4321'));

check('Smoke script rejects non-local API base URLs',
  smokeScript.includes('NON_LOCAL_API_URL_REJECTED'));

check('Smoke script uses target=local-api in logs (does not print full URL)',
  smokeScript.includes("LOCAL_API_LABEL") && smokeScript.includes("'local-api'"));

check('Smoke script log uses target=local-api label',
  smokeScript.includes('target: LOCAL_API_LABEL'));

// ── Group 4: Request Shape ─────────────────────────────────────────────────────
console.log('\n=== Group 4: Request Shape ===');

check("Smoke script includes source: 'live'",
  /source:\s*['"]live['"]/.test(smokeScript));

check("Smoke script includes previewMode: 'owner'",
  /previewMode:\s*['"]owner['"]/.test(smokeScript));

check('Smoke script includes allowLiveQuotes: true',
  smokeScript.includes('allowLiveQuotes: true'));

check("Smoke script includes baseCurrency: 'KRW'",
  /baseCurrency:\s*['"]KRW['"]/.test(smokeScript));

check('Smoke script includes symbol 005930',
  smokeScript.includes("'005930'"));

check('Smoke script includes symbol 000660',
  smokeScript.includes("'000660'"));

check('Smoke script includes symbol 069500',
  smokeScript.includes("'069500'"));

check('Smoke script references positionCount=3 in log',
  smokeScript.includes('positionCount=3') || smokeScript.includes('positionCount: requestBody.positions.length'));

check('Smoke script references symbols=005930,000660,069500 in log output',
  smokeScript.includes('005930,000660,069500') || smokeScript.includes("map((p) => p.symbol).join(',')"));

// ── Group 5: Safe Output Format ───────────────────────────────────────────────
console.log('\n=== Group 5: Safe Output Format ===');

check('Smoke script includes step guard-check',
  smokeScript.includes("'guard-check'"));

check('Smoke script includes step runtime-check',
  smokeScript.includes("'runtime-check'"));

check('Smoke script includes step local-api-target-check',
  smokeScript.includes("'local-api-target-check'"));

check('Smoke script includes step request-shape-check',
  smokeScript.includes("'request-shape-check'"));

check('Smoke script includes step api-call',
  smokeScript.includes("'api-call'"));

check('Smoke script includes step response-parse',
  smokeScript.includes("'response-parse'"));

check('Smoke script includes step response-contract',
  smokeScript.includes("'response-contract'"));

check('Smoke script includes step provider-leakage-check',
  smokeScript.includes("'provider-leakage-check'"));

check('Smoke script includes step safe-summary',
  smokeScript.includes("'safe-summary'"));

check('Smoke script includes step final-result',
  smokeScript.includes("'final-result'"));

check('Smoke script uses phase3dp prefix',
  smokeScript.includes("LOG_PREFIX = 'phase3dp'") || smokeScript.includes('"phase3dp"') || smokeScript.includes("'phase3dp'"));

check('Smoke script appends sanitized=true to all log lines',
  smokeScript.includes("'sanitized=true'") || smokeScript.includes('"sanitized=true"') || smokeScript.includes("parts.push('sanitized=true')"));

// ── Group 6: Sanitization ─────────────────────────────────────────────────────
console.log('\n=== Group 6: Sanitization ===');

check('Forbidden pattern: KIS_APP_KEY', smokeScript.includes('KIS_APP_KEY'));
check('Forbidden pattern: KIS_APP_SECRET', smokeScript.includes('KIS_APP_SECRET'));
check('Forbidden pattern: KIS_ACCOUNT_NO', smokeScript.includes('KIS_ACCOUNT_NO'));
check('Forbidden pattern: access_token', smokeScript.includes('access_token'));
check('Forbidden pattern: appkey', smokeScript.includes('appkey'));
check('Forbidden pattern: appsecret', smokeScript.includes('appsecret'));
check('Forbidden pattern: authorization', smokeScript.includes('authorization'));
check('Forbidden pattern: Bearer', smokeScript.includes('Bearer'));
check('Forbidden pattern: stck_', smokeScript.includes('stck_'));
check('Forbidden pattern: prdy_', smokeScript.includes('prdy_'));
check('Forbidden pattern: rt_cd', smokeScript.includes('rt_cd'));
check('Forbidden pattern: acml_', smokeScript.includes('acml_'));
check('Forbidden pattern: providerMeta', smokeScript.includes('providerMeta'));
check('Forbidden pattern: currentPrice', smokeScript.includes('currentPrice'));
check('Forbidden pattern: marketValue', smokeScript.includes('marketValue'));
check('Forbidden pattern: costBasis', smokeScript.includes('costBasis'));
check('Forbidden pattern: unrealizedPnl', smokeScript.includes('unrealizedPnl'));
check('Forbidden pattern: totalMarketValue', smokeScript.includes('totalMarketValue'));
check('Forbidden pattern: totalCostBasis', smokeScript.includes('totalCostBasis'));
check('Forbidden pattern: portfolioId', smokeScript.includes('portfolioId'));
check('Forbidden pattern: raw', smokeScript.includes('raw'));
check('Forbidden pattern: stack', smokeScript.includes('stack'));
check('Forbidden pattern: password', smokeScript.includes('password'));
check('Forbidden pattern: SUPABASE_SERVICE_ROLE_KEY', smokeScript.includes('SUPABASE_SERVICE_ROLE_KEY'));
check('SAFE_OUTPUT_BLOCKED sentinel present in smoke script', smokeScript.includes('SAFE_OUTPUT_BLOCKED'));

// ── Group 7: Response Contract Checks ─────────────────────────────────────────
console.log('\n=== Group 7: Response Contract Checks ===');

check('Smoke script validates HTTP status 200',
  smokeScript.includes('httpStatus !== 200') || smokeScript.includes('httpStatus === 200'));

check('Smoke script validates ok === true',
  smokeScript.includes("ok === true") || smokeScript.includes("parsed?.ok === true"));

check('Smoke script validates source === "live"',
  smokeScript.includes("source === 'live'") || smokeScript.includes('source === "live"'));

check('Smoke script validates previewMode === "owner"',
  smokeScript.includes("previewMode === 'owner'") || smokeScript.includes('previewMode === "owner"'));

check('Smoke script validates quoteSource === "live"',
  smokeScript.includes("quoteSource === 'live'") || smokeScript.includes('quoteSource === "live"'));

check('Smoke script validates liveAttempted === true',
  smokeScript.includes('liveAttempted === true'));

check('Smoke script validates rawProviderStored === false',
  smokeScript.includes('rawProviderStored === false'));

check('Smoke script validates unsupportedSymbols is array',
  smokeScript.includes('unsupportedSymbols'));

check('Smoke script validates missingQuoteSymbols is array',
  smokeScript.includes('missingQuoteSymbols'));

check('Smoke script validates row count 3',
  smokeScript.includes('rows.length === 3'));

check('Smoke script validates stale states (fresh, stale-but-usable, unavailable)',
  smokeScript.includes("'fresh'") &&
  smokeScript.includes("'stale-but-usable'") &&
  smokeScript.includes("'unavailable'"));

// ── Group 8: Documentation ────────────────────────────────────────────────────
console.log('\n=== Group 8: Documentation ===');

check('Result doc mentions Phase 3DP-OWNER-SMOKE',
  resultDoc.includes('3DP-OWNER-SMOKE'));

check('Result doc includes status field',
  resultDoc.includes('Status'));

check('Result doc states owner smoke pending',
  /owner.*smoke.*pending|Prepared.*owner.*smoke/i.test(resultDoc));

check('Result doc notes owner-run only',
  /owner.*only|owner.*manual|owner.*run/i.test(resultDoc));

check('Result doc confirms no live KIS by Claude Code',
  /no live KIS by Claude Code|Claude Code.*did not run/i.test(resultDoc));

check('Result doc states local-only API target',
  /local.*only|127\.0\.0\.1|localhost:4321/i.test(resultDoc));

check('Result doc includes safe output report fields',
  resultDoc.includes('staleState') && resultDoc.includes('quoteSource'));

check('Result doc states no raw response body sharing',
  /no.*raw response|do not.*share.*raw|not.*print.*response body/i.test(resultDoc));

check('Result doc includes recommended next phase',
  /recommended next phase|next phase/i.test(resultDoc));

// ── Group 9: Changelog ────────────────────────────────────────────────────────
console.log('\n=== Group 9: Changelog ===');

check('Changelog includes Phase 3DP-OWNER-SMOKE',
  changelog.includes('3DP-OWNER-SMOKE'));

check('Changelog mentions owner API smoke pending',
  /owner.*smoke.*pending|Prepared.*owner.*smoke/i.test(changelog));

check('Changelog mentions local API smoke script',
  /local.*smoke.*script|smoke.*script.*created|owner.*smoke.*script/i.test(changelog));

check('Changelog confirms no live KIS by Claude Code',
  /no live KIS by Claude Code|Claude Code.*did not/i.test(changelog));

check('Changelog confirms no production deployment in this phase',
  /no.*production deployment|production deployment.*not performed|Not performed/i.test(changelog));

check('Changelog confirms no UI changes in this phase',
  /no.*UI changes|no runtime UI/i.test(changelog));

// ── Group 10: Forbidden Patterns in New Files ─────────────────────────────────
console.log('\n=== Group 10: Forbidden Patterns in New Files ===');

check('Smoke script contains no setInterval',
  !smokeScript.includes('setInterval'));

check('Smoke script contains no setTimeout',
  !smokeScript.includes('setTimeout'));

check('Smoke script contains no cron reference',
  !smokeScript.includes('cron'));

check('Smoke script contains no SQL execution',
  !smokeScript.includes('executeQuery') && !smokeScript.includes('supabase.from'));

check('Result doc contains no setInterval',
  !resultDoc.includes('setInterval'));

check('Result doc contains no SQL execution',
  !resultDoc.includes('SELECT') && !resultDoc.includes('INSERT INTO'));

check('Smoke script does not print actual price examples',
  !/currentPrice:\s*\d{4,}|marketValue:\s*\d{4,}/.test(smokeScript));

check('Smoke script does not hardcode external non-local HTTPS URLs',
  !smokeScript.includes('https://mkstocklab') && !smokeScript.includes('https://vercel.app'));

check('Result doc does not expose actual market price values',
  !/currentPrice:\s*[0-9]{4,}|marketValue:\s*[0-9]{4,}/.test(resultDoc));

check('New changelog section does not expose raw provider payloads',
  !ownerSmokeSection.includes('stck_prpr') && !ownerSmokeSection.includes('rt_cd=0'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailed checks:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
