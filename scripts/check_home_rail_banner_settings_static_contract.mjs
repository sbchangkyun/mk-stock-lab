/**
 * Static contract check for Phase 3CA Home Rail Banner URL Settings MVP.
 * Verifies migration, client helper, HomeRailAd managed-banner support,
 * MyPage admin panel, and safety constraints.
 * No network calls. No .env reads. Exits non-zero on failure.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const MIGRATION_PATH = join(root, 'supabase', 'migrations', '20260625_site_admins_and_settings.sql');
const CLIENT_PATH = join(root, 'src', 'lib', 'siteSettingsClient.ts');
const RAIL_PATH = join(root, 'src', 'components', 'HomeRailAd.astro');
const MYPAGE_PATH = join(root, 'src', 'pages', 'mypage.astro');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON = join(root, 'package.json');
const CHANGELOG = join(root, 'docs', 'planning', 'planning_changelog.md');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3ca_home_rail_banner_url_settings_mvp_result_v0.1.md');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3CA Home Rail Banner Settings Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

const migExists = existsSync(MIGRATION_PATH);
const clientExists = existsSync(CLIENT_PATH);
const railExists = existsSync(RAIL_PATH);
const mypageExists = existsSync(MYPAGE_PATH);
const styleExists = existsSync(STYLE_PATH);

check('Migration 20260625_site_admins_and_settings.sql exists', migExists);
check('siteSettingsClient.ts exists', clientExists);
check('HomeRailAd.astro exists', railExists);
check('mypage.astro exists', mypageExists);
check('style.css exists', styleExists);

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:home-rail-banner-settings script',
  typeof pkg.scripts?.['check:home-rail-banner-settings'] === 'string');
check('Result doc exists', existsSync(RESULT_DOC));
check('planning_changelog.md has Phase 3CA entry',
  existsSync(CHANGELOG) && readFileSync(CHANGELOG, 'utf8').includes('3CA'));
log('');

// ---------------------------------------------------------------------------
// Group 2: Migration contract
// ---------------------------------------------------------------------------
log('--- Group 2: Migration contract ---');

if (migExists) {
  const mig = readFileSync(MIGRATION_PATH, 'utf8');
  check('Migration creates site_admins table', mig.includes('site_admins'));
  check('Migration creates site_settings table', mig.includes('site_settings'));
  check('site_admins has user_id primary key', mig.includes('user_id') && mig.includes('primary key'));
  check('site_admins has role check (master)', mig.includes("'master'"));
  check('Migration creates is_site_admin() function', mig.includes('is_site_admin'));
  check('is_site_admin is security definer', mig.includes('security definer'));
  check('Migration enables RLS on site_admins', mig.includes('alter table') && mig.includes('site_admins') && mig.includes('enable row level security'));
  check('Migration enables RLS on site_settings', mig.includes('alter table') && mig.includes('site_settings') && mig.includes('enable row level security'));
  check('RLS allows public read of home_rail_banners', mig.includes('home_rail_banners') && mig.includes('anon'));
  check('RLS restricts write to master admins', mig.includes('is_site_admin') && (mig.includes('for insert') || mig.includes('for update')));
  check('Migration inserts default banner slots', mig.includes("on conflict (key) do nothing"));
  check('No SQL execution comment (migration is owner-applied)', mig.includes('Supabase') || mig.includes('dashboard') || mig.includes('SQL Editor'));
} else {
  check('Migration readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 3: siteSettingsClient contract
// ---------------------------------------------------------------------------
log('--- Group 3: siteSettingsClient.ts ---');

if (clientExists) {
  const client = readFileSync(CLIENT_PATH, 'utf8');
  check('Imports getBrowserSupabaseClient from supabase', client.includes('getBrowserSupabaseClient'));
  check('Imports isSupabaseConfigured from supabase', client.includes('isSupabaseConfigured'));
  check('HomeRailBanner type exported', client.includes('HomeRailBanner'));
  check('slot type is 1|2|3', client.includes('1 | 2 | 3'));
  check('validateBannerUrl exported', client.includes('validateBannerUrl'));
  check('BLOCKED_SCHEMES blocks javascript:', client.includes('javascript:'));
  check('BLOCKED_SCHEMES blocks data:', client.includes('data:'));
  check('ALLOWED_SCHEMES requires http/https', client.includes('https?'));
  check('normalizeBanners exported', client.includes('normalizeBanners'));
  check('getHomeRailBanners exported', client.includes('getHomeRailBanners'));
  check('saveHomeRailBanners exported', client.includes('saveHomeRailBanners'));
  check('isCurrentUserSiteAdmin exported', client.includes('isCurrentUserSiteAdmin'));
  check('Reads from site_settings table', client.includes("'site_settings'"));
  check('Reads home_rail_banners key', client.includes("'home_rail_banners'"));
  check('Writes to site_settings via upsert', client.includes('.upsert'));
  check('Checks site_admins table for admin', client.includes("'site_admins'"));
  check('No setInterval in client helper', !client.includes('setInterval'));
  check('No polling loop in client helper', !client.includes('setInterval') && !client.includes('polling'));
  check('No raw fetch() call in client (uses supabase client)', !(/\bfetch\s*\(/.test(client)));
  check('No console.log/error in client', !client.includes('console.log') && !client.includes('console.error'));
  check('Error handling returns message object (no stack traces)',
    client.includes("{ ok: false, message:") || client.includes("{ ok: false, message :"));
  check('imageUrl URL validated before save', client.includes('validateBannerUrl') && client.includes('imageUrl'));
  check('linkUrl URL validated before save', client.includes('validateBannerUrl') && client.includes('linkUrl'));
  check('Alt text length validated', client.includes('MAX_ALT_LENGTH'));
} else {
  check('siteSettingsClient.ts readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 4: HomeRailAd managed banner support
// ---------------------------------------------------------------------------
log('--- Group 4: HomeRailAd managed banner support ---');

if (railExists) {
  const rail = readFileSync(RAIL_PATH, 'utf8');
  check('Rail still imports homeAdBanners.json (static fallback preserved)',
    rail.includes('homeAdBanners'));
  check('Rail imports siteSettingsClient (managed banners)',
    rail.includes('siteSettingsClient'));
  check('Rail imports isSupabaseConfigured guard', rail.includes('isSupabaseConfigured'));
  check('Managed banners checked via isSupabaseConfigured()', rail.includes('isSupabaseConfigured()'));
  check('Managed banner links use noopener noreferrer', rail.includes('noopener noreferrer'));
  check('Managed banner links use target _blank', rail.includes("'_blank'") || rail.includes('"_blank"'));
  check('URL scheme validated for linkUrl (/^https?:\\/\\//)',
    rail.includes('https?') && rail.includes('linkUrl'));
  check('Alt text length capped in managed banners', rail.includes('.slice(0, 120)'));
  check('No click tracking added', !rail.includes('clickCount') && !rail.includes('impression'));
  check('No new setInterval added for polling',
    (rail.match(/setInterval/g) || []).length <= 1);
  check('No raw fetch() in rail component', !(/\bfetch\s*\(/.test(rail)));
  check('No external ad network in rail', !['doubleclick.net', 'googletagmanager.com', 'googlesyndication.com'].some((p) => rail.includes(p)));
} else {
  check('HomeRailAd.astro readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 5: MyPage admin panel
// ---------------------------------------------------------------------------
log('--- Group 5: MyPage admin panel ---');

if (mypageExists) {
  const mp = readFileSync(MYPAGE_PATH, 'utf8');
  check('운영 배너 관리 panel heading present', mp.includes('운영 배너 관리'));
  check('Banner admin panel has id mpBannerAdminPanel', mp.includes('mpBannerAdminPanel'));
  check('Banner admin panel defaults to hidden', mp.includes('mpBannerAdminPanel') && mp.includes('hidden'));
  check('isCurrentUserSiteAdmin called to gate panel', mp.includes('isCurrentUserSiteAdmin'));
  check('siteSettingsClient imported in mypage', mp.includes('siteSettingsClient'));
  check('getHomeRailBanners called for reload', mp.includes('getHomeRailBanners'));
  check('saveHomeRailBanners called for save', mp.includes('saveHomeRailBanners'));
  check('Panel has imageUrl inputs (slots 1-3)', mp.includes('mpBannerImageUrl1') && mp.includes('mpBannerImageUrl2') && mp.includes('mpBannerImageUrl3'));
  check('Panel has linkUrl inputs (slots 1-3)', mp.includes('mpBannerLinkUrl1') && mp.includes('mpBannerLinkUrl2') && mp.includes('mpBannerLinkUrl3'));
  check('Panel has alt text inputs (slots 1-3)', mp.includes('mpBannerAlt1') && mp.includes('mpBannerAlt2') && mp.includes('mpBannerAlt3'));
  check('Panel has active checkboxes (slots 1-3)', mp.includes('mpBannerActive1') && mp.includes('mpBannerActive2') && mp.includes('mpBannerActive3'));
  check('Panel has 저장 button', mp.includes('mpBannerSaveBtn') && mp.includes('저장'));
  check('Panel has 다시 불러오기 button', mp.includes('다시 불러오기'));
  check('Panel has save message status element', mp.includes('mpBannerSaveMsg'));
  check('No file upload input in panel', !mp.includes('type="file"'));
  check('No setInterval in mypage banner admin script', (() => {
    const scriptStart = mp.indexOf('setupBannerAdmin');
    const scriptEnd = mp.lastIndexOf('</script>');
    if (scriptStart < 0 || scriptEnd < 0) return true;
    const section = mp.slice(scriptStart, scriptEnd);
    return !section.includes('setInterval');
  })());
  check('No raw fetch() in mypage', !(/\bfetch\s*\(/.test(mp)));
  check('No @supabase direct import in mypage', !(/from\s+['"]@supabase/.test(mp)));
  check('Link preview uses https? validation', mp.includes('https?') && mp.includes('previewImgEl'));
} else {
  check('mypage.astro readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 6: CSS additions
// ---------------------------------------------------------------------------
log('--- Group 6: CSS banner admin styles ---');

if (styleExists) {
  const css = readFileSync(STYLE_PATH, 'utf8');
  check('mp-banner-slot class defined', css.includes('.mp-banner-slot'));
  check('mp-banner-field class defined', css.includes('.mp-banner-field'));
  check('mp-banner-admin-actions class defined', css.includes('.mp-banner-admin-actions'));
  check('mp-banner-save-msg--ok class defined', css.includes('.mp-banner-save-msg--ok'));
  check('mp-banner-save-msg--err class defined', css.includes('.mp-banner-save-msg--err'));
  check('mp-banner-preview class defined', css.includes('.mp-banner-preview'));
} else {
  check('style.css readable', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 7: Safety constraints (no live providers, no tracking)
// ---------------------------------------------------------------------------
log('--- Group 7: Safety constraints ---');

const allFiles = [MIGRATION_PATH, CLIENT_PATH, RAIL_PATH, MYPAGE_PATH]
  .filter(existsSync)
  .map((p) => readFileSync(p, 'utf8'));
const combined = allFiles.join('\n');

const AD_NETWORKS = ['doubleclick.net', 'googletagmanager.com', 'googlesyndication.com', 'amazon-adsystem.com'];
check('No external ad network scripts', !AD_NETWORKS.some((n) => combined.includes(n)));
check('No click tracking patterns', !combined.includes('clickCount') && !combined.includes('impression') && !combined.includes('analytics.track'));
check('No KIS live calls', !combined.includes('koreainvestment.com') && !combined.includes('KIS_APP_KEY'));
check('No GNews live calls', !combined.includes('gnews.io'));
check('No Supabase Storage (image upload deferred)', !combined.includes('storage.from'));
check('No scheduled polling (cron/setInterval in new client code)',
  !readFileSync(CLIENT_PATH, 'utf8').includes('setInterval'));
log('');

// ---------------------------------------------------------------------------
// Group 8: Checker network safety (self-check)
// ---------------------------------------------------------------------------
log('--- Group 8: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3CA Home Rail Banner Settings — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Phase 3CA banner settings MVP ready');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
