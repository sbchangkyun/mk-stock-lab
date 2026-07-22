/**
 * Static contract for Phase 3DV-HF1-Retry mobile overflow containment.
 * No network, browser, Vercel, credentials, Supabase, or external API calls.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3DV-HF1-Retry static checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  css: 'src/styles/style.css',
  layout: 'src/layouts/Layout.astro',
  footer: 'src/components/Footer.astro',
  slideAd: 'src/components/SlideAd.astro',
  result: 'docs/planning/phase_3dv_hf1_retry_mobile_overflow_hotfix_result_v0.1.md',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const css = read(paths.css);
const layout = read(paths.layout);
const footer = read(paths.footer);
const slideAd = read(paths.slideAd);
const result = read(paths.result);
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

process.stdout.write('=== Phase 3DV-HF1-Retry Mobile Overflow Static Contract ===\n\n');

process.stdout.write('Files and package script:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Retry package script exists',
  packageJson.includes('"check:phase-3dv-hf1-retry-mobile-overflow"') &&
  packageJson.includes('check_phase_3dv_hf1_retry_mobile_overflow_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Viewport and prior HF1 preservation:\n');
const viewport = layout.match(/<meta\s+name=["']viewport["'][^>]*>/i)?.[0] ?? '';
check('Viewport retains device width', viewport.includes('width=device-width'));
check('Viewport retains initial scale', /initial-scale\s*=\s*1(?:\.0)?/.test(viewport));
check('Viewport retains viewport-fit cover', viewport.includes('viewport-fit=cover'));
check('Viewport preserves user zoom', !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?/i.test(viewport));
check('Global html/body width ceiling remains',
  /html,\s*\nbody\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%/s.test(css));
check('Global body overflow guard remains', /(?:^|\n)body\s*\{[^}]*overflow-x:\s*hidden/s.test(css));
check('site-main remains shrink-safe', /\.site-main\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/s.test(css));
process.stdout.write('\n');

process.stdout.write('Confirmed footer-ad offender and targeted fix:\n');
check('Footer retains the diagnosed fixed 728px partner-ad request',
  footer.includes("width: '728'") && footer.includes("height: '70'"));
check('Footer renders the diagnosed wrapper', footer.includes('class="footer-ad-wrapper"'));
check('Targeted rule covers bottom document, banner, and wrapper',
  /\.bottom-document-area,\s*\.bottom-ad-banner,\s*\.footer-ad-wrapper\s*\{/s.test(css));
const footerContainment = css.match(/\.bottom-document-area,\s*\.bottom-ad-banner,\s*\.footer-ad-wrapper\s*\{([^}]*)\}/s)?.[1] ?? '';
check('Footer ad region uses width 100%', /width:\s*100%/.test(footerContainment));
check('Footer ad region can shrink', /min-width:\s*0/.test(footerContainment));
check('Footer ad region is capped to 100vw', /max-width:\s*100vw/.test(footerContainment));
check('Footer ad overflow is locally contained', /overflow-x:\s*hidden/.test(footerContainment));
const injectedAdRule = css.match(/\.footer-ad-wrapper\s*>\s*ins,\s*\.footer-ad-wrapper\s+iframe\s*\{([^}]*)\}/s)?.[1] ?? '';
check('Injected partner ad is capped to wrapper width', /max-width:\s*100%\s*!important/.test(injectedAdRule));
check('Top slide ad remains a separate 320px integration',
  slideAd.includes("width: '320'") && slideAd.includes("height: '140'"));
process.stdout.write('\n');

process.stdout.write('Shell, modal, local scroll, and banner preservation:\n');
check('Ticker remains locally scrollable', /\.ticker-belt\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Nav remains locally scrollable', /\.primary-nav\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Nav intrinsic row remains max-content inside its scroll parent',
  /\.nav-inner\s*\{[^}]*min-width:\s*max-content/s.test(css));
check('Login modal retains viewport-relative width',
  /\.modal-panel\s*\{[^}]*width:\s*min\(440px,\s*calc\(100vw\s*-\s*40px\)\)/s.test(css));
check('Portfolio holdings retain internal scroll', /\.positions-list-wrap\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Generic tables retain internal scroll', /\.table-wrap\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Lab matrices retain internal scroll', /\.lab-matrix-scroll\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Mobile Home banner remains enabled through 859px',
  /@media\s*\(max-width:\s*859px\)\s*\{[\s\S]*?\.home-mobile-ad\s*\{[\s\S]*?display:\s*block/.test(css));
check('Mobile Home banner remains hidden from 860px',
  /@media\s*\(min-width:\s*860px\)\s*\{[\s\S]*?\.home-mobile-ad\s*\{[\s\S]*?display:\s*none/.test(css));
check('Desktop Home rail remains enabled from 1440px',
  /@media\s*\(min-width:\s*1440px\)\s*\{[\s\S]*?\.home-rail-ad\s*\{[\s\S]*?display:\s*block/.test(css));
process.stdout.write('\n');

process.stdout.write('Documentation and source boundary:\n');
check('Changelog contains Phase 3DV-HF1-Retry', changelog.includes('## Phase 3DV-HF1-Retry - 2026-06-28'));
check('Result records the 728px footer-ad root cause',
  result.includes('fixed 728x70 partner ad') && result.includes('.footer-ad-wrapper'));
check('Result records all required public routes',
  ['`/`', '`/chart-ai`', '`/market`', '`/lab`', '`/portfolio`', '`/mypage`'].every((route) => result.includes(route)));
check('Result records three mobile viewport widths',
  ['390x844', '412x915', '430x932'].every((viewportSize) => result.includes(viewportSize)));
check('Result records successful candidate width equality',
  result.includes('exactly 390px, 412px, and 430px'));

let changedRuntimeFiles = [];
try {
  changedRuntimeFiles = execFileSync('git', ['diff', '--name-only', 'd95fd53', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().split(/\r?\n/).filter(Boolean);
} catch {
  changedRuntimeFiles = ['<git-diff-unavailable>'];
}
check('Only style.css changed under runtime source',
  changedRuntimeFiles.length === 1 && changedRuntimeFiles[0] === 'src/styles/style.css');
check('No API, backend, provider, auth, or database source changed',
  changedRuntimeFiles.every((file) =>
    !/src[\\/](?:pages[\\/]api|lib[\\/](?:supabase|siteSettings|chartAi|portfolio)|server|services)/.test(file)));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
