/**
 * Phase 4B test source (bundled + run by scripts/smoke_phase_4b_market_production_completion.mjs via
 * esbuild).
 *
 * Phase 4B is mostly a truthfulness/accessibility/reliability pass over the existing live Market
 * dashboard (LiveMarketDashboard.astro), so most of its correctness is verified by the companion
 * static contract checker (check_phase_4b_market_production_completion_contract.mjs). This smoke
 * suite exercises the one piece of real, executable logic the phase introduces: the Korean
 * sector-display map src/lib/market-dashboard/formatters.ts (`SECTOR_LABELS`/`sectorLabel`), covering
 * the closed 11-entry registry, exact mapping of every known internal sector id, pass-through of any
 * unmapped sector string (so a future registry addition never silently disappears), and the null/
 * undefined/empty placeholder contract.
 */

import { SECTOR_LABELS, sectorLabel } from '../src/lib/market-dashboard/formatters';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// =====================================================================================
// Group 1: closed sector-label registry shape
// =====================================================================================

check('SECTOR_LABELS has exactly 11 entries', Object.keys(SECTOR_LABELS).length === 11);
check(
  'SECTOR_LABELS keys are exactly the registry sector ids used across all 4 tracked universes',
  [
    'Technology',
    'Materials',
    'Healthcare',
    'Industrials',
    'Financials',
    'Consumer',
    'Communication',
    'Semiconductors',
    'Mega Cap Tech',
    'Digital Consumer',
    'Software',
  ].every((id) => id in SECTOR_LABELS),
);
check(
  'every SECTOR_LABELS value is a non-empty Korean display string distinct from its English key',
  Object.entries(SECTOR_LABELS).every(([id, label]) => typeof label === 'string' && label.length > 0 && label !== id),
);
check(
  'no two sector ids collapse onto the same Korean display label (unambiguous strongest/weakest-sector display)',
  new Set(Object.values(SECTOR_LABELS)).size === Object.values(SECTOR_LABELS).length,
);

// =====================================================================================
// Group 2: sectorLabel -- exact mapping for every known sector id
// =====================================================================================

check('sectorLabel maps Technology to 기술', sectorLabel('Technology') === '기술');
check('sectorLabel maps Materials to 소재', sectorLabel('Materials') === '소재');
check('sectorLabel maps Healthcare to 헬스케어', sectorLabel('Healthcare') === '헬스케어');
check('sectorLabel maps Industrials to 산업재', sectorLabel('Industrials') === '산업재');
check('sectorLabel maps Financials to 금융', sectorLabel('Financials') === '금융');
check('sectorLabel maps Consumer to 소비재', sectorLabel('Consumer') === '소비재');
check('sectorLabel maps Communication to 커뮤니케이션', sectorLabel('Communication') === '커뮤니케이션');
check('sectorLabel maps Semiconductors to 반도체', sectorLabel('Semiconductors') === '반도체');
check('sectorLabel maps "Mega Cap Tech" to 대형 기술주', sectorLabel('Mega Cap Tech') === '대형 기술주');
check('sectorLabel maps "Digital Consumer" to 디지털 소비재', sectorLabel('Digital Consumer') === '디지털 소비재');
check('sectorLabel maps Software to 소프트웨어', sectorLabel('Software') === '소프트웨어');

// =====================================================================================
// Group 3: unmapped/absent input handling -- never throws, never fabricates a Korean label
// =====================================================================================

check('sectorLabel passes an unmapped sector id through unchanged (no silent disappearance)', sectorLabel('Utilities') === 'Utilities');
check('sectorLabel passes an unmapped sector id through unchanged (case-sensitive, no partial match)', sectorLabel('technology') === 'technology');
check('sectorLabel(null) returns the placeholder dash', sectorLabel(null) === '—');
check('sectorLabel(undefined) returns the placeholder dash', sectorLabel(undefined) === '—');
check('sectorLabel("") returns the placeholder dash', sectorLabel('') === '—');

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
