import domesticSymbolSeed from '../../data/symbol-master/domesticSymbolSeed.mocked.json';
import {
  buildSearchableText,
  isDomesticSymbolFormat,
  normalizeDomesticSymbolInput,
  normalizeSearchText,
  toClientSafeSymbolRecord,
} from './normalize';
import type {
  ClientSafeSymbolSearchRecord,
  DomesticAssetType,
  DomesticExchange,
  SymbolLifecycleStatus,
  SymbolMasterRecord,
  SymbolSource,
} from './types';

type DomesticSymbolSeedRecord = Omit<SymbolMasterRecord, 'searchableText'>;

const allowedExchanges: ReadonlySet<DomesticExchange> = new Set([
  'KOSPI', 'KOSDAQ', 'KONEX', 'ETF', 'ETN', 'UNKNOWN',
]);
const allowedAssetTypes: ReadonlySet<DomesticAssetType> = new Set([
  'stock', 'etf', 'etn', 'other',
]);
const allowedStatuses: ReadonlySet<SymbolLifecycleStatus> = new Set([
  'active', 'suspended', 'delisted', 'unknown',
]);
const allowedSources: ReadonlySet<SymbolSource> = new Set([
  'static', 'kis', 'krx', 'manual', 'mocked',
]);

const cloneMasterRecord = (record: SymbolMasterRecord): SymbolMasterRecord => ({
  ...record,
  aliases: [...record.aliases],
});

const buildMasterRecord = (record: DomesticSymbolSeedRecord): SymbolMasterRecord => {
  const copy: DomesticSymbolSeedRecord = {
    ...record,
    aliases: [...record.aliases],
  };
  return {
    ...copy,
    searchableText: buildSearchableText(copy),
  };
};

const masterRecords = (domesticSymbolSeed as DomesticSymbolSeedRecord[])
  .map(buildMasterRecord)
  .sort((left, right) => left.symbol.localeCompare(right.symbol));

export function assertDomesticSymbolMasterIntegrity(
  records: SymbolMasterRecord[] = masterRecords,
): void {
  const seenSymbols = new Set<string>();

  for (const record of records) {
    if (!isDomesticSymbolFormat(record.symbol)) {
      throw new Error(`Invalid domestic symbol format: ${record.symbol}`);
    }
    if (seenSymbols.has(record.symbol)) {
      throw new Error(`Duplicate domestic symbol: ${record.symbol}`);
    }
    seenSymbols.add(record.symbol);

    if (!record.displaySymbol.trim()) throw new Error(`Missing displaySymbol: ${record.symbol}`);
    if (!record.nameKo.trim()) throw new Error(`Missing nameKo: ${record.symbol}`);
    if (record.market !== 'KR') throw new Error(`Invalid market: ${record.symbol}`);
    if (record.country !== 'KR') throw new Error(`Invalid country: ${record.symbol}`);
    if (record.currency !== 'KRW') throw new Error(`Invalid currency: ${record.symbol}`);
    if (!allowedExchanges.has(record.exchange)) throw new Error(`Invalid exchange: ${record.symbol}`);
    if (!allowedAssetTypes.has(record.assetType)) throw new Error(`Invalid assetType: ${record.symbol}`);
    if (!allowedStatuses.has(record.status)) throw new Error(`Invalid status: ${record.symbol}`);
    if (!allowedSources.has(record.source)) throw new Error(`Invalid source: ${record.symbol}`);
    if (!Array.isArray(record.aliases)) throw new Error(`Invalid aliases: ${record.symbol}`);

    const normalizedAliases = record.aliases.map(normalizeSearchText);
    if (normalizedAliases.some((alias) => !alias)) {
      throw new Error(`Empty alias: ${record.symbol}`);
    }
    if (new Set(normalizedAliases).size !== normalizedAliases.length) {
      throw new Error(`Duplicate normalized alias: ${record.symbol}`);
    }

    const searchableText = normalizeSearchText(record.searchableText);
    if (!searchableText.includes(normalizeSearchText(record.symbol))) {
      throw new Error(`searchableText missing symbol: ${record.symbol}`);
    }
    if (!searchableText.includes(normalizeSearchText(record.nameKo))) {
      throw new Error(`searchableText missing nameKo: ${record.symbol}`);
    }
    if (record.sourceAsOf !== null && !Number.isFinite(Date.parse(record.sourceAsOf))) {
      throw new Error(`Invalid sourceAsOf: ${record.symbol}`);
    }
    if (!Number.isFinite(Date.parse(record.updatedAt))) {
      throw new Error(`Invalid updatedAt: ${record.symbol}`);
    }
  }

  const sortedSymbols = records.map((record) => record.symbol).sort((left, right) => left.localeCompare(right));
  if (records.some((record, index) => record.symbol !== sortedSymbols[index])) {
    throw new Error('Domestic symbol master records must use deterministic symbol order.');
  }
}

assertDomesticSymbolMasterIntegrity(masterRecords);

export function getDomesticSymbolMasterRecords(): SymbolMasterRecord[] {
  return masterRecords.map(cloneMasterRecord);
}

export function getClientSafeDomesticSymbolRecords(): ClientSafeSymbolSearchRecord[] {
  return masterRecords.map(toClientSafeSymbolRecord);
}

export function findDomesticSymbolBySymbol(symbol: string): SymbolMasterRecord | null {
  let normalized: string;
  try {
    normalized = normalizeDomesticSymbolInput(symbol);
  } catch {
    return null;
  }
  const record = masterRecords.find((candidate) => candidate.symbol === normalized);
  return record ? cloneMasterRecord(record) : null;
}
