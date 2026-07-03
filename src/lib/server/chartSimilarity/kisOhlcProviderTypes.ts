/**
 * Server-only KIS OHLC provider type foundation (Phase 3EY-A).
 *
 * These types describe a future server-only KIS daily OHLC provider for Chart Similarity.
 * They are decoupled from raw KIS payload fields: no raw KIS field names, no account
 * identifiers, no token/header/app key/app secret fields, no DB identifiers, no user
 * identifiers. This file defines shapes only — it performs no I/O and calls no provider.
 *
 * This module must never be imported from client-accessible page or API code in this phase.
 */

import type { OhlcBar } from '../../chartSimilarity/types';

export type ServerOnlyKisOhlcProviderStatus =
  | 'disabled'
  | 'blocked'
  | 'not_configured'
  | 'not_implemented'
  | 'ready'
  | 'error';

export type ServerOnlyKisOhlcRequest = {
  market: 'KR';
  symbol: string;
  assetType: 'stock' | 'etf';
  timeframe: 'daily';
  lookbackYears: number;
  maxBars: number;
  purpose: 'chart-similarity';
};

export type ServerOnlyKisOhlcPolicy = {
  enabled: boolean;
  requireAuth: boolean;
  requireUsageGuard: boolean;
  allowPublicExecution: false;
  allowClientSecretExposure: false;
  allowRawProviderPayload: false;
  featureFlagName: string;
  notes: string[];
};

export type ServerOnlyKisOhlcResult = {
  ok: boolean;
  status: ServerOnlyKisOhlcProviderStatus;
  request: ServerOnlyKisOhlcRequest;
  bars: OhlcBar[];
  warnings: string[];
  errorCode?: string;
  safeMessage: string;
};

/** Already-normalized, safe daily bar shape — never raw KIS payload fields. */
export type NormalizedDailyOhlcInput = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

export type NormalizedDailyOhlcMeta = {
  market: 'KR';
  symbol: string;
};
