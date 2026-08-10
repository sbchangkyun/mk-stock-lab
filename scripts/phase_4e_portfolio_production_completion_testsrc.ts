/**
 * Phase 4E-B test source (bundled + run by scripts/smoke_phase_4e_portfolio_production_completion.mjs
 * via esbuild).
 *
 * Phase 4E-B is mostly a static markup/accessibility/truthfulness completion pass over
 * src/pages/portfolio.astro, so most of its correctness is verified by the companion static
 * contract checker (check_phase_4e_portfolio_production_completion_contract.mjs). This smoke suite
 * exercises the one piece of real, executable logic the phase introduces: the pure DOM-free
 * keyboard-navigation index calculations in src/lib/portfolio/portfolioKeyboardNav.ts (item F's
 * dialog focus-wrap and item G's tab roving-tabindex navigation).
 */

import { computeDialogFocusWrap, computeTabRovingNavigation } from '../src/lib/portfolio/portfolioKeyboardNav';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// =====================================================================================
// Group 1: computeDialogFocusWrap -- Tab/Shift+Tab containment inside a focus-trapped dialog
// =====================================================================================

{
  const r = computeDialogFocusWrap(0, 0, false);
  check('zero focusable elements never intercepts', r.shouldIntercept === false);
}
{
  const r = computeDialogFocusWrap(-1, 0, false);
  check('negative focusable count never intercepts', r.shouldIntercept === false);
}
{
  const r = computeDialogFocusWrap(1, 0, false);
  check('single focusable element wraps Tab to itself', r.shouldIntercept === true && r.targetIndex === 0);
}
{
  const r = computeDialogFocusWrap(1, 0, true);
  check('single focusable element wraps Shift+Tab to itself', r.shouldIntercept === true && r.targetIndex === 0);
}
{
  const r = computeDialogFocusWrap(4, -1, false);
  check('currentIndex not found (-1) does not intercept', r.shouldIntercept === false);
}
{
  const r = computeDialogFocusWrap(4, 4, false);
  check('currentIndex out of range does not intercept', r.shouldIntercept === false);
}
{
  const r = computeDialogFocusWrap(4, 3, false);
  check('Tab on the last of 4 elements wraps to the first', r.shouldIntercept === true && r.targetIndex === 0);
}
{
  const r = computeDialogFocusWrap(4, 0, true);
  check('Shift+Tab on the first of 4 elements wraps to the last', r.shouldIntercept === true && r.targetIndex === 3);
}
{
  const r = computeDialogFocusWrap(4, 1, false);
  check('Tab on a middle element (not first/last) does not intercept', r.shouldIntercept === false);
}
{
  const r = computeDialogFocusWrap(4, 2, true);
  check('Shift+Tab on a middle element (not first/last) does not intercept', r.shouldIntercept === false);
}

// =====================================================================================
// Group 2: computeTabRovingNavigation -- ArrowLeft/ArrowRight/Home/End roving-tabindex nav
// =====================================================================================

{
  const r = computeTabRovingNavigation(0, 0, 'ArrowRight');
  check('zero tabs is never handled', r.handled === false);
}
{
  const r = computeTabRovingNavigation(3, 0, 'Enter');
  check('unsupported key is never handled', r.handled === false);
}
{
  const r = computeTabRovingNavigation(1, 0, 'ArrowRight');
  check('single-tab list resolves ArrowRight to index 0', r.handled === true && r.nextIndex === 0);
}
{
  const r = computeTabRovingNavigation(1, 0, 'ArrowLeft');
  check('single-tab list resolves ArrowLeft to index 0', r.handled === true && r.nextIndex === 0);
}
{
  const r = computeTabRovingNavigation(5, 2, 'ArrowRight');
  check('ArrowRight from a middle tab moves to the next tab', r.handled === true && r.nextIndex === 3);
}
{
  const r = computeTabRovingNavigation(5, 4, 'ArrowRight');
  check('ArrowRight on the last tab wraps to the first', r.handled === true && r.nextIndex === 0);
}
{
  const r = computeTabRovingNavigation(5, 2, 'ArrowLeft');
  check('ArrowLeft from a middle tab moves to the previous tab', r.handled === true && r.nextIndex === 1);
}
{
  const r = computeTabRovingNavigation(5, 0, 'ArrowLeft');
  check('ArrowLeft on the first tab wraps to the last', r.handled === true && r.nextIndex === 4);
}
{
  const r = computeTabRovingNavigation(5, 2, 'Home');
  check('Home always resolves to index 0', r.handled === true && r.nextIndex === 0);
}
{
  const r = computeTabRovingNavigation(5, 2, 'End');
  check('End always resolves to the last index', r.handled === true && r.nextIndex === 4);
}
{
  const r = computeTabRovingNavigation(5, -1, 'ArrowRight');
  check('out-of-range currentIndex is treated as 0 before applying the key', r.handled === true && r.nextIndex === 1);
}

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
