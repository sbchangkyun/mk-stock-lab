/**
 * Static contract for Phase 3DV-HF1 mobile viewport responsiveness.
 * No network, browser, credentials, Vercel, or Supabase access.
 */

globalThis.fetch = async () => {
  throw new Error('Network access is blocked in the Phase 3DV-HF1 static checker.');
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  layout: 'src/layouts/Layout.astro',
  css: 'src/styles/style.css',
  changelog: 'docs/planning/planning_changelog.md',
  result: 'docs/planning/phase_3dv_hf1_mobile_viewport_responsive_hotfix_result_v0.1.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const layout = read(paths.layout);
const css = read(paths.css);
const changelog = read(paths.changelog);
const result = read(paths.result);
const packageJson = read(paths.package);

const block = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's'))?.[1] ?? '';
};

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

process.stdout.write('=== Phase 3DV-HF1 Mobile Viewport Static Contract ===\n\n');

process.stdout.write('Files and package script:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Focused package script exists',
  packageJson.includes('"check:phase-3dv-hf1-mobile-viewport"') &&
  packageJson.includes('check_phase_3dv_hf1_mobile_viewport_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Viewport contract:\n');
const viewportTag = layout.match(/<meta\s+name=["']viewport["'][^>]*>/i)?.[0] ?? '';
const viewportContent = viewportTag.match(/content=["']([^"']+)["']/i)?.[1] ?? '';
check('Layout has one viewport meta tag', (layout.match(/name=["']viewport["']/gi) ?? []).length === 1);
check('Viewport includes width=device-width', viewportContent.includes('width=device-width'));
check('Viewport includes initial-scale=1', /initial-scale\s*=\s*1(?:\.0)?(?:\s*,|$)/.test(viewportContent));
check('Viewport includes viewport-fit=cover', viewportContent.includes('viewport-fit=cover'));
check('Viewport has no fixed desktop width', !/width\s*=\s*(?:980|1080|[5-9]\d{2}|1\d{3})\b/.test(viewportContent));
check('Viewport preserves user zoom',
  !/user-scalable\s*=\s*no/i.test(viewportContent) &&
  !/maximum-scale\s*=\s*1(?:\.0)?(?:\s*,|$)/i.test(viewportContent));
process.stdout.write('\n');

process.stdout.write('Global viewport containment:\n');
const bodyBlock = [...css.matchAll(/(?:^|\n)body\s*\{([^}]*)\}/gs)]
  .map((match) => match[1])
  .find((candidate) => /margin:\s*0/.test(candidate)) ?? '';
const siteMainBlock = block('.site-main');
check('html/body have explicit 100% width ceiling',
  /html,\s*\nbody\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%/s.test(css));
check('No global html/body fixed or desktop min width remains',
  !/(?:^|\})\s*(?:html|body)\s*\{[^}]*(?:min-)?width:\s*(?:980|1080|[5-9]\d{2}|1\d{3})px/sm.test(css));
check('body guards document-level horizontal overflow', /overflow-x:\s*(?:hidden|clip)/.test(bodyBlock));
check('site-main keeps responsive gutter width',
  /width:\s*min\(calc\(100%\s*-\s*2\s*\*\s*var\(--page-gutter-x\)\),\s*var\(--page-max-width\)\)/.test(siteMainBlock));
check('site-main can shrink', /min-width:\s*0/.test(siteMainBlock));
check('site-main is capped to the viewport', /max-width:\s*100%/.test(siteMainBlock));
check('Old site-main max-width none rule is removed', !/\.site-main\s*\{[^}]*max-width:\s*none/s.test(css));
process.stdout.write('\n');

process.stdout.write('Route shell shrink containment:\n');
const containmentStart = css.indexOf('Keep wide route content inside the viewport');
const containmentEnd = css.indexOf('}', containmentStart);
const containment = containmentStart >= 0 && containmentEnd > containmentStart
  ? css.slice(containmentStart, containmentEnd + 1)
  : '';
for (const selector of [
  '.site-main > *', '.home-shell', '.chart-ai-shell', '.market-dashboard',
  '.market-fixture-section', '.lab-shell', '.lab-landing-shell',
  '.portfolio-mvp', '.portfolio-dashboard', '.mp-page-layout', '.mp-sections',
]) {
  check(`${selector} is in shared shrink containment`, containment.includes(selector));
}
check('Shared route containment uses min-width: 0', /min-width:\s*0/.test(containment));
check('Shared route containment uses max-width: 100%', /max-width:\s*100%/.test(containment));
process.stdout.write('\n');

process.stdout.write('Internal scroll and breakpoint preservation:\n');
check('Portfolio holdings retain internal horizontal scroll', /\.positions-list-wrap\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Portfolio wide rows remain inside their scroll wrapper',
  /\.positions-category-grid\s*\{[^}]*min-width:\s*712px/s.test(css) &&
  /\.positions-list\s*\{[^}]*min-width:\s*740px/s.test(css));
check('Lab matrices retain internal horizontal scroll', /\.lab-matrix-scroll\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Lab matrix desktop data width remains preserved', /\.lab-return-matrix\s*\{[^}]*min-width:\s*700px/s.test(css));
check('Generic data tables retain internal horizontal scroll', /\.table-wrap\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Mobile nav retains internal horizontal scroll', /\.primary-nav\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Mobile ticker retains internal horizontal scroll', /\.ticker-belt\s*\{[^}]*overflow-x:\s*auto/s.test(css));
check('Mobile Home banner breakpoint remains max-width 859px',
  /@media\s*\(max-width:\s*859px\)\s*\{[\s\S]*?\.home-mobile-ad\s*\{[\s\S]*?display:\s*block/.test(css));
check('Mobile Home banner remains hidden from 860px',
  /@media\s*\(min-width:\s*860px\)\s*\{[\s\S]*?\.home-mobile-ad\s*\{[\s\S]*?display:\s*none/.test(css));
check('Desktop Home rail breakpoint remains min-width 1440px',
  /@media\s*\(min-width:\s*1440px\)\s*\{[\s\S]*?\.home-rail-ad\s*\{[\s\S]*?display:\s*block/.test(css));
process.stdout.write('\n');

process.stdout.write('Documentation:\n');
check('Changelog contains Phase 3DV-HF1', changelog.includes('## Phase 3DV-HF1 - 2026-06-28'));
check('Changelog records the confirmed global containment cause',
  changelog.includes('did not fully contain intrinsic-width descendants'));
check('Result document records owner production re-check pending',
  result.includes('owner production re-check pending'));
check('Result document records all affected routes',
  ['Home', 'Chart AI', 'Market', 'Lab', 'Portfolio', 'MyPage', 'login modal'].every((route) => result.includes(route)));
check('Result document records accessibility-safe zoom behavior', result.includes('preserved user zoom'));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
