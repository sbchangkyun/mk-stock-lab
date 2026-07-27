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
  isMissingRetentionTableError,
  validateChartResumeState,
  validateMarketSymbol,
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

// 3. validateChartResumeState (Phase 3GI-HF1): chart resume state is only ever meaningful as a
//    complete unit -- fully cleared (all four null) or fully identified (market + symbol present).
//    There is no free-form URL field anywhere in this validation surface -- every accepted field is
//    either an enum, a bounded string, or a KR/US-pattern symbol -- so an arbitrary URL can never
//    reach persistence, by construction rather than a reject-list.
{
  const none = validateChartResumeState({});
  check('validateChartResumeState no chart fields present -> null (nothing to update)', none === null);

  const marketWithoutSymbol = validateChartResumeState({
    lastChartMarket: 'KR',
    lastChartSymbol: null,
    lastChartName: null,
    lastChartTimeframe: null,
  });
  check(
    'validateChartResumeState market without symbol -> rejected 400',
    marketWithoutSymbol !== null && !marketWithoutSymbol.ok && marketWithoutSymbol.status === 400,
  );

  const symbolWithoutMarket = validateChartResumeState({
    lastChartMarket: null,
    lastChartSymbol: '005930',
    lastChartName: null,
    lastChartTimeframe: null,
  });
  check(
    'validateChartResumeState symbol without market -> rejected 400',
    symbolWithoutMarket !== null && !symbolWithoutMarket.ok,
  );

  const nameWithoutIdentity = validateChartResumeState({
    lastChartMarket: null,
    lastChartSymbol: null,
    lastChartName: '삼성전자',
    lastChartTimeframe: null,
  });
  check(
    'validateChartResumeState name set without market+symbol -> rejected 400',
    nameWithoutIdentity !== null && !nameWithoutIdentity.ok,
  );

  const timeframeWithoutIdentity = validateChartResumeState({
    lastChartMarket: null,
    lastChartSymbol: null,
    lastChartName: null,
    lastChartTimeframe: '1y',
  });
  check(
    'validateChartResumeState timeframe set without market+symbol -> rejected 400',
    timeframeWithoutIdentity !== null && !timeframeWithoutIdentity.ok,
  );

  const fullyCleared = validateChartResumeState({
    lastChartMarket: null,
    lastChartSymbol: null,
    lastChartName: null,
    lastChartTimeframe: null,
  });
  check(
    'validateChartResumeState all four null -> accepted (fully cleared)',
    fullyCleared !== null && fullyCleared.ok === true,
  );

  const validKr = validateChartResumeState({
    lastChartMarket: 'KR',
    lastChartSymbol: '005930',
    lastChartName: '삼성전자',
    lastChartTimeframe: '1y',
  });
  check(
    'validateChartResumeState valid KR market+symbol+name+timeframe -> accepted',
    validKr !== null &&
      validKr.ok === true &&
      validKr.data.last_chart_market === 'KR' &&
      validKr.data.last_chart_symbol === '005930' &&
      validKr.data.last_chart_timeframe === '1y',
  );

  const validUs = validateChartResumeState({
    lastChartMarket: 'US',
    lastChartSymbol: 'aapl',
    lastChartName: null,
    lastChartTimeframe: null,
  });
  check(
    'validateChartResumeState valid US market+symbol, optional fields null -> accepted, symbol normalized',
    validUs !== null && validUs.ok === true && validUs.data.last_chart_symbol === 'AAPL',
  );

  const unsupportedTimeframe = validateChartResumeState({
    lastChartMarket: 'KR',
    lastChartSymbol: '005930',
    lastChartName: null,
    lastChartTimeframe: '5y',
  });
  check(
    'validateChartResumeState unsupported timeframe -> rejected 400',
    unsupportedTimeframe !== null && !unsupportedTimeframe.ok,
  );

  const malformedKr = validateChartResumeState({
    lastChartMarket: 'KR',
    lastChartSymbol: 'AAPL',
    lastChartName: null,
    lastChartTimeframe: null,
  });
  check(
    'validateChartResumeState malformed KR symbol (US-shaped) -> rejected 400',
    malformedKr !== null && !malformedKr.ok,
  );

  const malformedUs = validateChartResumeState({
    lastChartMarket: 'US',
    lastChartSymbol: '005930',
    lastChartName: null,
    lastChartTimeframe: null,
  });
  check(
    'validateChartResumeState malformed US symbol (KR-shaped) -> rejected 400',
    malformedUs !== null && !malformedUs.ok,
  );

  const partialFieldSet = validateChartResumeState({ lastChartMarket: 'KR' });
  check(
    'validateChartResumeState only one of the four chart fields present -> rejected 400 (must send all four together)',
    partialFieldSet !== null && !partialFieldSet.ok,
  );
}

// 3b. validateMarketSymbol (Phase 3GI-HF1): reused by both chart resume state and the watchlist --
//     the same KR/US symbol contract, never a third convention.
{
  const validKr = validateMarketSymbol('KR', '  005930  ');
  check('validateMarketSymbol valid KR symbol -> normalized, accepted', validKr.ok === true && validKr.data === '005930');

  const validUs = validateMarketSymbol('US', 'aapl');
  check('validateMarketSymbol valid US symbol -> uppercased, accepted', validUs.ok === true && validUs.data === 'AAPL');

  const malformedKr = validateMarketSymbol('KR', 'AAPL');
  check('validateMarketSymbol malformed KR symbol -> rejected 400', !malformedKr.ok && malformedKr.status === 400);

  const malformedUs = validateMarketSymbol('US', '005930');
  check('validateMarketSymbol malformed US symbol -> rejected 400', !malformedUs.ok);

  const emptySymbol = validateMarketSymbol('KR', '');
  check('validateMarketSymbol empty symbol -> rejected 400', !emptySymbol.ok);
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
