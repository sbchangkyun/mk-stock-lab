import { createSimilarPatternAgentInput } from './similar-pattern-agent.mjs';

const toDate = (dayOffset) => {
  const date = new Date(Date.UTC(2024, 0, 2 + dayOffset));
  return date.toISOString().slice(0, 10);
};

const patternReturnAt = (index) => (
  0.004 * Math.sin(index / 2)
  + 0.002 * Math.cos(index / 5)
  + (index % 6 === 0 ? 0.003 : -0.001)
);

const makeBar = (date, close, volumeSeed) => {
  const open = close * (1 - 0.002);
  const high = close * (1 + 0.01);
  const low = close * (1 - 0.011);
  return {
    date,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume: 1000000 + volumeSeed * 1000,
  };
};

const buildFixtureBars = () => {
  const totalBars = 180;
  const closes = [];
  let close = 68000;
  for (let index = 0; index < totalBars; index += 1) {
    const drift = 0.0006 + 0.003 * Math.sin(index / 9) + 0.0015 * Math.cos(index / 4);
    close *= Math.exp(drift);
    closes.push(close);
  }

  const basePattern = Array.from({ length: 20 }, (_, index) => patternReturnAt(index));
  const injectPattern = (startIndex, startClose, variation = 0) => {
    closes[startIndex] = startClose;
    for (let offset = 1; offset < 20; offset += 1) {
      const patternReturn = basePattern[offset] + variation * Math.sin(offset);
      closes[startIndex + offset] = closes[startIndex + offset - 1] * Math.exp(patternReturn);
    }
  };

  injectPattern(20, 64000, 0.0007);
  injectPattern(48, 69000, 0.0004);
  injectPattern(78, 72000, 0.0002);
  injectPattern(108, 76000, -0.0003);
  injectPattern(135, 80000, 0.0005);
  injectPattern(160, 83000, 0);

  return closes.map((value, index) => makeBar(toDate(index), value, index));
};

export function createSimilarPatternFixtureInput(overrides = {}) {
  return createSimilarPatternAgentInput({
    market: 'KR',
    symbol: '005930',
    timeframe: 'D',
    asOfDate: toDate(179),
    baseWindow: 20,
    lookbackYears: 3,
    topK: 5,
    ohlcv: buildFixtureBars(),
    ...overrides,
  });
}

export function createInsufficientSimilarPatternFixtureInput() {
  return createSimilarPatternFixtureInput({
    asOfDate: toDate(34),
    ohlcv: buildFixtureBars().slice(0, 35),
  });
}

export function createInvalidCloseSimilarPatternFixtureInput() {
  const input = createSimilarPatternFixtureInput();
  return {
    ...input,
    ohlcv: input.ohlcv.map((bar, index) => (index === 12 ? { ...bar, close: -1 } : bar)),
  };
}
