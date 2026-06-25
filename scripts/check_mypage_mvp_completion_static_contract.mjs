/**
 * Static contract check for Phase 3CD MyPage MVP Completion.
 * Verifies 내 데이터 card is removed, all preserved sections remain intact,
 * and all safety/no-regression boundaries hold.
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

const MYPAGE_PATH = join(root, 'src', 'pages', 'mypage.astro');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const AUTH_MODAL_PATH = join(root, 'src', 'components', 'Auth', 'AuthModal.astro');
const RESET_PASSWORD_PATH = join(root, 'src', 'pages', 'reset-password.astro');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3cd_mypage_mvp_completion_result_v0.1.md');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3CD MyPage MVP Completion Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('mypage.astro exists', existsSync(MYPAGE_PATH));
check('style.css exists', existsSync(STYLE_PATH));
check('Phase 3CD result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:mypage-mvp script',
  typeof pkg.scripts?.['check:mypage-mvp'] === 'string');
log('');

if (!existsSync(MYPAGE_PATH)) {
  log('ERROR: mypage.astro missing. Cannot continue.');
  process.exit(1);
}

const content = readFileSync(MYPAGE_PATH, 'utf8');

// ---------------------------------------------------------------------------
// Group 2: Phase 3CD — 내 데이터 card removed
// ---------------------------------------------------------------------------
log('--- Group 2: 내 데이터 removal (Phase 3CD) ---');

check('내 데이터 card is absent', !content.includes('내 데이터'));
check('포트폴리오 placeholder row absent (was in data card)', !content.includes('포트폴리오'));
check('관심 종목 placeholder row absent (was in data card)', !content.includes('관심 종목'));
check('mp-data-heading id absent (data card heading removed)', !content.includes('mp-data-heading'));
log('');

// ---------------------------------------------------------------------------
// Group 3: Account card preserved
// ---------------------------------------------------------------------------
log('--- Group 3: 내 계정 card preserved ---');

check('내 계정 heading present', content.includes('내 계정'));
check('이메일 row present', content.includes('이메일'));
check('로그인 방식 row present', content.includes('로그인 방식'));
check('가입일 row present', content.includes('가입일'));
check('마지막 접속 일시 row present', content.includes('마지막 접속 일시'));
check('구독 상태 row present', content.includes('구독 상태'));
check('구독 안함 value present', content.includes('구독 안함'));
log('');

// ---------------------------------------------------------------------------
// Group 4: Login method resolver preserved
// ---------------------------------------------------------------------------
log('--- Group 4: Login method resolver ---');

check('login method resolver references identities', content.includes('identities'));
check('login method resolver references app_metadata', content.includes('app_metadata'));
check('이메일 로그인 label defined', content.includes('이메일 로그인'));
check('Google 로그인 label defined', content.includes('Google 로그인'));
check('이메일 + Google combination label defined', content.includes('이메일 + Google'));
check('확인 불가 fallback label defined', content.includes('확인 불가'));
check('mpLoginMethod element id present', content.includes('mpLoginMethod'));
check('mpEmail element id present', content.includes('mpEmail'));
log('');

// ---------------------------------------------------------------------------
// Group 5: Master-only banner admin preserved
// ---------------------------------------------------------------------------
log('--- Group 5: Banner admin preserved ---');

check('운영 배너 관리 heading present', content.includes('운영 배너 관리'));
check('mpBannerAdminPanel id present', content.includes('mpBannerAdminPanel'));
check('Banner panel defaults hidden', content.includes('id="mpBannerAdminPanel"') && content.includes('hidden'));
check('mp-admin-rail aside element present', content.includes('mp-admin-rail'));
check('mp-page-layout wrapper present', content.includes('mp-page-layout'));
check('mp-page-layout--admin-visible class reference present', content.includes('mp-page-layout--admin-visible'));
check('mp-top-area is absent (HF3 no-regression)', !content.includes('mp-top-area'));
check('isCurrentUserSiteAdmin gate present', content.includes('isCurrentUserSiteAdmin'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Accordion controls preserved
// ---------------------------------------------------------------------------
log('--- Group 6: Accordion controls ---');

check('mpBannerAccordionToggle button present', content.includes('mpBannerAccordionToggle'));
check('aria-expanded attribute present', content.includes('aria-expanded'));
check('aria-controls attribute present', content.includes('aria-controls'));
check('mpBannerAccordionBody id present', content.includes('mpBannerAccordionBody'));
check('mpBannerAccordionSummary present', content.includes('mpBannerAccordionSummary'));
check('setAccordion function called on save error', content.includes('setAccordion') && content.includes('showMsg'));
log('');

// ---------------------------------------------------------------------------
// Group 7: Banner slot controls preserved
// ---------------------------------------------------------------------------
log('--- Group 7: Banner slot controls ---');

check('imageUrl inputs present (all 3 slots)',
  content.includes('mpBannerImageUrl1') && content.includes('mpBannerImageUrl2') && content.includes('mpBannerImageUrl3'));
check('linkUrl inputs present (all 3 slots)',
  content.includes('mpBannerLinkUrl1') && content.includes('mpBannerLinkUrl2') && content.includes('mpBannerLinkUrl3'));
check('alt text inputs present (all 3 slots)',
  content.includes('mpBannerAlt1') && content.includes('mpBannerAlt2') && content.includes('mpBannerAlt3'));
check('active checkboxes present (all 3 slots)',
  content.includes('mpBannerActive1') && content.includes('mpBannerActive2') && content.includes('mpBannerActive3'));
check('저장 button present', content.includes('mpBannerSaveBtn'));
check('다시 불러오기 button present', content.includes('다시 불러오기'));
check('No file upload input in admin panel', !content.includes('type="file"'));
check('No Supabase Storage usage', !content.includes('storage') && !content.includes('uploadFile'));
check('No click/impression tracking', !content.includes('clickCount') && !content.includes('impression'));
log('');

// ---------------------------------------------------------------------------
// Group 8: Notification section preserved
// ---------------------------------------------------------------------------
log('--- Group 8: Notification section ---');

check('알림 설정 section present', content.includes('알림 설정'));
check('내 텔레그램 연동 row present', content.includes('내 텔레그램 연동'));
check('관심종목 뉴스 알림 present (no space — notification section)', content.includes('관심종목 뉴스 알림'));
check('내 포트 종목 뉴스 알림 present', content.includes('내 포트 종목 뉴스 알림'));
check('이벤트/혜택 알림 present', content.includes('이벤트/혜택 알림'));
check('공지사항 알림 present', content.includes('공지사항 알림'));
log('');

// ---------------------------------------------------------------------------
// Group 9: Legal/support and account management preserved
// ---------------------------------------------------------------------------
log('--- Group 9: Legal/support and account management ---');

check('법적 고지 및 지원 section present', content.includes('법적 고지 및 지원'));
check('개인정보처리방침 link present', content.includes('개인정보처리방침'));
check('이용약관 link present', content.includes('이용약관'));
check('제휴문의 link present', content.includes('제휴문의'));
check('계정 관리 section present', content.includes('계정 관리'));
check('회원탈퇴 button present', content.includes('회원탈퇴'));
check('Withdrawal confirmation message present',
  content.includes('정말 회원 탈퇴하시겠습니까?'));
check('회원탈퇴 기능은 준비 중입니다 notice present',
  content.includes('회원탈퇴 기능은 준비 중입니다'));
log('');

// ---------------------------------------------------------------------------
// Group 10: Password reset no-regression (AuthModal / reset page)
// ---------------------------------------------------------------------------
log('--- Group 10: Password reset no-regression ---');

const authModalExists = existsSync(AUTH_MODAL_PATH);
check('AuthModal.astro exists', authModalExists);
if (authModalExists) {
  const authModal = readFileSync(AUTH_MODAL_PATH, 'utf8');
  check('AuthModal contains password reset reference (resetPasswordForEmail or 비밀번호를 잊으셨나요)',
    authModal.includes('resetPasswordForEmail') || authModal.includes('비밀번호를 잊으셨나요'));
}

const resetPageExists = existsSync(RESET_PASSWORD_PATH);
check('reset-password.astro exists', resetPageExists);
if (resetPageExists) {
  const resetPage = readFileSync(RESET_PASSWORD_PATH, 'utf8');
  check('reset-password.astro contains updateUser or password reset form',
    resetPage.includes('updateUser') || resetPage.includes('비밀번호') || resetPage.includes('password'));
}
log('');

// ---------------------------------------------------------------------------
// Group 11: Safety — no destructive / live patterns
// ---------------------------------------------------------------------------
log('--- Group 11: Safety boundaries ---');

check('No auth.admin usage', !content.includes('auth.admin'));
check('No deleteUser usage', !content.includes('deleteUser') && !content.includes('delete_user'));
check('No external fetch call (raw fetch)', !/\bfetch\s*\([^)]*https?/.test(content));
check('No process.env read', !content.includes('process.env'));
check('No import.meta.env read', !content.includes('import.meta.env'));
check('No setInterval added', !content.includes('setInterval'));
check('No polling keyword', !content.includes('polling'));
check('No cron keyword', !content.includes('cron'));
check('No KIS endpoint reference', !content.includes('koreainvestment') && !content.includes('KIS_APP_KEY'));
check('No GNews reference', !content.includes('gnews.io') && !content.includes('GNEWS_API_KEY'));
check('No Vercel URL reference', !content.includes('vercel.app') && !content.includes('vercel.com'));
check('No supabaseAdmin import', !content.includes('supabaseAdmin'));
check('No DB migration SQL', !content.includes('CREATE TABLE') && !content.includes('ALTER TABLE'));
check('No notification API (email/push/SMS)', !content.includes('sendEmail') && !content.includes('pushNotification'));
log('');

// ---------------------------------------------------------------------------
// Group 12: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 12: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3CD MyPage MVP Completion — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Phase 3CD MyPage MVP cleanup complete');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
