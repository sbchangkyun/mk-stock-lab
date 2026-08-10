/**
 * Phase 4F-UX1-A / UX1-A1: Home top-level surface inventory + render-tree enforcement.
 *
 * A "Home surface" here is a top-level `Home*.astro` component rendered directly by
 * src/pages/index.astro (not an internal loading/empty/error substate inside an already-
 * approved component -- those are not separately tracked here).
 *
 * Phase 4F-UX1-A (UX-08) found that HomeRetentionPanel -- never removed from index.astro --
 * became visible in Production purely because of persisted retention preferences, with no
 * code change and no PR review of that specific state transition. The initial UX1-A registry
 * only recorded an allowlist of ids; it did not verify those ids against the ACTUAL rendered
 * component tree, so a brand-new unregistered `Home*.astro` component could still slip onto
 * the page undetected. UX1-A1 closes that gap: scripts/check_phase_4f_ux1a_home_surface_contract.mjs
 * parses the real `<Home...` tags rendered by index.astro and calls compareHomeSurfaceInventory
 * below to require an exact match against this registry (modulo explicitly rejected components,
 * which must render zero times).
 *
 * Guarantee and its limit (see docs/planning/phase_4f_ux1a_home_surface_guard_result_v0.1.md):
 * this registry + its checker can only prove which top-level Home*.astro components render and
 * in what order. It CANNOT detect a new internal state inside an already-approved component (an
 * auth/API/DB/localStorage/feature-flag change that exposes a previously-hidden substate without
 * adding a new component). That category still requires a manual VISIBILITY-STATE DIFF during PR
 * review, per §7 of the UX1-A result doc.
 */

export type HomeSurfaceVisibility = 'always' | 'stateful' | 'rejected';

export interface HomeSurface {
  id: string;
  component: string;
  visibility: HomeSurfaceVisibility;
  description: string;
}

/**
 * Every top-level Home*.astro component index.astro currently renders. Adding a new one
 * (or re-enabling a rejected one) requires adding/updating an entry here as part of that PR's
 * review -- the checker fails otherwise.
 */
export const APPROVED_HOME_SURFACES: readonly HomeSurface[] = [
  {
    id: 'home-portfolio-panel',
    component: 'HomePortfolioPanel',
    visibility: 'always',
    description:
      'Hero portfolio summary panel. Always rendered; internal state (resolving / signed_out / ' +
      'signed_in_empty / signed_in_with_portfolio) varies with auth/portfolio data, but the ' +
      'component itself is unconditionally present.',
  },
  {
    id: 'home-mobile-ad',
    component: 'HomeMobileAd',
    visibility: 'stateful',
    description: 'Mobile-only ad slot; visibility depends on managed ad availability.',
  },
  {
    id: 'home-live-market-snapshot',
    component: 'HomeLiveMarketSnapshot',
    visibility: 'always',
    description:
      'Top-level market snapshot section. Always rendered; loading/content states are dynamic internally.',
  },
  {
    id: 'home-market-news',
    component: 'HomeMarketNews',
    visibility: 'always',
    description:
      'Top-level market news section. Always rendered; loading/content/fallback states are dynamic internally.',
  },
  {
    id: 'home-rail-ad',
    component: 'HomeRailAd',
    visibility: 'stateful',
    description:
      'Sidebar ad slot; visibility depends on managed ad availability. Rendered in the sidebar ' +
      'branch, not the main column -- excluded from the main-column linear order contract.',
  },
];

/** Components that must render zero times. Rendering one is a checker failure, not a warning. */
export const REJECTED_HOME_SURFACES: readonly HomeSurface[] = [
  {
    id: 'home-retention-panel',
    component: 'HomeRetentionPanel',
    visibility: 'rejected',
    description:
      'Home resume card + compact watchlist -- removed from index.astro rendering by Phase ' +
      '4F-UX1-A (UX-08); the component file is kept dormant (not deleted) and its backend is untouched.',
  },
];

/**
 * Header/global auth-state controls are owned by Layout/Common Shell, not by a direct
 * Home*.astro component rendered by index.astro. Tracked separately so it is never mixed into
 * the Home render-tree comparison below.
 */
export const GLOBAL_SHELL_SURFACES: readonly HomeSurface[] = [
  {
    id: 'header-auth-state',
    component: 'Header',
    visibility: 'stateful',
    description:
      'Header signed-in vs signed-out account controls, owned by Layout/Common Shell -- not a ' +
      'Home*.astro component and not part of the index.astro render-tree inventory.',
  },
];

export const APPROVED_HOME_COMPONENT_NAMES: readonly string[] = APPROVED_HOME_SURFACES.map(
  (s) => s.component,
);

export const REJECTED_HOME_COMPONENT_NAMES: readonly string[] = REJECTED_HOME_SURFACES.map(
  (s) => s.component,
);

export const isApprovedHomeSurface = (id: string): boolean =>
  APPROVED_HOME_SURFACES.some((s) => s.id === id);

export const isExplicitlyRejectedHomeSurface = (id: string): boolean =>
  REJECTED_HOME_SURFACES.some((s) => s.id === id);

export interface HomeSurfaceInventoryComparison {
  ok: boolean;
  /** Approved components that were not actually rendered. */
  missing: string[];
  /** Rendered components that are neither approved nor explicitly rejected. */
  unexpected: string[];
  /** Rendered components that are explicitly rejected -- must always be empty. */
  rejectedRendered: string[];
}

/**
 * Pure comparison between what index.astro actually renders and what this registry approves.
 * Exact-match invariant: actualComponents must equal approvedComponents, and must contain none
 * of rejectedComponents. Any deviation is a failure, not a warning.
 */
export const compareHomeSurfaceInventory = ({
  actualComponents,
  approvedComponents,
  rejectedComponents,
}: {
  actualComponents: readonly string[];
  approvedComponents: readonly string[];
  rejectedComponents: readonly string[];
}): HomeSurfaceInventoryComparison => {
  const actualSet = new Set(actualComponents);
  const approvedSet = new Set(approvedComponents);
  const rejectedSet = new Set(rejectedComponents);

  const missing = approvedComponents.filter((component) => !actualSet.has(component));
  const rejectedRendered = actualComponents.filter((component) => rejectedSet.has(component));
  const unexpected = actualComponents.filter(
    (component) => !approvedSet.has(component) && !rejectedSet.has(component),
  );

  return {
    ok: missing.length === 0 && unexpected.length === 0 && rejectedRendered.length === 0,
    missing,
    unexpected,
    rejectedRendered,
  };
};
