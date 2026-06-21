import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const providerDir = path.join(srcDir, 'lib', 'server', 'providers');
const kisProviderFile = 'src/lib/server/providers/kisClient.ts';
const forbiddenAdapterPatterns = [
  { label: 'axios usage', pattern: /\baxios\b/ },
  { label: 'raw external URL', pattern: /https?:\/\// },
  { label: 'provider SDK client construction', pattern: /\bnew\s+(OpenAI|GoogleGenerativeAI)\b/ },
];
const forbiddenKisPatterns = [
  { label: 'console logging', pattern: /\bconsole\.(log|debug|info|warn|error)\s*\(/ },
  { label: 'browser storage use', pattern: /\b(localStorage|sessionStorage)\b/ },
];

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath;
  });
};

const toPosix = (filePath) => path.relative(root, filePath).replaceAll(path.sep, '/');
const sourceFiles = walk(srcDir).filter((file) => /\.(astro|ts|js|mjs)$/.test(file));
const providerFiles = walk(providerDir).filter((file) => /\.(ts|js|mjs)$/.test(file));
const failures = [];

for (const file of providerFiles) {
  const relative = toPosix(file);
  const content = fs.readFileSync(file, 'utf8');
  const isKisProvider = relative === kisProviderFile;
  for (const rule of forbiddenAdapterPatterns) {
    if (rule.pattern.test(content)) {
      failures.push(`${relative}: contains ${rule.label}`);
    }
  }

  if (/\bfetch\s*\(/.test(content) && !isKisProvider) {
    failures.push(`${relative}: contains network fetch call outside approved KIS adapter`);
  }

  if (isKisProvider) {
    for (const rule of forbiddenKisPatterns) {
      if (rule.pattern.test(content)) failures.push(`${relative}: contains ${rule.label}`);
    }
  }
}

for (const file of sourceFiles) {
  const relative = toPosix(file);
  const content = fs.readFileSync(file, 'utf8');
  const importsProviderModule = /from\s+['"].*server\/providers|import\s*\(['"].*server\/providers/.test(content);
  const importsServerModule = /from\s+['"].*lib\/server|import\s*\(['"].*lib\/server/.test(content);
  const importsPersistentQuoteCache =
    /from\s+['"].*server\/marketData\/supabaseQuoteCache|import\s*\(['"].*server\/marketData\/supabaseQuoteCache/.test(content);
  const isServerFile = relative.startsWith('src/lib/server/') || relative.startsWith('src/pages/api/');
  if (importsProviderModule && !isServerFile) {
    failures.push(`${relative}: imports server provider module outside server boundary`);
  }
  if (importsServerModule && !isServerFile) {
    failures.push(`${relative}: imports server module outside server boundary`);
  }
  if (importsPersistentQuoteCache && !isServerFile) {
    failures.push(`${relative}: imports persistent quote cache adapter outside server boundary`);
  }
}

if (failures.length > 0) {
  console.error('Provider boundary validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Provider boundary validation passed.');
