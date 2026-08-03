/**
 * Phase 4A: shared primary-navigation contract, extracted from Nav.astro so the exact-5-item list
 * and active-link matching logic are real, importable, testable code rather than markup-only
 * frontmatter. Behavior is unchanged from the pre-4A inline implementation -- this is a pure
 * refactor plus the addition of an aria-current resolver for accessibility.
 *
 * The nav intentionally exposes exactly five destinations. /admin/operations must never appear
 * here (it stays unlinked from the public shell), and /heatmap is kept only as a legacy alias that
 * marks "시장" active -- it does not get its own nav entry or its own route rename.
 */

export type NavItem = {
  label: string;
  href: string;
  aliases?: string[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Chart AI', href: '/chart-ai' },
  { label: '시장', href: '/market', aliases: ['/heatmap'] },
  { label: 'Lab', href: '/lab' },
  { label: '포트폴리오', href: '/portfolio' },
];

/**
 * True when `currentPath` should mark `item` as the active nav entry. The root ("/") entry only
 * matches an exact "/" so it never lights up for every other route; every other entry matches its
 * own path, any sub-path under it, or any of its declared aliases (and their sub-paths).
 */
export const isNavItemActive = (item: NavItem, currentPath: string): boolean => {
  const { href } = item;
  if (href === '/') return currentPath === '/';
  return (
    currentPath === href ||
    currentPath.startsWith(`${href}/`) ||
    Boolean(item.aliases?.some((alias) => currentPath === alias || currentPath.startsWith(`${alias}/`)))
  );
};

/** Returns the exact href of the single active nav item for `currentPath`, or null if none match. */
export const resolveActiveNavHref = (currentPath: string, items: readonly NavItem[] = NAV_ITEMS): string | null => {
  const match = items.find((item) => isNavItemActive(item, currentPath));
  return match ? match.href : null;
};
