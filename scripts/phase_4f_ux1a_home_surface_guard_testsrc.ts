/**
 * Phase 4F-UX1-A behavioral test source (bundled + run by
 * scripts/smoke_phase_4f_ux1a_home_surface.mjs via esbuild).
 *
 * Exercises the REAL, unmodified src/lib/home/homeDynamicSurfaceGuard.ts registry -- the
 * stateful-UI regression guard (§6) that scripts/check_phase_4f_ux1a_home_surface_contract.mjs
 * validates statically against index.astro. No network, no DOM/browser.
 */

import {
  APPROVED_HOME_DYNAMIC_SURFACES,
  REJECTED_HOME_DYNAMIC_SURFACES,
  isApprovedHomeDynamicSurface,
  isExplicitlyRejectedHomeDynamicSurface,
} from '../src/lib/home/homeDynamicSurfaceGuard';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

export const runAll = async (): Promise<number> => {
  check(
    'approved list has exactly 2 entries (portfolio summary + header auth state)',
    APPROVED_HOME_DYNAMIC_SURFACES.length === 2,
  );
  check('rejected list has exactly 1 entry (home-retention-panel)', REJECTED_HOME_DYNAMIC_SURFACES.length === 1);

  check('home-portfolio-panel is approved', isApprovedHomeDynamicSurface('home-portfolio-panel'));
  check('header-auth-state is approved', isApprovedHomeDynamicSurface('header-auth-state'));

  check('home-retention-panel is NOT approved', !isApprovedHomeDynamicSurface('home-retention-panel'));
  check(
    'home-retention-panel is explicitly recorded as rejected',
    isExplicitlyRejectedHomeDynamicSurface('home-retention-panel'),
  );

  check(
    'an unknown surface id is neither approved nor explicitly rejected (unlisted, not silently allowed)',
    !isApprovedHomeDynamicSurface('unknown-surface') && !isExplicitlyRejectedHomeDynamicSurface('unknown-surface'),
  );

  check(
    'rejected entry names the correct removed component',
    REJECTED_HOME_DYNAMIC_SURFACES[0]?.component === 'HomeRetentionPanel.astro',
  );

  console.log(`\nphase_4f_ux1a_home_surface_guard_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
