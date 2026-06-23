/**
 * Static structural validation for the My Page MVP shell.
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

const log = (msg) => process.stdout.write(msg + '\n');

let failures = 0;

const check = (label, pass) => {
  const status = pass ? 'PASS' : 'FAIL';
  log(`  [${status}] ${label}`);
  if (!pass) failures++;
};

log('=== My Page Shell Static Contract Check ===');
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

// --- Required headings and labels ---
log('Required section headings:');
check('Page contains 마이페이지', content.includes('마이페이지'));
check('Page contains 내 계정', content.includes('내 계정'));
check('Page contains 서비스 이용 설정', content.includes('서비스 이용 설정'));
check('Page contains 내 데이터', content.includes('내 데이터'));
check('Page contains 회원탈퇴', content.includes('회원탈퇴'));
log('');

// --- Legal and support links ---
log('Legal and support links:');
check('Page contains 개인정보처리방침', content.includes('개인정보처리방침'));
check('Page contains 이용약관', content.includes('이용약관'));
check('Page contains 제휴문의', content.includes('제휴문의'));
check('Partnership URL is exact', content.includes(PARTNERSHIP_URL));
check('Partnership link uses rel="noopener noreferrer"', content.includes('rel="noopener noreferrer"'));
log('');

// --- Withdrawal UI ---
log('Withdrawal UI:');
check('Exact withdrawal confirmation message present', content.includes(REQUIRED_WITHDRAWAL_MSG));
check('Page contains 확인', content.includes('확인'));
check('Page contains 취소', content.includes('취소'));
check('Non-destructive prepared message present', content.includes(REQUIRED_NOTICE_MSG));
log('');

// --- Safety: forbidden patterns ---
log('Safety — forbidden patterns:');
check('No fetch() call in mypage', !FORBIDDEN_FETCH_PATTERN.test(content));
check('No Supabase import in mypage', !SUPABASE_IMPORT_PATTERN.test(content));

const deletionFound = DELETION_PATTERNS.filter((p) => content.includes(p));
check(
  `No deletion patterns in mypage (checked: ${DELETION_PATTERNS.length})`,
  deletionFound.length === 0,
);

const authMutationFound = AUTH_MUTATION_PATTERNS.filter((p) => content.includes(p));
check(
  `No auth mutation patterns in mypage (checked: ${AUTH_MUTATION_PATTERNS.length})`,
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
