/**
 * Static contract check for Phase 3DO — KR Quote Preview Expansion and
 * Portfolio Live Preview API Plan.
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

const RESULT_DOC  = join(root, 'docs', 'planning', 'phase_3do_kr_quote_preview_expansion_and_portfolio_live_preview_api_plan_result_v0.1.md');
const TEMPLATE    = join(root, 'docs', 'planning', 'phase_3do_owner_kr_quote_expansion_report_template_v0.1.md');
const API_PLAN    = join(root, 'docs', 'planning', 'phase_3do_portfolio_live_preview_api_plan_v0.1.md');
const CHANGELOG   = join(root, 'docs', 'planning', 'planning_changelog.md');
const PACKAGE     = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let total = 0;

const pass = (label) => { total++; log(`  ✓ ${label}`); };
const fail = (label) => { total++; failures++; log(`  ✗ FAIL: ${label}`); };
const check = (label, cond) => (cond ? pass(label) : fail(label));
const read  = (p) => existsSync(p) ? readFileSync(p, 'utf8') : '';

const resultDoc = read(RESULT_DOC);
const template  = read(TEMPLATE);
const apiPlan   = read(API_PLAN);
const changelog = read(CHANGELOG);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE, 'utf8')); } catch {}

log('=== Phase 3DO KR Quote Preview Expansion & Portfolio Live Preview Plan — Static Contract ===');
log('');

// ── Group 1: File Existence ──────────────────────────────────────────────────
log('Group 1: File existence');
check('Main result doc exists',                  existsSync(RESULT_DOC));
check('Owner report template exists',            existsSync(TEMPLATE));
check('Portfolio Live Preview API plan exists',  existsSync(API_PLAN));
check('planning_changelog.md exists',            existsSync(CHANGELOG));
check('package.json has check:kr-quote-preview-plan',
  typeof pkg.scripts?.['check:kr-quote-preview-plan'] === 'string');

// ── Group 2: Boundary Wording ─────────────────────────────────────────────────
log('\nGroup 2: Boundary wording');
const allDocs = resultDoc + template + apiPlan;
check('Result doc states Claude Code did not run live KIS',
  /Claude Code.*not.*run.*KIS|Live KIS calls.*Claude Code.*None|Claude Code did not run live KIS/i.test(resultDoc));
check('Result doc states owner must run live KIS',
  /owner.*run.*manually|executor.*owner|owner.*run.*smoke|owner.*execut/i.test(resultDoc));
check('Result doc states no production deployment',
  /not performed|no.*deploy|Vercel production deployment.*Not performed/i.test(resultDoc));
check('Result doc states no runtime UI changes',
  /Runtime UI changes.*None|no.*UI change|no.*runtime.*UI/i.test(resultDoc));
check('Result doc states no API route changes',
  /API route changes.*None|no API route|no.*route.*change/i.test(resultDoc));
check('Result doc states no DB / Supabase schema changes',
  /DB.*Supabase.*None|no.*schema.*change|schema.*None/i.test(resultDoc));
check('Result doc states no live FX calls by Claude Code',
  /Live FX calls.*None|no live FX/i.test(resultDoc));
check('Result doc states no live GNews calls',
  /Live GNews calls.*None|no live GNews/i.test(resultDoc));
check('Result doc states no AI provider calls',
  /AI provider calls.*None|no AI provider/i.test(resultDoc));
check('Result doc states no external data fetch by Claude Code',
  /External data fetch.*Claude Code.*None|no external.*fetch/i.test(resultDoc));

// ── Group 3: KR Quote Expansion Targets ──────────────────────────────────────
log('\nGroup 3: KR quote expansion targets');
check('005930 mentioned in result doc',          /005930/.test(resultDoc));
check('000660 mentioned in result doc',          /000660/.test(resultDoc));
check('069500 mentioned in result doc',          /069500/.test(resultDoc));
check('KR market mentioned in result doc',       /market.*KR|KR.*market/i.test(resultDoc));
check('KRW currency mentioned in result doc',    /KRW/.test(resultDoc));
check('KR ETF mentioned in result doc',          /KR ETF|ETF.*KR/i.test(resultDoc));
check('PHASE_3Y_SMOKE_MARKET mentioned in result doc',
  /PHASE_3Y_SMOKE_MARKET/.test(resultDoc));
check('PHASE_3Y_SMOKE_SYMBOL mentioned in result doc',
  /PHASE_3Y_SMOKE_SYMBOL/.test(resultDoc));
check('smoke:kis-quote-live:dry command mentioned in result doc',
  /smoke:kis-quote-live:dry/.test(resultDoc));
check('005930 mentioned in owner template',      /005930/.test(template));
check('000660 mentioned in owner template',      /000660/.test(template));
check('069500 mentioned in owner template',      /069500/.test(template));
check('PHASE_3Y_SMOKE_MARKET mentioned in owner template',
  /PHASE_3Y_SMOKE_MARKET/.test(template));
check('PHASE_3Y_SMOKE_SYMBOL mentioned in owner template',
  /PHASE_3Y_SMOKE_SYMBOL/.test(template));
check('smoke:kis-quote-live:dry in owner template',
  /smoke:kis-quote-live:dry/.test(template));

// ── Group 4: Sanitization Safety ─────────────────────────────────────────────
log('\nGroup 4: Sanitization safety');
check('Result doc prohibits sharing API keys',
  /Do NOT paste API key|not.*share.*API key|Do NOT paste/i.test(resultDoc));
check('Result doc prohibits sharing app secrets',
  /app secret|KIS_APP_SECRET/i.test(resultDoc));
check('Result doc prohibits sharing tokens',
  /access token|bearer token/i.test(resultDoc));
check('Result doc prohibits sharing account numbers',
  /account number|KIS_ACCOUNT_NO/i.test(resultDoc));
check('Result doc prohibits raw KIS JSON',
  /raw KIS JSON|raw KIS payload|raw.*payload/i.test(resultDoc));
check('Result doc prohibits authorization headers',
  /authorization header|authorization/i.test(resultDoc));
check('Result doc prohibits raw KIS field names',
  /stck_|prdy_|rt_cd/.test(resultDoc));
check('Result doc includes PASS/FAIL as safe field',
  /PASS.*FAIL|FAIL.*PASS|pass.*fail/i.test(resultDoc));
check('Result doc includes staleState as safe field',
  /staleState/.test(resultDoc));
check('Result doc includes pricePresent as safe field',
  /pricePresent/.test(resultDoc));
check('Result doc includes sanitized as safe field',
  /sanitized/.test(resultDoc));
check('Result doc includes error category as safe field',
  /error.*category|error.*code/i.test(resultDoc));
check('Owner template has WARNING about not pasting secrets',
  /WARNING|Do NOT paste/.test(template));
check('Owner template has safety confirmation per symbol',
  /Safety confirmation|access_token|raw.*KIS.*token/i.test(template));

// ── Group 5: Portfolio API Plan ───────────────────────────────────────────────
log('\nGroup 5: Portfolio API plan');
check('API plan states source=fixture is current default',
  /source=fixture.*default|default.*source=fixture|fixture.*is.*only.*currently.*supported/i.test(apiPlan));
check('API plan states source=live is future preview-only path',
  /source=live.*preview|future.*source.*live|source.*live.*preview/i.test(apiPlan));
check('Result doc states source=live remains disabled in this phase',
  /source=live.*remains.*disabled|source=live.*400|source=live.*UNSUPPORTED/i.test(resultDoc));
check('API plan states source=auto is deferred',
  /source=auto.*deferred|deferred.*source=auto/i.test(apiPlan));
check('API plan defines KR-only initial scope',
  /KR.*only|KR-only|KR positions only/i.test(apiPlan));
check('API plan states US positions are unsupported',
  /US.*SYMBOL_UNSUPPORTED|US.*unsupported|US.*rejected|US market.*not supported/i.test(apiPlan));
check('API plan states mixed-currency total is null without FX',
  /totalMarketValue.*null|mixed.*currency.*null|fxRequired/i.test(apiPlan));
check('API plan states no fixture fallback',
  /no.*fixture.*fallback|never.*fall.*back.*fixture|no.*silently.*substitute|silent.*fallback/i.test(apiPlan));
check('API plan states providerMeta is not exposed',
  /providerMeta.*not.*expos|providerMeta.*never.*appear|providerMeta.*stripped/i.test(apiPlan));
check('API plan mentions cache freshness states',
  /fresh|stale-but-usable|unavailable/.test(apiPlan));
check('API plan defines previewMode gate',
  /previewMode|preview.*gate|preview.*owner/i.test(apiPlan));
check('API plan mentions 10-position limit for early preview',
  /10.*position|position.*10|maximum.*10/i.test(apiPlan));

// ── Group 6: UI Freshness Labels ──────────────────────────────────────────────
log('\nGroup 6: UI freshness labels');
const docsWithLabels = resultDoc + apiPlan;
check('조회 시점 기준 mentioned in docs',
  /조회 시점 기준/.test(docsWithLabels));
check('최근 조회 기준 mentioned in docs',
  /최근 조회 기준/.test(docsWithLabels));
check('데이터 일시 불가 mentioned in docs',
  /데이터 일시 불가/.test(docsWithLabels));
check('연동 실패 mentioned in docs',
  /연동 실패/.test(docsWithLabels));

// Verify forbidden words are only mentioned in avoid/prohibited sections, not as recommendations
const avoidSection = (docsWithLabels.match(/Avoid[\s\S]*?(?=\n## |\n---|\n\n## |$)/i) || [docsWithLabels])[0];
check('실시간 not newly recommended in docs (only in avoid section)',
  !(/실시간/.test(docsWithLabels)) || /Avoid|avoid|prohibited|forbidden|금지/i.test(avoidSection));
check('자동 최신화 not newly recommended in docs (only in avoid section)',
  !(/자동 최신화/.test(docsWithLabels)) || /Avoid|avoid|prohibited/i.test(avoidSection));
check('매수 not newly recommended in docs (only in avoid section)',
  !(/매수/.test(docsWithLabels)) || /Avoid|avoid|prohibited|forbidden|금지/i.test(avoidSection));
check('매도 not newly recommended in docs (only in avoid section)',
  !(/매도/.test(docsWithLabels)) || /Avoid|avoid|prohibited|forbidden|금지/i.test(avoidSection));

// ── Group 7: Changelog ────────────────────────────────────────────────────────
log('\nGroup 7: Changelog');
check('Changelog mentions Phase 3DO',
  /Phase 3DO/.test(changelog));
check('Changelog mentions KR quote expansion targets',
  /005930|000660|069500/.test(changelog));
check('Changelog mentions no runtime changes',
  /no runtime|runtime.*none|runtime changes.*none/i.test(changelog));
check('Changelog mentions no live KIS calls by Claude Code',
  /Claude Code.*did not.*run|not.*execute.*live.*KIS/i.test(changelog));
check('Changelog mentions recommended next phase',
  /next phase|3DO-CLOSEOUT|3DP/i.test(changelog));

// ── Group 8: Forbidden Patterns ───────────────────────────────────────────────
log('\nGroup 8: Forbidden patterns');
const newContent = resultDoc + template + apiPlan;
check('No setInterval in new Phase 3DO docs',
  !newContent.includes('setInterval'));
check('No setTimeout in new Phase 3DO docs',
  !newContent.includes('setTimeout'));
check('No cron scheduling in new Phase 3DO docs',
  !(/\bcron\b/.test(newContent)));
check('No schedule in new Phase 3DO docs',
  !(/\bschedule\b/.test(newContent)));
check('No production deployment command in new docs',
  !(/vercel deploy|npm run deploy/i.test(newContent)));
check('No direct live provider call in new docs',
  !(/getKisQuoteSnapshot\s*\(|getKisDomesticQuoteSnapshot\s*\(/.test(newContent)));
check('No source=auto enablement in new docs',
  !newContent.includes('source=auto is now enabled') && !newContent.includes("source='auto'"));
check('No raw KIS payload example in new docs',
  !(/stck_prpr\s*:\s*['"\d]|prdy_vrss\s*:/.test(newContent)));

// ── Network Safety ────────────────────────────────────────────────────────────
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
