/**
 * Phase 3GG-T-HF3B-HF1 discovery — compare an (owner-provided) KRX ETF list to the KIS KOSPI master.
 *
 * Read-only, offline. Measures the KRX-authoritative ETF membership against the KIS transport's own
 * security master (group EF) to answer: what fraction of official KRX ETFs are chart-loadable via the
 * existing KIS domestic OHLCV path, and which codes do not map (and why). No network, no credentials.
 *
 * Usage:
 *   node scripts/discovery/compare_krx_etf_to_kis_master.mjs --krx <krx_etf.csv> --kis <kospi_code.mst>
 *     [--out <report.json>]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseKisKospiMaster } from './parse_kis_kospi_master.mjs';
import { parseKrxEtfCsv } from './parse_krx_etf_master.mjs';

const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;
const fail = (m) => { console.error(`ERROR: ${m}`); process.exit(1); };
const decode = (buf) => { const u = new TextDecoder('utf-8', { fatal: false }).decode(buf); return u.includes('�') ? new TextDecoder('euc-kr').decode(buf) : u; };

/** Pure comparison of two code→name maps. Exported for the discovery smoke. */
export const compareEtfSets = (krxRecords, kisEfRecords) => {
  const kisByCode = new Map(kisEfRecords.map((r) => [r.krxCode, r]));
  const kisEfCodes = new Set(kisByCode.keys());
  const mapped = [];
  const unmapped = [];
  const nameMismatch = [];
  for (const k of krxRecords) {
    if (kisEfCodes.has(k.code)) {
      mapped.push(k.code);
      const kisName = kisByCode.get(k.code).nameKo;
      const norm = (s) => s.replace(/\s+/g, '').toUpperCase();
      if (kisName && k.name && !norm(kisName).startsWith(norm(k.name).slice(0, 4)) && !norm(k.name).startsWith(norm(kisName).slice(0, 4))) {
        nameMismatch.push({ code: k.code, krx: k.name, kis: kisName });
      }
    } else {
      unmapped.push({ code: k.code, name: k.name });
    }
  }
  const krxCodes = new Set(krxRecords.map((r) => r.code));
  const inKisNotKrx = [...kisEfCodes].filter((c) => !krxCodes.has(c));
  return {
    krxCount: krxRecords.length,
    kisEfCount: kisEfRecords.length,
    mappedCount: mapped.length,
    unmappedCount: unmapped.length,
    mappingPct: krxRecords.length ? Number(((mapped.length / krxRecords.length) * 100).toFixed(2)) : 0,
    nameMismatchCount: nameMismatch.length,
    inKisNotInKrxCount: inKisNotKrx.length,
    unmapped,
    nameMismatch: nameMismatch.slice(0, 50),
    inKisNotInKrx: inKisNotKrx.slice(0, 50),
  };
};

if (isMain) {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) args[k] = true; else { args[k] = n; i += 1; } }
  }
  if (!args.krx || !args.kis || args.krx === true || args.kis === true) fail('usage: --krx <krx_etf.csv> --kis <kospi_code.mst>');
  const krx = parseKrxEtfCsv(decode(readFileSync(args.krx)));
  const kisRecords = parseKisKospiMaster(readFileSync(args.kis));
  const kisEf = kisRecords.filter((r) => r.group === 'EF');
  const report = compareEtfSets(krx.records, kisEf);
  console.log('--- KRX ETF ↔ KIS master mapping ---');
  console.log(JSON.stringify({ ...report, unmapped: report.unmapped.slice(0, 10) }, null, 2));
  if (args.out && args.out !== true) { writeFileSync(args.out, JSON.stringify(report, null, 0) + '\n'); console.log(`wrote -> ${args.out}`); }
}
