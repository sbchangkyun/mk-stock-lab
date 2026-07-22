// Phase 3FG-D smoke test.
// Statically inspects src/pages/chart-ai.astro to confirm the new owner-local,
// hidden-by-default guarded productization static UI shell is present, wired to the correct
// opt-in query param and localhost guard, preserves the pre-existing deterministic agents
// panel, includes all 8 required static state labels plus required Korean safety/boundary
// copy, and introduces no forbidden runtime/source tokens, no scaffold import/execution, no
// API route call, and no forbidden CTA or investment-recommendation language within the newly
// added content. This script performs no network call, no scaffold import, no browser
// automation, and no build.

import assert from 'node:assert/strict';
import fs from 'node:fs';

const CHART_AI_PAGE = 'src/pages/chart-ai.astro';

let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  assert.ok(condition, message);
};

check(fs.existsSync(CHART_AI_PAGE), `${CHART_AI_PAGE} must exist.`);
const pageSource = fs.readFileSync(CHART_AI_PAGE, 'utf8');

function extractBetween(source, startMarker, endMarker, label) {
  const startIndex = source.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error(`Could not locate start marker for ${label}: ${startMarker}`);
  }
  const endIndex = source.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex === -1) {
    throw new Error(`Could not locate end marker for ${label}: ${endMarker}`);
  }
  return source.slice(startIndex, endIndex);
}

// --- 1. New static shell section exists ---
check(
  pageSource.includes('id="chartAiOwnerLocalGuardedProductizationStaticShell"'),
  'page must declare the chartAiOwnerLocalGuardedProductizationStaticShell section id.',
);

// --- 2. Required opt-in query param exists ---
check(
  pageSource.includes("chartAiQuery.get('ownerLocalGuardedProductizationShell') === '1'"),
  'page must gate the shell behind an explicit ownerLocalGuardedProductizationShell=1 opt-in.',
);

// --- 3. Hidden-by-default marker exists on the new section ---
check(
  /id="chartAiOwnerLocalGuardedProductizationStaticShell"[\s\S]{0,200}hidden/.test(pageSource),
  'the new static shell section must carry a hidden-by-default attribute.',
);

// --- 4. Owner-local hostname guard pattern reused ---
check(pageSource.includes('isLocalOwnerHostname()'), 'page must reuse the existing localhost guard helper.');
check(
  pageSource.includes('isLocalOwnerHostname() &&\n        ownerLocalGuardedProductizationShellOptIn'),
  'the new static shell toggle must AND the localhost guard with the query opt-in.',
);

// --- 5. Pre-existing deterministic agents panel is preserved ---
check(
  pageSource.includes('id="chartAiOwnerLocalDeterministicAgentsPanel"'),
  'the pre-existing chartAiOwnerLocalDeterministicAgentsPanel section must still exist.',
);

// --- 6. Pre-existing ownerLocalDeterministicAgents=1 behavior markers are preserved ---
check(
  pageSource.includes("chartAiQuery.get('ownerLocalDeterministicAgents') === '1'"),
  'the pre-existing ownerLocalDeterministicAgents=1 opt-in must still be wired.',
);
check(
  pageSource.includes(
    "const ownerLocalDeterministicAgentsPanel = document.getElementById('chartAiOwnerLocalDeterministicAgentsPanel');",
  ),
  'the pre-existing deterministic agents panel toggle wiring must still exist.',
);

// --- 7. All 8 required static state labels exist ---
const requiredStateLabels = [
  'Default fail-closed',
  'Owner-local without scaffoldOnlyAcknowledged',
  'Owner-local with explicit scaffoldOnlyAcknowledged',
  'Beta attempt blocked',
  'Public attempt blocked',
  'Live KIS attempt blocked',
  'LLM attempt blocked',
  'Real auth attempt blocked',
];
for (const label of requiredStateLabels) {
  check(pageSource.includes(label), `page source must include required static state label: ${label}`);
}

// --- 8. Required Korean safety copy exists ---
const requiredSafetyCopy = [
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
  '과거 유사 흐름은 미래 성과를 보장하지 않습니다',
  '현재 단계에서는 실제 분석 실행이 아니라 안전 경계 확인용 화면입니다',
  '모든 실제 상품화 게이트는 꺼져 있습니다',
];
for (const requiredText of requiredSafetyCopy) {
  check(pageSource.includes(requiredText), `page source must include required Korean safety copy: ${requiredText}`);
}

// --- 9. Required blocked-boundary copy exists ---
const requiredBoundaryCopy = [
  'No live KIS',
  'No LLM',
  'No public/beta activation',
  'No API route activation',
  'No Supabase/DB real runtime',
  'No env/session/JWT/cookie/header parsing',
];
for (const requiredText of requiredBoundaryCopy) {
  check(pageSource.includes(requiredText), `page source must include required blocked-boundary copy: ${requiredText}`);
}

// --- New-content-only extraction, so forbidden-token checks cannot false-positive against ---
// --- pre-existing, unrelated code elsewhere in this large file (e.g. the real MK AI trigger ---
// --- button's "MK AI 분석 시작" label, or the pre-existing similarity panel's fetch() calls). ---
const newFrontmatterBlock = extractBetween(
  pageSource,
  '// Phase 3FG-D: owner-local, hidden-by-default static UI shell for the guarded productization',
  '\n---',
  'new frontmatter block',
);
const newMarkupBlock = extractBetween(
  pageSource,
  'id="chartAiOwnerLocalGuardedProductizationStaticShell"',
  '\n      </section>',
  'new markup section',
);
const newScriptBlock = extractBetween(
  pageSource,
  '// Owner-local guarded productization static shell (Phase 3FG-D).',
  'authGateCta?.addEventListener',
  'new script block',
);
const newStyleBlock = extractBetween(
  pageSource,
  '.chart-owner-local-guarded-productization-shell {',
  '.chart-company-placeholder small {',
  'new style block',
);
const newContent = [newFrontmatterBlock, newMarkupBlock, newScriptBlock, newStyleBlock].join('\n');

// --- 10. No forbidden CTA copy (imperative execution-implying phrases) in new content ---
const forbiddenCtaCopy = ['AI 분석 시작', '지금 실행', '구매하기', '신청하기', '활성화하기', '여기를 눌러'];
for (const token of forbiddenCtaCopy) {
  check(!newContent.includes(token), `new shell content must not contain forbidden CTA copy: ${token}`);
}

// --- 11. No forbidden investment recommendation phrase present in new content ---
const forbiddenInvestmentLanguage = [
  '매수하세요',
  '매도하세요',
  '지금 진입',
  '목표가는',
  '손절가는',
  '강력 추천',
  '상승이 확정',
  '하락이 확정',
];
for (const token of forbiddenInvestmentLanguage) {
  check(!newContent.includes(token), `new shell content must not contain forbidden investment language: ${token}`);
}

// --- 12. No forbidden runtime/source tokens introduced by the new content ---
const forbiddenRuntimeTokens = [
  'fetch(',
  'process.env',
  'createClient(',
  'createServerClient(',
  'Astro.cookies',
  'Astro.request.headers',
  'localStorage',
  'sessionStorage',
  'Math.random(',
  'Date.now(',
  'new OpenAI(',
  'new Anthropic(',
  'GoogleGenerativeAI(',
  'appsecret',
  'access_token',
  'service_role',
];
for (const token of forbiddenRuntimeTokens) {
  check(!newContent.includes(token), `new shell content must not contain forbidden runtime/source token: ${token}`);
}

// --- 13. No scaffold source import in chart-ai.astro (checked against the full file) ---
check(
  !pageSource.includes('guarded-productization-scaffold'),
  'page source must not import or reference the guarded productization scaffold module.',
);

// --- 14. No API route call / fetch for this shell (scoped to new content) ---
check(!newContent.includes('/api/'), 'new shell content must not reference any API route path.');

console.log(`Phase 3FG-D smoke: PASS (${assertions}/${assertions} assertions passed)`);
