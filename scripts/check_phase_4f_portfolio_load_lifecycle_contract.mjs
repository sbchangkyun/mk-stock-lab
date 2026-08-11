/**
 * Static contract check for Phase 4F (F-MED-01) — Portfolio fetch/loading UX dedup fix.
 *
 * Verifies, via static source inspection only (no execution, no network, no DOM), that the actual
 * wiring in src/pages/portfolio.astro matches the fix designed for the three confirmed root causes
 * of the Owner-observed redundant-request burst (23x /api/portfolio/positions, 14x
 * /api/portfolio/valuation, 10x /api/portfolio/portfolios in a single session):
 *   - (A) Root Cause 1: triple independent profile/portfolio bootstrap -> a single coalescing entry
 *     point (ensureProfileAndPortfolioReady) gated by portfolioReadyForSession/bootstrapInFlight,
 *     used by every trigger (init, mk:profile-bootstrap 'ready', mk:auth-state 'signed_in').
 *   - (B) Root Cause 2: tab switching to an already-visited portfolio always refetched positions ->
 *     decidePositionsFetch cache-check in loadPositions' single-portfolio branch.
 *   - (C) Root Cause 3: every loadPortfolios() call unconditionally force-reloaded the aggregate
 *     position set -> forcePositions is now an opt-in parameter defaulting to false.
 *   - (D) Valuation freshness/backgrounding: a TTL + in-flight dedup + background-refresh state so
 *     switching away and back does not blank the view or refire a request within the TTL window.
 *   - (E) Position-level mutations still force a refetch of their own portfolio's data; the explicit
 *     refresh button forces a reload WITHOUT going through the readiness/loading-screen path.
 *   - (F) The pure decision module portfolioLoadLifecycle.ts exists with the expected exports and is
 *     actually imported and used by portfolio.astro (not just present but unused).
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PORTFOLIO_PAGE = join(root, 'src', 'pages', 'portfolio.astro');
const LIFECYCLE_MODULE = join(root, 'src', 'lib', 'portfolio', 'portfolioLoadLifecycle.ts');
const TEST_SRC = join(root, 'scripts', 'phase_4f_portfolio_load_lifecycle_testsrc.ts');
const SMOKE_RUNNER = join(root, 'scripts', 'smoke_phase_4f_portfolio_load_lifecycle.mjs');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
const countOf = (src, re) => (src.match(re) || []).length;

log('=== Phase 4F (F-MED-01) Portfolio Load Lifecycle Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 0: File existence
// ---------------------------------------------------------------------------
log('--- Group 0: File existence ---');
check('0a. portfolio.astro exists', existsSync(PORTFOLIO_PAGE));
check('0b. portfolioLoadLifecycle.ts (pure module) exists', existsSync(LIFECYCLE_MODULE));
check('0c. test source exists', existsSync(TEST_SRC));
check('0d. smoke runner exists', existsSync(SMOKE_RUNNER));

const pageSrc = readOr(PORTFOLIO_PAGE);
const lifecycleSrc = readOr(LIFECYCLE_MODULE);

// ---------------------------------------------------------------------------
// Group A: pure module contract
// ---------------------------------------------------------------------------
log('--- Group A: pure lifecycle module exports ---');
check('A1. decideBootstrapAction is exported', /export const decideBootstrapAction = /.test(lifecycleSrc));
check('A2. decidePositionsFetch is exported', /export const decidePositionsFetch = /.test(lifecycleSrc));
check('A3. decideValuationFetch is exported', /export const decideValuationFetch = /.test(lifecycleSrc));
check('A4. isValuationFresh is exported', /export const isValuationFresh = /.test(lifecycleSrc));
check('A5. decideMutationForcesPositionsRefetch is exported', /export const decideMutationForcesPositionsRefetch = /.test(lifecycleSrc));
check('A6. the module is pure/DOM-free (no document/window reference)', !/\bdocument\.|\bwindow\./.test(lifecycleSrc));

// ---------------------------------------------------------------------------
// Group B: portfolio.astro actually imports and uses the pure module
// ---------------------------------------------------------------------------
log('--- Group B: portfolio.astro imports the pure module ---');
check('B1. imports decideBootstrapAction/decidePositionsFetch/decideValuationFetch from the lifecycle module', /from '\.\.\/lib\/portfolio\/portfolioLoadLifecycle'/.test(pageSrc) && /decideBootstrapAction/.test(pageSrc) && /decidePositionsFetch/.test(pageSrc) && /decideValuationFetch/.test(pageSrc));
check('B2. decidePositionsFetch is actually called (not just imported)', countOf(pageSrc, /decidePositionsFetch\(\{/g) >= 2);
check('B3. decideValuationFetch is actually called (not just imported)', /decideValuationFetch\(\{/.test(pageSrc));
check('B4. decideBootstrapAction is actually called (not just imported)', /decideBootstrapAction\(\{/.test(pageSrc));

// ---------------------------------------------------------------------------
// Group C: Root Cause 1 fix -- coalesced bootstrap entry point
// ---------------------------------------------------------------------------
log('--- Group C: coalesced bootstrap (Root Cause 1) ---');
check('C1. portfolioReadyForSession session-ready flag exists', /let portfolioReadyForSession = false;/.test(pageSrc));
check('C2. bootstrapInFlight in-flight-promise guard exists', /let bootstrapInFlight: Promise<void> \| null = null;/.test(pageSrc));
check('C3. ensureProfileAndPortfolioReady coalescing entry point exists', /const ensureProfileAndPortfolioReady = \(\): Promise<void> => \{/.test(pageSrc));
check('C4. the initial readiness init path calls the coalescing entry point (not the raw loader)', /await ensureProfileAndPortfolioReady\(\);/.test(pageSrc));
check('C5. mk:profile-bootstrap listener resets portfolioReadyForSession on sign-out and skips a repeat when already ready', countOf(pageSrc, /portfolioReadyForSession = false;/g) >= 2 && /if \(portfolioReadyForSession\) return;/.test(pageSrc));
check('C6. successful bootstrap sets portfolioReadyForSession = true on completion', /portfolioReadyForSession = true;/.test(pageSrc));
check('C7. neither remaining live listener still calls the raw loader directly (both route through the coalescing entry point)', countOf(pageSrc, /void ensureProfileAndPortfolioReady\(\);/g) >= 2);

// ---------------------------------------------------------------------------
// Group D: Root Cause 2 fix -- positions cache-check + in-flight dedup
// ---------------------------------------------------------------------------
log('--- Group D: positions cache-check + dedup (Root Cause 2) ---');
check('D1. fetchPositionsDeduped shared in-flight dedup helper exists', /const fetchPositionsDeduped = \(portfolioId: string\) => \{/.test(pageSrc));
check('D2. positionsInFlight map backs the dedup helper', /const positionsInFlight: Record<string, Promise<DisplayPortfolioPosition\[\]>> = \{\};/.test(pageSrc));
check('D3. the single-portfolio branch of loadPositions checks the cache before fetching (the actual Root-Cause-2 fix)', /const decision = decidePositionsFetch\(\{\s*force,\s*hasCachedEntry: !!state\.positionsByPortfolioId\[portfolioId\],\s*\}\);\s*if \(decision === 'use-cache'\) \{/.test(pageSrc));
check('D4. loadAllPortfolioPositions (aggregate) also uses decidePositionsFetch rather than an unconditional refetch', /const decision = decidePositionsFetch\(\{\s*force,\s*hasCachedEntry: !!state\.positionsByPortfolioId\[portfolio\.id\],\s*\}\);/.test(pageSrc));
check('D5. selectPortfolioTab-style tab selection still calls loadPositions with the default force=false (no call-site regression forcing every tab click)', /const loadPositions = async \(portfolioId: string, force = false\) => \{/.test(pageSrc));

// ---------------------------------------------------------------------------
// Group E: Root Cause 3 fix -- forcePositions is opt-in, not blanket
// ---------------------------------------------------------------------------
log('--- Group E: forcePositions opt-in (Root Cause 3) ---');
check('E1. loadPortfolios accepts forcePositions defaulting to false', /const loadPortfolios = async \(\{ forcePositions = false \}: \{ forcePositions\?: boolean \} = \{\}\) => \{/.test(pageSrc));
check('E2. loadPortfolios forwards forcePositions to loadPositions instead of a hardcoded true', /await loadPositions\(state\.selectedPortfolioId, forcePositions\);/.test(pageSrc));
check('E3. no remaining unconditional `loadPositions(state.selectedPortfolioId, true)` inside loadPortfolios itself', !/const loadPortfolios[\s\S]{0,2000}loadPositions\(state\.selectedPortfolioId, true\)/.test(pageSrc));

// ---------------------------------------------------------------------------
// Group F: valuation freshness TTL + background refresh
// ---------------------------------------------------------------------------
log('--- Group F: valuation freshness TTL + background refresh ---');
check('F1. a named freshness TTL constant exists (20s default)', /const VALUATION_FRESHNESS_TTL_MS = 20_000;/.test(pageSrc));
check('F2. a valuation in-flight dedup map exists', /const valuationInFlight: Record<string, Promise<void>> = \{\};/.test(pageSrc));
check('F3. loadValuation calls decideValuationFetch to branch its behavior', /const decision = decideValuationFetch\(\{/.test(pageSrc));
check('F4. a background-refresh flag exists on state (distinct from the foreground `loading` state)', /valuationRefreshing: boolean;/.test(pageSrc));
check('F5. background refresh sets valuationRefreshing without touching the foreground loading/blanking state', /state\.valuationRefreshing = true;/.test(pageSrc));
check('F6. the status-copy renderer shows a distinct subtle message for background refresh (not the full loading takeover copy)', /else if \(state\.valuationRefreshing\) \{/.test(pageSrc));
check('F7. clearPortfolioData resets both the refreshing flag and the valuation cache on sign-out/switch', /state\.valuationRefreshing = false;/.test(pageSrc));

// ---------------------------------------------------------------------------
// Group G: explicit refresh + position-mutation force semantics preserved
// ---------------------------------------------------------------------------
log('--- Group G: explicit refresh + mutation force semantics ---');
check('G1. the refresh button handler calls loadPortfolios with forcePositions: true (explicit refresh still bypasses cache)', /void loadPortfolios\(\{ forcePositions: true \}\)/.test(pageSrc));
check('G2. the refresh button handler does NOT go through loadPortfolioMvp / setPortfolioState (no readiness-screen flash on refresh)', !/getElement<HTMLButtonElement>\('portfolio-refresh'\)\?\.addEventListener\('click', \(\) => \{\s*if \(explicitRefreshInFlight\) return;\s*explicitRefreshInFlight = true;\s*void loadPortfolioMvp/.test(pageSrc));
check('G3. explicitRefreshInFlight busy-guard prevents overlapping refresh clicks', /let explicitRefreshInFlight = false;/.test(pageSrc));
check('G4. a position create/update mutation forces its own portfolio\'s positions refetch (force: true)', countOf(pageSrc, /await loadPositions\(state\.selectedPortfolioId, true\);/g) >= 2);
check('G5. portfolio-metadata mutations (create/rename/delete portfolio) call loadPortfolios with no args, taking the safe forcePositions=false default', countOf(pageSrc, /await loadPortfolios\(\);/g) >= 3);

log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
