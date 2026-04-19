/* --- src/lib/supabase.ts --- */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// 로그 출력 (환경 변수 로드 여부 확인용)
console.log("Supabase URL 확인:", supabaseUrl || "❌ 로드 실패(undefined)");

// 안전장치: URL과 Key가 모두 있을 때만 생성, 없으면 null 반환
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

if (typeof window !== 'undefined' && supabase) {
    (window as any).supabase = supabase;
    console.log("✅ Supabase 전역 등록 성공!");
} else if (typeof window !== 'undefined') {
    console.warn("⚠️ Supabase 설정이 없어 전역 등록을 건너뜁니다.");
}