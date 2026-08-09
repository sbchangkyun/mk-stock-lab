/**
 * Phase 4F-HF2-A1 — pure, DOM-free decision for what identity a Portfolio position-form
 * submit actually carries. portfolio.astro owns all DOM reads; this module only computes the
 * resulting {symbol, market} so the decision can be tested deterministically without a browser.
 *
 * Three states, in priority order:
 * 1. A canonical combobox selection exists -> its symbol/country are authoritative.
 * 2. No selection, but a hidden symbol survived from an unmodified existing row (create/edit
 *    re-save without touching the visible text) -> resubmit it, trusting the hidden market ONLY
 *    because a hidden symbol accompanies it.
 * 3. Neither -> the visible text is a raw, possibly-exact entry (new symbol, or a modified edit
 *    that already cleared the hidden symbol). No market hint is ever fabricated here; the server's
 *    exact resolver (resolveCanonicalOrFail) infers the canonical country or rejects it.
 */

export type PositionIdentitySelection = {
  symbol: string;
  country: 'KR' | 'US';
};

export type PositionSubmitIdentityInput = {
  /** The current canonical combobox selection, or null if none / cleared by text edit. */
  selected: PositionIdentitySelection | null;
  /** The hidden #position-symbol field's raw value. */
  hiddenSymbol: string;
  /** The hidden #position-market field's raw value. Only trusted when hiddenSymbol is non-empty. */
  hiddenMarket: string;
  /** The visible #position-security-input field's raw value. */
  securityInput: string;
};

export type PositionSubmitIdentity = {
  symbol: string;
  market: 'KR' | 'US' | undefined;
};

export const resolvePositionSubmitIdentity = (
  input: PositionSubmitIdentityInput,
): PositionSubmitIdentity => {
  if (input.selected) {
    return { symbol: input.selected.symbol, market: input.selected.country };
  }

  const hiddenSymbol = input.hiddenSymbol.trim();
  if (hiddenSymbol) {
    const hiddenMarket = input.hiddenMarket.trim().toUpperCase();
    return {
      symbol: hiddenSymbol,
      market: hiddenMarket === 'KR' || hiddenMarket === 'US' ? hiddenMarket : undefined,
    };
  }

  return { symbol: input.securityInput.trim(), market: undefined };
};
