/**
 * Phase 3GG-R-FAST OWNER-GATED real-provider MK AI analysis smoke.
 *
 * Disabled by default. Requires --owner-approved-real-mk-ai-smoke AND a running local dev server
 * (default http://localhost:4321, override --base=<url>) with the owner's real KIS credentials.
 * Probes the real MK AI analysis route with the owner-local opt-in and prints ONLY sanitized fields
 * (reachability, sourceStatus, dimension labels, score bounds, section count, disclaimer present,
 * no prohibited wording) — never raw OHLCV arrays, credentials, prompts, model names, or payloads.
 */

const args = process.argv.slice(2);
const approved = args.includes('--owner-approved-real-mk-ai-smoke');
const baseArg = args.find((a) => a.startsWith('--base='));
const base = (baseArg ? baseArg.slice('--base='.length) : 'http://localhost:4321').replace(/\/+$/, '');

if (!approved) {
  console.log('BLOCKED: owner-gated smoke. Re-run with --owner-approved-real-mk-ai-smoke and a running dev server.');
  process.exit(0);
}

const cases = [
  ['KR stock 005930', 'KR', '005930'],
  ['KR ETF 069500', 'KR', '069500'],
  ['US stock AAPL', 'US', 'AAPL'],
  ['US ETF SPY', 'US', 'SPY'],
];
const PROHIBITED = ['목표가', '매수', '매도', '손절', '진입', '청산', '상승 확률', '강력 매수'];

let failed = 0;

const run = async () => {
  for (const [label, country, symbol] of cases) {
    let m = {};
    let status = 0;
    try {
      const res = await fetch(`${base}/api/chart-ai/mk-analysis.json?ownerLocalMkAnalysis=1&country=${country}&symbol=${symbol}`, { method: 'GET' });
      status = res.status;
      m = (await res.json())?.mkai ?? {};
    } catch { m = {}; }
    const d = m.dimensions;
    const f = m.formatted;
    const scores = m.scores ? Object.values(m.scores).filter((v) => typeof v === 'number') : [];
    const scoreBoundsValid = scores.length > 0 && scores.every((v) => v >= 0 && v <= 100);
    const sectionCount = f && Array.isArray(f.sections) ? f.sections.length : 0;
    const disclaimerPresent = !!(f && typeof f.disclaimer === 'string' && f.disclaimer.length > 0);
    const prohibitedFound = f ? PROHIBITED.filter((p) => JSON.stringify(f).includes(p)) : ['<no output>'];
    const ok =
      status === 200 && m.sourceStatus === 'ok' && !!d &&
      scoreBoundsValid && sectionCount === 6 && disclaimerPresent && prohibitedFound.length === 0;
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} :: ${label} :: status=${status} sourceStatus=${m.sourceStatus ?? 'n/a'} trend=${d?.trend?.label ?? 'n/a'} vol=${d?.volatility?.label ?? 'n/a'} risk=${d?.risk?.label ?? 'n/a'} scoreBoundsValid=${scoreBoundsValid} sections=${sectionCount} disclaimer=${disclaimerPresent} prohibited=${JSON.stringify(prohibitedFound)} conf=${m.dataCompletenessConfidence ?? 'n/a'}`);
  }
  console.log('');
  console.log(`OWNER MK AI SMOKE :: ${failed === 0 ? 'PASS' : 'FAIL'} (base=${base})`);
  process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error(`OWNER MK AI SMOKE ERROR :: ${error?.name ?? 'Error'}`);
  process.exit(1);
});
