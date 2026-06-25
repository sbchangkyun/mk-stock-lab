/**
 * Static structural validation for the Home right-rail ad slot structure.
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BANNERS_JSON_PATH = join(root, 'src', 'data', 'homeAdBanners.json');
const RAIL_COMPONENT_PATH = join(root, 'src', 'components', 'HomeRailAd.astro');
const HOME_PAGE_PATH = join(root, 'src', 'pages', 'index.astro');
const SVG_01_PATH = join(root, 'public', 'ads', 'home-rail', 'home-rail-sample-01.svg');
const SVG_02_PATH = join(root, 'public', 'ads', 'home-rail', 'home-rail-sample-02.svg');
const SVG_03_PATH = join(root, 'public', 'ads', 'home-rail', 'home-rail-sample-03.svg');

const AD_NETWORK_PATTERNS = [
  'doubleclick.net', 'googletagmanager.com', 'googlesyndication.com',
  'amazon-adsystem.com', 'ads.twitter.com', 'connect.facebook.net',
  'pagead2.googlesyndication.com',
];
const TRACKING_PATTERNS = ['gtag(', 'ga(', 'fbq(', 'analytics.track', '_paq.push'];
const FETCH_PATTERNS = [/fetch\s*\(/, /XMLHttpRequest/];
const ENV_PATTERNS = ['process.env.', 'import.meta.env.'];

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== Home Ad Slots Static Contract Check ===');
log('');

// --- File existence ---
log('File existence:');
check('homeAdBanners.json exists', existsSync(BANNERS_JSON_PATH));
check('HomeRailAd.astro exists', existsSync(RAIL_COMPONENT_PATH));
check('index.astro (Home page) exists', existsSync(HOME_PAGE_PATH));
check('SVG slot 01 exists', existsSync(SVG_01_PATH));
check('SVG slot 02 exists', existsSync(SVG_02_PATH));
check('SVG slot 03 exists', existsSync(SVG_03_PATH));
log('');

if (!existsSync(BANNERS_JSON_PATH)) {
  log('ERROR: homeAdBanners.json missing. Cannot continue.');
  process.exit(1);
}

// --- Banner JSON structure ---
log('Banner JSON structure:');
let banners = [];
try {
  banners = JSON.parse(readFileSync(BANNERS_JSON_PATH, 'utf8'));
} catch {
  check('homeAdBanners.json parses as valid JSON', false);
  process.exitCode = 1;
  process.exit();
}

check('homeAdBanners.json parses as valid JSON', true);
check('Total of exactly 3 banner entries', banners.length === 3);

const ids = banners.map((b) => b.id ?? '');
check('Entry for home-rail-sample-01 present', ids.some((id) => id.includes('sample-01')));
check('Entry for home-rail-sample-02 present', ids.some((id) => id.includes('sample-02')));
check('Entry for home-rail-sample-03 present', ids.some((id) => id.includes('sample-03')));

const imageSrcs = banners.map((b) => b.imageSrc ?? '');
check('imageSrc for sample-01 present', imageSrcs.some((s) => s.includes('sample-01')));
check('imageSrc for sample-02 present', imageSrcs.some((s) => s.includes('sample-02')));
check('imageSrc for sample-03 present', imageSrcs.some((s) => s.includes('sample-03')));

const allActive = banners.every((b) => b.isActive === true);
check('All banner entries are active', allActive);
log('');

// --- SVG content checks ---
log('SVG banner content:');
if (existsSync(SVG_01_PATH)) {
  const svg01 = readFileSync(SVG_01_PATH, 'utf8');
  check('SVG 01 contains "Sample Banner 01"', svg01.includes('Sample Banner 01') || svg01.includes('Sample') && svg01.includes('Banner 01'));
}
if (existsSync(SVG_02_PATH)) {
  const svg02 = readFileSync(SVG_02_PATH, 'utf8');
  check('SVG 02 contains "Sample Banner 02"', svg02.includes('Sample Banner 02') || svg02.includes('Sample') && svg02.includes('Banner 02'));
}
if (existsSync(SVG_03_PATH)) {
  const svg03 = readFileSync(SVG_03_PATH, 'utf8');
  check('SVG 03 contains "Sample Banner 03"', svg03.includes('Sample Banner 03') || svg03.includes('Sample') && svg03.includes('Banner 03'));
}
log('');

// --- Home page integration ---
log('Home page integration:');
if (existsSync(HOME_PAGE_PATH)) {
  const homeContent = readFileSync(HOME_PAGE_PATH, 'utf8');
  check('Home page imports HomeRailAd', homeContent.includes('HomeRailAd'));
  check('Home page renders HomeRailAd component', homeContent.includes('<HomeRailAd'));
}
log('');

// --- Rail component safety ---
log('HomeRailAd safety:');
if (existsSync(RAIL_COMPONENT_PATH)) {
  const railContent = readFileSync(RAIL_COMPONENT_PATH, 'utf8');

  // Phase 3CA-HF3: sample banners must not be rendered as SSR operational content
  check('HomeRailAd does not render sample banners as SSR fallback (HF3 no-sample-flash policy)',
    !railContent.includes('homeAdBanners') || !railContent.includes('.map('));

  const adNetworkFound = AD_NETWORK_PATTERNS.filter((p) => railContent.includes(p));
  check(
    `No external ad network URL in rail component (checked: ${AD_NETWORK_PATTERNS.length})`,
    adNetworkFound.length === 0,
  );

  const trackingFound = TRACKING_PATTERNS.filter((p) => railContent.includes(p));
  check(
    `No tracking script in rail component (checked: ${TRACKING_PATTERNS.length})`,
    trackingFound.length === 0,
  );

  const fetchFound = FETCH_PATTERNS.filter((p) => p.test(railContent));
  check(
    `No fetch/XHR call in rail component (checked: ${FETCH_PATTERNS.length})`,
    fetchFound.length === 0,
  );

  const envFound = ENV_PATTERNS.filter((p) => railContent.includes(p));
  check(
    `No env read in rail component (checked: ${ENV_PATTERNS.length})`,
    envFound.length === 0,
  );
}
log('');

// --- Phase 3CA: configured banner support in rail component ---
log('Phase 3CA configured banner support:');
if (existsSync(RAIL_COMPONENT_PATH)) {
  const railContent3CA = readFileSync(RAIL_COMPONENT_PATH, 'utf8');
  check('Rail imports siteSettingsClient (managed banner support)',
    railContent3CA.includes('siteSettingsClient'));
  check('Managed banners use noopener noreferrer link attribute',
    railContent3CA.includes('noopener noreferrer'));
  check('No click tracking in managed banner loader',
    !railContent3CA.includes('clickCount') && !railContent3CA.includes('impression'));
}
log('');

// --- Phase 3CA-HF2: active slot filtering ---
log('Phase 3CA-HF2 active slot filtering:');
if (existsSync(RAIL_COMPONENT_PATH)) {
  const railHF2 = readFileSync(RAIL_COMPONENT_PATH, 'utf8');
  check('Filter uses .trim() to exclude whitespace-only imageUrl',
    railHF2.includes('imageUrl.trim()') || railHF2.includes('.trim()'));
  check('Filter validates https? scheme on imageUrl',
    railHF2.includes('https?') && railHF2.includes('imageUrl'));
  check('Empty active slots excluded (filter checks imageUrl validity)',
    railHF2.includes('active.length === 0') || railHF2.includes("if (active.length === 0)"));
  check('Old carousel torn down before managed content (clearInterval on _railIntervalId)',
    railHF2.includes('_railIntervalId') && railHF2.includes('clearInterval'));
  check('Track transform reset before replacing content',
    railHF2.includes("track.style.transform = ''"));
  check('Sample banners not used as operational SSR fallback (HF3 no-sample-flash policy)',
    !railHF2.includes('homeAdBanners') || !railHF2.includes('.map('));
  check('No raw setInterval added for polling beyond carousel rotation',
    (railHF2.match(/setInterval/g) || []).length <= 1);
}
log('');

// --- Summary ---
log('=== Result ===');
if (failures === 0) {
  log('All checks passed. Exit 0.');
  process.exitCode = 0;
} else {
  log(`${failures} check(s) failed. Exit 1.`);
  process.exitCode = 1;
}
