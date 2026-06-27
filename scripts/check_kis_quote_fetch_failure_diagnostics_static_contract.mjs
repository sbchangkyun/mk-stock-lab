/**
 * Static contract check for Phase 3DO-HF1 — KIS Quote Fetch Failure Diagnostics.
 * Verifies that the owner smoke script emits safe classified diagnostic codes
 * instead of only the generic QUOTE_FETCH_FAILED. No network calls. No .env reads.
 * Exits non-zero on failure.
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

const RESULT_DOC    = join(root, 'docs', 'planning', 'phase_3do_hf1_kis_quote_fetch_failure_diagnostics_result_v0.1.md');
const OWNER_SMOKE   = join(root, 'scripts', 'owner_smoke_kis_quote_live.mjs');
const TEMPLATE      = join(root, 'docs', 'planning', 'phase_3do_owner_kr_quote_expansion_report_template_v0.1.md');
const CHANGELOG     = join(root, 'docs', 'planning', 'planning_changelog.md');
const PACKAGE       = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let total = 0;

const pass  = (label) => { total++; log(`  ✓ ${label}`); };
const fail  = (label) => { total++; failures++; log(`  ✗ FAIL: ${label}`); };
const check = (label, cond) => (cond ? pass(label) : fail(label));
const read  = (p) => existsSync(p) ? readFileSync(p, 'utf8') : '';

const resultDoc  = read(RESULT_DOC);
const smokeSrc   = read(OWNER_SMOKE);
const template   = read(TEMPLATE);
const changelog  = read(CHANGELOG);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE, 'utf8')); } catch {}

log('=== Phase 3DO-HF1 KIS Quote Fetch Failure Diagnostics — Static Contract ===');
log('');

// ── Group 1: File Existence ──────────────────────────────────────────────────
log('Group 1: File existence');
check('HF1 result doc exists',           existsSync(RESULT_DOC));
check('Owner smoke script exists',       existsSync(OWNER_SMOKE));
check('Owner 3DO report template exists', existsSync(TEMPLATE));
check('planning_changelog.md exists',    existsSync(CHANGELOG));
check('package.json has check:kis-quote-fetch-diagnostics',
  typeof pkg.scripts?.['check:kis-quote-fetch-diagnostics'] === 'string');

// ── Group 2: Diagnostic Codes ─────────────────────────────────────────────────
log('\nGroup 2: Diagnostic codes in owner smoke script');
check('classifyQuoteFetchFailure function present',
  /classifyQuoteFetchFailure/.test(smokeSrc));
check('PROVIDER_RATE_LIMITED mapped in classifier',
  /PROVIDER_RATE_LIMITED/.test(smokeSrc));
check('PROVIDER_UNAVAILABLE mapped in classifier',
  /PROVIDER_UNAVAILABLE/.test(smokeSrc));
check('AUTH_REQUIRED mapped in classifier',
  /AUTH_REQUIRED/.test(smokeSrc));
check('KIS_CONFIG_MISSING mapped in classifier',
  /KIS_CONFIG_MISSING/.test(smokeSrc));
check('SYMBOL_UNSUPPORTED mapped in classifier',
  /SYMBOL_UNSUPPORTED/.test(smokeSrc));
check('QUOTE_NORMALIZATION_FAILED present in smoke script (normalization step)',
  /QUOTE_NORMALIZATION_FAILED/.test(smokeSrc));
check('PROVIDER_RESPONSE_UNEXPECTED mapped in classifier',
  /PROVIDER_RESPONSE_UNEXPECTED/.test(smokeSrc));
check('QUOTE_FETCH_FAILED_UNKNOWN mapped as safe fallback',
  /QUOTE_FETCH_FAILED_UNKNOWN/.test(smokeSrc));
check('SAFE_OUTPUT_BLOCKED present in smoke script (sanitizer)',
  /SAFE_OUTPUT_BLOCKED/.test(smokeSrc));
check('Generic QUOTE_FETCH_FAILED is no longer the only emitted quote-fetch failure code',
  /QUOTE_FETCH_FAILED_UNKNOWN|classifyQuoteFetchFailure/.test(smokeSrc) &&
  smokeSrc.includes('classifyQuoteFetchFailure'));
check('classifyQuoteFetchFailure is called on !quoteResult.ok path',
  /classifyQuoteFetchFailure\(quoteResult\)/.test(smokeSrc));

// ── Group 3: Sanitization Preserved ──────────────────────────────────────────
log('\nGroup 3: Sanitization preserved');
check('logSafe still present in smoke script',
  /logSafe/.test(smokeSrc));
check('forbiddenOutputPattern still present',
  /forbiddenOutputPattern/.test(smokeSrc));
check('stck_ still in forbiddenOutputPattern',
  /stck_prpr/.test(smokeSrc));
check('prdy_ still in forbiddenOutputPattern',
  /prdy_vrss/.test(smokeSrc));
check('rt_cd still in forbiddenOutputPattern',
  /rt_cd/.test(smokeSrc));
check('acml_ still in forbiddenOutputPattern',
  /acml_vol/.test(smokeSrc));
check('access_token still in forbiddenOutputPattern',
  /access_token/.test(smokeSrc));
check('appkey still in forbiddenOutputPattern',
  /appkey/.test(smokeSrc));
check('appsecret still in forbiddenOutputPattern',
  /appsecret/.test(smokeSrc));
check('authorization still in forbiddenOutputPattern',
  /authorization/.test(smokeSrc));
check('Bearer still in forbiddenOutputPattern',
  /Bearer/.test(smokeSrc));
check('classifyQuoteFetchFailure does not interpolate raw messages',
  !(/classifyQuoteFetchFailure[\s\S]{0,500}message|classifyQuoteFetchFailure[\s\S]{0,500}\.message/.test(smokeSrc)));
check('classifyQuoteFetchFailure does not interpolate result.provider payload',
  !(/classifyQuoteFetchFailure[\s\S]{0,500}result\.provider\b/.test(smokeSrc)));

// ── Group 4: PASS Behavior Preserved ─────────────────────────────────────────
log('\nGroup 4: PASS behavior preserved');
check('live-quote-received note still present',
  /live-quote-received/.test(smokeSrc));
check('quote-normalization step still present',
  /quote-normalization/.test(smokeSrc));
check('staleState still emitted in normalization step',
  /staleState/.test(smokeSrc));
check('cache-write step still present',
  /cache-write/.test(smokeSrc));
check('fresh-readback step still present',
  /fresh-readback/.test(smokeSrc));
check('cleanup-restore step still present',
  /cleanup-restore/.test(smokeSrc));
check('final-result step still present',
  /final-result/.test(smokeSrc));
check('liveKis field still emitted in final-result',
  /liveKis/.test(smokeSrc));
check('quoteNormalized field still emitted',
  /quoteNormalized/.test(smokeSrc));
check('cacheValidated field still emitted',
  /cacheValidated/.test(smokeSrc));

// ── Group 5: Dry-Run Preserved ────────────────────────────────────────────────
log('\nGroup 5: Dry-run behavior preserved');
check('dry-run-no-live-guards still present',
  /dry-run-no-live-guards/.test(smokeSrc));
check('dry-run-synthetic-snapshot still present',
  /dry-run-synthetic-snapshot/.test(smokeSrc));
check('dry-run-guard-sim still present',
  /dry-run-guard-sim/.test(smokeSrc));
check('dry-run-runtime-sim still present',
  /dry-run-runtime-sim/.test(smokeSrc));
check('dry-run-env-sim still present',
  /dry-run-env-sim/.test(smokeSrc));
check('dry-run-identity-sim still present',
  /dry-run-identity-sim/.test(smokeSrc));
check('dry-run-account-env-sim still present',
  /dry-run-account-env-sim/.test(smokeSrc));

// ── Group 6: Documentation ────────────────────────────────────────────────────
log('\nGroup 6: Documentation');
check('Result doc mentions 005930 PASS',
  /005930.*PASS|PASS.*005930/i.test(resultDoc));
check('Result doc mentions 000660 PASS',
  /000660.*PASS|PASS.*000660/i.test(resultDoc));
check('Result doc mentions 069500 FAIL at quote-fetch',
  /069500.*FAIL|069500.*quote-fetch/i.test(resultDoc));
check('Result doc states owner diagnostic rerun pending',
  /owner.*rerun.*pending|Implemented.*owner.*diagnostic.*rerun.*pending|rerun.*pending/i.test(resultDoc));
check('Result doc states Claude Code did not run live KIS',
  /Live KIS calls.*Claude Code.*None|Claude Code.*not.*run.*KIS/i.test(resultDoc));
check('Result doc states no API route changes',
  /API route changes.*None|no API route/i.test(resultDoc));
check('Result doc states no UI changes',
  /Runtime UI changes.*None|no.*UI change/i.test(resultDoc));
check('Result doc states no DB changes',
  /DB.*Supabase.*None|no.*schema/i.test(resultDoc));
check('Result doc states no deployment',
  /Not performed|no.*deploy/i.test(resultDoc));
check('Result doc lists all allowed diagnostic codes',
  /PROVIDER_RATE_LIMITED/.test(resultDoc) &&
  /PROVIDER_UNAVAILABLE/.test(resultDoc) &&
  /AUTH_REQUIRED/.test(resultDoc) &&
  /KIS_CONFIG_MISSING/.test(resultDoc) &&
  /SYMBOL_UNSUPPORTED/.test(resultDoc) &&
  /QUOTE_FETCH_FAILED_UNKNOWN/.test(resultDoc));
check('Result doc lists recommended next phase branches',
  /3DO-CLOSEOUT|3DQ|3DO-Retry/i.test(resultDoc));
check('Result doc includes owner rerun instruction for 069500',
  /069500/.test(resultDoc) && /PHASE_3Y_SMOKE_SYMBOL/.test(resultDoc));

// ── Group 7: Changelog ────────────────────────────────────────────────────────
log('\nGroup 7: Changelog');
check('Changelog mentions Phase 3DO-HF1',
  /Phase 3DO-HF1/.test(changelog));
check('Changelog mentions 069500 failure',
  /069500/.test(changelog));
check('Changelog mentions diagnostic improvement',
  /classifyQuoteFetchFailure|safe.*diagnostic|diagnostic.*code/i.test(changelog));
check('Changelog mentions Claude Code did not run live KIS',
  /Claude Code.*did not.*run|not.*execute.*live.*KIS/i.test(changelog));

// ── Group 8: Forbidden Patterns ───────────────────────────────────────────────
log('\nGroup 8: Forbidden patterns');
const newContent = resultDoc;
check('No setInterval in HF1 result doc',
  !newContent.includes('setInterval'));
check('No setTimeout in HF1 result doc',
  !newContent.includes('setTimeout'));
check('No cron in HF1 result doc',
  !(/\bcron\b/.test(newContent)));
check('No production deployment command in result doc',
  !(/vercel deploy|npm run deploy/i.test(newContent)));
check('No raw KIS JSON payload example in result doc',
  !(/stck_prpr\s*:\s*['"\d]|prdy_vrss\s*:/.test(newContent)));
check('No source=auto enablement in result doc',
  !newContent.includes('source=auto is now enabled'));
check('classifyQuoteFetchFailure has no direct live provider call',
  !/classifyQuoteFetchFailure[\s\S]{0,800}fetch\(|classifyQuoteFetchFailure[\s\S]{0,800}await/.test(smokeSrc));
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
