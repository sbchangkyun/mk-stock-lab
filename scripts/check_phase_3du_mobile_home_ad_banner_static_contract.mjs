/**
 * Phase 3DU mobile Home ad banner static contract.
 * Read-only, no credentials, no network, no browser, and no live Supabase calls.
 */

globalThis.fetch = () => {
  throw new Error('Network access is blocked in the Phase 3DU static checker.');
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  client: 'src/lib/siteSettingsClient.ts',
  desktop: 'src/components/HomeRailAd.astro',
  mobile: 'src/components/HomeMobileAd.astro',
  home: 'src/pages/index.astro',
  mypage: 'src/pages/mypage.astro',
  styles: 'src/styles/style.css',
  package: 'package.json',
  changelog: 'docs/planning/planning_changelog.md',
  report: 'docs/planning/phase_3du_mobile_home_ad_banner_implementation_result_v0.1.md',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
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

const client = read(paths.client);
const desktop = read(paths.desktop);
const mobile = read(paths.mobile);
const home = read(paths.home);
const mypage = read(paths.mypage);
const styles = read(paths.styles);
const packageJson = read(paths.package);
const changelog = read(paths.changelog);
const report = read(paths.report);
const slots = [1, 2, 3, 4, 5];

process.stdout.write('=== Phase 3DU Mobile Home Ad Banner Static Contract ===\n\n');

process.stdout.write('Files and package script:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Phase 3DU package script exists',
  packageJson.includes('"check:phase-3du-mobile-home-ad-banner"') &&
  packageJson.includes('check_phase_3du_mobile_home_ad_banner_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Settings contract:\n');
check('Five-slot union exists', /1\s*\|\s*2\s*\|\s*3\s*\|\s*4\s*\|\s*5/.test(client));
check('Canonical slot list is exactly 1 through 5', client.includes('BANNER_SLOTS = [1, 2, 3, 4, 5]'));
check('HomeRailBanner is exported', client.includes('export type HomeRailBanner'));
check('HomeMobileBanner is exported', client.includes('export type HomeMobileBanner'));
check('Mobile settings property exists', client.includes('home_mobile_banners'));
check('Desktop settings key remains home_rail_banners', client.includes("HOME_BANNER_SETTINGS_KEY = 'home_rail_banners'"));
check('Mobile normalizer exists', client.includes('normalizeMobileBanners'));
check('Mobile getter exists', client.includes('getHomeMobileBanners'));
check('Mobile saver exists', client.includes('saveHomeMobileBanners'));
check('Legacy array payload remains supported', client.includes('if (Array.isArray(raw))'));
check('URL validator is shared by saves',
  client.includes('validateBannerList') && client.includes('validateBannerUrl(banner.imageUrl)'));
check('Blocked URL schemes remain intact',
  ['javascript:', 'data:', 'file:', 'vbscript:'].every((scheme) => client.includes(scheme)));
check('No direct environment access in settings client',
  !client.includes('process.env') && !client.includes('import.meta.env'));
check('No raw fetch in settings client', !/\bfetch\s*\(/.test(client));
check('No Supabase Storage upload in settings client', !client.includes('storage.from'));
process.stdout.write('\n');

process.stdout.write('Mobile component contract:\n');
check('Mobile component starts hidden', mobile.includes('style="display:none"'));
check('Mobile component loads managed settings', mobile.includes('getHomeMobileBanners'));
check('Mobile component filters active HTTP(S) image URLs',
  mobile.includes('banner.active') && mobile.includes('banner.imageUrl.trim()') && mobile.includes('https?'));
check('Zero valid banners stay hidden',
  mobile.includes('active.length === 0') && mobile.includes("style.display = 'none'"));
check('One banner avoids carousel timer',
  mobile.includes("classList.toggle('is-carousel', active.length >= 2)") &&
  mobile.includes('if (active.length >= 2) setupMobileCarousel'));
check('Two or more banners use one 5000ms timer',
  (mobile.match(/setInterval/g) || []).length === 1 && mobile.includes('5000'));
check('Old mobile timer is cleared', mobile.includes('clearInterval') && mobile.includes('resetMobileCarousel'));
check('Mobile image dimensions are 720 by 225',
  mobile.includes('image.width = 720') && mobile.includes('image.height = 225'));
check('Mobile links are safely externalized',
  mobile.includes("target = '_blank'") && mobile.includes("rel = 'noopener noreferrer'"));
check('Mobile alt is capped at 120 characters', mobile.includes('.slice(0, 120)'));
check('No SSR sample fallback', !mobile.includes('homeAdBanners'));
check('No ad network, tracking, or raw fetch',
  !['doubleclick.net', 'googlesyndication.com', 'googletagmanager.com', 'analytics.track', 'gtag(', 'fbq(']
    .some((pattern) => mobile.includes(pattern)) &&
  !/\bfetch\s*\(/.test(mobile));
check('No environment access in mobile component',
  !mobile.includes('process.env') && !mobile.includes('import.meta.env'));
process.stdout.write('\n');

process.stdout.write('Home and responsive layout:\n');
const mobilePosition = home.indexOf('<HomeMobileAd');
const indexPosition = home.indexOf('<HomeIndexCards');
check('Home imports HomeMobileAd', home.includes("import HomeMobileAd from '../components/HomeMobileAd.astro'"));
check('Home renders mobile ad before HomeIndexCards',
  mobilePosition !== -1 && indexPosition !== -1 && mobilePosition < indexPosition);
check('Mobile viewport reserves 720 / 225 aspect ratio', styles.includes('aspect-ratio: 720 / 225'));
check('Mobile images use object-fit contain',
  /\.home-mobile-ad-card img\s*\{[\s\S]*?object-fit:\s*contain;[\s\S]*?\}/.test(styles));
check('Mobile banner is enabled only through max-width 859px rule',
  /@media\s*\(max-width:\s*859px\)[\s\S]*?\.home-mobile-ad\s*\{[\s\S]*?display:\s*block;/.test(styles));
check('Mobile banner is explicitly hidden from 860px',
  /@media\s*\(min-width:\s*860px\)[\s\S]*?\.home-mobile-ad\s*\{[\s\S]*?display:\s*none\s*!important;/.test(styles));
check('Desktop rail 1440px breakpoint remains',
  /@media\s*\(min-width:\s*1440px\)[\s\S]*?\.home-rail-ad\s*\{[\s\S]*?display:\s*block;/.test(styles));
process.stdout.write('\n');

process.stdout.write('MyPage admin contract:\n');
check('Admin gate remains in use',
  mypage.includes('await isCurrentUserSiteAdmin()') && mypage.includes('if (!isAdmin) return'));
check('Desktop subsection has 160x600 guidance', mypage.includes('PC Home 우측 배너') && mypage.includes('160×600'));
check('Mobile subsection has 720x225 guidance', mypage.includes('모바일 Home 배너') && mypage.includes('720×225'));
check('Desktop slot containers 1 through 5 exist',
  slots.every((slot) => mypage.includes(`mpBannerSlot${slot}`)));
check('Mobile slot containers 1 through 5 exist',
  slots.every((slot) => mypage.includes(`mpMobileBannerSlot${slot}`)));
check('Desktop form fields 1 through 5 exist',
  slots.every((slot) =>
    ['Active', 'ImageUrl', 'LinkUrl', 'Alt', 'Preview', 'PreviewImg']
      .every((field) => mypage.includes(`mpBanner${field}${slot}`))));
check('Mobile form fields 1 through 5 exist',
  slots.every((slot) =>
    ['Active', 'ImageUrl', 'LinkUrl', 'Alt', 'Preview', 'PreviewImg']
      .every((field) => mypage.includes(`mpMobileBanner${field}${slot}`))));
check('Desktop and mobile full-array saves are wired',
  mypage.includes("saveHomeRailBanners(collectSlots('mpBanner'))") &&
  mypage.includes("saveHomeMobileBanners(collectSlots('mpMobileBanner'))"));
check('No file upload input exists in MyPage', !/type=["']file["']/.test(mypage));
check('No Supabase Storage upload exists in MyPage', !mypage.includes('storage.from'));
process.stdout.write('\n');

process.stdout.write('Documentation and boundaries:\n');
check('Changelog contains Phase 3DU', changelog.includes('## Phase 3DU'));
check('Phase report records no deployment', /No production deployment|deployment.*not performed/i.test(report));
check('Phase report records RLS-compatible storage decision',
  report.includes('home_mobile_banners') && report.includes('home_rail_banners'));
check('Desktop component remains present', desktop.includes('getHomeRailBanners'));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
