import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const getSupabaseServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

type UserValidationResult =
  | { ok: true; user: User }
  | { ok: false; status: number; code: string; message: string };

let adminClient: SupabaseClient | null = null;

const assertServerRuntime = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Server-only Supabase helper cannot run in the browser.');
  }
};

export const isSupabaseServerConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey && getSupabaseServiceRoleKey());

export const isSupabasePublicServerConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseAdminClient = () => {
  assertServerRuntime();

  if (!isSupabaseServerConfigured()) {
    throw new Error('Supabase server configuration is missing.');
  }

  if (!adminClient) {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    if (!serviceRoleKey) {
      throw new Error('Supabase server configuration is missing.');
    }

    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
};

const getBearerToken = (authorizationHeader: string | null) => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  return token;
};

export const validateUserFromBearerToken = async (
  authorizationHeader: string | null,
): Promise<UserValidationResult> => {
  assertServerRuntime();

  const token = getBearerToken(authorizationHeader);
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'AUTH_REQUIRED',
      message: 'Login is required.',
    };
  }

  if (!isSupabasePublicServerConfigured()) {
    return {
      ok: false,
      status: 503,
      code: 'SUPABASE_PUBLIC_CONFIG_MISSING',
      message: 'Supabase public configuration is unavailable.',
    };
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return {
      ok: false,
      status: 401,
      code: 'AUTH_INVALID',
      message: 'Login is required.',
    };
  }

  return { ok: true, user: data.user };
};
