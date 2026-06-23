/**
 * Static structural validation for the header/footer UI shell.
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const HEADER_PATH = join(root, 'src', 'components', 'Header.astro');
const FOOTER_PATH = join(root, 'src', 'components', 'Footer.astro');
const PRIVACY_PATH = join(root, 'src', 'pages', 'privacy.astro');
const TERMS_PATH = join(root, 'src', 'pages', 'terms.astro');
const MYPAGE_PATH = join(root, 'src', 'pages', 'mypage.astro');

const PARTNERSHIP_URL = 'https://forms.gle/WAVSxaotdes6T5yJA';

const FABRICATED_POLICY_PATTERNS = [
  '제1조', '수집 항목', '수집 목적', '보유 기간', '처리 방침',
  '제2조', '위탁', '파기', '정보주체', '열람청구',
];

const DELETION_PATTERNS = [
  'deleteUser', 'delete_user', 'DELETE /api/account', '/api/account/delete',
  'auth.admin.delete',
];

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== Header/Footer Shell Static Contract Check ===');
log('');

// --- File existence ---
log('File existence:');
const headerExists = existsSync(HEADER_PATH);
check('Header.astro exists', headerExists);
const footerExists = existsSync(FOOTER_PATH);
check('Footer.astro exists', footerExists);
const privacyExists = existsSync(PRIVACY_PATH);
check('privacy.astro placeholder exists', privacyExists);
const termsExists = existsSync(TERMS_PATH);
check('terms.astro placeholder exists', termsExists);
const mypageExists = existsSync(MYPAGE_PATH);
check('mypage.astro placeholder exists', mypageExists);
log('');

if (!headerExists || !footerExists) {
  log('ERROR: Required header/footer files missing. Cannot continue.');
  process.exit(1);
}

const headerContent = readFileSync(HEADER_PATH, 'utf8');
const footerContent = readFileSync(FOOTER_PATH, 'utf8');

// --- Header My Page entry ---
log('Header My Page entry:');
check('Header contains 마이페이지', headerContent.includes('마이페이지'));

const mypageIdx = headerContent.indexOf('마이페이지');
const logoutIdx = headerContent.indexOf('로그아웃');
check(
  '마이페이지 placed before 로그아웃 in header',
  mypageIdx !== -1 && logoutIdx !== -1 && mypageIdx < logoutIdx,
);
check('Header links to /mypage', headerContent.includes('href="/mypage"'));
check('My Page link starts hidden (hidden class)', headerContent.includes('mypage-btn'));
log('');

// --- Footer content ---
log('Footer content:');
check('Footer contains © 2026 MK Stock Lab ver1.0', footerContent.includes('© 2026 MK Stock Lab ver1.0'));
check('Footer does not link to YouTube', !footerContent.includes('youtube.com/@'));
check('Footer contains 개인정보처리방침', footerContent.includes('개인정보처리방침'));
check('Footer contains 이용약관', footerContent.includes('이용약관'));
check('Footer contains 제휴문의', footerContent.includes('제휴문의'));
check('Footer contains exact partnership URL', footerContent.includes(PARTNERSHIP_URL));
check('Partnership link uses rel="noopener noreferrer"', footerContent.includes('rel="noopener noreferrer"'));
check('Footer links to /privacy', footerContent.includes('href="/privacy"'));
check('Footer links to /terms', footerContent.includes('href="/terms"'));
log('');

// --- Placeholder page safety ---
log('Placeholder page safety:');
if (privacyExists) {
  const privacyContent = readFileSync(PRIVACY_PATH, 'utf8');
  const privacyFabricatedPatterns = FABRICATED_POLICY_PATTERNS.filter((p) => privacyContent.includes(p));
  check(
    `Privacy page does not contain fabricated policy text (checked: ${FABRICATED_POLICY_PATTERNS.length} patterns)`,
    privacyFabricatedPatterns.length === 0,
  );
} else {
  check('Privacy page does not contain fabricated policy text', false);
}

if (termsExists) {
  const termsContent = readFileSync(TERMS_PATH, 'utf8');
  const termsFabricatedPatterns = FABRICATED_POLICY_PATTERNS.filter((p) => termsContent.includes(p));
  check(
    `Terms page does not contain fabricated legal text (checked: ${FABRICATED_POLICY_PATTERNS.length} patterns)`,
    termsFabricatedPatterns.length === 0,
  );
} else {
  check('Terms page does not contain fabricated legal text', false);
}

if (mypageExists) {
  const mypageContent = readFileSync(MYPAGE_PATH, 'utf8');
  const mypageDeletionPatterns = DELETION_PATTERNS.filter((p) => mypageContent.includes(p));
  check(
    `My Page placeholder does not contain account deletion logic (checked: ${DELETION_PATTERNS.length} patterns)`,
    mypageDeletionPatterns.length === 0,
  );
}
log('');

// --- Safety boundaries in header/footer ---
log('Safety boundaries:');
const headerFooterCombined = headerContent + '\n' + footerContent;
const deletionPresentInHeaderFooter = DELETION_PATTERNS.filter((p) => headerFooterCombined.includes(p));
check(
  `No account deletion pattern in header/footer (checked: ${DELETION_PATTERNS.length})`,
  deletionPresentInHeaderFooter.length === 0,
);
check('No KIS external URL in header/footer', !headerFooterCombined.includes('koreainvestment.com'));
check('No Supabase URL in header/footer', !headerFooterCombined.includes('supabase.co'));
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
