/**
 * Phase 4F-HF2-A1 behavioral test source (bundled + run by
 * scripts/smoke_phase_4f_hf2_portfolio_identity.mjs via esbuild).
 *
 * Exercises the REAL, unmodified `resolvePositionSubmitIdentity` pure function
 * (src/lib/portfolio/portfolioPositionIdentity.ts) -- the actual client-side decision that
 * portfolio.astro's submit handler now uses -- and, where the spec requires proving the
 * end-to-end path, chains its output straight into the REAL `resolveCanonicalOrFail`
 * (src/lib/server/portfolio.ts) against the REAL Universal Master JSON. No network, no
 * credentials, no Supabase, no DOM/browser.
 *
 * Covers all 10 cases required by the A1 spec §4.
 */

import { resolvePositionSubmitIdentity } from '../src/lib/portfolio/portfolioPositionIdentity';
import { resolveCanonicalOrFail } from '../src/lib/server/portfolio';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

export const runAll = async (): Promise<number> => {
  // 1. Raw AAPL: no selection, no hidden symbol (hiddenMarket stubbornly still 'KR' from the
  //    markup/reset default) -> client must omit the market hint entirely, then the server exact
  //    resolver must independently resolve it to US/AAPL/USD.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: '',
      hiddenMarket: 'KR',
      securityInput: 'AAPL',
    });
    check('1. raw AAPL -> symbol AAPL', identity.symbol === 'AAPL');
    check('1. raw AAPL -> market omitted', identity.market === undefined);

    const r = resolveCanonicalOrFail(identity.symbol, identity.market);
    check('1. raw AAPL -> server resolves ok', r.ok === true);
    if (r.ok) {
      check('1. raw AAPL -> server country US', r.data.country === 'US');
      check('1. raw AAPL -> server symbol AAPL', r.data.symbol === 'AAPL');
      check('1. raw AAPL -> server currency USD', r.data.currency === 'USD');
    }
  }

  // 2. Raw 005930: same shape as case 1 -> market omitted, server resolves to KR/삼성전자/KRW.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: '',
      hiddenMarket: 'KR',
      securityInput: '005930',
    });
    check('2. raw 005930 -> symbol 005930', identity.symbol === '005930');
    check('2. raw 005930 -> market omitted', identity.market === undefined);

    const r = resolveCanonicalOrFail(identity.symbol, identity.market);
    check('2. raw 005930 -> server resolves ok', r.ok === true);
    if (r.ok) {
      check('2. raw 005930 -> server country KR', r.data.country === 'KR');
      check('2. raw 005930 -> server displayName 삼성전자', r.data.displayName === '삼성전자');
      check('2. raw 005930 -> server currency KRW', r.data.currency === 'KRW');
    }
  }

  // 3. Raw 삼성전자 (exact Korean company name, no prior click) -> market omitted, server
  //    exact-resolves it to 005930.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: '',
      hiddenMarket: '',
      securityInput: '삼성전자',
    });
    check('3. raw 삼성전자 -> symbol 삼성전자', identity.symbol === '삼성전자');
    check('3. raw 삼성전자 -> market omitted', identity.market === undefined);

    const r = resolveCanonicalOrFail(identity.symbol, identity.market);
    check('3. raw 삼성전자 -> server resolves ok', r.ok === true);
    if (r.ok) check('3. raw 삼성전자 -> server symbol 005930', r.data.symbol === '005930');
  }

  // 4. Canonical combobox selection, US (AAPL/US) -> selection is authoritative regardless of any
  //    stale hidden field.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: { symbol: 'AAPL', country: 'US' },
      hiddenSymbol: '',
      hiddenMarket: 'KR',
      securityInput: 'Apple Inc.',
    });
    check('4. selected AAPL/US -> symbol AAPL', identity.symbol === 'AAPL');
    check('4. selected AAPL/US -> market US', identity.market === 'US');
  }

  // 5. Canonical combobox selection, KR (005930/KR) -> selection is authoritative.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: { symbol: '005930', country: 'KR' },
      hiddenSymbol: '',
      hiddenMarket: '',
      securityInput: '삼성전자',
    });
    check('5. selected 005930/KR -> symbol 005930', identity.symbol === '005930');
    check('5. selected 005930/KR -> market KR', identity.market === 'KR');
  }

  // 6. Unmodified existing canonical KR row reopened for edit (no new selection made, visible text
  //    untouched) -> resubmit hidden 005930/KR, trusting hiddenMarket because hiddenSymbol is set.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: '005930',
      hiddenMarket: 'KR',
      securityInput: '삼성전자',
    });
    check('6. unmodified KR row -> symbol 005930', identity.symbol === '005930');
    check('6. unmodified KR row -> market KR', identity.market === 'KR');
  }

  // 7. Unmodified existing US row reopened for edit -> resubmit hidden AAPL/US.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: 'AAPL',
      hiddenMarket: 'US',
      securityInput: 'Apple Inc.',
    });
    check('7. unmodified US row -> symbol AAPL', identity.symbol === 'AAPL');
    check('7. unmodified US row -> market US', identity.market === 'US');
  }

  // 8. Legacy edit row (hiddenSymbol=삼성전자, hiddenMarket=KR), visible text left unchanged ->
  //    resubmit 삼성전자/KR, then the server exact-resolves it to 005930 (the §12 legacy-edit path).
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: '삼성전자',
      hiddenMarket: 'KR',
      securityInput: '삼성전자',
    });
    check('8. legacy edit unchanged -> symbol 삼성전자', identity.symbol === '삼성전자');
    check('8. legacy edit unchanged -> market KR', identity.market === 'KR');

    const r = resolveCanonicalOrFail(identity.symbol, identity.market);
    check('8. legacy edit unchanged -> server resolves ok', r.ok === true);
    if (r.ok) check('8. legacy edit unchanged -> server symbol 005930', r.data.symbol === '005930');
  }

  // 9. Legacy/edit row where the user modifies the visible text after opening -> portfolio.astro's
  //    invalidation logic clears the hidden symbol (and, per the A1 clearSelectedInstrument fix,
  //    the hidden market too) before this decision runs -> falls through to the raw-input path with
  //    no market hint, never resubmitting the stale hidden market alongside new text.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: '',
      hiddenMarket: '',
      securityInput: 'AAPL',
    });
    check('9. modified legacy row -> symbol AAPL', identity.symbol === 'AAPL');
    check('9. modified legacy row -> market omitted', identity.market === undefined);
  }

  // 9b. Same invalidation case, but proving the "hiddenMarket only trusted with hiddenSymbol"
  //     safety contract directly: even if a stale hiddenMarket somehow survived while hiddenSymbol
  //     was cleared, it must never leak into the decision.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: '',
      hiddenMarket: 'KR',
      securityInput: '005930',
    });
    check('9b. stale hiddenMarket with empty hiddenSymbol -> market omitted', identity.market === undefined);
  }

  // 10. Ambiguous "삼성" -> market omitted (raw path); the server resolver must reject it as
  //     unresolved/ambiguous rather than auto-picking a candidate.
  {
    const identity = resolvePositionSubmitIdentity({
      selected: null,
      hiddenSymbol: '',
      hiddenMarket: '',
      securityInput: '삼성',
    });
    check('10. ambiguous 삼성 -> market omitted', identity.market === undefined);

    const r = resolveCanonicalOrFail(identity.symbol, identity.market);
    check('10. ambiguous 삼성 -> server rejects', r.ok === false);
    if (!r.ok) {
      check(
        '10. ambiguous 삼성 -> exact Korean message',
        r.message === '검색 결과에서 종목을 선택해 주세요.',
      );
    }
  }

  console.log(`\nphase_4f_hf2_a1_submit_identity_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
