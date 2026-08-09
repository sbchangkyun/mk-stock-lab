/**
 * Phase 4F-HF2 (F-HIGH-03) resolver test source (bundled + run by
 * scripts/smoke_phase_4f_hf2_portfolio_identity.mjs via esbuild).
 *
 * Exercises the REAL, unmodified `resolveUniversalInstrumentExact` and
 * `resolveCanonicalPortfolioInstrument` functions in
 * src/lib/server/chart-ai/universal-instrument-search.mjs directly against the REAL Universal
 * Master JSON (no network, no credentials, no Supabase) -- the sole authoritative identity source
 * per §3/§9 of the governing spec. Covers §16: exact symbol/name/alias resolution, US identity,
 * ambiguous-input rejection, unknown-input rejection, and contradictory market/currency rejection.
 */

import {
  resolveUniversalInstrumentExact,
  resolveCanonicalPortfolioInstrument,
} from '../src/lib/server/chart-ai/universal-instrument-search.mjs';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

export const runAll = async (): Promise<number> => {
  // 1. Exact canonical symbol -> 005930 / 삼성전자.
  {
    const r = resolveUniversalInstrumentExact({ query: '005930' });
    check('005930 -> resolves', r !== null);
    check('005930 -> displayName 삼성전자', r?.displayName === '삼성전자');
    check('005930 -> country KR', r?.country === 'KR');
    check('005930 -> currency KRW', r?.currency === 'KRW');
  }

  // 2. Exact normalized displayName -> unique 005930 (the exact Owner-reported bug scenario:
  //    typing the Korean company name must resolve to a real canonical symbol).
  {
    const r = resolveUniversalInstrumentExact({ query: '삼성전자' });
    check('삼성전자 (exact name) -> resolves uniquely', r !== null);
    check('삼성전자 (exact name) -> symbol 005930', r?.symbol === '005930');
  }

  // 3. NAVER: canonical symbol query, exact displayName query, and exact alias (네이버) query all
  //    resolve to the same instrument.
  {
    const bySymbol = resolveUniversalInstrumentExact({ query: '035420' });
    const byName = resolveUniversalInstrumentExact({ query: 'NAVER' });
    const byAlias = resolveUniversalInstrumentExact({ query: '네이버' });
    check('035420 -> resolves to NAVER', bySymbol?.displayName === 'NAVER');
    check('NAVER (exact name) -> symbol 035420', byName?.symbol === '035420');
    check('네이버 (exact alias) -> symbol 035420', byAlias?.symbol === '035420');
  }

  // 4. US identity: AAPL resolves with US/USD identity fields.
  {
    const r = resolveUniversalInstrumentExact({ query: 'AAPL' });
    check('AAPL -> resolves', r !== null);
    check('AAPL -> country US', r?.country === 'US');
    check('AAPL -> currency USD', r?.currency === 'USD');
  }

  // 5. Ambiguous input ("삼성" is a real alias of 005930 but also a generic prefix shared by
  //    삼성물산/삼성SDI/삼성생명/삼성카드/삼성화재/삼성전기) must NOT resolve -- this is the exact
  //    §7 ambiguity rule (never auto-select a fuzzy/prefix/group-shared match).
  {
    const r = resolveUniversalInstrumentExact({ query: '삼성' });
    check('삼성 (ambiguous group prefix) -> null, not authoritative', r === null);
  }

  // 6. Unknown input -> null (no fabricated identity).
  {
    const r = resolveUniversalInstrumentExact({ query: '존재하지않는종목코드999' });
    check('unknown query -> null', r === null);
  }

  // 7. resolveCanonicalPortfolioInstrument: symbol only (no market hint) -> resolves via the
  //    unscoped exact path (this is what lets the server accept a raw exact submission without any
  //    client-side selection, per §7's exact-entry convenience).
  {
    const r = resolveCanonicalPortfolioInstrument({ symbol: '005930' });
    check('resolveCanonicalPortfolioInstrument(005930) -> ok', r.ok === true);
    if (r.ok) check('resolveCanonicalPortfolioInstrument(005930) -> country KR', r.instrument.country === 'KR');
  }

  // 8. resolveCanonicalPortfolioInstrument: matching market hint -> resolves.
  {
    const r = resolveCanonicalPortfolioInstrument({ symbol: '005930', market: 'KR' });
    check('resolveCanonicalPortfolioInstrument(005930, KR) -> ok', r.ok === true);
  }

  // 9. resolveCanonicalPortfolioInstrument: contradictory market hint (symbol=005930, market=US)
  //    must be REJECTED, never silently corrected -- this is the §8 server-authoritative rule.
  {
    const r = resolveCanonicalPortfolioInstrument({ symbol: '005930', market: 'US' });
    check('resolveCanonicalPortfolioInstrument(005930, US) -> rejected', r.ok === false);
    check(
      'resolveCanonicalPortfolioInstrument(005930, US) -> INSTRUMENT_MARKET_MISMATCH',
      !r.ok && r.code === 'INSTRUMENT_MARKET_MISMATCH',
    );
  }

  // 10. resolveCanonicalPortfolioInstrument: missing symbol -> rejected with a distinct code.
  {
    const r = resolveCanonicalPortfolioInstrument({ symbol: '' });
    check('resolveCanonicalPortfolioInstrument(empty) -> rejected', r.ok === false);
    check(
      'resolveCanonicalPortfolioInstrument(empty) -> INSTRUMENT_SYMBOL_REQUIRED',
      !r.ok && r.code === 'INSTRUMENT_SYMBOL_REQUIRED',
    );
  }

  // 11. resolveCanonicalPortfolioInstrument: ambiguous symbol -> rejected as unresolved (never
  //     falls through to a ranked/best-guess result).
  {
    const r = resolveCanonicalPortfolioInstrument({ symbol: '삼성' });
    check('resolveCanonicalPortfolioInstrument(삼성) -> rejected', r.ok === false);
    check(
      'resolveCanonicalPortfolioInstrument(삼성) -> INSTRUMENT_NOT_RESOLVED',
      !r.ok && r.code === 'INSTRUMENT_NOT_RESOLVED',
    );
  }

  console.log(`\nphase_4f_hf2_resolver_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
