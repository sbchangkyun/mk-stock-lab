/**
 * Phase 3GG-T-HF2: allowlist-based KIS token-error classifier.
 *
 * CRITICAL: a token refresh must be triggered ONLY by a response that CLEARLY means the access token is
 * invalid/expired. The repository contains no confirmed KIS "token invalid" response code, so the
 * allowlist is intentionally EMPTY and emergency refresh is disabled by default. Generic errors
 * (timeout, abort, DNS, 429, 4xx, 5xx, invalid symbol, no-data, parse error, partial-data, Supabase
 * auth failure) must NEVER be treated as token-invalid.
 *
 * When KIS's real token-invalid code is confirmed (repo evidence or bundled KIS docs), add it to
 * TOKEN_INVALID_CODES and enable emergency refresh via KIS_TOKEN_EMERGENCY_REFRESH_ENABLED.
 */

// Deliberately empty until a KIS token-invalid code is confirmed. Do NOT add generic HTTP codes here.
export const TOKEN_INVALID_CODES: ReadonlySet<string> = new Set<string>([]);

export interface KisErrorSignal {
  httpStatus?: number | null;
  kisResultCode?: string | null; // KIS rt_cd / msg_cd if surfaced
  internalCode?: string | null; // our sanitized provider code
}

/**
 * Returns true ONLY for a clearly-token-invalid signal on the confirmed allowlist. Everything else
 * (including generic 401/403/4xx/5xx) returns false so no token refresh is triggered.
 */
export const isClearlyTokenInvalid = (signal: KisErrorSignal): boolean => {
  const code = (signal.kisResultCode ?? signal.internalCode ?? '').trim();
  if (code.length === 0) return false;
  return TOKEN_INVALID_CODES.has(code);
};
