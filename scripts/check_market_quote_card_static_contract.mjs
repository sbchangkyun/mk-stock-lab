/**
 * Static structural validation for the MarketLiveQuoteCard integration.
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CARD_PATH = join(root, 'src', 'components', 'MarketLiveQuoteCard.astro');
const SHELL_PATH = join(root, 'src', 'components', 'MarketShell.astro');

const FORBIDDEN_KIS_FIELDS = [
  'stck_prpr', 'rt_cd', 'prdy_vrss', 'acml_vol', 'msg_cd',
  'appkey', 'appsecret', 'fhkst', 'grant_type',
];

const FORBIDDEN_URLS = [
  'openapi.koreainvestment.com',
  'apis.koreainvestment.com',
  'https://kis.',
];

const SUPABASE_PATTERNS = [
  'supabase.co',
  '.supabase.',
];

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== Market Quote Card Static Contract Check ===');
log('');

// --- File existence ---
log('File existence:');
const cardExists = existsSync(CARD_PATH);
check('MarketLiveQuoteCard.astro exists', cardExists);
const shellExists = existsSync(SHELL_PATH);
check('MarketShell.astro exists', shellExists);
log('');

if (!cardExists || !shellExists) {
  log('ERROR: Required files missing. Cannot continue.');
  process.exit(1);
}

const cardContent = readFileSync(CARD_PATH, 'utf8');
const shellContent = readFileSync(SHELL_PATH, 'utf8');

// --- Integration in MarketShell ---
log('MarketShell integration:');
check('MarketShell imports MarketLiveQuoteCard', shellContent.includes('MarketLiveQuoteCard'));
check('MarketShell references KIS_ENABLE_MARKET_QUOTE_CARD', shellContent.includes('KIS_ENABLE_MARKET_QUOTE_CARD'));

const cardIdx = shellContent.indexOf('MarketLiveQuoteCard');
const dashIdx = shellContent.indexOf('market-dashboard');
check(
  'MarketLiveQuoteCard placed before market-dashboard in MarketShell',
  cardIdx !== -1 && dashIdx !== -1 && cardIdx < dashIdx,
);
log('');

// --- API contract ---
log('API contract:');
check('Component references /api/market/quote', cardContent.includes('/api/market/quote'));
check('Component does not reference KIS external URL', !FORBIDDEN_URLS.some((u) => cardContent.includes(u)));
check('Component does not reference Supabase URL for quote', !SUPABASE_PATTERNS.some((u) => cardContent.includes(u)));
log('');

// --- No hardcoded defaults ---
log('Hardcoded defaults absent:');
const hardcodedSymbolPattern = /(?:defaultSymbol|DEFAULT_SYMBOL)\s*=\s*['"][0-9]{6}['"]/;
check('No obvious hardcoded 6-digit default symbol constant', !hardcodedSymbolPattern.test(cardContent));
const hardcodedPricePattern = /(?:defaultPrice|DEFAULT_PRICE|hardcoded_price)\s*=/i;
check('No obvious hardcoded price constant', !hardcodedPricePattern.test(cardContent));
log('');

// --- UX state handling ---
log('UX state coverage:');
check('Disabled state present (market-quote-card--disabled)', cardContent.includes('market-quote-card--disabled'));
check('Idle state present (data-mqc-idle)', cardContent.includes('data-mqc-idle'));
check('Loading state present (data-mqc-loading)', cardContent.includes('data-mqc-loading'));
check('Validation error state present (data-mqc-validation-error)', cardContent.includes('data-mqc-validation-error'));
check('Result/fresh state present (mqc-result)', cardContent.includes('data-mqc-result'));
check('Cache-fresh handling present (cache-fresh)', cardContent.includes('cache-fresh'));
check('Stale fallback handling present (cache-stale-provider-failed)', cardContent.includes('cache-stale-provider-failed'));
check('Unavailable state present (data-mqc-unavailable)', cardContent.includes('data-mqc-unavailable'));
log('');

// --- Console hygiene ---
log('Console hygiene:');
check('No console.log( in component', !cardContent.includes('console.log('));
check('No console.error( in component', !cardContent.includes('console.error('));
log('');

// --- Forbidden KIS field names ---
log('Forbidden KIS field names absent:');
const presentKisFields = FORBIDDEN_KIS_FIELDS.filter((f) => cardContent.includes(f));
check(
  `No forbidden KIS field names in component (checked: ${FORBIDDEN_KIS_FIELDS.length})`,
  presentKisFields.length === 0,
);
if (presentKisFields.length > 0) {
  log(`  Found forbidden fields: ${presentKisFields.length} (names suppressed)`);
}
log('');

// --- Feature flag default ---
log('Feature flag:');
check('KIS_ENABLE_MARKET_QUOTE_CARD referenced in shell', shellContent.includes('KIS_ENABLE_MARKET_QUOTE_CARD'));
check('Default disabled behavior described (enabled prop)', cardContent.includes('enabled'));
log('');

// --- Summary ---
log('=== Result ===');
if (failures === 0) {
  log('All checks passed. Exit 0.');
  process.exitCode = 0;
} else {
  log(`${failures} check(s) failed. Exit 1.`);
  process.exitCode = 1;
}
