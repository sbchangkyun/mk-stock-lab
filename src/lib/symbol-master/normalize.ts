import type {
  ClientSafeSymbolSearchRecord,
  SymbolMasterRecord,
} from './types';

const DOMESTIC_SYMBOL_PATTERN = /^\d{6}$/;

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLowerCase();
}

export function isDomesticSymbolFormat(value: string): boolean {
  return DOMESTIC_SYMBOL_PATTERN.test(value);
}

export function normalizeDomesticSymbolInput(value: string): string {
  const normalized = value.normalize('NFKC').trim().toUpperCase();
  if (!isDomesticSymbolFormat(normalized)) {
    throw new RangeError('Domestic symbol must contain exactly six numeric digits.');
  }
  return normalized;
}

export function buildSearchableText(
  record: Omit<SymbolMasterRecord, 'searchableText'>,
): string {
  return normalizeSearchText([
    record.symbol,
    record.displaySymbol,
    record.nameKo,
    record.nameEn ?? '',
    ...record.aliases,
    record.exchange,
    record.assetType,
  ].filter(Boolean).join(' '));
}

export function toClientSafeSymbolRecord(
  record: SymbolMasterRecord,
): ClientSafeSymbolSearchRecord {
  return {
    symbol: record.symbol,
    displaySymbol: record.displaySymbol,
    nameKo: record.nameKo,
    ...(record.nameEn ? { nameEn: record.nameEn } : {}),
    market: record.market,
    exchange: record.exchange,
    country: record.country,
    currency: record.currency,
    assetType: record.assetType,
    status: record.status,
    aliases: [...record.aliases],
  };
}
