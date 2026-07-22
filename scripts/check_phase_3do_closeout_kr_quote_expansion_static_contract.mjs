/**
 * Static contract check for Phase 3DO-CLOSEOUT — KR Quote Expansion Results Closeout.
 * Verifies that all three KR expansion symbols are recorded as PASS, attempt history is
 * present, sanitization policy is confirmed, and source policy is unchanged.
 * No network calls. No .env reads. Exits non-zero on failure.
 */

// Block all network calls immediately.
globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CLOSEOUT_DOC = join(root, 'docs', 'planning', 'phase_3do_closeout_kr_quote_expansion_results_v0.1.md');
const PHASE_3DO_DOC = join(root, 'docs', 'planning', 'phase_3do_kr_quote_preview_expansion_and_portfolio_live_preview_api_plan_result_v0.1.md');
const HF1_DOC      = join(root, 'docs', 'planning', 'phase_3do_hf1_kis_quote_fetch_failure_diagnostics_result_v0.1.md');
const CHANGELOG    = join(root, 'docs', 'planning', 'planning_changelog.md');
const PACKAGE      = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let total = 0;

const pass  = (label) => { total++; log(`  ✓ ${label}`); };
const fail  = (label) => { total++; failures++; log(`  ✗ FAIL: ${label}`); };
const check = (label, cond) => (cond ? pass(label) : fail(label));
const read  = (p) => existsSync(p) ? readFileSync(p, 'utf8') : '';

const closeoutDoc = read(CLOSEOUT_DOC);
const phase3doDoc = read(PHASE_3DO_DOC);
const hf1Doc      = read(HF1_DOC);
const changelog   = read(CHANGELOG);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE, 'utf8')); } catch {}

log('=== Phase 3DO-CLOSEOUT KR Quote Expansion — Static Contract ===');
log('');

// ── Group 1: File Existence ──────────────────────────────────────────────────
log('Group 1: File existence');
check('3DO result doc exists',              existsSync(PHASE_3DO_DOC));
check('3DO-HF1 result doc exists',          existsSync(HF1_DOC));
check('3DO closeout result doc exists',     existsSync(CLOSEOUT_DOC));
check('planning changelog exists',          existsSync(CHANGELOG));
check('package.json has check:phase-3do-closeout',
  typeof pkg.scripts?.['check:phase-3do-closeout'] === 'string');

// ── Group 2: Completion Status ────────────────────────────────────────────────
log('\nGroup 2: Completion status');
check('3DO result doc status is Completed — owner KR expansion PASS',
  /Completed — owner KR expansion PASS/i.test(phase3doDoc));
check('3DO-HF1 result doc status is Completed — diagnostic rerun PASS',
  /Completed — diagnostic rerun PASS/i.test(hf1Doc));
check('Closeout doc status is Completed — all KR expansion targets PASS',
  /Completed — all KR expansion targets PASS/i.test(closeoutDoc));
check('3DO result doc Live KIS by owner updated to Completed PASS',
  /Live KIS calls by owner.*Completed.*PASS/i.test(phase3doDoc));
check('3DO-HF1 result doc Live KIS by owner updated to Completed PASS',
  /Live KIS calls by owner.*Completed.*069500.*rerun.*PASS|Live KIS calls by owner.*Completed.*PASS/i.test(hf1Doc));

// ── Group 3: Target Results ───────────────────────────────────────────────────
log('\nGroup 3: Target results in closeout doc');
check('Closeout doc mentions 005930',       /005930/.test(closeoutDoc));
check('Closeout doc mentions 000660',       /000660/.test(closeoutDoc));
check('Closeout doc mentions 069500',       /069500/.test(closeoutDoc));
check('Closeout doc mentions KR market',    /\bKR\b/.test(closeoutDoc));
check('Closeout doc mentions KRW',          /KRW/.test(closeoutDoc));
check('Closeout doc mentions KR stock',     /KR stock/i.test(closeoutDoc));
check('Closeout doc mentions KR ETF',       /KR ETF/i.test(closeoutDoc));
check('Closeout doc mentions PASS for all', (() => {
  const rows = closeoutDoc.split('\n').filter(l => l.includes('|'));
  return rows.some(r => r.includes('005930') && r.includes('PASS')) &&
         rows.some(r => r.includes('000660') && r.includes('PASS')) &&
         rows.some(r => r.includes('069500') && r.includes('PASS'));
})());
check('Closeout doc mentions live-quote-received',   /live-quote-received/.test(closeoutDoc));
check('Closeout doc mentions staleState',            /staleState/.test(closeoutDoc));
check('Closeout doc mentions fresh',                 /\bfresh\b/.test(closeoutDoc));
check('Closeout doc mentions cacheValidated=true',   /cacheValidated=true/.test(closeoutDoc));
check('Closeout doc mentions sanitized=true',        /sanitized=true/.test(closeoutDoc));

// ── Group 4: Attempt History ──────────────────────────────────────────────────
log('\nGroup 4: Attempt history');
check('Closeout doc mentions Phase 3DN baseline',
  /Phase 3DN|3DN baseline/i.test(closeoutDoc));
check('Closeout doc mentions Phase 3DO expansion',
  /Phase 3DO.*expansion|3DO expansion/i.test(closeoutDoc));
check('Closeout doc mentions Phase 3DO-HF1',
  /Phase 3DO-HF1|3DO-HF1/.test(closeoutDoc));
check('Closeout doc mentions QUOTE_FETCH_FAILED in attempt history',
  /QUOTE_FETCH_FAILED/.test(closeoutDoc));
check('Closeout doc mentions 069500 rerun PASS',
  /069500.*pass|069500.*rerun.*pass/i.test(closeoutDoc));
check('Closeout doc mentions 000660 passed after retry',
  /000660.*retry|000660.*passed.*retry/i.test(closeoutDoc));

// ── Group 5: Safety and Sanitization ─────────────────────────────────────────
log('\nGroup 5: Safety and sanitization');
check('Closeout doc states no API keys shared',
  /API key[s]?.*[Nn]o|no.*API key/i.test(closeoutDoc));
check('Closeout doc states no app secrets shared',
  /app secret[s]?|KIS_APP_SECRET/i.test(closeoutDoc));
check('Closeout doc states no tokens shared',
  /access token[s]?|bearer token[s]?/i.test(closeoutDoc));
check('Closeout doc states no account numbers shared',
  /account number[s]?|KIS_ACCOUNT_NO/i.test(closeoutDoc));
check('Closeout doc states no raw KIS JSON shared',
  /raw KIS JSON|raw.*JSON.*payload/i.test(closeoutDoc));
check('Closeout doc states no raw provider payloads shared',
  /raw.*provider payload|provider payload/i.test(closeoutDoc));
check('Closeout doc states no raw KIS field values shared',
  /raw KIS field|stck_prpr|prdy_vrss|rt_cd/i.test(closeoutDoc));
check('Closeout doc states no actual prices shared',
  /actual.*price|price.*value|market price/i.test(closeoutDoc));
check('Closeout doc states no stack traces shared',
  /stack trace[s]?/i.test(closeoutDoc));
check('Sanitization table has all No entries in closeout doc',
  /\| No \|/.test(closeoutDoc));

// ── Group 6: Source Policy ────────────────────────────────────────────────────
log('\nGroup 6: Source policy');
check('Closeout doc states source=fixture remains default',
  /source=fixture.*remains.*default|source=fixture.*only.*accepted|fixture.*only.*accepted.*source/i.test(closeoutDoc));
check('Closeout doc states source=live returns 400 UNSUPPORTED_SOURCE',
  /source=live.*400|400.*UNSUPPORTED_SOURCE|UNSUPPORTED_SOURCE/i.test(closeoutDoc));
check('Closeout doc states source=auto is deferred',
  /source=auto.*deferred|deferred.*source=auto/i.test(closeoutDoc));
check('Closeout doc states production UI uses fixture/static',
  /production UI.*fixture|fixture.*static|production UI.*fixture.*static/i.test(closeoutDoc));
check('Closeout doc states no fixture fallback on live failure',
  /no fixture fallback|fixture fallback.*not|without.*fixture fallback/i.test(closeoutDoc));
check('Closeout doc mentions previewMode=owner gate for Phase 3DP',
  /previewMode=owner/.test(closeoutDoc));
check('Closeout doc mentions allowLiveQuotes=true gate for Phase 3DP',
  /allowLiveQuotes=true/.test(closeoutDoc));
check('Closeout doc states no providerMeta exposure',
  /providerMeta/.test(closeoutDoc));

// ── Group 7: Next Phase ───────────────────────────────────────────────────────
log('\nGroup 7: Next phase');
check('Closeout doc recommends Phase 3DP',
  /Phase 3DP/.test(closeoutDoc));
check('Closeout doc recommends Portfolio Live Preview API Contract Implementation',
  /Portfolio Live Preview API.*Contract|Contract.*Implementation/i.test(closeoutDoc));
check('3DO result doc recommends Phase 3DP',
  /Phase 3DP/.test(phase3doDoc));
check('3DO-HF1 result doc recommends Phase 3DP',
  /Phase 3DP/.test(hf1Doc));

// ── Group 8: Changelog ────────────────────────────────────────────────────────
log('\nGroup 8: Changelog');
check('Changelog mentions Phase 3DO-CLOSEOUT',
  /Phase 3DO-CLOSEOUT/.test(changelog));
check('Changelog mentions 005930',          /005930/.test(changelog));
check('Changelog mentions 000660',          /000660/.test(changelog));
check('Changelog mentions 069500',          /069500/.test(changelog));
check('Changelog mentions all KR expansion targets PASS',
  /all KR expansion targets PASS|KR.*expansion.*PASS/i.test(changelog));
check('Changelog mentions Phase 3DP',       /Phase 3DP/.test(changelog));

// ── Group 9: Forbidden Patterns ───────────────────────────────────────────────
log('\nGroup 9: Forbidden patterns');
const allNewContent = closeoutDoc;
check('No setInterval in closeout doc',
  !allNewContent.includes('setInterval'));
check('No setTimeout in closeout doc',
  !allNewContent.includes('setTimeout'));
check('No cron in closeout doc',
  !(/\bcron\b/.test(allNewContent)));
check('No production deployment command in closeout doc',
  !(/vercel deploy|npm run deploy/i.test(allNewContent)));
check('No SQL execution in closeout doc',
  !(/INSERT INTO|UPDATE.*SET|DELETE FROM|CREATE TABLE/i.test(allNewContent)));
check('No Supabase write in closeout doc',
  !(/supabase.*insert|supabase.*upsert|supabase.*delete/i.test(allNewContent)));
check('No raw secret-like placeholders in closeout doc',
  !(/sk_[a-zA-Z0-9]{10}|eyJ[a-zA-Z0-9]{20}|Bearer [a-zA-Z0-9]{20}/i.test(allNewContent)));
check('No raw KIS JSON payload example in closeout doc',
  !(/stck_prpr\s*:\s*['"\d]|prdy_vrss\s*:/i.test(allNewContent)));
check('No actual market price values in closeout doc',
  !(/[\d,]+원|\$[\d,]+\.\d{2}|\d{5,}\.?\d*/i.test(allNewContent.replace(/\d{5,6}/g, ''))));
check('No source=live enabled statement in closeout doc',
  !(/source=live.*is now enabled|enabling.*source=live/i.test(allNewContent)));
check('No source=auto enabled statement in closeout doc',
  !(/source=auto.*is now enabled|enabling.*source=auto/i.test(allNewContent)));
check('Checker does not read .env files',
  !(/readFileSync\s*\(\s*['"][./]*\.env['"]/.test(readFileSync(new URL(import.meta.url), 'utf8'))));

// ── Network Safety ────────────────────────────────────────────────────────────
log('\nNetwork safety');
let fetchAttempted = false;
const savedFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = savedFetch;

check('Checker blocks network calls at top of file',
  /globalThis\.fetch\s*=.*throw/.test(readFileSync(new URL(import.meta.url), 'utf8')));

// ── Summary ───────────────────────────────────────────────────────────────────
log('');
log(`Total: ${total} | Passed: ${total - failures} | Failed: ${failures}`);
if (failures > 0) {
  log(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  log('All checks passed.');
}
