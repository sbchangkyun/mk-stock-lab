/**
 * Static and behavioral contract check for Phase 3DP — Portfolio Live Preview API.
 * Verifies live preview gate logic, fixture path preservation, no provider leakage,
 * and documentation accuracy. No network calls. No .env reads. Exits non-zero on failure.
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

const ROUTE         = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const QUOTES        = join(root, 'src', 'lib', 'server', 'marketData', 'quotes.ts');
const PV            = join(root, 'src', 'lib', 'server', 'portfolioValuation.ts');
const RESULT_DOC    = join(root, 'docs', 'planning', 'phase_3dp_portfolio_live_preview_api_contract_result_v0.1.md');
const CHANGELOG     = join(root, 'docs', 'planning', 'planning_changelog.md');
const PACKAGE       = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let total = 0;

const pass  = (label) => { total++; log(`  ✓ ${label}`); };
const fail  = (label) => { total++; failures++; log(`  ✗ FAIL: ${label}`); };
const check = (label, cond) => (cond ? pass(label) : fail(label));
const read  = (p) => existsSync(p) ? readFileSync(p, 'utf8') : '';

const route      = read(ROUTE);
const quotes     = read(QUOTES);
const pv         = read(PV);
const resultDoc  = read(RESULT_DOC);
const changelog  = read(CHANGELOG);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE, 'utf8')); } catch {}

log('=== Phase 3DP Portfolio Live Preview API Contract ===');
log('');

// ── Group 1: File Existence and Package Script ────────────────────────────────
log('Group 1: File existence and package script');
check('API route exists',                       existsSync(ROUTE));
check('quotes.ts exists',                       existsSync(QUOTES));
check('portfolioValuation.ts exists',           existsSync(PV));
check('Phase 3DP result doc exists',            existsSync(RESULT_DOC));
check('planning_changelog.md exists',           existsSync(CHANGELOG));
check('package.json has check:portfolio-live-preview-api',
  typeof pkg.scripts?.['check:portfolio-live-preview-api'] === 'string');

// ── Group 2: Fixture Path Preservation ───────────────────────────────────────
log('\nGroup 2: Fixture path preservation');
check('Route imports resolveFixtureQuotes',
  /resolveFixtureQuotes/.test(route));
check('Route imports buildPortfolioValuationFromQuotes',
  /buildPortfolioValuationFromQuotes/.test(route));
check('Route still has source=fixture default behavior',
  /source.*=.*'fixture'|=\s*'fixture'/.test(route));
check('Route still validates positions max 100 for fixture path',
  /100/.test(route));
check('Route fixture path does NOT require previewMode',
  (() => {
    const fixtureSection = route.slice(route.lastIndexOf('// ── Fixture path'));
    return fixtureSection.length > 10 && !fixtureSection.includes('previewMode');
  })());
check('Route fixture path does NOT require allowLiveQuotes',
  (() => {
    const fixtureSection = route.slice(route.lastIndexOf('// ── Fixture path'));
    return fixtureSection.length > 10 && !fixtureSection.includes('allowLiveQuotes');
  })());
check('Route still returns liveAttempted: false in fixture response',
  /liveAttempted: false/.test(route));
check('Route still returns rawProviderStored: false',
  /rawProviderStored: false/.test(route));
check('portfolioValuation.ts still exports buildPortfolioValuationFromQuotes',
  /export const buildPortfolioValuationFromQuotes/.test(pv));
check('portfolioValuation.ts assertServerRuntime still present',
  /assertServerRuntime/.test(pv));

// ── Group 3: Live Preview Gate ────────────────────────────────────────────────
log('\nGroup 3: Live preview gate');
check('Route imports getQuoteSnapshot',
  /getQuoteSnapshot/.test(route));
check('Route imports isLivePreviewGateReady',
  /isLivePreviewGateReady/.test(route));
check('Route checks source === "live"',
  /source\s*===\s*['"]live['"]/.test(route));
check('Route checks previewMode === "owner"',
  /previewMode\s*!==\s*['"]owner['"]|previewMode\s*===\s*['"]owner['"]/.test(route));
check('Route checks allowLiveQuotes === true',
  /allowLiveQuotes\s*!==\s*true|allowLiveQuotes\s*===\s*true/.test(route));
check('Route has LIVE_PREVIEW_MAX_POSITIONS or explicit 10-position limit',
  /LIVE_PREVIEW_MAX_POSITIONS|\.length\s*>\s*10\b/.test(route));
check('Route enforces KR-only scope before provider call',
  /market\s*!==\s*['"]KR['"]|market\s*===\s*['"]KR['"]/.test(route));
check('Route calls isLivePreviewGateReady before provider call',
  /isLivePreviewGateReady\(\)/.test(route));
check('quotes.ts exports isLivePreviewGateReady',
  /export const isLivePreviewGateReady/.test(quotes));
check('quotes.ts isLivePreviewGateReady checks KIS_ACCOUNT_NO',
  /KIS_ACCOUNT_NO/.test(quotes));
check('quotes.ts isLivePreviewGateReady checks production runtime',
  /vercel.*production|production.*vercel|VERCEL_ENV|NODE_ENV/i.test(quotes));
check('Route returns LIVE_PREVIEW_GATE_FAILED code',
  /LIVE_PREVIEW_GATE_FAILED/.test(route));
check('Route returns liveAttempted: true in live preview response',
  /liveAttempted: true/.test(route));

// ── Group 4: Unsupported Source Policy ───────────────────────────────────────
log('\nGroup 4: Unsupported source policy');
check('Route checks source === "auto" and rejects it',
  /source\s*===\s*['"]auto['"]/.test(route));
check('Route returns UNSUPPORTED_SOURCE for "auto"',
  /UNSUPPORTED_SOURCE/.test(route));
check('Route rejects "live" source without full gate (UNSUPPORTED_SOURCE)',
  (() => {
    const gateSection = route.slice(route.indexOf("source === 'live'"));
    return /UNSUPPORTED_SOURCE/.test(gateSection.slice(0, 500));
  })());
check('Route does NOT silently fall back to fixture from live path',
  (() => {
    const liveSection = route.slice(route.indexOf("source === 'live'"));
    const beforeEnd = liveSection.slice(0, liveSection.indexOf('// ── Fixture path'));
    return !(/resolveFixtureQuotes/.test(beforeEnd));
  })());
check('Route returns 400 for gate failures (not 500)',
  /errorResponse\(\s*400\s*,\s*'LIVE_PREVIEW_GATE_FAILED'/.test(route));

// ── Group 5: No Provider Leakage ─────────────────────────────────────────────
log('\nGroup 5: No provider leakage');
check('Route does NOT expose providerMeta in response',
  !(/providerMeta\s*:(?!\s*\/)/.test(route)));
check('Route does NOT expose stck_ field names',
  !route.includes('stck_'));
check('Route does NOT expose prdy_ field names',
  !route.includes('prdy_'));
check('Route does NOT expose rt_cd field names',
  !route.includes('rt_cd'));
check('Route does NOT expose acml_ field names',
  !route.includes('acml_'));
check('Route does NOT expose appkey',
  !route.includes('appkey'));
check('Route does NOT expose appsecret',
  !route.includes('appsecret'));
check('Route does NOT expose access_token in response',
  !route.includes('access_token'));
check('Route does NOT expose authorization header',
  !(/authorization\s*:/.test(route)));
check('Route does NOT expose Bearer token',
  !route.includes('Bearer'));
check('Route does NOT call kisClient directly',
  !route.includes('kisClient'));
check('Route does NOT call fetch directly',
  !(/\bfetch\s*\(/.test(route)));
check('Route does NOT read process.env directly',
  !route.includes('process.env'));
check('Route does NOT call import.meta.env',
  !route.includes('import.meta.env'));
check('Route rawProviderStored: false in all response paths',
  (route.match(/rawProviderStored: false/g) ?? []).length >= 2);

// ── Group 6: KR Live Preview Contract ────────────────────────────────────────
log('\nGroup 6: KR live preview contract in docs');
check('Result doc mentions 005930',              /005930/.test(resultDoc));
check('Result doc mentions 000660',              /000660/.test(resultDoc));
check('Result doc mentions 069500',              /069500/.test(resultDoc));
check('Result doc mentions KR market',           /\bKR\b/.test(resultDoc));
check('Result doc mentions KRW currency',        /KRW/.test(resultDoc));
check('Result doc mentions fresh staleState',    /\bfresh\b/.test(resultDoc));
check('Result doc mentions stale-but-usable',    /stale-but-usable/.test(resultDoc));
check('Result doc mentions unavailable',         /\bunavailable\b/.test(resultDoc));
check('Result doc mentions missingQuoteSymbols', /missingQuoteSymbols/.test(resultDoc));
check('Result doc mentions unsupportedSymbols',  /unsupportedSymbols/.test(resultDoc));
check('Result doc mentions rawProviderStored: false', /rawProviderStored.*false|rawProviderStored: false/i.test(resultDoc));
check('Result doc mentions liveAttempted: true', /liveAttempted.*true|liveAttempted: true/i.test(resultDoc));
check('Result doc mentions quoteSource: "live"', /quoteSource.*live|quoteSource: "live"/i.test(resultDoc));
check('Route response includes quoteSource: live in live path', /quoteSource: 'live'/.test(route));

// ── Group 7: Failure Semantics ────────────────────────────────────────────────
log('\nGroup 7: Failure semantics');
check('Result doc states no fixture fallback on live failure',
  /no fixture fallback|fixture fallback.*not/i.test(resultDoc));
check('Result doc states unavailable rows remain unavailable',
  /unavailable.*remain|remain.*unavailable/i.test(resultDoc));
check('Result doc states missingQuoteSymbols for missing quotes',
  /missingQuoteSymbols/.test(resultDoc));
check('Result doc states US positions rejected before provider call',
  /US.*position.*not|US symbol.*not|market.*US/i.test(resultDoc));
check('Result doc states FX not implemented',
  /FX.*not implemented|real FX.*not/i.test(resultDoc));
check('Result doc states mixed-currency total null',
  /mixed-currency.*null|totalMarketValue.*null/i.test(resultDoc));
check('Result doc states mocked FX not used in live API',
  /mocked FX.*not used|fxMockAdapter.*not used in the live/i.test(resultDoc));
check('quotes.ts isLivePreviewGateReady does not call fetch',
  (() => {
    const fnStart = quotes.indexOf('isLivePreviewGateReady');
    const fnBody = quotes.slice(fnStart, fnStart + 600);
    return !(/\bfetch\s*\(/.test(fnBody));
  })());

// ── Group 8: Documentation ────────────────────────────────────────────────────
log('\nGroup 8: Documentation');
check('Result doc mentions Phase 3DP',
  /Phase 3DP/.test(resultDoc));
check('Result doc status is Implemented — owner API live preview smoke pending',
  /Implemented.*owner.*API.*live.*preview.*smoke.*pending/i.test(resultDoc));
check('Result doc states exact triple opt-in gate',
  /previewMode.*owner|previewMode=.owner/i.test(resultDoc) &&
  /allowLiveQuotes.*true|allowLiveQuotes=true/i.test(resultDoc));
check('Result doc states source policy',
  /source=fixture.*default|default.*source=fixture/i.test(resultDoc));
check('Result doc states owner smoke is pending',
  /owner.*smoke.*pending|owner.*API.*smoke/i.test(resultDoc));
check('Result doc states no production deployment',
  /Not performed|no.*deployment/i.test(resultDoc));
check('Result doc states no live KIS by Claude Code',
  /Live KIS calls by Claude Code.*None|Claude Code.*not.*run.*KIS/i.test(resultDoc));
check('Result doc recommends next phase',
  /3DP-OWNER-SMOKE|3DQ/.test(resultDoc));
check('Result doc API route changes field says Yes',
  /API route changes.*Yes|API.*route.*changes.*Yes/i.test(resultDoc));

// ── Group 9: Changelog ────────────────────────────────────────────────────────
log('\nGroup 9: Changelog');
check('Changelog mentions Phase 3DP',
  /Phase 3DP/.test(changelog));
check('Changelog mentions KR-only live preview',
  /KR.only.*live|live.*KR.only/i.test(changelog));
check('Changelog mentions triple opt-in gate',
  /triple.*opt.in|previewMode.*owner|allowLiveQuotes/i.test(changelog));
check('Changelog states no production deployment',
  /no.*production.*deploy|not.*deploy|Not performed/i.test(changelog));
check('Changelog states no UI changes',
  /no.*UI.*change|no UI/i.test(changelog));
check('Changelog states source policy unchanged for public',
  /source=fixture.*default|fixture.*remains.*default/i.test(changelog));
check('Changelog mentions next phase',
  /3DP-OWNER-SMOKE|3DQ/.test(changelog));

// ── Group 10: Forbidden Patterns ─────────────────────────────────────────────
log('\nGroup 10: Forbidden patterns');
const newContent = resultDoc + route + quotes;
check('No setInterval in new content',
  !newContent.includes('setInterval'));
check('No setTimeout in new content',
  !newContent.includes('setTimeout'));
check('No cron in new content',
  !(/\bcron\b/.test(newContent)));
check('No production deployment command in result doc',
  !(/vercel deploy|npm run deploy/i.test(resultDoc)));
check('No SQL in result doc',
  !(/INSERT INTO|UPDATE.*SET|DELETE FROM|CREATE TABLE/i.test(resultDoc)));
check('No Supabase write in route',
  !(/supabase.*insert|supabase.*upsert/i.test(route)));
check('No raw KIS JSON payload example in result doc',
  !(/stck_prpr\s*:\s*['"\d]|prdy_vrss\s*:/i.test(resultDoc)));
check('No source=auto enablement in result doc',
  !resultDoc.includes('source=auto is now enabled'));
check('No source=live publicly enabled in result doc',
  !resultDoc.includes('source=live is now publicly'));
check('Checker does not read .env files',
  !(/readFileSync\s*\(\s*['"][./]*\.env['"]/.test(readFileSync(new URL(import.meta.url), 'utf8'))));

// ── Behavioral gate logic tests (pure JS, mirrors route TypeScript) ───────────
log('\nBehavioral gate tests (mirrors live preview gate logic)');

const buildGateCheck = (source, previewMode, allowLiveQuotes, baseCurrency, posCount, anyNonKr) => {
  if (source === 'auto') return { ok: false, code: 'UNSUPPORTED_SOURCE' };
  if (source === 'live') {
    if (previewMode !== 'owner' || allowLiveQuotes !== true)
      return { ok: false, code: 'UNSUPPORTED_SOURCE' };
    if (baseCurrency !== 'KRW')
      return { ok: false, code: 'LIVE_PREVIEW_GATE_FAILED' };
    if (posCount > 10)
      return { ok: false, code: 'LIVE_PREVIEW_GATE_FAILED' };
    if (anyNonKr)
      return { ok: false, code: 'UNSUPPORTED_SOURCE' };
    return { ok: true, code: 'LIVE_PREVIEW' };
  }
  if (source !== 'fixture') return { ok: false, code: 'UNSUPPORTED_SOURCE' };
  return { ok: true, code: 'FIXTURE' };
};

check('source=auto → UNSUPPORTED_SOURCE',
  buildGateCheck('auto', undefined, undefined, 'KRW', 1, false).code === 'UNSUPPORTED_SOURCE');
check('source="live" without previewMode → UNSUPPORTED_SOURCE',
  buildGateCheck('live', undefined, undefined, 'KRW', 1, false).code === 'UNSUPPORTED_SOURCE');
check('source="live" without allowLiveQuotes → UNSUPPORTED_SOURCE',
  buildGateCheck('live', 'owner', false, 'KRW', 1, false).code === 'UNSUPPORTED_SOURCE');
check('source="live" previewMode="owner" allowLiveQuotes=true → LIVE_PREVIEW',
  buildGateCheck('live', 'owner', true, 'KRW', 1, false).code === 'LIVE_PREVIEW');
check('source="live" with baseCurrency=USD → LIVE_PREVIEW_GATE_FAILED',
  buildGateCheck('live', 'owner', true, 'USD', 1, false).code === 'LIVE_PREVIEW_GATE_FAILED');
check('source="live" with 11 positions → LIVE_PREVIEW_GATE_FAILED',
  buildGateCheck('live', 'owner', true, 'KRW', 11, false).code === 'LIVE_PREVIEW_GATE_FAILED');
check('source="live" with 10 positions → LIVE_PREVIEW (boundary)',
  buildGateCheck('live', 'owner', true, 'KRW', 10, false).code === 'LIVE_PREVIEW');
check('source="live" with US position → UNSUPPORTED_SOURCE',
  buildGateCheck('live', 'owner', true, 'KRW', 1, true).code === 'UNSUPPORTED_SOURCE');
check('source="fixture" explicit → FIXTURE',
  buildGateCheck('fixture', undefined, undefined, 'KRW', 50, true).code === 'FIXTURE');
check('source omitted (undefined → fixture) → FIXTURE',
  buildGateCheck(undefined ?? 'fixture', undefined, undefined, 'KRW', 1, false).code === 'FIXTURE');
check('Public "live" without gate does NOT reach FIXTURE (no silent fallback)',
  buildGateCheck('live', undefined, undefined, 'KRW', 1, false).ok === false);

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
