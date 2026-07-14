/**
 * Phase 3GG-T-HF3B-HF1 discovery — instrument-master refresh SIMULATOR (pure, offline, deterministic).
 *
 * A design artifact, NOT the Production refresh workflow. It models the future refresh pipeline's diff
 * engine + blocking rules + last-known-good preservation over in-memory instrument sets, so the policy
 * can be validated deterministically without any network, credentials, or Production file writes.
 *
 * It answers, mechanically: given a previous active master and a freshly parsed candidate, what
 * lifecycle events occurred, and should the candidate be BLOCKED (preserve last-known-good) or ACCEPTED
 * (produce candidate + diff + archive artifacts)?
 *
 * Usage:
 *   node scripts/discovery/simulate_instrument_master_refresh.mjs --self-test
 * Exit code is non-zero if any self-test assertion fails.
 */

// Canonical identity for an instrument (matches the HF3B contract).
export const identity = (r) => `${r.country}|${r.symbol}|${r.exchange}|${r.assetType}`;
const bySymbol = (r) => `${r.country}|${r.symbol}`;

/** Default numeric/semantic blocking thresholds — tuned per source, not a blanket ±3%. */
export const DEFAULT_THRESHOLDS = {
  maxTotalDropPct: 5, // total active count must not fall >5% in one refresh
  maxTotalGrowthPct: 25, // >25% single-refresh growth is suspicious (schema/dup error)
  maxRemovalsPerRefresh: 50, // absolute daily removal ceiling (delistings are gradual)
  maxEtfDropPct: 5, // KR/US ETF category must not collapse
  minMappingRatePct: 95, // provider-mapping rate floor
  requireAnchors: ['069500', '102110', '114800', '229200', '360750', '133690', '379800'],
};

/**
 * Diff two active sets. Each record: { country, symbol, exchange, assetType, name, isin?, active? }.
 * Returns categorized lifecycle events keyed by canonical identity / symbol.
 */
export const diffMasters = (prev, next) => {
  const prevBySym = new Map(prev.map((r) => [bySymbol(r), r]));
  const nextBySym = new Map(next.map((r) => [bySymbol(r), r]));
  const events = { NEW_LISTING: [], DELISTED: [], RENAMED: [], SYMBOL_CHANGED: [], INSTRUMENT_TYPE_CORRECTED: [], MARKET_TRANSFERRED: [] };

  for (const [k, r] of nextBySym) {
    const p = prevBySym.get(k);
    if (!p) { events.NEW_LISTING.push(r); continue; }
    if (p.name !== undefined && r.name !== undefined && p.name !== r.name) events.RENAMED.push({ from: p.name, to: r.name, symbol: r.symbol });
    if (p.assetType !== r.assetType) events.INSTRUMENT_TYPE_CORRECTED.push({ symbol: r.symbol, from: p.assetType, to: r.assetType });
    if (p.exchange !== r.exchange) events.MARKET_TRANSFERRED.push({ symbol: r.symbol, from: p.exchange, to: r.exchange });
  }
  for (const [k, r] of prevBySym) {
    if (!nextBySym.has(k)) events.DELISTED.push(r);
  }
  // SYMBOL_CHANGED heuristic: a delisted ISIN reappearing under a new symbol (only when ISIN present).
  const nextByIsin = new Map(next.filter((r) => r.isin).map((r) => [r.isin, r]));
  for (const d of events.DELISTED) {
    if (d.isin && nextByIsin.has(d.isin)) {
      const moved = nextByIsin.get(d.isin);
      if (bySymbol(moved) !== bySymbol(d)) events.SYMBOL_CHANGED.push({ isin: d.isin, fromSymbol: d.symbol, toSymbol: moved.symbol });
    }
  }
  return events;
};

/**
 * Evaluate blocking rules. Returns { blocked, reasons[], stats }. A blocked refresh must preserve the
 * last-known-good master and emit diagnostics — never auto-apply.
 */
export const evaluateBlockingRules = (prev, next, opts = {}) => {
  const t = { ...DEFAULT_THRESHOLDS, ...(opts.thresholds || {}) };
  const reasons = [];
  const prevActive = prev.length;
  const nextActive = next.length;

  // Source availability / staleness (caller supplies flags it observed at fetch time).
  if (opts.sourceUnavailable) reasons.push('SOURCE_UNAVAILABLE');
  if (opts.sourceStale) reasons.push('SOURCE_STALE');
  if (opts.schemaChanged) reasons.push('SOURCE_SCHEMA_CHANGED');

  // Empty categories.
  const cat = (set, c, a) => set.filter((r) => r.country === c && r.assetType === a).length;
  for (const [c, a] of [['KR', 'stock'], ['KR', 'etf'], ['US', 'stock'], ['US', 'etf']]) {
    if (cat(next, c, a) === 0) reasons.push(`EMPTY_CATEGORY_${c}_${a}`);
  }

  // Canonical duplicate.
  const seen = new Set();
  for (const r of next) { const id = identity(r); if (seen.has(id)) reasons.push('DUPLICATE_CANONICAL_IDENTITY'); seen.add(id); }

  // Leading-zero / code integrity for KR.
  if (next.some((r) => r.country === 'KR' && !/^[0-9A-Z]{6}$/.test(r.symbol))) reasons.push('KR_CODE_SHAPE_DAMAGED');

  // Magnitude gates.
  if (prevActive > 0) {
    const dropPct = ((prevActive - nextActive) / prevActive) * 100;
    if (dropPct > t.maxTotalDropPct) reasons.push(`TOTAL_DROP_${dropPct.toFixed(1)}PCT_OVER_${t.maxTotalDropPct}`);
    const growthPct = ((nextActive - prevActive) / prevActive) * 100;
    if (growthPct > t.maxTotalGrowthPct) reasons.push(`TOTAL_GROWTH_${growthPct.toFixed(1)}PCT_OVER_${t.maxTotalGrowthPct}`);
  }
  const events = diffMasters(prev, next);
  if (events.DELISTED.length > t.maxRemovalsPerRefresh) reasons.push(`MASS_REMOVAL_${events.DELISTED.length}_OVER_${t.maxRemovalsPerRefresh}`);

  // Anchor disappearance.
  const nextSymbols = new Set(next.map((r) => r.symbol));
  const missingAnchors = t.requireAnchors.filter((a) => !nextSymbols.has(a));
  if (missingAnchors.length) reasons.push(`ANCHORS_MISSING_${missingAnchors.join('_')}`);

  // Provider-mapping rate (caller supplies measured rate).
  if (typeof opts.mappingRatePct === 'number' && opts.mappingRatePct < t.minMappingRatePct) {
    reasons.push(`MAPPING_RATE_${opts.mappingRatePct}_UNDER_${t.minMappingRatePct}`);
  }

  return {
    blocked: reasons.length > 0,
    reasons,
    stats: { prevActive, nextActive, delisted: events.DELISTED.length, newListings: events.NEW_LISTING.length },
  };
};

/**
 * Simulate one refresh cycle. On block, keep last-known-good; else produce accepted artifacts +
 * updated inactive archive (delisted records preserved, never deleted).
 */
export const simulateRefresh = (prev, next, archive = [], opts = {}) => {
  const decision = evaluateBlockingRules(prev, next, opts);
  const events = diffMasters(prev, next);
  if (decision.blocked) {
    return { outcome: 'BLOCKED', reasons: decision.reasons, activeMaster: prev, archive, events, stats: decision.stats };
  }
  // Accept: move delisted into the archive (preserve identity + last active date).
  const asOf = opts.asOf || 'SIM_DATE';
  const archiveNext = [...archive];
  const archived = new Set(archive.map(identity));
  for (const d of events.DELISTED) {
    if (!archived.has(identity(d))) archiveNext.push({ ...d, inactiveReason: 'DELISTED', lastActiveDate: asOf });
  }
  return { outcome: 'ACCEPTED', reasons: [], activeMaster: next, archive: archiveNext, events, stats: decision.stats };
};

// --------------------------------------------------------------------------
// Deterministic self-tests
// --------------------------------------------------------------------------
if (process.argv.includes('--self-test')) {
  let pass = 0;
  let fail = 0;
  const check = (name, cond) => { if (cond) pass += 1; else { fail += 1; console.error(`FAIL :: ${name}`); } };

  const A = (country, symbol, assetType, exchange, extra = {}) => ({ country, symbol, exchange, assetType, name: `${symbol}-name`, ...extra });
  const base = [
    A('KR', '069500', 'etf', 'KOSPI'), A('KR', '005930', 'stock', 'KOSPI'), A('KR', '000660', 'stock', 'KOSPI'),
    A('US', 'AAPL', 'stock', 'NASDAQ'), A('US', 'MSFT', 'stock', 'NASDAQ'), A('US', 'SPY', 'etf', 'NYSE Arca'),
    ...DEFAULT_THRESHOLDS.requireAnchors.filter((s) => s !== '069500').map((s) => A('KR', s, 'etf', 'KOSPI')),
  ];

  // 1. NEW_LISTING detected
  const withNew = [...base, A('KR', '0000D0', 'etf', 'KOSPI')];
  check('detects NEW_LISTING', diffMasters(base, withNew).NEW_LISTING.length === 1);
  check('accepts a small add', simulateRefresh(base, withNew).outcome === 'ACCEPTED');

  // 2. DELISTED archived, not deleted
  const oneRemoved = base.filter((r) => r.symbol !== '005930');
  // Relax the percentage drop gate for this tiny fixture (1 of 12 = 8.3%); we are testing archival.
  const sim = simulateRefresh(base, oneRemoved, [], { asOf: '2026-07-14', thresholds: { maxTotalDropPct: 100 } });
  check('detects DELISTED', sim.events.DELISTED.length === 1);
  check('accepts single removal under relaxed drop gate', sim.outcome === 'ACCEPTED');
  check('archives delisted record', sim.archive.some((r) => r.symbol === '005930' && r.inactiveReason === 'DELISTED'));

  // 3. RENAMED / TYPE / EXCHANGE events
  const renamed = base.map((r) => (r.symbol === '069500' ? { ...r, name: 'KODEX 200 (renamed)' } : r));
  check('detects RENAMED', diffMasters(base, renamed).RENAMED.length === 1);
  const retyped = base.map((r) => (r.symbol === '069500' ? { ...r, assetType: 'stock' } : r));
  check('detects INSTRUMENT_TYPE_CORRECTED', diffMasters(base, retyped).INSTRUMENT_TYPE_CORRECTED.length === 1);
  const moved = base.map((r) => (r.symbol === 'AAPL' ? { ...r, exchange: 'NYSE' } : r));
  check('detects MARKET_TRANSFERRED', diffMasters(base, moved).MARKET_TRANSFERRED.length === 1);

  // 4. SYMBOL_CHANGED via ISIN continuity
  const prevIsin = [A('KR', '900110', 'stock', 'KOSPI', { isin: 'KR7900110001' }), ...base];
  const nextIsin = [A('KR', '950210', 'stock', 'KOSPI', { isin: 'KR7900110001' }), ...base];
  check('detects SYMBOL_CHANGED by ISIN', diffMasters(prevIsin, nextIsin).SYMBOL_CHANGED.length === 1);

  // 5. Blocking rules
  check('blocks mass removal', evaluateBlockingRules(
    [...base, ...Array.from({ length: 100 }, (_, i) => A('US', `T${i}AAA`.slice(0, 5), 'stock', 'NASDAQ'))],
    base, {},
  ).reasons.some((r) => r.startsWith('MASS_REMOVAL')));
  check('blocks anchor disappearance', evaluateBlockingRules(base, base.filter((r) => r.symbol !== '069500'), {}).reasons.some((r) => r.startsWith('ANCHORS_MISSING')));
  check('blocks empty category', evaluateBlockingRules(base, base.filter((r) => !(r.country === 'US' && r.assetType === 'etf')), {}).reasons.some((r) => r.startsWith('EMPTY_CATEGORY_US_etf')));
  check('blocks duplicate identity', evaluateBlockingRules(base, [...base, A('KR', '069500', 'etf', 'KOSPI')], {}).reasons.includes('DUPLICATE_CANONICAL_IDENTITY'));
  check('blocks damaged KR code', evaluateBlockingRules(base, base.map((r) => (r.symbol === '069500' ? { ...r, symbol: '69500' } : r)), {}).reasons.includes('KR_CODE_SHAPE_DAMAGED'));
  check('blocks stale source', evaluateBlockingRules(base, base, { sourceStale: true }).reasons.includes('SOURCE_STALE'));
  check('blocks low mapping rate', evaluateBlockingRules(base, base, { mappingRatePct: 80 }).reasons.some((r) => r.startsWith('MAPPING_RATE')));
  check('blocked refresh preserves last-known-good', simulateRefresh(base, base.filter((r) => r.symbol !== '069500'), []).activeMaster === base);

  // 6. Determinism
  check('diff is deterministic', JSON.stringify(diffMasters(base, withNew)) === JSON.stringify(diffMasters(base, withNew)));
  // 7. Alphanumeric KR ETF code is accepted by the widened shape rule
  check('accepts alphanumeric KR ETF code', !evaluateBlockingRules(base, withNew, {}).reasons.includes('KR_CODE_SHAPE_DAMAGED'));

  console.log(`\nSIMULATOR SELF-TEST :: passed=${pass} failed=${fail} total=${pass + fail}`);
  process.exit(fail > 0 ? 1 : 0);
}
