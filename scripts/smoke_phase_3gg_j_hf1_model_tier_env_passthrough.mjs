// Phase 3GG-J-HF1 deterministic smoke script.
// Verifies, by static source inspection only, that the local-only H route now passes the new
// model-tier env keys through to the LLM runtime bridge alongside the pre-existing keys, without
// changing the route's gating, response contract, or UI. Never calls real OpenAI, never calls
// real KIS, never reads a real .env, and never starts a dev server -- fully deterministic and
// safe to run in CI or by any contributor with no local credentials.

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = '8fa1501886a0dc7e5e0c57c050b8018b80002db2';
const H_ROUTE = 'src/pages/api/chart-ai/local-only-kis-llm-summary.json.ts';
const CHART_AI_ASTRO = 'src/pages/chart-ai.astro';

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

function exists(relPath) {
  return existsSync(path.join(ROOT, relPath));
}

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function runGit(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

// Case 1: H route file exists.
check('Case 1: H route file exists', exists(H_ROUTE));

const routeSrc = exists(H_ROUTE) ? read(H_ROUTE) : '';

// Case 2: H route still calls runLocalOnlyLlmRuntimeBridge.
check('Case 2: H route still calls runLocalOnlyLlmRuntimeBridge', routeSrc.includes('runLocalOnlyLlmRuntimeBridge('));

// Case 3: H route passes CHART_AI_ENABLE_LOCAL_LLM.
check(
  'Case 3: H route passes CHART_AI_ENABLE_LOCAL_LLM',
  routeSrc.includes('CHART_AI_ENABLE_LOCAL_LLM: process.env.CHART_AI_ENABLE_LOCAL_LLM'),
);

// Case 4: H route passes OPENAI_API_KEY.
check('Case 4: H route passes OPENAI_API_KEY', routeSrc.includes('OPENAI_API_KEY: process.env.OPENAI_API_KEY'));

// Case 5: H route passes legacy CHART_AI_LLM_MODEL.
check(
  'Case 5: H route passes legacy CHART_AI_LLM_MODEL',
  routeSrc.includes('CHART_AI_LLM_MODEL: process.env.CHART_AI_LLM_MODEL'),
);

// Case 6: H route now passes CHART_AI_LLM_MAIN_MODEL.
check(
  'Case 6: H route now passes CHART_AI_LLM_MAIN_MODEL',
  routeSrc.includes('CHART_AI_LLM_MAIN_MODEL: process.env.CHART_AI_LLM_MAIN_MODEL'),
);

// Case 7: H route now passes CHART_AI_LLM_FALLBACK_MODEL.
check(
  'Case 7: H route now passes CHART_AI_LLM_FALLBACK_MODEL',
  routeSrc.includes('CHART_AI_LLM_FALLBACK_MODEL: process.env.CHART_AI_LLM_FALLBACK_MODEL'),
);

// Case 8: H route now passes CHART_AI_LLM_TEST_MODEL.
check(
  'Case 8: H route now passes CHART_AI_LLM_TEST_MODEL',
  routeSrc.includes('CHART_AI_LLM_TEST_MODEL: process.env.CHART_AI_LLM_TEST_MODEL'),
);

// Case 9: H route now passes CHART_AI_LLM_MODERATION_MODEL.
check(
  'Case 9: H route now passes CHART_AI_LLM_MODERATION_MODEL',
  routeSrc.includes('CHART_AI_LLM_MODERATION_MODEL: process.env.CHART_AI_LLM_MODERATION_MODEL'),
);

// Case 10: H route now passes CHART_AI_LLM_EMBEDDING_MODEL.
check(
  'Case 10: H route now passes CHART_AI_LLM_EMBEDDING_MODEL',
  routeSrc.includes('CHART_AI_LLM_EMBEDDING_MODEL: process.env.CHART_AI_LLM_EMBEDDING_MODEL'),
);

// Case 11: H route does not return model names.
const FORBIDDEN_MODEL_FIELD_PATTERN = /modelName|modelId|rawModel|mainModel\s*:|fallbackModel\s*:/;
check('Case 11: H route does not return model names', !FORBIDDEN_MODEL_FIELD_PATTERN.test(routeSrc));

// Case 12: H route does not add model fields to summary response.
check(
  'Case 12: H route does not add model fields to summary response',
  !routeSrc.includes("summary.model") && !routeSrc.includes('llmSummary.model'),
);

// Case 13: H route still requires ownerLocalKisLlm=1.
check(
  "Case 13: H route still requires ownerLocalKisLlm=1",
  routeSrc.includes("url.searchParams.get('ownerLocalKisLlm') === '1'"),
);

// Case 14: H route still has local hostname guard.
check('Case 14: H route still has local hostname guard', routeSrc.includes('resolveLocalHostname'));

// Case 15: H route still blocks deployed/production runtime.
check(
  'Case 15: H route still blocks deployed/production runtime',
  routeSrc.includes('!ownerLocalKisLlmOptIn || !resolvedHostname'),
);

// Case 16: H route still uses current_price only.
check("Case 16: H route still uses current_price only", routeSrc.includes("category: 'current_price'"));

// Case 17: H route does not reference forbidden endpoint categories.
const FORBIDDEN_ENDPOINT_PATTERN = /\border\b|\baccount\b|\bbalance\b|\bfunds\b|\bportfolio\b|\btrading\b|\bpersonal\b/i;
check(
  'Case 17: H route does not reference order/account/balance/funds/portfolio/trading/personal endpoints',
  !FORBIDDEN_ENDPOINT_PATTERN.test(routeSrc),
);

// Case 18: No .env/.env.local read.
check('Case 18: No .env/.env.local read', !/require\(['"]\.env|readFileSync\([^)]*\.env/.test(routeSrc));

// Case 19: No credential logging.
check(
  'Case 19: No credential logging',
  !/console\.(log|error)\([^)]*OPENAI_API_KEY/.test(routeSrc) && !/console\.(log|error)\([^)]*Authorization/.test(routeSrc),
);

// Case 20: No raw KIS payload exposure.
const FORBIDDEN_RAW_KIS_PATTERN = /\brt_cd\b|\bstck_prpr\b|\bacml_vol\b|\bprdy_vrss\b|\bprdy_ctrt\b/;
check('Case 20: No raw KIS payload exposure', !FORBIDDEN_RAW_KIS_PATTERN.test(routeSrc));

// Case 21: No raw OpenAI response exposure.
check(
  'Case 21: No raw OpenAI response exposure',
  !routeSrc.includes('rawBody') && !routeSrc.includes('parsedBody') && !routeSrc.includes('output_text'),
);

// Case 22: chart-ai.astro has no diff from baseline.
let astroDiff = '';
try {
  astroDiff = runGit(['diff', '--name-only', BASELINE, '--', CHART_AI_ASTRO]).trim();
} catch {
  astroDiff = '<git diff failed>';
}
check('Case 22: chart-ai.astro has no diff from baseline', astroDiff === '');

console.log(`\nPhase 3GG-J-HF1 smoke: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
