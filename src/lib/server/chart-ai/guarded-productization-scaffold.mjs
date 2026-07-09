// Phase 3FG-A guarded productization scaffold. Server-only, deterministic,
// pure functions only. Every real productization gate defaults to false;
// the only reachable "allowed" outcome is the single narrowest owner-local
// fixture-only path, and only when explicitly acknowledged by the caller.
// No live KIS. No LLM. No Supabase/DB/auth runtime. No network, no env,
// no session/JWT/cookie/header parsing, no randomness, no timestamps.

export const GUARDED_PRODUCTIZATION_SCAFFOLD_VERSION = 'guarded-productization-scaffold.v0.1';

export const DEFAULT_GUARDED_PRODUCTIZATION_FLAGS = Object.freeze({
  ownerLocalEnabled: false,
  internalQaEnabled: false,
  betaEnabled: false,
  publicEnabled: false,
  liveKisEnabled: false,
  llmEnabled: false,
  mkAiRouteEnabled: false,
  realAuthEnabled: false,
  supabaseEnabled: false,
  dbEnabled: false,
  usageDeductionEnabled: false,
  paidEntitlementEnabled: false,
  adUnlockEnabled: false,
  deployEnabled: false,
  pushEnabled: false,
});

export function createDefaultGuardedProductizationFlags() {
  return { ...DEFAULT_GUARDED_PRODUCTIZATION_FLAGS };
}

const ALLOWED_PROVIDER_MODES = Object.freeze(['synthetic_fixture', 'kis_ohlc_fixture']);
const BLOCKED_PROVIDER_MODES = Object.freeze(['live_kis']);
const ALLOWED_AGENT_MODES = Object.freeze(['deterministic_fixture']);
const BLOCKED_AGENT_MODES = Object.freeze(['llm']);
const ALLOWED_AUDIENCES = Object.freeze(['owner-local', 'internal-qa', 'beta', 'public']);

const SAFETY_COPY = Object.freeze([
  '참고용 정보이며 투자 판단의 유일한 근거로 사용할 수 없습니다.',
  '이 콘텐츠는 매수·매도 추천이 아닙니다.',
  '이 콘텐츠는 투자 자문이 아닙니다.',
  '과거 유사 흐름은 미래 성과를 보장하지 않습니다.',
]);

const BLOCKED_BOUNDARY_COPY = Object.freeze([
  'No live KIS',
  'No LLM',
  'No public/beta activation',
  'No Supabase/DB real runtime',
  'No env/session/JWT/cookie/header parsing',
  'No deploy/push',
]);

const APPROVAL_LABELS = Object.freeze({
  liveKis: 'Live KIS approval',
  llm: 'LLM approval',
  betaPublic: 'Beta/public activation approval',
  supabaseDb: 'Supabase/DB real runtime approval',
  deployPush: 'Deploy/push approval',
  entitlement: 'Paid entitlement / ad unlock approval',
  mkAiRoute: 'MK AI route activation approval',
  realAuth: 'Real auth runtime approval',
});

function mergeFlags(flags) {
  return { ...createDefaultGuardedProductizationFlags(), ...(flags && typeof flags === 'object' ? flags : {}) };
}

function isNarrowestSafePath(audience, providerMode, agentMode, flags) {
  if (audience !== 'owner-local') return false;
  if (!ALLOWED_PROVIDER_MODES.includes(providerMode)) return false;
  if (!ALLOWED_AGENT_MODES.includes(agentMode)) return false;
  if (flags.ownerLocalEnabled !== true) return false;
  return Object.entries(flags).every(([key, value]) => key === 'ownerLocalEnabled' || value === false);
}

export function createGuardedProductizationContext(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return Object.freeze({
    audience: typeof source.audience === 'string' ? source.audience : 'owner-local',
    providerMode: typeof source.providerMode === 'string' ? source.providerMode : 'synthetic_fixture',
    agentMode: typeof source.agentMode === 'string' ? source.agentMode : 'deterministic_fixture',
    flags: Object.freeze(mergeFlags(source.flags)),
    scaffoldOnlyAcknowledged: source.scaffoldOnlyAcknowledged === true,
  });
}

export function createFailClosedDecision(overrides = {}) {
  const source = overrides && typeof overrides === 'object' ? overrides : {};
  const audience = typeof source.audience === 'string' ? source.audience : 'owner-local';
  const providerMode = typeof source.providerMode === 'string' ? source.providerMode : 'synthetic_fixture';
  const agentMode = typeof source.agentMode === 'string' ? source.agentMode : 'deterministic_fixture';
  const reasons = Array.isArray(source.reasons) && source.reasons.length
    ? [...source.reasons]
    : ['Fail-closed default: this scaffold phase grants no real productization access.'];
  const requiredApprovals = Array.isArray(source.requiredApprovals) ? [...new Set(source.requiredApprovals)] : [];
  const diagnostics = source.diagnostics && typeof source.diagnostics === 'object' ? { ...source.diagnostics } : {};

  return Object.freeze({
    scaffoldVersion: GUARDED_PRODUCTIZATION_SCAFFOLD_VERSION,
    allowed: false,
    audience,
    providerMode,
    agentMode,
    reasons: Object.freeze(reasons),
    blockedBoundaries: Object.freeze([...BLOCKED_BOUNDARY_COPY]),
    requiredApprovals: Object.freeze(requiredApprovals),
    failClosed: true,
    safetyCopy: Object.freeze([...SAFETY_COPY]),
    diagnostics: Object.freeze(diagnostics),
  });
}

export function evaluateGuardedProductizationAccess(context) {
  const ctx = context && typeof context === 'object' ? context : createGuardedProductizationContext();
  const audience = typeof ctx.audience === 'string' ? ctx.audience : 'owner-local';
  const providerMode = typeof ctx.providerMode === 'string' ? ctx.providerMode : 'synthetic_fixture';
  const agentMode = typeof ctx.agentMode === 'string' ? ctx.agentMode : 'deterministic_fixture';
  const flags = mergeFlags(ctx.flags);
  const scaffoldOnlyAcknowledged = ctx.scaffoldOnlyAcknowledged === true;

  const reasons = [];
  const requiredApprovals = [];

  if (!ALLOWED_AUDIENCES.includes(audience)) {
    reasons.push(`Audience "${audience}" is not recognized by this scaffold.`);
  }
  if (audience === 'beta' || flags.betaEnabled) {
    reasons.push('Beta audience activation is blocked in this phase.');
    requiredApprovals.push(APPROVAL_LABELS.betaPublic);
  }
  if (audience === 'public' || flags.publicEnabled) {
    reasons.push('Public audience activation is blocked in this phase.');
    requiredApprovals.push(APPROVAL_LABELS.betaPublic);
  }
  if (flags.internalQaEnabled) {
    reasons.push('Internal QA audience activation is blocked in this phase.');
  }
  if (BLOCKED_PROVIDER_MODES.includes(providerMode) || !ALLOWED_PROVIDER_MODES.includes(providerMode) || flags.liveKisEnabled) {
    reasons.push(`Provider mode "${providerMode}" (or the live KIS flag) is blocked in this phase.`);
    requiredApprovals.push(APPROVAL_LABELS.liveKis);
  }
  if (BLOCKED_AGENT_MODES.includes(agentMode) || !ALLOWED_AGENT_MODES.includes(agentMode) || flags.llmEnabled) {
    reasons.push(`Agent mode "${agentMode}" (or the LLM flag) is blocked in this phase.`);
    requiredApprovals.push(APPROVAL_LABELS.llm);
  }
  if (flags.mkAiRouteEnabled) {
    reasons.push('MK AI route activation is blocked in this phase.');
    requiredApprovals.push(APPROVAL_LABELS.mkAiRoute);
  }
  if (flags.realAuthEnabled) {
    reasons.push('Real auth runtime is blocked in this phase.');
    requiredApprovals.push(APPROVAL_LABELS.realAuth);
  }
  if (flags.supabaseEnabled || flags.dbEnabled) {
    reasons.push('Supabase/DB real runtime is blocked in this phase.');
    requiredApprovals.push(APPROVAL_LABELS.supabaseDb);
  }
  if (flags.usageDeductionEnabled || flags.paidEntitlementEnabled || flags.adUnlockEnabled) {
    reasons.push('Usage deduction / paid entitlement / ad unlock is blocked in this phase.');
    requiredApprovals.push(APPROVAL_LABELS.entitlement);
  }
  if (flags.deployEnabled || flags.pushEnabled) {
    reasons.push('Deploy/push is blocked in this phase.');
    requiredApprovals.push(APPROVAL_LABELS.deployPush);
  }

  const safePath = isNarrowestSafePath(audience, providerMode, agentMode, flags);
  if (safePath && !scaffoldOnlyAcknowledged) {
    reasons.push('Owner-local scaffold-only path requires explicit acknowledgement before it can be allowed.');
  }

  const allowed = safePath && scaffoldOnlyAcknowledged && reasons.length === 0;

  if (allowed) {
    return Object.freeze({
      scaffoldVersion: GUARDED_PRODUCTIZATION_SCAFFOLD_VERSION,
      allowed: true,
      audience,
      providerMode,
      agentMode,
      reasons: Object.freeze([]),
      blockedBoundaries: Object.freeze([]),
      requiredApprovals: Object.freeze([]),
      failClosed: false,
      safetyCopy: Object.freeze([...SAFETY_COPY]),
      diagnostics: Object.freeze({
        flags: Object.freeze({ ...flags }),
        isNarrowestSafePath: true,
        scaffoldOnlyAcknowledged: true,
      }),
    });
  }

  return createFailClosedDecision({
    audience,
    providerMode,
    agentMode,
    reasons,
    requiredApprovals,
    diagnostics: {
      flags: { ...flags },
      isNarrowestSafePath: safePath,
      scaffoldOnlyAcknowledged,
    },
  });
}

export function summarizeGuardedProductizationDecision(decision) {
  const d = decision && typeof decision === 'object' ? decision : createFailClosedDecision();
  const statusLabel = d.allowed ? '허용' : '차단';
  const reasonsText = Array.isArray(d.reasons) && d.reasons.length ? d.reasons.join(' ') : '해당 없음';
  const boundariesText = Array.isArray(d.blockedBoundaries) && d.blockedBoundaries.length
    ? d.blockedBoundaries.join(', ')
    : '없음';
  const safetyText = Array.isArray(d.safetyCopy) ? d.safetyCopy.join(' ') : '';
  return [
    `[가드 상태: ${statusLabel}] 대상=${d.audience}, 제공자 모드=${d.providerMode}, 에이전트 모드=${d.agentMode}.`,
    `사유: ${reasonsText}`,
    `차단된 경계: ${boundariesText}`,
    safetyText,
  ].filter(Boolean).join('\n');
}

export function assertNoRuntimeActivation(flags) {
  const merged = mergeFlags(flags);
  const activated = Object.entries(merged)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
  if (activated.length > 0) {
    throw new Error(`Guarded productization scaffold: unexpected runtime activation for flag(s): ${activated.join(', ')}`);
  }
  return true;
}
