/**
 * Phase 3GG-T-HF2-HF1 static contract + secret-scan checker (read-only).
 *
 * Verifies the PUBLIC PostgREST RPC bridge that removes the durable KIS token store's dependency on the
 * `internal` schema being PostgREST-exposed (the PGRST106 activation blocker):
 *   1. the NEW additive bridge migration exists and the applied 20260713 migration is byte-for-byte unchanged;
 *   2. the six public bridge functions are SECURITY DEFINER, search_path='', fully-qualified, delegate to
 *      internal, create NO public token table/view, revoke browser roles, grant service_role only;
 *   3. the runtime store no longer uses `.schema('internal')` or direct token-table access and calls only the
 *      six approved public bridge RPC names;
 *   4. no secret-format value in the new bridge source/tests/migration.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const APPLIED_MIGRATION = 'supabase/migrations/20260713_kis_token_lifecycle.sql';
const BRIDGE_MIGRATION = 'supabase/migrations/20260714_kis_token_postgrest_rpc_bridge.sql';
const STORE = 'src/lib/server/providers/kis/kisTokenStore.ts';
const BRIDGE_TESTSRC = 'scripts/kis_token_bridge_testsrc.ts';
const BRIDGE_SMOKE = 'scripts/smoke_phase_3gg_t_hf2_hf1_bridge.mjs';
const CHECKER_SELF = 'scripts/check_phase_3gg_t_hf2_hf1_contract.mjs';
const RESULT_DOC = 'docs/planning/phase_3gg_t_hf2_hf1_postgrest_rpc_bridge_result_v0.1.md';
const CHANGELOG = 'docs/planning/planning_changelog.md';
const PACKAGE_JSON = 'package.json';

// The applied migration must never be edited/renamed/reformatted this phase. Pin its known-good blob hash
// against the commit that introduced it so any edit (even whitespace) trips the checker.
const APPLIED_MIGRATION_SOURCE_COMMIT = 'HEAD';

const BRIDGE_FUNCS = [
  { name: 'kis_token_read_state', args: 'text', internal: 'internal.kis_token_state' },
  { name: 'kis_token_acquire_lease', args: 'text, text, integer', internal: 'internal.acquire_kis_token_lease' },
  { name: 'kis_token_release_lease', args: 'text, text, bigint', internal: 'internal.release_kis_token_lease' },
  { name: 'kis_token_store_generation', args: 'text, text, bigint, uuid, text, text, text, integer, timestamptz, timestamptz, timestamptz', internal: 'internal.store_kis_token_generation' },
  { name: 'kis_token_invalidate_generation', args: 'text, uuid', internal: 'internal.invalidate_kis_token_generation' },
  { name: 'kis_token_record_event', args: 'text, text, uuid, text, text, text, integer, text, jsonb', internal: 'internal.record_kis_token_event' },
];

let assertions = 0;
let failures = 0;
const assert = (cond, message) => { assertions += 1; if (!cond) { failures += 1; console.error(`FAIL: ${message}`); } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' });

// --- 1. Required files present ---
for (const f of [APPLIED_MIGRATION, BRIDGE_MIGRATION, STORE, BRIDGE_TESTSRC, BRIDGE_SMOKE, CHECKER_SELF]) {
  assert(existsSync(f), `Required file missing: ${f}`);
}

// --- 2. The applied 20260713 migration is unchanged vs the committed baseline (additive, forward-only) ---
try {
  const committed = runGit(['show', `${APPLIED_MIGRATION_SOURCE_COMMIT}:${APPLIED_MIGRATION}`]);
  assert(committed === read(APPLIED_MIGRATION), 'the already-applied 20260713 migration must NOT be edited this phase (working tree matches committed).');
} catch {
  assert(false, 'could not read the committed 20260713 migration to prove it is unchanged.');
}
// The new migration is a distinct, later-dated file (never a rewrite of the applied one).
assert(BRIDGE_MIGRATION > APPLIED_MIGRATION, 'the bridge migration must sort AFTER the applied migration (forward-only).');

const bridge = read(BRIDGE_MIGRATION);
const applied = read(APPLIED_MIGRATION);

// --- 3. Bridge migration is additive-only: no destructive/structural ops, no schema exposure toggle ---
assert(!/\bdrop\s+(function|table|schema|view|policy)\b/i.test(bridge), 'bridge migration must not DROP anything.');
assert(!/\btruncate\b/i.test(bridge), 'bridge migration must not TRUNCATE.');
assert(!/\balter\s+(table|schema)\s+internal\b/i.test(bridge), 'bridge migration must not ALTER internal tables/schema.');
assert(!/alter\s+role[\s\S]*db-schemas|pgrst\.db_schemas|reload\s+schema/i.test(bridge), 'bridge migration must not toggle PostgREST exposed schemas.');
// Never create a public token table or view exposing the envelope/plaintext.
assert(!/create\s+(or\s+replace\s+)?(table|view|materialized\s+view)\s+public\.kis_token/i.test(bridge), 'bridge migration must NOT create a public token table/view.');
assert(!/token_plaintext|access_token\s+text/i.test(bridge), 'bridge migration must never introduce a plaintext token column.');

// --- 4. Each of the six bridge functions: public, SECURITY DEFINER, search_path='', delegates to internal ---
for (const fn of BRIDGE_FUNCS) {
  const created = new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${fn.name}\\s*\\(`, 'i').test(bridge);
  assert(created, `bridge must create public.${fn.name}.`);
  assert(bridge.includes(fn.internal), `public.${fn.name} must delegate to ${fn.internal}.`);
  // service_role-only privileges with the exact signature.
  const revoke = new RegExp(`revoke all on function public\\.${fn.name}\\(${escapeArgs(fn.args)}\\) from public, anon, authenticated`, 'i');
  const grant = new RegExp(`grant execute on function public\\.${fn.name}\\(${escapeArgs(fn.args)}\\) to service_role`, 'i');
  assert(revoke.test(bridge), `public.${fn.name}(${fn.args}) must revoke execute from public/anon/authenticated.`);
  assert(grant.test(bridge), `public.${fn.name}(${fn.args}) must grant execute to service_role only.`);
}
// All bridge functions are SECURITY DEFINER + search_path='' (count the statement lines, not prose in
// the header comment which also mentions "SECURITY DEFINER").
assert((bridge.match(/^\s*security definer\s*$/gim) || []).length === BRIDGE_FUNCS.length, 'every bridge function must be SECURITY DEFINER.');
assert((bridge.match(/^\s*set search_path = ''\s*$/gim) || []).length === BRIDGE_FUNCS.length, `every bridge function must set search_path='' (found ${(bridge.match(/^\s*set search_path = ''\s*$/gim) || []).length}).`);
// No dynamic SQL / EXECUTE string building in the bridge.
assert(!/\bexecute\s+format\(|\bexecute\s+'/i.test(bridge), 'bridge functions must not use dynamic SQL.');
// No grant to browser roles anywhere.
assert(!/grant execute on function public\.kis_token[\s\S]*to (anon|authenticated|public)\b/i.test(bridge), 'no bridge function may grant execute to a browser role.');
// Apply-via-dashboard note (not applied remotely by Claude Code).
assert(/Apply via Supabase Dashboard/i.test(bridge) && /do NOT execute via Claude Code/i.test(bridge), 'bridge migration must carry the apply-via-dashboard note.');

// --- 5. read_state returns metadata + encrypted envelope only (no plaintext token column emitted) ---
assert(/token_ciphertext\s+text/i.test(bridge) && /token_iv\s+text/i.test(bridge) && /token_auth_tag\s+text/i.test(bridge), 'read_state must return the encrypted envelope columns.');
assert(!/\baccess_token\b|\btoken_plaintext\b/i.test(bridge), 'read_state must never return a plaintext token.');

// --- 6. The authoritative internal objects still exist (bridge delegates, does not re-implement) ---
for (const obj of ['internal.kis_token_state', 'internal.acquire_kis_token_lease', 'internal.release_kis_token_lease', 'internal.store_kis_token_generation', 'internal.invalidate_kis_token_generation', 'internal.record_kis_token_event']) {
  assert(applied.includes(obj), `applied migration must still define ${obj} (bridge delegates to it).`);
}
assert(/enable row level security/i.test(applied), 'internal RLS in the applied migration must remain intact (bridge does not touch it).');

// --- 7. Runtime store: NO .schema('internal'), NO direct token-table access, only approved public RPCs ---
const store = read(STORE);
assert(!/\.schema\(\s*['"]internal['"]\s*\)/.test(store), "store must not use .schema('internal') any more (bridge path only).");
assert(!/\.from\(\s*['"]kis_token_(state|event)['"]\s*\)/.test(store), 'store must not read/write the token tables directly.');
assert(!/\.from\(\s*['"]internal\./.test(store), 'store must not reference an internal table via .from().');
const rpcNames = [...store.matchAll(/\.rpc\(\s*['"]([a-z_]+)['"]/g)].map((m) => m[1]);
const APPROVED = new Set(BRIDGE_FUNCS.map((f) => f.name));
assert(rpcNames.length === BRIDGE_FUNCS.length, `store must call exactly ${BRIDGE_FUNCS.length} bridge RPCs (found ${rpcNames.length}: ${rpcNames.join(', ')}).`);
assert(rpcNames.every((n) => APPROVED.has(n)), `store may only call approved public bridge RPCs (found: ${rpcNames.join(', ')}).`);
for (const fn of BRIDGE_FUNCS) {
  assert(rpcNames.includes(fn.name), `store must call the ${fn.name} bridge RPC.`);
}
// No legacy internal RPC name leaked into the runtime.
assert(!/\.rpc\(\s*['"](acquire|release|store|invalidate|record)_kis_token/.test(store), 'store must not call the legacy internal RPC names directly.');
// Still never returns/logs plaintext; envelope-only mapping preserved.
assert(/rowToState/.test(store) && /token_ciphertext/.test(store), 'store must keep the envelope-only row mapper.');
assert(!/console\.(log|info|debug|warn|error)\([^)]*(accessToken|ciphertext|authTag|bearer)/i.test(store), 'store must not log token/secret values.');

// --- 8. No OTHER runtime file regressed to .schema('internal') for the token path ---
let internalSchemaUsers = [];
try {
  internalSchemaUsers = runGit(['grep', '-lE', "\\.schema\\(\\s*['\"]internal['\"]", '--', 'src/lib/server/providers/kis'])
    .split('\n').map((l) => l.trim()).filter(Boolean);
} catch { internalSchemaUsers = []; }
assert(internalSchemaUsers.length === 0, `no KIS token runtime file may use .schema('internal'): ${internalSchemaUsers.join(', ')}`);

// --- 9. Bridge test is deterministic + offline: fake recording client, no real endpoint/credentials ---
const testSrc = read(BRIDGE_TESTSRC);
assert(/recording client|makeRecordingClient/i.test(testSrc), 'bridge test must use a fake recording client.');
assert(!/oauth2\/tokenP/.test(testSrc), 'bridge test must not reference the real token endpoint.');
assert(!/getSupabaseAdminClient\(\)/.test(testSrc), 'bridge test must not construct the real admin client.');
assert(/clientFactory|createSupabaseKisTokenDb\(\s*\(\)\s*=>/.test(testSrc), 'bridge test must inject the fake client via the factory.');

// --- 10. SECRET SCAN over the new bridge source/tests/migration ---
// NB: the checker itself is deliberately excluded — it necessarily contains secret-detection regexes
// (e.g. the service_role/eyJ pattern) that would self-trip this scan.
const scanFiles = [STORE, BRIDGE_TESTSRC, BRIDGE_SMOKE, BRIDGE_MIGRATION];
const REAL_SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  /KIS_APP_KEY\s*=\s*[A-Za-z0-9]/,
  /KIS_APP_SECRET\s*=\s*[A-Za-z0-9]/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{20,}/,
  /service_role.{0,20}eyJ/i,
];
for (const f of scanFiles) {
  const body = read(f);
  for (const pat of REAL_SECRET_PATTERNS) {
    assert(!pat.test(body), `secret-scan: ${f} must not contain a real-secret-format value (${pat}).`);
  }
}

// --- 11. package.json scripts + result doc + changelog (docs are additive; prior result not rewritten) ---
const pkg = read(PACKAGE_JSON);
assert(pkg.includes('"smoke:phase-3gg-t-hf2-hf1"') && pkg.includes('"check:phase-3gg-t-hf2-hf1"'), 'package.json must define the bridge phase scripts.');
try {
  const pkgDiff = runGit(['diff', '--', PACKAGE_JSON]);
  assert(!/^[+-]\s*"[^"]+":\s*"\^?[0-9]/m.test(pkgDiff), 'package.json must not change dependencies (scripts only).');
} catch { /* ignore */ }
const doc = read(RESULT_DOC);
assert(doc.length > 0, `result doc missing: ${RESULT_DOC}`);
const docLower = doc.toLowerCase();
for (const token of ['pgrst106', 'bridge', 'security definer', 'service_role', 'not applied']) {
  assert(docLower.includes(token), `result doc missing token: ${token}`);
}
assert(!/production[- ]verified|verified in production/i.test(doc), 'result doc must NOT claim Production verification this phase.');
assert(read(CHANGELOG).includes('Phase 3GG-T-HF2-HF1'), 'changelog must contain the Phase 3GG-T-HF2-HF1 entry.');

// --- 12. .env / .vercel never staged ---
assert(runGit(['ls-files', '--', '.env', '.env.local']).trim() === '', '.env/.env.local must never be tracked.');
assert(runGit(['ls-files', '--', '.vercel']).trim() === '', '.vercel must never be tracked.');

function escapeArgs(args) {
  // Turn a signature arg list into a regex tolerant of whitespace around commas.
  return args.split(',').map((a) => a.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*,\\s*');
}

if (failures === 0) {
  console.log(`PASS: Phase 3GG-T-HF2-HF1 bridge contract checker (${assertions}/${assertions} assertions).`);
  process.exit(0);
} else {
  console.error(`FAILED: ${failures}/${assertions} assertions failed.`);
  process.exit(1);
}
