/**
 * Server-only Supabase Auth subject resolver scaffold for Chart Similarity (Phase 3FC-C).
 *
 * This module is a disabled-by-default scaffold only. It never imports a Supabase package, never
 * calls a real Supabase client, never reads `process.env`/`.env`, never reads cookies or request
 * headers, and never verifies a real session/JWT. It only maps an explicit, caller-supplied input
 * object (a mocked session candidate, used solely for fixture/smoke verification) to a safe
 * resolver result. Any client-claimed role or subject in the input is ignored and produces a
 * warning; it never affects the result.
 *
 * `resolveSimilarityAuthSubject` only ever returns `roleSeed: 'anonymous' | 'authenticated'`. It
 * never resolves `beta`/`owner`/`admin` — those roles are the responsibility of a later, separate
 * role assignment resolver (Phase 3FC-D), per the Phase 3FC-B design.
 */

import type {
  SimilarityAuthSubjectResolverInput,
  SimilarityAuthSubjectResolverPolicy,
  SimilarityAuthSubjectResolverResult,
  SimilarityAuthSubjectResolverSafePolicySummary,
  SimilarityAuthSubjectSafeRef,
} from './similarityAuthSubjectResolverTypes';

/**
 * Builds the default policy: disabled, no real Supabase behavior possible. Every call returns a
 * fresh, deterministic object. No environment or secret value is ever read here.
 */
export const buildDefaultSimilarityAuthSubjectResolverPolicy = (): SimilarityAuthSubjectResolverPolicy => ({
  enabled: false,
  provider: 'supabase',
  allowRealSupabaseClient: false,
  allowEnvRead: false,
  allowCookieRead: false,
  allowHeaderRead: false,
  allowClientClaimedSubject: false,
  allowClientClaimedRole: false,
  allowTokenEcho: false,
  allowRawSessionEcho: false,
  allowRouteSuccess: false,
  allowPublicExecution: false,
  allowBetaExecution: false,
  notes: [
    'Disabled by default: no real Supabase runtime is connected or callable through this policy.',
    'This module never reads process.env, .env, cookies, or request headers.',
    'Real Supabase session verification is a separate, later, explicitly approved phase.',
  ],
});

/**
 * Builds a mocked scaffold policy usable only for smoke/fixture verification. `enabled` is true so
 * the mocked session candidate branches can be exercised, but every real-Supabase/route-success
 * boolean remains false — this policy still grants no real capability.
 */
export const buildMockedSimilarityAuthSubjectResolverPolicy = (): SimilarityAuthSubjectResolverPolicy => ({
  ...buildDefaultSimilarityAuthSubjectResolverPolicy(),
  enabled: true,
  notes: [
    'Mocked scaffold policy: usable only for smoke/fixture verification against synthetic session candidates.',
    'Still grants no real Supabase capability: allowRealSupabaseClient, allowEnvRead, allowCookieRead,',
    'allowHeaderRead, allowClientClaimedSubject, allowClientClaimedRole, allowTokenEcho,',
    'allowRawSessionEcho, allowRouteSuccess, allowPublicExecution, and allowBetaExecution all remain false.',
  ],
});

const toSafePolicySummary = (
  policy: SimilarityAuthSubjectResolverPolicy,
): SimilarityAuthSubjectResolverSafePolicySummary => ({
  enabled: policy.enabled,
  provider: policy.provider,
  allowRealSupabaseClient: policy.allowRealSupabaseClient,
  allowEnvRead: policy.allowEnvRead,
  allowCookieRead: policy.allowCookieRead,
  allowHeaderRead: policy.allowHeaderRead,
  allowClientClaimedSubject: policy.allowClientClaimedSubject,
  allowClientClaimedRole: policy.allowClientClaimedRole,
  allowTokenEcho: policy.allowTokenEcho,
  allowRawSessionEcho: policy.allowRawSessionEcho,
  allowRouteSuccess: policy.allowRouteSuccess,
  allowPublicExecution: policy.allowPublicExecution,
  allowBetaExecution: policy.allowBetaExecution,
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Normalizes a caller-supplied input object. Never reads `Request`, cookies, headers, or
 * `process.env` — only the explicit input object is inspected. Malformed input is treated as
 * `invalid_context` by the caller rather than thrown here.
 */
export const normalizeSimilarityAuthSubjectResolverInput = (
  input: unknown,
): SimilarityAuthSubjectResolverInput | null => {
  if (!isPlainObject(input)) return null;
  if (input.provider !== 'supabase') return null;
  if (input.mode !== 'disabled-scaffold' && input.mode !== 'mocked-scaffold') return null;

  const rawCandidate = input.serverSessionCandidate;
  let serverSessionCandidate: SimilarityAuthSubjectResolverInput['serverSessionCandidate'] = null;
  if (isPlainObject(rawCandidate)) {
    const state = rawCandidate.state;
    if (state === 'missing' || state === 'valid' || state === 'invalid') {
      serverSessionCandidate = {
        kind: 'mock-supabase-session',
        state,
        subjectRef: typeof rawCandidate.subjectRef === 'string' ? rawCandidate.subjectRef : undefined,
        emailVerified: typeof rawCandidate.emailVerified === 'boolean' ? rawCandidate.emailVerified : undefined,
      };
    }
  }

  return {
    provider: 'supabase',
    mode: input.mode,
    serverSessionCandidate,
    clientClaimedRole: typeof input.clientClaimedRole === 'string' ? input.clientClaimedRole : null,
    clientClaimedSubject: typeof input.clientClaimedSubject === 'string' ? input.clientClaimedSubject : null,
  };
};

const buildAnonymousResult = (
  status: SimilarityAuthSubjectResolverResult['status'],
  policy: SimilarityAuthSubjectResolverPolicy,
  safeMessage: string,
  warnings: string[],
): SimilarityAuthSubjectResolverResult => ({
  ok: false,
  status,
  authState: 'anonymous',
  roleSeed: 'anonymous',
  subject: null,
  safeMessage,
  policy: toSafePolicySummary(policy),
  warnings,
});

/**
 * Resolves an auth subject from an explicit input object. Never reads `Request`, cookies,
 * headers, or `process.env`. Never trusts a client-claimed role or subject — both are ignored and
 * recorded only as a safe warning.
 */
export const resolveSimilarityAuthSubject = (
  rawInput: unknown,
  policy: SimilarityAuthSubjectResolverPolicy = buildDefaultSimilarityAuthSubjectResolverPolicy(),
): SimilarityAuthSubjectResolverResult => {
  const warnings: string[] = [];

  const input = normalizeSimilarityAuthSubjectResolverInput(rawInput);
  if (!input) {
    return buildAnonymousResult('invalid_context', policy, 'The request context could not be resolved safely.', warnings);
  }

  if (input.clientClaimedRole || input.clientClaimedSubject) {
    warnings.push('client_claim_ignored');
  }

  if (!policy.enabled) {
    return buildAnonymousResult('disabled', policy, 'Real auth subject resolution is disabled by default.', warnings);
  }

  const candidate = input.serverSessionCandidate;
  if (!candidate || candidate.state === 'missing') {
    return buildAnonymousResult('anonymous', policy, 'No session was presented; treated as anonymous.', warnings);
  }

  if (candidate.state === 'invalid') {
    return buildAnonymousResult(
      'invalid_context',
      policy,
      'The presented session candidate was invalid and could not be resolved.',
      warnings,
    );
  }

  const subjectRef = candidate.subjectRef;
  if (!subjectRef) {
    return buildAnonymousResult(
      'invalid_context',
      policy,
      'The presented session candidate had no resolvable subject reference.',
      warnings,
    );
  }

  const subject: SimilarityAuthSubjectSafeRef = {
    provider: 'supabase',
    subjectRef,
    source: 'mocked-scaffold',
    stableForUsageLookup: true,
  };

  return {
    ok: true,
    status: 'authenticated',
    authState: 'authenticated',
    roleSeed: 'authenticated',
    subject,
    safeMessage: 'Resolved a mocked authenticated auth subject for scaffold verification only.',
    policy: toSafePolicySummary(policy),
    warnings,
  };
};

const FORBIDDEN_RESULT_SUBSTRINGS = [
  'accessToken',
  'refreshToken',
  'jwt',
  'secret',
  'credential',
  'rawSession',
  'account',
  'trading',
  'balance',
  '"source":"live"',
  '"source":"auto"',
];

const collectPrimitiveValues = (value: unknown, out: string[]): void => {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) collectPrimitiveValues(item, out);
    return;
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) collectPrimitiveValues(nested, out);
    return;
  }
  out.push(String(value));
};

/**
 * Asserts the result contains no forbidden VALUE. Scans only primitive values (never key names),
 * so a safe policy field name such as `allowRawSessionEcho` never false-positives against the
 * `rawSession` forbidden substring — only an actual value (e.g. a leaked raw session string) would
 * trigger it. Intended for test/smoke context; throws only if a forbidden value is detected.
 */
export const assertSimilarityAuthSubjectResolverResultIsSafe = (
  result: SimilarityAuthSubjectResolverResult,
): void => {
  const values: string[] = [];
  collectPrimitiveValues(result, values);
  const haystack = values.join(' ').toLowerCase();
  const found = FORBIDDEN_RESULT_SUBSTRINGS.filter((needle) => haystack.includes(needle.toLowerCase()));
  if (found.length > 0) {
    throw new Error(`Similarity auth subject resolver result is unsafe (found: ${found.join(', ')})`);
  }
};
