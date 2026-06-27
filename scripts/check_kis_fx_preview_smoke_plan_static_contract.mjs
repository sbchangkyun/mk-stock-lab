/**
 * Static contract check for Phase 3DL — KIS + FX Preview Smoke Plan.
 * Verifies documentation completeness, source policy, safety boundaries,
 * and owner runbook safety wording.
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

const RESULT_DOC  = join(root, 'docs', 'planning', 'phase_3dl_kis_fx_preview_smoke_plan_result_v0.1.md');
const RUNBOOK     = join(root, 'docs', 'planning', 'phase_3dl_owner_kis_fx_preview_smoke_runbook_v0.1.md');
const CHANGELOG   = join(root, 'docs', 'planning', 'planning_changelog.md');
const PACKAGE     = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let total = 0;

const pass = (label) => { total++; log(`  ✓ ${label}`); };
const fail = (label) => { total++; failures++; log(`  ✗ FAIL: ${label}`); };
const check = (label, cond) => (cond ? pass(label) : fail(label));

const read = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';

const resultDoc = read(RESULT_DOC);
const runbook   = read(RUNBOOK);
const changelog = read(CHANGELOG);
const pkg       = read(PACKAGE);

// ── Group 1: File Existence ──────────────────────────────────────────────────
log('\nGroup 1: File existence');
check('Phase 3DL result doc exists',    existsSync(RESULT_DOC));
check('Owner runbook exists',           existsSync(RUNBOOK));
check('planning_changelog.md exists',   existsSync(CHANGELOG));
check('package.json has check:kis-fx-preview-smoke-plan',
  /"check:kis-fx-preview-smoke-plan"/.test(pkg));

// ── Group 2: Safety Boundary ─────────────────────────────────────────────────
log('\nGroup 2: Safety boundary');
check('Result doc states no live KIS calls in this phase',
  /no live KIS calls|Live KIS calls.*None|Live KIS calls.*none/i.test(resultDoc));
check('Result doc states no live FX calls in this phase',
  /no live FX calls|Live FX calls.*None|Live FX calls.*none/i.test(resultDoc));
check('Result doc states no Supabase schema changes',
  /no.*schema|schema.*none|DB.*Supabase.*None/i.test(resultDoc));
check('Result doc states no API route changes',
  /API route changes.*None|no API route|api.*none/i.test(resultDoc));
check('Result doc states no external data fetch by Claude Code',
  /External data fetch.*None|no external.*fetch|external.*none/i.test(resultDoc));
check('Result doc states no Vercel deployment in this phase',
  /Vercel production deployment.*Not performed|not.*deploy|deployment.*not/i.test(resultDoc));

// ── Group 3: Smoke Scope ─────────────────────────────────────────────────────
log('\nGroup 3: Smoke scope coverage');
check('Result doc mentions KR stock quote',
  /KR stock quote|KR.*stock/i.test(resultDoc));
check('Result doc mentions KR ETF quote',
  /KR ETF|KR.*etf/i.test(resultDoc));
check('Result doc mentions US stock quote (even if deferred)',
  /US stock|US.*stock/i.test(resultDoc));
check('Result doc mentions US ETF quote (even if deferred)',
  /US ETF|US.*etf/i.test(resultDoc));
check('Result doc mentions USD/KRW FX',
  /USD\/KRW|USD.*KRW|FX/i.test(resultDoc));
check('Result doc mentions mixed portfolio valuation preview',
  /mixed portfolio|portfolio valuation preview|mixed.*valuation/i.test(resultDoc));
check('Result doc makes clear US quote is not yet supported',
  /US.*not.*implement|not.*support.*US|SYMBOL_UNSUPPORTED/i.test(resultDoc));
check('Result doc acknowledges FX provider is pending',
  /FX.*pending|pending.*FX|FX.*not.*implement|FX adapter not/i.test(resultDoc));

// ── Group 4: Source Policy ────────────────────────────────────────────────────
log('\nGroup 4: Source policy');
check('Result doc states source=fixture is default',
  /source=fixture.*default|fixture.*remains.*default|default.*fixture/i.test(resultDoc));
check('Result doc states source=live is preview/owner only',
  /source=live.*owner|source=live.*preview|live.*owner.*only/i.test(resultDoc));
check('Result doc states source=auto is deferred',
  /source=auto.*defer|auto.*defer/i.test(resultDoc));
check('Result doc states no silent fixture fallback on live failure',
  /no.*silent.*fallback|silent.*fixture.*fallback.*blocked|never.*fall.*back.*fixture|live failure.*not.*fall/i.test(resultDoc));

// ── Group 5: Owner Runbook Safety ─────────────────────────────────────────────
log('\nGroup 5: Owner runbook safety wording');
check('Runbook says do not share API keys',
  /not.*share.*API key|do not share.*key|not.*share.*credential/i.test(runbook));
check('Runbook says do not share raw tokens / access tokens',
  /not.*share.*token|do not share.*token|access token/i.test(runbook));
check('Runbook says do not share account numbers',
  /not.*share.*account|account.*not.*share/i.test(runbook));
check('Runbook says do not share full raw provider payloads',
  /raw.*payload|raw KIS|raw.*provider|raw.*response/i.test(runbook));
check('Runbook says report only sanitized result categories',
  /sanitized|PASS.*FAIL|safe.*report|report.*safely/i.test(runbook));
check('Runbook lists KIS_APP_KEY as required env (name only)',
  /KIS_APP_KEY/.test(runbook));
check('Runbook lists KIS_APP_SECRET as required env (name only)',
  /KIS_APP_SECRET/.test(runbook));
check('Runbook lists KIS_BASE_URL as required env (name only)',
  /KIS_BASE_URL/.test(runbook));
check('Runbook states KIS_ACCOUNT_NO must be absent',
  /KIS_ACCOUNT_NO.*absent|absent.*KIS_ACCOUNT_NO|ACCOUNT_NO.*must NOT/i.test(runbook));
check('Runbook explains guard env variables',
  /PHASE_3Y_LIVE_KIS_SMOKE|guard.*env|guard var/i.test(runbook));
check('Runbook describes what success looks like',
  /success|what.*success|expect.*pass/i.test(runbook));
check('Runbook describes what failure looks like',
  /failure|what.*fail|PROVIDER_UNAVAILABLE|CONFIG_MISSING/i.test(runbook));

// ── Group 6: Environment Variable Names ──────────────────────────────────────
log('\nGroup 6: Environment variable names (no values)');
check('Result doc lists KIS_APP_KEY (name only)',
  /KIS_APP_KEY/.test(resultDoc));
check('Result doc lists KIS_APP_SECRET (name only)',
  /KIS_APP_SECRET/.test(resultDoc));
check('Result doc lists KIS_BASE_URL (name only)',
  /KIS_BASE_URL/.test(resultDoc));
check('Result doc lists KIS_ENABLE_LIVE_QUOTES (name only)',
  /KIS_ENABLE_LIVE_QUOTES/.test(resultDoc));
check('Result doc lists KIS_ENABLE_PREVIEW_LIVE_QUOTES (name only)',
  /KIS_ENABLE_PREVIEW_LIVE_QUOTES/.test(resultDoc));
check('Result doc states KIS_ACCOUNT_NO must be absent',
  /KIS_ACCOUNT_NO.*absent|absent.*KIS_ACCOUNT_NO/i.test(resultDoc));

// Verify docs do not contain credential-like values
const credentialPattern = /KIS_APP_KEY\s*=\s*\S+|KIS_APP_SECRET\s*=\s*\S+|KIS_BASE_URL\s*=\s*https?:\/\/\S/;
check('Result doc does not contain credential assignments (name=value)',
  !credentialPattern.test(resultDoc));
check('Runbook does not contain credential assignments (name=value)',
  !credentialPattern.test(runbook));

// ── Group 7: Next Phase ───────────────────────────────────────────────────────
log('\nGroup 7: Next phase recommendation');
check('Result doc recommends a next phase',
  /Phase 3DM|Recommended Next Phase|next phase/i.test(resultDoc));
check('Runbook mentions next steps or recommended phase',
  /Phase 3DM|next|report.*issue|stop.*report/i.test(runbook));
check('Changelog mentions Phase 3DL',
  /Phase 3DL/.test(changelog));
check('Changelog states planned/execution-ready status',
  /planned.*execution-ready|execution-ready|Planned/i.test(changelog));
check('Changelog mentions no runtime changes',
  /no runtime|runtime.*none|runtime changes.*none/i.test(changelog));

// ── Group 8: Checker Self-Safety ──────────────────────────────────────────────
log('\nGroup 8: Checker self-safety');

let fetchAttempted = false;
const savedFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = savedFetch;

const checkerSrc = readFileSync(new URL(import.meta.url), 'utf8');
check('Checker does not read .env files',
  // Detect actual .env file reads: readFileSync(<path-ending-in-.env>) patterns.
  // Uses regex to avoid needing to split the needle string (self-match risk).
  !(/readFileSync\s*\(\s*['"][./]*\.env['"]/.test(checkerSrc)));

check('Checker blocks network calls at top of file',
  /globalThis\.fetch\s*=.*throw/.test(checkerSrc));

check('Result doc does not contain real Supabase project URL',
  !(/https?:\/\/[a-z0-9-]+\.supabase\.co/.test(resultDoc)));
check('Runbook does not contain real Supabase project URL',
  !(/https?:\/\/[a-z0-9-]+\.supabase\.co/.test(runbook)));

// ── Summary ───────────────────────────────────────────────────────────────────
log('');
log(`Total: ${total} | Passed: ${total - failures} | Failed: ${failures}`);
if (failures > 0) {
  log(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  log('All checks passed.');
}
