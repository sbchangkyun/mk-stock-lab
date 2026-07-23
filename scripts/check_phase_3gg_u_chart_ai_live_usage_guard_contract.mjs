/**
 * Phase 3GG-U static contract checker (read-only).
 *
 * Verifies the live Chart AI daily usage guard: the additive public PostgREST bridge migration
 * (consume_chart_ai_usage_v1 / refund_chart_ai_usage_v1, service_role only), the server usage module
 * (fail-closed, no `.schema('internal')`), the Similarity + MK Analysis route integration order (auth ->
 * access -> instrument -> usage reservation -> cache/provider/engine -> refund-on-failure -> usage in
 * response), the deprecated analyze.ts placeholder (no independent usage consumption), the client usage
 * notice UX (shared state, exact Korean copy, button-disable on exhaustion), and out-of-scope immutability
 * (KIS token store/migrations, instrument master, similarity scoring formula, no account/order/balance
 * endpoint). Baseline = the branch point ae24dac (PR #1 merge into main).
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const BASELINE = 'ae24dac';

const MIGRATION = 'supabase/migrations/20260723_chart_ai_live_usage_guard.sql';
const USAGE_MODULE = 'src/lib/server/chartAiUsage.ts';
const SIM_ROUTE = 'src/pages/api/chart-ai/similarity.json.ts';
const MK_ROUTE = 'src/pages/api/chart-ai/mk-analysis.json.ts';
const ANALYZE_ROUTE = 'src/pages/api/chart-ai/analyze.ts';
const PAGE = 'src/pages/chart-ai.astro';
const USAGE_TESTSRC = 'scripts/chart_ai_usage_testsrc.ts';
const USAGE_SMOKE = 'scripts/smoke_phase_3gg_u_chart_ai_usage.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_u_chart_ai_live_usage_guard_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_u_chart_ai_live_usage_guard_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const REQUIRED_FILES = [
  MIGRATION, USAGE_MODULE, SIM_ROUTE, MK_ROUTE, ANALYZE_ROUTE, PAGE,
  USAGE_TESTSRC, USAGE_SMOKE, CHECKER_SELF, RESULT_DOC,
];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => { try { return execFileSync('git', args, { encoding: 'utf8' }); } catch { return ''; } };

for (const f of REQUIRED_FILES) assert(existsSync(f), `Required file missing: ${f}`);

const migrationSrc = read(MIGRATION);
const usageSrc = read(USAGE_MODULE);
const simSrc = read(SIM_ROUTE);
const mkSrc = read(MK_ROUTE);
const analyzeSrc = read(ANALYZE_ROUTE);
const page = read(PAGE);

// --- 1. Migration: additive public bridge, service_role only, no internal exposure, no new admin RPC ---
assert(/create or replace function public\.consume_chart_ai_usage_v1\(/.test(migrationSrc), 'migration must define public.consume_chart_ai_usage_v1.');
assert(/create or replace function public\.refund_chart_ai_usage_v1\(/.test(migrationSrc), 'migration must define public.refund_chart_ai_usage_v1.');
// HF1 policy pinning: the consume bridge must be self-contained (NOT delegating to the internal function,
// which stores free_limit = greatest(stored, incoming) and would let a historically higher stored limit
// authorize). It must pin free_limit to the server-provided p_free_limit and gate the increment on the
// same policy value, so the current approved daily limit always wins.
assert(!/from internal\.consume_chart_ai_usage\(/.test(migrationSrc), 'consume bridge must NOT delegate to internal.consume_chart_ai_usage (that path does not pin the policy limit).');
assert(/insert into public\.ai_usage_daily/.test(migrationSrc) && /on conflict on constraint ai_usage_daily_user_id_usage_date_kst_key do update/.test(migrationSrc), 'consume bridge must run its own atomic upsert on public.ai_usage_daily.');
assert(/set used_count = target_usage\.used_count \+ 1,\s*\n\s*free_limit = p_free_limit,/.test(migrationSrc), 'consume bridge must pin free_limit to the server-provided p_free_limit on write (never greatest()).');
const migrationCode = migrationSrc.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
assert(!/free_limit = greatest\(/.test(migrationCode), 'consume bridge must not store free_limit = greatest(...) (a historically higher stored limit must never authorize).');
assert(/where target_usage\.used_count < p_free_limit/.test(migrationSrc), 'consume bridge must gate the increment on the server policy limit (used_count < p_free_limit), not the stored free_limit.');
assert(/select\s*\n\s*false::boolean as out_allowed,[\s\S]{0,240}?p_free_limit as out_free_limit,/.test(migrationSrc), 'the rejected branch must report the pinned policy limit, not the historically stored free_limit.');
for (const fn of ['public.consume_chart_ai_usage_v1', 'public.refund_chart_ai_usage_v1']) {
  const re = new RegExp(`create or replace function ${fn.replace('.', '\\.')}\\([\\s\\S]{0,400}?security definer\\s*\\nset search_path = ''`);
  assert(re.test(migrationSrc), `${fn} must be security definer with an empty search_path.`);
}
assert(/revoke all on function public\.consume_chart_ai_usage_v1\(uuid, integer\) from public, anon, authenticated;/.test(migrationSrc), 'consume RPC must be revoked from public/anon/authenticated.');
assert(/revoke all on function public\.refund_chart_ai_usage_v1\(uuid\) from public, anon, authenticated;/.test(migrationSrc), 'refund RPC must be revoked from public/anon/authenticated.');
assert(/grant execute on function public\.consume_chart_ai_usage_v1\(uuid, integer\) to service_role;/.test(migrationSrc), 'consume RPC must be granted to service_role.');
assert(/grant execute on function public\.refund_chart_ai_usage_v1\(uuid\) to service_role;/.test(migrationSrc), 'refund RPC must be granted to service_role.');
assert(!/create schema/i.test(migrationSrc), 'migration must not create a new schema (bridge onto the existing internal schema only).');
assert(!/create table/i.test(migrationSrc), 'migration must not create a new table (operates on the existing public.ai_usage_daily table only).');
assert(!/drop |truncate /i.test(migrationSrc), 'migration must be additive only (no drop/truncate).');
assert(!/create or replace function public\.\w*(admin|master|bypass)/i.test(migrationSrc), 'migration must not add an admin/master-bypass RPC.');

// --- 2. Usage module: public-bridge RPC only, fail-closed, testable via injectable client ---
const usageSrcCode = usageSrc
  .split('\n')
  .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
  .join('\n');
assert(/getSupabaseAdminClient/.test(usageSrc) && !/\.schema\(['"]internal['"]\)/.test(usageSrcCode), 'usage module must never use .schema(\'internal\') (PostgREST does not expose it) in actual code (mentioning the anti-pattern in a comment is fine).');
assert(/rpc\('consume_chart_ai_usage_v1'/.test(usageSrc), 'consumeChartAiUsage must call the public consume_chart_ai_usage_v1 bridge RPC.');
assert(/rpc\('refund_chart_ai_usage_v1'/.test(usageSrc), 'refundChartAiUsage must call the public refund_chart_ai_usage_v1 bridge RPC.');
assert(/export const defaultFreeLimit = 3;/.test(usageSrc), 'the single authoritative free daily limit must be 3.');
assert(/reason: 'allowed' \| 'limit_reached' \| 'usage_guard_unavailable'/.test(usageSrc), 'ChartAiUsageState.reason must be the three documented values.');
assert(/getClient: \(\) => ChartAiUsageRpcClient = \(\) => getSupabaseAdminClient\(\) as unknown as ChartAiUsageRpcClient/.test(usageSrc), 'both functions must default to the real admin client via an injectable factory (mirrors kisTokenStore.ts).');
assert((usageSrc.match(/isConfigured: \(\) => boolean = isSupabaseServerConfigured/g) || []).length === 2, 'both consume and refund must accept an injectable isConfigured (defaulting to the real env check) so offline tests can exercise the RPC-call path.');
assert(/catch \{\s*return \{ \.\.\.unavailableState \};?\s*\}/.test(usageSrc.replace(/\s+/g, ' ')) || /catch\s*\{\s*return\s*\{\s*\.\.\.unavailableState\s*\};/.test(usageSrc), 'consumeChartAiUsage must never throw (catches and fails closed).');
assert(/export const refundChartAiUsage[\s\S]*?catch \{\s*return null;\s*\}/.test(usageSrc), 'refundChartAiUsage must never throw (catches and returns null).');

// --- 3. Similarity + MK Analysis routes: integration order + fail-closed usage guard ---
for (const [name, src] of [['similarity.json.ts', simSrc], ['mk-analysis.json.ts', mkSrc]]) {
  assert(/import \{ consumeChartAiUsage, refundChartAiUsage, type ChartAiUsageState \} from '\.\.\/\.\.\/\.\.\/lib\/server\/chartAiUsage';/.test(src), `${name} must import the shared usage module.`);
  assert(/let authenticatedUserId: string \| null = null;/.test(src), `${name} must resolve the authenticated user id before any usage/provider work.`);
  // Auth resolution must precede the usage reservation, which must precede the cache lookup.
  const authIdx = src.indexOf('authenticatedUserId = auth.user.id;');
  const findIdx = src.indexOf('findUniversalInstrument(');
  const usageIdx = src.indexOf('consumeChartAiUsage(authenticatedUserId)');
  const cacheIdx = src.indexOf('resultCache.get(cacheKey)');
  assert(authIdx > -1 && findIdx > authIdx, `${name} must resolve the instrument only after authentication.`);
  assert(usageIdx > -1 && usageIdx > findIdx, `${name} must reserve usage only after instrument validation.`);
  assert(cacheIdx > -1 && cacheIdx > usageIdx, `${name} must check the result cache only after reserving usage (a cache hit counts as one execution).`);
  assert(/if \(!localOwnerAllowed && authenticatedUserId\) \{/.test(src), `${name} must skip the reservation entirely for the local owner opt-in path.`);
  assert(/code: 'CHART_AI_USAGE_GUARD_UNAVAILABLE'/.test(src) && /503,?\s*\)/.test(src), `${name} must return 503 CHART_AI_USAGE_GUARD_UNAVAILABLE when the guard is unavailable.`);
  assert(/code: 'CHART_AI_DAILY_LIMIT_REACHED'/.test(src) && /429,?\s*\)/.test(src), `${name} must return 429 CHART_AI_DAILY_LIMIT_REACHED when the daily limit is reached.`);
  assert(/분석 사용량을 확인하지 못했습니다\. 잠시 후 다시 시도해 주세요\./.test(src), `${name} must use the exact guard-unavailable Korean message.`);
  assert(/오늘 사용 가능한 분석 횟수를 모두 사용했습니다\. 자정 이후 다시 이용해 주세요\./.test(src), `${name} must use the exact limit-reached Korean message.`);
  assert(/const refundReservedUsage = async \(\): Promise<ChartAiUsageState \| null> => \{/.test(src), `${name} must define a single refund helper.`);
  assert((src.match(/refundReservedUsage\(\)/g) || []).length >= 3, `${name} must call the refund helper from every failure branch (history/analysis/catch).`);
  assert(/\.\.\.\(usageState \? \{ usage: usageState \} : \{\}\)/.test(src), `${name} must spread the usage state into successful responses.`);
  assert(!/isCurrentUserSiteAdmin\(/.test(src), `${name} must not call the client-only admin check as a server-side usage bypass.`);
  assert(/Admin\/master bypass: none\./.test(src), `${name} must document the admin/master bypass decision at the point it applies.`);
  assert(!/inquire-balance|order-cash|\/trading\//i.test(src), `${name} must not add account/order/trading scope.`);
}

// --- 4. analyze.ts: deprecated placeholder, no independent usage consumption ---
assert(!/consumeChartAiUsage\(/.test(analyzeSrc), 'analyze.ts must not call consumeChartAiUsage (would double-consume the shared quota if re-wired).');
assert(/deprecated placeholder route/.test(analyzeSrc), 'analyze.ts must document why it no longer reserves usage.');
assert(/validateUserFromBearerToken/.test(analyzeSrc), 'analyze.ts must stay fail-closed on auth even as a deprecated placeholder.');

// --- 5. chart-ai.astro: shared usage notice + exact copy + button gating ---
assert(/id="chartAiUsageNotice"/.test(page) && /role="status"/.test(page) && /aria-live="polite"/.test(page), 'a shared aria-live usage notice element must exist.');
assert(/\{chartAiRealExperienceRuntime && \(/.test(page.slice(page.indexOf('chartAiUsageNotice') - 200, page.indexOf('chartAiUsageNotice'))), 'the usage notice must be gated on the real-experience runtime flag.');
for (const copy of [
  '유사 패턴과 MK AI 분석은 합산 하루 3회 제공됩니다.',
  '분석 사용량을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  '오늘 사용 가능한 분석 횟수를 모두 사용했습니다. 자정 이후 다시 이용해 주세요.',
]) {
  assert(page.includes(copy), `page must contain the exact required usage-notice copy: ${copy}`);
}
assert(/오늘 남은 분석 횟수: \$\{chartAiUsageDisplayState\.remaining\}\/\$\{chartAiUsageDisplayState\.limit\}/.test(page), 'the "remaining/limit" notice text must be built from server-reported usage state only.');
assert(/let chartAiUsageDisplayState: ChartAiUsageDisplayState \| null = null;/.test(page), 'usage display state must be a single shared variable (not per-panel).');
assert(/const applyChartAiUsageState = \(usage: any\) => \{/.test(page), 'applyChartAiUsageState must exist.');
assert(/const usageBlocked = chartAiUsageDisplayState\?\.exhausted === true;/.test(page) && /const enabled = instrumentReady && !usageBlocked;/.test(page), 'updateAnalysisAvailability must disable both start buttons on usage exhaustion without overriding the per-panel instrument guide text.');
for (const fn of ['runSimilarity', 'runMkai']) {
  const body = page.slice(page.indexOf(`const ${fn} = async`), page.indexOf(`const ${fn} = async`) + 6000);
  assert(/res\.status === 429 && data && data\.code === 'CHART_AI_DAILY_LIMIT_REACHED'/.test(body), `${fn} must handle the top-level 429 before reading the nested analytical payload.`);
  assert(/res\.status === 503 && data && data\.code === 'CHART_AI_USAGE_GUARD_UNAVAILABLE'/.test(body), `${fn} must handle the top-level 503 before reading the nested analytical payload.`);
  assert(/if \(data && data\.usage\) applyChartAiUsageState\(data\.usage\);/.test(body), `${fn} must apply any returned usage state (including on cached/blocked responses).`);
}
assert(!/localStorage[^\n]*usage/i.test(page.replace(/localStorage\.(getItem|setItem)\('chartAi(Selected|Watch)/g, '')), 'no localStorage may act as usage-count authority.');

// --- 6. Out-of-scope immutability (usage-guard phase only) ---
const FROZEN = [
  'src/lib/server/providers/kis',
  'src/lib/server/chart-ai/similarity-engine.mjs',
  'src/lib/server/chart-ai/mkAiAnalysis',
  'src/data/chart-ai/universalInstrumentMaster.json',
  'src/data/chart-ai/universalInstrumentMaster.manifest.json',
  'supabase/migrations/20260615_rebuild_schema_v0_1.sql',
  'supabase/migrations/20260621_rebuild_schema_v0_1_hardening.sql',
  'supabase/migrations/20260625_rebuild_schema_v0_1_hf1.sql',
  'supabase/migrations/20260713_kis_token_lifecycle.sql',
  'supabase/migrations/20260714_kis_token_postgrest_rpc_bridge.sql',
  '.github/workflows/kis-instrument-master-refresh.yml',
  'package-lock.json',
];
for (const f of FROZEN) {
  assert(runGit(['diff', '--name-only', BASELINE, '--', f]).trim() === '', `out-of-scope path must be unchanged: ${f}`);
}
const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');

// --- 7. No secret / no forbidden endpoint scope ---
for (const src of [migrationSrc, usageSrc, simSrc, mkSrc, analyzeSrc, page]) {
  for (const pat of [/sk-[A-Za-z0-9]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/]) {
    assert(!pat.test(src), `secret-scan violation: ${pat}`);
  }
}
for (const pat of [/inquire-balance/i, /order-cash/i, /\/trading\//i, /\/api\/(order|account|balance|funds)\b/i]) {
  assert(!pat.test(page), `no account/order/balance/trading scope may be added: ${pat}`);
}

// --- 8. package.json scripts + changelog + result doc ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-u-chart-ai-usage"') || pkg.includes('"check:phase-3gg-u-chart-ai-live-usage-guard"'), 'package.json must define this phase\'s smoke/check scripts.');
assert(read(CHANGELOG).includes('Phase 3GG-U'), 'changelog must contain the Phase 3GG-U entry.');
const doc = read(RESULT_DOC).toLowerCase();
for (const t of ['usage guard', 'consume_chart_ai_usage_v1', 'refund_chart_ai_usage_v1', 'daily', 'kst', 'admin']) {
  assert(doc.includes(t), `result doc missing token: ${t}`);
}

// --- 9. Working-tree purity ---
// This phase touches the two guarded routes, the shared usage module, the deprecated analyze.ts
// placeholder, the client page, its own migration/tests/docs, and reconciles four sibling checkers whose
// working-tree-purity assertions would otherwise flag this phase's own new/changed files (the established
// tolerance-extension pattern used by every prior phase that touched shared files).
const RECONCILED_SIBLINGS = [
  'scripts/check_phase_3gg_t_hf1_contract.mjs',
  'scripts/check_phase_3gg_t_hf3b_hf2_hf2b_similarity_explainability_contract.mjs',
  'scripts/check_phase_3gg_r_fast_contract.mjs',
  'scripts/check_phase_3gg_t_hf3b_hf2_hf2b_hf1_preview_kis_guard_contract.mjs',
];
const ALLOWED = new Set([
  ...REQUIRED_FILES,
  CHANGELOG,
  PACKAGE_JSON,
  ...RECONCILED_SIBLINGS,
]);
const KNOWN_PREFIXES = ['.agents/', '.claude/', '.vscode/', 'docs/handoff/', 'skills-lock.json'];
const tolerated = (f) => ALLOWED.has(f) || KNOWN_PREFIXES.some((p) => f === p || f.startsWith(p)) || f === '.gitignore';
let porcelain = [];
try { porcelain = runGit(['status', '--porcelain']).split('\n').map((l) => l.slice(3).trim()).filter(Boolean); } catch { porcelain = []; }
const unexpected = porcelain.filter((f) => !tolerated(f));
assert(unexpected.length === 0, `Unexpected working-tree change outside this phase's scope: ${unexpected.join(', ')}`);

if (failures === 0) {
  console.log(`PASS: Phase 3GG-U contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
