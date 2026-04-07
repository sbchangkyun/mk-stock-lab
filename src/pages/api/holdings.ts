// src/pages/api/holdings.ts (최적화 버전)
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  // 1. 가장 최신 날짜 2개를 가져옵니다.
  const { data: dates } = await supabase
    .from('seibro_holdings')
    .select('recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(2);

  if (!dates || dates.length < 1) return new Response(JSON.stringify([]), { status: 200 });

  const latestDate = dates[0].recorded_at;
  const prevDate = dates[1]?.recorded_at;

  // 2. 최신 데이터를 가져옵니다.
  const { data: latestData } = await supabase
    .from('seibro_holdings')
    .select('*')
    .eq('recorded_at', latestDate)
    .order('rank', { ascending: true });

  // 3. 직전 데이터가 있다면 비교하여 차이값을 계산합니다.
  if (prevDate && latestData) {
    const { data: prevData } = await supabase
      .from('seibro_holdings')
      .select('ticker, holding_value')
      .eq('recorded_at', prevDate);

    const prevMap = new Map(prevData?.map(item => [item.ticker, item.holding_value]));

    const result = latestData.map(item => {
      const prevVal = prevMap.get(item.ticker) || 0;
      return {
        ...item,
        diff: prevVal > 0 ? item.holding_value - prevVal : 0 // 전일 대비 차액 계산
      };
    });
    return new Response(JSON.stringify(result), { status: 200 });
  }

  return new Response(JSON.stringify(latestData || []), { status: 200 });
};