import { getCurrentSession, isSupabaseConfigured } from './supabase';

export type ChartAiAnalyzeInput = {
  symbol: string;
  name?: string;
  market: 'KR' | 'US';
  timeframe?: '1D' | '1W' | '1M';
  question?: string;
};

export class ChartAiApiError extends Error {
  status: number;
  code: string;
  payload: unknown;

  constructor(status: number, code: string, message: string, payload?: unknown) {
    super(message);
    this.name = 'ChartAiApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export const analyzeChartAi = async (input: ChartAiAnalyzeInput) => {
  if (!isSupabaseConfigured()) {
    throw new ChartAiApiError(503, 'SUPABASE_NOT_CONFIGURED', '로그인 설정이 아직 완료되지 않았습니다.');
  }

  const session = await getCurrentSession();
  if (!session) {
    throw new ChartAiApiError(401, 'AUTH_REQUIRED', '로그인이 필요합니다.');
  }

  const response = await fetch('/api/chart-ai/analyze', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new ChartAiApiError(
      response.status,
      payload?.code || 'CHART_AI_API_ERROR',
      payload?.message || 'AI 분석 요청을 처리하지 못했습니다.',
      payload,
    );
  }

  return payload;
};
