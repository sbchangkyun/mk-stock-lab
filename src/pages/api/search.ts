import { createClient } from '@supabase/supabase-js';

// 환경 변수 타입 정의 (Astro 환경 기준)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수가 없을 경우 에러 처리
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables');
}

// 단일 인스턴스(싱글톤) 생성 및 내보내기
export const supabase = createClient(supabaseUrl, supabaseAnonKey);