/**
 * Phase 3GG-T-FAST — deterministic sector/category resolver (pure, client/server-safe).
 *
 * Uses ONLY a small curated, source-backed (public GICS classification) US-large-cap → sector map.
 * Sectors are NEVER inferred from company names. KR instruments and unmapped US instruments are
 * honestly reported as sector-unavailable (`업체 기준 데이터 미제공`) — the caller preserves the broad
 * benchmark comparison in that case.
 */

import { US_SECTOR_MAP, SECTOR_ETFS } from './marketContextTypes.mjs';

export const resolveSector = (instrument) => {
  if (!instrument) return { available: false, reason: 'unavailable', reasonText: '업종 기준 데이터 미제공' };
  if (instrument.country === 'KR') {
    return { available: false, reason: 'kr-no-verified-sector', reasonText: '국내 종목의 업종 기준 데이터는 제공되지 않습니다.' };
  }
  const entry = US_SECTOR_MAP[String(instrument.symbol || '').toUpperCase()];
  if (!entry || !SECTOR_ETFS[entry.key]) {
    return { available: false, reason: 'us-unmapped', reasonText: '검증된 업종 분류가 없어 업종 비교는 제공되지 않습니다.' };
  }
  return {
    available: true,
    sectorKey: entry.key,
    sectorName: entry.name,
    sectorProxy: SECTOR_ETFS[entry.key],
    reason: 'verified-gics',
    reasonText: `공개 GICS 분류 기준 ${entry.name}`,
  };
};
