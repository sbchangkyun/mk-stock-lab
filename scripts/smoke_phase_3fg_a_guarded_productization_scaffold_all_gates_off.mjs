import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GUARDED_PRODUCTIZATION_SCAFFOLD_VERSION,
  DEFAULT_GUARDED_PRODUCTIZATION_FLAGS,
  createDefaultGuardedProductizationFlags,
  createGuardedProductizationContext,
  evaluateGuardedProductizationAccess,
  createFailClosedDecision,
  summarizeGuardedProductizationDecision,
  assertNoRuntimeActivation,
} from '../src/lib/server/chart-ai/guarded-productization-scaffold.mjs';
import {
  createDefaultGuardedProductizationFixture,
  createOwnerLocalFixtureRequest,
  createBetaAttemptFixtureRequest,
  createPublicAttemptFixtureRequest,
  createLiveKisAttemptFixtureRequest,
  createLlmAttemptFixtureRequest,
  createRealAuthAttemptFixtureRequest,
} from '../src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let assertions = 0;
const check = (condition, message) => {
  assertions += 1;
  assert.ok(condition, message);
};
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.equal(actual, expected, message);
};

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

// Unicode-escaped via String.fromCharCode so this file's own raw text never contains the
// corrupted byte sequence it checks for.
const mojibakePatterns = [String.fromCharCode(65533)];

const checkSafeText = (value, label) => {
  const serialized = JSON.stringify(value);
  for (const token of mojibakePatterns) {
    check(!serialized.includes(token), `${label} must not contain mojibake pattern`);
  }
  for (const token of forbiddenInvestmentLanguage) {
    check(!serialized.includes(token), `${label} must not contain forbidden investment language: ${token}`);
  }
  check(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(serialized), `${label} must not contain raw email-like values`);
  check(!/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(serialized), `${label} must not contain JWT-like values`);
  check(!/appsecret|access_token|service_role|OPENAI_API_KEY|KIS_APP_SECRET/i.test(serialized), `${label} must not contain secret-like tokens`);
};

// --- Scenario: default flags are all false ---
const defaultFlags = createDefaultGuardedProductizationFlags();
for (const [key, value] of Object.entries(defaultFlags)) {
  equal(value, false, `default flags are all false: flag ${key} must be false`);
}
equal(
  JSON.stringify(defaultFlags),
  JSON.stringify(DEFAULT_GUARDED_PRODUCTIZATION_FLAGS),
  'default flags are all false: createDefaultGuardedProductizationFlags must mirror the exported default constant',
);
let defaultFlagsAssertOk = true;
try {
  assertNoRuntimeActivation(defaultFlags);
} catch {
  defaultFlagsAssertOk = false;
}
check(defaultFlagsAssertOk, 'default flags are all false: assertNoRuntimeActivation must not throw for default flags');
let activatedFlagAssertThrows = false;
try {
  assertNoRuntimeActivation({ ...defaultFlags, liveKisEnabled: true });
} catch {
  activatedFlagAssertThrows = true;
}
check(activatedFlagAssertThrows, 'assertNoRuntimeActivation must throw when a gate is activated');

// --- Scenario: default decision is fail-closed ---
const defaultContext = createGuardedProductizationContext();
const defaultDecision = evaluateGuardedProductizationAccess(defaultContext);
equal(defaultDecision.allowed, false, 'default decision is fail-closed: allowed must be false');
equal(defaultDecision.failClosed, true, 'default decision is fail-closed: failClosed must be true');
equal(
  defaultDecision.scaffoldVersion,
  GUARDED_PRODUCTIZATION_SCAFFOLD_VERSION,
  'default decision is fail-closed: scaffoldVersion must match the exported constant',
);
check(
  Array.isArray(defaultDecision.reasons) && defaultDecision.reasons.length > 0,
  'default decision is fail-closed: reasons must be non-empty',
);

// --- Scenario: owner-local fixture is still blocked unless explicitly allowed by a safe scaffold-only path ---
const ownerLocalRequest = createOwnerLocalFixtureRequest();
const ownerLocalDecision = evaluateGuardedProductizationAccess(createGuardedProductizationContext(ownerLocalRequest));
equal(
  ownerLocalDecision.allowed,
  false,
  'owner-local fixture is still blocked unless explicitly allowed by a safe scaffold-only path',
);
equal(ownerLocalDecision.failClosed, true, 'owner-local fixture without acknowledgement must fail closed');
const ownerLocalAcknowledgedDecision = evaluateGuardedProductizationAccess(
  createGuardedProductizationContext({ ...ownerLocalRequest, scaffoldOnlyAcknowledged: true }),
);
equal(
  ownerLocalAcknowledgedDecision.allowed,
  true,
  'owner-local fixture explicitly allowed by a safe scaffold-only path (acknowledged) may be allowed',
);
equal(ownerLocalAcknowledgedDecision.failClosed, false, 'the acknowledged safe scaffold-only path is not fail-closed');

// --- Scenario: beta attempt is blocked ---
const betaDecision = evaluateGuardedProductizationAccess(createGuardedProductizationContext(createBetaAttemptFixtureRequest()));
equal(betaDecision.allowed, false, 'beta attempt is blocked');
equal(betaDecision.failClosed, true, 'beta attempt is blocked: failClosed must be true');
check(betaDecision.blockedBoundaries.includes('No public/beta activation'), 'beta attempt is blocked: blockedBoundaries must include the public/beta boundary');

// --- Scenario: public attempt is blocked ---
const publicDecision = evaluateGuardedProductizationAccess(createGuardedProductizationContext(createPublicAttemptFixtureRequest()));
equal(publicDecision.allowed, false, 'public attempt is blocked');
equal(publicDecision.failClosed, true, 'public attempt is blocked: failClosed must be true');
check(publicDecision.blockedBoundaries.includes('No public/beta activation'), 'public attempt is blocked: blockedBoundaries must include the public/beta boundary');

// --- Scenario: live_kis provider mode is blocked ---
const liveKisDecision = evaluateGuardedProductizationAccess(createGuardedProductizationContext(createLiveKisAttemptFixtureRequest()));
equal(liveKisDecision.allowed, false, 'live_kis provider mode is blocked');
equal(liveKisDecision.failClosed, true, 'live_kis provider mode is blocked: failClosed must be true');
check(liveKisDecision.blockedBoundaries.includes('No live KIS'), 'live_kis provider mode is blocked: blockedBoundaries must include the live KIS boundary');

// --- Scenario: llm agent mode is blocked ---
const llmDecision = evaluateGuardedProductizationAccess(createGuardedProductizationContext(createLlmAttemptFixtureRequest()));
equal(llmDecision.allowed, false, 'llm agent mode is blocked');
equal(llmDecision.failClosed, true, 'llm agent mode is blocked: failClosed must be true');
check(llmDecision.blockedBoundaries.includes('No LLM'), 'llm agent mode is blocked: blockedBoundaries must include the LLM boundary');

// --- Scenario: real auth attempt is blocked ---
const realAuthDecision = evaluateGuardedProductizationAccess(createGuardedProductizationContext(createRealAuthAttemptFixtureRequest()));
equal(realAuthDecision.allowed, false, 'real auth attempt is blocked');
equal(realAuthDecision.failClosed, true, 'real auth attempt is blocked: failClosed must be true');
check(
  realAuthDecision.blockedBoundaries.includes('No Supabase/DB real runtime'),
  'real auth attempt is blocked: blockedBoundaries must include the Supabase/DB real runtime boundary',
);

// --- Scenario: Supabase/DB/env/session/JWT/cookie/header are not used ---
const scaffoldSource = readFileSync(path.join(ROOT, 'src/lib/server/chart-ai/guarded-productization-scaffold.mjs'), 'utf8');
const fixtureSource = readFileSync(path.join(ROOT, 'src/lib/server/chart-ai/guarded-productization-scaffold.fixture.mjs'), 'utf8');
const runtimeDenylistPatterns = [
  'fetch(',
  'process.env',
  'createClient(',
  '.cookies(',
  'Astro.cookies',
  '.headers(',
  'Astro.request.headers',
  'jwt.verify(',
  'jwt.sign(',
  'jsonwebtoken',
  'localStorage.',
  'sessionStorage.',
  'Math.random(',
  'Date.now(',
  'new OpenAI(',
  'new Anthropic(',
  'GoogleGenerativeAI(',
];
for (const pattern of runtimeDenylistPatterns) {
  check(
    !scaffoldSource.includes(pattern),
    `Supabase/DB/env/session/JWT/cookie/header are not used: scaffold source must not contain "${pattern}"`,
  );
  check(
    !fixtureSource.includes(pattern),
    `Supabase/DB/env/session/JWT/cookie/header are not used: fixture source must not contain "${pattern}"`,
  );
}
check(
  !/appsecret|access_token|service_role/i.test(scaffoldSource),
  'Supabase/DB/env/session/JWT/cookie/header are not used: scaffold source must not contain secret-like tokens',
);
check(
  !/appsecret|access_token|service_role/i.test(fixtureSource),
  'Supabase/DB/env/session/JWT/cookie/header are not used: fixture source must not contain secret-like tokens',
);

// --- Scenario: no forbidden investment recommendation phrases are emitted ---
const allFixtureRequests = [
  createDefaultGuardedProductizationFixture(),
  createOwnerLocalFixtureRequest(),
  createBetaAttemptFixtureRequest(),
  createPublicAttemptFixtureRequest(),
  createLiveKisAttemptFixtureRequest(),
  createLlmAttemptFixtureRequest(),
  createRealAuthAttemptFixtureRequest(),
];
for (const request of allFixtureRequests) {
  const decision = evaluateGuardedProductizationAccess(createGuardedProductizationContext(request));
  checkSafeText(decision, 'no forbidden investment recommendation phrases are emitted: decision output');
  checkSafeText(
    summarizeGuardedProductizationDecision(decision),
    'no forbidden investment recommendation phrases are emitted: decision summary',
  );
}
checkSafeText(defaultDecision, 'no forbidden investment recommendation phrases are emitted: default decision output');

// --- Scenario: safety copy exists ---
const requiredSafetyPhrases = [
  '참고용',
  '매수·매도 추천이 아닙니다',
  '투자 자문이 아닙니다',
  '과거 유사 흐름은 미래 성과를 보장하지 않습니다',
];
check(
  Array.isArray(defaultDecision.safetyCopy) && defaultDecision.safetyCopy.length > 0,
  'safety copy exists: decision must carry a non-empty safetyCopy array',
);
const safetyCopyJoined = defaultDecision.safetyCopy.join(' ');
for (const phrase of requiredSafetyPhrases) {
  check(safetyCopyJoined.includes(phrase), `safety copy exists: must include required phrase "${phrase}"`);
}
check(
  summarizeGuardedProductizationDecision(defaultDecision).includes('참고용'),
  'safety copy exists: decision summary text must surface safety copy',
);

// --- Scenario: decision output is deterministic across repeated calls ---
const repeatContext = createGuardedProductizationContext(createLiveKisAttemptFixtureRequest());
const repeatA = evaluateGuardedProductizationAccess(repeatContext);
const repeatB = evaluateGuardedProductizationAccess(repeatContext);
const repeatC = evaluateGuardedProductizationAccess(createGuardedProductizationContext(createLiveKisAttemptFixtureRequest()));
equal(
  JSON.stringify(repeatA),
  JSON.stringify(repeatB),
  'decision output is deterministic across repeated calls: same context object must yield identical output',
);
equal(
  JSON.stringify(repeatA),
  JSON.stringify(repeatC),
  'decision output is deterministic across repeated calls: freshly constructed equivalent context must yield identical output',
);

// --- createFailClosedDecision direct behavior ---
const directFailClosed = createFailClosedDecision();
equal(directFailClosed.allowed, false, 'createFailClosedDecision must always return allowed: false');
equal(directFailClosed.failClosed, true, 'createFailClosedDecision must always return failClosed: true');
check(
  directFailClosed.blockedBoundaries.length === 6,
  'createFailClosedDecision must carry the full canonical blocked boundary list',
);

console.log(`Phase 3FG-A smoke: PASS (${assertions}/${assertions} assertions passed)`);
