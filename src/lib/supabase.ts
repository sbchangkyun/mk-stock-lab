import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let browserSupabaseClient: SupabaseClient | null = null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const getBrowserSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null;

  if (!browserSupabaseClient) {
    browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
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
  console.error('Supabase public configuration is missing.');
}

if (typeof window !== 'undefined' && supabase) {
  (window as Window & { supabase?: SupabaseClient }).supabase = supabase;
}
