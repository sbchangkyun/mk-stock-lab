/**
 * Phase 4D test source (bundled + run by scripts/smoke_phase_4d_lab_production_completion.mjs via esbuild).
 *
 * Phase 4D is mostly a static markup/accessibility/CSS pass over the Lab detail pages and the return
 * matrix component, so most of its correctness is verified by the companion static contract checker
 * (check_phase_4d_lab_production_completion_contract.mjs). This smoke suite exercises the two pieces
 * of real, executable/data logic the phase touches: the extracted pure export-status-message helper
 * in src/lib/exportCardImage.ts (the same helper setupCardImageExport calls -- not a duplicate
 * reimplementation), and the shape/integrity of the labReturnMatrices.json fixture the matrix
 * component renders from.
 */

import { exportStatusMessage } from '../src/lib/exportCardImage';
import matrices from '../src/data/labReturnMatrices.json';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

// =====================================================================================
// Group 1: exportStatusMessage -- deterministic accessible status copy per export phase
// =====================================================================================

check('start phase returns the in-progress status message', exportStatusMessage('start') === '이미지를 저장하는 중입니다.');
check('success phase returns the completion status message', exportStatusMessage('success') === '이미지 저장이 완료되었습니다.');
check('error phase returns the retry status message', exportStatusMessage('error') === '이미지 저장을 완료하지 못했습니다. 다시 시도해 주세요.');
check(
  'the three export-phase messages are all distinct',
  new Set([exportStatusMessage('start'), exportStatusMessage('success'), exportStatusMessage('error')]).size === 3,
);
check('no export-phase message is empty', (['start', 'success', 'error'] as const).every((p) => exportStatusMessage(p).length > 0));

// =====================================================================================
// Group 2: labReturnMatrices.json -- asset/sector matrix fixture integrity
// =====================================================================================

const { assetMatrix, sectorMatrix } = matrices as {
  assetMatrix: { years: string[]; categories: { id: string }[]; rankings: { cells: unknown[] }[]; summary: { categoryId: string }[]; note: string };
  sectorMatrix: { years: string[]; categories: { id: string }[]; rankings: { cells: unknown[] }[]; summary: { categoryId: string }[]; note: string };
};

for (const [label, matrix] of [['assetMatrix', assetMatrix], ['sectorMatrix', sectorMatrix]] as const) {
  check(`${label} has exactly 7 years`, matrix.years.length === 7);
  check(`${label} has exactly 12 categories`, matrix.categories.length === 12);
  check(`${label} has exactly 12 ranking rows`, matrix.rankings.length === 12);
  check(`${label} has exactly 12 summary rows`, matrix.summary.length === 12);
  check(`${label} note carries the non-advisory example-data disclaimer`, matrix.note.includes('예시 데이터') && matrix.note.includes('투자 판단'));
  check(
    `${label} summary rows reference only category ids present in the category list`,
    matrix.summary.every((row) => matrix.categories.some((cat) => cat.id === row.categoryId)),
  );
  check(
    `${label} ranking cells reference only category ids present in the category list`,
    matrix.rankings.every((row) => row.cells.every((cell: any) => matrix.categories.some((cat) => cat.id === cell.categoryId))),
  );
}

export const runAll = async (): Promise<number> => {
  console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  return failed === 0 ? 0 : 1;
};
