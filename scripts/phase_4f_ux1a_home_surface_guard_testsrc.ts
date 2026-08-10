/**
 * Phase 4F-UX1-A / UX1-A1 behavioral test source (bundled + run by
 * scripts/smoke_phase_4f_ux1a_home_surface.mjs via esbuild).
 *
 * Exercises the REAL, unmodified src/lib/home/homeDynamicSurfaceGuard.ts registry and its
 * compareHomeSurfaceInventory enforcement helper -- the render-tree-vs-registry invariant that
 * scripts/check_phase_4f_ux1a_home_surface_contract.mjs applies statically to index.astro. No
 * network, no DOM/browser.
 */

import {
  APPROVED_HOME_SURFACES,
  REJECTED_HOME_SURFACES,
  GLOBAL_SHELL_SURFACES,
  APPROVED_HOME_COMPONENT_NAMES,
  REJECTED_HOME_COMPONENT_NAMES,
  isApprovedHomeSurface,
  isExplicitlyRejectedHomeSurface,
  compareHomeSurfaceInventory,
} from '../src/lib/home/homeDynamicSurfaceGuard';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

export const runAll = async (): Promise<number> => {
  // --- registry shape ---------------------------------------------------
  check(
    'approved list has exactly 5 top-level Home components',
    APPROVED_HOME_SURFACES.length === 5,
  );
  check('rejected list has exactly 1 entry (HomeRetentionPanel)', REJECTED_HOME_SURFACES.length === 1);
  check(
    'header-auth-state lives in GLOBAL_SHELL_SURFACES, not APPROVED_HOME_SURFACES',
    GLOBAL_SHELL_SURFACES.some((s) => s.id === 'header-auth-state') &&
      !APPROVED_HOME_SURFACES.some((s) => s.id === 'header-auth-state'),
  );

  check('home-portfolio-panel is approved', isApprovedHomeSurface('home-portfolio-panel'));
  check('home-mobile-ad is approved', isApprovedHomeSurface('home-mobile-ad'));
  check('home-live-market-snapshot is approved', isApprovedHomeSurface('home-live-market-snapshot'));
  check('home-market-news is approved', isApprovedHomeSurface('home-market-news'));
  check('home-rail-ad is approved', isApprovedHomeSurface('home-rail-ad'));

  check('home-retention-panel is NOT approved', !isApprovedHomeSurface('home-retention-panel'));
  check(
    'home-retention-panel is explicitly recorded as rejected',
    isExplicitlyRejectedHomeSurface('home-retention-panel'),
  );
  check(
    'HomeRetentionPanel visibility is literally "rejected"',
    REJECTED_HOME_SURFACES[0]?.visibility === 'rejected',
  );

  check(
    'an unknown surface id is neither approved nor explicitly rejected',
    !isApprovedHomeSurface('unknown-surface') && !isExplicitlyRejectedHomeSurface('unknown-surface'),
  );

  // --- compareHomeSurfaceInventory enforcement logic ---------------------
  const approved = APPROVED_HOME_COMPONENT_NAMES;
  const rejected = REJECTED_HOME_COMPONENT_NAMES;

  // A. actual == approved -> PASS
  {
    const result = compareHomeSurfaceInventory({
      actualComponents: approved,
      approvedComponents: approved,
      rejectedComponents: rejected,
    });
    check('A: actual == approved -> ok', result.ok);
    check(
      'A: no missing/unexpected/rejectedRendered',
      result.missing.length === 0 && result.unexpected.length === 0 && result.rejectedRendered.length === 0,
    );
  }

  // B. actual contains an unregistered component -> FAIL / unexpected
  {
    const result = compareHomeSurfaceInventory({
      actualComponents: [...approved, 'HomeUnexpectedPanel'],
      approvedComponents: approved,
      rejectedComponents: rejected,
    });
    check('B: unregistered component -> not ok', !result.ok);
    check('B: unregistered component reported as unexpected', result.unexpected.includes('HomeUnexpectedPanel'));
  }

  // C. actual omits an approved component -> FAIL / missing
  {
    const withoutNews = approved.filter((c) => c !== 'HomeMarketNews');
    const result = compareHomeSurfaceInventory({
      actualComponents: withoutNews,
      approvedComponents: approved,
      rejectedComponents: rejected,
    });
    check('C: missing HomeMarketNews -> not ok', !result.ok);
    check('C: HomeMarketNews reported as missing', result.missing.includes('HomeMarketNews'));
  }

  // D. actual renders a rejected component -> FAIL / rejected-rendered
  {
    const result = compareHomeSurfaceInventory({
      actualComponents: [...approved, 'HomeRetentionPanel'],
      approvedComponents: approved,
      rejectedComponents: rejected,
    });
    check('D: rendering HomeRetentionPanel -> not ok', !result.ok);
    check(
      'D: HomeRetentionPanel reported as rejectedRendered',
      result.rejectedRendered.includes('HomeRetentionPanel'),
    );
  }

  // E. known stateful surfaces (HomeMobileAd / HomeRailAd) are approved, full match -> PASS
  {
    check('E: HomeMobileAd is in the approved component list', approved.includes('HomeMobileAd'));
    check('E: HomeRailAd is in the approved component list', approved.includes('HomeRailAd'));
    const result = compareHomeSurfaceInventory({
      actualComponents: approved,
      approvedComponents: approved,
      rejectedComponents: rejected,
    });
    check('E: full approved render set -> ok', result.ok);
  }

  // F. new unknown component appended after MARKET NEWS -> still FAIL
  {
    const actualWithTrailingUnknown = [
      'HomePortfolioPanel',
      'HomeMobileAd',
      'HomeLiveMarketSnapshot',
      'HomeMarketNews',
      'HomeNewTrailingPanel',
    ];
    const result = compareHomeSurfaceInventory({
      actualComponents: actualWithTrailingUnknown,
      approvedComponents: approved,
      rejectedComponents: rejected,
    });
    check('F: unknown component appended after MarketNews -> not ok', !result.ok);
    check(
      'F: trailing unknown component reported as unexpected',
      result.unexpected.includes('HomeNewTrailingPanel'),
    );
  }

  console.log(`\nphase_4f_ux1a_home_surface_guard_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
