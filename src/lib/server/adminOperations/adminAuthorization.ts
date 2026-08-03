/**
 * Phase 3GM: server-side, fail-closed admin authorization for the read-only operations surface.
 *
 * Reuses the EXISTING authenticated-user resolver (validateUserFromBearerToken) and the EXISTING
 * site-admin registry (public.site_admins + public.is_site_admin(), from
 * supabase/migrations/20260625_site_admins_and_settings.sql) unchanged. Does not expand, redesign,
 * or add any new admin-role table/column/migration. The client-side helper
 * `isCurrentUserSiteAdmin` in src/lib/siteSettingsClient.ts checks the same site_admins table via
 * the anon-key browser client (relying on its RLS "read own row" policy); this module performs the
 * equivalent check server-side via the service-role admin client, which is required so this route's
 * authorization boundary is enforced on the server, not merely hidden in client UI.
 */

import { getSupabaseAdminClient, isSupabaseServerConfigured, validateUserFromBearerToken } from '../supabaseAdmin';

export type AdminAuthorizationResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; code: string; message: string };

// Minimal shape this module needs from the Supabase admin client -- lets tests inject a fake
// recording client (mirrors the injectable-client pattern already used by usageGuardHealth.ts /
// consumeChartAiUsage). Only `.from(...).select(...).eq(...).maybeSingle()` is required; nothing
// here can accidentally reach a write RPC.
export type AdminRegistryReadClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { user_id: string } | null; error: unknown }>;
      };
    };
  };
};

const defaultIsSiteAdmin = async (userId: string, getClient: () => AdminRegistryReadClient): Promise<boolean> => {
  try {
    const { data, error } = await getClient().from('site_admins').select('user_id').eq('user_id', userId).maybeSingle();
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
};

export type AdminAuthorizationDeps = {
  validateUser: typeof validateUserFromBearerToken;
  isConfigured: () => boolean;
  getClient: () => AdminRegistryReadClient;
  isSiteAdmin: (userId: string, getClient: () => AdminRegistryReadClient) => Promise<boolean>;
};

const defaultDeps: AdminAuthorizationDeps = {
  validateUser: validateUserFromBearerToken,
  isConfigured: isSupabaseServerConfigured,
  getClient: () => getSupabaseAdminClient() as unknown as AdminRegistryReadClient,
  isSiteAdmin: defaultIsSiteAdmin,
};

/**
 * Fail-closed order: signed-out -> 401 before any operational read; signed-in but not a site admin
 * -> 403 before any operational read; admin -> ok. Never distinguishes "not admin" from "admin
 * check failed" in the response (both return the same sanitized 403) so the response never leaks
 * whether a given signed-in account exists in site_admins.
 *
 * `deps` defaults to the real Supabase-backed implementations for every production caller (the API
 * route calls this with no arguments); tests inject fakes so authorization scenarios are covered
 * with zero real network calls.
 */
export const authorizeAdminOperationsRequest = async (
  authorizationHeader: string | null,
  deps: Partial<AdminAuthorizationDeps> = {},
): Promise<AdminAuthorizationResult> => {
  const { validateUser, isConfigured, getClient, isSiteAdmin } = { ...defaultDeps, ...deps };

  const validation = await validateUser(authorizationHeader);
  if (!validation.ok) {
    return { ok: false, status: validation.status, code: validation.code, message: validation.message };
  }

  if (!isConfigured()) {
    return {
      ok: false,
      status: 503,
      code: 'ADMIN_OPERATIONS_CONFIG_MISSING',
      message: '운영 정보 조회 설정이 아직 완료되지 않았습니다.',
    };
  }

  const admin = await isSiteAdmin(validation.user.id, getClient);
  if (!admin) {
    return {
      ok: false,
      status: 403,
      code: 'ADMIN_REQUIRED',
      message: '이 화면은 관리자만 볼 수 있습니다.',
    };
  }

  return { ok: true, userId: validation.user.id };
};
