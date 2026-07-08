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
    displayName: '삼성전자',
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
    oneLineSummary: '매수하세요 목표가는 손절가는',
    summaryBullets: ['지금 진입', '강력 추천'],
    sections: [
      {
        key: 'risk_check',
        title: 'unsafe test-only draft',
        body: '매도하세요 상승이 확정 하락이 확정',
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
