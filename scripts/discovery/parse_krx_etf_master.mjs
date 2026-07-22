/**
 * Phase 3GG-T-HF3B-HF1 discovery — KRX ETF list parser (read-only, offline, owner-provided file).
 *
 * The KRX Data Marketplace bulk endpoints (data.krx.co.kr getJsonData.cmd / OTP CSV download) are
 * WAF-blocked from non-interactive/automation environments (they return 400 "LOGOUT" or an empty
 * body), so the authoritative KRX ETF membership file must be downloaded by the owner IN A BROWSER
 * (no account required) and passed to this parser via --source. This tool never calls a network.
 *
 * Owner download steps (credential-free):
 *   1. Open https://data.krx.co.kr → [증권상품] → [ETF] → "전종목 기본정보" (or "전종목 시세").
 *   2. Click the CSV/Excel download icon; save the file.
 *   3. node scripts/discovery/parse_krx_etf_master.mjs --source <that.csv>
 *
 * The KRX CSV is EUC-KR or UTF-8 with a header row; this parser auto-detects the 종목코드/단축코드 and
 * 종목명 columns (overridable with --code-col / --name-col). Deterministic; dedupes by code.
 *
 * Usage:
 *   node scripts/discovery/parse_krx_etf_master.mjs --source <krx_etf.csv> [--out <report.json>]
 *     [--code-col 종목코드] [--name-col 종목명] [--self-test] [--validate-only]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;
const fail = (m) => { console.error(`ERROR: ${m}`); process.exit(1); };

const decode = (buf) => {
  // Heuristic: try UTF-8; if it contains the replacement char, fall back to EUC-KR.
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (utf8.includes('�')) return new TextDecoder('euc-kr').decode(buf);
  return utf8;
};

// Minimal RFC-4180-ish CSV splitter (handles quoted fields + commas).
const splitCsvLine = (line) => {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ''));
};

/** Parse a KRX ETF CSV string into { records:[{code,name}], count, duplicates }. */
export const parseKrxEtfCsv = (text, opts = {}) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { records: [], count: 0, duplicates: 0, header: [] };
  const header = splitCsvLine(lines[0]);
  const findCol = (want, patterns) => {
    if (want && want !== true) { const i = header.indexOf(want); if (i >= 0) return i; }
    for (let i = 0; i < header.length; i += 1) if (patterns.some((p) => header[i].includes(p))) return i;
    return -1;
  };
  const codeIdx = findCol(opts.codeCol, ['단축코드', '종목코드', '코드']);
  const nameIdx = findCol(opts.nameCol, ['종목명', '한글종목명', '종목약명', '이름']);
  if (codeIdx < 0 || nameIdx < 0) fail(`could not locate code/name columns in header: ${header.join('|')}`);
  const seen = new Set();
  const records = [];
  let duplicates = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const rawCode = (cells[codeIdx] || '').trim();
    const cleaned = rawCode.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    if (cleaned.length < 6) continue; // skip empty/short codes (never zero-pad an empty cell)
    const code = cleaned.slice(-6); // handle an optional 'A' prefix in some KRX exports
    const name = (cells[nameIdx] || '').trim();
    if (!/^[0-9A-Z]{6}$/.test(code) || !name) continue;
    if (seen.has(code)) { duplicates += 1; continue; }
    seen.add(code);
    records.push({ code, name });
  }
  records.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  return { records, count: records.length, duplicates, header };
};

if (isMain) {
const args = {};
{
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) args[k] = true; else { args[k] = n; i += 1; } }
  }
}
if (args['self-test']) {
  const csv = ['종목코드,종목명,기초지수',
    '069500,KODEX 200,코스피200',
    '"229200","KODEX 코스닥150","코스닥150"',
    '0000D0,TIGER 엔비디아,NASDAQ',
    '069500,KODEX 200 DUP,코스피200', // duplicate code
    ',빈코드,x', // invalid
  ].join('\n');
  const r = parseKrxEtfCsv(csv);
  let ok = true;
  ok = ok && r.count === 3;
  ok = ok && r.duplicates === 1;
  ok = ok && r.records.some((x) => x.code === '0000D0'); // alphanumeric preserved
  ok = ok && r.records.some((x) => x.code === '069500') && r.records.some((x) => x.code === '229200');
  ok = ok && r.records[0].code === '0000D0'; // deterministic ascending sort ('0000D0' < '069500')
  console.log(`KRX-ETF-PARSER SELF-TEST :: ${ok ? 'PASS' : 'FAIL'} (count=${r.count} dup=${r.duplicates})`);
  process.exit(ok ? 0 : 1);
}

if (!args.source || args.source === true) fail('missing --source <krx_etf.csv> (owner-downloaded from data.krx.co.kr)');
let buf;
try { buf = readFileSync(args.source); } catch (e) { fail(`cannot read source: ${e.message}`); }
const result = parseKrxEtfCsv(decode(buf), { codeCol: args['code-col'], nameCol: args['name-col'] });
if (result.count === 0) fail('no ETF rows parsed; check the file / column names');
console.log(`--- KRX ETF list ---`);
console.log(`header: ${result.header.join(' | ')}`);
console.log(`active unique ETF codes: ${result.count} (duplicates dropped: ${result.duplicates})`);
console.log(`numeric codes: ${result.records.filter((r) => /^\d{6}$/.test(r.code)).length} | alphanumeric: ${result.records.filter((r) => !/^\d{6}$/.test(r.code)).length}`);
if (args.out && args.out !== true && !args['validate-only']) {
  writeFileSync(args.out, JSON.stringify(result, null, 0) + '\n');
  console.log(`wrote -> ${args.out}`);
}
}
