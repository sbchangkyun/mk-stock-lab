/**
 * Phase 3GG-T-HF3B-HF2-HF2B static contract checker (read-only).
 *
 * Verifies the Similarity explainability UX redesign: the additive engine candidate-rank/percentile
 * metadata (scoring formula UNCHANGED), the extended pure presentation module (score guide, candidate
 * position, evidence level, deterministic non-advisory insight, tooltip/highlight helpers), the single
 * responsive Top-5 result DOM (no duplicate card collection), the overlay interaction markup (crosshair,
 * D+ marker, structured tooltip, focusable plot), the score-guide + insight containers, and the single
 * authoritative real-experience runtime flag (Production OR protected-Preview opt-in). Re-asserts the
 * out-of-scope immutability (master/manifest/migrations/token/workflow/Supabase) and working-tree purity.
 * Baseline = the HF2A3 verify commit de075f0.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = 'de075f0';

const PAGE = 'src/pages/chart-ai.astro';
const SIM_MODULE = 'src/lib/chart-ai/similarity-explainability-v2.mjs';
const ENGINE = 'src/lib/server/chart-ai/similarity-engine.mjs';
const ROUTE = 'src/pages/api/chart-ai/similarity.json.ts';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf3b_hf2_hf2b_similarity_explainability_ux.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf3b_hf2_hf2b_similarity_explainability_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf3b_hf2_hf2b_similarity_explainability_ux_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [PAGE, SIM_MODULE, ENGINE, ROUTE, SMOKE, CHECKER_SELF, RESULT_DOC];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };
const diffOf = (p) => runGit(['diff', BASELINE, '--', p]);
const changedLines = (p) => diffOf(p).split('\n').filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l));

for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const page = read(PAGE);
const simSrc = read(SIM_MODULE);
const engineSrc = read(ENGINE);
const routeSrc = read(ROUTE);

// --- 1. Engine: additive candidate-rank metadata, scoring formula UNCHANGED ---
assert(/scored\.forEach\(\(entry, index\) => \{ entry\.candidateRank = index \+ 1; \}\);/.test(engineSrc), 'engine must assign raw candidateRank over the sorted candidates before selection.');
assert(/candidateRank: entry\.candidateRank/.test(engineSrc) && /candidateTopPercentile: round2\(\(entry\.candidateRank \/ candidateCount\) \* 100\)/.test(engineSrc), 'engine matches must carry candidateRank + candidateTopPercentile.');
assert(/corrScore \* 0\.45 \+ rmseScore \* 0\.35 \+ directionScore \* 0\.2/.test(engineSrc), 'scoring formula (0.45/0.35/0.20) must be unchanged.');
assert(/SIMILARITY_METHOD_VERSION = 'sim-v1-corr045-rmse035-dir020'/.test(engineSrc), 'similarity method version must be unchanged.');
// The engine diff must NOT touch the scoring weights or method version (additive metadata only).
const engineChanged = changedLines(ENGINE);
assert(!engineChanged.some((l) => /0\.45|0\.35|directionScore \* 0\.2|corrScore|rmseScore|SIMILARITY_METHOD_VERSION|computeSimilarityScore/.test(l)), 'engine change must not alter the scoring formula / method version.');
assert(engineChanged.every((l) => {
  const body = l.replace(/^[+-]\s*/, '');
  if (body === '' || body.startsWith('//') || body.startsWith('*')) return true; // comments / blank lines
  return /candidateRank|candidateTopPercentile/.test(body); // code changes must be candidate-rank metadata only
}), 'engine changes must be scoped to candidate-rank metadata + comments only.');

// --- 2. Route surfaces the sanitized candidate-position scalars (no full candidate array) ---
assert(/candidateRank: typeof m\.candidateRank === 'number'/.test(routeSrc) && /candidateTopPercentile: typeof m\.candidateTopPercentile === 'number'/.test(routeSrc), 'route must surface candidateRank + candidateTopPercentile per match.');
assert(/candidateCount: result\.candidateCount/.test(routeSrc), 'route must keep candidateCount in the response.');
assert(!/scored\b|normalizedPath:.*\.map.*scoreParts.*forwardOutcome/.test(routeSrc.replace(/normalizedPath: m\.normalizedPath[^\n]*/g, '')), 'route must not expose the full scored candidate array.');

// --- 3. Pure module: new exports + fixed bands/thresholds + guard + non-advisory ---
for (const token of [
  'export const classifyScoreBand',
  'export const buildScoreGuide',
  'export const formatTopPercentile',
  'export const buildCandidatePosition',
  'export const buildScoreGap',
  'export const buildOutcomeAgreement',
  'export const buildRiskReward',
  'export const buildEvidenceLevel',
  'export const buildFinalInsight',
  'export const buildSimilarityInsight',
  'export const orderTooltipRowsByHighlight',
  'export const resolveNearestSeriesByPixel',
  'export const SCORE_BANDS',
  'export const EVIDENCE_THRESHOLDS',
  'export const INSIGHT_THRESHOLDS',
  'export const FINAL_INSIGHT',
]) {
  assert(simSrc.includes(token), `similarity module missing export: ${token}`);
}
// Existing V2 exports must remain (HF5 consumers).
for (const token of ['export const buildOverlaySeries', 'export const resolveVisibleTooltipValues', 'export const buildSimilarityExplainability', 'export const classifyDispersion']) {
  assert(simSrc.includes(token), `similarity module must keep the existing export: ${token}`);
}
// Score bands + labels (9.1).
for (const band of ['매우 높은 형태 유사성', '높은 형태 유사성', '보통 수준의 형태 유사성', '낮은 형태 유사성', '매우 낮은 형태 유사성']) {
  assert(simSrc.includes(band), `score-band label missing: ${band}`);
}
assert(/high: \{ minTopScore: 65, maxTopPercentile: 5, minCompleteD20: 4, minAgreement: 0\.8 \}/.test(simSrc), 'HIGH evidence thresholds must match the documented values.');
assert(/moderate: \{ minTopScore: 50, maxTopPercentile: 20, minCompleteD20: 3, minAgreement: 0\.6 \}/.test(simSrc), 'MODERATE evidence thresholds must match the documented values.');
assert(/minScoreGapForDominance: 5/.test(simSrc) && /upsideDominanceRatio: 1\.25/.test(simSrc) && /strongPositiveShare: 0\.8/.test(simSrc) && /conditionalPositiveShare: 0\.6/.test(simSrc), 'insight thresholds must be documented constants.');
for (const cat of ['추가 확인 가치 높음', '조건부 관심', '관망 우선', '패턴 신뢰도 낮음']) {
  assert(simSrc.includes(cat), `final-insight category missing: ${cat}`);
}
assert(/sim\.ok !== true\)\s*return null/.test(simSrc), 'buildSimilarityExplainability must guard on sim.ok !== true.');
assert(/percentile < 0\.1/.test(simSrc) && simSrc.includes('상위 <0.1%'), 'formatTopPercentile must render <0.1% where appropriate.');
// Non-advisory: no affirmative buy/sell/guarantee wording in the module (the NEGATED "보장하지 않습니다"
// disclaimer is intentionally allowed). Strip comments first: the module header legitimately NAMES these
// terms to record that they are deliberately excluded (like the HF5 checker does for the MK module).
const simNoComments = simSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
for (const pat of [/사세요|파세요|매수하세요|매도하세요|매수 추천|매도 추천/, /보장합니다|수익(을|률)?\s*보장|원금\s*보장/, /반드시\s*(상승|하락|오)/, /\bbuy\b|\bsell\b/i]) {
  assert(!pat.test(simNoComments), `module must not contain advisory/guarantee wording: ${pat}`);
}
assert(simSrc.includes('보장하지 않'), 'module must keep the non-guarantee disclaimer wording.');

// --- 4. chart-ai.astro wires the module + single-DOM Top-5 result (no duplicate cards) ---
assert(/import \{ buildSimilarityExplainability, resolveVisibleTooltipValues, orderTooltipRowsByHighlight, resolveNearestSeriesByPixel \} from '\.\.\/lib\/chart-ai\/similarity-explainability-v2\.mjs'/.test(page), 'page must import the extended similarity module (incl. tooltip/nearest helpers).');
assert(/buildSimilarityExplainability\(sim\)/.test(page), 'page must call buildSimilarityExplainability.');
assert(/chart-similarity-result-table\b/.test(page), 'page must render the single semantic result table.');
assert(!/chart-similarity-cards\b/.test(page) && !/chart-similarity-match-card\b/.test(page), 'the duplicate mobile card collection must be removed (single-DOM result).');
assert(/setAttribute\('data-label', label\)/.test(page), 'result cells must carry data-label for the mobile card transform.');
assert(!/simMatches\.append\(tableWrap, cards\)/.test(page), 'the old table+cards dual append must be gone.');
assert((page.match(/renderMatches\(/g) || []).length >= 1 && !/const cards = document\.createElement\('div'\);\s*cards\.className = 'chart-similarity-cards'/.test(page), 'renderMatches must not build a second card collection.');

// --- 5. Overlay interaction markup + structured tooltip + focusable plot ---
assert(/id="chartAiSimilarityOverlaySvg"[^>]*role="application"[^>]*tabindex="0"/.test(page), 'overlay SVG must be a focusable application region.');
assert(/aria-label="현재 구간과 상위 유사 과거 구간[\s\S]{0,200}화살표 키/.test(page), 'overlay aria-label must describe keyboard interaction.');
assert(/id="chartAiSimilarityOverlayDplus"/.test(page), 'D+ marker element must exist.');
assert(/id="chartAiSimilarityOverlaySr"[^>]*aria-live="polite"/.test(page), 'a screen-reader live region must exist.');
assert(/chart-similarity-overlay-crosshair/.test(page), 'crosshair element/class must be rendered.');
for (const cls of ['chart-similarity-overlay-tooltip-header', 'chart-similarity-overlay-tooltip-id', 'chart-similarity-overlay-tooltip-score', 'chart-similarity-overlay-tooltip-value', 'chart-similarity-overlay-tooltip-foot']) {
  assert(page.includes(cls), `structured tooltip class missing: ${cls}`);
}
assert(/오른쪽 값은 시작 100 기준 정규화 지수이며 유사도 점수가 아닙니다/.test(page), 'tooltip must clarify the normalized value is not the similarity score.');
assert(/resolveNearestSeriesByPixel\(seriesClientYCandidates/.test(page), 'nearest-series selection must use pixel-distance candidates.');
assert(/NEAREST_PX = 18/.test(page), 'a documented pixel threshold must be used.');
assert(/case 'ArrowLeft'/.test(page) && /case 'ArrowRight'/.test(page) && /case 'Home'/.test(page) && /case 'End'/.test(page) && /case 'Escape'/.test(page), 'keyboard navigation (arrows/Home/End/Escape) must be implemented.');
assert(/touchLocked/.test(page) && /setPointerCapture/.test(page), 'touch inspection lock must be implemented.');
assert(/overlayVisibleKeys\.size <= 1\) return;/.test(page), 'legend must never allow zero visible series.');
assert(/aria-pressed/.test(page) && /chart-similarity-legend-item/.test(page), 'legend toggle buttons must use aria-pressed.');

// --- 6. Score guide + insight containers + required insight order ---
assert(/id="chartAiSimilarityScoreGuide"/.test(page) && /유사도 점수 이해하기/.test(page), 'score-guide container + title must be present.');
assert(/id="chartAiSimilarityInsight"/.test(page), 'insight container must be present.');
assert(/패턴 비교 근거 수준/.test(page), 'evidence level must be labelled as pattern-comparison basis (not prediction confidence).');
for (const title of ['가장 유사한 과거 구간', '유사도 점수의 의미', '후보 구간 중 상대 위치', '상위 구간 결과 일치도', '관찰된 위험과 상승 여력', '최종 관찰', '유의사항']) {
  assert(page.includes(title), `insight card title missing: ${title}`);
}
// Non-advisory on the page (affirmative wording only; negated disclaimer allowed).
for (const pat of [/사세요|파세요|매수하세요|매도하세요/, /보장합니다|수익(을|률)?\s*보장|원금\s*보장/, /반드시\s*(상승|하락)/]) {
  assert(!pat.test(page), `page must not contain advisory/guarantee wording: ${pat}`);
}

// --- 7. Single authoritative real-experience runtime flag (Preview opt-in) ---
assert(/const isVercelProductionRuntime = readServerEnvValue\('VERCEL_ENV'\) === 'production';/.test(page), 'the base production-runtime signal must remain defined.');
assert(/const isProtectedPreviewBetaOptInRuntime =[\s\S]{0,160}chartAiBetaPreview'\) === '1'/.test(page), 'protected-Preview opt-in runtime signal must be defined.');
assert(/const chartAiRealExperienceRuntime = isVercelProductionRuntime \|\| isProtectedPreviewBetaOptInRuntime;/.test(page), 'the one authoritative real-experience flag must be defined.');
assert(/\{chartAiRealExperienceRuntime \? \(/.test(page), 'the similarity markup must gate on the authoritative real-experience flag.');
assert(/const productionRealChartEnabled = chartAiProdBetaEnabled \|\| chartAiBetaPreviewEnabled;/.test(page), 'the client real-experience flag must include the protected-Preview beta path.');

// --- 8. Out-of-scope immutability (this is a UI/insight phase) ---
const FROZEN = [
  'src/data/chart-ai/universalInstrumentMaster.json',
  'src/data/chart-ai/universalInstrumentMaster.manifest.json',
  'src/data/chart-ai/universalInstrumentMaster.anchors.json',
  'src/data/chart-ai/universalInstrumentMaster.archive.json',
  'src/data/chart-ai/universalInstrumentMaster.refreshState.json',
  'src/lib/chart-ai/selected-symbol-integrity.mjs',
  'src/lib/chart-ai/chart-ai-authenticated-fetch.ts',
  'src/lib/server/providers/kis',
  '.github/workflows/kis-instrument-master-refresh.yml',
  'supabase',
  'package-lock.json',
];
for (const f of FROZEN) {
  assert(runGit(['diff', '--name-only', BASELINE, '--', f]).trim() === '', `out-of-scope path must be unchanged: ${f}`);
}
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// --- 9. No secret / no forbidden scope ---
for (const src of [page, simSrc, engineSrc, routeSrc]) {
  for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/]) {
    assert(!pat.test(src), `secret-scan violation: ${pat}`);
  }
}
for (const pat of [/inquire-balance/i, /order-cash/i, /\/trading\//i]) {
  assert(!pat.test(page), `no account/order/trading scope may be added: ${pat}`);
}

// --- 10. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf3b-hf2-hf2b"') && pkg.includes('"check:phase-3gg-t-hf3b-hf2-hf2b"'), 'package.json must define the HF2B scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF3B-HF2-HF2B'), 'changelog must contain the HF2B entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['candidaterank', 'evidence', 'score', 'insight', 'crosshair', 'preview', 'owner']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// --- 11. Working-tree purity ---
// Sibling checkers narrowly reconciled because HF2B (a) replaces the dual table+card Similarity UI with a
// single-DOM result and extends the module import, and (b) consolidates the real-experience markup gate
// from isVercelProductionRuntime into the authoritative chartAiRealExperienceRuntime flag (identical on
// Production; adds only the protected-Preview opt-in case). Each reconciliation preserves the sibling's
// original security/gating intent.
const RECONCILED_SIBLINGS = [
  'scripts/check_phase_3gg_t_hf5_hf6ab_fast_contract.mjs',
  'scripts/check_phase_3gg_t_hf1_contract.mjs',
  'scripts/smoke_phase_3gg_t_hf1_chart_ai_auth_zero_request_ui_cleanup.mjs',
  'scripts/check_phase_3gg_t_hf4_fast_contract.mjs',
  'scripts/check_phase_3gg_n_fast_contract.mjs',
  // These three froze the Similarity presentation module; HF2B is authorized to extend it.
  'scripts/check_phase_3gg_t_hf3b_hf2_contract.mjs',
  'scripts/check_phase_3gg_t_hf3b_hf2_hf2a2_preview_search_contract.mjs',
  'scripts/check_phase_3gg_t_hf3b_hf4c_fast_contract.mjs',
];
const ALLOWED = new Set([...REQUIRED_FILES, ENGINE, ROUTE, SIM_MODULE, CHANGELOG, PACKAGE_JSON, ...RECONCILED_SIBLINGS]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) => ALLOWED.has(f) || KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) || f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF3B-HF2-HF2B contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
