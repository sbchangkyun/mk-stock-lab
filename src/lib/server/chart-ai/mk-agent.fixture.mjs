import { runSimilarPatternAgent } from './similar-pattern-agent.mjs';
import { createSimilarPatternFixtureInput, createInsufficientSimilarPatternFixtureInput } from './similar-pattern-agent.fixture.mjs';
import { createMkAgentInput } from './mk-agent.mjs';

const createDefaultSimilarPattern = () => runSimilarPatternAgent(createSimilarPatternFixtureInput());

const supportResistanceObservations = Object.freeze([
  { price: 72000, label: '하단 관찰 체크포인트' },
  { price: 75000, label: '중간 시나리오 체크포인트' },
  { price: 78000, label: '상단 관찰 체크포인트' },
]);

export function createMkAgentFixtureInput(overrides = {}) {
  return createMkAgentInput({
    market: 'KR',
    symbol: '005930',
    displayName: '?쇱꽦?꾩옄',
    asOfDate: '2024-06-29',
    selectedTab: 'mk_agent',
    uiMode: 'pc_card',
    language: 'ko',
    similarPattern: createDefaultSimilarPattern(),
    supportResistanceObservations: supportResistanceObservations.map((item) => ({ ...item })),
    usageContext: {
      openBetaDailyFreeUses: 3,
      usedToday: 1,
      remainingToday: 2,
      persistence: 'none',
    },
    ...overrides,
  });
}

export function createMkAgentUsageExceededFixtureInput() {
  return createMkAgentFixtureInput({
    usageContext: {
      openBetaDailyFreeUses: 3,
      usedToday: 3,
      remainingToday: 0,
      persistence: 'none',
    },
  });
}

export function createMkAgentMissingSimilarPatternFixtureInput() {
  return createMkAgentFixtureInput({
    similarPattern: null,
  });
}

export function createMkAgentDataInsufficientFixtureInput() {
  return createMkAgentFixtureInput({
    similarPattern: runSimilarPatternAgent(createInsufficientSimilarPatternFixtureInput()),
  });
}

export function createUnsafeMkAgentDraftForSanitizerFixture() {
  return {
    oneLineSummary: '留ㅼ닔?섏꽭?? 紐⑺몴媛?? ?먯젅媛??',
    summaryBullets: ['吏湲? 吏꾩엯', '媛뺣젰 異붿쿇'],
    sections: [
      {
        key: 'risk_check',
        title: 'unsafe test-only draft',
        body: '留ㅻ룄?섏꽭?? ?곸듅???뺤젙 ?섎씫???뺤젙',
        bullets: [],
        severity: 'test',
        confidence: 'test',
        limitations: ['test-only unsafe sanitizer fixture'],
      },
    ],
    usageNotice: 'test-only',
    disclaimer: 'test-only',
  };
}
