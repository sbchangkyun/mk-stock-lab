/**
 * Server-only real-compatible Supabase Auth subject resolver for Chart Similarity (Phase 3FD-B).
 *
 * This module proves the boundary shape of a future real Supabase Auth subject resolver: it
 * accepts an injected Supabase-compatible auth client (`SimilarityRealSupabaseAuthSubjectResolverDeps.authClient`)
 * and never creates a real Supabase client itself, never imports `@supabase/*`, never reads
 * `process.env`/`import.meta.env`/`.env`, never reads cookies or request headers, never calls
 * `fetch`, and never verifies a real session or JWT. In this phase the only implementations of the
 * injected client are deterministic, local, in-memory mocked clients (see the fixtures module) —
 * a real Supabase-backed implementation of the client interface remains a later, separately
 * approved phase.
 *
 * `resolveSimilarityRealSupabaseAuthSubject` never trusts `clientClaimedRole` (or a resolved user's
 * `clientRoleClaim`) — both are always ignored, and their presence only ever produces a safe
 * warning.
 */

import type {
  SimilarityRealSupabaseAuthSubjectResolverDeps,
  SimilarityRealSupabaseAuthSubjectResolverInput,
  SimilarityRealSupabaseAuthSubjectResolverPolicy,
  SimilarityRealSupabaseAuthSubjectResolverResult,
  SimilarityRealSupabaseAuthSubject,
  SimilarityRealSupabaseAuthSubjectResolverSubjectSeed,
} from './similarityRealSupabaseAuthSubjectResolverTypes';

// Bare category words like the safe `providerKind: 'email'` enum value must remain allowed, so
// email leakage is detected structurally (an address-shaped value, e.g. "user@example.com")
// rather than by the bare word "email".
const FORBIDDEN_RESULT_SUBSTRINGS = [
  'accesstoken',
  'refreshtoken',
  'jwt',
  'rawsession',
  'rawuser',
  'phone',
  'provider_metadata',
  'cookie',
  'authorization',
  'supabase_service_role_key',
  'service_role',
  'secret',
  'credential',
  'kis_app_key',
  'kis_app_secret',
  'account',
  'trading',
  'balance',
  '"source":"live"',
  '"source":"auto"',
];

const EMAIL_ADDRESS_SHAPE_PATTERN = /[^\s"|]+@[^\s"|]+\.[^\s"|]+/;

function anonymousSubject(safeWarnings: string[] = []): SimilarityRealSupabaseAuthSubject {
  return {
    state: 'anonymous',
    subjectRef: null,
    providerKind: null,
    roleSeed: 'anonymous',
    safeWarnings,
  };
}

export function buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy(): SimilarityRealSupabaseAuthSubjectResolverPolicy {
  return {
    enabled: false,
    allowInjectedSupabaseCompatibleClient: false,
    allowRealSupabaseClientCreation: false,
    allowEnvRead: false,
    allowCookieRead: false,
    allowHeaderRead: false,
    allowJwtVerification: false,
    allowRouteSuccess: false,
    allowClientRoleTrust: false,
    allowRawSessionEcho: false,
    allowRawUserEcho: false,
    notes: [
      'Disabled by default. No real Supabase client is created and no real Supabase call is made by this resolver.',
      'Only an injected Supabase-compatible auth client may ever be consulted; this resolver never constructs one itself.',
      'Client-claimed roles are never trusted; only a server-resolved role seed may ever be authoritative.',
    ],
  };
}

export function buildInjectedMockSimilarityRealSupabaseAuthSubjectResolverPolicy(): SimilarityRealSupabaseAuthSubjectResolverPolicy {
  return {
    ...buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy(),
    enabled: true,
    allowInjectedSupabaseCompatibleClient: true,
  };
}

function toSafePolicySummary(policy: SimilarityRealSupabaseAuthSubjectResolverPolicy) {
  return {
    enabled: policy.enabled,
    allowInjectedSupabaseCompatibleClient: policy.allowInjectedSupabaseCompatibleClient,
    allowRealSupabaseClientCreation: policy.allowRealSupabaseClientCreation,
    allowEnvRead: policy.allowEnvRead,
    allowCookieRead: policy.allowCookieRead,
    allowHeaderRead: policy.allowHeaderRead,
    allowJwtVerification: policy.allowJwtVerification,
    allowRouteSuccess: policy.allowRouteSuccess,
    allowClientRoleTrust: policy.allowClientRoleTrust,
    allowRawSessionEcho: policy.allowRawSessionEcho,
    allowRawUserEcho: policy.allowRawUserEcho,
  };
}

/**
 * Normalizes an explicit in-memory input object only. Never reads a Request, cookies, headers,
 * env, a database, Supabase, or `fetch` — only the plain object the caller passed in.
 */
export function normalizeSimilarityRealSupabaseAuthSubjectResolverInput(
  input: unknown,
): SimilarityRealSupabaseAuthSubjectResolverInput | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const validTokenShapes = ['absent', 'present-redacted', 'malformed-redacted'];

  if (
    candidate.tokenShape !== undefined &&
    candidate.tokenShape !== null &&
    (typeof candidate.tokenShape !== 'string' || !validTokenShapes.includes(candidate.tokenShape))
  ) {
    return null;
  }

  return {
    sessionEvidenceRef: typeof candidate.sessionEvidenceRef === 'string' ? candidate.sessionEvidenceRef : null,
    tokenShape: (candidate.tokenShape as SimilarityRealSupabaseAuthSubjectResolverInput['tokenShape']) ?? null,
    currentIso: typeof candidate.currentIso === 'string' ? candidate.currentIso : null,
    requestedRuntime:
      candidate.requestedRuntime === 'auth-subject-resolution' ? 'auth-subject-resolution' : null,
    clientClaimedRole: candidate.clientClaimedRole,
  };
}

/**
 * Resolves an auth subject using only an explicitly injected Supabase-compatible auth client.
 * Never creates a real Supabase client, never reaches the network, cookies, headers, or env
 * itself — any I/O only ever happens inside the caller-supplied `deps.authClient.getUser()`.
 */
export async function resolveSimilarityRealSupabaseAuthSubject(
  rawInput: unknown,
  deps: SimilarityRealSupabaseAuthSubjectResolverDeps = {},
  policy: SimilarityRealSupabaseAuthSubjectResolverPolicy = buildDefaultSimilarityRealSupabaseAuthSubjectResolverPolicy(),
): Promise<SimilarityRealSupabaseAuthSubjectResolverResult> {
  const safePolicy = toSafePolicySummary(policy);
  const input = normalizeSimilarityRealSupabaseAuthSubjectResolverInput(rawInput);

  const warnings: string[] = [];
  const hasClientClaimedRole =
    typeof rawInput === 'object' &&
    rawInput !== null &&
    'clientClaimedRole' in (rawInput as Record<string, unknown>) &&
    (rawInput as Record<string, unknown>).clientClaimedRole !== undefined &&
    (rawInput as Record<string, unknown>).clientClaimedRole !== null;

  if (hasClientClaimedRole) {
    warnings.push('client_role_claim_ignored');
  }

  if (input === null) {
    return {
      ok: false,
      status: 'malformed_session',
      source: 'disabled',
      subject: anonymousSubject(warnings),
      safeMessage: 'Resolver input was malformed; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (!policy.enabled || !policy.allowInjectedSupabaseCompatibleClient) {
    return {
      ok: false,
      status: 'disabled',
      source: 'disabled',
      subject: anonymousSubject(warnings),
      safeMessage: 'Real-compatible Supabase Auth subject resolver is disabled by policy.',
      warnings,
      policy: safePolicy,
    };
  }

  const authClient = deps.authClient ?? null;
  if (!authClient) {
    return {
      ok: false,
      status: 'client_unavailable',
      source: 'injected-supabase-compatible-client',
      subject: anonymousSubject(warnings),
      safeMessage: 'No injected Supabase-compatible auth client was provided; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  const clientResult = await authClient.getUser({
    sessionEvidenceRef: input.sessionEvidenceRef ?? '',
    tokenShape: input.tokenShape ?? 'absent',
    requestedAtIso: input.currentIso ?? null,
  });

  if (clientResult.status === 'missing_session') {
    return {
      ok: false,
      status: 'missing_session',
      source: 'injected-supabase-compatible-client',
      subject: anonymousSubject(warnings),
      safeMessage: 'No session was present; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (clientResult.status === 'invalid_session') {
    return {
      ok: false,
      status: 'invalid_session',
      source: 'injected-supabase-compatible-client',
      subject: anonymousSubject(warnings),
      safeMessage: 'Session was invalid; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (clientResult.status === 'expired_session') {
    return {
      ok: false,
      status: 'expired_session',
      source: 'injected-supabase-compatible-client',
      subject: anonymousSubject(warnings),
      safeMessage: 'Session was expired; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (clientResult.status === 'malformed_session') {
    return {
      ok: false,
      status: 'malformed_session',
      source: 'injected-supabase-compatible-client',
      subject: anonymousSubject(warnings),
      safeMessage: 'Session was malformed; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (clientResult.status === 'client_error') {
    return {
      ok: false,
      status: 'error',
      source: 'injected-supabase-compatible-client',
      subject: anonymousSubject(warnings),
      safeMessage: `Injected auth client reported an error (category: ${clientResult.errorCategory ?? 'unknown'}); treated as anonymous.`,
      warnings,
      policy: safePolicy,
    };
  }

  // clientResult.status === 'ok'
  const user = clientResult.user ?? null;
  if (!user || typeof user.userRef !== 'string' || user.userRef.length === 0) {
    return {
      ok: false,
      status: 'invalid_session',
      source: 'injected-supabase-compatible-client',
      subject: anonymousSubject(warnings),
      safeMessage: 'Injected auth client reported ok but carried no safe user reference; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (user.clientRoleClaim !== undefined && user.clientRoleClaim !== null && !warnings.includes('client_role_claim_ignored')) {
    warnings.push('client_role_claim_ignored');
  }

  const providerKind = user.providerKind ?? 'unknown';
  const subjectRef = `real-supabase-auth-subject:${user.userRef}`;

  return {
    ok: true,
    status: 'resolved',
    source: 'injected-supabase-compatible-client',
    subject: {
      state: 'authenticated',
      subjectRef,
      providerKind,
      roleSeed: 'authenticated',
      safeWarnings: warnings,
    },
    safeMessage: 'Injected Supabase-compatible auth client resolved an authenticated subject seed.',
    warnings,
    policy: safePolicy,
  };
}

/**
 * Maps a resolver result to a safe seed shape compatible with the Phase 3FC-C auth subject
 * resolver's expectations. Never surfaces `beta`/`owner`/`admin`, and never a raw id/email/token.
 */
export function mapRealSupabaseAuthSubjectResultToAuthSubjectSeed(
  result: SimilarityRealSupabaseAuthSubjectResolverResult,
): SimilarityRealSupabaseAuthSubjectResolverSubjectSeed {
  if (!result.ok || result.subject.state !== 'authenticated') {
    return {
      authState: 'anonymous',
      roleSeed: 'anonymous',
      subjectRef: null,
    };
  }

  return {
    authState: 'authenticated',
    roleSeed: 'authenticated',
    subjectRef: result.subject.subjectRef,
  };
}

function collectPrimitiveValues(value: unknown, sink: string[]): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    sink.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectPrimitiveValues(item, sink);
    }
    return;
  }
  if (typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      collectPrimitiveValues((value as Record<string, unknown>)[key], sink);
    }
  }
}

/**
 * Asserts that a resolver result carries no forbidden value (token, raw session/user, a real
 * email-address-shaped value, cookie/header/env value, service role key, KIS/account/trading/
 * balance field, or live/auto source marker). Throws if any forbidden content is found. Checks
 * values only, never key names, so that safe field names do not themselves trigger a false
 * positive, and the safe `providerKind: 'email'` category value is not itself flagged.
 */
export function assertSimilarityRealSupabaseAuthSubjectResolverResultIsSafe(
  result: SimilarityRealSupabaseAuthSubjectResolverResult,
): void {
  const values: string[] = [];
  collectPrimitiveValues(result, values);
  const haystack = values.join(' | ').toLowerCase();

  for (const forbidden of FORBIDDEN_RESULT_SUBSTRINGS) {
    if (haystack.includes(forbidden)) {
      throw new Error(
        `Similarity Real Supabase Auth Subject Resolver safety assertion failed: forbidden content matched "${forbidden}".`,
      );
    }
  }

  if (EMAIL_ADDRESS_SHAPE_PATTERN.test(haystack)) {
    throw new Error(
      'Similarity Real Supabase Auth Subject Resolver safety assertion failed: result contains an email-address-shaped value.',
    );
  }
}
