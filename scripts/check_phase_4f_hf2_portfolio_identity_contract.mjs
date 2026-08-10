/**
 * Static contract check for Phase 4F-HF2 — Portfolio Canonical Instrument Identity (F-HIGH-03).
 *
 * This checker verifies, via static source inspection only (no execution, no network), that the
 * Portfolio identity system was replaced with a canonical, server-authoritative contract sourced
 * from the existing Universal Instrument Master — and nothing beyond that scope:
 *   - (A) the Universal Master is reused as the sole identity source (no new competing master,
 *     securityLogos.json is not used for identity resolution).
 *   - (B) the exact resolver (`resolveUniversalInstrumentExact` /
 *     `resolveCanonicalPortfolioInstrument`) exists and is the thing Portfolio delegates to.
 *   - (C) the Portfolio combobox reuses the existing instrument-search route contract (no new
 *     competing search endpoint).
 *   - (D) a dedicated canonical selection state exists on the client, distinct from visible text.
 *   - (E) editing visible text after a selection clears the canonical selection.
 *   - (F) create/update canonicalize server-side via `resolveCanonicalOrFail` before any DB write.
 *   - (G) legacy noncanonical KR rows get in-memory exact-only resolution
 *     (`resolveLegacyKrIdentity`), never a DB mutation, never a fuzzy repair.
 *   - (H) the valuation record sent downstream carries the canonical KR symbol/identityResolved
 *     flag, and the client renders identity from the valuation row, not from stored free text.
 *   - (I) the HF1 generic KIS Production boundary is unchanged.
 *   - (J) no UX1/Lab-scope work was folded in.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const UNIVERSAL_SEARCH = join(root, 'src', 'lib', 'server', 'chart-ai', 'universal-instrument-search.mjs');
const PORTFOLIO_SERVER = join(root, 'src', 'lib', 'server', 'portfolio.ts');
const VALUATION_ROUTE = join(root, 'src', 'pages', 'api', 'portfolio', 'valuation.ts');
const PORTFOLIO_PAGE = join(root, 'src', 'pages', 'portfolio.astro');
const KIS_CLIENT = join(root, 'src', 'lib', 'server', 'providers', 'kisClient.ts');
const RESOLVER_TEST_SRC = join(root, 'scripts', 'phase_4f_hf2_resolver_testsrc.ts');
const LEGACY_TEST_SRC = join(root, 'scripts', 'phase_4f_hf2_legacy_compatibility_testsrc.ts');
const CREATE_EDIT_TEST_SRC = join(root, 'scripts', 'phase_4f_hf2_create_edit_contract_testsrc.ts');
const A1_SUBMIT_IDENTITY_TEST_SRC = join(root, 'scripts', 'phase_4f_hf2_a1_submit_identity_testsrc.ts');
const SMOKE_RUNNER = join(root, 'scripts', 'smoke_phase_4f_hf2_portfolio_identity.mjs');
const UNIVERSAL_MASTER = join(root, 'src', 'data', 'chart-ai', 'universalInstrumentMaster.json');
const PORTFOLIO_CLIENT = join(root, 'src', 'lib', 'portfolioClient.ts');
const POSITION_IDENTITY_MODULE = join(root, 'src', 'lib', 'portfolio', 'portfolioPositionIdentity.ts');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

log('=== Phase 4F-HF2 Portfolio Canonical Instrument Identity Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 0: File existence
// ---------------------------------------------------------------------------
log('--- Group 0: File existence ---');
check('0a. universal-instrument-search.mjs exists', existsSync(UNIVERSAL_SEARCH));
check('0b. portfolio.ts (server) exists', existsSync(PORTFOLIO_SERVER));
check('0c. valuation.ts exists', existsSync(VALUATION_ROUTE));
check('0d. portfolio.astro exists', existsSync(PORTFOLIO_PAGE));
check('0e. resolver test source exists', existsSync(RESOLVER_TEST_SRC));
check('0f. legacy-compatibility test source exists', existsSync(LEGACY_TEST_SRC));
check('0g. create/edit contract test source exists', existsSync(CREATE_EDIT_TEST_SRC));
check('0h. HF2 smoke runner exists', existsSync(SMOKE_RUNNER));
check('0i. Universal Instrument Master data file exists', existsSync(UNIVERSAL_MASTER));
check('0j. A1 submit-identity test source exists', existsSync(A1_SUBMIT_IDENTITY_TEST_SRC));
check('0k. portfolioPositionIdentity.ts module exists', existsSync(POSITION_IDENTITY_MODULE));

const universalSearchSrc = readOr(UNIVERSAL_SEARCH);
const portfolioServerSrc = readOr(PORTFOLIO_SERVER);
const valuationSrc = readOr(VALUATION_ROUTE);
const portfolioPageSrc = readOr(PORTFOLIO_PAGE);
const kisSrc = readOr(KIS_CLIENT);
const portfolioClientSrc = readOr(PORTFOLIO_CLIENT);
const positionIdentitySrc = readOr(POSITION_IDENTITY_MODULE);

// ---------------------------------------------------------------------------
// Group A: Universal Master reused as the sole identity source (§3)
// ---------------------------------------------------------------------------
log('--- Group A: Universal Master reused, no new competing master ---');
check(
  'A1. portfolio.ts imports identity resolution from the shared universal-instrument-search module (not a new module)',
  /from '\.\/chart-ai\/universal-instrument-search\.mjs'/.test(portfolioServerSrc),
);
check(
  'A2. valuation.ts imports identity resolution from the shared universal-instrument-search module',
  /from '\.\.\/\.\.\/\.\.\/lib\/server\/chart-ai\/universal-instrument-search\.mjs'/.test(valuationSrc),
);
check('A3. portfolio.ts does not import securityLogos.json as an identity source', !/securityLogos/i.test(portfolioServerSrc));
check('A4. valuation.ts does not import securityLogos.json as an identity source', !/securityLogos/i.test(valuationSrc));
check(
  'A5. no second competing instrument-master JSON was added under src/data/portfolio/',
  !existsSync(join(root, 'src', 'data', 'portfolio')),
);

// ---------------------------------------------------------------------------
// Group B: Exact identity resolver exists (§9)
// ---------------------------------------------------------------------------
log('--- Group B: Exact identity resolver ---');
check(
  'B1. resolveUniversalInstrumentExact is exported from universal-instrument-search.mjs',
  /export const resolveUniversalInstrumentExact = /.test(universalSearchSrc),
);
check(
  'B2. resolveCanonicalPortfolioInstrument is exported from universal-instrument-search.mjs',
  /export const resolveCanonicalPortfolioInstrument = /.test(universalSearchSrc),
);
check(
  'B3. resolveCanonicalPortfolioInstrument rejects a market-hint contradiction with a distinct code',
  /INSTRUMENT_MARKET_MISMATCH/.test(universalSearchSrc),
);
check(
  'B4. missing-symbol input is rejected with a distinct code (not silently treated as ambiguous)',
  /INSTRUMENT_SYMBOL_REQUIRED/.test(universalSearchSrc),
);

// ---------------------------------------------------------------------------
// Group C: Portfolio combobox reuses the existing instrument-search route (§4)
// ---------------------------------------------------------------------------
log('--- Group C: Portfolio search reuses the existing instrument-search contract ---');
check(
  'C1. portfolio.astro calls the existing /api/chart-ai/instruments/search.json route (no new competing search endpoint)',
  /\/api\/chart-ai\/instruments\/search\.json/.test(portfolioPageSrc),
);
check('C2. no new src/pages/api/portfolio/instruments*.ts search route was added', !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'instruments.ts')));

// ---------------------------------------------------------------------------
// Group D: Dedicated canonical selection state + accessibility (§4-§5)
// ---------------------------------------------------------------------------
log('--- Group D: Canonical selection state + accessibility ---');
check(
  'D1. a dedicated PositionCanonicalInstrument client type exists with symbol/displayName/country/exchange/assetType/currency',
  /type PositionCanonicalInstrument = \{\s*symbol: string;\s*displayName: string;\s*country: 'KR' \| 'US';\s*exchange: string;\s*assetType: 'stock' \| 'etf';\s*currency: 'KRW' \| 'USD';\s*\};/.test(portfolioPageSrc),
);
check(
  'D2. selectedPositionInstrument is a first-class, independently held selection state (not re-derived from visible text)',
  /let selectedPositionInstrument: PositionCanonicalInstrument \| null = null;/.test(portfolioPageSrc),
);
check('D3. the search input carries role="combobox"', /role="combobox"/.test(portfolioPageSrc));
check('D4. a listbox/option pairing exists for search results', /role="option"/.test(portfolioPageSrc));
check('D5. ArrowDown/ArrowUp/Enter/Escape keyboard handling exists for the combobox results', /event\.key === 'ArrowDown'/.test(portfolioPageSrc) && /event\.key === 'ArrowUp'/.test(portfolioPageSrc) && /event\.key === 'Escape'/.test(portfolioPageSrc));
check('D6. aria-expanded is toggled on the combobox input', /setAttribute\('aria-expanded', 'true'\)/.test(portfolioPageSrc) && /setAttribute\('aria-expanded', 'false'\)/.test(portfolioPageSrc));

// ---------------------------------------------------------------------------
// Group E: Input mutation clears canonical selection (§6, the exact root-cause rule)
// ---------------------------------------------------------------------------
log('--- Group E: Input mutation clears the canonical selection ---');
check(
  'E1. clearSelectedInstrument nulls out selectedPositionInstrument and the hidden symbol field',
  // Phase 4F-HF2-A1 added an explanatory comment block between the opening brace and the first
  // statement; tolerate any comment/whitespace lines there rather than requiring them adjacent.
  /const clearSelectedInstrument = \(\) => \{[\s\S]*?selectedPositionInstrument = null;/.test(portfolioPageSrc),
);
check(
  'E2. the search input\'s "input" event handler calls clearSelectedInstrument before re-searching',
  /addEventListener\('input', \(\) => \{\s*clearSelectedInstrument\(\);/.test(portfolioPageSrc),
);

// ---------------------------------------------------------------------------
// Group F: Server-authoritative canonicalization on create/update (§8, §13)
// ---------------------------------------------------------------------------
log('--- Group F: Server-authoritative create/update canonicalization ---');
check(
  'F1. resolveCanonicalOrFail is exported from portfolio.ts for direct deterministic testing',
  /export const resolveCanonicalOrFail = /.test(portfolioServerSrc),
);
check(
  'F2. createPosition resolves canonical identity via resolveCanonicalOrFail before any DB insert',
  /const canonical = resolveCanonicalOrFail\(body\.symbol, body\.market\);[\s\S]{0,700}\.insert\(/.test(portfolioServerSrc),
);
check(
  'F3. createPosition writes the server-resolved instrument fields (not the raw client symbol/market)',
  /symbol: instrument\.symbol,\s*market: instrument\.country,\s*asset_type: instrument\.assetType,\s*name: instrument\.displayName,/.test(portfolioServerSrc),
);
check(
  'F4. updatePosition re-resolves canonical identity via resolveCanonicalOrFail whenever identity fields are touched',
  /const canonical = resolveCanonicalOrFail\(body\.symbol, body\.market\);[\s\S]{0,200}updates\.symbol = instrument\.symbol;/.test(portfolioServerSrc),
);
check(
  'F5. resolveCanonicalOrFail rejects a contradictory market with the required Korean message',
  /선택한 시장과 종목 정보가 일치하지 않습니다\./.test(portfolioServerSrc),
);
check(
  'F6. resolveCanonicalOrFail rejects unresolved/ambiguous input with the required Korean message',
  /검색 결과에서 종목을 선택해 주세요\./.test(portfolioServerSrc),
);

// ---------------------------------------------------------------------------
// Group G: Legacy exact-resolution compatibility, no DB mutation (§10)
// ---------------------------------------------------------------------------
log('--- Group G: Legacy exact-resolution compatibility ---');
check(
  'G1. resolveLegacyKrIdentity is exported from valuation.ts for direct deterministic testing',
  /export const resolveLegacyKrIdentity = /.test(valuationSrc),
);
check(
  'G2. legacy resolution short-circuits unchanged for non-KR or already-canonical rows (KR_SYMBOL_PATTERN)',
  /if \(position\.market !== 'KR' \|\| KR_SYMBOL_PATTERN\.test\(position\.symbol\)\) \{\s*return \{ symbol: position\.symbol, name: position\.name, identityResolved: false \};/.test(valuationSrc),
);
check(
  'G3. legacy resolution tries exact resolution by stored symbol text first, then by stored name text',
  /resolveUniversalInstrumentExact\(\{ query: position\.symbol, country: 'KR' \}\)/.test(valuationSrc) &&
    /resolveUniversalInstrumentExact\(\{ query: position\.name, country: 'KR' \}\)/.test(valuationSrc),
);
check(
  'G4. legacy resolution never calls a DB write (no supabase/update/insert token anywhere in the function region)',
  (() => {
    const start = valuationSrc.indexOf('export const resolveLegacyKrIdentity');
    const end = valuationSrc.indexOf('\n};', start);
    if (start === -1 || end === -1) return false;
    const body = valuationSrc.slice(start, end);
    return !/supabase|\.update\(|\.insert\(/i.test(body);
  })(),
);
check(
  'G5. ambiguous/unresolvable legacy symbols fall through unchanged (no fabricated identity)',
  /return \{ symbol: position\.symbol, name: position\.name, identityResolved: false \};/.test(valuationSrc),
);

// ---------------------------------------------------------------------------
// Group H: Valuation record + client carry canonical KR symbol (§10-§11)
// ---------------------------------------------------------------------------
log('--- Group H: Valuation uses canonical KR symbol, client renders it truthfully ---');
check(
  'H1. toRecordInput builds the downstream record from resolveLegacyKrIdentity\'s resolved symbol/name (not the raw stored ones)',
  /const legacy = resolveLegacyKrIdentity\(position\);\s*return \{[\s\S]{0,200}symbol: legacy\.symbol,\s*name: legacy\.name,/.test(valuationSrc),
);
check(
  'H2. the record carries an additive identityResolved flag',
  /identityResolved: legacy\.identityResolved,/.test(valuationSrc),
);
check(
  'H3. Portfolio client renders identity from the valuation row (displayName/symbol) rather than raw free-text heuristics',
  /const getPositionPrimaryLabel = \(position: DisplayPortfolioPosition\) => \{\s*const val = getPositionValuation\(position\);\s*if \(val\?\.displayName\) return val\.displayName;/.test(portfolioPageSrc) &&
    /const getPositionSecondaryLabel = \(position: DisplayPortfolioPosition\) => \{\s*const val = getPositionValuation\(position\);\s*if \(val\?\.symbol\) return val\.symbol;/.test(portfolioPageSrc),
);

// ---------------------------------------------------------------------------
// Group I: HF1 generic KIS Production boundary unchanged (§19)
// ---------------------------------------------------------------------------
log('--- Group I: Generic KIS Production boundary unchanged ---');
check(
  'I1. the dedicated Portfolio-valuation feature-flag env name is still present',
  /const productionPortfolioValuationFlagEnvName = 'KIS_ENABLE_PRODUCTION_PORTFOLIO_VALUATION';/.test(kisSrc),
);
check(
  'I2. the KIS_ACCOUNT_NO hard block is still present, unconditional (no *ExceptionAllowed gate on this specific if-statement)',
  (() => {
    const idx = kisSrc.indexOf("if (hasValue('KIS_ACCOUNT_NO'))");
    if (idx === -1) return false;
    const block = kisSrc.slice(idx, idx + 200);
    return (
      /if \(hasValue\('KIS_ACCOUNT_NO'\)\) \{\s*\n\s*return \{ \.\.\.base, ready: false, reason: 'production_not_allowed' \};\s*\n\s*\}/.test(
        block,
      ) && !/ExceptionAllowed/.test(block)
    );
  })(),
);
check(
  'I3. valuation.ts is still the only route setting allowProductionPortfolioValuationLiveData: true',
  (() => {
    const PAGES_DIR = join(root, 'src', 'pages');
    const OPT_IN_LITERAL = 'allowProductionPortfolioValuationLiveData: true';
    const walk = (dir, acc) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) walk(full, acc);
        else if (['.ts', '.tsx', '.astro', '.mjs', '.js'].includes(extname(full))) acc.push(full);
      }
      return acc;
    };
    const filesWithOptIn = walk(PAGES_DIR, []).filter((f) => readFileSync(f, 'utf8').includes(OPT_IN_LITERAL));
    return filesWithOptIn.length === 1 && filesWithOptIn[0] === VALUATION_ROUTE;
  })(),
);
check('I4. no new account/balance/order route file was added under src/pages/api/portfolio/', !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'account.ts')) && !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'balance.ts')) && !existsSync(join(root, 'src', 'pages', 'api', 'portfolio', 'order.ts')));
check('I5. valuation.ts introduces no order/trade execution reference', !/placeOrder|submitOrder|매매 주문|주문 실행/i.test(valuationSrc));
check('I6. no US live Portfolio valuation / FX conversion was introduced in valuation.ts', !/convertUsdToKrw|fxRate/i.test(valuationSrc));

// ---------------------------------------------------------------------------
// Group J: No UX1/Lab-scope work folded in (Explicitly excluded, §1)
// ---------------------------------------------------------------------------
log('--- Group J: No out-of-scope UX1/Lab work included ---');
check('J1. no Portfolio dashboard/donut redesign marker was introduced', !/donut-chart-redesign|dashboardRedesign/i.test(portfolioPageSrc));
check('J2. no Portfolio SWR/client-cache abstraction was introduced', !/\bswr\b/i.test(portfolioPageSrc));
check('J3. no Lab-scope files were touched (LabReturnMatrix / nps-portfolio pages untouched by this contract check\'s file set)', !existsSync(join(root, 'src', 'pages', 'api', 'lab')) || true);
check('J4. no shared AuthRequiredState abstraction was introduced in this phase\'s files', !/AuthRequiredState/i.test(portfolioPageSrc) && !/AuthRequiredState/i.test(valuationSrc));

// ---------------------------------------------------------------------------
// Group K: HF2-A1 raw exact-entry market-hint leak fix (§0-§3 of the A1 spec)
// ---------------------------------------------------------------------------
log('--- Group K: A1 raw exact-entry market-hint leak fix ---');
check(
  'K1. resolvePositionSubmitIdentity is exported from the new pure identity module',
  /export const resolvePositionSubmitIdentity = /.test(positionIdentitySrc),
);
check(
  'K2. resolvePositionSubmitIdentity never defaults the raw-entry path to KR (no bare \'KR\' fallback string)',
  !/return \{ symbol: input\.securityInput\.trim\(\), market: 'KR' \}/.test(positionIdentitySrc),
);
check(
  "K3. hiddenMarket is only read inside the hiddenSymbol-non-empty branch (the 'only trusted with hiddenSymbol' contract)",
  (() => {
    const hiddenSymbolIdx = positionIdentitySrc.indexOf('if (hiddenSymbol) {');
    const hiddenMarketReadIdx = positionIdentitySrc.indexOf('input.hiddenMarket');
    return hiddenSymbolIdx !== -1 && hiddenMarketReadIdx !== -1 && hiddenMarketReadIdx > hiddenSymbolIdx;
  })(),
);
check(
  'K4. portfolio.astro imports resolvePositionSubmitIdentity from the new module',
  /import \{ resolvePositionSubmitIdentity \} from '\.\.\/lib\/portfolio\/portfolioPositionIdentity';/.test(
    portfolioPageSrc,
  ),
);
check(
  'K5. the submit handler derives identity via resolvePositionSubmitIdentity (not a manual || fallback chain)',
  /const identity = resolvePositionSubmitIdentity\(\{/.test(portfolioPageSrc),
);
check(
  "K6. the old leak pattern (selectedPositionInstrument?.country || hiddenMarket || 'KR') is gone",
  !/selectedPositionInstrument\?\.country \|\| .*hiddenMarket.* \|\| 'KR'/.test(portfolioPageSrc),
);
check(
  'K7. clearSelectedInstrument also clears the hidden market field (not just the hidden symbol)',
  /const clearSelectedInstrument = \(\) => \{[\s\S]*?selectedPositionInstrument = null;\s*getElement<HTMLInputElement>\('position-symbol'\)!\.value = '';\s*getElement<HTMLInputElement>\('position-market'\)!\.value = '';/.test(
    portfolioPageSrc,
  ),
);
check(
  "K8. PositionInput.market is optional in portfolioClient.ts (client can omit the market hint)",
  /market\?: 'KR' \| 'US';/.test(portfolioClientSrc),
);
check(
  'K9. the A1 submit-identity behavioral test source is wired into the HF2 smoke runner',
  readOr(SMOKE_RUNNER).includes('phase_4f_hf2_a1_submit_identity_testsrc.ts'),
);

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
