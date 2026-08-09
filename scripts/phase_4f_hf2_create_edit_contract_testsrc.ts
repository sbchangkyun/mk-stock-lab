/**
 * Phase 4F-HF2 (F-HIGH-03) create/edit contract test source (bundled + run by
 * scripts/smoke_phase_4f_hf2_portfolio_identity.mjs via esbuild).
 *
 * Exercises the REAL, unmodified `resolveCanonicalOrFail` function in
 * src/lib/server/portfolio.ts directly against the REAL Universal Master JSON (no network, no
 * credentials, no Supabase). `createPosition`/`updatePosition` both call this function first and
 * pass its resolved canonical fields straight through to the DB write unchanged (confirmed by
 * reading src/lib/server/portfolio.ts) -- so this pure function IS the deterministic, credential-
 * free proxy for what gets persisted on create/edit, per §16-18. `createPosition`/`updatePosition`
 * themselves require a live Supabase admin client and cannot be exercised in this harness.
 */

import { resolveCanonicalOrFail } from '../src/lib/server/portfolio';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

export const runAll = async (): Promise<number> => {
  // 1. New selection from the combobox: exact symbol + matching market -> persists canonical
  //    005930/삼성전자/KR/KRW/stock.
  {
    const r = resolveCanonicalOrFail('005930', 'KR');
    check('create 005930/KR -> ok', r.ok === true);
    if (r.ok) {
      check('create 005930/KR -> symbol 005930', r.data.symbol === '005930');
      check('create 005930/KR -> displayName 삼성전자', r.data.displayName === '삼성전자');
      check('create 005930/KR -> country KR', r.data.country === 'KR');
      check('create 005930/KR -> currency KRW', r.data.currency === 'KRW');
      check('create 005930/KR -> assetType stock', r.data.assetType === 'stock');
    }
  }

  // 2. §12 explicit edit proving path: editing a legacy "삼성전자/티커 미확인" row to the exact
  //    canonical symbol, with no market hint supplied, must still resolve -- this is the exact
  //    server-side decision that PATCH relies on. As of Phase 4F-HF2-A1, this genuinely matches a
  //    real raw text-field submission: resolvePositionSubmitIdentity (src/lib/portfolio/
  //    portfolioPositionIdentity.ts) never fabricates a market hint for raw/modified visible text,
  //    so the client itself now sends market=undefined for exactly this case.
  {
    const r = resolveCanonicalOrFail('005930', undefined);
    check('edit 005930 (no market hint) -> ok', r.ok === true);
    if (r.ok) check('edit 005930 (no market hint) -> symbol 005930', r.data.symbol === '005930');
  }

  // 2b. Phase 4F-HF2-A1 §5: the same raw-entry, no-market-hint path for a US symbol must resolve
  //     to the canonical US identity -- proves the fix isn't KR-only.
  {
    const r = resolveCanonicalOrFail('AAPL', undefined);
    check('raw AAPL (no market hint) -> ok', r.ok === true);
    if (r.ok) {
      check('raw AAPL (no market hint) -> symbol AAPL', r.data.symbol === 'AAPL');
      check('raw AAPL (no market hint) -> country US', r.data.country === 'US');
      check('raw AAPL (no market hint) -> currency USD', r.data.currency === 'USD');
    }
  }

  // 3. §7 exact-entry convenience: an exact Korean company name submitted without a prior click
  //    still resolves uniquely (mirrors resolving "삼성전자" typed directly into the field).
  {
    const r = resolveCanonicalOrFail('삼성전자', 'KR');
    check('create 삼성전자/KR (exact name) -> ok', r.ok === true);
    if (r.ok) check('create 삼성전자/KR (exact name) -> symbol 005930', r.data.symbol === '005930');
  }

  // 4. §8 server-authoritative rule: a contradictory market (005930 tagged as US) must be
  //    REJECTED with the exact required Korean message, never silently corrected.
  {
    const r = resolveCanonicalOrFail('005930', 'US');
    check('create 005930/US (contradiction) -> rejected', r.ok === false);
    if (!r.ok) {
      check(
        'create 005930/US (contradiction) -> exact Korean message',
        r.message === '선택한 시장과 종목 정보가 일치하지 않습니다.',
      );
    }
  }

  // 5. §7/§13 ambiguous input must block submission rather than silently picking a candidate.
  {
    const r = resolveCanonicalOrFail('삼성', 'KR');
    check('create 삼성/KR (ambiguous) -> rejected', r.ok === false);
    if (!r.ok) {
      check(
        'create 삼성/KR (ambiguous) -> exact Korean message',
        r.message === '검색 결과에서 종목을 선택해 주세요.',
      );
    }
  }

  // 6. Missing/empty symbol must block submission with the "required" message (no canonical
  //    selection/resolution exists yet).
  {
    const r = resolveCanonicalOrFail('', 'KR');
    check('create empty symbol -> rejected', r.ok === false);
    if (!r.ok) {
      check(
        'create empty symbol -> exact Korean message',
        r.message === '티커 또는 종목명을 입력해 주세요.',
      );
    }
  }

  // 7. Unknown/nonexistent symbol is rejected the same way as an ambiguous one (never fabricated).
  {
    const r = resolveCanonicalOrFail('999999NOPE', 'KR');
    check('create unknown symbol -> rejected', r.ok === false);
  }

  // 8. NAVER via alias/name with a matching market hint resolves correctly (scoping doesn't break
  //    a legitimate match).
  {
    const r = resolveCanonicalOrFail('NAVER', 'KR');
    check('create NAVER/KR -> ok', r.ok === true);
    if (r.ok) check('create NAVER/KR -> symbol 035420', r.data.symbol === '035420');
  }

  // 9. US identity resolution still works for this phase's identity layer (US live valuation is
  //    out of scope, but identity canonicalization itself is not KR-only).
  {
    const r = resolveCanonicalOrFail('AAPL', 'US');
    check('create AAPL/US -> ok', r.ok === true);
    if (r.ok) {
      check('create AAPL/US -> country US', r.data.country === 'US');
      check('create AAPL/US -> currency USD', r.data.currency === 'USD');
    }
  }

  console.log(`\nphase_4f_hf2_create_edit_contract_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
