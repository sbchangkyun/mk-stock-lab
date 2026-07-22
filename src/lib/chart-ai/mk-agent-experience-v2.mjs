/**
 * Phase 3GG-T-HF6AB MK Agent experience V2 — pure presentation module.
 *
 * Consumes ONLY the already-real `mk-analysis.json` response shape (instrument/dataStatus/
 * dimensions/scores/dataCompletenessConfidence/formatted) and derives the V2 information
 * architecture: a grammatically-correct one-sentence conclusion, current flow status, six
 * direction-aware score cards, four strategy-checkpoint groups (derived only from real values —
 * no RSI/MACD/Bollinger/ATR/support-resistance), accordion descriptors, a data-quality explanation,
 * and the single common disclaimer. No DOM, no fetch, no environment, no randomness, no wall-clock,
 * no provider imports, no secrets — safe to import into a browser bundle.
 *
 * Never uses direct buy/sell commands or guaranteed-return language.
 */

const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const numOrDash = (v, suffix = '') => (isFiniteNumber(v) ? `${v}${suffix}` : '데이터 부족');
const signedOrDash = (v, suffix = '') => (isFiniteNumber(v) ? `${v >= 0 ? '+' : ''}${v}${suffix}` : '데이터 부족');

// ---- Korean particle selection (Hangul final-consonant aware; fixes the literal "은(는)" bug) ----

const lastChar = (str) => (typeof str === 'string' && str.length > 0 ? str[str.length - 1] : '');

/** true = has a final consonant (batchim), false = no final consonant, null = not a Hangul syllable. */
const hasHangulFinalConsonant = (word) => {
  const ch = lastChar(word);
  if (!ch) return null;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28 !== 0;
};

/**
 * Picks the grammatically correct particle for a Korean-ending word (batchim → `withFinal`,
 * no batchim → `withoutFinal`). Non-Hangul endings (e.g. English tickers like "AAPL") deterministically
 * fall back to the no-final-consonant form, the conventional choice for Latin-alphabet loanwords.
 */
export const pickParticle = (word, withFinal, withoutFinal) => {
  const final = hasHangulFinalConsonant(word);
  return final === true ? withFinal : withoutFinal;
};

export const topicParticle = (word) => pickParticle(word, '은', '는');
export const subjectParticle = (word) => pickParticle(word, '이', '가');
export const objectParticle = (word) => pickParticle(word, '을', '를');

// ---- One-sentence conclusion ----

export const buildOneSentenceConclusion = (mkai) => {
  const name = mkai?.instrument?.displayName || mkai?.instrument?.symbol || '이 종목';
  const d = mkai?.dimensions;
  if (!d) return `${name}${topicParticle(name)} 분석에 필요한 데이터가 충분하지 않습니다.`;
  const trendText = d.trend?.labelText || '추세 불명';
  const momentumText = d.momentum?.labelText || '모멘텀 불명';
  const riskText = d.risk?.labelText || '리스크 불명';
  return (
    `${name}${topicParticle(name)} 현재 ${trendText} 상태이며 ${momentumText} 흐름을 보이고 있고, ` +
    `위험 수준은 ${riskText}로 나타났습니다.`
  );
};

// ---- Current flow status ----

export const buildFlowStatus = (mkai) => {
  const ds = mkai?.dataStatus;
  if (!ds) return { label: '데이터 상태를 확인할 수 없습니다.', detail: '' };
  const parts = [`실제 지연 시세 ${numOrDash(ds.barCount, '거래일')} 기준`];
  parts.push(ds.similarityOk ? `과거 유사 구간 ${numOrDash(ds.matchCount, '건')} 비교 완료` : '과거 유사 구간 비교 불가');
  return {
    label: parts.join(' · '),
    detail: mkai?.methodVersion ? `분석 방식: ${mkai.methodVersion}` : '',
  };
};

// ---- Score cards (direction-aware) ----

const clampScore = (v) => (isFiniteNumber(v) ? Math.max(0, Math.min(100, v)) : null);

const bandOf = (score) => {
  if (score === null) return 'unknown';
  if (score >= 80) return 'very_high';
  if (score >= 60) return 'high';
  if (score >= 40) return 'mid';
  if (score >= 20) return 'low';
  return 'very_low';
};

const FAVORABLE_LABELS = { very_high: '매우 강함', high: '강함', mid: '보통', low: '약함', very_low: '매우 약함', unknown: '데이터 부족' };
const RISK_LABELS_BAND = { very_high: '매우 높음', high: '높음', mid: '보통', low: '낮음', very_low: '매우 낮음', unknown: '데이터 부족' };
const NEUTRAL_LEVEL_LABELS = { very_high: '매우 높음', high: '높음', mid: '보통', low: '낮음', very_low: '매우 낮음', unknown: '데이터 부족' };

/**
 * Six score cards: 추세 강도 / 모멘텀 / 가격 안정성 (all higher = more favorable), 패턴 유사도 (higher =
 * more similar to past patterns, NOT a probability of rising), 위험 수준 (higher = MORE risk, not
 * better), 데이터 품질 (higher = more complete input data, NOT prediction confidence).
 */
export const buildScoreCards = (mkai) => {
  const scores = mkai?.scores || {};
  const dataQuality = clampScore(mkai?.dataCompletenessConfidence);
  const trend = clampScore(scores.trend);
  const momentum = clampScore(scores.momentum);
  const stability = clampScore(scores.volatilityStability);
  const similarity = clampScore(scores.similarity);
  const risk = clampScore(scores.risk);

  return [
    {
      key: 'trend',
      label: '추세 강도',
      score: trend,
      statusLabel: FAVORABLE_LABELS[bandOf(trend)],
      meaning: '점수가 높을수록 최근 가격이 이동평균 대비 뚜렷한 추세를 보인다는 의미입니다.',
      direction: 'higher-stronger-trend',
    },
    {
      key: 'momentum',
      label: '모멘텀',
      score: momentum,
      statusLabel: FAVORABLE_LABELS[bandOf(momentum)],
      meaning: '점수가 높을수록 최근 가격 상승의 속도와 지속성이 강하다는 의미입니다.',
      direction: 'higher-stronger-momentum',
    },
    {
      key: 'stability',
      label: '가격 안정성',
      score: stability,
      statusLabel: FAVORABLE_LABELS[bandOf(stability)],
      meaning: '점수가 높을수록 최근 가격 변동성이 낮아 상대적으로 안정적이라는 의미입니다.',
      direction: 'higher-more-stable',
    },
    {
      key: 'similarity',
      label: '패턴 유사도',
      score: similarity,
      statusLabel: NEUTRAL_LEVEL_LABELS[bandOf(similarity)],
      meaning: '점수가 높을수록 과거 구간과 가격 패턴이 유사하다는 의미이며, 상승 가능성을 뜻하지 않습니다.',
      direction: 'higher-more-similar-not-more-likely-to-rise',
    },
    {
      key: 'risk',
      label: '위험 수준',
      score: risk,
      statusLabel: RISK_LABELS_BAND[bandOf(risk)],
      meaning: '점수가 높을수록 변동성과 과거 낙폭이 커 위험이 크다는 의미입니다 (높을수록 유리하다는 뜻이 아닙니다).',
      direction: 'higher-more-risk-not-better',
    },
    {
      key: 'dataQuality',
      label: '데이터 품질',
      score: dataQuality,
      statusLabel: NEUTRAL_LEVEL_LABELS[bandOf(dataQuality)],
      meaning: '점수가 높을수록 분석에 사용된 실제 데이터가 충분하다는 의미이며, 예측 신뢰도를 뜻하지 않습니다.',
      direction: 'higher-more-complete-not-confidence',
    },
  ].map((c) => ({ ...c, visualPercent: c.score === null ? 0 : c.score }));
};

// ---- Strategy checkpoints (HF6B) — real derivable values only; no RSI/MACD/BB/ATR/support-resistance ----

export const buildStrategyCheckpoints = (mkai) => {
  const d = mkai?.dimensions;
  if (!d) return null;
  const tm = d.trend?.metrics || {};
  const mm = d.momentum?.metrics || {};
  const vm = d.volatility?.metrics || {};
  const sm = d.similarity?.metrics || {};

  const lastClose = tm.lastClose;
  const sma20 = tm.sma20;
  const sma60 = tm.sma60;
  const swingHigh20 = tm.recentSwingHigh20;
  const swingLow20 = tm.recentSwingLow20;

  const groupA = [];
  if (isFiniteNumber(lastClose) && isFiniteNumber(sma20)) {
    groupA.push(
      lastClose > sma20
        ? '현재가가 이미 20일 이동평균 위에 위치해 있습니다.'
        : `현재가가 20일 이동평균(${sma20})을 상향 돌파하는지 확인이 필요합니다.`,
    );
  }
  if (isFiniteNumber(swingHigh20)) {
    groupA.push(`최근 20거래일 고점(${swingHigh20}) 돌파 여부를 관찰 지표로 참고할 수 있습니다.`);
  }
  if (isFiniteNumber(mm.aboveMaRatioPct)) {
    groupA.push(`20일 이동평균 상회 비율(${mm.aboveMaRatioPct}%)이 높아지는 흐름인지 확인합니다.`);
  }
  if (!groupA.length) groupA.push('상승 전환을 확인할 수 있는 데이터가 아직 충분하지 않습니다.');

  const groupB = [];
  if (isFiniteNumber(swingLow20)) {
    groupB.push(`최근 20거래일 저점(${swingLow20}) 하향 이탈 여부를 관찰 지표로 참고할 수 있습니다.`);
  }
  if (isFiniteNumber(lastClose) && isFiniteNumber(sma60)) {
    groupB.push(
      lastClose < sma60
        ? '현재가가 이미 60일 이동평균 아래에 위치해 있습니다.'
        : `현재가가 60일 이동평균(${sma60}) 아래로 이탈하는지 확인이 필요합니다.`,
    );
  }
  if (isFiniteNumber(sm.averageMaxDrawdownPct)) {
    groupB.push(`과거 유사 구간의 평균 최대 낙폭은 ${signedOrDash(sm.averageMaxDrawdownPct, '%')}였습니다. 유사한 폭의 조정 가능성을 참고할 수 있습니다.`);
  }
  if (isFiniteNumber(vm.annualizedVolatility20Pct) && vm.annualizedVolatility20Pct >= 55) {
    groupB.push(`최근 연율화 변동성(${vm.annualizedVolatility20Pct}%)이 높은 편으로, 가격 변동 폭이 커질 수 있다는 점을 참고합니다.`);
  }
  if (!groupB.length) groupB.push('하락 위험 확대를 확인할 수 있는 데이터가 아직 충분하지 않습니다.');

  const groupC = [
    `추세: ${d.trend?.labelText || '데이터 부족'} (점수 ${numOrDash(d.trend?.score)})`,
    `모멘텀: ${d.momentum?.labelText || '데이터 부족'} (점수 ${numOrDash(d.momentum?.score)})`,
    `변동성: ${d.volatility?.labelText || '데이터 부족'}`,
    `위험 수준: ${d.risk?.labelText || '데이터 부족'}`,
  ];

  const groupD = [];
  if (isFiniteNumber(swingLow20)) groupD.push({ label: '최근 저점 (20거래일)', value: swingLow20 });
  if (isFiniteNumber(swingHigh20)) groupD.push({ label: '최근 고점 (20거래일)', value: swingHigh20 });
  if (isFiniteNumber(sma20)) groupD.push({ label: '20일 이동평균', value: sma20 });
  if (isFiniteNumber(sma60)) groupD.push({ label: '60일 이동평균', value: sma60 });

  return {
    groupA: { key: 'groupA', title: 'A. 상승 전환 확인 조건', items: groupA },
    groupB: { key: 'groupB', title: 'B. 하락 위험 확대 조건', items: groupB },
    groupC: { key: 'groupC', title: 'C. 현재 관찰 우선순위', items: groupC },
    groupD: { key: 'groupD', title: 'D. 핵심 가격대', items: groupD },
  };
};

// ---- Accordion descriptors (real ARIA state; default-open limited to the first section) ----

export const buildAccordionDescriptors = (formatted) => {
  const sections = Array.isArray(formatted?.sections) ? formatted.sections : [];
  return sections.map((s, i) => ({
    key: s.key,
    title: s.title,
    body: s.body,
    defaultOpen: i === 0,
  }));
};

// ---- Data-quality explanation (100 ≠ prediction confidence) ----

export const buildDataQualityExplanation = (mkai) => {
  const score = mkai?.dataCompletenessConfidence;
  const scoreText = isFiniteNumber(score) ? `${score}점` : '데이터 부족';
  return (
    `데이터 품질 ${scoreText}은 분석에 사용된 실제 데이터(과거 기간 길이, 이동평균 확보 여부, 유사 구간 확보 개수)가 ` +
    `얼마나 충분한지를 나타내는 지표입니다. 이는 향후 가격 방향에 대한 예측 신뢰도나 확률을 의미하지 않습니다.`
  );
};

// ---- Common disclaimer (single source: the server's already-approved disclaimer text) ----

export const resolveCommonDisclaimer = (mkai) => mkai?.formatted?.disclaimer || null;

// ---- Full composed presentation model ----

export const buildMkAgentExperience = (mkai) => {
  if (!mkai || mkai.ok !== true || !mkai.formatted || mkai.formatted.ok !== true) return null;
  return {
    conclusion: buildOneSentenceConclusion(mkai),
    flowStatus: buildFlowStatus(mkai),
    scoreCards: buildScoreCards(mkai),
    strategyCheckpoints: buildStrategyCheckpoints(mkai),
    accordionSections: buildAccordionDescriptors(mkai.formatted),
    dataQualityExplanation: buildDataQualityExplanation(mkai),
    disclaimer: resolveCommonDisclaimer(mkai),
  };
};
