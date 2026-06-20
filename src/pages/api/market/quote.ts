import type { APIRoute } from 'astro';
import { getQuoteSnapshot } from '../../../lib/server/marketData/quotes';
import { toHttpStatus } from '../../../lib/server/providers/providerErrors';
import type { MarketCode, SecurityIdentity } from '../../../lib/server/providers/types';

export const prerender = false;

const allowedMarkets = ['KR', 'US'] as const;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const normalizeMarket = (value: string | null): MarketCode | null => {
  const market = value?.trim().toUpperCase();
  if (!market) return null;
  return allowedMarkets.find((item) => item === market) ?? null;
};

const normalizeSymbol = (value: string | null) => value?.trim().toUpperCase() ?? '';

const parseQuoteRequest = (url: URL): SecurityIdentity | Response => {
  const market = normalizeMarket(url.searchParams.get('market'));
  const symbol = normalizeSymbol(url.searchParams.get('symbol'));

  if (!market) {
    return jsonResponse(
      {
        ok: false,
        code: 'VALIDATION_FAILED',
        message: 'Quote market is invalid.',
        staleState: 'unavailable',
      },
      400,
    );
  }

  if (!symbol) {
    return jsonResponse(
      {
        ok: false,
        code: 'VALIDATION_FAILED',
        message: 'Quote symbol is required.',
        staleState: 'unavailable',
      },
      400,
    );
  }

  return { market, symbol };
};

export const GET: APIRoute = async ({ url }) => {
  const parsed = parseQuoteRequest(url);
  if (parsed instanceof Response) return parsed;

  const result = await getQuoteSnapshot(parsed);
  if (!result.ok) {
    return jsonResponse(result, toHttpStatus(result.code));
  }

  return jsonResponse({
    ok: true,
    data: result.data,
    fallback: {
      state: result.staleState ?? result.data.staleState,
    },
  });
};

export const ALL: APIRoute = () =>
  jsonResponse(
    {
      ok: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    },
    405,
  );
