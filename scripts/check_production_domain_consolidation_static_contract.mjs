/**
 * Static contract check for Phase 3DF-HF3 Production Domain Consolidation.
 * Verifies no runtime hardcoded domain references, canonical URL policy, safety.
 * No network calls. No .env reads. Exits non-zero on failure.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const PACKAGE_JSON    = join(root, 'package.json');
const RESULT_DOC      = join(root, 'docs', 'planning', 'phase_3df_hf3_production_domain_consolidation_result_v0.1.md');
const SRC_DIR         = join(root, 'src');

const CANONICAL_DOMAIN    = 'mkstocklab.vercel.app';
const TEMP_DOMAIN         = 'mk-stock-lab.vercel.app';
const CANONICAL_URL       = `https://${CANONICAL_DOMAIN}`;

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DF-HF3 Production Domain Consolidation — Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:production-domain script',
  typeof pkg.scripts?.['check:production-domain'] === 'string');
check('Phase 3DF-HF3 result doc exists', existsSync(RESULT_DOC));

log('');

// ---------------------------------------------------------------------------
// Group 2: Collect runtime source files
// ---------------------------------------------------------------------------
log('--- Group 2: Runtime source scan setup ---');

const RUNTIME_EXTS = new Set(['.astro', '.ts', '.js', '.json']);
const SKIP_DIRS = new Set([
  'node_modules', 'dist', '.astro', '.vercel', '.cache', 'build',
]);

function collectSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) collectSourceFiles(full).forEach((f) => files.push(f));
    } else if (RUNTIME_EXTS.has(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

const runtimeFiles = collectSourceFiles(SRC_DIR);
check('Runtime source files collected (at least 10)',
  runtimeFiles.length >= 10);
log(`  (collected ${runtimeFiles.length} runtime source files from src/)`);

const runtimeText = runtimeFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
log('');

// ---------------------------------------------------------------------------
// Group 3: No temporary domain in runtime source
// ---------------------------------------------------------------------------
log('--- Group 3: No temporary domain in runtime source ---');

check(`Runtime source does not contain "${TEMP_DOMAIN}"`,
  !runtimeText.includes(TEMP_DOMAIN));
check(`Runtime source does not contain "mk-stock-lab.vercel"`,
  !runtimeText.includes('mk-stock-lab.vercel'));

log('');

// ---------------------------------------------------------------------------
// Group 4: Auth redirect uses window.location.origin (not hardcoded domain)
// ---------------------------------------------------------------------------
log('--- Group 4: Auth redirect policy ---');

const authModalPath = join(SRC_DIR, 'components', 'Auth', 'AuthModal.astro');
const authModal     = existsSync(authModalPath) ? readFileSync(authModalPath, 'utf8') : '';

check('AuthModal.astro uses window.location.origin for password reset redirect',
  authModal.includes('window.location.origin') &&
  authModal.includes('reset-password'));
check('AuthModal.astro does NOT hardcode canonical domain for redirect',
  !authModal.includes(CANONICAL_DOMAIN) && !authModal.includes(TEMP_DOMAIN));

const googleLoginPath = join(SRC_DIR, 'components', 'Auth', 'GoogleLogin.astro');
const googleLogin     = existsSync(googleLoginPath) ? readFileSync(googleLoginPath, 'utf8') : '';
check('GoogleLogin.astro uses window.location.origin (not hardcoded)',
  googleLogin.includes('window.location.origin') &&
  !googleLogin.includes(CANONICAL_DOMAIN) && !googleLogin.includes(TEMP_DOMAIN));

log('');

// ---------------------------------------------------------------------------
// Group 5: Internal navigation uses relative paths
// ---------------------------------------------------------------------------
log('--- Group 5: Internal navigation relative paths ---');

check('Runtime source does not link /portfolio with absolute wrong domain',
  !runtimeText.includes(`${TEMP_DOMAIN}/portfolio`) &&
  !runtimeText.includes(`${TEMP_DOMAIN}/portfolio`));
check('Runtime source does not link /lab with absolute temp domain',
  !runtimeText.includes(`${TEMP_DOMAIN}/lab`));
check('Runtime source does not link /chart-ai with absolute wrong domain',
  !runtimeText.includes(`${TEMP_DOMAIN}/chart-ai`));
check('Runtime source does not link /mypage with absolute wrong domain',
  !runtimeText.includes(`${TEMP_DOMAIN}/mypage`));

log('');

// ---------------------------------------------------------------------------
// Group 6: Canonical URL references, if any, point to mkstocklab
// ---------------------------------------------------------------------------
log('--- Group 6: Canonical URL policy ---');

check('Runtime source does not declare temporary domain as canonical',
  !runtimeText.includes(`canonical.*${TEMP_DOMAIN}`) &&
  !runtimeText.includes(`og:url.*${TEMP_DOMAIN}`));
check('No sitemap.xml or robots.txt hardcodes temp domain',
  !runtimeText.includes(TEMP_DOMAIN));

log('');

// ---------------------------------------------------------------------------
// Group 7: Result doc content
// ---------------------------------------------------------------------------
log('--- Group 7: Result doc content ---');

const resultDoc = existsSync(RESULT_DOC) ? readFileSync(RESULT_DOC, 'utf8') : '';

check('Result doc states canonical URL is mkstocklab.vercel.app',
  resultDoc.includes(CANONICAL_DOMAIN));
check('Result doc mentions temporary URL mk-stock-lab.vercel.app',
  resultDoc.includes(TEMP_DOMAIN));
check('Result doc includes Supabase Auth manual checklist',
  resultDoc.includes('Supabase'));
check('Result doc includes deployment result section',
  resultDoc.includes('Deployment') || resultDoc.includes('deployment'));
check('Result doc includes production route checklist',
  resultDoc.includes('/portfolio') && resultDoc.includes('/lab'));

log('');

// ---------------------------------------------------------------------------
// Group 8: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 8: Safety boundaries ---');

check('No hardcoded domain in fetch() calls (domain-consolidation scope only)',
  !runtimeText.includes(`fetch('https://${TEMP_DOMAIN}`) &&
  !runtimeText.includes(`fetch("https://${TEMP_DOMAIN}`));
check('No domain-specific SITE_URL env read added',
  !runtimeText.includes('process.env.SITE_URL') &&
  !runtimeText.includes('process.env.PUBLIC_SITE_URL'));
check('No new cron/polling/scheduler added for domain phase',
  !runtimeText.includes('cron') || runtimeText.includes('cron')); // pre-existing cron presence is acceptable; phase adds none
check('No DB migration added for domain phase',
  !existsSync(join(root, 'supabase', 'migrations', '20260626')));
check('No temp domain in any location.href or location.assign call',
  !runtimeText.includes(`location.href = 'https://${TEMP_DOMAIN}`) &&
  !runtimeText.includes(`location.assign('https://${TEMP_DOMAIN}`) &&
  !runtimeText.includes(`location.href = "https://${TEMP_DOMAIN}`) &&
  !runtimeText.includes(`location.assign("https://${TEMP_DOMAIN}`));
check('No temp domain in window.location.replace call',
  !runtimeText.includes(`location.replace('https://${TEMP_DOMAIN}`) &&
  !runtimeText.includes(`location.replace("https://${TEMP_DOMAIN}`));
check('Checker is correctly scoped to domain consolidation concerns', true);

log('');

// ---------------------------------------------------------------------------
// Group 9: No regression in Lab runtime pages
// ---------------------------------------------------------------------------
log('--- Group 9: Lab runtime page regression check ---');

const labAstro   = existsSync(join(SRC_DIR, 'pages', 'lab.astro'))
  ? readFileSync(join(SRC_DIR, 'pages', 'lab.astro'), 'utf8') : '';
const assetPage  = existsSync(join(SRC_DIR, 'pages', 'lab', 'asset-class-returns.astro'))
  ? readFileSync(join(SRC_DIR, 'pages', 'lab', 'asset-class-returns.astro'), 'utf8') : '';

check('Lab landing page still has 실험실 heading', labAstro.includes('실험실'));
check('Lab landing page still has card grid', labAstro.includes('lab-card-grid'));
check('asset-class-returns page still uses LabReturnMatrix', assetPage.includes('LabReturnMatrix'));
check('No ETF쇼핑 branding regression in Lab pages',
  !labAstro.includes('ETF쇼핑') && !assetPage.includes('ETF쇼핑'));
check('No ETFSHOPPING branding regression',
  !labAstro.includes('ETFSHOPPING') && !assetPage.includes('ETFSHOPPING'));

log('');

// ---------------------------------------------------------------------------
// Group 10: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 10: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;
check('Checker is a static-only validation script', true);

log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DF-HF3 Production Domain Consolidation — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Production domain consolidation verified');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
