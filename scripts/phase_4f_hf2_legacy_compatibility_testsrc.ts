/**
 * Phase 4F-HF2 (F-HIGH-03) legacy-compatibility test source (bundled + run by
 * scripts/smoke_phase_4f_hf2_portfolio_identity.mjs via esbuild).
 *
 * Exercises the REAL, unmodified `resolveLegacyKrIdentity` function in
 * src/pages/api/portfolio/valuation.ts directly against the REAL Universal Master JSON (no
 * network, no credentials, no Supabase, no real KIS quote). Covers §10/§17: legacy noncanonical
 * KR rows resolve in memory only (never mutating the DB), already-canonical rows pass through
 * unchanged, ambiguous/unresolvable legacy rows stay unsupported rather than being fuzzy-repaired,
 * and non-KR (US) rows are never attempted this phase.
 */

import { resolveLegacyKrIdentity } from '../src/pages/api/portfolio/valuation';

type LoadedPosition = {
  id: string;
  portfolioId: string;
  symbol: string;
  market: 'KR' | 'US';
  assetType: 'stock' | 'etf';
  name: string | null;
  buyPrice: number;
  quantity: number;
  currency: 'KRW' | 'USD';
};

const basePosition = (overrides: Partial<LoadedPosition>): LoadedPosition => ({
  id: 'pos-1',
  portfolioId: 'pf-1',
  symbol: '005930',
  market: 'KR',
  assetType: 'stock',
  name: null,
  buyPrice: 70000,
  quantity: 1,
  currency: 'KRW',
  ...overrides,
});

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

export const runAll = async (): Promise<number> => {
  // 1. The exact Owner-reported bug scenario: a legacy row created by typing "삼성전자" (stored
  //    verbatim as both symbol and name) must resolve to canonical 005930 in memory.
  {
    const legacy = resolveLegacyKrIdentity(basePosition({ symbol: '삼성전자', name: '삼성전자' }));
    check('legacy 삼성전자/삼성전자 -> identityResolved true', legacy.identityResolved === true);
    check('legacy 삼성전자/삼성전자 -> symbol 005930', legacy.symbol === '005930');
    check('legacy 삼성전자/삼성전자 -> name 삼성전자', legacy.name === '삼성전자');
  }

  // 2. Legacy 네이버 resolves uniquely to 035420 via the same bySymbol-query path.
  {
    const legacy = resolveLegacyKrIdentity(basePosition({ symbol: '네이버', name: '네이버' }));
    check('legacy 네이버/네이버 -> identityResolved true', legacy.identityResolved === true);
    check('legacy 네이버/네이버 -> symbol 035420', legacy.symbol === '035420');
  }

  // 3. Legacy row where the stored `symbol` text itself doesn't resolve, but the stored `name`
  //    does (byName fallback branch, distinct from the bySymbol branch exercised above).
  {
    const legacy = resolveLegacyKrIdentity(basePosition({ symbol: '특이코드XYZ99', name: 'NAVER' }));
    check('legacy byName fallback -> identityResolved true', legacy.identityResolved === true);
    check('legacy byName fallback -> symbol 035420', legacy.symbol === '035420');
  }

  // 4. Already-canonical row (symbol matches KR_SYMBOL_PATTERN) must short-circuit unchanged --
  //    no resolution attempt, identityResolved stays false.
  {
    const legacy = resolveLegacyKrIdentity(basePosition({ symbol: '005930', name: '삼성전자' }));
    check('already-canonical 005930 -> identityResolved false', legacy.identityResolved === false);
    check('already-canonical 005930 -> symbol unchanged', legacy.symbol === '005930');
  }

  // 5. Ambiguous legacy symbol ("삼성" is a real alias of 005930 but also a shared name-prefix of
  //    other distinct KR stocks) must stay unsupported -- never fuzzy-repaired to a guessed symbol.
  {
    const legacy = resolveLegacyKrIdentity(basePosition({ symbol: '삼성', name: '삼성' }));
    check('ambiguous legacy 삼성 -> identityResolved false', legacy.identityResolved === false);
    check('ambiguous legacy 삼성 -> symbol left unchanged (not fabricated)', legacy.symbol === '삼성');
  }

  // 6. Fully unresolvable legacy row (garbage symbol, no name) stays unsupported and unchanged.
  {
    const legacy = resolveLegacyKrIdentity(basePosition({ symbol: '이상한이름아무개', name: null }));
    check('unresolvable legacy -> identityResolved false', legacy.identityResolved === false);
    check('unresolvable legacy -> symbol unchanged', legacy.symbol === '이상한이름아무개');
  }

  // 7. US-market positions are never attempted this phase, regardless of symbol content --
  //    passes through completely unchanged.
  {
    const legacy = resolveLegacyKrIdentity(
      basePosition({ symbol: 'AAPL', market: 'US', name: 'APPLE INC', currency: 'USD' }),
    );
    check('US position -> identityResolved false (unsupported this phase)', legacy.identityResolved === false);
    check('US position -> symbol unchanged', legacy.symbol === 'AAPL');
  }

  console.log(`\nphase_4f_hf2_legacy_compatibility_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
