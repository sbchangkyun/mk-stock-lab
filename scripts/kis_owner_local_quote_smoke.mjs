/**
 * Owner-local KIS quote smoke script.
 *
 * Executes a single owner-local KIS quote request and prints a SANITIZED summary only.
 * It never prints environment values, never prints request headers, and never prints or writes
 * a raw response body. It requires explicit owner-local smoke flags to be set before any live
 * attempt, and it writes no committed output file.
 *
 * Local invocation (values are NOT shown here; set them in your own shell):
 *   KIS_OWNER_LOCAL_SMOKE=1 KIS_ALLOW_LIVE_QUOTE=1 node scripts/kis_owner_local_quote_smoke.mjs --symbol 005930 --market KR --asset-type stock
 *
 * Windows PowerShell:
 *   $env:KIS_OWNER_LOCAL_SMOKE="1"
 *   $env:KIS_ALLOW_LIVE_QUOTE="1"
 *   node scripts/kis_owner_local_quote_smoke.mjs --symbol 005930 --market KR --asset-type stock
 */

import { build } from 'esbuild';

const root = process.cwd();

const parseArgs = (argv) => {
  const args = { symbol: '005930', market: 'KR', assetType: 'stock', includeUs: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--symbol') args.symbol = argv[++i];
    else if (token === '--market') args.market = argv[++i];
    else if (token === '--asset-type') args.assetType = argv[++i];
    else if (token === '--include-us') args.includeUs = true;
  }
  return args;
};

const flagSet = (name) => {
  const raw = process.env[name];
  return typeof raw === 'string' && raw.trim().length > 0 && raw.trim() !== '0' && raw.trim().toLowerCase() !== 'false';
};

const printResult = (result) => {
  process.stdout.write(`KIS owner-local quote smoke: ${result.status}\n`);
  process.stdout.write(`symbol: ${result.symbol}\n`);
  process.stdout.write(`market: ${result.market}\n`);
  process.stdout.write(`endpointKey: ${result.endpointKey}\n`);
  process.stdout.write(`endpointVerified: ${result.endpointVerified}\n`);
  process.stdout.write(`httpStatusClass: ${result.httpStatusClass}\n`);
  process.stdout.write(`normalizedSnapshotSafe: ${result.normalizedSnapshotSafe}\n`);
  process.stdout.write(`source: ${result.source}\n`);
  process.stdout.write(`freshness: ${result.freshness}\n`);
  process.stdout.write(`isLive: ${result.isLive}\n`);
  process.stdout.write(`providerStatus: ${result.providerStatus}\n`);
  process.stdout.write(`lastPricePresent: ${result.normalizedFieldsPresent.lastPrice}\n`);
  process.stdout.write(`previousClosePresent: ${result.normalizedFieldsPresent.previousClose}\n`);
  process.stdout.write(`changePresent: ${result.normalizedFieldsPresent.change}\n`);
  process.stdout.write(`changeRatePresent: ${result.normalizedFieldsPresent.changeRate}\n`);
  process.stdout.write(`volumePresent: ${result.normalizedFieldsPresent.volume}\n`);
  process.stdout.write(`rawResponsePrinted: false\n`);
  process.stdout.write(`secretsPrinted: false\n`);
  process.stdout.write(`message: ${result.message}\n`);
  process.stdout.write('---\n');
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  const ownerLocalFlag = flagSet('KIS_OWNER_LOCAL_SMOKE');
  const allowLiveFlag = flagSet('KIS_ALLOW_LIVE_QUOTE');

  if (!ownerLocalFlag || !allowLiveFlag) {
    process.stdout.write('KIS owner-local quote smoke: BLOCKED\n');
    process.stdout.write('reason: explicit owner-local smoke flags are not set (KIS_OWNER_LOCAL_SMOKE, KIS_ALLOW_LIVE_QUOTE).\n');
    process.stdout.write('rawResponsePrinted: false\n');
    process.stdout.write('secretsPrinted: false\n');
    // Intentional, safe block (not a smoke failure) — exit 0.
    return 0;
  }

  const bundle = await build({
    stdin: {
      contents: `export { runOwnerLocalKisQuoteSmoke } from './src/lib/server/providers/kis/kisOwnerLocalQuoteClient.ts';`,
      resolveDir: root,
      sourcefile: 'kis-owner-local-smoke-entry.ts',
      loader: 'ts',
    },
    bundle: true, format: 'esm', platform: 'node', target: 'node18', write: false, logLevel: 'silent',
  });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

  const context = { mode: 'owner-local', allowNetwork: true, allowKisLive: true };

  const targets = [{ symbol: args.symbol, market: args.market, assetType: args.assetType }];
  if (args.includeUs) targets.push({ symbol: 'AAPL', market: 'US', assetType: 'stock' });

  let hadFailure = false;
  for (const target of targets) {
    const result = await mod.runOwnerLocalKisQuoteSmoke(target, context);
    printResult(result);
    if (result.status === 'FAIL') hadFailure = true;
  }

  return hadFailure ? 1 : 0;
};

main()
  .then((code) => { process.exitCode = code; })
  .catch((error) => {
    // Sanitized: never print raw error objects that could embed request/response detail.
    process.stdout.write('KIS owner-local quote smoke: FAIL\n');
    process.stdout.write(`reason: smoke script error (${error?.name ?? 'Error'}).\n`);
    process.stdout.write('rawResponsePrinted: false\n');
    process.stdout.write('secretsPrinted: false\n');
    process.exitCode = 1;
  });
