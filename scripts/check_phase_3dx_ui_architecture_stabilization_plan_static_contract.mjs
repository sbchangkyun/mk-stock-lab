/**
 * Static contract for the Phase 3DX UI architecture stabilization plan.
 * No network, browser, Vercel, credentials, Supabase, or external API calls.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3DX static checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  plan: 'docs/planning/phase_3dx_ui_architecture_stabilization_plan_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  checker: 'scripts/check_phase_3dx_ui_architecture_stabilization_plan_static_contract.mjs',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const plan = read(paths.plan);
const changelog = read(paths.changelog);
const packageJson = read(paths.package);
let passed = 0;
let failed = 0;
const failures = [];

const check = (label, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`  [PASS] ${label}\n`);
  } else {
    failed += 1;
    failures.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
};

process.stdout.write('=== Phase 3DX UI Architecture Stabilization Plan Static Contract ===\n\n');

process.stdout.write('Files and package command:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Architecture-plan package command exists',
  packageJson.includes('"check:phase-3dx-ui-architecture-plan"') &&
  packageJson.includes('check_phase_3dx_ui_architecture_stabilization_plan_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Baseline and plan status:\n');
check('Plan status says completed with no runtime changes',
  /plan completed; no runtime changes/i.test(plan));
check('Plan references Phase 3DV-CLOSEOUT', plan.includes('Phase 3DV-CLOSEOUT'));
check('Plan references Phase 3DW-CLOSEOUT', plan.includes('Phase 3DW-CLOSEOUT'));
check('Plan references the canonical production URL',
  plan.includes('https://mkstocklab.vercel.app'));
check('Plan records no deployment', plan.includes('No deployment was performed'));
check('Plan records no remote push', plan.includes('No remote push was performed'));
process.stdout.write('\n');

process.stdout.write('Required architecture sections:\n');
for (const heading of [
  '## 3. Architecture Principles',
  '## 4. Global Layout Contract',
  '## 5. Route Shell Contract',
  '## 6. Header, Ticker, and Nav Contract',
  '## 7. Advertisement and Iframe Contract',
  '## 8. Dense Data Surface Contract',
  '## 9. Modal and Overlay Contract',
  '## 10. Home Banner and PC Rail Contract',
  '## 11. Production Acceptance Policy',
  '## 12. Future Phase Checklist',
  '## 13. Explicit Prohibited Patterns',
  '## 14. Recommended Next Phases',
]) {
  check(`Plan contains ${heading.replace(/^## \d+\. /, '')}`, plan.includes(heading));
}
process.stdout.write('\n');

process.stdout.write('Global and route-shell contracts:\n');
for (const marker of [
  'width=device-width', 'initial-scale=1', 'viewport-fit=cover',
  'min-width: 0', 'max-width: 100%', 'box-sizing: border-box',
  '--page-gutter-x', 'body.dark-mode',
]) {
  check(`Global contract includes ${marker}`, plan.includes(marker));
}
for (const route of ['Home', 'Chart AI', 'Market', 'Lab', 'Portfolio', 'MyPage']) {
  check(`Route contract includes ${route}`, plan.includes(`### 5.${['Home','Chart AI','Market','Lab','Portfolio','MyPage'].indexOf(route)+1} ${route}`));
}
for (const selector of [
  '.home-shell', '.chart-ai-shell', '.market-dashboard', '.lab-landing-shell',
  '.lab-detail-shell', '.portfolio-mvp', '.portfolio-dashboard', '.mp-page-layout',
]) {
  check(`Plan records route selector ${selector}`, plan.includes(selector));
}
process.stdout.write('\n');

process.stdout.write('Header, data, modal, and advertisement contracts:\n');
for (const selector of [
  '.site-header', '.ticker-belt', '.primary-nav', '.nav-inner',
  '.positions-list-wrap', '.portfolio-bookmark-tabs', '.lab-matrix-scroll',
  '.lab-return-matrix', '.table-wrap', '.modal-panel', '.market-card-modal-panel',
]) {
  check(`Plan records component boundary ${selector}`, plan.includes(selector));
}
check('Plan records the fixed 728x70 footer-ad lesson',
  plan.includes('fixed 728x70 footer partner ad') &&
  plan.includes('.footer-ad-wrapper') &&
  plan.includes('right-side mobile blank area'));
check('Plan requires wrapper-level ad containment',
  plan.includes('contained at the wrapper level') &&
  plan.includes('must not rely on body overflow hiding alone'));
check('Plan separates footer, slide, mobile-banner, and PC-rail contracts',
  ['Footer/bottom ad', 'Top slide ad', 'Home mobile banner', 'PC Home rail']
    .every((marker) => plan.includes(marker)));
check('Plan records isolated export capture behavior',
  plan.includes('data-exportable-card') && plan.includes('.is-exporting-image'));
check('Plan keeps login modal in geometry coverage',
  plan.includes('public login modal remains part of Phase 3DW geometry coverage'));
process.stdout.write('\n');

process.stdout.write('Banner, guard, and acceptance contracts:\n');
for (const breakpoint of ['859px', '860px', '1440px']) {
  check(`Plan records breakpoint ${breakpoint}`, plan.includes(breakpoint));
}
check('Plan records 5000ms carousel behavior', plan.includes('5000ms rotation behavior'));
check('Plan records zero, one, and multiple banner behavior',
  ['Zero active banners', 'One active banner', 'Multiple active banners']
    .every((marker) => plan.includes(marker)));
check('Plan records URL-only registration and no upload UI',
  plan.includes('URL-only') && plan.includes('no file upload UI'));
check('Plan records the innerWidth plus two threshold', plan.includes('innerWidth + 2'));
check('Plan records all guarded public routes',
  ['`/`', '`/chart-ai`', '`/market`', '`/lab`', '`/portfolio`', '`/mypage`']
    .every((route) => plan.includes(route)));
check('Plan records all three guard viewports',
  ['390x844', '412x915', '430x932'].every((viewport) => plan.includes(viewport)));
check('Plan records the explicit production guard',
  plan.includes('PHASE_3DW_ALLOW_PRODUCTION_GEOMETRY=YES'));
for (const command of [
  'npm run check:phase-3dx-ui-architecture-plan',
  'npm run check:mobile-baseline',
  'npm run check:production-domain',
  'npm run guard:production-mobile-geometry',
]) {
  check(`Acceptance policy includes ${command}`, plan.includes(command));
}
process.stdout.write('\n');

process.stdout.write('Future checklist and prohibited patterns:\n');
for (const marker of [
  'Identify every affected route shell',
  'Identify dense tables, matrices, charts',
  'Identify any ad, iframe',
  'Preserve the viewport meta contract and mobile user zoom',
  'Preserve or add explicit local scroll wrappers',
  'Run the Phase 3DW guard dry-run',
  'Run the guarded production geometry check after deployment',
  'Record the owner-review route, state, viewport, and interaction scope',
]) {
  check(`Future checklist includes ${marker}`, plan.includes(marker));
}
check('Plan prohibits user-scalable=no',
  /user-scalable=no[^\n]*prohibited|prohibited[^\n]*user-scalable=no/i.test(plan));
check('Plan prohibits maximum-scale=1',
  /maximum-scale=1[^\n]*prohibited|prohibited[^\n]*maximum-scale=1/i.test(plan));
check('Plan prohibits a global fixed min-width',
  /global fixed `min-width`[^\n]*prohibited|prohibited[^\n]*global fixed `min-width`/i.test(plan));
check('Plan prohibits an uncontained fixed-size ad or iframe',
  /fixed-size ad, iframe[^\n]*outside a constrained wrapper/i.test(plan));
check('Plan prohibits body overflow as the only fix',
  /Body-level overflow hiding used as the only fix/i.test(plan));
check('Plan prohibits unsafe production guard collection',
  plan.includes('Production guards that collect screenshots, page text, cookies'));
check('Plan prohibits a heavy browser dependency without approval',
  plan.includes('heavy browser dependency added without owner approval'));
process.stdout.write('\n');

process.stdout.write('Changelog and runtime-source boundary:\n');
const phaseSection = changelog.split('## Phase 3DX - 2026-06-28')[1]?.split('\n## ')[0] ?? '';
check('Planning changelog contains Phase 3DX', phaseSection.length > 0);
check('Changelog marks the architecture plan ready',
  /architecture plan ready/i.test(phaseSection));
check('Changelog records no deployment and no push',
  /\*\*Deployment\*\*:\s*none/i.test(phaseSection) &&
  /\*\*Push\*\*:\s*none/i.test(phaseSection));

let runtimeChanges = [];
try {
  runtimeChanges = execFileSync('git', ['diff', '--name-only', '52fcfb7', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
} catch {
  runtimeChanges = ['<git-diff-unavailable>'];
}
check('No runtime source files changed since 52fcfb7', runtimeChanges.length === 0);
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
