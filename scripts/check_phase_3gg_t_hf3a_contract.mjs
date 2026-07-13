/**
 * Phase 3GG-T-HF3A static contract checker (read-only).
 *
 * Verifies the explicit-selection / active-chart integrity guard in chart-ai.astro + the pure state module:
 * no hidden Samsung default, pending≠active, all three analyses share one authoritative guard and reference
 * the ACTIVE chart context, chart success gates enablement, selection change invalidates, stale protection
 * (sequence + revision + AbortController), URL symbol is click-to-load only, zero-request entry preserved,
 * and no durable-token / provider / account-scope / dependency change.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '9de40e8';
const PAGE = 'src/pages/chart-ai.astro';
const MODULE = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf3a_selected_symbol_integrity.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf3a_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf3a_selected_symbol_integrity_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };

// --- 1. Required files ---
for (const f of [PAGE, MODULE, SMOKE, CHECKER_SELF, RESULT_DOC]) {
  assert(existsSync(f), `Required file missing: ${f}`);
}

const page = read(PAGE);
const mod = read(MODULE);

// --- 2. Pure, client-safe state module (no DOM / network / time) ---
assert(/export const createSelectedSymbolIntegrityState/.test(mod), 'module must export createSelectedSymbolIntegrityState.');
assert(/pendingInstrument/.test(mod) && /activeChartInstrument/.test(mod), 'module must model pending AND active instruments distinctly.');
assert(/selectionRevision/.test(mod) && /activeChartRevision/.test(mod), 'module must track selection + active-chart revisions.');
for (const forbidden of [/\bdocument\b/, /\bwindow\b/, /\bfetch\b/, /\bfetch\(/, /Date\.now/, /Math\.random/, /new Date\b/]) {
  assert(!forbidden.test(mod), `state module must stay pure (no DOM/network/time): ${forbidden}`);
}

// --- 3. No hidden Samsung LIVE-STATE default ---
assert(!/let\s+selectedSymbol\s*=\s*['"]005930['"]/.test(page), "no live-state default: `let selectedSymbol = '005930'` must be gone.");
assert(!/let\s+selectedName\s*=\s*['"]삼성전자['"]/.test(page), "no live-state default: `let selectedName = '삼성전자'` must be gone.");
assert(/let\s+selectedSymbol\s*=\s*['"]['"]/.test(page), 'selectedSymbol must initialize empty.');
assert(/let\s+selectedRecord[^\n]*=\s*null/.test(page), 'selectedRecord must initialize null (no default record lookup).');
// No DEFAULT_INSTRUMENT Samsung fallback anywhere.
assert(!/DEFAULT_INSTRUMENT/.test(page), 'the DEFAULT_INSTRUMENT Samsung fallback must be removed.');
// No `|| '005930'` / `?? '005930'` (or the name) fallback used as an analysis/selection target.
assert(!/(\|\||\?\?)\s*['"]005930['"]/.test(page), "no `|| '005930'` fallback allowed.");
assert(!/(\|\||\?\?)\s*['"]삼성전자['"]/.test(page), "no `|| '삼성전자'` fallback allowed.");

// --- 4. Page imports + instantiates the authoritative state ---
assert(/import\s*\{\s*createSelectedSymbolIntegrityState\s*\}\s*from\s*['"][^'"]*selected-symbol-integrity\.mjs['"]/.test(page), 'page must import the integrity state module.');
assert(/const\s+integrity\s*=\s*createSelectedSymbolIntegrityState\(\)/.test(page), 'page must instantiate the integrity state.');

// --- 5. Selection creates PENDING only (no auto chart load) ---
assert(/integrity\.selectPending\(/.test(page), 'updateSelection must set a pending instrument via selectPending.');
// updateSelection must NOT auto-load the chart. Extract its body and assert no loadRealChart() call within.
const updSelMatch = page.match(/const updateSelection = \(record: any\) => \{([\s\S]*?)\n      \};/);
assert(updSelMatch !== null, 'updateSelection function must be present.');
const updSelBody = updSelMatch ? updSelMatch[1] : '';
assert(!/loadRealChart\(/.test(updSelBody), 'updateSelection must NOT auto-load the chart (selection is pending-only).');
assert(/selectPending/.test(updSelBody), 'updateSelection must enter the pending stage.');

// --- 6. Explicit chart promotion is the only path that activates ---
assert(/integrity\.beginChartLoad\(\)/.test(page), 'loadRealChart must begin an explicit chart load via beginChartLoad.');
assert(/integrity\.resolveChartLoad\(/.test(page), 'chart load must be resolved through the integrity guard (promotion gate).');
assert(/handleExplicitChartLoad/.test(page), 'an explicit load handler must exist.');
assert(/chartAiRealChartLoadBtn[\s\S]{0,200}addEventListener\('click'[\s\S]{0,80}handleExplicitChartLoad/.test(page)
  || /loadBtn\?\.addEventListener\('click'[\s\S]{0,80}handleExplicitChartLoad/.test(page), 'the load button must invoke the explicit load handler.');

// --- 7. Both remaining analyses share ONE authoritative guard + use the ACTIVE context ---
// Phase 3GG-T-HF4-FAST-HF1 SUPERSEDED this: Market Intelligence was removed from chart-ai.astro (mobile
// interaction cleanup); only Similar Pattern + MK AI remain wired to the shared guard. The integrity
// module's ANALYSIS_KINDS list is untouched (kept at ['similar-pattern','mk-ai','market-intel']) since no
// future contract depends on the removal and re-adding the caller would be lower-risk than a module edit.
for (const kind of ['similar-pattern', 'mk-ai']) {
  assert(new RegExp(`integrity\\.beginAnalysis\\('${kind}'\\)`).test(page), `analysis '${kind}' must call the shared guard integrity.beginAnalysis.`);
}
assert(!/integrity\.beginAnalysis\('market-intel'\)/.test(page), 'market-intel must no longer call the shared guard (Market Intelligence removed from the page).');
assert((page.match(/integrity\.beginAnalysis\(/g) || []).length >= 2, 'both remaining analyses must call the shared guard.');
assert((page.match(/integrity\.resolveAnalysis\(/g) || []).length >= 2, 'both remaining analyses must re-check staleness via resolveAnalysis before rendering.');
// Analyses must use the active-context instrument, not the raw pending selection variable.
assert(!/const sym = selectedSymbol;/.test(page), 'analysis functions must not read the raw selectedSymbol (use the active context).');
assert((page.match(/const sym = token\.instrument\.symbol;/g) || []).length >= 2, 'each analysis must derive its symbol from the active-context token.');

// --- 8. Guard requires chart success before enablement ---
assert(/chartLoadStatus === 'success'/.test(mod), 'canRunAnalysis must require a successful chart load.');
assert(/activeChartCandleCount > 0/.test(mod), 'canRunAnalysis must require non-empty candles.');
assert(/activeChartRevision === selectionRevision/.test(mod), 'canRunAnalysis must require the active revision to match the current selection.');
assert(/beginAnalysis\(kind\)\s*\{[\s\S]*?if \(!canRunAnalysis\(\)\) return null/.test(mod), 'beginAnalysis must refuse when no active chart context is valid.');

// --- 9. Selection change clears active context + results, aborts + invalidates ---
assert(/selectPending\(instrument\)\s*\{[\s\S]*?clearActive\(\)[\s\S]*?invalidateAnalyses\(\)/.test(mod), 'selectPending must clear active + invalidate analyses.');
// Phase 3GG-T-HF4-FAST-HF1 SUPERSEDED this: only two analysis result panels remain (Market Intelligence removed).
assert(/resetSelectedSimilarity\(\)/.test(updSelBody) && /resetSelectedMkAi\(\)/.test(updSelBody), 'updateSelection must clear both remaining analysis result panels.');

// --- 10. AbortController-based cancellation still present for every remaining request ---
// Phase 3GG-T-HF4-FAST-HF1 SUPERSEDED this: miAbort no longer exists (Market Intelligence removed).
for (const ac of ['realChartAbort', 'simAbort', 'mkaiAbort']) {
  assert(new RegExp(`${ac}[\\s\\S]{0,40}new AbortController`).test(page), `AbortController must exist for: ${ac}`);
}
assert(!/\bmiAbort\b/.test(page), 'miAbort must no longer exist (Market Intelligence removed from the page).');

// --- 11. Sequence + revision stale protection ---
assert(/token\.seq !== chartRequestSeq \|\| token\.revision !== selectionRevision/.test(mod), 'chart resolution must check both sequence and selection revision.');
assert(/token\.seq !== analysisSeq\[token\.kind\]/.test(mod) && /token\.revision !== selectionRevision/.test(mod), 'analysis resolution must check sequence + revision.');
assert(/if \(seq !== realChartSeq\) return/.test(page) && /if \(seq !== simSeq\) return/.test(page), 'page must keep local sequence guards on responses.');

// --- 12. URL symbol is click-to-load only; zero-request entry preserved ---
assert(/suggestedInstrument/.test(page), 'a URL symbol must be modeled as a suggestion.');
assert(/chartAiQuery\.get\('symbol'\)/.test(page), 'URL symbol must be read.');
// initProductionInstrument idle path must not auto-load a chart.
const initMatch = page.match(/const initProductionInstrument = \(\) => \{([\s\S]*?)\n      \};/);
const initBody = initMatch ? initMatch[1] : '';
assert(initBody.length > 0, 'initProductionInstrument must be present.');
assert(!/loadRealChart\(\)/.test(initBody), 'page entry must not auto-load a chart (zero-request entry).');
assert(/markWorkspaceReady\(\)/.test(initBody), 'init must mark the workspace ready for the availability guard.');
assert(/'idle'/.test(initBody), 'init with no ?symbol must stay idle.');

// --- 13. Analysis start buttons are disabled by default (a11y, not CSS-only) ---
// Phase 3GG-T-HF4-FAST-HF1 SUPERSEDED this: chartAiMiStartBtn no longer exists (Market Intelligence removed).
for (const id of ['chartAiSimilarityStartBtn', 'chartAiMkAiStartBtn']) {
  assert(new RegExp(`id="${id}"[^>]*\\bdisabled\\b`).test(page), `button ${id} must be disabled by default.`);
  assert(new RegExp(`id="${id}"[^>]*aria-disabled="true"`).test(page), `button ${id} must be aria-disabled by default.`);
}
assert(/aria-disabled['"]?\s*,\s*String\(!enabled\)\)/.test(page) || /setAttribute\('aria-disabled', String\(!enabled\)\)/.test(page), 'availability sync must set aria-disabled to match the disabled state.');

// --- 14. Required user-facing guard copy ---
assert(page.includes('먼저 종목을 검색해 차트를 불러와 주세요.'), 'must include the initial analysis guidance copy.');
assert(page.includes('선택한 종목의 차트를 먼저 불러와 주세요.'), 'must include the pending guidance copy.');
assert(page.includes('차트를 불러오는 동안 분석 기능을 사용할 수 없습니다.'), 'must include the loading guidance copy.');

// --- 15. No durable-token / provider / auth change; no account/trading scope; no deps ---
const tokenDiff = runGit(['diff', '--name-only', BASELINE, '--', 'src/lib/server/providers/kis', 'src/pages/api/chart-ai/similarity.json.ts', 'src/pages/api/chart-ai/mk-analysis.json.ts', 'src/pages/api/chart-ai/market-intelligence.json.ts', 'src/pages/api/chart-ai/market/ohlcv.json.ts', 'src/pages/api/chart-ai/instruments/search.json.ts']).trim();
assert(tokenDiff === '', `no durable-token/provider/route source may change this phase, but changed: ${tokenDiff}`);
const supaDiff = runGit(['diff', '--name-only', BASELINE, '--', 'supabase']).trim();
assert(supaDiff === '', `no Supabase change allowed this phase, but changed: ${supaDiff}`);
for (const pat of [/inquire-balance/i, /inquire-account/i, /order-cash/i, /\/trading\//i, /funds?-transfer/i, /KIS_ACCOUNT_NO/]) {
  assert(!pat.test(page) && !pat.test(mod), `no account/order/balance/funds/trading scope may be added: ${pat}`);
}
const lockDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim();
assert(lockDiff === '', `no lockfile change allowed, but changed: ${lockDiff}`);
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// --- 16. No deploy code / no secret fixture ---
assert(!/vercel deploy|--prod/.test(read(SMOKE)), 'smoke must not contain deploy commands.');
for (const f of [MODULE, SMOKE, CHECKER_SELF]) {
  const body = read(f);
  assert(!/sk-[A-Za-z0-9]{20,}/.test(body) && !/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(body), `secret-scan: ${f} must contain no secret-format value.`);
}

// --- 17. package.json scripts + docs ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf3a"') && pkg.includes('"check:phase-3gg-t-hf3a"'), 'package.json must define the HF3A scripts.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['pending', 'active', 'guard', 'not deployed', 'stale']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}
assert(read(CHANGELOG).includes('Phase 3GG-T-HF3A'), 'changelog must contain the Phase 3GG-T-HF3A entry.');

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF3A contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
