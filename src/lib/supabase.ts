import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let browserSupabaseClient: SupabaseClient | null = null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const getBrowserSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null;

  if (!browserSupabaseClient) {
    // Explicit (not relying on library defaults) so session restoration across page loads and
    // tabs stays a deliberate, documented contract rather than an implicit default.
    browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserSupabaseClient;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const client = getBrowserSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) return null;

  return data.session;
};

export const supabase = getBrowserSupabaseClient();

if (!isSupabaseConfigured() && typeof window !== 'undefined') {
  console.error('로그인 설정이 아직 완료되지 않았습니다.');
}

if (typeof window !== 'undefined' && supabase) {
  (window as Window & { supabase?: SupabaseClient }).supabase = supabase;
}
