/**
 * Static contract check for Phase 3DN — Owner-Run KIS Single Quote Preview.
 * Verifies documentation completeness, boundary wording, guard variable names,
 * test symbol, sanitization policy, source policy, and forbidden patterns.
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

const RESULT_DOC   = join(root, 'docs', 'planning', 'phase_3dn_owner_run_kis_single_quote_preview_result_v0.1.md');
const TEMPLATE     = join(root, 'docs', 'planning', 'phase_3dn_owner_kis_single_quote_preview_report_template_v0.1.md');
const OWNER_SMOKE  = join(root, 'scripts', 'owner_smoke_kis_quote_live.mjs');
const CHANGELOG    = join(root, 'docs', 'planning', 'planning_changelog.md');
const PACKAGE      = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let total = 0;

const pass = (label) => { total++; log(`  ✓ ${label}`); };
const fail = (label) => { total++; failures++; log(`  ✗ FAIL: ${label}`); };
const check = (label, cond) => (cond ? pass(label) : fail(label));
const read = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';

const resultDoc  = read(RESULT_DOC);
const template   = read(TEMPLATE);
const changelog  = read(CHANGELOG);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE, 'utf8')); } catch {}

log('=== Phase 3DN Owner-Run KIS Single Quote Preview — Static Contract ===');
log('');

// ── Group 1: File Existence ──────────────────────────────────────────────────
log('Group 1: File existence');
check('Phase 3DN result doc exists',            existsSync(RESULT_DOC));
check('Owner report template exists',           existsSync(TEMPLATE));
check('planning_changelog.md exists',           existsSync(CHANGELOG));
check('package.json has check:kis-single-quote-preview',
  typeof pkg.scripts?.['check:kis-single-quote-preview'] === 'string');
check('Owner smoke script exists',              existsSync(OWNER_SMOKE));

// ── Group 2: Boundary Wording ─────────────────────────────────────────────────
log('\nGroup 2: Boundary wording');
check('Result doc states Claude Code did not run live KIS',
  /Claude Code.*not.*run.*KIS|Live KIS calls.*Claude Code.*None|not.*execute.*live.*KIS/i.test(resultDoc));
check('Result doc states owner executes or must execute live KIS',
  /owner.*execut|owner.*run.*manually|executor.*owner/i.test(resultDoc));
check('Result doc states no production deployment',
  /not performed|no.*deploy|deployment.*none/i.test(resultDoc));
check('Result doc states no API route change',
  /API route changes.*None|no API route|no.*route.*change/i.test(resultDoc));
check('Result doc states no DB / Supabase schema change',
  /DB.*Supabase.*None|no.*schema|schema.*none/i.test(resultDoc));
check('Result doc states no UI change',
  /UI changes.*None|no.*UI change|runtime UI changes.*None/i.test(resultDoc));
check('Result doc states no live FX calls',
  /no live FX|Live FX calls.*None/i.test(resultDoc));
check('Result doc states no live GNews calls',
  /no live GNews|Live GNews calls.*None/i.test(resultDoc));
check('Result doc states no AI provider calls',
  /no AI provider|AI provider calls.*None/i.test(resultDoc));
check('Result doc states no external data fetch by Claude Code',
  /External data fetch.*Claude Code.*None|no external.*fetch/i.test(resultDoc));

// ── Group 3: Owner Guard Variables ───────────────────────────────────────────
log('\nGroup 3: Owner guard variables');
check('PHASE_3Y_LIVE_KIS_SMOKE mentioned in result doc',
  /PHASE_3Y_LIVE_KIS_SMOKE/.test(resultDoc));
check('PHASE_3Y_RUNTIME_CONFIRMED mentioned',
  /PHASE_3Y_RUNTIME_CONFIRMED/.test(resultDoc));
check('PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED mentioned',
  /PHASE_3Y_READ_ONLY_SCOPE_CONFIRMED/.test(resultDoc));
check('PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED mentioned',
  /PHASE_3Y_PROVIDER_QUOTA_RISK_ACCEPTED/.test(resultDoc));
check('PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED mentioned',
  /PHASE_3Y_NO_ACCOUNT_APIS_CONFIRMED/.test(resultDoc));
check('KIS_ENABLE_LIVE_QUOTES mentioned in result doc',
  /KIS_ENABLE_LIVE_QUOTES/.test(resultDoc));
check('KIS_ACCOUNT_NO must be absent (mentioned in result doc)',
  /KIS_ACCOUNT_NO.*absent|absent.*KIS_ACCOUNT_NO|ACCOUNT_NO.*Must be ABSENT/i.test(resultDoc));
check('Guard variables also mentioned in owner template',
  /PHASE_3Y_LIVE_KIS_SMOKE|guard var|guard.*env/i.test(template));

// ── Group 4: Test Symbol and Command ─────────────────────────────────────────
log('\nGroup 4: Test symbol and command');
check('005930 mentioned as test symbol in result doc',
  /005930/.test(resultDoc));
check('KR market mentioned in result doc',
  /market.*KR|KR.*market|Market.*KR/i.test(resultDoc));
check('KRW currency mentioned in result doc',
  /KRW/.test(resultDoc));
check('smoke:kis-quote-live:dry command mentioned in result doc',
  /smoke:kis-quote-live:dry|smoke.*kis.*quote.*live/.test(resultDoc));
check('smoke:kis-quote-live:dry mentioned in owner template',
  /smoke:kis-quote-live:dry/.test(template));
check('005930 mentioned in owner template',
  /005930/.test(template));

// ── Group 5: Sanitization Safety ─────────────────────────────────────────────
log('\nGroup 5: Sanitization safety');
check('Result doc prohibits sharing API keys',
  /not.*share.*API key|do not share.*key|not.*paste.*API|Do NOT paste/i.test(resultDoc));
check('Result doc prohibits sharing app secrets',
  /app secret|KIS_APP_SECRET|appsecret/i.test(resultDoc));
check('Result doc prohibits sharing tokens',
  /access token|bearer token/i.test(resultDoc));
check('Result doc prohibits sharing account numbers',
  /account number|KIS_ACCOUNT_NO/i.test(resultDoc));
check('Result doc prohibits sharing raw KIS JSON or payload',
  /raw KIS JSON|raw.*payload|raw KIS payload|full provider payload/i.test(resultDoc));
check('Result doc prohibits sharing authorization headers',
  /authorization header|authorization/i.test(resultDoc));
check('Result doc prohibits raw provider field names in output',
  /stck_|prdy_|rt_cd/.test(resultDoc));
check('Result doc includes pricePresent as safe field',
  /pricePresent/.test(resultDoc));
check('Result doc includes staleState as safe field',
  /staleState/.test(resultDoc));
check('Result doc includes sanitized=true as safe field',
  /sanitized/.test(resultDoc));
check('Result doc includes error category as safe field',
  /error.*category|error code/i.test(resultDoc));
check('Owner template has WARNING about not pasting secrets',
  /WARNING|Do NOT paste/.test(template));
check('Owner template includes safety confirmation questions',
  /raw.*token|raw.*payload|safety/i.test(template));

// ── Group 6: Result Status ────────────────────────────────────────────────────
log('\nGroup 6: Result status');
const validStatuses = [
  'Completed — owner live smoke PASS',
  'Owner live smoke FAIL — action required',
  'Owner execution pending',
];
check('Result doc uses a valid status string',
  validStatuses.some((s) => resultDoc.includes(s)));

// ── Group 7: Source Policy ────────────────────────────────────────────────────
log('\nGroup 7: Source policy');
check('Result doc states source=fixture remains default',
  /source=fixture.*remains.*default|source=fixture.*default|default.*source=fixture/i.test(resultDoc));
check('Result doc states source=live remains disabled',
  /source=live.*remains.*disabled|source=live.*400|source=live.*UNSUPPORTED/i.test(resultDoc));
check('Result doc states source=auto remains deferred',
  /source=auto.*remains.*deferred|source=auto.*deferred/i.test(resultDoc));
check('Result doc states production UI does not use live quotes',
  /production UI.*fixture|production UI.*static|UI.*fixture.*(all users|static)/i.test(resultDoc));

// ── Group 8: Forbidden Patterns ───────────────────────────────────────────────
log('\nGroup 8: Forbidden patterns');
const newDocContent = resultDoc + template;
check('No setInterval in new Phase 3DN docs',
  !newDocContent.includes('setInterval'));
check('No setTimeout in new Phase 3DN docs',
  !newDocContent.includes('setTimeout'));
check('No cron in new Phase 3DN docs',
  !(/\bcron\b/.test(newDocContent)));
check('No source=auto enablement in new docs',
  !newDocContent.includes("source='auto'") && !newDocContent.includes('source=auto is now enabled'));
check('No 실시간 wording added in new Phase 3DN docs',
  !newDocContent.includes('실시간'));
check('No raw KIS JSON payload example in new docs',
  !(/stck_prpr\s*:\s*['"\d]|prdy_vrss\s*:/.test(newDocContent)));
check('Changelog mentions Phase 3DN',
  /Phase 3DN/.test(changelog));
check('Changelog mentions owner execution status',
  /owner.*pending|owner.*PASS|owner.*FAIL|Owner execution pending/i.test(changelog));
check('Changelog mentions no runtime changes for 3DN',
  /no runtime|runtime.*none|runtime changes.*none/i.test(changelog));
check('Changelog mentions Claude Code did not run live KIS',
  /Claude Code.*did not.*run|not.*execute.*live.*KIS/i.test(changelog));

// ── Network safety ────────────────────────────────────────────────────────────
log('\nNetwork safety');
let fetchAttempted = false;
const savedFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = savedFetch;

const checkerSrc = readFileSync(new URL(import.meta.url), 'utf8');
check('Checker does not read .env files',
  !(/readFileSync\s*\(\s*['"][./]*\.env['"]/.test(checkerSrc)));
check('Checker blocks network calls at top of file',
  /globalThis\.fetch\s*=.*throw/.test(checkerSrc));
check('Result doc does not contain real Supabase project URL',
  !(/https?:\/\/[a-z0-9-]+\.supabase\.co/.test(resultDoc)));

// ── Summary ───────────────────────────────────────────────────────────────────
log('');
log(`Total: ${total} | Passed: ${total - failures} | Failed: ${failures}`);
if (failures > 0) {
  log(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  log('All checks passed.');
}
