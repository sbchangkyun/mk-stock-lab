/**
 * Phase 3GG-OP-FAST OWNER-GATED real-provider smoke.
 *
 * Disabled by default. Requires the explicit flag --owner-approved-real-market-data-smoke AND a
 * running local dev server (default http://localhost:4321, override with --base=<url>) that has the
 * owner's real KIS credentials loaded. Probes the real search + OHLCV routes with the owner-local
 * opt-in and prints ONLY booleans / counts / statuses -- never raw OHLCV arrays, credentials, or
 * payloads.
 *
 *   node scripts/owner_smoke_phase_3gg_op_fast_real_market_data.mjs \
 *     --owner-approved-real-market-data-smoke --base=http://localhost:4322
 */

const args = process.argv.slice(2);
const approved = args.includes('--owner-approved-real-market-data-smoke');
const baseArg = args.find((a) => a.startsWith('--base='));
const base = (baseArg ? baseArg.slice('--base='.length) : 'http://localhost:4321').replace(/\/+$/, '');

if (!approved) {
  console.log('BLOCKED: owner-gated smoke. Re-run with --owner-approved-real-market-data-smoke and a running dev server.');
  process.exit(0);
}

const getJson = async (path) => {
  const res = await fetch(`${base}${path}`, { method: 'GET' });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const cases = [
  { label: 'KR stock search 삼성전자', path: '/api/chart-ai/instruments/search.json?q=' + encodeURIComponent('삼성전자') },
  { label: 'KR ETF search KODEX 200', path: '/api/chart-ai/instruments/search.json?q=' + encodeURIComponent('KODEX 200') + '&assetType=etf' },
  { label: 'US stock search AAPL', path: '/api/chart-ai/instruments/search.json?q=AAPL' },
  { label: 'US ETF search SPY', path: '/api/chart-ai/instruments/search.json?q=SPY&assetType=etf' },
];

const ohlcvCases = [
  { label: 'KR OHLCV 005930', country: 'KR', symbol: '005930' },
  { label: 'KR ETF OHLCV 069500', country: 'KR', symbol: '069500' },
  { label: 'US OHLCV AAPL', country: 'US', symbol: 'AAPL' },
  { label: 'US ETF OHLCV SPY', country: 'US', symbol: 'SPY' },
];

let failed = 0;

const run = async () => {
  for (const c of cases) {
    const { status, body } = await getJson(c.path);
    const ok = status === 200 && body?.ok === true && Array.isArray(body.results) && body.results.length > 0;
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} :: ${c.label} :: status=${status} resultCount=${body?.resultCount ?? 'n/a'}`);
  }
  for (const c of ohlcvCases) {
    const { status, body } = await getJson(`/api/chart-ai/market/ohlcv.json?ownerLocalOhlcv=1&country=${c.country}&symbol=${c.symbol}&range=3m`);
    const ohlcv = body?.ohlcv;
    const source = ohlcv?.sourceStatus ?? 'n/a';
    const count = ohlcv?.candleCount ?? 0;
    const validShape = Array.isArray(ohlcv?.candles) && ohlcv.candles.every(
      (k) => [k.open, k.high, k.low, k.close].every((v) => typeof v === 'number') && k.low <= Math.min(k.open, k.close) && k.high >= Math.max(k.open, k.close),
    );
    const currencyMatch = ohlcv?.instrument?.currency === (c.country === 'US' ? 'USD' : 'KRW');
    const ok = status === 200 && source === 'ok' && count >= 2 && validShape && currencyMatch;
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} :: ${c.label} :: status=${status} sourceStatus=${source} candleCount=${count} validShape=${validShape} currencyMatch=${currencyMatch}`);
  }

  console.log('');
  console.log(`OWNER SMOKE :: ${failed === 0 ? 'PASS' : 'FAIL'} (base=${base})`);
  process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error(`OWNER SMOKE ERROR :: ${error?.name ?? 'Error'}`);
  process.exit(1);
});
