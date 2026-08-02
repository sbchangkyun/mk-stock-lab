/**
 * Phase 3GL-HF2 — shared KIS current-price quote direction/sign normalization.
 *
 * Both the domestic (FHKST01010100) and overseas (HHDFS00000300) current-price quote endpoints report
 * a change-amount and change-percentage field whose sign convention is not reliably self-evident from
 * either field alone -- the overseas `diff` field is documented as an unsigned magnitude while `rate`
 * is already signed, and the domestic `prdy_vrss`/`prdy_ctrt` pair is not guaranteed to be internally
 * consistent either. Both endpoints separately report an official direction/sign code
 * (`prdy_vrss_sign` domestically, `sign` overseas) using the same five-value KIS convention. This
 * module is the single place that resolves a trustworthy signed { change, changePct } pair from those
 * raw inputs. It never fabricates a direction it cannot verify, and it never touches price.
 */

type KisQuoteSignCode = '1' | '2' | '3' | '4' | '5';

export type KisQuoteSignNormalizationInput = {
  rawAmount: number | null;
  rawPct: number | null;
  /** Official KIS direction/sign code: '1' upper-limit-up, '2' up, '3' unchanged, '4' lower-limit-down, '5' down. */
  signCode?: string | null;
};

export type KisQuoteSignNormalizationResult = {
  change: number | null;
  changePct: number | null;
};

const SIGN_CODE_MULTIPLIER: Record<KisQuoteSignCode, -1 | 0 | 1> = {
  '1': 1,
  '2': 1,
  '3': 0,
  '4': -1,
  '5': -1,
};

const resolveSignCodeMultiplier = (signCode: string | null | undefined): -1 | 0 | 1 | null => {
  if (typeof signCode !== 'string') return null;
  const trimmed = signCode.trim();
  return trimmed in SIGN_CODE_MULTIPLIER ? SIGN_CODE_MULTIPLIER[trimmed as KisQuoteSignCode] : null;
};

const signOf = (value: number): -1 | 0 | 1 => (value > 0 ? 1 : value < 0 ? -1 : 0);

/**
 * Direction priority:
 *  1. The official sign code, when it resolves to a known value -- both raw fields are treated as
 *     magnitudes and given that direction.
 *  2. Raw amount and percentage when both are present and either share a sign or one of them is zero
 *     (nothing to contradict).
 *  3. A guarded fallback used only when the two raw fields disagree in sign: the amount is treated as
 *     an unsigned magnitude and the percentage's sign (already reported signed by the provider) is
 *     applied to it. The percentage itself is preserved as-is.
 *  4. A single raw field present alone is returned unmodified -- it has nothing to contradict it.
 *
 * Guarantees: a positive amount is never paired with a negative percentage or vice versa; price is
 * never referenced or modified by this function.
 */
export const normalizeKisQuoteSign = (
  input: KisQuoteSignNormalizationInput,
): KisQuoteSignNormalizationResult => {
  const { rawAmount, rawPct } = input;
  const directionSign = resolveSignCodeMultiplier(input.signCode);

  if (directionSign !== null) {
    const change = rawAmount === null ? null : directionSign === 0 ? 0 : Math.abs(rawAmount) * directionSign;
    const changePct = rawPct === null ? null : directionSign === 0 ? 0 : Math.abs(rawPct) * directionSign;
    return { change, changePct };
  }

  if (rawAmount === null || rawPct === null) {
    return { change: rawAmount, changePct: rawPct };
  }

  if (rawAmount === 0 || rawPct === 0 || signOf(rawAmount) === signOf(rawPct)) {
    return { change: rawAmount, changePct: rawPct };
  }

  return { change: Math.abs(rawAmount) * signOf(rawPct), changePct: rawPct };
};
