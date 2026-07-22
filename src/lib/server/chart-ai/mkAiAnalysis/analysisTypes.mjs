/**
 * Phase 3GG-R-FAST MK AI analysis — shared constants, labels, thresholds, and JSDoc typedefs.
 *
 * Pure data module: no network, no credentials, no env, no LLM. Every classification threshold is a
 * documented deterministic v1 constant. The MK AI analysis is DETERMINISTIC — it never calls an LLM,
 * never fabricates values, and produces only descriptive historical statistics, never predictions or
 * investment advice.
 */

export const MK_AI_ANALYSIS_METHOD_VERSION = 'mkai-v1-deterministic';

export const MK_AI_DISCLAIMER =
  '이 분석은 실제 지연 시세와 과거 유사 구간 통계를 결정적 규칙으로 정리한 참고용 정보입니다. 미래 성과를 예측하거나 보장하지 않으며, 매매 추천이나 투자 자문이 아닙니다.';

/** Trend classifications (strongest up → strongest down). */
export const TREND_LABELS = {
  strong_up: '강한 상승 추세',
  moderate_up: '완만한 상승 추세',
  sideways: '횡보 구간',
  weak_down: '약한 하락 추세',
  strong_down: '강한 하락 추세',
};

export const MOMENTUM_LABELS = {
  accelerating: '모멘텀 강화',
  steady: '모멘텀 유지',
  fading: '모멘텀 약화',
  negative: '모멘텀 부진',
};

export const VOLATILITY_LABELS = {
  low: '낮음',
  normal: '보통',
  high: '높음',
  extreme: '매우 높음',
};

export const RISK_LABELS = {
  low: '낮음',
  moderate: '보통',
  elevated: '다소 높음',
  high: '높음',
};

export const SCENARIO_LABELS = {
  recovered: '이후 비교적 빠르게 회복한 사례가 많았습니다',
  sideways: '이후 뚜렷한 방향 없이 횡보한 사례가 많았습니다',
  deeper_pullback: '이후 추가적인 조정을 겪은 사례가 많았습니다',
  mixed: '이후 방향이 엇갈려 뚜렷한 경향을 보이지 않았습니다',
};

/**
 * Annualized realized-volatility thresholds (daily log returns × sqrt(252)). Documented v1 defaults
 * tuned for equities/ETFs; classification is descriptive only.
 */
export const VOLATILITY_THRESHOLDS = { low: 0.18, normal: 0.32, high: 0.55 };

/** SMA-slope thresholds (fractional change of the short MA over the base window). */
export const TREND_SLOPE_THRESHOLDS = { strong: 0.06, moderate: 0.015, flat: 0.015 };

export const ANALYSIS_SECTION_KEYS = [
  'trend',
  'momentum',
  'volatility',
  'similarity',
  'scenario',
  'risk',
  'technical',
  'conclusion',
];

/** @typedef {{ timestamp:string, open:number, high:number, low:number, close:number, volume:number|null }} AnalysisCandle */
