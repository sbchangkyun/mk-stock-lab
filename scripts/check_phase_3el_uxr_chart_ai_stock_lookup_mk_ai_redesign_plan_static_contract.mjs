/**
 * Phase 3EL-UXR planning-only static contract.
 * No network, browser, dev server, API, provider, smoke, or environment access.
 */

let fetchAttempted = false;
globalThis.fetch = async () => {
  fetchAttempted = true;
  throw new Error('Network access is blocked in the Phase 3EL-UXR redesign plan checker.');
};

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const startingCommit = 'f00c8c2';
const paths = {
  plan: 'docs/planning/phase_3el_uxr_chart_ai_stock_lookup_mk_ai_redesign_plan_v0.1.md',
  checker: 'scripts/check_phase_3el_uxr_chart_ai_stock_lookup_mk_ai_redesign_plan_static_contract.mjs',
  changelog: 'docs/planning/planning_changelog.md',
  package: 'package.json',
};

const read = (relativePath) => {
  try { return readFileSync(join(root, relativePath), 'utf8'); } catch { return ''; }
};
const git = (...args) => {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return ''; }
};

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]));
const packageJson = JSON.parse(source.package || '{}');
const baselinePackage = JSON.parse(git('show', `${startingCommit}:package.json`) || '{}');
const phaseSection = source.changelog.split('## Phase 3EL-UXR - 2026-06-30')[1]?.split('\n## ')[0] ?? '';
const phaseChanges = git('diff', '--name-only', startingCommit).split(/\r?\n/).filter(Boolean);
const srcChanges = git('diff', '--name-only', startingCommit, '--', 'src').split(/\r?\n/).filter(Boolean);
const uiChanges = srcChanges.filter((path) =>
  path.startsWith('src/pages/') || path.startsWith('src/components/') || path.startsWith('src/layouts/'));
const apiChanges = srcChanges.filter((path) => path.startsWith('src/pages/api/'));
const providerChanges = srcChanges.filter((path) =>
  path.startsWith('src/lib/server/providers/') || path.startsWith('src/lib/server/marketData/'));
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp']);
const imageChanges = phaseChanges.filter((path) => imageExtensions.has(extname(path).toLowerCase()));
const dependenciesUnchanged = JSON.stringify(packageJson.dependencies ?? {}) ===
  JSON.stringify(baselinePackage.dependencies ?? {});
const devDependenciesUnchanged = JSON.stringify(packageJson.devDependencies ?? {}) ===
  JSON.stringify(baselinePackage.devDependencies ?? {});
const lockfileUnchanged = !phaseChanges.includes('package-lock.json');

let passed = 0;
let failed = 0;
const failures = [];
const check = (label, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`  [PASS] ${label}\n`);
  } else {
    failed += 1;
    failures.push(label);
    process.stdout.write(`  [FAIL] ${label}\n`);
  }
};

process.stdout.write('=== Phase 3EL-UXR Redesign Plan Static Contract ===\n\n');

process.stdout.write('Files, command, status, and decision source:\n');
for (const [name, relativePath] of Object.entries(paths)) {
  check(`${name} file exists`, existsSync(join(root, relativePath)));
}
check('Package checker command exists',
  packageJson.scripts?.['check:phase-3el-uxr-chart-ai-stock-lookup-mk-ai-redesign-plan'] ===
    'node scripts/check_phase_3el_uxr_chart_ai_stock_lookup_mk_ai_redesign_plan_static_contract.mjs');
check('Changelog contains Phase 3EL-UXR', phaseSection.length > 0);
check('Plan status records no runtime changes',
  source.plan.includes('Planned — Chart AI stock lookup and MK AI interaction redesign plan completed; no runtime changes.'));
check('Plan references closeout', source.plan.includes('Phase 3EL-OWNER-REVIEW-CLOSEOUT'));
check('Plan records FAIL_PRODUCT_DIRECTION', source.plan.includes('FAIL_PRODUCT_DIRECTION'));
check('Plan records UX_REDESIGN_REQUIRED', source.plan.includes('UX_REDESIGN_REQUIRED'));
check('Plan blocks deployment and deeper quote integration',
  source.plan.includes('must not proceed to deployment or deeper quote integration'));
process.stdout.write('\n');

process.stdout.write('Product identity, benchmarks, and information architecture:\n');
check('Plan includes product repositioning', source.plan.includes('## 3. Product Repositioning'));
check('Plan uses stock lookup-first identity', source.plan.includes('stock lookup-first chart page with optional MK AI analysis'));
check('Plan includes target pattern',
  source.plan.includes('search → stock header → candlestick chart → basic stock/company information → optional MK AI analysis'));
check('Plan recommends 종목 차트', source.plan.includes('Recommended default: `종목 차트`'));
for (const reference of ['Naver Securities', 'Toss Securities', 'AlphaSquare', 'NH Investment & Securities “차분이”']) {
  check(`Plan references ${reference}`, source.plan.includes(reference));
}
check('Plan prohibits copying benchmark UI', source.plan.includes('Do not copy their exact UI'));
check('Plan includes PC target information architecture',
  source.plan.includes('### PC Target') && source.plan.includes('Candlestick chart with volume'));
check('Plan includes mobile target information architecture',
  source.plan.includes('### Mobile Target') && source.plan.includes('AI result bottom sheet or stacked cards'));
check('Plan includes 390px mobile-first rule', source.plan.includes('390px width first'));
process.stdout.write('\n');

process.stdout.write('Search, stock header, chart, and profile planning:\n');
check('Plan separates search and selected stock state',
  source.plan.includes('Search input is temporary query state') && source.plan.includes('Selected stock is separate persistent state'));
check('Selecting a result clears the search input', source.plan.includes('clears the search input'));
check('Plan includes preferred 조회 label', source.plan.includes('lookup button label is `조회`'));
check('Plan includes compact search dropdown/list', source.plan.includes('compact dropdown/list'));
check('Plan reduces repeated stock identity', source.plan.includes('not repeated excessively'));
check('Plan includes stock header design', source.plan.includes('## 7. Stock Header Design'));
for (const field of ['nameKo', 'symbol', 'exchange', 'assetType', 'currency', 'sample/live/source label']) {
  check(`Stock header includes ${field}`, source.plan.includes(field));
}
for (const label of ['샘플 데이터', '실제 시세 아님', '조회 시점 기준', '최근 조회 기준', '데이터 일시 불가']) {
  check(`Plan includes safe label ${label}`, source.plan.includes(label));
}
check('Plan prohibits unsupported realtime claims',
  ['실시간', '실시간 시세', '현재 시세', 'real-time', 'actual market value'].every((value) => source.plan.includes(value)));
check('Plan includes candlestick OHLC chart',
  source.plan.includes('mocked-first candlestick OHLC chart'));
check('Plan includes volume bars', source.plan.includes('Volume bars'));
check('Plan includes period controls', source.plan.includes('Period controls'));
check('Plan allows mocked/static OHLC first', source.plan.includes('Mocked/static OHLC data is acceptable first'));
check('Plan defers KIS chart-data integration', source.plan.includes('KIS chart-data integration belongs to a separate later phase'));
check('Plan includes companyProfile', source.plan.includes('companyProfile'));
check('Plan defines CompanyProfile type', source.plan.includes('type CompanyProfile = {'));
check('KIS company description must be verified later',
  source.plan.includes('KIS natural-language company description availability must be verified later'));
check('Plan includes profile source alternatives',
  ['OpenDART', 'KRX', 'manual/static seed'].every((value) => source.plan.includes(value)));
process.stdout.write('\n');

process.stdout.write('MK AI interaction, loading, and result reveal:\n');
check('Plan includes MK AI button', source.plan.includes('`MK AI` button'));
check('No analysis appears before activation', source.plan.includes('No analysis content is visible before user activation'));
check('Plan includes intro/usage guidance', source.plan.includes('intro/usage guidance'));
check('Plan includes disclaimer', source.plan.includes('disclaimer'));
for (const message of [
  '분석 중이에요.', '조금만 기다려주세요.', '가격 흐름을 확인하고 있어요.',
  '거래량 변화를 살펴보고 있어요.', '지지선과 저항선을 찾고 있어요.',
  '기술적 지표를 비교하고 있어요.', '리스크 요인을 점검하고 있어요.',
]) {
  check(`Plan includes loading copy ${message}`, source.plan.includes(message));
}
check('Plan includes staged loading policy', source.plan.includes('Staged loading must build anticipation'));
check('Plan includes loading duration', source.plan.includes('1.5s to 3.5s'));
check('Plan includes sequential result reveal', source.plan.includes('Required sequential sections'));
for (const section of ['국면·수급', '매매 전략', '가격 패턴', '기술적 지표', '지지·저항', '리스크 체크']) {
  check(`Plan includes analysis section ${section}`, source.plan.includes(section));
}
for (const field of ['summary', 'evidence', 'checkpoints', 'risk or attention point']) {
  check(`Analysis section structure includes ${field}`, source.plan.includes(field));
}
process.stdout.write('\n');

process.stdout.write('Models, copy, mobile, accessibility, and safety:\n');
for (const model of ['MockedOhlcPoint', 'StockLookupViewModel', 'MkAiAnalysisSection']) {
  check(`Plan defines ${model}`, source.plan.includes(`type ${model} = {`));
}
check('Plan includes UX copy policy', source.plan.includes('## 14. UX Copy Policy'));
check('Plan includes mobile-first rules', source.plan.includes('## 15. Mobile-First Rules'));
check('Plan protects body geometry', source.plan.includes('No horizontal body overflow'));
check('Plan includes accessibility rules', source.plan.includes('## 16. Accessibility and Interaction Rules'));
check('Search input requires accessible label', source.plan.includes('Search input has an accessible label'));
check('MK AI requires keyboard focus', source.plan.includes('`MK AI` is keyboard-focusable'));
check('Loading uses polite live region', source.plan.includes('polite live region'));
check('Plan includes source and safety policy', source.plan.includes('## 17. Source and Safety Policy'));
check('Plan keeps public source=live disabled', source.plan.includes('Public `source=live` remains disabled'));
check('Plan keeps source=auto deferred', source.plan.includes('`source=auto` remains deferred'));
check('Plan records no KIS call in UXR', source.plan.includes('No KIS call in UXR'));
check('Plan records no quote/API/provider integration in UXR', source.plan.includes('No quote/API/provider integration in UXR'));
process.stdout.write('\n');

process.stdout.write('Roadmap, decisions, risks, and future validation:\n');
check('Plan includes implementation roadmap', source.plan.includes('## 18. Implementation Roadmap'));
for (const phase of ['Phase 3EL-HF1', 'Phase 3EL-HF2', 'Phase 3EL-HF3', 'Phase 3EL-HF4', 'Phase 3EL-HF5', 'Phase 3EL-HF6', 'Phase 3EL-OWNER-REVIEW-RETRY', 'Phase 3EM']) {
  check(`Roadmap includes ${phase}`, source.plan.includes(phase));
}
check('Plan includes owner decision matrix', source.plan.includes('## 19. Owner Decision Matrix'));
for (const decision of [
  'Primary page title', 'Search button label', 'Candlestick mocked data allowed',
  'CompanyProfile mocked data allowed', 'MK AI intro required', 'MK AI loading duration',
  'AI result reveal style', 'Default mobile tab', 'Price display in mocked phase',
  'Buy/order CTAs', 'Keep Chart AI as nav label', 'Redesign review before quote infrastructure',
]) {
  check(`Decision matrix includes ${decision}`, source.plan.includes(decision));
}
check('Plan includes risk register', source.plan.includes('## 20. Risk Register'));
for (const risk of [
  'AI demo feel remains too strong', 'Candlestick chart looks fake', 'Sample data confused as live data',
  'Search state remains confusing', 'Mobile chart overflow', 'Analysis cards are too verbose',
  'Analysis cards are too shallow', 'Investment-advice wording risk',
  'KIS company profile availability uncertain', 'Future quote/chart data integration complexity',
  'Provider leakage risk', 'Owner review fails again due to visual quality',
]) {
  check(`Risk register includes ${risk}`, source.plan.includes(risk));
}
check('Plan includes future validation plan', source.plan.includes('## 21. Validation Plan for Future Implementation'));
for (const command of [
  'npm run check:mobile-baseline', 'npm run check:production-domain',
  'npm run build', 'git diff --check', 'npm run guard:production-mobile-geometry',
]) {
  check(`Future validation includes ${command}`, source.plan.includes(command));
}
check('Plan recommends Phase 3EL-HF1',
  source.plan.includes('Recommended next phase: Phase 3EL-HF1 — Chart AI Stock Lookup Layout Redesign.'));
process.stdout.write('\n');

process.stdout.write('Planning-only change boundaries:\n');
check('No src runtime file changed in this phase', srcChanges.length === 0);
check('No UI page file changed in this phase', uiChanges.length === 0);
check('No API route file changed in this phase', apiChanges.length === 0);
check('No provider file changed in this phase', providerChanges.length === 0);
check('No image file was added', imageChanges.length === 0);
check('No dependency was added', dependenciesUnchanged && devDependenciesUnchanged && lockfileUnchanged);
check('Changelog records no deployment', /no deployment/i.test(phaseSection));
check('Changelog records no push', /no push/i.test(phaseSection));
check('Changelog recommends Phase 3EL-HF1', phaseSection.includes('Phase 3EL-HF1'));
check('Checker blocks network access',
  source.checker.includes('Network access is blocked in the Phase 3EL-UXR redesign plan checker.'));
check('Checker did not attempt network access', fetchAttempted === false);
check('Checker does not read .env files',
  !/readFileSync\s*\([^)]*["'][^"']*\.env/i.test(source.checker));

process.stdout.write(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);
if (failed > 0) {
  process.stdout.write(`\nFailed checks:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('All Phase 3EL-UXR checks passed.\n');
