/**
 * Phase 3DU-HF2 PC banner admin persistence static contract.
 * Read-only: no credentials, network, browser, dev server, or live Supabase calls.
 */

globalThis.fetch = () => {
  throw new Error('Network access is blocked in the Phase 3DU-HF2 static checker.');
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const paths = {
  client: 'src/lib/siteSettingsClient.ts',
  mypage: 'src/pages/mypage.astro',
  rail: 'src/components/HomeRailAd.astro',
  mobile: 'src/components/HomeMobileAd.astro',
  changelog: 'docs/planning/planning_changelog.md',
  report: 'docs/planning/phase_3du_hf2_pc_banner_admin_save_persistence_hotfix_result_v0.1.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try {
    return readFileSync(join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
};

const client = read(paths.client);
const mypage = read(paths.mypage);
const rail = read(paths.rail);
const mobile = read(paths.mobile);
const changelog = read(paths.changelog);
const report = read(paths.report);
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

process.stdout.write('=== Phase 3DU-HF2 Banner Admin Persistence Static Contract ===\n\n');

process.stdout.write('Files and package script:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('HF2 package script exists',
  packageJson.includes('"check:phase-3du-hf2-banner-admin-persistence"') &&
  packageJson.includes('check_phase_3du_hf2_banner_admin_persistence_static_contract.mjs'));
process.stdout.write('\n');

process.stdout.write('Storage merge and persistence verification:\n');
check('Desktop saver exists', client.includes('saveHomeRailBanners'));
check('Mobile saver exists', client.includes('saveHomeMobileBanners'));
check('Shared save path distinguishes desktop and mobile targets',
  client.includes("target: 'desktop' | 'mobile'") &&
  client.includes("target === 'desktop'") &&
  client.includes("target === 'mobile'"));
check('Stored object contains both groups',
  client.includes('home_rail_banners: HomeRailBanner[]') &&
  client.includes('home_mobile_banners: HomeMobileBanner[]'));
check('Desktop save preserves current mobile group',
  /home_mobile_banners:\s*\n?\s*target === 'mobile'\s*\?\s*normalizeMobileBanners\(banners\)\s*:\s*current\.home_mobile_banners/.test(client));
check('Mobile save preserves current desktop group',
  /home_rail_banners:\s*\n?\s*target === 'desktop'\s*\?\s*normalizeBanners\(banners\)\s*:\s*current\.home_rail_banners/.test(client));
check('Legacy array-shaped payload remains supported',
  client.includes('if (Array.isArray(raw))') && client.includes('home_rail_banners: normalizeBanners(raw)'));
check('Upsert requests the persisted value',
  client.includes('.upsert(payload)') && client.includes(".select('value')") && client.includes('.single()'));
check('Persisted response is normalized and compared',
  client.includes('normalizeStoredHomeBannerSettings') &&
  client.includes('bannerSettingsMatch(next, persisted)'));
check('Save returns failure when persisted settings do not match',
  client.includes('저장된 배너 설정을 확인하지 못했습니다'));
check('All five canonical slots remain in the model', client.includes('BANNER_SLOTS = [1, 2, 3, 4, 5]'));
check('linkUrl and active survive normalization',
  client.includes("record['linkUrl']") && client.includes("Boolean(record['active'])"));
process.stdout.write('\n');

process.stdout.write('MyPage collect, load, and save behavior:\n');
check('PC collect path reads active checkbox',
  mypage.includes('active: activeEl?.checked ?? false'));
check('PC collect path reads link URL',
  mypage.includes('linkUrl: (linkUrlEl?.value ?? \'\').trim()'));
check('Load path restores active checkbox', mypage.includes('activeEl.checked = banner.active'));
check('Load path restores link URL', mypage.includes('linkUrlEl.value = banner.linkUrl'));
check('PC save uses the desktop prefix',
  mypage.includes("saveHomeRailBanners(collectSlots('mpBanner'))"));
check('Mobile save uses the mobile prefix',
  mypage.includes("saveHomeMobileBanners(collectSlots('mpMobileBanner'))"));
check('Verified saves reload both groups before success display',
  (mypage.match(/if \(result\.ok\) await reload\(\);/g) || []).length === 2);
check('PC and mobile save buttons have distinct labels',
  mypage.includes('PC 배너 저장') && mypage.includes('모바일 배너 저장'));
check('Save buttons are disabled during writes',
  mypage.includes('desktopSaveBtn.disabled = true') &&
  mypage.includes('mobileSaveBtn.disabled = true'));
check('Checkbox meaning is clarified for both groups',
  (mypage.match(/체크된 슬롯만 노출됩니다\./g) || []).length === 2 &&
  mypage.includes('체크 해제 시 이미지 URL이 있어도 노출되지 않습니다.'));
check('No file upload input was introduced', !/type=["']file["']/.test(mypage));
check('No direct Supabase Storage usage was introduced',
  !client.includes('storage.from') && !mypage.includes('storage.from'));
check('No environment access was introduced',
  !client.includes('process.env') && !client.includes('import.meta.env') &&
  !mypage.includes('process.env') && !mypage.includes('import.meta.env'));
process.stdout.write('\n');

process.stdout.write('Desktop rendering behavior:\n');
check('Desktop rail filters by active flag and valid image URL',
  rail.includes('b.active && b.imageUrl.trim()') && rail.includes('https?'));
check('Unchecked zero-active state clears stale content',
  rail.includes('active.length === 0') && rail.includes("track.innerHTML = ''"));
check('Unchecked zero-active state hides the rail',
  rail.includes("rail.style.display = 'none'"));
check('Valid linkUrl produces an anchor',
  rail.includes('b.linkUrl') && rail.includes("document.createElement('a')"));
check('Missing linkUrl produces a non-link card',
  rail.includes("document.createElement('div')"));
check('No static sample fallback is rendered',
  !rail.includes('homeAdBanners') && !mobile.includes('homeAdBanners'));
process.stdout.write('\n');

process.stdout.write('Documentation:\n');
check('Changelog contains Phase 3DU-HF2', changelog.includes('## Phase 3DU-HF2'));
check('Changelog records owner persistence report',
  changelog.includes('PC slot 2 `linkUrl`') && changelog.includes('PC slot 3 `active`'));
check('Result document explains source finding and re-test',
  report.includes('Persistence Verification') && report.includes('Owner Re-test'));
check('Result document states no live Supabase or deployment',
  /No live Supabase calls/i.test(report) && /No production deployment/i.test(report));
process.stdout.write('\n');

process.stdout.write(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failures.length > 0) {
  process.stdout.write('\nFailed checks:\n');
  for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Result: PASS\n');
}
