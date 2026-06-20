import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mk-stock-lab-route-smoke-'));
const outDir = path.join(tmpDir, 'out');
const files = [
  'src/pages/api/market/quote.ts',
  'src/lib/server/marketData/quotes.ts',
  'src/lib/server/providers/kisClient.ts',
  'src/lib/server/providers/providerErrors.ts',
  'src/lib/server/providers/serverOnly.ts',
  'src/lib/server/providers/types.ts',
];

try {
  for (const file of files) {
    const source = path.join(repoRoot, file);
    const target = path.join(outDir, file).replace(/\.ts$/, '.js');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const content = fs.readFileSync(source, 'utf8');
    const compiled = ts.transpileModule(content, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
      },
    }).outputText.replace(/from '([^']+)';/g, (match, specifier) => {
      if (!specifier.startsWith('.')) return match;
      return specifier.endsWith('.js') ? match : `from '${specifier}.js';`;
    });
    fs.writeFileSync(target, compiled, 'utf8');
  }

  process.env.KIS_ENABLE_LIVE_QUOTES = 'false';
  const routeModule = await import(pathToFileURL(path.join(outDir, 'src/pages/api/market/quote.js')).href);
  const unsafePattern = /KIS_APP_SECRET|KIS_APP_KEY|KIS_BASE_URL|access_token|appsecret|authorization|Bearer|stack|raw/;
  const paths = [
    '/api/market/quote?market=KR&symbol=005930',
    '/api/market/quote?market=KR&symbol=ABC',
    '/api/market/quote?market=US&symbol=AAPL',
  ];

  for (const routePath of paths) {
    const response = await routeModule.GET({ url: new URL(`http://127.0.0.1${routePath}`) });
    const bodyText = await response.text();
    const body = JSON.parse(bodyText);
    console.log(
      `${routePath} status=${response.status} ok=${body.ok} code=${body.code} provider=${body.provider ?? ''} hasData=${Boolean(body.data)} unsafeMarker=${unsafePattern.test(bodyText)}`,
    );
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
