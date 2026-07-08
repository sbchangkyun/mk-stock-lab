export const DEFAULT_MK_AGENT_OPTIONS = Object.freeze({
  market: 'KR',
  selectedTab: 'mk_agent',
  uiModes: Object.freeze(['pc_card', 'mobile_bottom_sheet']),
  language: 'ko',
  openBetaDailyFreeUses: 3,
});

export const MK_AGENT_SECTION_KEYS = Object.freeze({
  phaseSupply: 'phase_supply',
  strategyCheckpoints: 'strategy_checkpoints',
  pricePattern: 'price_pattern',
  technicalIndicators: 'technical_indicators',
  supportResistance: 'support_resistance',
  similarHistory: 'similar_history',
  riskCheck: 'risk_check',
});

export const MK_AGENT_STATUS = Object.freeze({
  ready: 'mk_report_ready',
  similarPatternUnavailable: 'blocked_similar_pattern_unavailable',
  usageExceeded: 'blocked_usage_exceeded',
  dataInsufficient: 'blocked_data_insufficient',
  kisUnavailable: 'blocked_kis_unavailable',
  llmUnavailable: 'blocked_llm_unavailable',
  sanitizerFailure: 'blocked_sanitizer_failure',
  failClosed: 'fail_closed',
});

const AGENT_NAME = 'MK ?먯씠?꾪듃';
const STRATEGY_TITLE = '?꾨왂 泥댄겕?ъ씤??';
const USAGE_NOTICE = '?쒖삤?덈쿋??먯꽌??怨꾩젙???섎（ 3?뚭퉴吏 ?ъ슜?????덉뼱????';

const SUCCESS_SAFETY = Object.freeze({
  containsBuySellRecommendation: false,
  containsTargetPrice: false,
  containsStopLossInstruction: false,
  rawPayloadExposed: false,
  secretExposed: false,
  llmCalled: false,
});

const requiredSections = Object.freeze([
  MK_AGENT_SECTION_KEYS.phaseSupply,
  MK_AGENT_SECTION_KEYS.strategyCheckpoints,
  MK_AGENT_SECTION_KEYS.pricePattern,
  MK_AGENT_SECTION_KEYS.technicalIndicators,
  MK_AGENT_SECTION_KEYS.supportResistance,
  MK_AGENT_SECTION_KEYS.similarHistory,
  MK_AGENT_SECTION_KEYS.riskCheck,
]);

const safeError = (code, message) => ({ code, message });
const cloneSafety = () => ({ ...SUCCESS_SAFETY });
const pct = (value) => (Number.isFinite(value) ? `${value.toFixed(2)}%` : '확인 제한');
const textValue = (value, fallback = '') => (typeof value === 'string' && value.trim() ? value.trim() : fallback);

export function createMkAgentInput(overrides = {}) {
  return {
    market: 'KR',
    symbol: '',
    displayName: '',
    asOfDate: '',
    selectedTab: 'mk_agent',
    uiMode: 'pc_card',
    language: 'ko',
    similarPattern: null,
    supportResistanceObservations: [],
    usageContext: {
      openBetaDailyFreeUses: DEFAULT_MK_AGENT_OPTIONS.openBetaDailyFreeUses,
      usedToday: 0,
      remainingToday: DEFAULT_MK_AGENT_OPTIONS.openBetaDailyFreeUses,
      persistence: 'none',
    },
    ...overrides,
  };
}

export function detectForbiddenInvestmentLanguage(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const forbiddenPatterns = [
    '留ㅼ닔?섏꽭??',
    '留ㅻ룄?섏꽭??',
    '吏湲?吏꾩엯',
    '紐⑺몴媛??',
    '?먯젅媛??',
    '媛뺣젰 異붿쿇',
    '?곸듅???뺤젙',
    '?섎씫???뺤젙',
    '매수하세요',
    '매도하세요',
    '목표가',
    '손절가',
    '강력 추천',
    '지금 진입',
  ];
  return forbiddenPatterns.filter((pattern) => text.includes(pattern));
}

const similarSafetyIsClean = (similarPattern) => (
  similarPattern?.safety?.rawKisPayloadExposed === false
  && similarPattern?.safety?.rawProviderErrorExposed === false
  && similarPattern?.safety?.secretExposed === false
  && similarPattern?.safety?.buySellRecommendation === false
);

export function validateMkAgentInput(input) {
  if (!input || typeof input !== 'object') return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'Input must be an object.' };
  if (input.market !== 'KR') return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'Market must be KR.' };
  if (typeof input.symbol !== 'string' || input.symbol.trim().length === 0) return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'Symbol is required.' };
  if (typeof input.displayName !== 'string' || input.displayName.trim().length === 0) return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'Display name is required.' };
  if (typeof input.asOfDate !== 'string' || input.asOfDate.trim().length === 0) return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'As-of date is required.' };
  if (input.selectedTab !== 'mk_agent') return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'Selected tab must be mk_agent.' };
  if (!DEFAULT_MK_AGENT_OPTIONS.uiModes.includes(input.uiMode)) return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'UI mode must be pc_card or mobile_bottom_sheet.' };
  if (input.language !== 'ko') return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'Language must be ko.' };

  const dailyLimit = input.usageContext?.openBetaDailyFreeUses ?? DEFAULT_MK_AGENT_OPTIONS.openBetaDailyFreeUses;
  const usedToday = input.usageContext?.usedToday ?? 0;
  if (!Number.isFinite(dailyLimit) || dailyLimit !== 3) return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'Usage limit must remain sanitized.' };
  if (Number.isFinite(usedToday) && usedToday >= dailyLimit) return { ok: false, status: MK_AGENT_STATUS.usageExceeded, message: 'Open beta daily usage exceeded.' };

  if (!input.similarPattern) return { ok: false, status: MK_AGENT_STATUS.similarPatternUnavailable, message: 'Similar Pattern output is required.' };
  if (input.similarPattern.status === 'blocked_data_insufficient' || input.similarPattern.status === 'blocked_candidate_insufficient') {
    return { ok: false, status: MK_AGENT_STATUS.dataInsufficient, message: 'Similar Pattern data is insufficient.' };
  }
  if (input.similarPattern.status === 'blocked_kis_unavailable') return { ok: false, status: MK_AGENT_STATUS.kisUnavailable, message: 'KIS is unavailable.' };
  if (!input.similarPattern.ok || input.similarPattern.status !== 'similar_patterns_ready') {
    return { ok: false, status: MK_AGENT_STATUS.similarPatternUnavailable, message: 'Similar Pattern output is unavailable.' };
  }
  if (!similarSafetyIsClean(input.similarPattern)) return { ok: false, status: MK_AGENT_STATUS.failClosed, message: 'Similar Pattern safety flags are not clean.' };
  return { ok: true };
}

export function summarizeSimilarPatternForMkAgent(similarPattern) {
  const topMatch = similarPattern?.matches?.[0] ?? null;
  const aggregate = similarPattern?.aggregateOutcomes ?? {};
  const d20Positive = aggregate.positiveCountD20 ?? 0;
  const d20Negative = aggregate.negativeCountD20 ?? 0;
  const d20Balance = d20Positive > d20Negative ? '상승 쪽 사례가 조금 더 많았어요' : d20Negative > d20Positive ? '하락 쪽 사례가 조금 더 많았어요' : '상승과 하락 사례가 비슷했어요';
  return {
    matchCount: similarPattern?.summary?.matchCount ?? 0,
    topScoreLabel: textValue(topMatch?.scoreLabel, '확인 제한'),
    topScore: topMatch?.similarityScore ?? null,
    topForwardReturnD5Pct: topMatch?.forwardReturnD5Pct ?? null,
    topForwardReturnD20Pct: topMatch?.forwardReturnD20Pct ?? null,
    aggregateD20DirectionBalance: d20Balance,
    meaning: 'historical similarity does not predict the future',
  };
}

export function createMkAgentDisclaimer() {
  return '이 분석은 참고용이며 매수·매도 추천이 아니고 투자 자문도 아닙니다. 최종 투자 판단과 책임은 사용자에게 있어요.';
}

const makeSection = ({ key, title, body, bullets, severity = 'info', confidence = 'medium', limitations = [] }) => ({
  key,
  title,
  body,
  bullets,
  severity,
  confidence,
  limitations,
});

const supportResistanceText = (observations) => {
  if (!Array.isArray(observations) || observations.length === 0) {
    return '관찰 가능한 가격 체크포인트는 fixture 입력에서 제한적으로만 제공됐어요.';
  }
  return observations
    .filter((item) => Number.isFinite(item?.price))
    .map((item) => `${item.price.toLocaleString('ko-KR')}원은 ${textValue(item.label, '관찰 체크포인트')}로만 볼게요`)
    .join(', ');
};

export function createDeterministicMkAgentReport(input) {
  const similarSummary = summarizeSimilarPatternForMkAgent(input.similarPattern);
  const displayName = textValue(input.displayName, input.symbol);
  const supportText = supportResistanceText(input.supportResistanceObservations);

  const sections = [
    makeSection({
      key: MK_AGENT_SECTION_KEYS.phaseSupply,
      title: '援ш컙쨌?섍툒',
      body: `${AGENT_NAME}가 ${displayName}의 최근 흐름을 구간별로 정리했어요. 유사 과거 구간은 ${similarSummary.matchCount}개로 압축됐고, 현재 흐름은 가격 자체보다 모양과 속도 중심으로 봤어요.`,
      bullets: [
        '현재 구간은 정규화된 경로 기준으로 비교했어요.',
        '거래량은 MVP에서 보조 단서로만 다뤄요.',
      ],
      confidence: 'medium',
      limitations: ['fixture-only Similar Pattern output 기반입니다.'],
    }),
    makeSection({
      key: MK_AGENT_SECTION_KEYS.strategyCheckpoints,
      title: STRATEGY_TITLE,
      body: '지금은 행동 지시가 아니라 관찰 체크포인트를 정리하는 단계예요. 가격대는 시나리오 관찰선으로만 참고하고, 진입·청산 지시는 만들지 않아요.',
      bullets: [
        `${supportText}.`,
        '유사도가 높아도 미래 방향이 정해진 것은 아니에요.',
      ],
      severity: 'watch',
      confidence: 'medium',
      limitations: ['No buy/sell recommendation.'],
    }),
    makeSection({
      key: MK_AGENT_SECTION_KEYS.pricePattern,
      title: '媛寃??⑦꽩',
      body: `상위 유사 구간의 라벨은 ${similarSummary.topScoreLabel}이고 점수는 ${similarSummary.topScore ?? '확인 제한'}점이에요. 같은 종목의 과거 모양과 닮은 정도만 뜻해요.`,
      bullets: [
        '원시 가격끼리 직접 비교하지 않았어요.',
        '정규화 경로와 로그수익률 기반 Similar Pattern 결과를 사용했어요.',
      ],
      confidence: 'medium',
      limitations: ['historical similarity does not predict the future.'],
    }),
    makeSection({
      key: MK_AGENT_SECTION_KEYS.technicalIndicators,
      title: '湲곗닠??吏??',
      body: '이번 deterministic report는 보조 지표를 과장하지 않고, Similar Pattern 점수 구성과 방향 일치 흐름을 중심으로 요약해요.',
      bullets: [
        `상위 매치의 D5 과거 수익률은 ${pct(similarSummary.topForwardReturnD5Pct)}였어요.`,
        `상위 매치의 D20 과거 수익률은 ${pct(similarSummary.topForwardReturnD20Pct)}였어요.`,
      ],
      confidence: 'medium',
      limitations: ['보조 지표는 fixture report 계약에서 제한적으로만 표현됩니다.'],
    }),
    makeSection({
      key: MK_AGENT_SECTION_KEYS.supportResistance,
      title: '吏吏쨌???',
      body: '지지·저항처럼 보이는 가격대는 단정이 아니라 관찰 지점이에요. 돌파나 이탈을 확정 표현으로 말하지 않아요.',
      bullets: [
        supportText,
        '가격대는 체크포인트와 시나리오 언어로만 표시합니다.',
      ],
      severity: 'watch',
      confidence: 'low',
      limitations: ['실시간 호가, 수급, 뉴스는 반영하지 않았어요.'],
    }),
    makeSection({
      key: MK_AGENT_SECTION_KEYS.similarHistory,
      title: '?좎궗 怨쇨굅 ?먮쫫',
      body: `비슷했던 과거 흐름의 D20 방향 균형은 "${similarSummary.aggregateD20DirectionBalance}"로 요약돼요. 단, 과거 유사도는 미래 예측이 아니에요.`,
      bullets: [
        `Top match score label: ${similarSummary.topScoreLabel}.`,
        'historical similarity does not predict the future.',
      ],
      confidence: 'medium',
      limitations: ['Same-symbol historical fixture only.'],
    }),
    makeSection({
      key: MK_AGENT_SECTION_KEYS.riskCheck,
      title: '由ъ뒪??泥댄겕',
      body: '리스크는 방향을 맞히기보다 틀릴 수 있는 지점을 먼저 보는 데 의미가 있어요.',
      bullets: [
        '유사 과거 흐름이 엇갈린 경우 변동성 확대 가능성을 열어둬요.',
        '이 문서는 reference only이며 not investment advice입니다.',
      ],
      severity: 'caution',
      confidence: 'medium',
      limitations: ['No LLM. No live KIS. fixture-only report.'],
    }),
  ];

  return {
    oneLineSummary: `${AGENT_NAME} 기준으로 ${displayName}은 과거 ${similarSummary.matchCount}개 유사 흐름과 비교 가능한 상태예요. 다만 과거 유사도는 미래를 예측하지 않아요.`,
    summaryBullets: [
      `${AGENT_NAME}는 Similar Pattern Agent의 sanitized output만 사용했어요.`,
      `상위 유사 라벨은 ${similarSummary.topScoreLabel}입니다.`,
      '매수·매도 추천이나 특정 가격 지시는 만들지 않아요.',
    ],
    sections,
    usageNotice: USAGE_NOTICE,
    disclaimer: createMkAgentDisclaimer(),
  };
}

export function sanitizeMkAgentReport(report, options = {}) {
  const findings = detectForbiddenInvestmentLanguage(report);
  if (findings.length > 0 && options.allowUnsafeFixture !== true) {
    return {
      ok: false,
      status: MK_AGENT_STATUS.sanitizerFailure,
      report: null,
      findings,
    };
  }
  return {
    ok: true,
    status: MK_AGENT_STATUS.ready,
    report,
    findings,
  };
}

export function createBlockedMkAgentOutput(status, input, message) {
  return {
    ok: false,
    status,
    agentName: AGENT_NAME,
    uiMode: input?.uiMode ?? 'pc_card',
    report: null,
    safety: cloneSafety(),
    error: safeError(status, message),
  };
}

export function runMkAgent(input) {
  try {
    const validation = validateMkAgentInput(input);
    if (!validation.ok) return createBlockedMkAgentOutput(validation.status, input, validation.message);

    const report = createDeterministicMkAgentReport(input);
    const sanitized = sanitizeMkAgentReport(report);
    if (!sanitized.ok) {
      return createBlockedMkAgentOutput(MK_AGENT_STATUS.sanitizerFailure, input, 'MK Agent sanitizer failed closed.');
    }

    const sectionKeys = sanitized.report.sections.map((section) => section.key);
    if (!requiredSections.every((key) => sectionKeys.includes(key))) {
      return createBlockedMkAgentOutput(MK_AGENT_STATUS.failClosed, input, 'MK Agent section contract failed.');
    }

    return {
      ok: true,
      status: MK_AGENT_STATUS.ready,
      agentName: AGENT_NAME,
      uiMode: input.uiMode,
      report: sanitized.report,
      safety: cloneSafety(),
      error: null,
    };
  } catch {
    return createBlockedMkAgentOutput(MK_AGENT_STATUS.failClosed, input, 'MK Agent failed closed.');
  }
}

// Contract markers: MK ?먯씠?꾪듃, ?꾨왂 泥댄겕?ъ씤??,
// No LLM, No buy/sell recommendation, reference only, not investment advice.
