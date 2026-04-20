/* --- src/lib/supabase.ts --- */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// 브라우저 콘솔에서 디버깅용 (선택 사항)
if (typeof window !== 'undefined') {
    (window as any).supabase = supabase;
}

/**
 * 새 포트폴리오 그룹(계좌)을 생성하는 함수
 * @param userId - 현재 로그인한 사용자의 ID (auth.uid())
 * @param name   - 포트폴리오 이름 (예: "미국 주식", "국내 성장주")
 */
export async function createPortfolio(userId: string, name: string) {
    const { data, error } = await supabase
        .from('portfolios')
        .insert([{ user_id: userId, name: name.trim() }])
        .select();

    if (error) {
        console.error('Error creating portfolio:', error);
        throw error;
    }
    return data;
}

/**
 * 특정 포트폴리오 그룹에 종목을 추가하는 함수
 * @param portfolioId - 종목을 담을 포트폴리오 그룹의 ID (portfolios.id)
 * @param itemData    - 종목 정보 { symbol, name, quantity, avgPrice, currency }
 */
export async function addPortfolioItem(portfolioId: string, itemData: {
    symbol: string;
    name: string;
    quantity: string | number;
    avgPrice: string | number;
    currency?: string;
}) {
    if (!portfolioId) throw new Error('portfolio_id가 누락되었습니다.');

    const { data, error } = await supabase
        .from('portfolio_items')
        .insert([
            {
                portfolio_id: portfolioId,
                symbol: itemData.symbol,
                name: itemData.name,
                quantity: parseFloat(String(itemData.quantity)),
                avg_price: parseFloat(String(itemData.avgPrice)),
                currency: itemData.currency || 'KRW',
            }
        ])
        .select();

    if (error) {
        console.error('Error adding item:', error);
        throw error;
    }
    return data;
}