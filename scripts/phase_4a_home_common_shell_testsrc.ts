/**
 * Phase 4A test source (bundled + run by scripts/smoke_phase_4a_home_common_shell.mjs via esbuild).
 *
 * Phase 4A is mostly a static presentation/copy/accessibility pass over Home and the shared shell,
 * so most of its correctness is verified by the companion static contract checker
 * (check_phase_4a_home_common_shell_contract.mjs). This smoke suite exercises the one piece of real,
 * executable logic the phase introduces: the extracted pure navigation-active-link module
 * src/lib/shell/navActiveLink.ts (the same module Nav.astro imports -- not a duplicate
 * reimplementation), covering the closed 5-item nav registry, exact-match/sub-path/alias active-link
 * resolution, mutual exclusivity of the active entry, and that no unlinked route (e.g.
 * /admin/operations) can ever resolve as active.
 */

import { NAV_ITEMS, isNavItemActive, resolveActiveNavHref } from '../src/lib/shell/navActiveLink';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// =====================================================================================
// Group 1: closed nav registry shape
// =====================================================================================

check('NAV_ITEMS has exactly 5 entries', NAV_ITEMS.length === 5);
check(
  'NAV_ITEMS is exactly Home/Chart AI/시장/Lab/포트폴리오 in order',
  NAV_ITEMS.map((i) => i.label).join('|') === ['Home', 'Chart AI', '시장', 'Lab', '포트폴리오'].join('|'),
);
check(
  'NAV_ITEMS hrefs are exactly /, /chart-ai, /market, /lab, /portfolio in order',
  NAV_ITEMS.map((i) => i.href).join('|') === ['/', '/chart-ai', '/market', '/lab', '/portfolio'].join('|'),
);
check(
  'only the 시장 entry declares an alias, and it is exactly /heatmap',
  NAV_ITEMS.filter((i) => i.aliases && i.aliases.length > 0).length === 1 &&
    NAV_ITEMS.find((i) => i.label === '시장')?.aliases?.join(',') === '/heatmap',
);

// =====================================================================================
// Group 2: isNavItemActive -- exact/sub-path/alias matching, root special-case
// =====================================================================================

const home = NAV_ITEMS[0];
const chartAi = NAV_ITEMS[1];
const market = NAV_ITEMS[2];
const lab = NAV_ITEMS[3];
const portfolio = NAV_ITEMS[4];

check('Home ("/") matches only the exact root path', isNavItemActive(home, '/') === true);
check('Home ("/") does NOT match any other path (root is not a prefix match)', isNavItemActive(home, '/chart-ai') === false);
check('Chart AI matches its own exact path', isNavItemActive(chartAi, '/chart-ai') === true);
check('Chart AI matches a sub-path under its own path', isNavItemActive(chartAi, '/chart-ai/anything') === true);
check('Chart AI does not match an unrelated path', isNavItemActive(chartAi, '/chart-ai-other') === false);
check('시장 matches its own exact path', isNavItemActive(market, '/market') === true);
check('시장 matches the legacy /heatmap alias', isNavItemActive(market, '/heatmap') === true);
check('시장 matches a sub-path under the /heatmap alias', isNavItemActive(market, '/heatmap/kospi') === true);
check('Lab matches its own exact path', isNavItemActive(lab, '/lab') === true);
check('포트폴리오 matches its own exact path', isNavItemActive(portfolio, '/portfolio') === true);
check('no nav item matches an unrelated/unknown path', NAV_ITEMS.every((item) => isNavItemActive(item, '/some-random-path') === false));
check('no nav item matches /admin/operations (it must never light up as a nav destination)', NAV_ITEMS.every((item) => isNavItemActive(item, '/admin/operations') === false));

// =====================================================================================
// Group 3: resolveActiveNavHref -- mutual exclusivity of the single active entry
// =====================================================================================

check('resolveActiveNavHref("/") resolves to Home', resolveActiveNavHref('/') === '/');
check('resolveActiveNavHref("/chart-ai/foo") resolves to Chart AI', resolveActiveNavHref('/chart-ai/foo') === '/chart-ai');
check('resolveActiveNavHref("/heatmap") resolves to 시장 via its alias', resolveActiveNavHref('/heatmap') === '/market');
check('resolveActiveNavHref("/404") resolves to null (no nav item matches the error page)', resolveActiveNavHref('/404') === null);
check(
  'exactly one nav item is ever active for any given real route (mutual exclusivity)',
  ['/', '/chart-ai', '/market', '/heatmap', '/lab', '/portfolio'].every(
    (path) => NAV_ITEMS.filter((item) => isNavItemActive(item, path)).length === 1,
  ),
);

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
