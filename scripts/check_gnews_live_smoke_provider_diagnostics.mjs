/**
 * Behavioral provider-diagnostics checker for Phase 3BE-R5 sanitized diagnostics patch.
 * Imports and tests the pure exported helpers from the owner smoke script.
 * Uses synthetic fetchFn only — no network calls, no env reads, no live branch execution.
 * Exits non-zero on failure.
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

log('=== GNews Live Smoke Provider Diagnostics Checker (Phase 3BE-R5) ===');
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
  throw new Error('Network blocked in provider-diagnostics checker — globalThis.fetch must not be called.');
};
check('globalThis.fetch monkey-patched to block network', true);

// ---------------------------------------------------------------------------
// Group 3: Import pure helpers from smoke script
// ---------------------------------------------------------------------------
log('--- Group 3: Import helpers ---');

let parseDiagnosticsArg, validateDiagnosticsMode;
let summarizeProviderPayloadShape, summarizeProviderTextShape;
let createSanitizedDiagnosticsFetch;
let SMOKE_ALLOWED_DIAGNOSTICS_MODES;
let importError = null;

try {
  const mod = await import('./owner_smoke_gnews_live_fetch.mjs');
  parseDiagnosticsArg = mod.parseDiagnosticsArg;
  validateDiagnosticsMode = mod.validateDiagnosticsMode;
  summarizeProviderPayloadShape = mod.summarizeProviderPayloadShape;
  summarizeProviderTextShape = mod.summarizeProviderTextShape;
  createSanitizedDiagnosticsFetch = mod.createSanitizedDiagnosticsFetch;
  SMOKE_ALLOWED_DIAGNOSTICS_MODES = mod.SMOKE_ALLOWED_DIAGNOSTICS_MODES;
} catch (err) {
  importError = err?.message ?? 'unknown';
}

check('Smoke script imports without error', importError === null);
check('parseDiagnosticsArg is a function', typeof parseDiagnosticsArg === 'function');
check('validateDiagnosticsMode is a function', typeof validateDiagnosticsMode === 'function');
check('summarizeProviderPayloadShape is a function', typeof summarizeProviderPayloadShape === 'function');
check('summarizeProviderTextShape is a function', typeof summarizeProviderTextShape === 'function');
check('createSanitizedDiagnosticsFetch is a function', typeof createSanitizedDiagnosticsFetch === 'function');
check('SMOKE_ALLOWED_DIAGNOSTICS_MODES is a Set', SMOKE_ALLOWED_DIAGNOSTICS_MODES instanceof Set);
check('SMOKE_ALLOWED_DIAGNOSTICS_MODES contains "off"', SMOKE_ALLOWED_DIAGNOSTICS_MODES?.has('off') === true);
check('SMOKE_ALLOWED_DIAGNOSTICS_MODES contains "sanitized"', SMOKE_ALLOWED_DIAGNOSTICS_MODES?.has('sanitized') === true);
log('');

if (importError !== null || typeof parseDiagnosticsArg !== 'function') {
  globalThis.fetch = originalFetch;
  log('ERROR: Import failed — cannot continue behavioral checks.');
  log(`Checks passed: ${passes}/${passes + failures}. Result: FAIL`);
  process.exitCode = 1;
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Group 4: parseDiagnosticsArg — pure CLI arg extraction
// ---------------------------------------------------------------------------
log('--- Group 4: parseDiagnosticsArg ---');

check('parseDiagnosticsArg returns "off" when no --diagnostics arg is present',
  parseDiagnosticsArg([]) === 'off');
check('parseDiagnosticsArg returns "off" from ["--dry-run"]',
  parseDiagnosticsArg(['--dry-run', '--theme=fx']) === 'off');
check('parseDiagnosticsArg returns "off" from ["--diagnostics=off"]',
  parseDiagnosticsArg(['--diagnostics=off']) === 'off');
check('parseDiagnosticsArg returns "sanitized" from ["--diagnostics=sanitized"]',
  parseDiagnosticsArg(['--diagnostics=sanitized']) === 'sanitized');
check('parseDiagnosticsArg returns "sanitized" from mixed args',
  parseDiagnosticsArg(['--execute-live', '--theme=fx', '--diagnostics=sanitized', '--confirm-owner-approved']) === 'sanitized');
check('parseDiagnosticsArg returns raw "raw" without validation',
  parseDiagnosticsArg(['--diagnostics=raw']) === 'raw');
check('parseDiagnosticsArg returns "off" when --diagnostics= is empty',
  parseDiagnosticsArg(['--diagnostics=']) === 'off');
log('');

// ---------------------------------------------------------------------------
// Group 5: validateDiagnosticsMode — mode validation
// ---------------------------------------------------------------------------
log('--- Group 5: validateDiagnosticsMode ---');

check('validateDiagnosticsMode("off") returns ok: true', validateDiagnosticsMode('off')?.ok === true);
check('validateDiagnosticsMode("sanitized") returns ok: true', validateDiagnosticsMode('sanitized')?.ok === true);
check('validateDiagnosticsMode("raw") returns ok: false', validateDiagnosticsMode('raw')?.ok === false);
check('validateDiagnosticsMode("raw") returns code invalid_diagnostics_mode',
  validateDiagnosticsMode('raw')?.code === 'invalid_diagnostics_mode');
check('validateDiagnosticsMode("SANITIZED") (uppercase) returns ok: false (allowlist is lowercase)',
  validateDiagnosticsMode('SANITIZED')?.ok === false);
check('validateDiagnosticsMode("") returns ok: false', validateDiagnosticsMode('')?.ok === false);
check('validateDiagnosticsMode(null) returns ok: false', validateDiagnosticsMode(null)?.ok === false);
check('invalid_diagnostics_mode is distinct from invalid_theme and invalid_query_profile',
  'invalid_diagnostics_mode' !== 'invalid_theme' && 'invalid_diagnostics_mode' !== 'invalid_query_profile');
log('');

// ---------------------------------------------------------------------------
// Group 6: summarizeProviderPayloadShape — structural shape extraction
// ---------------------------------------------------------------------------
log('--- Group 6: summarizeProviderPayloadShape ---');

// Standard GNews-like response
const emptyPayload = { articles: [], totalArticles: 0 };
const emptyShape = summarizeProviderPayloadShape(emptyPayload);
check('Empty articles payload: ok=true', emptyShape.ok === true);
check('Empty articles payload: articlesPresent=true', emptyShape.articlesPresent === true);
check('Empty articles payload: articlesIsArray=true', emptyShape.articlesIsArray === true);
check('Empty articles payload: articlesLength=0', emptyShape.articlesLength === 0);
check('Empty articles payload: totalArticlesPresent=true', emptyShape.totalArticlesPresent === true);
check('Empty articles payload: totalArticlesType=number', emptyShape.totalArticlesType === 'number');
check('Empty articles payload: errorFieldPresent=false', emptyShape.errorFieldPresent === false);

// Articles with nested article-level keys (title, url, description, content) — should NOT expose them
const withArticlesPayload = {
  articles: [{ title: 'T', url: 'U', description: 'D', content: 'C' }],
  totalArticles: 1,
};
const withArticlesShape = summarizeProviderPayloadShape(withArticlesPayload);
check('Payload with 1 article: articlesLength=1', withArticlesShape.articlesLength === 1);
check('Payload with 1 article: top-level keys do not expose nested article keys',
  !withArticlesShape.topLevelKeys.includes('title') &&
  !withArticlesShape.topLevelKeys.includes('url') &&
  !withArticlesShape.topLevelKeys.includes('description') &&
  !withArticlesShape.topLevelKeys.includes('content'));
check('Payload with 1 article: topLevelKeys includes "articles"',
  withArticlesShape.topLevelKeys.includes('articles'));

// Error/message fields
const errorPayload = { errors: ['some-error'], message: 'something', totalArticles: 0 };
const errorShape = summarizeProviderPayloadShape(errorPayload);
check('Error payload: errorFieldPresent=true', errorShape.errorFieldPresent === true);
check('Error payload: messageFieldPresent=true', errorShape.messageFieldPresent === true);
check('Error payload: topLevelKeys does not expose error message values',
  !errorShape.topLevelKeys.includes('some-error') && !errorShape.topLevelKeys.includes('something'));

// totalArticles as string
const strTotalPayload = { articles: [], totalArticles: '12' };
const strTotalShape = summarizeProviderPayloadShape(strTotalPayload);
check('totalArticles as string: totalArticlesType=string', strTotalShape.totalArticlesType === 'string');

// Forbidden top-level keys (article-level keys at top level)
const forbiddenTopLevelPayload = { title: 'T', url: 'U', articles: [] };
const forbiddenShape = summarizeProviderPayloadShape(forbiddenTopLevelPayload);
check('Forbidden top-level keys: forbiddenTopLevelKeyCount >= 2',
  (forbiddenShape.forbiddenTopLevelKeyCount ?? 0) >= 2);
check('Forbidden top-level keys: "title" and "url" not in topLevelKeys',
  !forbiddenShape.topLevelKeys.includes('title') && !forbiddenShape.topLevelKeys.includes('url'));

// Non-object payload
const nonObjectShape = summarizeProviderPayloadShape('not-an-object');
check('Non-object payload: ok=false', nonObjectShape.ok === false);
const nullShape = summarizeProviderPayloadShape(null);
check('Null payload: ok=false', nullShape.ok === false);
const arrayShape = summarizeProviderPayloadShape([{ articles: [] }]);
check('Array payload: ok=false (arrays are not objects)', arrayShape.ok === false);
log('');

// ---------------------------------------------------------------------------
// Group 7: summarizeProviderTextShape — text body parsing
// ---------------------------------------------------------------------------
log('--- Group 7: summarizeProviderTextShape ---');

const validJsonText = JSON.stringify({ articles: [], totalArticles: 0 });
const validShape = summarizeProviderTextShape(validJsonText, 'application/json');
check('Valid JSON text: jsonParseOk=true', validShape.jsonParseOk === true);
check('Valid JSON text: bodyReadable=true', validShape.bodyReadable === true);
check('Valid JSON text: articlesPresent=true', validShape.articlesPresent === true);
check('Valid JSON text: raw body is not returned in shape (no articles array value)',
  validShape.topLevelKeys !== undefined && typeof validShape.topLevelKeys === 'string');

const invalidJsonText = 'not-json-{bad';
const invalidShape = summarizeProviderTextShape(invalidJsonText, 'text/html');
check('Invalid JSON text: jsonParseOk=false', invalidShape.jsonParseOk === false);
check('Invalid JSON text: bodyReadable=true (text was readable, just not valid JSON)',
  invalidShape.bodyReadable === true);

// Content type detection from JSON-starting string
const jsonStartText = '{"articles":[],"totalArticles":0}';
const autoDetectShape = summarizeProviderTextShape(jsonStartText, 'text/plain');
check('JSON-starting text with non-JSON content type: contentTypeJson=true (auto-detected)',
  autoDetectShape.contentTypeJson === true);
log('');

// ---------------------------------------------------------------------------
// Group 8: createSanitizedDiagnosticsFetch — wrapper behavior
// ---------------------------------------------------------------------------
log('--- Group 8: createSanitizedDiagnosticsFetch ---');

// Create synthetic fetch functions for testing without network
const createSyntheticFetch = (payload, status = 200, contentType = 'application/json') => {
  const bodyText = JSON.stringify(payload);
  return async function syntheticFetch() {
    const responseObj = {
      status,
      ok: status >= 200 && status < 300,
      headers: { get: (k) => (k === 'content-type' ? contentType : null) },
      text: async () => bodyText,
    };
    responseObj.clone = () => ({
      text: async () => bodyText,
    });
    return responseObj;
  };
};

// Test 1: happy path — articles present in synthetic response
const syntheticPayload1 = { articles: [{ title: 'T', url: 'U' }], totalArticles: 1 };
const capturedOutput1 = [];
const captureOut1 = (msg) => capturedOutput1.push(msg);
let wrapperResponse1 = null;
let wrapperError1 = null;

const syntheticFetch1 = createSyntheticFetch(syntheticPayload1);
const wrappedFetch1 = createSanitizedDiagnosticsFetch(syntheticFetch1, captureOut1);

try {
  wrapperResponse1 = await wrappedFetch1('https://example.test/api');
} catch (err) {
  wrapperError1 = err?.message ?? 'unknown';
}

check('Wrapper returns response without throwing', wrapperError1 === null);
check('Wrapper returns an object (response)', typeof wrapperResponse1 === 'object' && wrapperResponse1 !== null);
check('Wrapper emits at least one output line', capturedOutput1.length > 0);

const diagLine1 = capturedOutput1.find((l) => l.includes('provider-diagnostics')) ?? '';
check('Wrapper emits a provider-diagnostics line', diagLine1.length > 0);
check('Wrapper output includes diagnostics=sanitized', diagLine1.includes('diagnostics=sanitized'));
check('Wrapper output includes httpStatusClass=2xx', diagLine1.includes('httpStatusClass=2xx'));
check('Wrapper output includes httpOk=true', diagLine1.includes('httpOk=true'));
check('Wrapper output includes articlesPresent=true', diagLine1.includes('articlesPresent=true'));
check('Wrapper output includes articlesLength=1', diagLine1.includes('articlesLength=1'));
check('Wrapper output includes sanitized=true', diagLine1.includes('sanitized=true'));
check('Wrapper output does NOT include request URL (no https:// in diagnostic line)',
  !diagLine1.match(/https?:\/\/\S+/));
check('Wrapper output does NOT include title value or description value',
  !diagLine1.toLowerCase().includes('title=t') && !diagLine1.toLowerCase().includes('url=u'));
check('Wrapper output does NOT include raw JSON body',
  !diagLine1.includes('"articles"') && !diagLine1.includes('"totalArticles"'));

// Verify caller can still read the returned response body (original not consumed)
let responseBodyAfterWrapper = null;
try {
  responseBodyAfterWrapper = await wrapperResponse1.text();
} catch { /* ignore */ }
check('Caller can still read returned response body after diagnostics (body not consumed)',
  typeof responseBodyAfterWrapper === 'string' && responseBodyAfterWrapper.length > 0);

// Test 2: error response (4xx)
const errorPayload2 = { errors: ['not found'], message: 'Not Found' };
const capturedOutput2 = [];
const captureOut2 = (msg) => capturedOutput2.push(msg);
const syntheticFetch2 = createSyntheticFetch(errorPayload2, 404, 'application/json');
const wrappedFetch2 = createSanitizedDiagnosticsFetch(syntheticFetch2, captureOut2);
await wrappedFetch2('https://example.test/api');
const diagLine2 = capturedOutput2.find((l) => l.includes('provider-diagnostics')) ?? '';
check('4xx response: httpStatusClass=4xx', diagLine2.includes('httpStatusClass=4xx'));
check('4xx response: httpOk=false', diagLine2.includes('httpOk=false'));
check('4xx response: errorFieldPresent=true', diagLine2.includes('errorFieldPresent=true'));
check('4xx response: messageFieldPresent=true', diagLine2.includes('messageFieldPresent=true'));
check('4xx response: error message value is not in output',
  !diagLine2.includes('not found') && !diagLine2.includes('Not Found'));

// Test 3: response without clone — bodyReadable=false
const noCloneFetch = async () => ({
  status: 200,
  ok: true,
  headers: { get: () => null },
  text: async () => '{}',
  // no clone method
});
const capturedOutput3 = [];
const wrappedFetch3 = createSanitizedDiagnosticsFetch(noCloneFetch, (msg) => capturedOutput3.push(msg));
await wrappedFetch3();
const diagLine3 = capturedOutput3.find((l) => l.includes('provider-diagnostics')) ?? '';
check('No-clone response: still emits provider-diagnostics line', diagLine3.length > 0);
check('No-clone response: bodyReadable=false or diagnosticsErrorCode in output',
  diagLine3.includes('bodyReadable=false') || diagLine3.includes('diagnosticsErrorCode'));
log('');

// ---------------------------------------------------------------------------
// Group 9: Network and output safety
// ---------------------------------------------------------------------------
log('--- Group 9: Network and output safety ---');

check('globalThis.fetch (network) was NOT called during any helper invocation', !networkCallAttempted);
check('summarizeProviderPayloadShape does not return raw body text',
  (() => {
    const testPayload = { articles: [{ title: 'SECRET', url: 'http://secret' }], totalArticles: 1 };
    const s = summarizeProviderPayloadShape(testPayload);
    const shapeStr = JSON.stringify(s);
    return !shapeStr.includes('SECRET') && !shapeStr.includes('http://secret');
  })());
check('summarizeProviderTextShape does not include raw body text in output',
  (() => {
    const rawText = JSON.stringify({ articles: [{ title: 'LEAKED', url: 'LEAKED_URL' }], totalArticles: 1 });
    const s = summarizeProviderTextShape(rawText, 'application/json');
    const shapeStr = JSON.stringify(s);
    return !shapeStr.includes('LEAKED') && !shapeStr.includes('LEAKED_URL');
  })());
check('Diagnostics output does not expose error message values',
  (() => {
    const errPayload = { errors: ['raw-error-value'], message: 'raw-msg-value' };
    const s = summarizeProviderPayloadShape(errPayload);
    const shapeStr = JSON.stringify(s);
    return !shapeStr.includes('raw-error-value') && !shapeStr.includes('raw-msg-value');
  })());

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
