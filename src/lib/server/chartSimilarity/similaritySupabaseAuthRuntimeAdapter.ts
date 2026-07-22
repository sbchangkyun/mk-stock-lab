/**
 * Server-only mocked Supabase Auth runtime adapter for Chart Similarity (Phase 3FD-B-ALT).
 *
 * This module proves the shape of a future real Supabase Auth runtime adapter using only
 * deterministic mocked fixtures. It never creates a real Supabase client, never imports
 * `@supabase/*`, never reads `process.env`/`import.meta.env`/`.env`, never reads cookies or
 * request headers, never calls `fetch`, and never verifies a real session or JWT. All inputs are
 * explicit in-memory objects supplied by the caller (fixtures in this phase; a real caller would
 * still be responsible for producing a safe mocked or resolved shape upstream — this module itself
 * never reaches out to obtain one).
 *
 * `resolveMockedSimilaritySupabaseAuthRuntimeAdapter` never trusts `clientClaimedRole` — it is
 * always ignored, and its presence only ever produces a safe warning.
 */

import type {
  SimilaritySupabaseAuthRuntimeAdapterInput,
  SimilaritySupabaseAuthRuntimeAdapterPolicy,
  SimilaritySupabaseAuthRuntimeAdapterResult,
  SimilaritySupabaseAuthRuntimeAdapterSubject,
  SimilaritySupabaseAuthRuntimeAdapterSubjectSeed,
} from './similaritySupabaseAuthRuntimeAdapterTypes';

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

function anonymousSubject(safeWarnings: string[] = []): SimilaritySupabaseAuthRuntimeAdapterSubject {
  return {
    state: 'anonymous',
    subjectRef: null,
    providerKind: null,
    roleSeed: 'anonymous',
    safeWarnings,
  };
}

export function buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy(): SimilaritySupabaseAuthRuntimeAdapterPolicy {
  return {
    enabled: false,
    allowMockedSession: false,
    allowRealSupabaseClient: false,
    allowEnvRead: false,
    allowCookieRead: false,
    allowHeaderRead: false,
    allowJwtVerification: false,
    allowRouteSuccess: false,
    allowClientRoleTrust: false,
    notes: [
      'Disabled by default. No real Supabase call, client, or env read is performed by this adapter.',
      'Mocked session handling only; this scaffold never parses a real cookie, header, or JWT.',
      'Client-claimed roles are never trusted; only a server-resolved role seed may ever be authoritative.',
    ],
  };
}

export function buildMockedSimilaritySupabaseAuthRuntimeAdapterPolicy(): SimilaritySupabaseAuthRuntimeAdapterPolicy {
  return {
    ...buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy(),
    enabled: true,
    allowMockedSession: true,
  };
}

function toSafePolicySummary(policy: SimilaritySupabaseAuthRuntimeAdapterPolicy) {
  return {
    enabled: policy.enabled,
    allowMockedSession: policy.allowMockedSession,
    allowRealSupabaseClient: policy.allowRealSupabaseClient,
    allowEnvRead: policy.allowEnvRead,
    allowCookieRead: policy.allowCookieRead,
    allowHeaderRead: policy.allowHeaderRead,
    allowJwtVerification: policy.allowJwtVerification,
    allowRouteSuccess: policy.allowRouteSuccess,
    allowClientRoleTrust: policy.allowClientRoleTrust,
  };
}

/**
 * Normalizes an explicit in-memory input object only. Never reads a Request, cookies, headers,
 * env, a database, Supabase, or `fetch` — only the plain object the caller passed in.
 */
export function normalizeSimilaritySupabaseAuthRuntimeAdapterInput(
  input: unknown,
): SimilaritySupabaseAuthRuntimeAdapterInput | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const mockedSession = candidate.mockedSession;

  if (mockedSession !== undefined && mockedSession !== null) {
    if (typeof mockedSession !== 'object' || Array.isArray(mockedSession)) {
      return null;
    }
    const state = (mockedSession as Record<string, unknown>).state;
    const validStates = ['missing', 'valid', 'invalid', 'expired', 'malformed'];
    if (typeof state !== 'string' || !validStates.includes(state)) {
      return null;
    }
  }

  return {
    mockedSession: (mockedSession as SimilaritySupabaseAuthRuntimeAdapterInput['mockedSession']) ?? null,
    currentIso: typeof candidate.currentIso === 'string' ? candidate.currentIso : null,
    requestedRuntime:
      candidate.requestedRuntime === 'auth-subject-resolution' ? 'auth-subject-resolution' : null,
    clientClaimedRole: candidate.clientClaimedRole,
  };
}

/**
 * Resolves a mocked Supabase-like session into the adapter's safe result shape. Never reaches out
 * to Supabase, the network, cookies, headers, or env — the session is supplied entirely in-memory.
 */
export function resolveMockedSimilaritySupabaseAuthRuntimeAdapter(
  rawInput: unknown,
  policy: SimilaritySupabaseAuthRuntimeAdapterPolicy = buildDefaultSimilaritySupabaseAuthRuntimeAdapterPolicy(),
): SimilaritySupabaseAuthRuntimeAdapterResult {
  const safePolicy = toSafePolicySummary(policy);
  const input = normalizeSimilaritySupabaseAuthRuntimeAdapterInput(rawInput);

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
      safeMessage: 'Adapter input was malformed; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (!policy.enabled || !policy.allowMockedSession) {
    return {
      ok: false,
      status: 'disabled',
      source: 'disabled',
      subject: anonymousSubject(warnings),
      safeMessage: 'Mocked Supabase Auth runtime adapter is disabled by policy.',
      warnings,
      policy: safePolicy,
    };
  }

  const session = input.mockedSession ?? null;

  if (!session || session.state === 'missing') {
    return {
      ok: false,
      status: 'missing_session',
      source: 'mocked-supabase-auth',
      subject: anonymousSubject(warnings),
      safeMessage: 'No mocked session was present; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (session.state === 'invalid') {
    return {
      ok: false,
      status: 'invalid_session',
      source: 'mocked-supabase-auth',
      subject: anonymousSubject(warnings),
      safeMessage: 'Mocked session was invalid; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (session.state === 'expired') {
    return {
      ok: false,
      status: 'expired_session',
      source: 'mocked-supabase-auth',
      subject: anonymousSubject(warnings),
      safeMessage: 'Mocked session was expired; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  if (session.state === 'malformed') {
    return {
      ok: false,
      status: 'malformed_session',
      source: 'mocked-supabase-auth',
      subject: anonymousSubject(warnings),
      safeMessage: 'Mocked session was malformed; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  // session.state === 'valid'
  const user = session.user ?? null;
  if (!user || typeof user.idRef !== 'string' || user.idRef.length === 0) {
    return {
      ok: false,
      status: 'invalid_session',
      source: 'mocked-supabase-auth',
      subject: anonymousSubject(warnings),
      safeMessage: 'Mocked session claimed to be valid but carried no safe user reference; treated as anonymous.',
      warnings,
      policy: safePolicy,
    };
  }

  const providerKind = user.providerKind ?? 'unknown';
  const subjectRef = `mocked-supabase-auth-subject:${user.idRef}`;

  return {
    ok: true,
    status: 'mocked_resolved',
    source: 'mocked-supabase-auth',
    subject: {
      state: 'authenticated',
      subjectRef,
      providerKind,
      roleSeed: 'authenticated',
      safeWarnings: warnings,
    },
    safeMessage: 'Mocked Supabase session resolved to an authenticated subject seed.',
    warnings,
    policy: safePolicy,
  };
}

/**
 * Maps an adapter result to a safe seed shape compatible with the Phase 3FC-C auth subject
 * resolver's expectations. Never surfaces `beta`/`owner`/`admin`, and never a raw id/email/token.
 */
export function mapSupabaseAuthAdapterResultToAuthSubjectSeed(
  result: SimilaritySupabaseAuthRuntimeAdapterResult,
): SimilaritySupabaseAuthRuntimeAdapterSubjectSeed {
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
 * Asserts that an adapter result carries no forbidden value (token, raw session/user, a real
 * email-address-shaped value, cookie/header/env value, service role key, KIS/account/trading/
 * balance field, or live/auto source marker). Throws if any forbidden content is found. Checks
 * values only, never key names, so that safe field names like `emailRef` do not themselves trigger
 * a false positive, and the safe `providerKind: 'email'` category value is not itself flagged.
 */
export function assertSimilaritySupabaseAuthRuntimeAdapterResultIsSafe(
  result: SimilaritySupabaseAuthRuntimeAdapterResult,
): void {
  const values: string[] = [];
  collectPrimitiveValues(result, values);
  const haystack = values.join(' | ').toLowerCase();

  for (const forbidden of FORBIDDEN_RESULT_SUBSTRINGS) {
    if (haystack.includes(forbidden)) {
      throw new Error(
        `Similarity Supabase Auth Runtime Adapter safety assertion failed: forbidden content matched "${forbidden}".`,
      );
    }
  }

  if (EMAIL_ADDRESS_SHAPE_PATTERN.test(haystack)) {
    throw new Error(
      'Similarity Supabase Auth Runtime Adapter safety assertion failed: result contains an email-address-shaped value.',
    );
  }
}
