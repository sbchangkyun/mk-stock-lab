/**
 * Phase 3EX-A documentation contract.
 * Chart AI similarity MVP scope alignment and architecture update.
 * Static only: no network, browser, dev server, API, provider, live KIS, external AI, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EX-A chart ai similarity mvp scope alignment architecture checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'b3c2a57';
const paths = {
  architecture: 'docs/planning/phase_3ex_a_chart_ai_similarity_mvp_scope_alignment_architecture_v0.2.md',
  decisionLog: 'docs/planning/phase_3ex_a_chart_ai_similarity_owner_decision_log_v0.1.md',
  result: 'docs/planning/phase_3ex_a_chart_ai_similarity_mvp_scope_alignment_architecture_result_v0.1.md',
  checker: 'scripts/check_phase_3ex_a_chart_ai_similarity_mvp_scope_alignment_architecture_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
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
const phaseSection = source.changelog.split('## Phase 3EX-A - 2026-07-03')[1]?.split('\n## ')[0] ?? '';
const scanText = `${source.architecture}\n${source.decisionLog}\n${source.result}\n${phaseSection}`;

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
const MARKET_VALUE_PATTERN = /\b(open|high|low|close|lastPrice|현재가)\b[^\n]{0,20}\b\d{3,}\b/i;

const guardedApiFiles = ['src/pages/api/chart-ai/owner-local-quote-preview.ts', 'src/pages/api/chart-ai/owner-local-ohlc-preview.ts', 'src/lib/server/providers/kis/kisOwnerLocalGate.ts'];
const srcChanges = [...phaseChanges].filter((path) => path.startsWith('src/'));
const guardedFilesChanged = guardedApiFiles.filter((path) => phaseChanges.has(path));

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) { passed += 1; process.stdout.write(`  [PASS] ${label}\n`); }
  else { failed += 1; failures.push(label); process.stdout.write(`  [FAIL] ${label}\n`); }
};

process.stdout.write('=== Phase 3EX-A Chart AI Similarity MVP Scope Alignment and Architecture Contract ===\n\n');

process.stdout.write('Files, command, and changelog:\n');
check('Architecture v0.2 document exists', existsSync(join(root, paths.architecture)));                          // 1
check('Owner decision log exists', existsSync(join(root, paths.decisionLog)));                                    // 2
check('Result document exists', existsSync(join(root, paths.result)));                                            // 3
check('Checker exists', existsSync(join(root, paths.checker)));                                                   // 4
check('Package script exists',                                                                                    // 5
  packageJson.scripts?.['check:phase-3ex-a-chart-ai-similarity-mvp-scope-alignment-architecture'] ===
    'node scripts/check_phase_3ex_a_chart_ai_similarity_mvp_scope_alignment_architecture_contract.mjs');
check('Changelog contains Phase 3EX-A', phaseSection.length > 0);                                                 // 6
process.stdout.write('\n');

process.stdout.write('Architecture doc: current state and boundary:\n');
check('Architecture doc records current project state', source.architecture.includes('현재 프로젝트 상태'));       // 7
check('Architecture doc records current HEAD b3c2a57', source.architecture.includes('b3c2a57'));                 // 8
check('Architecture doc records production URL', source.architecture.includes('https://mkstocklab.vercel.app')); // 9
check('Architecture doc records /chart-ai public sample',
  /\/chart-ai[^\n]{0,40}(공개|샘플)/.test(source.architecture) || /샘플[^\n]{0,20}\/chart-ai/.test(source.architecture) ||
  source.architecture.includes('공개(public)/기본(default) 상태에서 샘플/모의'));                                  // 10
check('Architecture doc records owner-local KIS preview boundary',
  source.architecture.includes('owner-local-quote-preview.ts') && source.architecture.includes('kisOwnerLocalGate.ts')); // 11
check('Architecture doc records no external AI API', source.architecture.includes('외부 AI API는 존재하지 않습니다')); // 12
check('Architecture doc records no public KIS', source.architecture.includes('공개(public) KIS 시세/OHLC 노출은 존재하지 않습니다')); // 13
process.stdout.write('\n');

process.stdout.write('Architecture doc: five owner decisions:\n');
check('Architecture doc records all five owner decisions',
  source.architecture.includes('`/chart-ai` 화면은 공개 샘플로 유지하고, 실제 `유사 패턴 분석` 실행만 로그인/권한/usage guard를 적용한다.') &&
  source.architecture.includes('production에는 UI를 배포할 수 있으나, 실제 KIS 기반 유사도 분석은 feature flag off 상태로 둔다.') &&
  source.architecture.includes('다음 구현 순서는 KIS provider가 아니라 similarity engine부터 시작한다.') &&
  source.architecture.includes('DB/cache는 캐시 정책 문서화와 타입 설계를 먼저 진행하고, SQL 실행/migration은 별도 승인 phase로 분리한다.') &&
  source.architecture.includes('기존 MK AI 패널은 유지하되, 향후 `유사 패턴 분석` 결과를 보조 설명하는 역할로 재정의한다.'));  // 14
check('Architecture doc records feature flag off production policy',
  /feature flag off/.test(source.architecture));                                                                  // 15
check('Architecture doc records similarity engine first',
  /similarity engine부터 시작한다|Similarity Engine First/.test(source.architecture));                            // 16
check('Architecture doc records DB/cache policy/type only',
  source.architecture.includes('3EX-A는 캐시 정책과 타입만 문서화한다'));                                          // 17
check('Architecture doc records SQL separate approval',
  /SQL[^\n]{0,20}(실행\/migration은 별도|migration requires separate owner approval)/.test(source.architecture)); // 18
check('Architecture doc records MK AI panel retained but role changed',
  source.architecture.includes('기존 MK AI 패널은 유지하되') && source.architecture.includes('보조 설명'));         // 19
process.stdout.write('\n');

process.stdout.write('Architecture doc: MVP scope v0.2:\n');
check('Architecture doc records MVP name 유사 패턴 분석', source.architecture.includes('유사 패턴 분석'));          // 20
check('Architecture doc records same-symbol historical comparison', source.architecture.includes('동일 종목 과거 구간')); // 21
check('Architecture doc records 20/40/60 trading-day windows', source.architecture.includes('20/40/60'));         // 22
check('Architecture doc records recent 3-year lookback', source.architecture.includes('최근 3년'));                // 23
check('Architecture doc records Top 5', source.architecture.includes('Top 5'));                                   // 24
check('Architecture doc records 5-day/20-day outcomes',
  /5일\/20일|5-day.*20-day/.test(source.architecture));                                                            // 25
check('Architecture doc records normalized overlay chart',
  /정규화 오버레이|normalized price index/.test(source.architecture));                                             // 26
check('Architecture doc records deterministic summary first',
  /deterministic summary first|deterministic summary를 먼저/.test(source.architecture));                          // 27
process.stdout.write('\n');

process.stdout.write('Architecture doc: data type drafts:\n');
check('Architecture doc includes OhlcBar type draft', source.architecture.includes('interface OhlcBar'));         // 28
check('Architecture doc includes SimilarityRequest type draft', source.architecture.includes('interface SimilarityRequest')); // 29
check('Architecture doc includes SimilarityMatch type draft', source.architecture.includes('interface SimilarityMatch')); // 30
check('Architecture doc includes SimilaritySummaryStats type draft', source.architecture.includes('interface SimilaritySummaryStats')); // 31
check('Architecture doc includes SimilarityAnalysisResult type draft', source.architecture.includes('interface SimilarityAnalysisResult')); // 32
check('Architecture doc includes ChartSimilarityCachePolicy type draft', source.architecture.includes('interface ChartSimilarityCachePolicy')); // 33
process.stdout.write('\n');

process.stdout.write('Architecture doc: algorithm, feature flag, and security policy:\n');
check('Architecture doc records raw price is not used for similarity scoring',
  /raw price comparison is not used for similarity scoring|유사도 스코어링에 사용하지 않는다/.test(source.architecture)); // 34
check('Architecture doc records correlation + RMSE + direction match',
  source.architecture.includes('correlation') && source.architecture.includes('RMSE') && /direction match|방향 일치율/.test(source.architecture)); // 35
check('Architecture doc records no prediction guarantee',
  /no prediction guarantee|예측을 보장하지 않는다/.test(source.architecture));                                    // 36
check('Architecture doc records feature flag candidate names only',
  source.architecture.includes('CHART_AI_SIMILARITY_ENABLED') &&
  source.architecture.includes('values must never be recorded'));                                                 // 37
check('Architecture doc records no Vercel env changes in 3EX-A',
  source.architecture.includes('Vercel env changes are not made in 3EX-A'));                                      // 38
check('Architecture doc records security/compliance policy',
  source.architecture.includes('Security and Compliance Policy'));                                                // 39
check('Architecture doc records next phase 3EX-B', source.architecture.includes('Phase 3EX-B'));                  // 40
process.stdout.write('\n');

process.stdout.write('Owner decision log content:\n');
check('Decision log records five locked decisions',
  decisionLogHasFive());                                                                                          // 41
check('Decision log records non-authorized items', source.decisionLog.includes('Non-authorized items'));          // 42
process.stdout.write('\n');

process.stdout.write('Result document content:\n');
check('Result doc status is prepared',
  source.result.includes('Prepared — Chart AI similarity MVP scope and architecture direction aligned.'));        // 43
check('Result doc records no runtime code', source.result.includes('No runtime code was added or modified in this phase.')); // 44
check('Result doc records no KIS call', source.result.includes('No KIS call was made.'));                         // 45
check('Result doc records no external AI call', source.result.includes('No external AI call was made.'));        // 46
check('Result doc records no API route', source.result.includes('No API route was added.'));                     // 47
check('Result doc records no DB/SQL/migration', source.result.includes('No DB/SQL/migration was executed.'));    // 48
check('Result doc records no Vercel env changes', source.result.includes('No Vercel env change was made.'));     // 49
check('Result doc records no deployment', source.result.includes('No deployment was performed.'));               // 50
check('Result doc records no push', source.result.includes('No push was performed.'));                           // 51
process.stdout.write('\n');

process.stdout.write('Changelog content:\n');
check('Changelog records no runtime implementation', /no runtime implementation/i.test(phaseSection));            // 52
check('Changelog records next phase 3EX-B', phaseSection.includes('Phase 3EX-B'));                                // 53
process.stdout.write('\n');

process.stdout.write('Scope, dependency, and network safety:\n');
check('No src runtime files changed in this phase', srcChanges.length === 0);                                     // 54
check('No API/provider/gate source files changed in this phase', guardedFilesChanged.length === 0);               // 55
check('No Supabase/migration files added',
  !addedFiles.some((p) => /supabase/i.test(p) || /migration|\.sql$/i.test(p)));                                   // 56
check('No dependency added', dependenciesUnchanged && devDependenciesUnchanged);                                  // 57
check('No image files added', addedImages.length === 0);                                                          // 58
check('Docs contain no actual KIS values', !MARKET_VALUE_PATTERN.test(scanText));                                 // 59
check('Docs contain no raw KIS response fields', !RAW_FIELDS.test(scanText));                                     // 60
check('Docs contain no secret-looking values', !SECRET_VALUE(scanText));                                          // 61
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EX-A chart ai similarity mvp scope alignment architecture checker.') &&
  !fetchAttempted);                                                                                                // 62
process.stdout.write('\n');

function decisionLogHasFive() {
  const decisions = [
    '`/chart-ai` 화면은 공개 샘플로 유지하고, 실제 `유사 패턴 분석` 실행만 로그인/권한/usage guard를 적용한다.',
    'production에는 UI를 배포할 수 있으나, 실제 KIS 기반 유사도 분석은 feature flag off 상태로 둔다.',
    '다음 구현 순서는 KIS provider가 아니라 similarity engine부터 시작한다.',
    'DB/cache는 캐시 정책 문서화와 타입 설계를 먼저 진행하고, SQL 실행/migration은 별도 승인 phase로 분리한다.',
    '기존 MK AI 패널은 유지하되, 향후 `유사 패턴 분석` 결과를 보조 설명하는 역할로 재정의한다.',
  ];
  return decisions.every((decision) => source.decisionLog.includes(decision));
}

process.stdout.write(`Checks passed: ${passed}/${passed + failed}\n`);
if (failed > 0) {
  process.stdout.write(`Failures: ${failures.join('; ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('All Phase 3EX-A checks passed.\n');
}
