/**
 * Phase 3GI test source (bundled + run by smoke_phase_3gi_user_retention_persistence.mjs via esbuild).
 *
 * Exercises the pure validation/sanitization contract in src/lib/server/userRetention.ts --
 * enum rejection, bounded-string rejection, ISO timestamp validation, and missing-table-error
 * detection. No network, no Supabase, no env reads. DB-touching functions (getPreferences,
 * updatePreferences, addWatchlistItem, etc.) call getSupabaseAdminClient() directly and are
 * covered instead by the static contract checker, matching the existing portfolio.ts precedent
 * (auth-gated CRUD server modules are checked statically, not unit-tested against a live client).
 */

import {
  optionalEnum,
  optionalBoundedString,
  optionalIsoTimestamp,
  isMissingRetentionTableError,
} from '../src/lib/server/userRetention';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// 1. optionalEnum: undefined/null pass through untouched, valid value normalized, invalid rejected.
{
  const undef = optionalEnum(undefined, ['KR', 'US'] as const, '시장');
  check('optionalEnum undefined -> ok with undefined data', undef.ok === true && undef.data === undefined);

  const nul = optionalEnum(null, ['KR', 'US'] as const, '시장');
  check('optionalEnum null -> ok with null data', nul.ok === true && nul.data === null);

  const valid = optionalEnum('KR', ['KR', 'US'] as const, '시장');
  check('optionalEnum valid value -> ok', valid.ok === true && valid.data === 'KR');

  const invalid = optionalEnum('JP', ['KR', 'US'] as const, '시장');
  check('optionalEnum invalid value -> rejected 400 INVALID_PAYLOAD', !invalid.ok && invalid.status === 400 && invalid.code === 'INVALID_PAYLOAD');

  const wrongType = optionalEnum(42, ['KR', 'US'] as const, '시장');
  check('optionalEnum non-string value -> rejected', !wrongType.ok);
}

// 2. optionalBoundedString: length limits, trimming, empty-string collapses to null.
{
  const undef = optionalBoundedString(undefined, 32, '종목 코드');
  check('optionalBoundedString undefined -> ok with undefined', undef.ok === true && undef.data === undefined);

  const nul = optionalBoundedString(null, 32, '종목 코드');
  check('optionalBoundedString null -> ok with null', nul.ok === true && nul.data === null);

  const trimmed = optionalBoundedString('  005930  ', 32, '종목 코드');
  check('optionalBoundedString trims whitespace', trimmed.ok === true && trimmed.data === '005930');

  const empty = optionalBoundedString('   ', 32, '종목 코드');
  check('optionalBoundedString blank string -> null (not an empty string row)', empty.ok === true && empty.data === null);

  const tooLong = optionalBoundedString('a'.repeat(33), 32, '종목 코드');
  check('optionalBoundedString over max length -> rejected 400', !tooLong.ok && tooLong.status === 400);

  const atLimit = optionalBoundedString('a'.repeat(32), 32, '종목 코드');
  check('optionalBoundedString exactly at max length -> ok', atLimit.ok === true);

  const wrongType = optionalBoundedString(123, 32, '종목 코드');
  check('optionalBoundedString non-string -> rejected', !wrongType.ok);
}

// 3. optionalIsoTimestamp: valid date strings normalize to ISO, invalid strings rejected.
//    There is no free-form URL field anywhere in this validation surface -- every accepted field is
//    either an enum, a bounded string, a UUID (checked via ensurePortfolioOwned), or a timestamp --
//    so an arbitrary URL can never reach persistence, by construction rather than a reject-list.
{
  const undef = optionalIsoTimestamp(undefined, '활동 시각');
  check('optionalIsoTimestamp undefined -> ok with undefined', undef.ok === true && undef.data === undefined);

  const nul = optionalIsoTimestamp(null, '활동 시각');
  check('optionalIsoTimestamp null -> ok with null', nul.ok === true && nul.data === null);

  const valid = optionalIsoTimestamp('2026-07-24T05:00:00.000Z', '활동 시각');
  check('optionalIsoTimestamp valid ISO string -> ok, normalized', valid.ok === true && valid.data === '2026-07-24T05:00:00.000Z');

  const invalid = optionalIsoTimestamp('not-a-date', '활동 시각');
  check('optionalIsoTimestamp invalid string -> rejected 400', !invalid.ok && invalid.status === 400);

  const url = optionalIsoTimestamp('https://evil.example.com/track', '활동 시각');
  check('optionalIsoTimestamp rejects an arbitrary URL passed where a timestamp is expected', !url.ok);

  const wrongType = optionalIsoTimestamp(1721800000000, '활동 시각');
  check('optionalIsoTimestamp non-string (e.g. epoch number) -> rejected', !wrongType.ok);
}

// 4. isMissingRetentionTableError: recognizes Postgres/PostgREST missing-table signatures, rejects
//    unrelated errors (so a genuine DB failure is never silently reclassified as "not ready yet").
{
  check(
    'isMissingRetentionTableError recognizes Postgres 42P01',
    isMissingRetentionTableError({ code: '42P01', message: 'relation "public.user_preferences" does not exist' }),
  );
  check(
    'isMissingRetentionTableError recognizes PostgREST PGRST205',
    isMissingRetentionTableError({ code: 'PGRST205', message: "Could not find the table 'public.user_preferences' in the schema cache" }),
  );
  check(
    'isMissingRetentionTableError recognizes a bare does-not-exist message',
    isMissingRetentionTableError({ message: 'relation does not exist' }),
  );
  check(
    'isMissingRetentionTableError rejects an unrelated error code',
    !isMissingRetentionTableError({ code: '23505', message: 'duplicate key value violates unique constraint' }),
  );
  check('isMissingRetentionTableError rejects null', !isMissingRetentionTableError(null));
  check('isMissingRetentionTableError rejects a plain string', !isMissingRetentionTableError('boom'));
}

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
