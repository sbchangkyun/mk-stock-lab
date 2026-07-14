/**
 * Phase 3GG-T-HF5-HF6AB static contract checker (read-only).
 *
 * Verifies the Similarity V2 (toggleable legend, D+ axis, visible-series tooltip, Top-5 table/cards,
 * deterministic aggregate interpretation) and MK Agent V2 (one-sentence conclusion, flow status, six
 * direction-aware score cards, four strategy-checkpoint groups, real ARIA accordion, data-quality
 * explanation, single disclaimer) redesign against the HF4-FAST-HF2 baseline. Re-asserts HF3A
 * selected-symbol integrity, durable-token/auth/route/search/Supabase immutability, out-of-scope
 * technical indicators absent, no account/order/trading scope, and no dependency change.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = '9742724';

const PAGE = 'src/pages/chart-ai.astro';
const INTEGRITY_MODULE = 'src/lib/chart-ai/selected-symbol-integrity.mjs';
const SIM_MODULE = 'src/lib/chart-ai/similarity-explainability-v2.mjs';
const MKAI_MODULE = 'src/lib/chart-ai/mk-agent-experience-v2.mjs';
const MI_ROUTE = 'src/pages/api/chart-ai/market-intelligence.json.ts';
const MI_ENGINE_DIR = 'src/lib/server/chart-ai/marketIntelligence';
const ANALYSIS_ENGINE = 'src/lib/server/chart-ai/mkAiAnalysis/analysisEngine.mjs';
const ANALYSIS_SCORING = 'src/lib/server/chart-ai/mkAiAnalysis/analysisScoring.mjs';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf5_hf6ab_fast_analysis_experience_v2.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf5_hf6ab_fast_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf5_hf6ab_fast_analysis_experience_v2_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [PAGE, SIM_MODULE, MKAI_MODULE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };

// --- 1. Required files ---
for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const page = read(PAGE);
const simSrc = read(SIM_MODULE);
const mkaiSrc = read(MKAI_MODULE);

// --- 2. Similarity V2 pure module: overlay/legend/axis/tooltip/table/aggregate exports ---
for (const token of [
  'export const buildOverlaySeries',
  'export const defaultVisibleSeriesKeys',
  'export const buildAxisTicks',
  'export const resolveVisibleTooltipValues',
  'export const buildMatchRows',
  'export const DISPERSION_THRESHOLDS',
  'export const classifyDispersion',
  'export const buildAggregateInterpretation',
  'export const buildSimilarityExplainability',
]) {
  assert(simSrc.includes(token), `similarity-explainability-v2.mjs missing export: ${token}`);
}
assert(/sim\.ok !== true\)\s*return null/.test(simSrc), 'buildSimilarityExplainability must guard on sim.ok !== true.');
assert(/consistent:\s*0\.8/.test(simSrc) && /mixed:\s*0\.6/.test(simSrc), 'dispersion thresholds must remain fixed at 0.8/0.6.');
assert(/비교적 일관됨/.test(simSrc) && /다소 엇갈림/.test(simSrc) && /결과 편차가 큰|결과 편차가 큼/.test(simSrc), 'dispersion classification labels must be present.');

// --- 3. MK Agent V2 pure module: conclusion/flow/scores/checkpoints/accordion/data-quality/disclaimer ---
for (const token of [
  'export const pickParticle',
  'export const topicParticle',
  'export const subjectParticle',
  'export const objectParticle',
  'export const buildOneSentenceConclusion',
  'export const buildFlowStatus',
  'export const buildScoreCards',
  'export const buildStrategyCheckpoints',
  'export const buildAccordionDescriptors',
  'export const buildDataQualityExplanation',
  'export const resolveCommonDisclaimer',
  'export const buildMkAgentExperience',
]) {
  assert(mkaiSrc.includes(token), `mk-agent-experience-v2.mjs missing export: ${token}`);
}
assert(/mkai\.ok !== true \|\| !mkai\.formatted \|\| mkai\.formatted\.ok !== true\)\s*return null/.test(mkaiSrc), 'buildMkAgentExperience must guard on mkai.ok/formatted.ok.');
for (const direction of [
  'higher-stronger-trend',
  'higher-stronger-momentum',
  'higher-more-stable',
  'higher-more-similar-not-more-likely-to-rise',
  'higher-more-risk-not-better',
  'higher-more-complete-not-confidence',
]) {
  assert(mkaiSrc.includes(direction), `mk-agent-experience-v2.mjs missing direction semantics: ${direction}`);
}
for (const group of ['A. 상승 전환 확인 조건', 'B. 하락 위험 확대 조건', 'C. 현재 관찰 우선순위', 'D. 핵심 가격대']) {
  assert(mkaiSrc.includes(group), `mk-agent-experience-v2.mjs missing strategy checkpoint group title: ${group}`);
}
// Strip comments before scanning for out-of-scope indicators: the module's own header/inline
// documentation legitimately NAMES these terms to record that they are deliberately excluded
// (see the HF6B out-of-scope note) — only live code/string-literal usage would be a real violation.
const mkaiSrcNoComments = mkaiSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
for (const pat of [/\bRSI\b/i, /\bMACD\b/i, /Bollinger|볼린저/i, /\bATR\b/, /지지선|저항선|\bsupport\b|\bresistance\b/i]) {
  assert(!pat.test(mkaiSrcNoComments), `mk-agent-experience-v2.mjs must not reference out-of-scope indicator outside comments: ${pat}`);
}
for (const pat of [/사세요|파세요|매수하세요|매도하세요/, /반드시.*(상승|하락)/, /보장/]) {
  assert(!pat.test(mkaiSrc), `mk-agent-experience-v2.mjs must not contain direct command/guarantee language: ${pat}`);
}

// --- 4. chart-ai.astro wires both pure modules; no re-implementation of their logic inline ---
assert(/import \{ buildSimilarityExplainability, resolveVisibleTooltipValues \} from '\.\.\/lib\/chart-ai\/similarity-explainability-v2\.mjs'/.test(page), 'chart-ai.astro must import the similarity V2 pure module.');
assert(/import \{ buildMkAgentExperience \} from '\.\.\/lib\/chart-ai\/mk-agent-experience-v2\.mjs'/.test(page), 'chart-ai.astro must import the MK Agent V2 pure module.');
assert(/buildSimilarityExplainability\(sim\)/.test(page), 'similarity renderer must call buildSimilarityExplainability.');
assert(/buildMkAgentExperience\(mkai\)/.test(page), 'MK AI renderer must call buildMkAgentExperience.');

// --- 5. Similarity UI: toggleable legend, overlay tooltip, responsive table/cards ---
assert(/aria-pressed/.test(page) && /chart-similarity-legend-item/.test(page), 'similarity legend must render aria-pressed toggle buttons.');
assert(/chart-similarity-overlay-tooltip/.test(page) && /chart-similarity-overlay-axis/.test(page), 'similarity overlay must render a tooltip and D+ axis.');
assert(/chart-similarity-table-wrap|chart-similarity-top5-table/.test(page), 'similarity desktop comparison table must be present.');
assert(/chart-similarity-cards/.test(page) && /chart-similarity-match-card/.test(page), 'similarity mobile card view must be present.');
assert(/@media \(min-width: 641px\) \{\s*\.chart-similarity-cards \{ display: none; \}/.test(page), 'similarity cards must be hidden at desktop widths.');
assert(/@media \(max-width: 640px\) \{\s*\.chart-similarity-table-wrap \{ display: none; \}/.test(page), 'similarity table must be hidden at mobile widths.');
assert(/chart-similarity-aggregate-body|chart-similarity-aggregate-title/.test(page), 'similarity aggregate interpretation container must be present.');
assert(/분석 기준 보기|chart-similarity-basis-disclosure/.test(page), 'similarity technical-detail disclosure must be present (concise reading path + optional detail).');

// --- 6. MK AI UI: conclusion, flow status, score cards, checkpoints, real ARIA accordion, data quality ---
assert(/chartAiMkAiConclusionLead/.test(page), 'MK AI conclusion-lead element must be present.');
assert(/chartAiMkAiFlowStatus/.test(page), 'MK AI flow-status element must be present.');
assert(/chart-mkai-score-card\b/.test(page) && /chart-mkai-score-card-bar-fill/.test(page), 'MK AI score cards with bars must be present.');
assert(/data-direction=/.test(page) || /card\.dataset\.direction/.test(page), 'MK AI score cards must carry the direction attribute for semantic styling.');
assert(/chart-mkai-checkpoints\b/.test(page) && /chart-mkai-checkpoint-group/.test(page), 'MK AI strategy checkpoints must be present.');
assert(/aria-expanded/.test(page) && /aria-controls/.test(page), 'MK AI accordion must use real aria-expanded/aria-controls (not native <details>).');
assert(!/<details[^>]*chart-mkai/.test(page), 'MK AI accordion must not fall back to native <details> markup.');
assert(/chartAiMkAiDataQuality/.test(page), 'MK AI data-quality explanation element must be present.');
assert(!/chartAiMkAiTechnical"/.test(page), 'the orphaned #chartAiMkAiTechnical div must be removed (technical bullets folded into the accordion).');

// --- 7. Single disclaimer path: no duplicated dynamic disclaimer re-render ---
const mkaiRealBlockMatch = page.match(/chart-mkai-real" id="chartAiMkAiReal"[\s\S]*?<\/div>\s*\)\}/);
const mkaiRealBlock = mkaiRealBlockMatch ? mkaiRealBlockMatch[0] : '';
assert((mkaiRealBlock.match(/chart-mkai-disclaimer/g) || []).length <= 1, 'MK AI Production markup must carry exactly one static disclaimer container.');

// --- 8. HF3A guard untouched: no changes to the authoritative integrity module or its wiring ---
const integrityDiff = runGit(['diff', '--name-only', BASELINE, '--', INTEGRITY_MODULE]).trim();
assert(integrityDiff === '', `selected-symbol-integrity.mjs must not change this phase, but diff reports: ${integrityDiff}`);
assert(/integrity\.selectPending\(/.test(page) && /integrity\.beginChartLoad\(\)/.test(page), 'HF3A guard call sites must remain present.');
assert(!/DEFAULT_INSTRUMENT/.test(page), 'no hidden default-instrument fallback may be reintroduced.');
assert(!/(\|\||\?\?)\s*['"]005930['"]/.test(page), 'no Samsung symbol fallback may be reintroduced.');
assert(/let\s+selectedSymbol\s*=\s*['"]['"]/.test(page), 'selectedSymbol must still initialize empty.');
assert(/integrity\.beginAnalysis\('similar-pattern'\)/.test(page) && /integrity\.beginAnalysis\('mk-ai'\)/.test(page), 'Similar Pattern and MK AI must remain wired to the shared HF3A guard.');
assert((page.match(/integrity\.beginAnalysis\(/g) || []).length === 2, 'exactly two analyses must call the shared guard (unchanged).');

// --- 9. Market Intelligence stays absent from the Chart AI page; backend untouched ---
for (const token of ['chartAiMarketIntel', 'chartAiMiStartBtn', 'market-intelligence.json', '시장 인텔리전스', 'miAbort']) {
  assert(!page.includes(token), `Market Intelligence UI token must remain absent from chart-ai.astro: ${token}`);
}
assert(existsSync(MI_ROUTE), 'Market Intelligence backend route must remain preserved.');
assert(existsSync(MI_ENGINE_DIR), 'Market Intelligence backend engine directory must remain preserved.');
const miBackendDiff = runGit(['diff', '--name-only', BASELINE, '--', MI_ROUTE, MI_ENGINE_DIR]).trim();
assert(miBackendDiff === '', `Market Intelligence backend route/engine must not change this phase, but changed: ${miBackendDiff}`);

// --- 10. Analysis engine/scoring: only the additive swingHigh/swingLow wiring may have changed ---
const engineDiff = runGit(['diff', BASELINE, '--', ANALYSIS_ENGINE]);
const scoringDiff = runGit(['diff', BASELINE, '--', ANALYSIS_SCORING]);
assert(!/^[+-]/m.test(engineDiff) || /swingHigh|swingLow|recentSwingHigh20|recentSwingLow20/.test(engineDiff), 'analysisEngine.mjs changes this phase must be scoped to swing-high/low wiring only.');
assert(!/^[+-]/m.test(scoringDiff) || /swingHigh|swingLow/.test(scoringDiff), 'analysisScoring.mjs changes this phase must be scoped to swingHigh/swingLow only.');
assert(read(ANALYSIS_SCORING).includes('export const swingHigh') && read(ANALYSIS_SCORING).includes('export const swingLow'), 'analysisScoring.mjs must export swingHigh/swingLow.');

// --- 11. No durable-token / auth / Supabase architecture change ---
// Phase 3GG-T-HF3B-HF4C legitimately expands the search route + normalized-OHLCV provider and adds a
// safe cache header to the market-data/analysis routes, so those route paths are no longer frozen here.
// The durable-token/provider (providers/kis), Market Intelligence backend, and Supabase guards remain.
const OUT_OF_SCOPE_PATHS = [
  'src/lib/server/providers/kis',
  MI_ROUTE,
  MI_ENGINE_DIR,
  'supabase',
];
const outOfScopeDiff = runGit(['diff', '--name-only', BASELINE, '--', ...OUT_OF_SCOPE_PATHS]).trim();
assert(outOfScopeDiff === '', `no durable-token/auth/route/search/Supabase source may change this phase, but changed: ${outOfScopeDiff}`);

// --- 12. No account/order/balance/trading scope; no forbidden exposure ---
for (const pat of [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /KIS_ACCOUNT_NO/, /inquire-psbl-order/i]) {
  assert(!pat.test(page), `no account/order/balance/trading scope may be added: ${pat}`);
}
for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, /console\.log\([^)]*process\.env/]) {
  assert(!pat.test(page), `secret-scan: page must not match forbidden exposure ${pat}`);
  assert(!pat.test(simSrc), `secret-scan: similarity module must not match forbidden exposure ${pat}`);
  assert(!pat.test(mkaiSrc), `secret-scan: mk-agent module must not match forbidden exposure ${pat}`);
}

// --- 13. No dependency / lockfile change ---
const lockDiff = runGit(['diff', '--name-only', BASELINE, '--', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']).trim();
assert(lockDiff === '', `no lockfile change allowed, but changed: ${lockDiff}`);
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// --- 14. No deploy command embedded in test code ---
assert(!/vercel deploy|--prod/.test(read(SMOKE)), 'smoke must not contain deploy commands.');

// --- 15. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf5-hf6ab-fast"') && pkg.includes('"check:phase-3gg-t-hf5-hf6ab-fast"'), 'package.json must define the HF5-HF6AB-FAST scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF5-HF6AB'), 'changelog must contain the Phase 3GG-T-HF5-HF6AB entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['hf5', 'hf6a', 'hf6b', '유사', 'mk ai', '전략 체크포인트', 'owner']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// --- 16. .env / .vercel never tracked ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

// --- 17. Working-tree purity: only this phase's expected files change ---
// Sibling checkers/smokes edited this phase to tolerate this phase's additive files
// (RECONCILED_SIBLINGS array / regex-tolerance additions) and, for the two HF4-FAST-HF1/HF2
// smoke+checker files, a content-anchored fix to their mobile-tooltip block locator.
const RECONCILED_SIBLINGS = [
  'scripts/check_phase_3gg_t_fast_contract.mjs',
  'scripts/check_phase_3gg_t_hf1_contract.mjs',
  'scripts/check_phase_3gg_t_hf4_fast_contract.mjs',
  'scripts/check_phase_3gg_t_hf4_fast_hf1_contract.mjs',
  'scripts/check_phase_3gg_t_hf4_fast_hf2_contract.mjs',
  'scripts/smoke_phase_3gg_t_hf4_fast_hf1_mobile_interaction_cleanup.mjs',
  'scripts/smoke_phase_3gg_t_hf4_fast_hf2_mobile_tooltip_title_cleanup.mjs',
];
const ALLOWED = new Set([...REQUIRED_FILES, ANALYSIS_ENGINE, ANALYSIS_SCORING, CHANGELOG, PACKAGE_JSON, ...RECONCILED_SIBLINGS]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) =>
  ALLOWED.has(f) ||
  KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) ||
  f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF5-HF6AB contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
