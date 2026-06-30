/**
 * Static contract check for Phase 3DE Chart AI UX Skeleton Enhancement.
 * Verifies page structure, fixture data, safety boundaries, and no-network policy.
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

const CHART_AI_PATH = join(root, 'src', 'pages', 'chart-ai.astro');
const FIXTURE_PATH = join(root, 'src', 'data', 'chartAiDemoAnalysis.json');
const SECURITY_LOGOS_PATH = join(root, 'src', 'data', 'securityLogos.json');
const STYLE_PATH = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON = join(root, 'package.json');
const RESULT_DOC = join(root, 'docs', 'planning', 'phase_3de_chart_ai_ux_skeleton_enhancement_result_v0.1.md');
const API_ROUTE_PATH = join(root, 'src', 'pages', 'api', 'chart-ai', 'analyze.ts');

const log = (msg) => process.stdout.write(msg + '\n');
let failures = 0;
let passes = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DE Chart AI UX Skeleton Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

check('chart-ai.astro exists', existsSync(CHART_AI_PATH));
check('chartAiDemoAnalysis.json exists', existsSync(FIXTURE_PATH));
check('securityLogos.json exists', existsSync(SECURITY_LOGOS_PATH));
check('Phase 3DE result doc exists', existsSync(RESULT_DOC));

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:chart-ai-ux-skeleton script',
  typeof pkg.scripts?.['check:chart-ai-ux-skeleton'] === 'string');

log('');

if (!existsSync(CHART_AI_PATH)) {
  log('ERROR: chart-ai.astro missing. Cannot continue.');
  process.exit(1);
}

const page = readFileSync(CHART_AI_PATH, 'utf8');

// ---------------------------------------------------------------------------
// Group 2: Improved page heading
// ---------------------------------------------------------------------------
log('--- Group 2: Page heading ---');

check('Page contains improved h1 heading "차트 분석 준비 화면"',
  page.includes('차트 분석 준비 화면'));
check('Page contains Chart AI eyebrow or title reference',
  page.includes('Chart AI'));
check('Page contains lead copy explaining skeleton-first approach',
  page.includes('예시 분석 데이터') || page.includes('연동 전') || page.includes('이후 단계'));

log('');

// ---------------------------------------------------------------------------
// Group 3: Symbol input
// ---------------------------------------------------------------------------
log('--- Group 3: Symbol input ---');

check('Page contains symbol input element (chartAiInput id)',
  page.includes('chartAiInput'));
check('Page contains ticker or symbol label text',
  page.includes('종목 티커') || page.includes('종목명') || page.includes('티커') ||
  page.includes('종목 코드 또는 이름'));
check('Page contains input placeholder with example symbols',
  page.includes('005930') || page.includes('AAPL'));
check('Symbol input has autocomplete=off (no persistent autocomplete)',
  page.includes('autocomplete="off"') || page.includes("autocomplete='off'"));

log('');

// ---------------------------------------------------------------------------
// Group 4: Domestic sample symbol selection
// ---------------------------------------------------------------------------
log('--- Group 4: Domestic sample symbol selection ---');

check('Page contains domestic search result class',
  page.includes('chart-ai-search-result'));
check('005930 domestic sample is present', page.includes("'005930'") && page.includes('삼성전자'));
check('035420 domestic sample is present', page.includes("'035420'") && page.includes('NAVER'));
check('Domestic search examples include 000660', page.includes('000660'));
check('Domestic search examples include 069500', page.includes('069500'));
check('Selection controls have accessible roles or labels',
  page.includes('role="listbox"') && page.includes('aria-label="종목 유형 필터"'));

log('');

// ---------------------------------------------------------------------------
// Group 5: Analysis trigger button
// ---------------------------------------------------------------------------
log('--- Group 5: Analysis trigger button ---');

check('Page contains chartAiRunBtn id', page.includes('chartAiRunBtn'));
check('Run button has descriptive text ("예시 분석 보기" or similar)',
  page.includes('예시 분석 보기') || page.includes('분석 실행') || page.includes('분석 보기'));
check('Run button is a type=button (not submit)',
  page.includes('type="button"') && page.includes('chartAiRunBtn'));

log('');

// ---------------------------------------------------------------------------
// Group 6: Chart snapshot placeholder
// ---------------------------------------------------------------------------
log('--- Group 6: Chart snapshot placeholder ---');

check('Page contains chart-ai-snapshot class', page.includes('chart-ai-snapshot'));
check('Page contains chart-skeleton class (bar visual)', page.includes('chart-skeleton'));
check('Page contains chartAiSnapshotTitle or snapshot heading',
  page.includes('chartAiSnapshotTitle') || page.includes('차트 스냅샷'));
check('Page contains "연동 전 화면" or snapshot placeholder notice',
  page.includes('연동 전 화면') || page.includes('차트 스냅샷은 이후 단계'));
check('Snapshot note references future connection (not live)',
  page.includes('이후 단계') || page.includes('연결됩니다') || page.includes('연동 전'));

log('');

// ---------------------------------------------------------------------------
// Group 7: Analysis result section
// ---------------------------------------------------------------------------
log('--- Group 7: Analysis result section ---');

check('Page contains chartAiResultSection id',
  page.includes('chartAiResultSection'));
check('Page contains chart-ai-result-section class',
  page.includes('chart-ai-result-section'));
check('Page contains 추세 요약 result card', page.includes('추세 요약'));
check('Page contains 모멘텀 result card', page.includes('모멘텀'));
check('Page contains 변동성 result card', page.includes('변동성'));
check('Page contains 지지 result label', page.includes('지지'));
check('Page contains 저항 result label', page.includes('저항'));
check('Page contains 리스크 체크 result card', page.includes('리스크 체크'));
check('Page contains chart-ai-result-grid class', page.includes('chart-ai-result-grid'));
check('Page contains chart-ai-result-card class', page.includes('chart-ai-result-card'));

log('');

// ---------------------------------------------------------------------------
// Group 8: Disclaimer / guardrail copy
// ---------------------------------------------------------------------------
log('--- Group 8: Disclaimer and guardrail ---');

check('Page contains chart-ai-disclaimer class', page.includes('chart-ai-disclaimer'));
check('Disclaimer says not real AI analysis',
  page.includes('실제 AI 분석이 아닙니다') || page.includes('실제 AI 분석 결과가 아닙니다') ||
  page.includes('AI 분석 결과가 아닙니다'));
check('Disclaimer says not for investment decisions',
  page.includes('투자 판단 참고용 화면이 아니며') || page.includes('투자 판단에 사용할 수 없습니다'));
check('Disclaimer disavows buy/sell recommendation',
  page.includes('매수 또는 매도를 권고하지 않습니다') || page.includes('매수나 매도를'));
check('Disclaimer states user responsibility for investment decisions',
  page.includes('이용자 본인의 책임') || page.includes('본인의 책임'));

log('');

// ---------------------------------------------------------------------------
// Group 9: Fixture data validation
// ---------------------------------------------------------------------------
log('--- Group 9: Fixture data (chartAiDemoAnalysis.json) ---');

let fixture = null;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
} catch (e) {
  check('Fixture data parses as valid JSON', false);
  log('ERROR: Fixture JSON parse failed. Skipping fixture checks.');
  fixture = null;
}

if (fixture !== null) {
  check('Fixture data parses as valid JSON', true);
  check('Fixture is an array', Array.isArray(fixture));

  const symbols = Array.isArray(fixture) ? fixture.map((e) => e?.symbol) : Object.keys(fixture);

  check('Fixture includes 005930 (삼성전자)', symbols.includes('005930'));
  check('Fixture includes 035420 (NAVER)', symbols.includes('035420'));
  check('Fixture includes AAPL (Apple)', symbols.includes('AAPL'));
  check('Fixture includes NVDA (NVIDIA)', symbols.includes('NVDA'));

  const entries = Array.isArray(fixture) ? fixture : Object.values(fixture);
  const REQUIRED_FIELDS = ['trend', 'momentum', 'volatility', 'support', 'resistance', 'risk'];
  const missingFields = entries.filter((e) =>
    !e || REQUIRED_FIELDS.some((f) => typeof e[f] !== 'string' || !e[f])
  );
  check(`All fixture entries have required fields (${REQUIRED_FIELDS.join(', ')})`,
    missingFields.length === 0);

  check('Fixture entries have disclaimer field',
    entries.every((e) => e && typeof e.disclaimer === 'string' && e.disclaimer));
  check('Fixture data labels itself as example (예시 in disclaimer or profile)',
    entries.every((e) => e && (
      (e.disclaimer && e.disclaimer.includes('예시')) ||
      (e.profile && e.profile.includes('예시'))
    )));
  check('Fixture data does not claim realtime data (no 실시간 in values)',
    entries.every((e) => !e || !JSON.stringify(e).includes('실시간')));
  check('Fixture data does not claim live KIS connection',
    entries.every((e) => !e || !JSON.stringify(e).includes('KIS 연결')));
}

log('');

// ---------------------------------------------------------------------------
// Group 10: securityLogos.json compatibility
// ---------------------------------------------------------------------------
log('--- Group 10: securityLogos.json compatibility ---');

let logos = null;
try {
  logos = JSON.parse(readFileSync(SECURITY_LOGOS_PATH, 'utf8'));
} catch {}

if (logos) {
  const logoKeys = Object.keys(logos);
  check('securityLogos.json contains 005930', logoKeys.includes('005930'));
  check('securityLogos.json contains 035420', logoKeys.includes('035420'));
  check('securityLogos.json contains AAPL', logoKeys.includes('AAPL'));
  check('securityLogos.json contains NVDA', logoKeys.includes('NVDA'));
  check('Page uses client-safe domestic symbol records for selection',
    page.includes('getClientSafeDomesticSymbolRecords') && page.includes('ClientSafeSymbolSearchRecord'));
} else {
  check('securityLogos.json readable', false);
}

log('');

// ---------------------------------------------------------------------------
// Group 11: Safety boundaries
// ---------------------------------------------------------------------------
log('--- Group 11: Safety boundaries ---');

check('No fetch() call in chart-ai.astro', !/\bfetch\s*\(/.test(page));
check('No XMLHttpRequest in chart-ai.astro', !page.includes('XMLHttpRequest'));
check('No Supabase import in chart-ai.astro', !/@supabase/.test(page));
check('No chartAiClient import (server route removed)',
  !page.includes('chartAiClient') && !page.includes('analyzeChartAi'));
check('No process.env read', !page.includes('process.env'));
check('No import.meta.env read', !page.includes('import.meta.env'));
check('No KIS endpoint or credential reference',
  !page.includes('koreainvestment') && !page.includes('KIS_APP_KEY') && !page.includes('KIS_APP_SECRET'));
check('No GNews endpoint reference',
  !page.includes('gnews.io') && !page.includes('GNEWS_API_KEY'));
check('No service_role reference', !page.includes('service_role'));
check('No /api/chart-ai/analyze server route call',
  !page.includes('/api/chart-ai/analyze'));
check('No setInterval added', !page.includes('setInterval'));
check('No cron/polling keyword', !page.includes('cron') && !page.includes('polling'));
check('No html-to-image import', !page.includes('html-to-image'));
check('No screenshot capture invocation (toBlob/toPng/toCanvas)',
  !page.includes('toBlob') && !page.includes('toPng') && !page.includes('toCanvas'));
check('No 실시간 (realtime) claim', !page.includes('실시간'));
check('No buy signal wording (매수 신호)', !page.includes('매수 신호'));
check('No sell signal wording (매도 신호)', !page.includes('매도 신호'));
check('No profit guarantee wording (확정 수익)', !page.includes('확정 수익'));
check('No stock recommendation wording (추천 종목)', !page.includes('추천 종목'));

log('');

// ---------------------------------------------------------------------------
// Group 12: CSS additions present
// ---------------------------------------------------------------------------
log('--- Group 12: CSS additions ---');

const css = existsSync(STYLE_PATH) ? readFileSync(STYLE_PATH, 'utf8') : '';
check('chart-ai-shell class in style.css', css.includes('.chart-ai-shell'));
check('chart-ai search result styling is present',
  page.includes('.chart-ai-search-result') || css.includes('.chart-ai-search-result'));
check('chart-ai-result-grid class in style.css', css.includes('.chart-ai-result-grid'));
check('chart-ai-disclaimer class in style.css', css.includes('.chart-ai-disclaimer'));
check('chart-ai-result-card class in style.css', css.includes('.chart-ai-result-card'));

log('');

// ---------------------------------------------------------------------------
// Group 13: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 13: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls', !fetchAttempted);
globalThis.fetch = origFetch;

log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DE Chart AI UX Skeleton — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Phase 3DE Chart AI UX Skeleton implemented');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
