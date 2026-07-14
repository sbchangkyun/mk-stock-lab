/**
 * Phase 3GG-T-HF3B-HF1 discovery — KIS KOSPI master (kospi_code.mst) parser (read-only, offline).
 *
 * Parses the OFFICIAL Korea Investment & Securities public KOSPI master file into normalized reference
 * records and reports the security-group breakdown (ST=stock, EF=ETF, EN=ETN, RT=REIT, ...). This is a
 * DISCOVERY tool only: it never writes into tracked Production paths, never calls a network/KIS API,
 * and reads a local file the owner (or the discovery step) downloaded to a scratch directory.
 *
 * Official source (download to scratch, not committed):
 *   https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip  ->  kospi_code.mst
 * Layout (per the official koreainvestment/open-trading-api `kis_kospi_code_mst.py`):
 *   bytes 0..8  = 단축코드 (short code, 6-char KRX code; numeric OR alphanumeric e.g. 0000D0)
 *   bytes 9..20 = 표준코드 (ISIN, KR7XXXXXX00Y — the 6-char KRX code is chars 3..8)
 *   bytes 21..  = 한글명 (Korean name)
 *   fixed 228-char tail; the first 2 chars of the tail = 증권그룹구분코드 (group code: ST/EF/EN/...)
 * The Korean name is EUC-KR multi-byte; because the tail is ASCII we read the group code by slicing
 * from the end of the decoded string (empirically the code sits at [len-227, len-225), validated
 * against the seven verified ETF anchors + 삼성전자).
 *
 * Usage:
 *   node scripts/discovery/parse_kis_kospi_master.mjs --source <kospi_code.mst> [--out <report.json>]
 *     [--group EF] [--validate-only]
 * Exit code is non-zero on a missing/malformed source or when anchor validation fails.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;
const fail = (m) => { console.error(`ERROR: ${m}`); process.exit(1); };

const KR_ETF_ANCHORS = ['069500', '102110', '114800', '229200', '360750', '133690', '379800'];

/** Parse the KIS KOSPI master buffer into normalized reference records. */
export const parseKisKospiMaster = (buf) => {
  const txt = new TextDecoder('euc-kr').decode(buf);
  const lines = txt.split(/\r?\n/).filter((l) => l.length > 10);
  const groupCode = (l) => l.slice(l.length - 227, l.length - 225);
  const shortCode = (l) => l.slice(0, 9).trim();
  const isin = (l) => l.slice(9, 21).trim();
  const nameKo = (l) => l.slice(21, l.length - 228).trim();
  const krxCode = (l) => {
    // The tradable 6-char KRX code = ISIN chars 3..8 (KR7[XXXXXX]00Y). Falls back to the short code.
    const s = isin(l);
    if (/^KR7/.test(s) && s.length >= 9) return s.slice(3, 9);
    return shortCode(l);
  };
  const records = lines.map((l) => ({
    shortCode: shortCode(l),
    isin: isin(l),
    krxCode: krxCode(l),
    nameKo: nameKo(l),
    group: groupCode(l),
  }));
  return records;
};

const summarize = (records) => {
  const byGroup = {};
  for (const r of records) byGroup[r.group] = (byGroup[r.group] || 0) + 1;
  const etf = records.filter((r) => r.group === 'EF');
  const numeric = etf.filter((r) => /^\d{6}$/.test(r.krxCode));
  const alphanumeric = etf.filter((r) => /^[0-9A-Z]{6}$/.test(r.krxCode) && !/^\d{6}$/.test(r.krxCode));
  const uniqueEtf = new Set(etf.map((r) => r.krxCode));
  return {
    totalRecords: records.length,
    byGroup: Object.fromEntries(Object.entries(byGroup).sort((a, b) => b[1] - a[1])),
    etfCount: etf.length,
    etfUnique: uniqueEtf.size,
    etfNumericCode: numeric.length,
    etfAlphanumericCode: alphanumeric.length,
    etnCount: records.filter((r) => r.group === 'EN').length,
    reitCount: records.filter((r) => r.group === 'RT').length,
    stockCount: records.filter((r) => r.group === 'ST').length,
    allEtfCodesSixCharAlnum: etf.every((r) => /^[0-9A-Z]{6}$/.test(r.krxCode)),
  };
};

// --- CLI (only when run directly, not when imported) ---
if (isMain) {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) args[k] = true; else { args[k] = n; i += 1; } }
  }
  if (!args.source || args.source === true) fail('missing --source <kospi_code.mst>');
  let buf;
  try { buf = readFileSync(args.source); } catch (e) { fail(`cannot read source: ${e.message}`); }

  const records = parseKisKospiMaster(buf);
  if (records.length < 100) fail(`parsed too few records (${records.length}); source may be malformed`);
  const summary = summarize(records);

  const etfCodes = new Set(records.filter((r) => r.group === 'EF').map((r) => r.krxCode));
  const missingAnchors = KR_ETF_ANCHORS.filter((a) => !etfCodes.has(a));
  if (missingAnchors.length) fail(`ETF anchor(s) not classified EF in master: ${missingAnchors.join(', ')}`);

  console.log('--- KIS KOSPI master summary ---');
  console.log(JSON.stringify(summary, null, 2));
  console.log('anchor validation: all 7 KR ETF anchors present as EF ✓');

  if (args.out && args.out !== true && !args['validate-only']) {
    const filtered = args.group && args.group !== true ? records.filter((r) => r.group === args.group) : records;
    writeFileSync(args.out, JSON.stringify({ summary, records: filtered }, null, 0) + '\n');
    console.log(`wrote ${filtered.length} records -> ${args.out}`);
  }
}
