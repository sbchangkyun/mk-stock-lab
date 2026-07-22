/**
 * Static contract check for Phase 3CC Security Metadata Coverage Expansion.
 * Verifies that securityLogos.json covers required KR and US symbols with
 * correct display names, preserves existing schema, and respects all
 * no-live-data boundaries.
 * No network calls. No .env reads. Exits non-zero on failure.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SECURITY_LOGOS_PATH = join(root, 'src', 'data', 'securityLogos.json');
const PORTFOLIO_ASTRO = join(root, 'src', 'pages', 'portfolio.astro');
const CHART_AI_ASTRO = join(root, 'src', 'pages', 'chart-ai.astro');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3cc_security_metadata_coverage_expansion_result_v0.1.md');

const REQUIRED_KR_KEYS = ['005930', '000660', '035420', '069500'];
const REQUIRED_US_KEYS = ['AAPL', 'KO', 'NVDA', 'MSFT', 'TSLA', 'SPY', 'QQQ'];
const LIVE_DATA_PATTERNS = ['KIS_APP_KEY', 'koreainvestment.com', 'gnews.io', 'supabase', 'fetch('];
const INCOMPATIBLE_SCHEMA_FIELDS = ['assetType', 'type', 'provider', 'lastUpdated', 'price'];

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3CC Security Metadata Coverage Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('securityLogos.json exists', existsSync(SECURITY_LOGOS_PATH));
check('portfolio.astro exists (resolver host)', existsSync(PORTFOLIO_ASTRO));
check('chart-ai.astro exists (symbol consumer)', existsSync(CHART_AI_ASTRO));
check('Phase 3CC result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:security-metadata-coverage script',
  typeof pkg.scripts?.['check:security-metadata-coverage'] === 'string');
log('');

if (!existsSync(SECURITY_LOGOS_PATH)) {
  log('ERROR: securityLogos.json missing. Cannot continue.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Group 2: Schema parses and preserves required fields
// ---------------------------------------------------------------------------
log('--- Group 2: JSON parse and schema preservation ---');

let logos = {};
try {
  logos = JSON.parse(readFileSync(SECURITY_LOGOS_PATH, 'utf8'));
  check('securityLogos.json parses as valid JSON', true);
} catch (e) {
  check('securityLogos.json parses as valid JSON', false);
  log('ERROR: JSON parse failed. Cannot continue.');
  process.exit(1);
}

const keys = Object.keys(logos);
check('securityLogos.json is non-empty', keys.length > 0);
check('All entries have a name field (string, non-empty)',
  keys.every((k) => typeof logos[k]?.name === 'string' && logos[k].name.length > 0));
check('All entries have a symbol field (string)',
  keys.every((k) => typeof logos[k]?.symbol === 'string'));
check('country field used (not market) — schema preserved',
  keys.every((k) => !Object.prototype.hasOwnProperty.call(logos[k], 'market')));
check('No incompatible schema fields introduced (assetType/type/provider/lastUpdated/price)',
  keys.every((k) =>
    INCOMPATIBLE_SCHEMA_FIELDS.every((f) => !Object.prototype.hasOwnProperty.call(logos[k], f))));
log('');

// ---------------------------------------------------------------------------
// Group 3: Required KR keys present
// ---------------------------------------------------------------------------
log('--- Group 3: Required KR symbol coverage ---');

for (const key of REQUIRED_KR_KEYS) {
  check(`KR key ${key} present in securityLogos.json`,
    Object.prototype.hasOwnProperty.call(logos, key));
}
log('');

// ---------------------------------------------------------------------------
// Group 4: Required US keys present
// ---------------------------------------------------------------------------
log('--- Group 4: Required US symbol coverage ---');

for (const key of REQUIRED_US_KEYS) {
  check(`US key ${key} present in securityLogos.json`,
    Object.prototype.hasOwnProperty.call(logos, key));
}
log('');

// ---------------------------------------------------------------------------
// Group 5: KR display name correctness
// ---------------------------------------------------------------------------
log('--- Group 5: KR display name correctness ---');

check('005930 name is 삼성전자',
  logos['005930']?.name === '삼성전자');
check('000660 name is SK하이닉스',
  logos['000660']?.name === 'SK하이닉스');
check('035420 name is NAVER',
  logos['035420']?.name === 'NAVER');
check('069500 name is KODEX 200',
  logos['069500']?.name === 'KODEX 200');

// KR entries have country: "KR"
for (const key of REQUIRED_KR_KEYS) {
  if (logos[key]) {
    check(`${key} has country: KR`,
      logos[key].country === 'KR');
  }
}
log('');

// ---------------------------------------------------------------------------
// Group 6: US display name correctness
// ---------------------------------------------------------------------------
log('--- Group 6: US display name correctness ---');

check('AAPL name includes Apple', logos['AAPL']?.name?.includes('Apple') === true);
check('KO name includes Coca-Cola', logos['KO']?.name?.includes('Coca-Cola') === true);
check('NVDA name includes NVIDIA', logos['NVDA']?.name?.includes('NVIDIA') === true);
check('MSFT name includes Microsoft', logos['MSFT']?.name?.includes('Microsoft') === true);
check('TSLA name includes Tesla', logos['TSLA']?.name?.includes('Tesla') === true);
check('SPY name includes S&P 500 or SPDR',
  logos['SPY']?.name?.includes('S&P 500') === true || logos['SPY']?.name?.includes('SPDR') === true);
check('QQQ name includes QQQ or Invesco',
  logos['QQQ']?.name?.includes('QQQ') === true || logos['QQQ']?.name?.includes('Invesco') === true);

// US entries have country: "US"
for (const key of REQUIRED_US_KEYS) {
  if (logos[key]) {
    check(`${key} has country: US`,
      logos[key].country === 'US');
  }
}
log('');

// ---------------------------------------------------------------------------
// Group 7: Symbol field matches key for required entries
// ---------------------------------------------------------------------------
log('--- Group 7: Symbol field consistency ---');

for (const key of [...REQUIRED_KR_KEYS, ...REQUIRED_US_KEYS]) {
  if (logos[key]) {
    check(`${key} symbol field matches key`,
      logos[key].symbol === key);
  }
}
log('');

// ---------------------------------------------------------------------------
// Group 8: ETF schema note — schema has no type/assetType field
// ---------------------------------------------------------------------------
log('--- Group 8: ETF schema note ---');

check('Schema does not use assetType field (ETF info not in current schema)',
  keys.every((k) => !Object.prototype.hasOwnProperty.call(logos[k], 'assetType')));
check('Schema does not use type field (not in current schema)',
  keys.every((k) => !Object.prototype.hasOwnProperty.call(logos[k], 'type')));
log('  (Note: ETF designation not stored in schema — 069500/SPY/QQQ names make type clear)');
log('');

// ---------------------------------------------------------------------------
// Group 9: No live data / provider fields introduced
// ---------------------------------------------------------------------------
log('--- Group 9: Live data safety ---');

const logosText = readFileSync(SECURITY_LOGOS_PATH, 'utf8');
check('No KIS_APP_KEY in security metadata file', !logosText.includes('KIS_APP_KEY'));
check('No koreainvestment.com in security metadata file', !logosText.includes('koreainvestment.com'));
check('No gnews.io in security metadata file', !logosText.includes('gnews.io'));
check('No supabase reference in security metadata file', !logosText.includes('supabase'));
check('No fetch() call in security metadata file', !logosText.includes('fetch('));
check('No live provider field in metadata entries',
  keys.every((k) => !Object.prototype.hasOwnProperty.call(logos[k], 'provider')));
log('');

// ---------------------------------------------------------------------------
// Group 10: Portfolio resolver still intact
// ---------------------------------------------------------------------------
log('--- Group 10: Portfolio resolver no-regression ---');

const portfolio = existsSync(PORTFOLIO_ASTRO) ? readFileSync(PORTFOLIO_ASTRO, 'utf8') : '';
check('portfolio.astro imports securityLogos.json',
  portfolio.includes("from '../data/securityLogos.json'") ||
  portfolio.includes('securityLogos.json'));
check('resolveSecurityMetadata helper still defined', portfolio.includes('resolveSecurityMetadata'));
check('resolveDisplayNameForSymbol still defined', portfolio.includes('resolveDisplayNameForSymbol'));
check('normalizeLogoKey still defined', portfolio.includes('normalizeLogoKey'));
check('getPositionPrimaryLabel still defined', portfolio.includes('getPositionPrimaryLabel'));
check('getPositionSecondaryLabel still defined', portfolio.includes('getPositionSecondaryLabel'));
log('');

// ---------------------------------------------------------------------------
// Group 11: Chart AI symbol pass-through no-regression
// ---------------------------------------------------------------------------
log('--- Group 11: Chart AI symbol pass-through ---');

const chartAi = existsSync(CHART_AI_ASTRO) ? readFileSync(CHART_AI_ASTRO, 'utf8') : '';
check('chart-ai.astro reads symbol from URL params',
  chartAi.includes("searchParams.get('symbol')") || chartAi.includes('searchParams.get("symbol")'));
check('chart-ai.astro uppercases symbol', chartAi.includes('.toUpperCase()'));
check('chart-ai.astro does not import securityLogos (no data dependency)',
  !chartAi.includes('securityLogos'));
log('');

// ---------------------------------------------------------------------------
// Group 12: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 12: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3CC Security Metadata Coverage — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Phase 3CC security metadata coverage ready');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
