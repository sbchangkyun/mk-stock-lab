/**
 * Phase 3GG-T-HF2 static contract + secret-scan checker (read-only).
 *
 * Verifies the durable KIS token lifecycle: one authoritative /oauth2/tokenP issuer, all transports go
 * through the manager/executor, the approved env contract, the migration objects + RLS + service_role
 * grants, no browser import of server token modules, no token field in external responses, emergency
 * refresh disabled by default, no Cron, no real KIS token call in tests, no account/trading scope, and a
 * secret scan over the new source + tests + migration.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const BASELINE = '39830c9';
const KIS_DIR = 'src/lib/server/providers/kis';
const KIS_CLIENT = 'src/lib/server/providers/kisClient.ts';
const MIGRATION = 'supabase/migrations/20260713_kis_token_lifecycle.sql';
const TEST_SRC = 'scripts/kis_token_lifecycle_testsrc.ts';
const SMOKE = 'scripts/smoke_phase_3gg_t_hf2_kis_token_lifecycle.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf2_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf2_kis_token_lifecycle_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

const MODULES = [
  'kisTokenTypes.ts', 'kisTokenConfig.ts', 'kisTokenCrypto.ts', 'kisTokenStore.ts',
  'kisTokenLease.ts', 'kisTokenTelemetry.ts', 'kisTokenErrorClassifier.ts',
  'kisTokenManager.ts', 'kisRequestExecutor.ts',
].map((m) => `${KIS_DIR}/${m}`);

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' });

// --- 1. Required files ---
for (const f of [...MODULES, KIS_CLIENT, MIGRATION, TEST_SRC, SMOKE, CHECKER_SELF, RESULT_DOC]) {
  assert(existsSync(f), `Required file missing: ${f}`);
}

// --- 2. Exactly one /oauth2/tokenP issuer ---
const kisClient = read(KIS_CLIENT);
assert(kisClient.includes("const tokenPath = '/oauth2/tokenP'"), 'kisClient must declare the token path.');
// Count actual fetch(...tokenPath) issuance sites across the whole tree — must be exactly one (kisClient).
// Count files that actually FETCH the token endpoint (the `${config.baseUrl}${tokenPath}` construction),
// not doc comments that merely mention `/oauth2/tokenP`. Only kisClient may issue.
let tokenFetchFiles = [];
try {
  tokenFetchFiles = runGit(['grep', '-lF', '${config.baseUrl}${tokenPath}', '--', 'src/']).split('\n').map((l) => l.trim()).filter(Boolean);
} catch { tokenFetchFiles = existsSync(KIS_CLIENT) ? [KIS_CLIENT] : []; }
assert(tokenFetchFiles.length === 1 && tokenFetchFiles[0] === KIS_CLIENT, `Exactly one file may issue the token endpoint (kisClient), found: ${tokenFetchFiles.join(', ')}`);
assert(kisClient.includes('issueKisTokenFromEndpoint'), 'kisClient must keep the single authoritative endpoint issuer.');
assert((kisClient.match(/\$\{config\.baseUrl\}\$\{tokenPath\}/g) || []).length === 1, 'exactly one /oauth2/tokenP fetch must exist.');

// --- 3. All four transports route through the authoritative manager/executor ---
for (const t of ['getKisDomesticQuoteSnapshot', 'getKisDomesticDailyOhlcSeries', 'getKisOverseasDailyOhlcSeries', 'getKisOverseasQuoteSnapshot']) {
  assert(kisClient.includes(t), `transport missing: ${t}`);
}
assert((kisClient.match(/executeKisRequestWithToken\(getKisExecutorDeps\(\)/g) || []).length === 4, 'all four transports must call executeKisRequestWithToken via the shared manager.');
assert(!/getKisAccessToken\s*\(/.test(kisClient), 'the old process-local getKisAccessToken accessor must be gone.');
assert(kisClient.includes('createKisTokenManager'), 'kisClient must wire the authoritative durable manager.');

// --- 4. Env contract (approved names) ---
const cfg = read(`${KIS_DIR}/kisTokenConfig.ts`);
for (const name of ['KIS_DURABLE_TOKEN_ENABLED', 'KIS_TOKEN_NAMESPACE', 'KIS_TOKEN_ENCRYPTION_KEY', 'KIS_TOKEN_TELEMETRY_ENABLED', 'KIS_TOKEN_EMERGENCY_REFRESH_ENABLED']) {
  assert(cfg.includes(name), `config must reference env name: ${name}`);
}
assert(/durableEnabled\s*&&\s*encryptionKeyPresent/.test(cfg), 'durable mode requires the encryption key (fail closed otherwise).');
assert(/durableEnabled\s*&&\s*!encryptionKeyPresent/.test(cfg), 'durable-without-key must be flagged misconfigured (no silent issuance).');

// --- 5. AES-256-GCM via Node built-in crypto; no crypto dependency added ---
const crypto = read(`${KIS_DIR}/kisTokenCrypto.ts`);
assert(crypto.includes("'aes-256-gcm'") && crypto.includes("from 'node:crypto'"), 'crypto must use Node aes-256-gcm.');
assert(/setAAD\(/.test(crypto) && /getAuthTag\(/.test(crypto) && /setAuthTag\(/.test(crypto), 'crypto must use AAD + GCM auth tag.');
try {
  const pkgDiff = runGit(['diff', BASELINE, '--', PACKAGE_JSON]);
  assert(!/^[+]\s*"[^"]*(crypto|aes|jose|node-forge)[^"]*":/mi.test(pkgDiff), 'no cryptography dependency may be added.');
  assert(!/^[+-]\s*"(dependencies|devDependencies)"/m.test(pkgDiff) && !/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');
} catch { /* ignore */ }

// --- 6. Migration objects + RLS + service_role grants + fencing ---
const mig = read(MIGRATION);
for (const obj of ['internal.kis_token_state', 'internal.kis_token_event', 'acquire_kis_token_lease', 'release_kis_token_lease', 'store_kis_token_generation', 'invalidate_kis_token_generation', 'record_kis_token_event']) {
  assert(mig.includes(obj), `migration missing object: ${obj}`);
}
assert(/enable row level security/.test(mig), 'migration must enable RLS.');
assert(/revoke all on table internal\.kis_token_state from public, anon, authenticated/.test(mig), 'migration must revoke browser roles on the state table.');
assert(/grant execute on function internal\.acquire_kis_token_lease/.test(mig) && /to service_role/.test(mig), 'RPCs must be granted to service_role only.');
assert(/revoke all on function internal\.acquire_kis_token_lease\(text, text, integer\) from public, anon, authenticated/.test(mig), 'RPCs must be revoked from browser roles.');
assert(/security definer/.test(mig) && /set search_path = ''/.test(mig), 'RPCs must be security definer with a fixed search_path.');
assert(/lease_version\s*=\s*s\.lease_version\s*\+\s*1/.test(mig), 'lease acquisition must increment the fencing version.');
assert(/s\.lease_owner\s*=\s*p_lease_owner[\s\S]*s\.lease_version\s*=\s*p_lease_version/.test(mig), 'store/release must be fenced by owner + version.');
// No token plaintext column.
assert(!/token_plaintext|access_token\s+text/.test(mig), 'migration must never store token plaintext.');

// --- 7. No browser/client import of the server token modules ---
let clientImports = '';
try { clientImports = runGit(['grep', '-l', "providers/kis/kisToken", '--', 'src/pages/**/*.astro', 'src/components', 'src/layouts']).trim(); } catch { clientImports = ''; }
assert(clientImports === '', `no client/browser module may import the server token modules: ${clientImports}`);
// The token modules are server-only (under src/lib/server/**) and never imported by client code.
assert(MODULES.every((m) => m.startsWith('src/lib/server/')), 'token modules must live under src/lib/server.');

// --- 8. No token field in external API responses (routes never import the handle) ---
let routeHandleImport = '';
try { routeHandleImport = runGit(['grep', '-l', 'KisTokenHandle', '--', 'src/pages/api']).trim(); } catch { routeHandleImport = ''; }
assert(routeHandleImport === '', 'API routes must not import KisTokenHandle.');
assert(/serialized into a client response/i.test(read(`${KIS_DIR}/kisTokenTypes.ts`)), 'the handle type must document the no-serialization rule.');

// --- 9. Emergency refresh disabled by default; allowlist empty ---
const classifier = read(`${KIS_DIR}/kisTokenErrorClassifier.ts`);
assert(/TOKEN_INVALID_CODES[\s\S]*Set<string>\(\[\]\)/.test(classifier) || /new Set<string>\(\[\]\)/.test(classifier), 'token-invalid allowlist must be empty by default.');
assert(cfg.includes("isTrue(envReader('KIS_TOKEN_EMERGENCY_REFRESH_ENABLED'))"), 'emergency refresh must be env-gated (default off).');
assert(!/emergencyRefreshEnabled:\s*true/.test([...MODULES, KIS_CLIENT].map(read).join('\n')), 'emergency refresh must never be hardcoded on.');

// --- 10. No Cron added ---
assert(!existsSync('vercel.json') || !/crons?\b/i.test(read('vercel.json')), 'no Cron may be added this phase.');
let cronDiff = '';
try { cronDiff = runGit(['diff', '--name-only', BASELINE, '--', 'vercel.json', 'vercel.ts']).trim(); } catch { cronDiff = ''; }
assert(cronDiff === '', 'no Vercel config/cron change this phase.');

// --- 11. No real KIS token call in tests; mock issuer only ---
const testSrc = read(TEST_SRC);
assert(!/oauth2\/tokenP/.test(testSrc), 'test source must not reference the real token endpoint.');
assert(/mock/i.test(testSrc) && /issueToken:\s*async/.test(testSrc), 'tests must inject a mock issuer.');
assert(read(SMOKE).includes("external: ['@supabase/supabase-js'") || read(SMOKE).includes('@supabase/supabase-js'), 'smoke bundler must keep Supabase external (no real credentials).');

// --- 12. No account/order/balance/funds/trading scope added by the NEW token surface ---
// (Scan only the new modules + migration; kisClient's pre-existing KIS_ACCOUNT_NO guard asserts the
//  account number is ABSENT and is covered by the OP-FAST checker.)
const surface = [...MODULES, MIGRATION].map(read).join('\n');
for (const pat of [/inquire-balance/i, /inquire-account/i, /order-cash/i, /order-credit/i, /\/trading\//i, /funds?-transfer/i, /KIS_ACCOUNT_NO/]) {
  assert(!pat.test(surface), `new token surface must not add forbidden endpoint/account scope: ${pat}`);
}

// --- 13. SECRET SCAN: no real secrets / no token logging in new source, tests, migration ---
const scanFiles = [...MODULES, KIS_CLIENT, TEST_SRC, SMOKE, MIGRATION];
const REAL_SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/,            // OpenAI-style
  /eyJ[A-Za-z0-9_-]{20,}\./,        // JWT
  /KIS_APP_KEY\s*=\s*[A-Za-z0-9]/,
  /KIS_APP_SECRET\s*=\s*[A-Za-z0-9]/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{20,}/,
];
for (const f of scanFiles) {
  const body = read(f);
  for (const pat of REAL_SECRET_PATTERNS) {
    assert(!pat.test(body), `secret-scan: ${f} must not contain a real-secret-format value (${pat}).`);
  }
  // No console logging of a token/secret value.
  assert(!/console\.(log|info|debug|warn|error)\([^)]*(accessToken|access_token|appsecret|app_secret|appkey|app_key|bearer|ciphertext|encryptionKey|authTag)/i.test(body),
    `secret-scan: ${f} must not log a token/secret value.`);
}
// The manager/telemetry must never put the raw token into telemetry metadata.
assert(!/metadata:\s*\{[^}]*accessToken/.test(read(`${KIS_DIR}/kisTokenManager.ts`)), 'telemetry metadata must never include the access token.');

// --- 14. package.json scripts + result doc + changelog ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf2"') && pkg.includes('"check:phase-3gg-t-hf2"'), 'package.json must define the phase scripts.');
const doc = read(RESULT_DOC);
const docLower = doc.toLowerCase();
for (const token of [BASELINE, 'AES-256-GCM', 'KIS-TOKEN']) {
  assert(doc.includes(token), `result doc missing token: ${token}`);
}
for (const token of ['distributed lease', 'not applied']) {
  assert(docLower.includes(token), `result doc missing token: ${token}`);
}
assert(read(CHANGELOG).includes('## Phase 3GG-T-HF2'), 'changelog must contain the Phase 3GG-T-HF2 entry.');

// --- 15. Migration not applied remotely (documented, not verifiable here) ---
assert(mig.includes('do NOT execute via Claude Code') || mig.includes('Apply via Supabase Dashboard'), 'migration must carry the apply-via-dashboard note (not applied remotely).');

// --- 16. .env / .vercel never staged ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF2 contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
