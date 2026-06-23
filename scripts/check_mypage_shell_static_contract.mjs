/**
 * Static structural validation for the My Page shell (Phase 3AX revision).
 * No network calls. No .env file reads. Exits non-zero on any failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const MYPAGE_PATH = join(root, 'src', 'pages', 'mypage.astro');
const PARTNERSHIP_URL = 'https://forms.gle/WAVSxaotdes6T5yJA';
const REQUIRED_WITHDRAWAL_MSG = '정말 회원 탈퇴하시겠습니까? 회원탈퇴하면 등록/활동 정보가 모두 삭제됩니다.';
const REQUIRED_NOTICE_MSG = '회원탈퇴 기능은 준비 중입니다.';

const FORBIDDEN_FETCH_PATTERN = /fetch\s*\(/;
const SUPABASE_IMPORT_PATTERN = /from\s+['"]@supabase/;
const DELETION_PATTERNS = [
  'deleteUser', 'delete_user', '/api/account/delete', 'auth.admin.delete',
];
const AUTH_MUTATION_PATTERNS = ['auth.signOut', 'auth.updateUser', 'auth.signUp'];
const STORAGE_PATTERNS = ['localStorage.', 'sessionStorage.'];
const CONSOLE_PATTERNS = ['console.log', 'console.error'];
const ENV_PATTERNS = ['process.env.', 'import.meta.env.'];
const KIS_PATTERNS = ['koreainvestment.com', 'KIS_'];
const QUOTE_API_PATTERNS = ['/api/market/quote', 'quote?', 'stock-quote', 'price?symbol='];
const NEWS_API_PATTERNS = ['news.naver.com', '/api/news', 'newsapi.org'];

const REMOVED_SERVICE_ROWS = ['기본 시작 페이지', '기본 시장', '화면 테마', '시세 카드 표시 설정'];
const REMOVED_ACCOUNT_ROWS = ['계정 상태'];
const REMOVED_DATA_ROWS = ['최근 활동', '데이터 관리'];

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== My Page Shell Static Contract Check (Phase 3AX) ===');
log('');

// --- File existence ---
log('File existence:');
const mypageExists = existsSync(MYPAGE_PATH);
check('mypage.astro exists', mypageExists);
log('');

if (!mypageExists) {
  log('ERROR: mypage.astro missing. Cannot continue.');
  process.exit(1);
}

const content = readFileSync(MYPAGE_PATH, 'utf8');

// --- Required headings ---
log('Required headings and labels:');
check('Page contains 마이페이지', content.includes('마이페이지'));
check('Page contains 내 계정', content.includes('내 계정'));
check('Page contains 이메일', content.includes('이메일'));
log('');

// --- Account summary ---
log('Account summary:');
check('Page contains Google 로그인', content.includes('Google 로그인'));
check('계정 상태 row removed', !REMOVED_ACCOUNT_ROWS.some((r) => content.includes(r)));
check('Page contains 마지막 접속 일시', content.includes('마지막 접속 일시'));
check('Page contains 구독 상태', content.includes('구독 상태'));
check('Page contains 구독 안함', content.includes('구독 안함'));
log('');

// --- Service section revisions ---
log('Service section revisions:');
const removedServiceFound = REMOVED_SERVICE_ROWS.filter((r) => content.includes(r));
check(
  `Removed service rows absent (checked: ${REMOVED_SERVICE_ROWS.length})`,
  removedServiceFound.length === 0,
);
check('Page contains 공지사항', content.includes('공지사항'));
check('Page contains 이벤트/혜택', content.includes('이벤트/혜택'));
log('');

// --- Data section ---
log('Data section:');
check('Page contains 내 데이터', content.includes('내 데이터'));
const removedDataFound = REMOVED_DATA_ROWS.filter((r) => content.includes(r));
check(
  `Removed data rows absent (checked: ${REMOVED_DATA_ROWS.length})`,
  removedDataFound.length === 0,
);
log('');

// --- Notification section base ---
log('Notification section:');
check('Page contains 알림 설정', content.includes('알림 설정'));
check('Page contains 내 텔레그램 연동', content.includes('내 텔레그램 연동'));
check('Page contains 내 포트 종목 뉴스 알림', content.includes('내 포트 종목 뉴스 알림'));
check('Page contains 이벤트/혜택 알림', content.includes('이벤트/혜택 알림'));
check('Page contains 공지사항 알림', content.includes('공지사항 알림'));
log('');

// --- Watchlist news alert search/save shell (Phase 3AX) ---
log('Watchlist news alert search/save shell:');
check('Page contains 관심종목 뉴스 알림', content.includes('관심종목 뉴스 알림'));
check('Page contains 관심종목 검색 (search label)', content.includes('관심종목 검색'));
check('Page contains 종목명 또는 종목코드 (input helper)', content.includes('종목명 또는 종목코드'));
check('Page contains 관심종목 저장 (save action)', content.includes('관심종목 저장'));
check('Page contains 저장된 관심종목 (saved list heading)', content.includes('저장된 관심종목'));
check('Page contains 최대 5 (max count)', content.includes('최대 5'));
log('');

// --- Price alert on/off toggle (Phase 3AX) ---
log('Target-price alert on/off toggle:');
check('Page contains 관심종목 지정가 알림', content.includes('관심종목 지정가 알림'));
check('Page contains 알림 사용 (on/off toggle label)', content.includes('알림 사용'));
check('Target-price alert UI-only notice present', content.includes('저장 기능은 준비 중입니다.'));
log('');

// --- Legal and support ---
log('Legal and support links:');
check('Page contains 개인정보처리방침', content.includes('개인정보처리방침'));
check('Page contains 이용약관', content.includes('이용약관'));
check('Page contains 제휴문의', content.includes('제휴문의'));
check('Partnership URL is exact', content.includes(PARTNERSHIP_URL));
check('Partnership link uses rel="noopener noreferrer"', content.includes('rel="noopener noreferrer"'));
log('');

// --- Withdrawal UI ---
log('Withdrawal UI:');
check('Page contains 회원탈퇴', content.includes('회원탈퇴'));
check('Exact withdrawal confirmation message present', content.includes(REQUIRED_WITHDRAWAL_MSG));
check('Page contains 확인', content.includes('확인'));
check('Page contains 취소', content.includes('취소'));
check('Non-destructive withdrawal notice present', content.includes(REQUIRED_NOTICE_MSG));
log('');

// --- Safety: forbidden patterns ---
log('Safety — forbidden patterns:');
check('No fetch() call in mypage', !FORBIDDEN_FETCH_PATTERN.test(content));
check('No @supabase package import in mypage', !SUPABASE_IMPORT_PATTERN.test(content));

const deletionFound = DELETION_PATTERNS.filter((p) => content.includes(p));
check(
  `No destructive deletion patterns (checked: ${DELETION_PATTERNS.length})`,
  deletionFound.length === 0,
);

const authMutationFound = AUTH_MUTATION_PATTERNS.filter((p) => content.includes(p));
check(
  `No auth mutation patterns (checked: ${AUTH_MUTATION_PATTERNS.length})`,
  authMutationFound.length === 0,
);

const storageFound = STORAGE_PATTERNS.filter((p) => content.includes(p));
check(
  `No localStorage/sessionStorage in mypage (checked: ${STORAGE_PATTERNS.length})`,
  storageFound.length === 0,
);

const consoleFound = CONSOLE_PATTERNS.filter((p) => content.includes(p));
check(
  `No console.log/error in mypage (checked: ${CONSOLE_PATTERNS.length})`,
  consoleFound.length === 0,
);

const envFound = ENV_PATTERNS.filter((p) => content.includes(p));
check(
  `No env reads in mypage (checked: ${ENV_PATTERNS.length})`,
  envFound.length === 0,
);

const kisFound = KIS_PATTERNS.filter((p) => content.includes(p));
check(
  `No KIS references in mypage (checked: ${KIS_PATTERNS.length})`,
  kisFound.length === 0,
);

const quoteApiFound = QUOTE_API_PATTERNS.filter((p) => content.includes(p));
check(
  `No quote API endpoint in mypage (checked: ${QUOTE_API_PATTERNS.length})`,
  quoteApiFound.length === 0,
);

const newsApiFound = NEWS_API_PATTERNS.filter((p) => content.includes(p));
check(
  `No news API URL in mypage (checked: ${NEWS_API_PATTERNS.length})`,
  newsApiFound.length === 0,
);
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
