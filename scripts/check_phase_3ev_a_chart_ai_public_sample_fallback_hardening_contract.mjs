/**
 * Phase 3EV-A documentation/tooling contract.
 * Chart AI public sample/fallback hardening and owner-local KIS connected mode labeling.
 * Static only: no network, browser, dev server, API, provider, live KIS, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EV-A chart ai public sample fallback hardening checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = '534fc97';
const paths = {
  result: 'docs/planning/phase_3ev_a_chart_ai_public_sample_fallback_hardening_result_v0.1.md',
  checker: 'scripts/check_phase_3ev_a_chart_ai_public_sample_fallback_hardening_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
  page: 'src/pages/chart-ai.astro',
  ownerLocalQuote: 'src/pages/api/chart-ai/owner-local-quote-preview.ts',
  ownerLocalOhlc: 'src/pages/api/chart-ai/owner-local-ohlc-preview.ts',
  gate: 'src/lib/server/providers/kis/kisOwnerLocalGate.ts',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3EV-A - 2026-07-02')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = new Set(git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean));
const addedFiles = git('diff', '--name-only', '--diff-filter=A', startingCommit).split(/\r?\n/).filter(Boolean);
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const addedImages = addedFiles.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) === JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) === JSON.stringify(baselinePackage.devDependencies ?? {});

const RAW_FIELDS = /stck_bsop_date|stck_oprc|stck_hgpr|stck_lwpr|stck_clpr|acml_vol|rt_cd|msg_cd|output2/i;
const SECRET_VALUE = (text) =>
  /Bearer\s+[A-Za-z0-9._-]{8,}/.test(text) ||
  /KIS_APP_KEY['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_APP_SECRET['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text) ||
  /KIS_ACCESS_TOKEN['"]?\s*[:=]\s*['"]?[A-Za-z0-9]{8,}/.test(text);

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EV-A Chart AI Public Sample/Fallback Hardening Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Result document exists', existsSync(join(root, paths.result)));                                          // 1
check('Checker exists', existsSync(join(root, paths.checker)));                                                  // 2
check('Package script exists',                                                                                   // 3
  packageJson.scripts?.['check:phase-3ev-a-chart-ai-public-sample-fallback-hardening'] ===
    'node scripts/check_phase_3ev_a_chart_ai_public_sample_fallback_hardening_contract.mjs');
check('Changelog contains Phase 3EV-A section', phaseSection.length > 0);                                        // 4
check('Result status is implemented',
  source.result.includes('Implemented — public sample/fallback hardening'));                                    // 5
check('Result records owner request for faster implementation',
  source.result.includes('owner requested faster implementation'));                                             // 6
check('Result records KIS as a real connected implementation, not only test/smoke',
  source.result.includes('not only as a test/smoke path'));                                                     // 7
process.stdout.write('\n');

process.stdout.write('Public/default sample hardening:\n');
check('Page contains public sample-mode helper copy',
  source.page.includes('기능 체험용 샘플 데이터'));                                                              // 8
check('Page contains non-investment disclaimer copy',
  source.page.includes('실제 투자 판단용 정보가 아닙니다'));                                                      // 9
check('Bottom disclaimer retains buy/sell recommendation disavowal',
  source.page.includes('매수·매도 추천이 아닙니다'));                                                            // 10
check('Company overview fallback contains structural-placeholder note',
  source.page.includes('정식 기업 데이터 연동 전까지는 참고용 구조 예시로 제공됩니다.'));                          // 11
check('MK AI readiness copy updated',
  source.page.includes('MK AI 분석 준비 중'));                                                                   // 12
process.stdout.write('\n');

process.stdout.write('Owner-local KIS connected mode labeling:\n');
check('Page contains owner-local KIS connected mode label',
  source.page.includes('오너 로컬 KIS 연결 모드'));                                                              // 13
check('Page contains public/default eyebrow label',
  source.page.includes('오너 로컬 전용'));                                                                       // 14
check('Panel heading updated to KIS 연결 프리뷰',
  source.page.includes('KIS 연결 프리뷰'));                                                                      // 15
check('Old panel heading KIS 로컬 프리뷰 no longer present',
  !source.page.includes('KIS 로컬 프리뷰'));                                                                     // 16
check('Page retains approved applied-state tag 지연 시세 · KIS OHLC · KRW',
  source.page.includes('지연 시세 · KIS OHLC · KRW'));                                                           // 17
check('Page wires eyebrow/guide toggle elements',
  source.page.includes('chartAiQuotePreviewEyebrow') && source.page.includes('chartAiQuotePreviewGuide'));      // 18
process.stdout.write('\n');

process.stdout.write('Preview buttons preserved and gated:\n');
check('Page retains disabled KIS quote preview button',
  /id="chartAiQuotePreviewBtn"[^>]*disabled/.test(source.page) || /disabled[^>]*id="chartAiQuotePreviewBtn"/.test(source.page));  // 19
check('Page retains disabled KIS OHLC preview button',
  /id="chartAiOhlcPreviewBtn"[^>]*disabled/.test(source.page) || /disabled[^>]*id="chartAiOhlcPreviewBtn"/.test(source.page));    // 20
check('Owner-local fetch calls remain gated behind source=owner-local checks',
  source.page.includes('ownerLocalPreview') && source.page.includes('ownerLocalOhlcPreview'));                  // 21
process.stdout.write('\n');

process.stdout.write('Fallback copy safety:\n');
check('Blocked fallback copy present',
  source.page.includes('오너 로컬 환경에서만 KIS 연결 프리뷰를 사용할 수 있습니다.'));                             // 22
check('Unavailable/error fallback copy present',
  source.page.includes('현재 KIS 데이터를 불러오지 못했습니다. 샘플 데이터로 계속 표시합니다.'));                    // 23
check('Malformed/insufficient OHLC fallback copy present',
  source.page.includes('KIS 응답을 차트에 표시할 수 없어 샘플 차트를 유지합니다.'));                                // 24
check('Page no longer echoes raw providerStatus detail line',
  !source.page.includes('provider: ${providerStatus}'));                                                        // 25
check('Page contains no raw KIS response fields', !RAW_FIELDS.test(source.page));                                // 26
check('Page contains no secret-looking values', !SECRET_VALUE(source.page));                                    // 27
check('Page does not reference KIS_ACCOUNT_NO', !source.page.includes('KIS_ACCOUNT_NO'));                        // 28
check('Page does not reference account/trading/order/balance APIs',
  !/\/api\/(account|trading|order|balance)\b/i.test(source.page));                                               // 29
process.stdout.write('\n');

process.stdout.write('No public exposure / no source=live or source=auto:\n');
check('Page does not introduce source: \'live\'', !/source:\s*['"]live['"]/i.test(source.page));                 // 30
check('Page does not introduce source: \'auto\'', !/source:\s*['"]auto['"]/i.test(source.page));                 // 31
check('Owner-local fetch calls target only owner-local endpoints',
  source.page.includes('/api/chart-ai/owner-local-quote-preview') &&
  source.page.includes('/api/chart-ai/owner-local-ohlc-preview') &&
  !source.page.includes('source=live') && !source.page.includes('source=auto'));                                // 32
process.stdout.write('\n');

process.stdout.write('Owner-local route gates unchanged:\n');
check('Owner-local quote route still requires source=owner-local and preview=quote',
  source.ownerLocalQuote.includes("!== 'owner-local'") && source.ownerLocalQuote.includes("!== 'quote'"));       // 33
check('Owner-local quote route still requires localhost',
  source.ownerLocalQuote.includes('LOCAL_HOSTS'));                                                               // 34
check('Owner-local quote route still requires the three owner-local env flags',
  source.ownerLocalQuote.includes('KIS_OWNER_LOCAL_SMOKE') &&
  source.ownerLocalQuote.includes('KIS_ALLOW_LIVE_QUOTE') &&
  source.ownerLocalQuote.includes('KIS_ENABLE_LIVE_QUOTES'));                                                    // 35
check('Owner-local OHLC route still requires source=owner-local and preview=ohlc',
  source.ownerLocalOhlc.includes("!== 'owner-local'") && source.ownerLocalOhlc.includes("!== 'ohlc'"));          // 36
check('Owner-local OHLC route still requires localhost',
  source.ownerLocalOhlc.includes('LOCAL_HOSTS'));                                                                // 37
check('Owner-local OHLC route still requires the three owner-local env flags',
  source.ownerLocalOhlc.includes('KIS_OWNER_LOCAL_SMOKE') &&
  source.ownerLocalOhlc.includes('KIS_ALLOW_LIVE_QUOTE') &&
  source.ownerLocalOhlc.includes('KIS_ENABLE_LIVE_QUOTES'));                                                     // 38
check('Both owner-local routes still set Cache-Control no-store',
  source.ownerLocalQuote.includes('no-store') && source.ownerLocalOhlc.includes('no-store'));                   // 39
check('Owner-local provider gate still requires mode/allowNetwork/allowKisLive',
  source.gate.includes("mode === 'owner-local'") &&
  source.gate.includes('allowNetwork === true') &&
  source.gate.includes('allowKisLive === true'));                                                                // 40
process.stdout.write('\n');

process.stdout.write('Change boundaries and changelog:\n');
check('No dependency, image, Supabase/SQL/migration files added',
  dependenciesUnchanged && devDependenciesUnchanged && !phaseChanges.has('package-lock.json') &&
  addedImages.length === 0 &&
  ![...phaseChanges].some((p) => /supabase/i.test(p) || /migration|\.sql$/i.test(p)));                           // 41
check('Changelog records no deployment/no push, and checker blocks network access',
  /no deployment/i.test(phaseSection) && /no push/i.test(phaseSection) &&
  source.checker.includes('Network access is blocked in the Phase 3EV-A chart ai public sample fallback hardening checker.') &&
  !fetchAttempted);                                                                                              // 42
process.stdout.write('\n');

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EV-A checks passed.\n');
}
