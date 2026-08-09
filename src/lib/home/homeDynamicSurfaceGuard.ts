/**
 * Phase 4F-UX1-A: approved Home dynamic-surface registry.
 *
 * A "dynamic Home surface" is any Home-page UI element whose visibility depends on
 * runtime state (auth status, DB/API response, persisted preferences, feature flags,
 * query params, or other API response state) rather than being unconditionally rendered.
 * Phase 4F-UX1-A found that HomeRetentionPanel -- never documented as such -- had become
 * visible in Production purely because of persisted retention preferences, with no code
 * change and no PR review of that specific state transition (UX-08; see
 * docs/planning/phase_4f_ux1a_home_surface_guard_result_v0.1.md).
 *
 * This registry is the Owner-approved allowlist that
 * scripts/check_phase_4f_ux1a_home_surface_contract.mjs validates against. Adding a new
 * state-dependent Home surface (or re-enabling one) requires adding it here as part of
 * that PR's review, not silently relying on it becoming visible later.
 */

export interface HomeDynamicSurface {
  id: string;
  component: string;
  description: string;
}

export const APPROVED_HOME_DYNAMIC_SURFACES: readonly HomeDynamicSurface[] = [
  {
    id: 'home-portfolio-panel',
    component: 'HomePortfolioPanel.astro',
    description:
      'Hero portfolio summary panel (resolving / signed_out / signed_in_empty / signed_in_with_portfolio states).',
  },
  {
    id: 'header-auth-state',
    component: 'Header.astro',
    description: 'Header signed-in vs signed-out account controls.',
  },
];

export const REJECTED_HOME_DYNAMIC_SURFACES: readonly HomeDynamicSurface[] = [
  {
    id: 'home-retention-panel',
    component: 'HomeRetentionPanel.astro',
    description:
      'Home resume card + compact watchlist -- removed from index.astro rendering by Phase 4F-UX1-A (UX-08); the component file is kept dormant (not deleted) and its backend is untouched.',
  },
];

export const isApprovedHomeDynamicSurface = (id: string): boolean =>
  APPROVED_HOME_DYNAMIC_SURFACES.some((s) => s.id === id);

export const isExplicitlyRejectedHomeDynamicSurface = (id: string): boolean =>
  REJECTED_HOME_DYNAMIC_SURFACES.some((s) => s.id === id);
