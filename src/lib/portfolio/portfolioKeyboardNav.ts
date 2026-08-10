/**
 * Phase 4E-B — pure, DOM-free keyboard-navigation index calculations for Portfolio.
 *
 * portfolio.astro owns all DOM querying and focus calls; this module only computes the resulting
 * index/decision so the logic can be tested deterministically without a browser.
 */

/** Result of a Tab/Shift+Tab keydown inside a focus-trapped dialog. */
export type DialogFocusWrapResult = {
  /** True when the keydown should be intercepted (preventDefault + focus the target index). */
  shouldIntercept: boolean;
  /** Index into the dialog's focusable-elements list to move focus to, when shouldIntercept is true. */
  targetIndex: number;
};

const NO_INTERCEPT: DialogFocusWrapResult = { shouldIntercept: false, targetIndex: -1 };

/**
 * Computes Tab-containment behavior for a focus-trapped dialog.
 *
 * - focusableCount <= 0: nothing to trap, never intercept.
 * - focusableCount === 1: the single element always wraps to itself.
 * - currentIndex not found (-1): do not intercept (let the browser's default focus order apply).
 * - Tab on the last element wraps to the first; Shift+Tab on the first element wraps to the last.
 * - Any other Tab/Shift+Tab is left alone (native order already correct).
 */
export const computeDialogFocusWrap = (
  focusableCount: number,
  currentIndex: number,
  shiftKey: boolean,
): DialogFocusWrapResult => {
  if (!Number.isFinite(focusableCount) || focusableCount <= 0) return NO_INTERCEPT;
  if (currentIndex < 0 || currentIndex >= focusableCount) return NO_INTERCEPT;

  if (focusableCount === 1) {
    return { shouldIntercept: true, targetIndex: 0 };
  }

  const lastIndex = focusableCount - 1;
  if (shiftKey && currentIndex === 0) {
    return { shouldIntercept: true, targetIndex: lastIndex };
  }
  if (!shiftKey && currentIndex === lastIndex) {
    return { shouldIntercept: true, targetIndex: 0 };
  }
  return NO_INTERCEPT;
};

export type TabRovingNavigationKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

/** Result of a roving-tabindex navigation keydown on an ARIA tablist. */
export type TabRovingNavigationResult = {
  /** True when the key was a supported navigation key and the index changed (or list has 1 tab). */
  handled: boolean;
  /** The tab index that should become tabindex=0 and receive focus, when handled is true. */
  nextIndex: number;
};

const NO_NAVIGATION: TabRovingNavigationResult = { handled: false, nextIndex: -1 };

const isSupportedRovingKey = (key: string): key is TabRovingNavigationKey =>
  key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End';

/**
 * Computes the next selected-tab index for ArrowLeft/ArrowRight/Home/End with wrap-around.
 *
 * - tabCount <= 0: nothing to navigate.
 * - Unsupported key: not handled, caller takes no action.
 * - tabCount === 1: always resolves to index 0 (handled, so the caller can still move focus there).
 * - ArrowRight wraps from the last tab to the first; ArrowLeft wraps from the first tab to the last.
 */
export const computeTabRovingNavigation = (
  tabCount: number,
  currentIndex: number,
  key: string,
): TabRovingNavigationResult => {
  if (!Number.isFinite(tabCount) || tabCount <= 0) return NO_NAVIGATION;
  if (!isSupportedRovingKey(key)) return NO_NAVIGATION;

  if (tabCount === 1) {
    return { handled: true, nextIndex: 0 };
  }

  const safeCurrent = currentIndex >= 0 && currentIndex < tabCount ? currentIndex : 0;
  const lastIndex = tabCount - 1;

  if (key === 'Home') return { handled: true, nextIndex: 0 };
  if (key === 'End') return { handled: true, nextIndex: lastIndex };
  if (key === 'ArrowRight') return { handled: true, nextIndex: safeCurrent === lastIndex ? 0 : safeCurrent + 1 };
  return { handled: true, nextIndex: safeCurrent === 0 ? lastIndex : safeCurrent - 1 };
};
