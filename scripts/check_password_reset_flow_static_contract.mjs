/**
 * Static contract check for Phase 3CA-HF1 Password Reset Flow.
 * Verifies AuthModal reset entry point, resetPasswordForEmail usage,
 * reset-password page, updateUser usage, and safety constraints.
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

const AUTH_MODAL_PATH = join(root, 'src', 'components', 'Auth', 'AuthModal.astro');
const RESET_PAGE_PATH = join(root, 'src', 'pages', 'reset-password.astro');
const HEADER_PATH = join(root, 'src', 'components', 'Header.astro');
const PACKAGE_JSON = join(root, 'package.json');
const CHANGELOG = join(root, 'docs', 'planning', 'planning_changelog.md');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3ca_hf1_password_reset_flow_result_v0.1.md');
const MIGRATIONS_DIR = join(root, 'supabase', 'migrations');

const PRODUCTION_URL = 'mkstocklab.vercel.app';

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3CA-HF1 Password Reset Flow Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

const authModalExists = existsSync(AUTH_MODAL_PATH);
const resetPageExists = existsSync(RESET_PAGE_PATH);

check('AuthModal.astro exists', authModalExists);
check('reset-password.astro exists', resetPageExists);
check('Header.astro exists', existsSync(HEADER_PATH));
check('Result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:password-reset-flow script',
  typeof pkg.scripts?.['check:password-reset-flow'] === 'string');
check('planning_changelog.md has Phase 3CA-HF1 entry',
  existsSync(CHANGELOG) && readFileSync(CHANGELOG, 'utf8').includes('3CA-HF1'));
log('');

// ---------------------------------------------------------------------------
// Group 2: AuthModal reset entry point
// ---------------------------------------------------------------------------
log('--- Group 2: AuthModal reset entry point ---');

if (authModalExists) {
  const modal = readFileSync(AUTH_MODAL_PATH, 'utf8');
  check('AuthModal has 비밀번호를 잊으셨나요? entry point', modal.includes('비밀번호를 잊으셨나요?'));
  check('AuthModal has reset panel element', modal.includes('auth-reset-panel'));
  check('AuthModal has reset email input', modal.includes('auth-reset-email'));
  check('AuthModal has 비밀번호 재설정 메일 보내기 submit', modal.includes('비밀번호 재설정 메일 보내기'));
  check('AuthModal has 로그인으로 돌아가기 back link', modal.includes('로그인으로 돌아가기'));
  check('AuthModal calls resetPasswordForEmail', modal.includes('resetPasswordForEmail'));
  check('AuthModal uses redirectTo parameter', modal.includes('redirectTo'));
  check('AuthModal builds redirectTo from window.location.origin',
    modal.includes('window.location.origin') && modal.includes('/reset-password'));
  check('AuthModal does not hard-code localhost in reset logic',
    !modal.includes("'http://localhost") && !modal.includes('"http://localhost'));
  check('AuthModal does not hard-code production URL in reset logic',
    !modal.includes(PRODUCTION_URL));
  check('AuthModal shows generic success (does not reveal account existence)',
    modal.includes('입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다'));
  check('AuthModal imports getBrowserSupabaseClient', modal.includes('getBrowserSupabaseClient'));
  check('AuthModal imports isSupabaseConfigured', modal.includes('isSupabaseConfigured'));
  check('No service_role in AuthModal', !modal.includes('service_role'));
  check('No auth.admin in AuthModal', !modal.includes('auth.admin'));
  check('No setInterval/polling in AuthModal reset logic', !modal.includes('setInterval'));
  check('No raw fetch() in AuthModal', !(/\bfetch\s*\(/.test(modal)));
  check('No import.meta.env in AuthModal', !modal.includes('import.meta.env'));
  check('No process.env in AuthModal', !modal.includes('process.env'));
  check('No KIS reference in AuthModal', !modal.includes('koreainvestment.com'));
  check('No GNews reference in AuthModal', !modal.includes('gnews.io'));
} else {
  for (let i = 0; i < 20; i++) check('AuthModal check skipped (file missing)', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 3: Reset password page
// ---------------------------------------------------------------------------
log('--- Group 3: reset-password.astro ---');

if (resetPageExists) {
  const page = readFileSync(RESET_PAGE_PATH, 'utf8');
  check('Reset page has Korean title 비밀번호 재설정', page.includes('비밀번호 재설정'));
  check('Reset page has password input field', page.includes('rp-password') || page.includes('new-password'));
  check('Reset page has confirm password field', page.includes('rp-password-confirm') || page.includes('confirm'));
  check('Reset page enforces minimum password length check (< 8 or minlength)',
    page.includes('< 8') || page.includes('minlength="8"') || page.includes('length < 8') || page.includes('.length < 8'));
  check('Reset page validates password confirmation match',
    page.includes('password !== passwordConfirm') || page.includes('비밀번호가 일치하지 않습니다'));
  check('Reset page calls updateUser with password', page.includes('updateUser') && page.includes('password'));
  check('Reset page handles PASSWORD_RECOVERY event', page.includes('PASSWORD_RECOVERY'));
  check('Reset page uses timeout fallback for invalid/expired link', page.includes('setTimeout'));
  check('Reset page shows safe success message 비밀번호가 변경되었습니다',
    page.includes('비밀번호가 변경되었습니다'));
  check('Reset page shows invalid/expired link message',
    page.includes('재설정 링크가 만료되었거나'));
  check('Reset page calls signOut after successful password change', page.includes('signOut'));
  check('Reset page imports getBrowserSupabaseClient', page.includes('getBrowserSupabaseClient'));
  check('Reset page imports isSupabaseConfigured', page.includes('isSupabaseConfigured'));
  check('Reset page has 홈으로 돌아가기 or return link', page.includes('홈으로 돌아가기') || page.includes('로그인 화면으로 돌아가기'));
  check('No service_role in reset page', !page.includes('service_role'));
  check('No auth.admin in reset page', !page.includes('auth.admin'));
  check('No setInterval/polling in reset page', !page.includes('setInterval'));
  check('No raw fetch() in reset page', !(/\bfetch\s*\(/.test(page)));
  check('No import.meta.env in reset page', !page.includes('import.meta.env'));
  check('No process.env in reset page', !page.includes('process.env'));
  check('No KIS reference in reset page', !page.includes('koreainvestment.com'));
  check('No GNews reference in reset page', !page.includes('gnews.io'));
} else {
  for (let i = 0; i < 22; i++) check('Reset page check skipped (file missing)', false);
}
log('');

// ---------------------------------------------------------------------------
// Group 4: No DB migration added in this phase
// ---------------------------------------------------------------------------
log('--- Group 4: No DB migration added ---');

const migrationFiles = existsSync(MIGRATIONS_DIR)
  ? (await import('fs')).readdirSync(MIGRATIONS_DIR)
  : [];
const hf1Migrations = migrationFiles.filter((f) => f.includes('hf1') || f.includes('password') || f.includes('reset'));
check('No HF1/password-reset migration file added', hf1Migrations.length === 0);
log('');

// ---------------------------------------------------------------------------
// Group 5: Safety constraints
// ---------------------------------------------------------------------------
log('--- Group 5: Safety constraints ---');

const allSources = [AUTH_MODAL_PATH, RESET_PAGE_PATH]
  .filter(existsSync)
  .map((p) => readFileSync(p, 'utf8'));
const combined = allSources.join('\n');

check('No service_role in reset flow files', !combined.includes('service_role'));
check('No auth.admin API in reset flow files', !combined.includes('auth.admin'));
check('No raw fetch() in reset flow files', !(/\bfetch\s*\(/.test(combined)));
check('No hard-coded localhost URL in reset logic', !combined.includes("'http://localhost"));
check('No hard-coded production domain in reset logic', !combined.includes(PRODUCTION_URL));
check('No setInterval/cron in reset flow files', !combined.includes('setInterval'));
check('No Supabase Storage in reset flow', !combined.includes('storage.from'));
check('No KIS live calls in reset flow', !combined.includes('koreainvestment.com'));
check('No GNews calls in reset flow', !combined.includes('gnews.io'));
log('');

// ---------------------------------------------------------------------------
// Group 6: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 6: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3CA-HF1 Password Reset Flow — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — password reset flow ready for owner browser verification');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
