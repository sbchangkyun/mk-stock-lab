import type { APIRoute } from 'astro';
import {
  apiFailure,
  apiSuccess,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
  toErrorResponse,
} from '../../../lib/server/portfolio';
import { consumeChartAiUsage } from '../../../lib/server/chartAiUsage';
import { validateUserFromBearerToken } from '../../../lib/server/supabaseAdmin';

export const prerender = false;

type ChartAiRequest = {
  symbol: string;
  name: string | null;
  market: 'KR' | 'US';
  timeframe: '1D' | '1W' | '1M';
  question: string | null;
};

const allowedMarkets = ['KR', 'US'] as const;
const allowedTimeframes = ['1D', '1W', '1M'] as const;
const symbolPattern = /^[A-Za-z0-9._-]{1,32}$/;

const safeText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!text) return null;
  return text.slice(0, maxLength);
};

const normalizeMarket = (value: unknown) => {
  const market = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return allowedMarkets.find((item) => item === market) ?? null;
};

const normalizeTimeframe = (value: unknown) => {
  const timeframe = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return allowedTimeframes.find((item) => item === timeframe) ?? '1D';
};

const parseChartAiRequest = (body: Record<string, unknown>) => {
  const symbol = safeText(body.symbol, 32)?.toUpperCase() ?? '';
  if (!symbolPattern.test(symbol)) {
    return apiFailure(400, 'INVALID_SYMBOL', '종목 코드를 확인해 주세요.');
  }

  const market = normalizeMarket(body.market);
  if (!market) {
    return apiFailure(400, 'INVALID_MARKET', '시장을 확인해 주세요.');
  }

  return apiSuccess<ChartAiRequest>({
    symbol,
    name: safeText(body.name, 160),
    market,
    timeframe: normalizeTimeframe(body.timeframe),
    question: safeText(body.question, 500),
  });
};

export const POST: APIRoute = async ({ request }) => {
  const validation = await validateUserFromBearerToken(request.headers.get('authorization'));
  if (!validation.ok) {
    return toErrorResponse(apiFailure(validation.status, validation.code, validation.message));
  }

  const body = await readJsonBody(request);
  if (!body.ok) return toErrorResponse(body);

  const parsed = parseChartAiRequest(body.data);
  if (!parsed.ok) return toErrorResponse(parsed);

  const usage = await consumeChartAiUsage(validation.user.id);
  if (usage.reason === 'usage_guard_unavailable') {
    return jsonResponse(
      {
        ok: false,
        code: 'CHART_AI_USAGE_GUARD_UNAVAILABLE',
        message: 'AI 분석 사용량 확인 설정이 아직 완료되지 않았습니다.',
        usage,
      },
      503,
    );
  }

  if (!usage.allowed) {
    return jsonResponse(
      {
        ok: false,
        code: 'CHART_AI_DAILY_LIMIT_REACHED',
        message: '오늘 사용 가능한 AI 분석 횟수를 모두 사용했습니다.',
        usage,
      },
      429,
    );
  }

  const input = parsed.data;

  return jsonResponse({
    ok: true,
    status: 'ready_for_provider_integration',
    symbol: input.symbol,
    name: input.name,
    market: input.market,
    timeframe: input.timeframe,
    usage,
    summary: `${input.name || input.symbol} 분석 요청이 서버 사용량 가드까지 통과했습니다.`,
    sections: [
      {
        title: '현재 단계',
        body: '실제 시세, 차트 데이터, AI 모델 호출은 아직 연결되지 않았습니다.',
      },
      {
        title: '다음 단계',
        body: '향후 서버 전용 provider 경계에서 시장 데이터와 AI 분석을 연결합니다.',
      },
    ],
    disclaimer: '이 화면은 투자 조언이 아니며, 현재는 서버 실행 경계 검증용 결과만 제공합니다.',
  });
};

export const ALL = methodNotAllowed;
