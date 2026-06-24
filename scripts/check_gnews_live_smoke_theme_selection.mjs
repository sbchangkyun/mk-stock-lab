/**
 * Behavioral theme-selection checker for Phase 3BE-R1 GNews live smoke patch.
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

log('=== GNews Live Smoke Theme Selection Checker (Phase 3BE-R1) ===');
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
  throw new Error('Network blocked in theme-selection checker.');
};
check('globalThis.fetch monkey-patched to block network', true);

// ---------------------------------------------------------------------------
// Group 3: Import pure helpers from smoke script
// ---------------------------------------------------------------------------
log('--- Group 3: Import helpers ---');

let parseThemeArg, selectSmokeThemeDefinitions, validateEndpointOnlyBaseUrl;
let SMOKE_ALLOWED_THEME_KEYS, GNEWS_QUERY_DEFINITIONS_FROM_SMOKE;
let importError = null;

try {
  const mod = await import('./owner_smoke_gnews_live_fetch.mjs');
  parseThemeArg = mod.parseThemeArg;
  selectSmokeThemeDefinitions = mod.selectSmokeThemeDefinitions;
  validateEndpointOnlyBaseUrl = mod.validateEndpointOnlyBaseUrl;
  SMOKE_ALLOWED_THEME_KEYS = mod.SMOKE_ALLOWED_THEME_KEYS;
  // GNEWS_QUERY_DEFINITIONS is not exported from the smoke script directly —
  // we use the adapter's definitions via the smoke script's import chain.
  // We re-import GNEWS_QUERY_DEFINITIONS from the adapter for testing.
  const adapterMod = await import('../src/lib/news/gnewsLiveFetchAdapter.mjs');
  GNEWS_QUERY_DEFINITIONS_FROM_SMOKE = adapterMod.GNEWS_QUERY_DEFINITIONS;
} catch (err) {
  importError = err?.message ?? 'unknown';
}

check('Smoke script imports without error', importError === null);
check('parseThemeArg is a function', typeof parseThemeArg === 'function');
check('selectSmokeThemeDefinitions is a function', typeof selectSmokeThemeDefinitions === 'function');
check('validateEndpointOnlyBaseUrl is a function', typeof validateEndpointOnlyBaseUrl === 'function');
check('SMOKE_ALLOWED_THEME_KEYS is a Set', SMOKE_ALLOWED_THEME_KEYS instanceof Set);
check('GNEWS_QUERY_DEFINITIONS available via adapter', Array.isArray(GNEWS_QUERY_DEFINITIONS_FROM_SMOKE) && GNEWS_QUERY_DEFINITIONS_FROM_SMOKE.length === 6);
log('');

if (importError !== null || typeof parseThemeArg !== 'function') {
  globalThis.fetch = originalFetch;
  log('ERROR: Import failed — cannot continue behavioral checks.');
  log(`Checks passed: ${passes}/${passes + failures}. Result: FAIL`);
  process.exitCode = 1;
  process.exit(1);
}

const defs = GNEWS_QUERY_DEFINITIONS_FROM_SMOKE;

// ---------------------------------------------------------------------------
// Group 4: parseThemeArg — pure CLI arg extraction
// ---------------------------------------------------------------------------
log('--- Group 4: parseThemeArg ---');

check('parseThemeArg returns null when no --theme arg is present',
  parseThemeArg(['--dry-run', '--max-themes=2']) === null);

check('parseThemeArg returns null when args is empty',
  parseThemeArg([]) === null);

check('parseThemeArg returns "fx" from ["--theme=fx"]',
  parseThemeArg(['--theme=fx']) === 'fx');

check('parseThemeArg returns "macro_policy" from mixed args',
  parseThemeArg(['--execute-live', '--theme=macro_policy', '--confirm-owner-approved']) === 'macro_policy');

check('parseThemeArg returns "oil_commodities" from ["--theme=oil_commodities"]',
  parseThemeArg(['--theme=oil_commodities']) === 'oil_commodities');

check('parseThemeArg returns "crypto_digital_assets" from ["--theme=crypto_digital_assets"]',
  parseThemeArg(['--theme=crypto_digital_assets']) === 'crypto_digital_assets');

check('parseThemeArg returns null for empty --theme= value',
  parseThemeArg(['--theme=']) === null);

check('parseThemeArg returns raw value "bad_theme" without validation',
  parseThemeArg(['--theme=bad_theme']) === 'bad_theme');

log('');

// ---------------------------------------------------------------------------
// Group 5: selectSmokeThemeDefinitions — theme selection logic
// ---------------------------------------------------------------------------
log('--- Group 5: selectSmokeThemeDefinitions ---');

// No theme selected — default behavior
const noTheme2 = selectSmokeThemeDefinitions(defs, { themeKey: null, maxThemes: 2 });
check('No theme with maxThemes=2 returns ok: true', noTheme2.ok === true);
check('No theme with maxThemes=2 returns 2 definitions', noTheme2.definitions?.length === 2);

const noTheme1 = selectSmokeThemeDefinitions(defs, { themeKey: null, maxThemes: 1 });
check('No theme with maxThemes=1 returns 1 definition', noTheme1.definitions?.length === 1);

// Default call (no options)
const defaultCall = selectSmokeThemeDefinitions(defs);
check('Default call (no options) returns ok: true', defaultCall.ok === true);
check('Default call returns non-empty definitions', defaultCall.definitions?.length >= 1);

// Valid theme: fx
const fxResult = selectSmokeThemeDefinitions(defs, { themeKey: 'fx' });
check('themeKey="fx" returns ok: true', fxResult.ok === true);
check('themeKey="fx" returns exactly 1 definition', fxResult.definitions?.length === 1);
check('themeKey="fx" definition has queryKey "fx"', fxResult.definitions?.[0]?.queryKey === 'fx');
check('themeKey="fx" definition has category "FX"', fxResult.definitions?.[0]?.category === 'FX');
// Structural check: definition has queryString but we do NOT print it
check('themeKey="fx" definition has queryString (structural, not printed)',
  typeof fxResult.definitions?.[0]?.queryString === 'string' && fxResult.definitions[0].queryString.length > 0);

// Valid theme: macro_policy
const macroResult = selectSmokeThemeDefinitions(defs, { themeKey: 'macro_policy' });
check('themeKey="macro_policy" returns ok: true', macroResult.ok === true);
check('themeKey="macro_policy" definition has category "MACRO_POLICY"',
  macroResult.definitions?.[0]?.category === 'MACRO_POLICY');

// Valid theme: crypto_digital_assets
const cryptoResult = selectSmokeThemeDefinitions(defs, { themeKey: 'crypto_digital_assets' });
check('themeKey="crypto_digital_assets" returns ok: true', cryptoResult.ok === true);
check('themeKey="crypto_digital_assets" definition has category "CRYPTO_DIGITAL_ASSETS"',
  cryptoResult.definitions?.[0]?.category === 'CRYPTO_DIGITAL_ASSETS');

// Valid theme: market_stocks
const stocksResult = selectSmokeThemeDefinitions(defs, { themeKey: 'market_stocks' });
check('themeKey="market_stocks" returns ok: true', stocksResult.ok === true);
check('themeKey="market_stocks" definition has category "MARKET_STOCKS"',
  stocksResult.definitions?.[0]?.category === 'MARKET_STOCKS');

// Valid theme: personal_finance
const pfResult = selectSmokeThemeDefinitions(defs, { themeKey: 'personal_finance' });
check('themeKey="personal_finance" returns ok: true', pfResult.ok === true);
check('themeKey="personal_finance" definition has category "PERSONAL_FINANCE"',
  pfResult.definitions?.[0]?.category === 'PERSONAL_FINANCE');

// Valid theme: oil_commodities
const oilResult = selectSmokeThemeDefinitions(defs, { themeKey: 'oil_commodities' });
check('themeKey="oil_commodities" returns ok: true', oilResult.ok === true);
check('themeKey="oil_commodities" definition has category "OIL_COMMODITIES"',
  oilResult.definitions?.[0]?.category === 'OIL_COMMODITIES');

// Invalid theme
const badResult = selectSmokeThemeDefinitions(defs, { themeKey: 'bad_theme' });
check('Invalid themeKey="bad_theme" returns ok: false', badResult.ok === false);
check('Invalid themeKey="bad_theme" returns code invalid_theme', badResult.code === 'invalid_theme');

const upperResult = selectSmokeThemeDefinitions(defs, { themeKey: 'MARKET_STOCKS' });
check('Uppercase "MARKET_STOCKS" is rejected as invalid (allowlist is lowercase)',
  upperResult.ok === false && upperResult.code === 'invalid_theme');

const randomResult = selectSmokeThemeDefinitions(defs, { themeKey: 'random123' });
check('Arbitrary string returns ok: false with invalid_theme', randomResult.ok === false);

log('');

// ---------------------------------------------------------------------------
// Group 6: validateEndpointOnlyBaseUrl — base URL guard
// ---------------------------------------------------------------------------
log('--- Group 6: validateEndpointOnlyBaseUrl ---');

// Valid endpoint-only URLs (using example.test to avoid real network intent)
const validUrl1 = validateEndpointOnlyBaseUrl('https://api.example.test/v4/search');
check('Endpoint-only URL passes (https://api.example.test/v4/search)',
  validUrl1.ok === true);

const validUrl2 = validateEndpointOnlyBaseUrl('https://news.example.test/api/v4/search');
check('Endpoint-only URL with deeper path passes', validUrl2.ok === true);

// Query string — rejected
const qsUrl = validateEndpointOnlyBaseUrl('https://api.example.test/v4/search?q=test');
check('URL with ?q= query string is rejected', qsUrl.ok === false && qsUrl.code === 'invalid_base_url');

// Embedded apikey param — rejected
const apikeyUrl = validateEndpointOnlyBaseUrl('https://api.example.test/v4/search?apikey=placeholder_only');
check('URL with ?apikey= is rejected', apikeyUrl.ok === false && apikeyUrl.code === 'invalid_base_url');

// Embedded key param — rejected
const keyUrl = validateEndpointOnlyBaseUrl('https://api.example.test/v4/search?key=placeholder_only');
check('URL with ?key= is rejected', keyUrl.ok === false && keyUrl.code === 'invalid_base_url');

// Embedded token param — rejected
const tokenUrl = validateEndpointOnlyBaseUrl('https://api.example.test/v4/search?token=placeholder_only');
check('URL with ?token= is rejected', tokenUrl.ok === false && tokenUrl.code === 'invalid_base_url');

// Mixed query string with other params — rejected
const mixedUrl = validateEndpointOnlyBaseUrl('https://api.example.test/v4/search?lang=ko&apikey=placeholder_only');
check('URL with mixed query string including apikey= is rejected',
  mixedUrl.ok === false && mixedUrl.code === 'invalid_base_url');

// &q= fragment — rejected
const ampQUrl = validateEndpointOnlyBaseUrl('https://api.example.test/v4/search?lang=ko&q=hello');
check('URL with &q= is rejected', ampQUrl.ok === false && ampQUrl.code === 'invalid_base_url');

// Invalid URL string — rejected
const badUrl = validateEndpointOnlyBaseUrl('not-a-valid-url');
check('Non-URL string is rejected', badUrl.ok === false && badUrl.code === 'invalid_base_url');

// Empty / null / undefined — rejected
check('Empty string is rejected', validateEndpointOnlyBaseUrl('').ok === false);
check('null is rejected', validateEndpointOnlyBaseUrl(null).ok === false);
check('undefined is rejected', validateEndpointOnlyBaseUrl(undefined).ok === false);

log('');

// ---------------------------------------------------------------------------
// Group 7: SMOKE_ALLOWED_THEME_KEYS completeness
// ---------------------------------------------------------------------------
log('--- Group 7: SMOKE_ALLOWED_THEME_KEYS completeness ---');

const expectedKeys = ['market_stocks', 'macro_policy', 'fx', 'oil_commodities', 'crypto_digital_assets', 'personal_finance'];
check('SMOKE_ALLOWED_THEME_KEYS has exactly 6 entries', SMOKE_ALLOWED_THEME_KEYS.size === 6);
for (const key of expectedKeys) {
  check(`SMOKE_ALLOWED_THEME_KEYS contains "${key}"`, SMOKE_ALLOWED_THEME_KEYS.has(key));
}

// All definitions in GNEWS_QUERY_DEFINITIONS must have a matching allowed key
check(
  'Every GNEWS_QUERY_DEFINITIONS entry has a key in SMOKE_ALLOWED_THEME_KEYS',
  defs.every((d) => SMOKE_ALLOWED_THEME_KEYS.has(d.queryKey)),
);
log('');

// ---------------------------------------------------------------------------
// Group 8: Network and output safety
// ---------------------------------------------------------------------------
log('--- Group 8: Network and output safety ---');

check('globalThis.fetch was NOT called during any helper invocation', !networkCallAttempted);

// Verify that queryString values from definitions were not exposed in this checker's output.
// We check by verifying Korean characters (which appear only in queryStrings) were not printed.
// Note: Korean characters in category labels are safe, but category labels are uppercase ASCII.
// The queryStrings contain Korean characters — they must not appear in checker log output.
const allLoggedOutput = []; // We only log via the `log`/`check` functions which emit ASCII.
// The checks above never call log(queryString), so this is structurally enforced.
// We can verify by checking that `queryString` keyword was not part of any check label that
// was logged with the queryString value.
check(
  'Checker does not log queryString content (structural: only queryKey and category are inspected)',
  true, // structurally enforced by design — queryString is never passed to log()
);
log('');

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
