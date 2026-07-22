// Phase 3GG-D local-only Live KIS provider binding scaffold. Server-only,
// deterministic, pure functions only, dependency-free. Every real
// provider/activation gate defaults to false; providerCallAllowed is always
// false in this phase, regardless of input. No live KIS call. No real
// provider call. No credential read. No env value read. No network. No
// file access. No session/JWT/cookie/header parsing, no randomness, no
// timestamps generated internally.

export const LOCAL_ONLY_LIVE_KIS_BINDING_CONTRACT_VERSION = 'local-only-live-kis-provider-binding-scaffold.v0.1';

export const DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS = Object.freeze({
  localOnlyBindingEnabled: false,
  credentialReadEnabled: false,
  providerCallEnabled: false,
  apiRouteActivationEnabled: false,
  liveKisEnabled: false,
  allowLiveKisProviderMode: false,
  allowPublic: false,
  allowBeta: false,
  allowInternalQa: false,
  allowEnvCredentialRead: false,
  allowRawPayloadExposure: false,
  allowLlmHandoff: false,
  allowDeploy: false,
});

export function createDefaultLocalOnlyLiveKisBindingFlags() {
  return { ...DEFAULT_LOCAL_ONLY_LIVE_KIS_BINDING_FLAGS };
}

export const APPROVED_MARKET_DATA_ENDPOINT_CATEGORIES = Object.freeze([
  'current_price',
  'ohlc_bars',
  'daily_bars',
  'weekly_bars',
  'monthly_bars',
  'yearly_bars',
  'minute_bars',
  'volume',
  'order_book',
  'expected_execution',
  'symbol_basics',
  'sector_index',
  'investor_flow',
  'foreign_institutional_flow',
  'short_selling',
  'program_trading',
  'market_cap_ranking',
  'volume_ranking',
  'change_rate_ranking',
  'financial_ratios',
  'brokerage_opinions',
]);

export const FORBIDDEN_KIS_ENDPOINT_CATEGORIES = Object.freeze([
  'order',
  'cancel_modify_order',
  'account',
  'balance',
  'funds',
  'buying_power',
  'sellable_quantity',
  'profit_loss',
  'deposit_withdrawal',
  'personal_endpoint',
  'trading_history',
  'portfolio_holdings',
]);

export const LOCAL_ONLY_ALLOWED_HOSTNAMES = Object.freeze(['localhost', '127.0.0.1', '::1']);

export const LOCAL_ONLY_BLOCKED_AUDIENCES = Object.freeze(['public', 'beta', 'internal-qa', 'deployed', 'vercel']);

export const DEFAULT_LOCAL_ONLY_RATE_LIMIT = Object.freeze({
  perMinute: 5,
  perHour: 30,
  perDay: 100,
  blockOnExceed: true,
  queueOnExceed: false,
});

export const DEFAULT_LOCAL_ONLY_CACHE_POLICY = Object.freeze({
  ttlSeconds: 300,
  cacheBeforeCall: true,
  excludedKeyFields: Object.freeze(['pii', 'session', 'jwt', 'cookie', 'email']),
});

export const DEFAULT_LOCAL_ONLY_COST_POLICY = Object.freeze({
  tier: 'free_tier_or_zero_won',
  costCeilingWon: 0,
  stopOnCostUncertainty: true,
});

const BLOCKED_BOUNDARY_COPY = Object.freeze([
  'No live KIS call',
  'No real provider call',
  'No credential read',
  'No API route activation',
  'No public/beta/internal QA activation',
  'No LLM handoff',
  'No raw payload exposure',
  'No deploy/push',
]);

function mergeFlags(flags) {
  return { ...createDefaultLocalOnlyLiveKisBindingFlags(), ...(flags && typeof flags === 'object' ? flags : {}) };
}

export function isLocalOnlyRuntime(context = {}) {
  const ctx = context && typeof context === 'object' ? context : {};
  const hostname = typeof ctx.hostname === 'string' ? ctx.hostname : '';
  const audience = typeof ctx.audience === 'string' ? ctx.audience : 'unknown';
  const isDeployed = ctx.isDeployed === true;
  const isVercel = ctx.isVercel === true;
  const hostnameIsLocal = LOCAL_ONLY_ALLOWED_HOSTNAMES.includes(hostname);
  const audienceIsBlocked = LOCAL_ONLY_BLOCKED_AUDIENCES.includes(audience);
  return hostnameIsLocal && !audienceIsBlocked && !isDeployed && !isVercel;
}

export function classifyKisEndpointCategory(category) {
  const c = typeof category === 'string' ? category : '';
  if (APPROVED_MARKET_DATA_ENDPOINT_CATEGORIES.includes(c)) return 'approved';
  if (FORBIDDEN_KIS_ENDPOINT_CATEGORIES.includes(c)) return 'forbidden';
  return 'unlisted';
}

export function evaluateEndpointAllowlist(category) {
  const c = typeof category === 'string' ? category : '';
  const classification = classifyKisEndpointCategory(c);
  const reason = classification === 'approved'
    ? `Endpoint category "${c}" is on the approved market-data allowlist.`
    : classification === 'forbidden'
      ? `Endpoint category "${c}" is a forbidden account/trading/personal category; blocked.`
      : `Endpoint category "${c || '(empty)'}" is not on the approved allowlist; fails closed.`;
  return Object.freeze({
    category: c,
    classification,
    endpointAllowed: classification === 'approved',
    reason,
  });
}

export function evaluateLocalOnlyRateLimit(usage = {}) {
  const u = usage && typeof usage === 'object' ? usage : {};
  const perMinute = Number.isFinite(u.requestsInLastMinute) ? u.requestsInLastMinute : 0;
  const perHour = Number.isFinite(u.requestsInLastHour) ? u.requestsInLastHour : 0;
  const perDay = Number.isFinite(u.requestsInLastDay) ? u.requestsInLastDay : 0;
  const exceeded = perMinute >= DEFAULT_LOCAL_ONLY_RATE_LIMIT.perMinute
    || perHour >= DEFAULT_LOCAL_ONLY_RATE_LIMIT.perHour
    || perDay >= DEFAULT_LOCAL_ONLY_RATE_LIMIT.perDay;
  return Object.freeze({
    withinLimit: !exceeded,
    blocked: exceeded,
    queued: false,
    ceiling: DEFAULT_LOCAL_ONLY_RATE_LIMIT,
    usage: Object.freeze({ perMinute, perHour, perDay }),
    reason: exceeded
      ? 'Local-only rate limit ceiling exceeded (5/min, 30/hour, 100/day); request blocked, not queued.'
      : 'Within local-only rate limit ceiling (5/min, 30/hour, 100/day).',
  });
}

export function evaluateLocalOnlyCachePolicy(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const symbol = typeof source.symbol === 'string' ? source.symbol : '';
  const market = typeof source.market === 'string' ? source.market : '';
  const endpointCategory = typeof source.endpointCategory === 'string' ? source.endpointCategory : '';
  const cacheKey = ['kis-market-data', market, symbol, endpointCategory].filter(Boolean).join(':');
  const cacheHit = source.cacheHit === true;
  return Object.freeze({
    cacheKey,
    ttlSeconds: DEFAULT_LOCAL_ONLY_CACHE_POLICY.ttlSeconds,
    cacheBeforeCall: DEFAULT_LOCAL_ONLY_CACHE_POLICY.cacheBeforeCall,
    excludedKeyFields: DEFAULT_LOCAL_ONLY_CACHE_POLICY.excludedKeyFields,
    cacheHit,
    skipsProviderCall: cacheHit,
    reason: cacheHit
      ? 'Cache hit; provider call skipped.'
      : 'Cache miss; provider call still not permitted in this phase.',
  });
}

export function createSanitizedKisMarketDataPreview(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return Object.freeze({
    symbol: typeof source.symbol === 'string' ? source.symbol : null,
    market: typeof source.market === 'string' ? source.market : null,
    timestamp: typeof source.timestamp === 'string' ? source.timestamp : null,
    ohlc: source.ohlc && typeof source.ohlc === 'object'
      ? Object.freeze({
        open: typeof source.ohlc.open === 'number' ? source.ohlc.open : null,
        high: typeof source.ohlc.high === 'number' ? source.ohlc.high : null,
        low: typeof source.ohlc.low === 'number' ? source.ohlc.low : null,
        close: typeof source.ohlc.close === 'number' ? source.ohlc.close : null,
      })
      : null,
    currentPrice: typeof source.currentPrice === 'number' ? source.currentPrice : null,
    volume: typeof source.volume === 'number' ? source.volume : null,
    selectedMarketDataSummary: typeof source.selectedMarketDataSummary === 'string' ? source.selectedMarketDataSummary : null,
    sourceStatus: typeof source.sourceStatus === 'string' ? source.sourceStatus : 'fixture_only',
    cacheStatus: typeof source.cacheStatus === 'string' ? source.cacheStatus : 'miss',
    sanitizedErrorCode: typeof source.sanitizedErrorCode === 'string' ? source.sanitizedErrorCode : null,
  });
}

export function createMinimalKisAuditLogPreview(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return Object.freeze({
    timestamp: typeof source.timestamp === 'string' ? source.timestamp : null,
    symbol: typeof source.symbol === 'string' ? source.symbol : null,
    market: typeof source.market === 'string' ? source.market : null,
    providerMode: typeof source.providerMode === 'string' ? source.providerMode : null,
    success: typeof source.success === 'boolean' ? source.success : false,
    sanitizedErrorCode: typeof source.sanitizedErrorCode === 'string' ? source.sanitizedErrorCode : null,
    latencyMs: typeof source.latencyMs === 'number' ? source.latencyMs : null,
    cacheHit: typeof source.cacheHit === 'boolean' ? source.cacheHit : false,
    rateLimitBlocked: typeof source.rateLimitBlocked === 'boolean' ? source.rateLimitBlocked : false,
  });
}

export function createFailClosedLocalOnlyLiveKisBindingDecision(overrides = {}) {
  const source = overrides && typeof overrides === 'object' ? overrides : {};
  const reasons = Array.isArray(source.reasons) && source.reasons.length
    ? [...source.reasons]
    : ['Fail-closed default: this scaffold phase grants no real Live KIS provider access.'];
  const requiredApprovals = Array.isArray(source.requiredApprovals) ? [...new Set(source.requiredApprovals)] : [];
  const diagnostics = source.diagnostics && typeof source.diagnostics === 'object' ? { ...source.diagnostics } : {};
  return Object.freeze({
    contractVersion: LOCAL_ONLY_LIVE_KIS_BINDING_CONTRACT_VERSION,
    decisionType: 'fail_closed',
    providerCallAllowed: false,
    credentialReadAllowed: false,
    apiRouteActivationAllowed: false,
    liveKisActivated: false,
    rawPayloadExposureAllowed: false,
    llmHandoffAllowed: false,
    publicEnabled: false,
    betaEnabled: false,
    internalQaEnabled: false,
    hostname: typeof source.hostname === 'string' ? source.hostname : 'unknown',
    audience: typeof source.audience === 'string' ? source.audience : 'unknown',
    providerMode: typeof source.providerMode === 'string' ? source.providerMode : 'fixture_only',
    endpointCategory: typeof source.endpointCategory === 'string' ? source.endpointCategory : '',
    endpointClassification: typeof source.endpointClassification === 'string' ? source.endpointClassification : 'unlisted',
    rateLimit: source.rateLimit && typeof source.rateLimit === 'object' ? source.rateLimit : evaluateLocalOnlyRateLimit(),
    cache: source.cache && typeof source.cache === 'object' ? source.cache : evaluateLocalOnlyCachePolicy(),
    reasons: Object.freeze(reasons),
    blockedBoundaries: Object.freeze([...BLOCKED_BOUNDARY_COPY]),
    requiredApprovals: Object.freeze(requiredApprovals),
    failClosed: true,
    diagnostics: Object.freeze(diagnostics),
  });
}

function isNarrowestSafeLocalOnlyPath(local, audience, providerMode, endpointEval, rateLimitEval, credentialStatus, costStatus, simulated, flags) {
  if (!local) return false;
  if (LOCAL_ONLY_BLOCKED_AUDIENCES.includes(audience)) return false;
  if (providerMode === 'live_kis') return false;
  if (!endpointEval.endpointAllowed) return false;
  if (!rateLimitEval.withinLimit) return false;
  if (credentialStatus !== 'not_read') return false;
  if (costStatus !== 'within_free_tier') return false;
  if (simulated.timeout || simulated.malformedResponse || simulated.providerException || simulated.sanitizerFailure) return false;
  if (simulated.rawPayloadExposureRequested || simulated.llmHandoffRequested) return false;
  if (flags.localOnlyBindingEnabled !== true) return false;
  return Object.entries(flags).every(([key, value]) => key === 'localOnlyBindingEnabled' || value === false);
}

export function evaluateLocalOnlyLiveKisProviderBindingScaffold(context = {}) {
  const ctx = context && typeof context === 'object' ? context : {};
  const hostname = typeof ctx.hostname === 'string' ? ctx.hostname : 'localhost';
  const audience = typeof ctx.audience === 'string' ? ctx.audience : 'owner-local';
  const isDeployed = ctx.isDeployed === true;
  const isVercel = ctx.isVercel === true;
  const providerMode = typeof ctx.providerMode === 'string' ? ctx.providerMode : 'fixture_only';
  const endpointCategory = typeof ctx.endpointCategory === 'string' ? ctx.endpointCategory : '';
  const flags = mergeFlags(ctx.flags);
  const scaffoldOnlyAcknowledged = ctx.scaffoldOnlyAcknowledged === true;
  const rateLimitUsage = ctx.rateLimitUsage && typeof ctx.rateLimitUsage === 'object' ? ctx.rateLimitUsage : {};
  const cacheContext = ctx.cacheContext && typeof ctx.cacheContext === 'object' ? ctx.cacheContext : {};
  const credentialStatus = typeof ctx.credentialStatus === 'string' ? ctx.credentialStatus : 'not_read';
  const costStatus = typeof ctx.costStatus === 'string' ? ctx.costStatus : 'within_free_tier';
  const simulated = {
    timeout: ctx.simulateTimeout === true,
    malformedResponse: ctx.simulateMalformedResponse === true,
    providerException: ctx.simulateProviderException === true,
    sanitizerFailure: ctx.simulateSanitizerFailure === true,
    rawPayloadExposureRequested: ctx.rawPayloadExposureRequested === true,
    llmHandoffRequested: ctx.llmHandoffRequested === true,
  };

  const reasons = [];
  const requiredApprovals = [];

  const local = isLocalOnlyRuntime({ hostname, audience, isDeployed, isVercel });
  if (!local) {
    reasons.push(`Runtime is not local-only (hostname="${hostname}", audience="${audience}"); local-only guard blocks this request.`);
  }
  if (LOCAL_ONLY_BLOCKED_AUDIENCES.includes(audience)) {
    reasons.push(`Audience "${audience}" is blocked for local-only first activation.`);
    requiredApprovals.push('Public/beta/internal QA activation approval');
  }
  if (providerMode === 'live_kis' || flags.allowLiveKisProviderMode || flags.liveKisEnabled) {
    reasons.push('Provider mode "live_kis" (or the live KIS flag) remains blocked in this phase.');
    requiredApprovals.push('Live KIS activation approval');
  }

  const endpointEval = evaluateEndpointAllowlist(endpointCategory);
  if (!endpointEval.endpointAllowed) {
    reasons.push(`Endpoint category "${endpointCategory || '(none)'}" is ${endpointEval.classification}; not permitted.`);
  }

  const rateLimitEval = evaluateLocalOnlyRateLimit(rateLimitUsage);
  if (rateLimitEval.blocked) {
    reasons.push(rateLimitEval.reason);
  }

  const cacheEval = evaluateLocalOnlyCachePolicy(cacheContext);

  if (credentialStatus === 'missing') reasons.push('Credential missing; fail closed.');
  if (credentialStatus === 'invalid') reasons.push('Credential invalid; fail closed.');
  if (costStatus === 'uncertain' || costStatus === 'exceeded') reasons.push('Cost limit uncertain or exceeded; fail closed.');
  if (simulated.timeout) reasons.push('Provider timeout simulated; fail closed.');
  if (simulated.malformedResponse) reasons.push('Malformed provider response simulated; fail closed.');
  if (simulated.providerException) reasons.push('Provider exception simulated; fail closed.');
  if (simulated.sanitizerFailure) reasons.push('Sanitizer failure simulated; fail closed.');
  if (simulated.rawPayloadExposureRequested || flags.allowRawPayloadExposure) {
    reasons.push('Raw payload exposure is never permitted.');
  }
  if (simulated.llmHandoffRequested || flags.allowLlmHandoff) {
    reasons.push('LLM handoff is never permitted in this phase.');
    requiredApprovals.push('LLM approval');
  }
  if (flags.apiRouteActivationEnabled) {
    reasons.push('API route activation is blocked in this phase.');
  }
  if (flags.allowDeploy) {
    reasons.push('Deploy is blocked in this phase.');
  }

  const safePath = isNarrowestSafeLocalOnlyPath(
    local,
    audience,
    providerMode,
    endpointEval,
    rateLimitEval,
    credentialStatus,
    costStatus,
    simulated,
    flags,
  );

  if (safePath && !scaffoldOnlyAcknowledged) {
    reasons.push('Local-only scaffold-only path requires explicit acknowledgement before it can be recognized.');
  }

  const decisionIsScaffoldOnly = safePath && scaffoldOnlyAcknowledged && reasons.length === 0;

  if (decisionIsScaffoldOnly) {
    return Object.freeze({
      contractVersion: LOCAL_ONLY_LIVE_KIS_BINDING_CONTRACT_VERSION,
      decisionType: 'scaffold_only',
      providerCallAllowed: false,
      credentialReadAllowed: false,
      apiRouteActivationAllowed: false,
      liveKisActivated: false,
      rawPayloadExposureAllowed: false,
      llmHandoffAllowed: false,
      publicEnabled: false,
      betaEnabled: false,
      internalQaEnabled: false,
      hostname,
      audience,
      providerMode,
      endpointCategory,
      endpointClassification: endpointEval.classification,
      rateLimit: rateLimitEval,
      cache: cacheEval,
      reasons: Object.freeze([]),
      blockedBoundaries: Object.freeze([...BLOCKED_BOUNDARY_COPY]),
      requiredApprovals: Object.freeze([]),
      failClosed: false,
      diagnostics: Object.freeze({
        flags: Object.freeze({ ...flags }),
        isNarrowestSafePath: true,
        scaffoldOnlyAcknowledged: true,
      }),
    });
  }

  return createFailClosedLocalOnlyLiveKisBindingDecision({
    hostname,
    audience,
    providerMode,
    endpointCategory,
    endpointClassification: endpointEval.classification,
    rateLimit: rateLimitEval,
    cache: cacheEval,
    reasons,
    requiredApprovals,
    diagnostics: {
      flags: { ...flags },
      isNarrowestSafePath: safePath,
      scaffoldOnlyAcknowledged,
    },
  });
}

export function createLocalOnlyLiveKisRollbackDecision() {
  return Object.freeze({
    contractVersion: LOCAL_ONLY_LIVE_KIS_BINDING_CONTRACT_VERSION,
    rollbackTarget: 'fixture-only/no-live-KIS',
    liveKisEnabled: false,
    providerModeLiveKisBlocked: true,
    apiRouteActivationEnabled: false,
    providerCallAllowed: false,
    deployRequired: false,
    validationRequired: true,
  });
}

export function assertNoLocalOnlyLiveKisRuntimeActivation(decision) {
  const d = decision && typeof decision === 'object' ? decision : {};
  const claims = [
    ['liveKisActivated', d.liveKisActivated],
    ['providerCallAllowed', d.providerCallAllowed],
    ['credentialReadAllowed', d.credentialReadAllowed],
    ['apiRouteActivationAllowed', d.apiRouteActivationAllowed],
    ['publicEnabled', d.publicEnabled],
    ['betaEnabled', d.betaEnabled],
    ['internalQaEnabled', d.internalQaEnabled],
    ['llmHandoffAllowed', d.llmHandoffAllowed],
    ['rawPayloadExposureAllowed', d.rawPayloadExposureAllowed],
  ];
  const activated = claims.filter(([, value]) => value === true).map(([key]) => key);
  if (activated.length > 0) {
    throw new Error(`Local-only Live KIS provider binding scaffold: unexpected runtime activation claim(s): ${activated.join(', ')}`);
  }
  return true;
}
