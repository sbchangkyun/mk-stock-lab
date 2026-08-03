/**
 * Phase 3GM: single entry point that assembles the closed, sanitized admin operations overview
 * contract from the three read-only health sections. Called only AFTER the API route has already
 * confirmed the caller is an authenticated site admin (see adminAuthorization.ts) -- this module
 * itself does not re-check authorization, so it must never be called directly from a route without
 * that check having already passed.
 */

import { getUsageGuardOverview } from './usageGuardHealth';
import { getKisTokenOverview } from './kisTokenHealth';
import { getQuoteCacheOverview } from './quoteCacheHealth';
import type { AdminOperationsOverview } from './types';

export const getAdminOperationsOverview = async (): Promise<AdminOperationsOverview> => {
  const [usageGuard, kisToken] = await Promise.all([getUsageGuardOverview(), getKisTokenOverview()]);
  const quoteCaches = getQuoteCacheOverview();

  return {
    generatedAtIso: new Date().toISOString(),
    usageGuard,
    kisToken,
    quoteCaches,
  };
};

export type { AdminOperationsOverview } from './types';
