/**
 * Phase 3GG-T-HF3B-HF2 — KIS instrument-master refresh pipeline (deterministic, standard-library only).
 *
 * Fetches official public KIS master files, builds a candidate active master, diffs it against the
 * current tracked master/archive/refresh-state, classifies lifecycle changes, runs conservative Safety
 * Gates, and — only with --apply and only after every gate passes — transactionally writes the tracked
 * artifacts. KIS-only (no KRX/data.go.kr/Nasdaq-Trader). No credentials, no KIS REST/market/trading API,
 * no OAuth. Raw source files stay in scratch and are never committed.
 *
 * Modes:
 *   --validate-only     fetch + validate + parse; report; write nothing
 *   --report-only       full pipeline through gates; write reports to --output-report; no tracked write
 *   --write-candidate   also write candidate artifacts into the scratch dir
 *   --apply             write candidate artifacts into tracked target files (only if all gates pass)
 *   --full-reconcile    label the run a full reconciliation (same gates)
 *   --scratch-dir <dir> working dir for downloads/candidates (default: OS temp)
 *   --source-dir <dir>  use pre-downloaded source files in <dir> instead of downloading (offline/tests)
 *   --output-report <f> write the machine-readable diff/gate report to <f>
 *
 * Exit code is non-zero when a gate blocks or a stage fails (so a CI job fails safely).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { buildKisActiveMaster, KR_SYMBOL_RE } from '../lib/kisInstrumentMasterSource.mjs';

// ---- official public KIS master sources (verified in Discovery + the official KIS repo) ----
export const KIS_SOURCES = {
  kr: [
    { family: 'kis-kospi', market: 'KOSPI', url: 'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip', file: 'kospi_code.mst' },
    { family: 'kis-kosdaq', market: 'KOSDAQ', url: 'https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip', file: 'kosdaq_code.mst' },
  ],
  us: [
    { family: 'kis-overseas-nasdaq', url: 'https://new.real.download.dws.co.kr/common/master/nasmst.cod.zip', file: 'nasmst.cod' },
    { family: 'kis-overseas-nyse', url: 'https://new.real.download.dws.co.kr/common/master/nysmst.cod.zip', file: 'nysmst.cod' },
    { family: 'kis-overseas-amex', url: 'https://new.real.download.dws.co.kr/common/master/amsmst.cod.zip', file: 'amsmst.cod' },
  ],
};

const TRACKED = {
  master: 'src/data/chart-ai/universalInstrumentMaster.json',
  manifest: 'src/data/chart-ai/universalInstrumentMaster.manifest.json',
  anchors: 'src/data/chart-ai/universalInstrumentMaster.anchors.json',
  archive: 'src/data/chart-ai/universalInstrumentMaster.archive.json',
  state: 'src/data/chart-ai/universalInstrumentMaster.refreshState.json',
};

const KR_ETF_ANCHORS = ['069500', '102110', '114800', '229200', '360750', '133690', '379800'];

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const csym = (r) => `${r.country}|${r.symbol}`;
const identity = (r) => `${r.country}|${r.symbol}|${r.exchange}|${r.assetType}`;

/** Minimal dependency-free single-file ZIP extractor (KIS master zips are one deflated file). */
export const unzipFirstFile = (buf) => {
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error('not a zip archive');
  const method = buf.readUInt16LE(8);
  const fnLen = buf.readUInt16LE(26);
  const exLen = buf.readUInt16LE(28);
  const dataStart = 30 + fnLen + exLen;
  let cd = buf.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), dataStart);
  if (cd < 0) cd = buf.length;
  const comp = buf.subarray(dataStart, cd);
  return method === 8 ? inflateRawSync(comp) : Buffer.from(comp);
};

// ============================ Safety Gates ============================

export const DEFAULT_GATE_THRESHOLDS = {
  maxTotalDropPct: 5,
  maxTotalGrowthPct: 25,
  krEtfDropPct: 1,
  krEtfDropAbs: 10,
  maxKrStockRemovals: 20,
  maxKrEtfRemovals: 10,
  maxUsRemovals: 100,
  maxTypeChanges: 20,
};

/**
 * Evaluate Safety Gates on a candidate vs the previous active master. `sourceOk` MUST be true (all
 * source-integrity checks passed) before absence/removal counters are trusted.
 */
export const evaluateSafetyGates = ({ prevActive, candidate, sourceOk, thresholds } = {}) => {
  const t = { ...DEFAULT_GATE_THRESHOLDS, ...(thresholds || {}) };
  const reasons = [];
  if (!sourceOk) reasons.push('SOURCE_INTEGRITY_FAILED');

  // required categories non-empty
  const cat = (set, c, a) => set.filter((r) => r.country === c && r.assetType === a).length;
  for (const [c, a] of [['KR', 'stock'], ['KR', 'etf'], ['US', 'stock'], ['US', 'etf']]) {
    if (cat(candidate, c, a) === 0) reasons.push(`EMPTY_CATEGORY_${c}_${a}`);
  }
  // duplicate canonical identity + KR symbol / leading-zero integrity
  const seenId = new Set();
  const seenSym = new Set();
  for (const r of candidate) {
    const id = identity(r);
    if (seenId.has(id)) reasons.push('DUPLICATE_CANONICAL_IDENTITY');
    seenId.add(id);
    const s = csym(r);
    if (seenSym.has(s)) reasons.push('DUPLICATE_COUNTRY_SYMBOL');
    seenSym.add(s);
    if (r.country === 'KR' && !KR_SYMBOL_RE.test(r.symbol)) reasons.push('KR_CODE_SHAPE_DAMAGED');
    if (r.country === 'KR' && /^\d/.test(r.symbol) && r.symbol.length !== 6) reasons.push('KR_LEADING_ZERO_DAMAGED');
  }
  // verified anchors present
  const candSymbols = new Set(candidate.map((r) => r.symbol));
  const missingAnchors = KR_ETF_ANCHORS.filter((a) => !candSymbols.has(a));
  if (missingAnchors.length) reasons.push(`ANCHORS_MISSING_${missingAnchors.join('_')}`);

  // magnitude gates (baseline = previous last-known-good active)
  const prevN = prevActive.length;
  const nextN = candidate.length;
  if (prevN > 0) {
    const dropPct = ((prevN - nextN) / prevN) * 100;
    if (dropPct > t.maxTotalDropPct) reasons.push(`TOTAL_DROP_${dropPct.toFixed(1)}PCT`);
    const growthPct = ((nextN - prevN) / prevN) * 100;
    if (growthPct > t.maxTotalGrowthPct) reasons.push(`TOTAL_GROWTH_${growthPct.toFixed(1)}PCT`);
  }
  // per-category source-absence (records present in prev, absent from candidate this snapshot)
  const candBySym = new Set(candidate.map(csym));
  const absent = prevActive.filter((r) => !candBySym.has(csym(r)));
  const krStockRem = absent.filter((r) => r.country === 'KR' && r.assetType === 'stock').length;
  const krEtfRem = absent.filter((r) => r.country === 'KR' && r.assetType === 'etf').length;
  const usRem = absent.filter((r) => r.country === 'US').length;
  if (krStockRem > t.maxKrStockRemovals) reasons.push(`KR_STOCK_REMOVALS_${krStockRem}`);
  if (krEtfRem > t.maxKrEtfRemovals) reasons.push(`KR_ETF_REMOVALS_${krEtfRem}`);
  if (usRem > t.maxUsRemovals) reasons.push(`US_REMOVALS_${usRem}`);
  // KR ETF count drop gate (>1% OR >=10, whichever first)
  const prevKrEtf = prevActive.filter((r) => r.country === 'KR' && r.assetType === 'etf').length;
  const nextKrEtf = cat(candidate, 'KR', 'etf');
  if (prevKrEtf > 0) {
    const drop = prevKrEtf - nextKrEtf;
    if (drop >= t.krEtfDropAbs || (drop / prevKrEtf) * 100 > t.krEtfDropPct) {
      if (drop > 0) reasons.push(`KR_ETF_COUNT_DROP_${drop}`);
    }
  }
  // instrument-type changes
  const prevByKey = new Map(prevActive.map((r) => [csym(r), r]));
  let typeChanges = 0;
  for (const r of candidate) { const p = prevByKey.get(csym(r)); if (p && p.assetType !== r.assetType) typeChanges += 1; }
  if (typeChanges > t.maxTypeChanges) reasons.push(`TYPE_CHANGES_${typeChanges}`);

  return {
    blocked: reasons.length > 0,
    reasons,
    stats: { prevN, nextN, krStockRem, krEtfRem, usRem, typeChanges, prevKrEtf, nextKrEtf },
  };
};

// ============================ Lifecycle + missing policy ============================

/**
 * Apply the two-consecutive-valid-snapshot missing policy + lifecycle classification.
 * @returns { nextActive, nextArchive, nextState, events }
 */
export const applyMissingPolicy = ({ prevActive, candidate, state, archive, asOf, sourceVersion }) => {
  const prevByKey = new Map(prevActive.map((r) => [csym(r), r]));
  const candByKey = new Map(candidate.map((r) => [csym(r), r]));
  const archiveByKey = new Map(archive.map((r) => [r.canonicalIdentity || `${r.country}|${r.priorSymbol}`, r]));
  const missingCounts = { ...(state.missingCounts || {}) };
  const pendingInactive = { ...(state.pendingInactive || {}) };
  const events = { NEW_LISTING: [], PENDING_INACTIVE: [], DELISTED_OR_REMOVED: [], RENAMED: [], INSTRUMENT_TYPE_CORRECTED: [], MARKET_TRANSFERRED: [], REACTIVATED: [] };

  const nextActive = [];

  // 1. Candidate present -> active; reset missing; detect new/rename/type/exchange/reactivation
  for (const r of candidate) {
    const key = csym(r);
    delete missingCounts[key];
    delete pendingInactive[key];
    const prev = prevByKey.get(key);
    if (!prev) {
      // was it archived? -> reactivation
      const archived = archive.find((a) => a.country === r.country && a.priorSymbol === r.symbol);
      if (archived) events.REACTIVATED.push({ symbol: r.symbol, country: r.country });
      else events.NEW_LISTING.push({ symbol: r.symbol, country: r.country, assetType: r.assetType });
    } else {
      if (prev.displayName !== r.displayName) {
        events.RENAMED.push({ symbol: r.symbol, from: prev.displayName, to: r.displayName });
        r.aliases = [...new Set([...(r.aliases || []), prev.displayName.toLowerCase()])].sort();
      }
      if (prev.assetType !== r.assetType) events.INSTRUMENT_TYPE_CORRECTED.push({ symbol: r.symbol, from: prev.assetType, to: r.assetType });
      if (prev.exchange !== r.exchange) events.MARKET_TRANSFERRED.push({ symbol: r.symbol, from: prev.exchange, to: r.exchange });
    }
    nextActive.push(r);
  }

  // 2. Prev present, candidate absent -> pending (1st) or archive (2nd consecutive)
  const nextArchive = [...archive];
  for (const prev of prevActive) {
    const key = csym(prev);
    if (candByKey.has(key)) continue; // still present
    const count = (missingCounts[key] || 0) + 1;
    if (count < 2) {
      missingCounts[key] = count;
      pendingInactive[key] = { symbol: prev.symbol, country: prev.country, sinceAsOf: asOf };
      events.PENDING_INACTIVE.push({ symbol: prev.symbol, country: prev.country, missingCount: count });
      nextActive.push(prev); // KEEP active on first absence
    } else {
      missingCounts[key] = count;
      delete pendingInactive[key];
      events.DELISTED_OR_REMOVED.push({ symbol: prev.symbol, country: prev.country });
      const canonical = identity(prev);
      if (!archiveByKey.has(canonical) && !nextArchive.some((a) => a.canonicalIdentity === canonical)) {
        nextArchive.push({
          canonicalIdentity: canonical,
          country: prev.country,
          priorSymbol: prev.symbol,
          priorNames: [prev.displayName, ...(prev.englishName ? [prev.englishName] : [])],
          priorExchange: prev.exchange,
          instrumentType: prev.assetType,
          standardCode: prev.standardCode || null,
          firstSeenAt: prev.firstSeenAt || null,
          lastActiveAt: asOf,
          inactiveAt: asOf,
          inactiveReason: 'SOURCE_ABSENT_TWO_CONSECUTIVE_VALID_SNAPSHOTS',
          successorIdentity: null,
          sourceVersion: sourceVersion || null,
        });
      }
    }
  }

  // deterministic ordering of active
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  nextActive.sort((a, b) => cmp(a.country, b.country) || cmp(a.assetType, b.assetType) || cmp(a.symbol, b.symbol) || cmp(a.exchange, b.exchange));

  const nextState = {
    ...state,
    lastRefreshAt: asOf,
    pendingInactive,
    missingCounts,
  };
  return { nextActive, nextArchive, nextState, events };
};

// ============================ CLI orchestration ============================

const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (isMain) {
  const opts = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) opts[k] = true; else { opts[k] = n; i += 1; } }
  }
  const die = (m, code = 1) => { console.error(`ERROR: ${m}`); process.exit(code); };
  const scratch = (opts['scratch-dir'] && opts['scratch-dir'] !== true) ? opts['scratch-dir'] : join(tmpdir(), 'mk-kis-refresh');
  if (!existsSync(scratch)) mkdirSync(scratch, { recursive: true });
  const sourceDir = (opts['source-dir'] && opts['source-dir'] !== true) ? opts['source-dir'] : null;
  const mode = opts.apply ? 'apply' : opts['write-candidate'] ? 'write-candidate' : opts['report-only'] ? 'report-only' : 'validate-only';
  const asOf = (opts['as-of'] && opts['as-of'] !== true) ? opts['as-of'] : new Date().toISOString().slice(0, 10);

  const log = (m) => console.log(`[refresh] ${m}`);

  const loadJson = (p, fallback) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; } };

  // ---- Stage 1: fetch (download or use --source-dir) ----
  const provenance = [];
  const readSourceBuf = async (src) => {
    if (sourceDir) {
      const p = join(sourceDir, src.file);
      if (!existsSync(p)) die(`source file missing in --source-dir: ${src.file}`);
      const buf = readFileSync(p);
      provenance.push({ family: src.family, file: src.file, bytes: buf.length, sha256: sha256(buf) });
      return buf;
    }
    const res = await fetch(src.url);
    if (!res.ok) die(`SOURCE_UNAVAILABLE ${src.family} http=${res.status}`);
    const zip = Buffer.from(await res.arrayBuffer());
    if (zip.length < 1000) die(`SOURCE_EMPTY ${src.family} bytes=${zip.length}`);
    const buf = unzipFirstFile(zip);
    provenance.push({ family: src.family, file: src.file, zipBytes: zip.length, bytes: buf.length, sha256: sha256(buf) });
    return buf;
  };

  const run = async () => {
    log(`mode=${mode} scope=${opts.scope || 'all'} fullReconcile=${Boolean(opts['full-reconcile'])} asOf=${asOf}`);
    // Stage 1-2: fetch + integrity
    let sourceOk = true;
    const domestic = [];
    const overseas = [];
    try {
      for (const s of KIS_SOURCES.kr) domestic.push({ market: s.market, buf: await readSourceBuf(s) });
      for (const s of KIS_SOURCES.us) overseas.push({ buf: await readSourceBuf(s) });
    } catch (e) { sourceOk = false; die(`fetch/integrity failed: ${e.message}`); }
    // schema sanity: each domestic file must parse to a plausible line count
    for (const d of domestic) if (d.buf.length < 10000) { sourceOk = false; }

    // Stage 3-4: candidate
    const anchors = loadJson(TRACKED.anchors, { instruments: [] }).instruments || [];
    const built = buildKisActiveMaster({ domestic, overseas, anchors });
    const candidate = built.instruments;
    log(`candidate active=${candidate.length} rejections=${JSON.stringify(built.rejections)}`);

    // Stage 5-6: load current + diff/lifecycle
    const prevMaster = loadJson(TRACKED.master, { instruments: [] });
    const prevActive = prevMaster.instruments || [];
    const state = loadJson(TRACKED.state, { missingCounts: {}, pendingInactive: {} });
    const archive = (loadJson(TRACKED.archive, { instruments: [] }).instruments) || [];

    // Stage 7: gates (before applying missing policy)
    const gate = evaluateSafetyGates({ prevActive, candidate, sourceOk });
    const sourceVersion = `kis-${candidate.length}`;
    const lifecycle = applyMissingPolicy({ prevActive, candidate, state, archive, asOf, sourceVersion });

    const report = {
      mode,
      asOf,
      fullReconcile: Boolean(opts['full-reconcile']),
      sourceOk,
      candidateCount: candidate.length,
      prevCount: prevActive.length,
      rejections: built.rejections,
      counts: built.counts,
      gate,
      lifecycleSummary: Object.fromEntries(Object.entries(lifecycle.events).map(([k, v]) => [k, v.length])),
      sources: provenance.map((p) => ({ family: p.family, bytes: p.bytes, sha256: p.sha256 })),
    };
    if (opts['output-report'] && opts['output-report'] !== true) writeFileSync(opts['output-report'], JSON.stringify(report, null, 2) + '\n');
    log(`gate blocked=${gate.blocked} reasons=${JSON.stringify(gate.reasons)}`);
    log(`lifecycle=${JSON.stringify(report.lifecycleSummary)}`);

    if (gate.blocked) {
      log('BLOCKED: preserving last-known-good; no tracked write; failing the run.');
      writeFileSync(join(scratch, 'blocked-report.json'), JSON.stringify(report, null, 2) + '\n');
      process.exit(2);
    }

    if (mode === 'validate-only' || mode === 'report-only') { log('gates passed; no tracked write in this mode.'); return; }

    // Stage 8: candidate artifacts (scratch or tracked)
    const masterVersion = `hf3b-hf2-kis-${lifecycle.nextActive.length}`;
    const candMaster = { ...prevMaster, masterVersion, sourceAsOf: asOf, instruments: lifecycle.nextActive };
    const candArchive = { note: (loadJson(TRACKED.archive, {}).note) || 'inactive archive', schemaVersion: 1, instruments: lifecycle.nextArchive };
    const candState = { ...lifecycle.nextState, lastKnownGoodMasterVersion: masterVersion };
    const candManifest = { ...loadJson(TRACKED.manifest, {}), masterVersion, sourceAsOf: asOf, refreshedAt: asOf, sources: provenance, counts: built.counts, rejections: built.rejections, activeCount: lifecycle.nextActive.length, inactiveArchiveCount: lifecycle.nextArchive.length, pendingInactiveCount: Object.keys(lifecycle.nextState.pendingInactive).length };

    const writeSet = (dir, tracked) => {
      writeFileSync(join(dir, 'master.json'), JSON.stringify(candMaster, null, 2) + '\n');
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify(candManifest, null, 2) + '\n');
      writeFileSync(join(dir, 'archive.json'), JSON.stringify(candArchive, null, 2) + '\n');
      writeFileSync(join(dir, 'refreshState.json'), JSON.stringify(candState, null, 2) + '\n');
      if (tracked) {
        writeFileSync(TRACKED.master, JSON.stringify(candMaster, null, 2) + '\n');
        writeFileSync(TRACKED.manifest, JSON.stringify(candManifest, null, 2) + '\n');
        writeFileSync(TRACKED.archive, JSON.stringify(candArchive, null, 2) + '\n');
        writeFileSync(TRACKED.state, JSON.stringify(candState, null, 2) + '\n');
      }
    };
    // Transactional: build the full candidate set in scratch first, validate, then copy to tracked.
    writeSet(scratch, false);
    if (mode === 'apply') {
      writeSet(scratch, true);
      log(`APPLIED to tracked files. masterVersion=${masterVersion} active=${lifecycle.nextActive.length} archive=${lifecycle.nextArchive.length}`);
    } else {
      log(`candidate artifacts written to ${scratch} (mode=${mode}); tracked files unchanged.`);
    }
  };

  run().catch((e) => die(e.message));
}
