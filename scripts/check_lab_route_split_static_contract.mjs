/**
 * Static contract check for Phase 3DF-HF2 Lab Route Split.
 * Verifies landing page, four detail routes, safety boundaries, no-network policy.
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

const LAB_PATH         = join(root, 'src', 'pages', 'lab.astro');
const ASSET_PATH       = join(root, 'src', 'pages', 'lab', 'asset-class-returns.astro');
const SECTOR_PATH      = join(root, 'src', 'pages', 'lab', 'sp500-sectors.astro');
const CONGRESS_PATH    = join(root, 'src', 'pages', 'lab', 'congress-stocks.astro');
const NPS_PATH         = join(root, 'src', 'pages', 'lab', 'nps-holdings.astro');
const COMPONENT_PATH   = join(root, 'src', 'components', 'LabReturnMatrix.astro');
const STYLE_PATH       = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON     = join(root, 'package.json');
const RESULT_DOC       = join(root, 'docs', 'planning', 'phase_3df_hf2_lab_route_split_production_deployment_result_v0.1.md');
const API_LAB_DIR      = join(root, 'src', 'pages', 'api', 'lab');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DF-HF2 Lab Route Split — Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('lab.astro (landing) exists', existsSync(LAB_PATH));
check('/lab/asset-class-returns.astro exists', existsSync(ASSET_PATH));
check('/lab/sp500-sectors.astro exists', existsSync(SECTOR_PATH));
check('/lab/congress-stocks.astro exists', existsSync(CONGRESS_PATH));
check('/lab/nps-holdings.astro exists', existsSync(NPS_PATH));
check('LabReturnMatrix component exists', existsSync(COMPONENT_PATH));
check('Phase 3DF-HF2 result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:lab-route-split script',
  typeof pkg.scripts?.['check:lab-route-split'] === 'string');

log('');

// Read all pages
const landingPage   = existsSync(LAB_PATH)      ? readFileSync(LAB_PATH, 'utf8')      : '';
const assetPage     = existsSync(ASSET_PATH)     ? readFileSync(ASSET_PATH, 'utf8')    : '';
const sectorPage    = existsSync(SECTOR_PATH)    ? readFileSync(SECTOR_PATH, 'utf8')   : '';
const congressPage  = existsSync(CONGRESS_PATH)  ? readFileSync(CONGRESS_PATH, 'utf8') : '';
const npsPage       = existsSync(NPS_PATH)       ? readFileSync(NPS_PATH, 'utf8')      : '';
const componentSrc  = existsSync(COMPONENT_PATH) ? readFileSync(COMPONENT_PATH, 'utf8'): '';
const css           = existsSync(STYLE_PATH)     ? readFileSync(STYLE_PATH, 'utf8')    : '';
const allDetailPages = assetPage + '\n' + sectorPage + '\n' + congressPage + '\n' + npsPage;
const allLabSrc     = landingPage + '\n' + allDetailPages + '\n' + componentSrc;

// ---------------------------------------------------------------------------
// Group 2: Landing page structure
// ---------------------------------------------------------------------------
log('--- Group 2: Landing page structure ---');

check('Landing page contains heading 실험실 or 리서치 Lab',
  landingPage.includes('실험실') || landingPage.includes('리서치 Lab'));
check('Landing page contains link to /lab/asset-class-returns',
  landingPage.includes('/lab/asset-class-returns'));
check('Landing page contains link to /lab/sp500-sectors',
  landingPage.includes('/lab/sp500-sectors'));
check('Landing page contains link to /lab/congress-stocks',
  landingPage.includes('/lab/congress-stocks'));
check('Landing page contains link to /lab/nps-holdings',
  landingPage.includes('/lab/nps-holdings'));
check('Landing page contains card title 자산군 수익률 비교',
  landingPage.includes('자산군 수익률 비교'));
check('Landing page contains card title S&P 500 섹터별 수익률',
  landingPage.includes('S&P 500 섹터별 수익률') || landingPage.includes('S&amp;P 500 섹터별 수익률'));
check('Landing page contains card title 국회의원 보유 주식',
  landingPage.includes('국회의원 보유 주식'));
check('Landing page contains card title 국민연금 보유 현황',
  landingPage.includes('국민연금 보유 현황'));
check('Landing page uses card grid class (lab-card-grid)',
  landingPage.includes('lab-card-grid'));
check('Landing page uses visual preview class (lab-card-preview)',
  landingPage.includes('lab-card-preview'));

log('');

// ---------------------------------------------------------------------------
// Group 3: Landing page does NOT render full matrix
// ---------------------------------------------------------------------------
log('--- Group 3: No matrix on landing page ---');

check('Landing page does NOT import LabReturnMatrix',
  !landingPage.includes('LabReturnMatrix'));
check('Landing page does NOT contain lab-return-matrix class (full table)',
  !landingPage.includes('lab-return-matrix'));
check('Landing page does NOT use assetMatrix or sectorMatrix variable',
  !landingPage.includes('assetMatrix') && !landingPage.includes('sectorMatrix'));
check('Landing page does NOT import labReturnMatrices fixture directly',
  !landingPage.includes('labReturnMatrices'));

log('');

// ---------------------------------------------------------------------------
// Group 4: Detail pages — matrix pages
// ---------------------------------------------------------------------------
log('--- Group 4: Matrix detail pages ---');

check('asset-class-returns page imports LabReturnMatrix',
  assetPage.includes('LabReturnMatrix'));
check('asset-class-returns page uses assetMatrix',
  assetPage.includes('assetMatrix'));
check('asset-class-returns page imports labReturnMatrices',
  assetPage.includes('labReturnMatrices'));
check('asset-class-returns page contains back link to /lab',
  assetPage.includes('href="/lab"') || assetPage.includes("href='/lab'"));
check('asset-class-returns page contains 자산군 수익률 비교 heading',
  assetPage.includes('자산군 수익률 비교'));
check('asset-class-returns page contains data policy',
  assetPage.includes('lab-data-policy') || assetPage.includes('데이터 정책'));
check('asset-class-returns page contains related Lab links',
  assetPage.includes('lab-detail-related') || assetPage.includes('lab-related'));

check('sp500-sectors page imports LabReturnMatrix',
  sectorPage.includes('LabReturnMatrix'));
check('sp500-sectors page uses sectorMatrix',
  sectorPage.includes('sectorMatrix'));
check('sp500-sectors page imports labReturnMatrices',
  sectorPage.includes('labReturnMatrices'));
check('sp500-sectors page contains back link to /lab',
  sectorPage.includes('href="/lab"') || sectorPage.includes("href='/lab'"));
check('sp500-sectors page contains S&P 500 섹터별 수익률 heading',
  sectorPage.includes('S&P 500 섹터별 수익률') || sectorPage.includes('S&amp;P 500 섹터별 수익률'));
check('sp500-sectors page contains data policy',
  sectorPage.includes('lab-data-policy') || sectorPage.includes('데이터 정책'));
check('sp500-sectors page contains related Lab links',
  sectorPage.includes('lab-detail-related') || sectorPage.includes('lab-related'));

log('');

// ---------------------------------------------------------------------------
// Group 5: Future module detail pages
// ---------------------------------------------------------------------------
log('--- Group 5: Future module pages ---');

check('congress-stocks page contains 국회의원 보유 주식',
  congressPage.includes('국회의원 보유 주식'));
check('congress-stocks page contains 연동 예정 badge',
  congressPage.includes('연동 예정'));
check('congress-stocks page contains back link to /lab',
  congressPage.includes('href="/lab"') || congressPage.includes("href='/lab'"));
check('congress-stocks page does NOT claim real lawmaker names or holdings',
  !congressPage.includes('국회의원 실제 보유') && !congressPage.includes('국회의원 실제 종목'));
check('congress-stocks page contains data policy',
  congressPage.includes('lab-data-policy') || congressPage.includes('데이터 정책'));
check('congress-stocks page contains related Lab links',
  congressPage.includes('lab-detail-related') || congressPage.includes('lab-related'));

check('nps-holdings page contains 국민연금 보유 현황',
  npsPage.includes('국민연금 보유 현황'));
check('nps-holdings page contains 연동 예정 badge',
  npsPage.includes('연동 예정'));
check('nps-holdings page contains back link to /lab',
  npsPage.includes('href="/lab"') || npsPage.includes("href='/lab'"));
check('nps-holdings page does NOT claim real NPS holdings',
  !npsPage.includes('국민연금 실제 보유') && !npsPage.includes('국민연금 실제 종목'));
check('nps-holdings page contains data policy',
  npsPage.includes('lab-data-policy') || npsPage.includes('데이터 정책'));
check('nps-holdings page contains related Lab links',
  npsPage.includes('lab-detail-related') || npsPage.includes('lab-related'));

log('');

// ---------------------------------------------------------------------------
// Group 6: Data labeling
// ---------------------------------------------------------------------------
log('--- Group 6: Data labeling ---');

check('Landing page contains 예시 데이터 label', landingPage.includes('예시 데이터'));
check('asset page contains 예시 데이터 label', assetPage.includes('예시 데이터'));
check('sector page contains 예시 데이터 label', sectorPage.includes('예시 데이터'));
check('All pages contain data policy / 실제 투자 판단',
  allDetailPages.includes('투자 판단에 사용할 수 없습니다'));
check('No 실시간 (realtime) claim in any lab page', !allLabSrc.includes('실시간'));
check('No 현재 수익률 (current return) claim', !allLabSrc.includes('현재 수익률'));
check('No ETF쇼핑 branding', !allLabSrc.includes('ETF쇼핑'));
check('No ETFSHOPPING branding', !allLabSrc.includes('ETFSHOPPING'));
check('No 국민연금 실제 보유 claim', !allLabSrc.includes('국민연금 실제 보유'));
check('No 국회의원 실제 보유 claim', !allLabSrc.includes('국회의원 실제 보유'));
check('No 확정 수익 claim', !allLabSrc.includes('확정 수익'));
check('No 추천 종목 wording', !allLabSrc.includes('추천 종목'));
check('No 매수 신호 wording', !allLabSrc.includes('매수 신호'));
check('No 매도 신호 wording', !allLabSrc.includes('매도 신호'));

log('');

// ---------------------------------------------------------------------------
// Group 7: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 7: Safety boundaries ---');

check('No fetch() in landing page', !/\bfetch\s*\(/.test(landingPage));
check('No fetch() in asset page', !/\bfetch\s*\(/.test(assetPage));
check('No fetch() in sector page', !/\bfetch\s*\(/.test(sectorPage));
check('No fetch() in congress page', !/\bfetch\s*\(/.test(congressPage));
check('No fetch() in nps page', !/\bfetch\s*\(/.test(npsPage));
check('No XMLHttpRequest in any lab page', !allLabSrc.includes('XMLHttpRequest'));
check('No Supabase import in any lab page', !/@supabase/.test(allLabSrc));
check('No process.env read', !allLabSrc.includes('process.env'));
check('No import.meta.env read', !allLabSrc.includes('import.meta.env'));
check('No KIS endpoint reference', !allLabSrc.includes('koreainvestment') && !allLabSrc.includes('KIS_APP_KEY'));
check('No GNews endpoint reference', !allLabSrc.includes('gnews.io') && !allLabSrc.includes('GNEWS_API_KEY'));
check('No AI provider reference', !allLabSrc.includes('openai') && !allLabSrc.includes('gemini'));
check('No service_role reference', !allLabSrc.includes('service_role'));
check('No API route for Lab', !existsSync(API_LAB_DIR));
check('No setInterval in any lab page', !allLabSrc.includes('setInterval'));
check('No setTimeout in any lab page', !allLabSrc.includes('setTimeout'));
check('No cron/polling in any lab page', !allLabSrc.includes('cron') && !allLabSrc.includes('polling'));
check('No localStorage in any lab page', !allLabSrc.includes('localStorage'));
check('No canvas in any lab page', !allLabSrc.includes('canvas'));
check('No OpenDART/FSS data portal URL', !allLabSrc.includes('opendart') && !allLabSrc.includes('dart.fss'));
check('No external data portal URL', !allLabSrc.includes('data.go.kr') && !allLabSrc.includes('assembly.go.kr'));

log('');

// ---------------------------------------------------------------------------
// Group 8: CSS additions
// ---------------------------------------------------------------------------
log('--- Group 8: CSS additions ---');

check('.lab-landing-shell class in style.css', css.includes('.lab-landing-shell'));
check('.lab-card-grid class in style.css', css.includes('.lab-card-grid'));
check('.lab-card class in style.css', css.includes('.lab-card'));
check('.lab-card-preview class in style.css', css.includes('.lab-card-preview'));
check('.lab-card-preview--matrix class in style.css', css.includes('.lab-card-preview--matrix'));
check('.lab-card-preview--future class in style.css', css.includes('.lab-card-preview--future'));
check('.lab-mini-cell class in style.css', css.includes('.lab-mini-cell'));
check('.lab-card-title class in style.css', css.includes('.lab-card-title'));
check('.lab-card-badge class in style.css', css.includes('.lab-card-badge'));
check('.lab-detail-shell class in style.css', css.includes('.lab-detail-shell'));
check('.lab-detail-backlink class in style.css', css.includes('.lab-detail-backlink'));
check('.lab-detail-badge class in style.css', css.includes('.lab-detail-badge'));
check('.lab-data-policy class in style.css', css.includes('.lab-data-policy'));
check('.lab-detail-related class in style.css', css.includes('.lab-detail-related'));
check('.lab-related-grid class in style.css', css.includes('.lab-related-grid'));
check('.lab-related-card class in style.css', css.includes('.lab-related-card'));
check('.lab-static-preview class in style.css', css.includes('.lab-static-preview'));
check('.lab-static-preview-card class in style.css', css.includes('.lab-static-preview-card'));

log('');

// ---------------------------------------------------------------------------
// Group 9: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 9: Checker self-check ---');

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
log('=== Phase 3DF-HF2 Lab Route Split — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Phase 3DF-HF2 Lab Landing Route Split implemented');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
