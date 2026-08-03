/**
 * Static contract check for Phase 3GM — Operations and Admin MVP.
 *
 * Verifies (by source inspection only -- no network, no real Supabase/KIS client) that the new
 * read-only admin operations surface: (1) reuses the existing bearer-auth resolver and site_admins
 * registry rather than inventing a second admin-role system; (2) never exposes a secret/token/key/
 * Authorization header/service-role key/raw user id or email; (3) is GET-only with
 * Cache-Control: no-store; (4) contains no mutation/reset/refresh-token/purge control anywhere; (5)
 * the UI page performs exactly the auth-gate + single-fetch + manual-refresh pattern with no
 * localStorage, no cache-bypass query param, and no short-polling loop; (6) honest Korean
 * unavailable/health copy exists; (7) the npm scripts point at real files.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const TYPES = join(root, 'src', 'lib', 'server', 'adminOperations', 'types.ts');
const AUTH = join(root, 'src', 'lib', 'server', 'adminOperations', 'adminAuthorization.ts');
const USAGE = join(root, 'src', 'lib', 'server', 'adminOperations', 'usageGuardHealth.ts');
const KIS_HEALTH = join(root, 'src', 'lib', 'server', 'adminOperations', 'kisTokenHealth.ts');
const CACHE_HEALTH = join(root, 'src', 'lib', 'server', 'adminOperations', 'quoteCacheHealth.ts');
const AGGREGATOR = join(root, 'src', 'lib', 'server', 'adminOperations', 'operationsAggregator.ts');
const ROUTE = join(root, 'src', 'pages', 'api', 'admin', 'operations', 'overview.json.ts');
const UI_PAGE = join(root, 'src', 'pages', 'admin', 'operations.astro');
const KIS_CLIENT = join(root, 'src', 'lib', 'server', 'providers', 'kisClient.ts');
const QUOTE_CACHE = join(root, 'src', 'lib', 'server', 'marketData', 'quoteCache.ts');
const OHLCV_CACHE = join(root, 'src', 'lib', 'server', 'chart-ai', 'normalizedOhlcvCache.mjs');
const OHLCV_PROVIDER = join(root, 'src', 'lib', 'server', 'chart-ai', 'universalOhlcvProvider.ts');
const PACKAGE_JSON = join(root, 'package.json');
const ADMIN_MIGRATION = join(root, 'supabase', 'migrations', '20260625_site_admins_and_settings.sql');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++;
  else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

log('=== Phase 3GM Operations and Admin MVP Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');
for (const [name, path] of [
  ['adminOperations/types.ts', TYPES],
  ['adminOperations/adminAuthorization.ts', AUTH],
  ['adminOperations/usageGuardHealth.ts', USAGE],
  ['adminOperations/kisTokenHealth.ts', KIS_HEALTH],
  ['adminOperations/quoteCacheHealth.ts', CACHE_HEALTH],
  ['adminOperations/operationsAggregator.ts', AGGREGATOR],
  ['api/admin/operations/overview.json.ts route', ROUTE],
  ['admin/operations.astro UI page', UI_PAGE],
  ['pre-existing site_admins migration (not re-created)', ADMIN_MIGRATION],
]) {
  check(`${name} exists`, existsSync(path));
}

const auth = readOr(AUTH);
const usage = readOr(USAGE);
const kisHealth = readOr(KIS_HEALTH);
const cacheHealth = readOr(CACHE_HEALTH);
const aggregator = readOr(AGGREGATOR);
const route = readOr(ROUTE);
const ui = readOr(UI_PAGE);
const kisClient = readOr(KIS_CLIENT);
const quoteCache = readOr(QUOTE_CACHE);
const ohlcvCache = readOr(OHLCV_CACHE);
const ohlcvProvider = readOr(OHLCV_PROVIDER);
const packageJson = readOr(PACKAGE_JSON);

// ---------------------------------------------------------------------------
// Group 2: Authorization reuses the existing resolver/registry, no second admin system
// ---------------------------------------------------------------------------
log('--- Group 2: Authorization boundary ---');
check('adminAuthorization imports validateUserFromBearerToken (reused resolver)', /validateUserFromBearerToken/.test(auth));
check('adminAuthorization reads public.site_admins (reused registry, no new table)', /site_admins/.test(auth));
check('adminAuthorization does not reference a new/second admin-role table name', !/admin_roles|adminRoles|is_admin_v2|admin_users/i.test(auth));
check('adminAuthorization has no INSERT/UPDATE/DELETE against site_admins (read-only)', !/\.insert\(|\.update\(|\.delete\(/.test(auth));
check(
  'adminAuthorization returns the same sanitized code for non-admin and admin-check-failure (single shared return path, not two divergent codes)',
  /ADMIN_REQUIRED/.test(auth) && !/ADMIN_CHECK_FAILED|ADMIN_LOOKUP_ERROR/.test(auth),
);
check('route calls authorizeAdminOperationsRequest before any operational read', (() => {
  const authIdx = route.indexOf('authorizeAdminOperationsRequest(');
  const overviewIdx = route.indexOf('getAdminOperationsOverview(');
  return authIdx !== -1 && overviewIdx !== -1 && authIdx < overviewIdx;
})());
check('aggregator module explicitly documents it does not itself check authorization', /does not re-check authorization/i.test(aggregator) || /not re-check authorization/i.test(aggregator));

// ---------------------------------------------------------------------------
// Group 3: No mutation / no secret-management anywhere in the new surface
// ---------------------------------------------------------------------------
log('--- Group 3: Read-only scope, no mutation controls ---');
const newServerFiles = { auth, usage, kisHealth, cacheHealth, aggregator, route };
for (const [name, content] of Object.entries(newServerFiles)) {
  check(`${name}: no cache purge/clear/reset/evict call`, !/clearQuoteCacheForTests\(\)|\.clear\(\)|resetUsage|purgeCache/i.test(content));
  check(`${name}: no token refresh/revoke/invalidate trigger`, !/invalidateGeneration\(|forceRefresh|revokeToken|acquire\(/i.test(content));
  check(`${name}: no trading/order/balance/account endpoint reference`, !/\/order|placeOrder|balance|\baccountNo\b|transfer/i.test(content));
  check(`${name}: no role-editing / flag-editing / env-editing call`, !/setSiteAdmin|updateFlag|setEnv|process\.env\[.*\]\s*=/i.test(content));
}
check('API route exports GET and a catch-all method rejection (ALL), no POST/PUT/PATCH/DELETE handler', /export const GET/.test(route) && /export const ALL/.test(route) && !/export const (POST|PUT|PATCH|DELETE)/.test(route));
check('API route sets Cache-Control: no-store on every response path', (route.match(/no-store/g) || []).length >= 1 && /jsonResponse/.test(route));

// ---------------------------------------------------------------------------
// Group 4: No secret/PII exposure
// ---------------------------------------------------------------------------
log('--- Group 4: No secret/PII exposure ---');
const allNewServerSource = Object.values(newServerFiles).join('\n') + kisClient + quoteCache + ohlcvCache + ohlcvProvider;
check('no accessToken field ever assembled into a returned overview object', !/accessToken:\s*(handle|snapshot|state)/i.test(kisHealth));
check('kisTokenHealth never reads handle.accessToken', !/handle\.accessToken|state\.accessToken/.test(kisHealth));
check('usageGuardHealth never selects an email column', !/select\([^)]*email/i.test(usage) && !/'email'|"email"/.test(usage));
check('adminAuthorization 403/401 payloads never include the raw userId in the message text', !/message:\s*[`'"].*\$\{.*userId/i.test(auth));
check('no source file in the new surface contains a literal "service_role" key value pattern (only identifiers/comments allowed)', !/service_role_key\s*[:=]\s*['"][A-Za-z0-9]/.test(allNewServerSource));
check('no hardcoded Authorization bearer value (only header-name references)', !/Authorization:\s*['"]Bearer [A-Za-z0-9]/.test(allNewServerSource));

// ---------------------------------------------------------------------------
// Group 5: Health-status enum honesty
// ---------------------------------------------------------------------------
log('--- Group 5: Closed health enum ---');
const types = readOr(TYPES);
check("OperationsHealthStatus is the closed union 'healthy' | 'warning' | 'unavailable'", /OperationsHealthStatus\s*=\s*'healthy'\s*\|\s*'warning'\s*\|\s*'unavailable'/.test(types));
check('quoteCacheHealth treats zero entries as unavailable, not an error throw', /entryCount === 0 \? 'unavailable'/.test(cacheHealth));
check('kisTokenHealth treats expired/stale token as warning/unavailable, never silently healthy', /'warning'/.test(kisHealth) && /staleOrExpired/.test(kisHealth));

// ---------------------------------------------------------------------------
// Group 6: Additive reuse of existing caches/token manager, not a redesign
// ---------------------------------------------------------------------------
log('--- Group 6: Additive reuse, no redesign of existing hot paths ---');
check('kisClient.ts: new health snapshot export uses the existing peekL1() inspection accessor (no acquire/getTokenHandle call)', /getKisTokenHealthSnapshot/.test(kisClient) && /peekL1\(\)/.test(kisClient));
check('kisClient.ts: health snapshot function never calls acquire( or getTokenHandle( on the manager', (() => {
  const start = kisClient.indexOf('export const getKisTokenHealthSnapshot');
  if (start === -1) return false;
  const end = kisClient.indexOf('\n};', start);
  const body = kisClient.slice(start, end === -1 ? undefined : end);
  return !/\.acquire\(|\.getTokenHandle\(/.test(body);
})());
check('quoteCache.ts: health snapshot is a pure read (no delete/set call inside it)', (() => {
  const start = quoteCache.indexOf('export const getQuoteCacheHealthSnapshot');
  if (start === -1) return false;
  const end = quoteCache.indexOf('\n};', start);
  const body = quoteCache.slice(start, end === -1 ? undefined : end);
  return !/\.delete\(|\.set\(/.test(body);
})());
check('normalizedOhlcvCache.mjs: entriesHealthSnapshot never deletes/evicts store entries', (() => {
  const start = ohlcvCache.indexOf('entriesHealthSnapshot');
  if (start === -1) return false;
  const end = ohlcvCache.indexOf('},', start);
  const body = ohlcvCache.slice(start, end === -1 ? undefined : end);
  return !/store\.delete\(|inflight\.delete\(/.test(body);
})());

// ---------------------------------------------------------------------------
// Group 7: UI page -- auth gate, single fetch, manual refresh, no localStorage/polling
// ---------------------------------------------------------------------------
log('--- Group 7: Admin UI page behavior ---');
check('UI page imports the existing browser Supabase client helpers (reused auth gate)', /getBrowserSupabaseClient|isSupabaseConfigured/.test(ui));
check('UI page fetches the dedicated admin route', /\/api\/admin\/operations\/overview\.json/.test(ui));
check('UI page attaches an Authorization bearer header from the real session (server enforces the actual check)', /Authorization:\s*`Bearer/.test(ui));
check('UI page has no localStorage usage', !/localStorage/.test(ui));
check('UI page has no cache-bypass query parameter (no _=Date.now() / cachebust / no-cache param appended to the fetch URL)', !/[?&](_|cachebust|nocache)=/.test(ui));
check('UI page has no setInterval/setTimeout short-polling loop', !/setInterval\(|setTimeout\(\s*.*loadOverview/.test(ui));
check('UI page has an explicit manual refresh control', /admin-ops-refresh/.test(ui) && /addEventListener\('click'/.test(ui));
check('UI page guards against overlapping in-flight requests', /refreshInFlight/.test(ui));
check('UI page preserves last-good data on a failed refresh (does not clear the body view on error)', /lastGoodOverview/.test(ui) && /최신 정보를 불러오지 못해 이전 결과를 표시합니다/.test(ui));
check('UI page has no mutation control (no button/action to reset/purge/refresh a token or clear a cache)', !/reset|purge|revoke|force.?refresh.?token/i.test(ui));
check('UI page contains fully-Korean labels for the three sections', /Chart AI 사용량/.test(ui) && /KIS 토큰 상태/.test(ui) && /시세 캐시 상태/.test(ui));
check('UI page shows a locked/denied state distinct from the data body (does not render admin data before auth resolves)', /admin-ops-lock-state/.test(ui) && /admin-ops-body/.test(ui));

// ---------------------------------------------------------------------------
// Group 8: No new public nav item (no admin nav convention existed before this phase)
// ---------------------------------------------------------------------------
log('--- Group 8: Navigation convention ---');
const layout = readOr(join(root, 'src', 'layouts', 'Layout.astro'));
check('Layout.astro was not modified to add a new public nav link to /admin/operations (page is unlisted, matching "no admin nav precedent" finding)', !/\/admin\/operations/.test(layout));

// ---------------------------------------------------------------------------
// Group 9: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 9: package.json script wiring ---');
check('smoke:phase-3gm-operations-admin-mvp script present and points at an existing file', /"smoke:phase-3gm-operations-admin-mvp":\s*"node scripts\/smoke_phase_3gm_operations_admin_mvp\.mjs"/.test(packageJson) && existsSync(join(root, 'scripts', 'smoke_phase_3gm_operations_admin_mvp.mjs')));
check('check:phase-3gm-operations-admin-mvp script present and points at this file', /"check:phase-3gm-operations-admin-mvp":\s*"node scripts\/check_phase_3gm_operations_admin_mvp_contract\.mjs"/.test(packageJson));

// ---------------------------------------------------------------------------
// Group 10 (Phase 3GM-HF1): no Unicode replacement-character (U+FFFD) corruption, and the
// operations.astro initial "last refreshed" label is the correct Korean text, not the corrupted one.
// ---------------------------------------------------------------------------
log('--- Group 10: Phase 3GM-HF1 text-corruption guard ---');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3gm_operations_and_admin_mvp_result_v0.1.md');
const PLANNING_CHANGELOG = join(root, 'docs', 'planning', 'planning_changelog.md');
const PLAN_DOC = join(root, 'docs', 'planning', 'phase_3gm_operations_and_admin_mvp_plan_v0.1.md');
const PHASE_3GM_TEXT_FILES = {
  'adminOperations/types.ts': TYPES,
  'adminOperations/adminAuthorization.ts': AUTH,
  'adminOperations/usageGuardHealth.ts': USAGE,
  'adminOperations/kisTokenHealth.ts': KIS_HEALTH,
  'adminOperations/quoteCacheHealth.ts': CACHE_HEALTH,
  'adminOperations/operationsAggregator.ts': AGGREGATOR,
  'api/admin/operations/overview.json.ts': ROUTE,
  'admin/operations.astro': UI_PAGE,
  'phase_3gm_operations_and_admin_mvp_result_v0.1.md': RESULT_DOC,
  'planning_changelog.md': PLANNING_CHANGELOG,
  'phase_3gm_operations_and_admin_mvp_plan_v0.1.md': PLAN_DOC,
};
const REPLACEMENT_CHAR = '�';
for (const [name, path] of Object.entries(PHASE_3GM_TEXT_FILES)) {
  const content = readOr(path);
  check(`${name}: no U+FFFD replacement character (no corrupted text)`, !content.includes(REPLACEMENT_CHAR));
}
check(
  "admin/operations.astro: initial 'last refreshed' label is the correct '마지막 갱신: -' (not corrupted)",
  /id="admin-ops-refreshed">마지막 갱신: -<\/p>/.test(ui),
);

// ---------------------------------------------------------------------------
// Group 11 (Phase 3GM-HF1): normalized-OHLCV cache age contract -- honest null, never derived from
// remaining TTL (msUntilExpiry/configuredTtlMs), unlike the current-price quote cache which keeps
// real timestamp-derived ages.
// ---------------------------------------------------------------------------
log('--- Group 11: Phase 3GM-HF1 OHLCV cache age honesty ---');
const cacheHealthNoComments = cacheHealth.replace(/\/\/.*$/gm, '');
check(
  'quoteCacheHealth.ts: no computed `const newestEntryAgeMs = ...` for the OHLCV branch (age is not derived, only assigned null)',
  !/const newestEntryAgeMs/.test(cacheHealth),
);
check(
  'quoteCacheHealth.ts: msUntilExpiry is never referenced in executable code (only in the explanatory comment, which is stripped here)',
  !/msUntilExpiry/.test(cacheHealthNoComments),
);
check(
  'quoteCacheHealth.ts: remaining TTL is never subtracted from configuredTtlMs to fabricate an age (no configuredTtlMs - msUntilExpiry style arithmetic)',
  !/configuredTtlMs\s*-\s*msUntilExpiry|msUntilExpiry\s*-\s*configuredTtlMs|-\s*Math\.max\(\s*\.\.\.snap\.entries/.test(cacheHealth),
);
check(
  'quoteCacheHealth.ts: OHLCV summary hardcodes newestEntryAgeMs/oldestEntryAgeMs/lastSuccessfulUpdateAtIso to null on the success path',
  (() => {
    const start = cacheHealth.indexOf("cacheId: 'normalized-ohlcv-cache'");
    const end = cacheHealth.indexOf('} catch {', start);
    if (start === -1 || end === -1) return false;
    const successBlock = cacheHealth.slice(start, end);
    return (
      /newestEntryAgeMs:\s*null,/.test(successBlock) &&
      /oldestEntryAgeMs:\s*null,/.test(successBlock) &&
      /lastSuccessfulUpdateAtIso:\s*null,/.test(successBlock)
    );
  })(),
);
check(
  'quoteCacheHealth.ts: current-price cache success-path ages remain pass-through from the real snapshot (unchanged, not hardcoded null)',
  (() => {
    const start = cacheHealth.indexOf("cacheId: 'current-price-quote-cache'");
    const end = cacheHealth.indexOf('} catch {', start);
    if (start === -1 || end === -1) return false;
    const successBlock = cacheHealth.slice(start, end);
    return (
      /newestEntryAgeMs:\s*snap\.newestEntryAgeMs,/.test(successBlock) &&
      /oldestEntryAgeMs:\s*snap\.oldestEntryAgeMs,/.test(successBlock) &&
      /lastSuccessfulUpdateAtIso:\s*snap\.lastCachedAtIso,/.test(successBlock)
    );
  })(),
);
check(
  'quoteCacheHealth.ts: has a concise one-line comment explaining why OHLCV age/last-update is honestly null',
  /\/\/ Phase 3GM-HF1:.*normalizedOhlcvCache\.mjs.*insertion timestamp.*honestly null/i.test(cacheHealth),
);
check(
  'the four reused-cache files (normalizedOhlcvCache.mjs, universalOhlcvProvider.ts, quoteCache.ts, kisClient.ts) are untouched by this HF1 text/contract fix (no new cachedAtMs/insertion-timestamp field added)',
  !/cachedAtMs/.test(ohlcvCache) && !/entryInsertedAtMs|insertedAtMs/.test(ohlcvCache + ohlcvProvider),
);

// ---------------------------------------------------------------------------
// Group 12 (Phase 3GM-HF1): the four existing-system files the original Phase 3GM PR modified to add
// read-only inspection hooks remain narrowly additive (zero deleted lines) against the pre-3GM
// baseline commit -- confirms this hotfix (and the original phase) never changed their behavior.
// ---------------------------------------------------------------------------
log('--- Group 12: Phase 3GM-HF1 reused-file additive-diff guard ---');
const PRE_3GM_BASELINE_SHA = 'dc4f3b0';
const REUSED_HOOK_FILES = [
  'src/lib/server/chart-ai/normalizedOhlcvCache.mjs',
  'src/lib/server/chart-ai/universalOhlcvProvider.ts',
  'src/lib/server/marketData/quoteCache.ts',
  'src/lib/server/providers/kisClient.ts',
];
let gitDiffAvailable = true;
let numstatOutput = '';
try {
  numstatOutput = execFileSync(
    'git',
    ['diff', `${PRE_3GM_BASELINE_SHA}..HEAD`, '--numstat', '--', ...REUSED_HOOK_FILES],
    { cwd: root, encoding: 'utf8' },
  );
} catch (error) {
  gitDiffAvailable = false;
  log(`  [warn] could not run git diff against ${PRE_3GM_BASELINE_SHA}: ${error && error.message ? error.message : error}`);
}
if (gitDiffAvailable) {
  const lines = numstatOutput.split('\n').filter((l) => l.trim().length > 0);
  for (const file of REUSED_HOOK_FILES) {
    const row = lines.find((l) => l.endsWith(file));
    check(`${file}: touched vs. pre-3GM baseline (${PRE_3GM_BASELINE_SHA}) with additive hook`, Boolean(row));
    if (row) {
      const [added, deleted] = row.split('\t');
      check(`${file}: zero deleted lines vs. pre-3GM baseline (purely additive, no behavior change)`, deleted === '0');
      check(`${file}: at least one added line vs. pre-3GM baseline (the additive health-snapshot export exists)`, Number(added) > 0);
    }
  }
} else {
  check('reused-file additive-diff guard: git history reachable to verify additivity', false);
}

// ---------------------------------------------------------------------------
// Group 13 (Phase 3GM-HF2): UI/UX completion pass -- Korean-first header, single H1, client-side-only
// overall status, badge honesty, section content, empty/populated cache branches, disclosure notice,
// refresh toolbar a11y, signed-out/non-admin lock-state correctness, admin-only distraction removal,
// responsive layout, and no new API/behavior surface.
// ---------------------------------------------------------------------------
log('--- Group 13: Phase 3GM-HF2 UI/UX completion pass ---');

// Header: exactly one H1, not oversized-by-default English, Korean-first copy.
check('UI page has exactly one <h1> element', (ui.match(/<h1[\s>]/g) || []).length === 1);
check('UI page H1 text is the Korean "운영 현황" (not the English "Operations Overview")', /<h1[^>]*>운영 현황<\/h1>/.test(ui));
check('UI page keeps "Operations Overview" only as a non-H1 subtitle', /Operations Overview/.test(ui) && !/<h1[^>]*>Operations Overview/.test(ui));
check('UI page H1 has a scoped font-size override (not left to the bare global 44px h1 rule)', /\.ops-h1\s*\{[^}]*font-size/s.test(ui));
check('UI page has a Korean eyebrow label "관리자 전용"', /관리자 전용/.test(ui));

// Client-side-only overall status derivation (no new API field).
check('overall status is computed client-side via a worst-of precedence helper, not read from a new API field', /worstStatus/.test(ui) && !/overallStatus\s*[:,]/.test(route));
check('overall status precedence is unavailable > warning > healthy (rank table)', /unavailable:\s*2/.test(ui) && /warning:\s*1/.test(ui) && /healthy:\s*0/.test(ui));
check('route/aggregator/types were not extended with a new "overall" field for this HF2', !/overallStatus|overallHealth/.test(route) && !/overallStatus|overallHealth/.test(aggregator) && !/overallStatus|overallHealth/.test(types));

// Shared badge component: never color-only, closed 3-state Korean mapping.
check('UI page has one shared badge builder used across summary/section cards', /buildBadge/.test(ui));
check('badge maps healthy/warning/unavailable to 정상/주의/정보 없음 text (never color-only)', /'정상'/.test(ui) && /'주의'/.test(ui) && /'정보 없음'/.test(ui));
check('badge always pairs an icon element with a text node (icon aria-hidden, text visible)', /ops-badge-icon/.test(ui) && /ops-badge-text/.test(ui) && /setAttribute\('aria-hidden', 'true'\)/.test(ui));
check('UI page does not load an external icon-font/library (e.g. Font Awesome, Material Icons CDN)', !/font-awesome|material-icons|fontawesome\.com|cdnjs.*icons/i.test(ui));

// Section A: Chart AI usage highlights + secondary detail.
check('Usage section highlights count/users/at-limit/daily-limit as top-level stats', /오늘 사용 횟수/.test(ui) && /이용자 수/.test(ui) && /한도 도달 이용자 수/.test(ui) && /일일 한도/.test(ui));
check('Usage section shows base date / most-recent-use / store-status as secondary detail', /기준 날짜/.test(ui) && /가장 최근 사용 시각/.test(ui) && /저장소 상태/.test(ui));

// Section B: KIS token semantic wording (never plain 예/아니오) + conditional impact note.
check('KIS card uses semantic config-ready wording (사용 가능/비활성), not 예/아니오', /fmtConfigReady/.test(ui) && /사용 가능/.test(ui) && /비활성/.test(ui));
check('KIS card uses semantic token-present wording (토큰 있음/토큰 없음)', /fmtTokenPresent/.test(ui) && /토큰 있음/.test(ui) && /토큰 없음/.test(ui));
check('KIS card uses semantic expiry wording (만료되지 않음/만료 또는 사용 불가)', /fmtStaleOrExpired/.test(ui) && /만료되지 않음/.test(ui) && /만료 또는 사용 불가/.test(ui));
check(
  'KIS card only shows the "no current operating impact" note when overall kis.status is actually healthy (not unconditionally on !durableStoreReady)',
  /if \(!kis\.durableStoreReady && kis\.status === 'healthy'\)/.test(ui) && /현재 운영 영향 없음/.test(ui),
);

// Section C: per-cache sub-cards, honest empty state, conditional age rows, null-age note.
check('cache card shows the honest empty-state copy when entryCount === 0', /현재 인스턴스에 저장된 캐시가 없습니다\./.test(ui) && /실제 시세 조회 후 상태가 표시됩니다\./.test(ui));
check('cache card only renders age/update rows when the value is non-null (conditional, not always-shown)', /if \(newestAge !== null\)/.test(ui) && /if \(oldestAge !== null\)/.test(ui) && /if \(cache\.lastSuccessfulUpdateAtIso !== null\)/.test(ui));
check('cache card shows the exact null-age explanatory note when all age fields are null', /이 캐시는 생성 시각을 저장하지 않아 항목 나이를 제공하지 않습니다\./.test(ui));
check('instance-local disclosure notice text is present above the cache cards', /캐시 정보는 현재 요청을 처리한 서버 인스턴스 기준입니다\. 전체 Production 인스턴스의 합산 상태가 아닙니다\./.test(ui));

// Refresh toolbar: label toggle, aria-live success/failure messaging, no overlapping requests preserved.
check('refresh button label toggles between 새로고침 and 갱신 중', /새로고침/.test(ui) && /갱신 중/.test(ui) && /admin-ops-refresh-label/.test(ui));
check('UI page has an aria-live region for refresh announcements', /aria-live="polite"/.test(ui) && /admin-ops-live-region/.test(ui));
check('successful refresh announces the Korean success message', /운영 현황을 갱신했습니다\./.test(ui));
check('failed refresh announces the Korean stale-data message while keeping the body visible', /최신 정보를 불러오지 못해 이전 결과를 표시합니다\./.test(ui) && /showOnly\(bodyEl\)/.test(ui));
check('refresh control still guards overlapping in-flight requests (early-return, not a new AbortController pattern)', /if \(refreshInFlight\) return/.test(ui));

// Signed-out lock state: centered icon, visible login CTA wired to the shared mk:open-auth event.
check('lock-state container centers its icon via display:grid + justify-items:center (fixes the left-edge-floating bug)', /\.ops-status-card\s*\{[^}]*display:\s*grid;[^}]*justify-items:\s*center;/s.test(ui));
check('signed-out state shows the exact copy "로그인이 필요합니다"', /로그인이 필요합니다/.test(ui));
check('signed-out state has a visible login button (no more hidden-forever bug) that dispatches mk:open-auth', /loginActionEl\?\.classList\.remove\('hidden'\)/.test(ui) && /window\.dispatchEvent\(new CustomEvent\('mk:open-auth'\)\)/.test(ui));

// Non-admin state: distinct copy, explicitly no login CTA.
check('non-admin state shows the exact title "접근 권한이 없습니다" and copy about registered admins only', /접근 권한이 없습니다/.test(ui) && /이 화면은 등록된 관리자만 볼 수 있습니다\./.test(ui));
check('non-admin state hides the login action (no CTA offered for a state login cannot fix)', /loginActionEl\?\.classList\.add\('hidden'\)/.test(ui));

// Admin-page-only distraction removal: scoped via pageClass, not a global style/Layout change.
check('UI page passes a dedicated pageClass to Layout (scoped ad-suppression, no Layout.astro edit)', /pageClass="admin-operations-page"/.test(ui));
check('ad-suppression CSS is scoped to body.admin-operations-page (does not hide the ads globally)', /body\.admin-operations-page #slidePopup/.test(ui) && /body\.admin-operations-page #bottomAdBanner/.test(ui));
check('ad-suppression rule hides only #slidePopup/#bottomAdBanner, never the whole #bottomDocumentArea (real footer preserved)', !/#bottomDocumentArea\s*\{[^}]*display:\s*none/s.test(ui));
check('a public page (index.astro) is not scoped with the admin-only pageClass (ad suppression stays admin-only)', !/pageClass="admin-operations-page"/.test(readOr(join(root, 'src', 'pages', 'index.astro'))));
check('Layout.astro itself was not modified to hard-code the admin pageClass or hide ads globally', !/admin-operations-page/.test(layout));

// Accessibility: keyboard focus, reduced motion, decorative icons.
check('UI page defines a visible :focus-visible style for interactive controls', /:focus-visible\s*\{/.test(ui));
check('UI page respects prefers-reduced-motion for the refresh spinner', /@media \(prefers-reduced-motion: reduce\)/.test(ui));
check('decorative icons (lock icon, refresh icon, badge icons) are aria-hidden', (ui.match(/aria-hidden="true"/g) || []).length >= 2);

// Responsive layout: summary/highlight grids collapse at documented breakpoints.
check('summary card grid collapses from 4 columns to fewer at narrower breakpoints', /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/.test(ui) && /@media \(max-width: 900px\)/.test(ui) && /@media \(max-width: 640px\)/.test(ui));
check('cache grid collapses to a single column on mobile', /\.ops-cache-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2/s.test(ui) && /\.ops-cache-grid\s*\{\s*grid-template-columns:\s*1fr;/.test(ui));

// No new secret/PII surface introduced by this HF2 (route/aggregator/types unedited; UI has no raw ids).
check('UI page never renders a raw user id/email/service-role key literal', !/service_role/i.test(ui) && !/user_id/i.test(ui) && !/@gmail\.com|@naver\.com/i.test(ui));

// ---------------------------------------------------------------------------
// Group 14 (Phase 3GM-HF3): authentication denial vs. operational-data unavailability are distinct
// UI states. An authenticated admin whose overview read fails (HTTP failure, invalid JSON, malformed
// payload shape, or a network/runtime exception) must land on the new dedicated unavailable state --
// never stuck on "checking", never shown the signed-out/non-admin lock copy, never a fabricated
// dashboard. Static source-inspection only, matching the rest of this checker's method (no jsdom/
// headless browser; the UI has no server-side render branching to unit-test against real fetches).
// ---------------------------------------------------------------------------
log('--- Group 14: Phase 3GM-HF3 unavailable state vs. auth-lock state ---');

// 1. Dedicated unavailable-state element exists (by ID).
check('dedicated unavailable-state element exists (id="admin-ops-unavailable-state")', /id="admin-ops-unavailable-state"/.test(ui));
check('dedicated retry control exists (id="admin-ops-retry")', /id="admin-ops-retry"/.test(ui));

// 2. Mutually exclusive with checking/lock/dashboard -- showOnly hides all four before revealing one.
const showOnlyStart = ui.indexOf('const showOnly = (el');
const showOnlyBody = showOnlyStart === -1 ? '' : ui.slice(showOnlyStart, ui.indexOf('};', showOnlyStart));
check(
  'showOnly() hides all four top-level states (checkingEl, lockEl, unavailableEl, bodyEl) before revealing one',
  /\[checkingEl,\s*lockEl,\s*unavailableEl,\s*bodyEl\]/.test(showOnlyBody) && /el\?\.classList\.remove\('hidden'\)/.test(showOnlyBody),
);
check('a dedicated showUnavailableState() helper routes through the single showOnly() gate (no ad-hoc classList toggling)', /const showUnavailableState = \(\) => \{\s*showOnly\(unavailableEl\);\s*\}/.test(ui));

// Extract the unified failure handler and the loadOverview body/catch block once, reused below.
const handleUnavailStart = ui.indexOf('const handleOperationalDataUnavailable = () => {');
const handleUnavailBody = handleUnavailStart === -1 ? '' : ui.slice(handleUnavailStart, ui.indexOf('\n    };', handleUnavailStart));
const loadOverviewStart = ui.indexOf('const loadOverview = async () => {');
const loadOverviewBody = loadOverviewStart === -1 ? '' : ui.slice(loadOverviewStart, ui.indexOf('\n    };', loadOverviewStart));
const catchStart = loadOverviewBody.indexOf('} catch {');
const finallyStart = loadOverviewBody.indexOf('} finally {');
const catchBody = catchStart === -1 || finallyStart === -1 ? '' : loadOverviewBody.slice(catchStart, finallyStart);

// 3/4. Initial HTTP 500 and any other non-401/403 HTTP failure -> unavailable (both funnel through the
// single `responseIsUsable` gate below, which is false for any non-ok HTTP status).
check(
  'success path requires response.ok before accepting the payload (any non-2xx status -- including 500 -- is rejected)',
  /responseIsUsable\s*=\s*[\s\S]*?response\.ok[\s\S]*?isValidOverviewShape\(overviewCandidate\)/.test(loadOverviewBody),
);
check(
  'a rejected response (!responseIsUsable) routes to the unified operational-data-unavailable handler, not a lock state',
  /if \(!responseIsUsable\) \{[\s\S]*?handleOperationalDataUnavailable\(\);/.test(loadOverviewBody),
);
check(
  'the unified handler shows the new unavailable state when there is no last-good overview yet (state D)',
  /else \{\s*showUnavailableState\(\);\s*\}/.test(handleUnavailBody),
);
check(
  'the unified handler never calls showLockState (auth denial and data-unavailability stay fully distinct)',
  handleUnavailBody.length > 0 && !/showLockState/.test(handleUnavailBody),
);

// 5. Network exception (fetch throws) / any runtime exception during processing -> unavailable, via
// the SAME unified handler as the HTTP-failure path (no second, divergent error-handling branch).
check(
  'loadOverview() catch block (network/runtime exception) routes to the unified operational-data-unavailable handler',
  /handleOperationalDataUnavailable\(\);/.test(catchBody),
);
check('catch block does NOT fall back to showLockState (HF2 regression this HF3 fixes)', catchBody.length > 0 && !/showLockState/.test(catchBody));

// 6. Invalid JSON response -> unavailable: response.json() failure collapses to a falsy payload, which
// isValidOverviewShape below also treats as unusable.
check(
  'invalid JSON collapses to a null payload via .json().catch(() => null), then requires Boolean(payload) before proceeding',
  /\.json\(\)\.catch\(\(\) => null\)/.test(loadOverviewBody) && /Boolean\(payload\)/.test(loadOverviewBody),
);

// 7. Malformed/unexpected-shape success payload -> unavailable via an explicit shape validator (does
// not just trust `payload.ok === true`).
const shapeValidatorStart = ui.indexOf('const isValidOverviewShape = (value: unknown)');
const shapeValidatorBody = shapeValidatorStart === -1 ? '' : ui.slice(shapeValidatorStart, ui.indexOf('\n    };', shapeValidatorStart));
check('isValidOverviewShape() validator exists and checks generatedAtIso/usageGuard/kisToken/quoteCaches', (() => {
  if (!shapeValidatorBody) return false;
  return (
    /typeof v\.generatedAtIso === 'string'/.test(shapeValidatorBody) &&
    /v\.usageGuard/.test(shapeValidatorBody) &&
    /v\.kisToken/.test(shapeValidatorBody) &&
    /Array\.isArray\(v\.quoteCaches\)/.test(shapeValidatorBody)
  );
})());
check('the success gate actually calls isValidOverviewShape(overviewCandidate) (validator is wired in, not dead code)', /isValidOverviewShape\(overviewCandidate\)/.test(loadOverviewBody));

// 8/9. No-last-good failure does not leave "checking" visible and does not trigger the signed-out
// state -- both guaranteed structurally: the else-branch calls showUnavailableState() (which always
// routes through showOnly(), which unconditionally hides checkingEl/lockEl first), and the unified
// handler never references showLockState (already asserted above).
check(
  'no-last-good failure path is reached only through handleOperationalDataUnavailable -> showUnavailableState -> showOnly (never leaves checkingEl visible)',
  /const showUnavailableState = \(\) => \{\s*showOnly\(unavailableEl\);\s*\}/.test(ui) && /\[checkingEl,\s*lockEl,\s*unavailableEl,\s*bodyEl\]/.test(showOnlyBody),
);

// 10. Unavailable state shows no login CTA -- the section markup between its own id and its closing
// </section> must not reference the login action id.
const unavailSectionStart = ui.indexOf('id="admin-ops-unavailable-state"');
const unavailSectionEnd = ui.indexOf('</section>', unavailSectionStart);
const unavailSectionMarkup = unavailSectionStart === -1 || unavailSectionEnd === -1 ? '' : ui.slice(unavailSectionStart, unavailSectionEnd);
check('unavailable-state section markup exists and is non-empty', unavailSectionMarkup.length > 0);
check('unavailable-state section contains no login CTA (no admin-ops-login-action reference)', !/admin-ops-login-action/.test(unavailSectionMarkup));

// 11/12. Exact required title and copy text.
check('unavailable title text is exactly "운영 정보를 불러오지 못했습니다"', /id="admin-ops-unavailable-title">운영 정보를 불러오지 못했습니다<\/h2>/.test(ui));
check(
  'unavailable copy text is exactly "로그인과 관리자 권한은 확인되었지만 현재 운영 데이터를 조회할 수 없습니다."',
  /id="admin-ops-unavailable-copy">로그인과 관리자 권한은 확인되었지만 현재 운영 데이터를 조회할 수 없습니다\.<\/p>/.test(ui),
);

// 13. Retry button invokes the EXISTING loadOverview() -- not a duplicate fetch implementation.
const retryClickStart = ui.indexOf("retryBtn?.addEventListener('click'");
const retryClickEnd = retryClickStart === -1 ? -1 : ui.indexOf('});', retryClickStart) + 3;
const retryClickBody = retryClickStart === -1 || retryClickEnd === -1 ? '' : ui.slice(retryClickStart, retryClickEnd);
check('retry button click handler exists', retryClickBody.length > 0);
check('retry button calls the existing loadOverview() function', /void loadOverview\(\);/.test(retryClickBody));
check('retry button handler contains no duplicate fetch(...) call of its own', !/fetch\(/.test(retryClickBody));

// 14/15. Retry disabled/aria-busy while running, and its label toggles 다시 시도 <-> 다시 시도 중, via
// the same shared busy-state toggle the refresh button uses (no separate/divergent retry-only logic).
const setBusyStart = ui.indexOf('const setControlsBusy = (busy: boolean)');
const setBusyBody = setBusyStart === -1 ? '' : ui.slice(setBusyStart, ui.indexOf('\n    };', setBusyStart));
check('setControlsBusy() disables the retry button while busy', /retryBtn\.disabled = busy/.test(setBusyBody));
check('setControlsBusy() sets/removes aria-busy on the retry button', /retryBtn\.setAttribute\('aria-busy', 'true'\)/.test(setBusyBody) && /retryBtn\.removeAttribute\('aria-busy'\)/.test(setBusyBody));
check('retry label toggles between "다시 시도" and "다시 시도 중"', /retryBtn\.textContent = busy \? '다시 시도 중' : '다시 시도'/.test(setBusyBody));
check('loadOverview() calls setControlsBusy(true) at start and setControlsBusy(false) in its finally block (shared with refresh, single busy toggle)', /setControlsBusy\(true\)/.test(loadOverviewBody) && /setControlsBusy\(false\)/.test(loadOverviewBody));

// 16. Last-good dashboard preserved after a refresh failure -- state E does not regress to unavailable.
check(
  'when lastGoodOverview exists, a failed refresh keeps showing the dashboard body (not the new unavailable state)',
  /if \(lastGoodOverview\) \{\s*setStaleNotice\('최신 정보를 불러오지 못해 이전 결과를 표시합니다\.'\);\s*showOnly\(bodyEl\);\s*\}/.test(handleUnavailBody),
);

// 17. Existing HF2 stale-result notice text remains exactly as before (no accidental rewording).
check('stale-result notice text remains exactly "최신 정보를 불러오지 못해 이전 결과를 표시합니다."', /최신 정보를 불러오지 못해 이전 결과를 표시합니다\./.test(ui));

// 18/19. HTTP 401 still -> signed-out; HTTP 403 still -> non-admin (unchanged HF2 behavior, verified
// still reachable through the fixed state logic).
check("HTTP 401 still routes to showLockState('signed-out')", /response\.status === 401\) \{\s*showLockState\('signed-out'\);/.test(loadOverviewBody));
check("HTTP 403 still routes to showLockState('non-admin')", /response\.status === 403\) \{\s*showLockState\('non-admin'\);/.test(loadOverviewBody));

// 20/21. Signed-out login CTA still dispatches mk:open-auth; non-admin state still hides the CTA.
check('signed-out login CTA still dispatches mk:open-auth', /window\.dispatchEvent\(new CustomEvent\('mk:open-auth'\)\)/.test(ui));
check('non-admin state still hides the login action', /loginActionEl\?\.classList\.add\('hidden'\)/.test(ui));

// 22. No polling / setInterval / automatic-retry loop introduced by this hotfix.
check('UI page introduces no setInterval() anywhere', !/setInterval\(/.test(ui));
check('UI page introduces no setTimeout()-driven automatic retry loop', !/setTimeout\(/.test(ui));
check('UI page has no cache-bypass query param added for retry (no _=Date.now()/cachebust/no-cache)', !/[?&](_|cachebust|nocache)=/.test(ui));
check('UI page uses no alert() anywhere', !/\balert\(/.test(ui));
check('UI page still has no localStorage usage (unchanged from HF2)', !/localStorage/.test(ui));

// 23. None of the "do not touch" server/API contract files were modified by this hotfix -- verified by
// a zero-diff git check against the pre-HF3 baseline commit (the exact HEAD this hotfix branched from).
const PRE_HF3_BASELINE_SHA = '82cfbc36a3f747602c9a215be5e4dfc9428a024b';
const HF3_UNTOUCHED_FILES = [
  'src/lib/server/adminOperations/adminAuthorization.ts',
  'src/lib/server/adminOperations/usageGuardHealth.ts',
  'src/lib/server/adminOperations/kisTokenHealth.ts',
  'src/lib/server/adminOperations/quoteCacheHealth.ts',
  'src/lib/server/adminOperations/operationsAggregator.ts',
  'src/lib/server/adminOperations/types.ts',
  'src/pages/api/admin/operations/overview.json.ts',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/marketData/quoteCache.ts',
  'src/lib/server/chart-ai/normalizedOhlcvCache.mjs',
  'src/lib/server/chart-ai/universalOhlcvProvider.ts',
];
let hf3DiffAvailable = true;
let hf3NumstatOutput = '';
try {
  hf3NumstatOutput = execFileSync(
    'git',
    ['diff', `${PRE_HF3_BASELINE_SHA}..HEAD`, '--numstat', '--', ...HF3_UNTOUCHED_FILES],
    { cwd: root, encoding: 'utf8' },
  );
} catch (error) {
  hf3DiffAvailable = false;
  log(`  [warn] could not run git diff against ${PRE_HF3_BASELINE_SHA}: ${error && error.message ? error.message : error}`);
}
if (hf3DiffAvailable) {
  check(
    'zero diff vs. pre-HF3 baseline for every "do not touch" server/API contract file (this hotfix is client-only)',
    hf3NumstatOutput.trim().length === 0,
  );
} else {
  check('"do not touch" file guard: git history reachable to verify zero-diff', false);
}

// 24. No U+FFFD replacement character anywhere in Phase 3GM application/doc files (re-asserted here for
// this hotfix; the underlying per-file loop already runs in Group 10 above against the same file map).
check(
  're-assert: no Phase 3GM file (including this HF3 hotfix\'s edits) contains a U+FFFD replacement character',
  !Object.values(PHASE_3GM_TEXT_FILES).some((path) => readOr(path).includes(REPLACEMENT_CHAR)),
);

// 25. No token/API-key/email/user-ID/Authorization-header value/raw provider payload is ever rendered
// by the client -- the new code never surfaces the server's payload.message/payload.code text.
check('client never renders the raw server error message/code from the payload (payload.message / payload.code)', !/payload\.message|payload\.code/.test(ui));
check('client never renders a literal Authorization bearer value (only the header-name usage to attach the session token)', !/Authorization:\s*['"]Bearer [A-Za-z0-9]/.test(ui));
check('client-side UI still never renders a raw user id/email/service-role key literal (unchanged from HF2)', !/service_role/i.test(ui) && !/user_id/i.test(ui) && !/@gmail\.com|@naver\.com/i.test(ui));

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
