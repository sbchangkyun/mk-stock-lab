/**
 * Phase 3GG-Q-FAST OWNER-GATED real-provider similarity smoke.
 *
 * Disabled by default. Requires --owner-approved-real-similarity-smoke AND a running local dev
 * server (default http://localhost:4321, override --base=<url>) that has the owner's real KIS
 * credentials. Probes the real similarity route with the owner-local opt-in and prints ONLY
 * sanitized fields (reachability, sourceStatus, match count, score bounds, date presence, aggregate
 * presence, overlay shape) — never full OHLCV arrays, raw matches, credentials, or payloads.
 */

const args = process.argv.slice(2);
const approved = args.includes('--owner-approved-real-similarity-smoke');
const baseArg = args.find((a) => a.startsWith('--base='));
const base = (baseArg ? baseArg.slice('--base='.length) : 'http://localhost:4321').replace(/\/+$/, '');

if (!approved) {
  console.log('BLOCKED: owner-gated smoke. Re-run with --owner-approved-real-similarity-smoke and a running dev server.');
  process.exit(0);
}

const cases = [
  ['KR stock 005930', 'KR', '005930'],
  ['KR ETF 069500', 'KR', '069500'],
  ['US stock AAPL', 'US', 'AAPL'],
  ['US ETF SPY', 'US', 'SPY'],
];

let failed = 0;

const run = async () => {
  for (const [label, country, symbol] of cases) {
    const url = `${base}/api/chart-ai/similarity.json?ownerLocalSimilarity=1&country=${country}&symbol=${symbol}&window=20&topK=5`;
    let s = {};
    let status = 0;
    try {
      const res = await fetch(url, { method: 'GET' });
      status = res.status;
      const body = await res.json();
      s = body?.similarity ?? {};
    } catch {
      s = {};
    }
    const matches = Array.isArray(s.matches) ? s.matches : [];
    const scores = matches.map((m) => m.similarityScore);
    const scoreBoundsValid = scores.length > 0 && scores.every((v) => typeof v === 'number' && v >= 0 && v <= 100);
    const datesPresent = matches.every((m) => typeof m.startDate === 'string' && typeof m.endDate === 'string' && m.startDate.length >= 8);
    const aggregatePresent = !!s.aggregate && typeof s.aggregate.matchCount === 'number';
    const overlayShapeValid = Array.isArray(s.currentNormalizedPath) && s.currentNormalizedPath.length >= 2 && matches.every((m) => Array.isArray(m.normalizedPath) && m.normalizedPath.length >= 2 && m.normalizedPath[0] === 100);
    const ok = status === 200 && s.sourceStatus === 'ok' && matches.length >= 1 && scoreBoundsValid && datesPresent && aggregatePresent && overlayShapeValid;
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} :: ${label} :: status=${status} sourceStatus=${s.sourceStatus ?? 'n/a'} matches=${matches.length} scoreBoundsValid=${scoreBoundsValid} datesPresent=${datesPresent} aggregatePresent=${aggregatePresent} overlayShapeValid=${overlayShapeValid} historyBars=${s.historyBarCount ?? 'n/a'} candidates=${s.candidateCount ?? 'n/a'}`);
  }
  console.log('');
  console.log(`OWNER SIMILARITY SMOKE :: ${failed === 0 ? 'PASS' : 'FAIL'} (base=${base})`);
  process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error(`OWNER SIMILARITY SMOKE ERROR :: ${error?.name ?? 'Error'}`);
  process.exit(1);
});
