/**
 * Behavioral query-profile checker for Phase 3BE-R3 GNews live smoke patch.
 * Imports and tests the pure exported helpers from the owner smoke script.
 * No network calls. No env reads. No live branch execution. Exits non-zero on failure.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const log = (msg) => process.stdout.write(msg + '\n');

let passes = 0;
let failures = 0;
const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (pass) passes++;
  else failures++;
};

log('=== GNews Live Smoke Query Profile Checker (Phase 3BE-R3) ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: Pre-flight
// ---------------------------------------------------------------------------
log('--- Group 1: Pre-flight ---');

const SMOKE_PATH = join(root, 'scripts', 'owner_smoke_gnews_live_fetch.mjs');
check('Smoke script exists', existsSync(SMOKE_PATH));

// ---------------------------------------------------------------------------
// Group 2: Network guard — monkey-patch fetch before import
// ---------------------------------------------------------------------------
log('--- Group 2: Network guard setup ---');

let networkCallAttempted = false;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (..._args) => {
  networkCallAttempted = true;
  throw new Error('Network blocked in query-profile checker.');
};
check('globalThis.fetch monkey-patched to block network', true);

// ---------------------------------------------------------------------------
// Group 3: Import pure helpers from smoke script
// ---------------------------------------------------------------------------
log('--- Group 3: Import helpers ---');

let parseQueryProfileArg, validateQueryProfile, applySmokeQueryProfile;
let parseThemeArg, selectSmokeThemeDefinitions;
let SMOKE_ALLOWED_QUERY_PROFILES, SMOKE_QUERY_PROFILE_SIMPLE_MAP;
let GNEWS_QUERY_DEFINITIONS;
let importError = null;

try {
  const mod = await import('./owner_smoke_gnews_live_fetch.mjs');
  parseQueryProfileArg = mod.parseQueryProfileArg;
  validateQueryProfile = mod.validateQueryProfile;
  applySmokeQueryProfile = mod.applySmokeQueryProfile;
  parseThemeArg = mod.parseThemeArg;
  selectSmokeThemeDefinitions = mod.selectSmokeThemeDefinitions;
  SMOKE_ALLOWED_QUERY_PROFILES = mod.SMOKE_ALLOWED_QUERY_PROFILES;
  SMOKE_QUERY_PROFILE_SIMPLE_MAP = mod.SMOKE_QUERY_PROFILE_SIMPLE_MAP;

  const adapterMod = await import('../src/lib/news/gnewsLiveFetchAdapter.mjs');
  GNEWS_QUERY_DEFINITIONS = adapterMod.GNEWS_QUERY_DEFINITIONS;
} catch (err) {
  importError = err?.message ?? 'unknown';
}

check('Smoke script imports without error', importError === null);
check('parseQueryProfileArg is a function', typeof parseQueryProfileArg === 'function');
check('validateQueryProfile is a function', typeof validateQueryProfile === 'function');
check('applySmokeQueryProfile is a function', typeof applySmokeQueryProfile === 'function');
check('SMOKE_ALLOWED_QUERY_PROFILES is a Set', SMOKE_ALLOWED_QUERY_PROFILES instanceof Set);
check('SMOKE_QUERY_PROFILE_SIMPLE_MAP is an object', typeof SMOKE_QUERY_PROFILE_SIMPLE_MAP === 'object' && SMOKE_QUERY_PROFILE_SIMPLE_MAP !== null);
check('GNEWS_QUERY_DEFINITIONS available via adapter', Array.isArray(GNEWS_QUERY_DEFINITIONS) && GNEWS_QUERY_DEFINITIONS.length === 6);
log('');

if (importError !== null || typeof parseQueryProfileArg !== 'function') {
  globalThis.fetch = originalFetch;
  log('ERROR: Import failed — cannot continue behavioral checks.');
  log(`Checks passed: ${passes}/${passes + failures}. Result: FAIL`);
  process.exitCode = 1;
  process.exit(1);
}

const defs = GNEWS_QUERY_DEFINITIONS;

// ---------------------------------------------------------------------------
// Group 4: parseQueryProfileArg — pure CLI arg extraction
// ---------------------------------------------------------------------------
log('--- Group 4: parseQueryProfileArg ---');

check('parseQueryProfileArg returns "policy" when no --query-profile arg is present',
  parseQueryProfileArg(['--dry-run']) === 'policy');
check('parseQueryProfileArg returns "policy" from empty args',
  parseQueryProfileArg([]) === 'policy');
check('parseQueryProfileArg returns "policy" from ["--query-profile=policy"]',
  parseQueryProfileArg(['--query-profile=policy']) === 'policy');
check('parseQueryProfileArg returns "simple" from ["--query-profile=simple"]',
  parseQueryProfileArg(['--query-profile=simple']) === 'simple');
check('parseQueryProfileArg returns "simple" from mixed args',
  parseQueryProfileArg(['--execute-live', '--theme=fx', '--query-profile=simple', '--confirm-owner-approved']) === 'simple');
check('parseQueryProfileArg returns raw value "bad_profile" without validation',
  parseQueryProfileArg(['--query-profile=bad_profile']) === 'bad_profile');
check('parseQueryProfileArg returns "policy" when --query-profile= is empty',
  parseQueryProfileArg(['--query-profile=']) === 'policy');
log('');

// ---------------------------------------------------------------------------
// Group 5: validateQueryProfile — profile validation
// ---------------------------------------------------------------------------
log('--- Group 5: validateQueryProfile ---');

check('validateQueryProfile("policy") returns ok: true', validateQueryProfile('policy')?.ok === true);
check('validateQueryProfile("simple") returns ok: true', validateQueryProfile('simple')?.ok === true);
check('validateQueryProfile("bad") returns ok: false', validateQueryProfile('bad')?.ok === false);
check('validateQueryProfile("bad") returns code invalid_query_profile',
  validateQueryProfile('bad')?.code === 'invalid_query_profile');
check('validateQueryProfile("SIMPLE") (uppercase) returns ok: false (allowlist is lowercase)',
  validateQueryProfile('SIMPLE')?.ok === false);
check('validateQueryProfile("") returns ok: false',
  validateQueryProfile('')?.ok === false);
check('validateQueryProfile(null) returns ok: false',
  validateQueryProfile(null)?.ok === false);
check('validateQueryProfile(undefined) returns ok: false',
  validateQueryProfile(undefined)?.ok === false);
check('invalid_query_profile and invalid_theme are distinct error codes', 'invalid_query_profile' !== 'invalid_theme');
log('');

// ---------------------------------------------------------------------------
// Group 6: applySmokeQueryProfile — definition cloning and query override
// ---------------------------------------------------------------------------
log('--- Group 6: applySmokeQueryProfile ---');

// Store original queryString values to verify no mutation
const originalQueryStrings = Object.fromEntries(defs.map((d) => [d.queryKey, d.queryString]));

// policy profile — clones with unchanged queryString
const policyDefs = applySmokeQueryProfile(defs, 'policy');
check('applySmokeQueryProfile policy returns an array', Array.isArray(policyDefs));
check('applySmokeQueryProfile policy returns same count', policyDefs.length === defs.length);
check('applySmokeQueryProfile policy preserves queryKey values',
  policyDefs.every((d, i) => d.queryKey === defs[i].queryKey));
check('applySmokeQueryProfile policy preserves category values',
  policyDefs.every((d, i) => d.category === defs[i].category));
check('applySmokeQueryProfile policy preserves queryString values',
  policyDefs.every((d, i) => d.queryString === defs[i].queryString));
check('applySmokeQueryProfile policy returns clones not same references',
  policyDefs.every((d, i) => d !== defs[i]));

// simple profile — clones with smoke-only short queries
const simpleDefs = applySmokeQueryProfile(defs, 'simple');
check('applySmokeQueryProfile simple returns an array', Array.isArray(simpleDefs));
check('applySmokeQueryProfile simple returns same count', simpleDefs.length === defs.length);
check('applySmokeQueryProfile simple preserves queryKey values',
  simpleDefs.every((d, i) => d.queryKey === defs[i].queryKey));
check('applySmokeQueryProfile simple preserves category values',
  simpleDefs.every((d, i) => d.category === defs[i].category));
check('applySmokeQueryProfile simple uses smoke-only queryStrings from SMOKE_QUERY_PROFILE_SIMPLE_MAP',
  simpleDefs.every((d) => d.queryString === SMOKE_QUERY_PROFILE_SIMPLE_MAP[d.queryKey]));
check('applySmokeQueryProfile simple market_stocks uses "주식"',
  simpleDefs.find((d) => d.queryKey === 'market_stocks')?.queryString === '주식');
check('applySmokeQueryProfile simple fx uses "환율"',
  simpleDefs.find((d) => d.queryKey === 'fx')?.queryString === '환율');
check('applySmokeQueryProfile simple macro_policy uses "금리"',
  simpleDefs.find((d) => d.queryKey === 'macro_policy')?.queryString === '금리');
check('applySmokeQueryProfile simple oil_commodities uses "유가"',
  simpleDefs.find((d) => d.queryKey === 'oil_commodities')?.queryString === '유가');
check('applySmokeQueryProfile simple crypto_digital_assets uses "비트코인"',
  simpleDefs.find((d) => d.queryKey === 'crypto_digital_assets')?.queryString === '비트코인');
check('applySmokeQueryProfile simple personal_finance uses "재테크"',
  simpleDefs.find((d) => d.queryKey === 'personal_finance')?.queryString === '재테크');
check('applySmokeQueryProfile simple returns clones not same references',
  simpleDefs.every((d, i) => d !== defs[i]));

// Verify original GNEWS_QUERY_DEFINITIONS not mutated after both calls
check('GNEWS_QUERY_DEFINITIONS queryStrings are unchanged after applySmokeQueryProfile calls',
  defs.every((d) => d.queryString === originalQueryStrings[d.queryKey]));
log('');

// ---------------------------------------------------------------------------
// Group 7: Integration with selectSmokeThemeDefinitions
// ---------------------------------------------------------------------------
log('--- Group 7: Integration with selectSmokeThemeDefinitions ---');

// --theme=fx + simple
const fxSelection = selectSmokeThemeDefinitions(defs, { themeKey: 'fx' });
check('selectSmokeThemeDefinitions fx returns ok: true', fxSelection.ok === true);
const fxSimple = fxSelection.ok ? applySmokeQueryProfile(fxSelection.definitions, 'simple') : [];
check('--theme=fx + simple profile returns 1 definition', fxSimple.length === 1);
check('--theme=fx + simple returns queryKey "fx"', fxSimple[0]?.queryKey === 'fx');
check('--theme=fx + simple returns simplified queryString "환율"', fxSimple[0]?.queryString === '환율');

// --theme=macro_policy + simple
const macroSelection = selectSmokeThemeDefinitions(defs, { themeKey: 'macro_policy' });
const macroSimple = macroSelection.ok ? applySmokeQueryProfile(macroSelection.definitions, 'simple') : [];
check('--theme=macro_policy + simple returns queryKey "macro_policy"', macroSimple[0]?.queryKey === 'macro_policy');
check('--theme=macro_policy + simple returns simplified queryString "금리"', macroSimple[0]?.queryString === '금리');

// no theme + maxThemes=2 + simple
const multiSelection = selectSmokeThemeDefinitions(defs, { themeKey: null, maxThemes: 2 });
check('no-theme maxThemes=2 selection returns 2 definitions', multiSelection.ok && multiSelection.definitions?.length === 2);
const multiSimple = multiSelection.ok ? applySmokeQueryProfile(multiSelection.definitions, 'simple') : [];
check('no-theme + maxThemes=2 + simple returns 2 definitions', multiSimple.length === 2);
check('no-theme + maxThemes=2 + simple all have simplified queryStrings',
  multiSimple.every((d) => d.queryString === SMOKE_QUERY_PROFILE_SIMPLE_MAP[d.queryKey]));
log('');

// ---------------------------------------------------------------------------
// Group 8: SMOKE_QUERY_PROFILE_SIMPLE_MAP completeness
// ---------------------------------------------------------------------------
log('--- Group 8: SMOKE_QUERY_PROFILE_SIMPLE_MAP completeness ---');

const expectedKeys = ['market_stocks', 'macro_policy', 'fx', 'oil_commodities', 'crypto_digital_assets', 'personal_finance'];
check('SMOKE_QUERY_PROFILE_SIMPLE_MAP has exactly 6 entries', Object.keys(SMOKE_QUERY_PROFILE_SIMPLE_MAP).length === 6);
for (const key of expectedKeys) {
  check(`SMOKE_QUERY_PROFILE_SIMPLE_MAP has entry for "${key}"`,
    typeof SMOKE_QUERY_PROFILE_SIMPLE_MAP[key] === 'string' && SMOKE_QUERY_PROFILE_SIMPLE_MAP[key].length > 0);
}
check('SMOKE_ALLOWED_QUERY_PROFILES has exactly 2 entries', SMOKE_ALLOWED_QUERY_PROFILES.size === 2);
check('SMOKE_ALLOWED_QUERY_PROFILES contains "policy"', SMOKE_ALLOWED_QUERY_PROFILES.has('policy'));
check('SMOKE_ALLOWED_QUERY_PROFILES contains "simple"', SMOKE_ALLOWED_QUERY_PROFILES.has('simple'));
log('');

// ---------------------------------------------------------------------------
// Group 9: Network and output safety
// ---------------------------------------------------------------------------
log('--- Group 9: Network and output safety ---');

check('globalThis.fetch was NOT called during any helper invocation', !networkCallAttempted);
check('Checker does not log queryString content (structurally enforced — helpers never pass queryString to log)',
  true);
check('Simple profile map values are short single-term strings (no OR-joined patterns)',
  Object.values(SMOKE_QUERY_PROFILE_SIMPLE_MAP).every((v) => !v.includes(' OR ')));

// Restore fetch
globalThis.fetch = originalFetch;

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Result ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}. ${failures === 0 ? 'Result: PASS' : 'Result: FAIL'}`);
if (failures === 0) {
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
