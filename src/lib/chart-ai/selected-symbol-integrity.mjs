/**
 * Phase 3GG-T-HF3A: authoritative selected-symbol / active-chart integrity state machine.
 *
 * Pure and client-safe: no DOM, no network, no timers, no `Date`/random. It is the single source of
 * truth that guarantees every Chart AI analysis (Similar Pattern, MK AI, Market Intelligence) runs ONLY
 * against the instrument whose real OHLCV chart was explicitly loaded successfully for the CURRENT
 * selection revision. There is no default/hidden Samsung target: with nothing selected, `canRunAnalysis()`
 * is false and `getActiveContext()` is null.
 *
 * Three stages:
 *   NO INSTRUMENT      — pendingInstrument null, activeChartInstrument null, analyses disabled.
 *   PENDING INSTRUMENT — an explicit search result / URL suggestion is selected but not yet loaded;
 *                        analyses still disabled; no chart/analysis request has been made.
 *   ACTIVE CHART       — a real chart loaded successfully for the pending selection (non-empty candles,
 *                        current sequence + revision, matching identity); only then analyses may run.
 */

export const ANALYSIS_KINDS = ['similar-pattern', 'mk-ai', 'market-intel'];

const norm = (v) => String(v ?? '').trim().toLowerCase();

/** Canonical instrument identity: country|symbol|exchange|instrumentType. */
export const instrumentIdentityKey = (inst) =>
  inst ? [norm(inst.country), norm(inst.symbol), norm(inst.exchange), norm(inst.instrumentType)].join('|') : '';

/** Coarser identity used to check a chart RESPONSE matches what was requested: country|symbol. */
export const instrumentSymbolKey = (inst) =>
  inst ? [norm(inst.country), norm(inst.symbol)].join('|') : '';

export const createSelectedSymbolIntegrityState = () => {
  let workspaceReady = false;
  let pendingInstrument = null;
  let activeChartInstrument = null;
  let activeChartCandleCount = 0;
  let chartLoadStatus = 'idle'; // idle | pending | loading | success | error
  let selectionRevision = 0;
  let activeChartRevision = 0;
  let chartRequestSeq = 0;
  const analysisSeq = { 'similar-pattern': 0, 'mk-ai': 0, 'market-intel': 0 };

  const invalidateAnalyses = () => { for (const k of ANALYSIS_KINDS) analysisSeq[k] += 1; };
  const clearActive = () => { activeChartInstrument = null; activeChartCandleCount = 0; activeChartRevision = 0; };

  const canRunAnalysis = () =>
    workspaceReady === true &&
    chartLoadStatus === 'success' &&
    activeChartInstrument !== null &&
    activeChartCandleCount > 0 &&
    activeChartRevision === selectionRevision &&
    pendingInstrument !== null &&
    instrumentIdentityKey(activeChartInstrument) === instrumentIdentityKey(pendingInstrument);

  return {
    markWorkspaceReady() { workspaceReady = true; },
    identityKey: instrumentIdentityKey,

    /** Return to NO INSTRUMENT (initial idle). Invalidates any in-flight chart/analysis. */
    reset() {
      pendingInstrument = null;
      clearActive();
      chartLoadStatus = 'idle';
      chartRequestSeq += 1;
      invalidateAnalyses();
    },

    /** Explicit selection of a search result / resolved URL suggestion → PENDING (no request made). */
    selectPending(instrument) {
      selectionRevision += 1;
      pendingInstrument = instrument || null;
      clearActive();
      chartLoadStatus = pendingInstrument ? 'pending' : 'idle';
      chartRequestSeq += 1;   // any in-flight chart load is now stale
      invalidateAnalyses();   // any in-flight analysis is now stale
      return { selectionRevision };
    },

    /** Begin the ONE explicit chart load for the current pending instrument. */
    beginChartLoad() {
      if (!pendingInstrument) return null;
      chartRequestSeq += 1;
      chartLoadStatus = 'loading';
      clearActive();
      invalidateAnalyses();
      return {
        seq: chartRequestSeq,
        revision: selectionRevision,
        requestedIdentity: instrumentIdentityKey(pendingInstrument),
        requestedSymbolKey: instrumentSymbolKey(pendingInstrument),
        instrument: pendingInstrument,
      };
    },

    /**
     * Resolve a chart load. Promotes pending → active ONLY when the token is current (seq + revision),
     * the response is ok with ≥1 candle, and the response identity matches the requested instrument.
     * Returns 'stale' | 'rejected' | 'accepted'.
     */
    resolveChartLoad(token, result) {
      if (!token || token.seq !== chartRequestSeq || token.revision !== selectionRevision) return 'stale';
      const ok = !!(result && result.ok === true);
      const candleCount = result && Number.isFinite(result.candleCount) ? result.candleCount : 0;
      if (!ok || candleCount <= 0) { chartLoadStatus = 'error'; clearActive(); return 'rejected'; }
      if (result.responseSymbolKey && token.requestedSymbolKey && norm(result.responseSymbolKey) !== norm(token.requestedSymbolKey)) {
        chartLoadStatus = 'error'; clearActive(); return 'rejected';
      }
      activeChartInstrument = pendingInstrument;
      activeChartCandleCount = candleCount;
      activeChartRevision = token.revision;
      chartLoadStatus = 'success';
      return 'accepted';
    },

    /** Record a non-promoting chart outcome (error / no-data / unavailable) if the token is still current. */
    failChartLoad(token, status = 'error') {
      if (!token || token.seq !== chartRequestSeq || token.revision !== selectionRevision) return 'stale';
      chartLoadStatus = status;
      clearActive();
      return 'failed';
    },

    canRunAnalysis,
    getActiveContext() { return canRunAnalysis() ? activeChartInstrument : null; },

    /** Begin an analysis for `kind`; returns a token only when an active chart context is valid. */
    beginAnalysis(kind) {
      if (!ANALYSIS_KINDS.includes(kind)) return null;
      if (!canRunAnalysis()) return null;
      analysisSeq[kind] += 1;
      return { kind, seq: analysisSeq[kind], revision: selectionRevision, instrument: activeChartInstrument };
    },

    /** Whether an analysis response may render. Returns 'stale' | 'rejected' | 'accepted'. */
    resolveAnalysis(token) {
      if (!token || !ANALYSIS_KINDS.includes(token.kind)) return 'rejected';
      if (token.seq !== analysisSeq[token.kind]) return 'stale';
      if (token.revision !== selectionRevision) return 'stale';
      if (chartLoadStatus !== 'success' || !activeChartInstrument) return 'stale';
      return 'accepted';
    },

    getSnapshot() {
      return {
        workspaceReady,
        chartLoadStatus,
        selectionRevision,
        activeChartRevision,
        activeChartCandleCount,
        hasPending: pendingInstrument !== null,
        hasActive: activeChartInstrument !== null,
        pendingIdentity: instrumentIdentityKey(pendingInstrument),
        activeIdentity: instrumentIdentityKey(activeChartInstrument),
        canRun: canRunAnalysis(),
      };
    },
  };
};
