import type { APIRoute } from 'astro';
import { buildPortfolioValuationFromQuotes } from '../../../lib/server/portfolioValuation';
import { resolveFixtureQuotes } from '../../../lib/server/portfolioValuationFixture';
import type { PortfolioPositionInput } from '../../../lib/server/providers/types';

export const prerender = false;

type RouteErrorCode =
  | 'VALIDATION_FAILED'
  | 'METHOD_NOT_ALLOWED'
  | 'UNSUPPORTED_SOURCE'
  | 'INTERNAL_ERROR';

const errorResponse = (
  status: number,
  code: RouteErrorCode,
  message: string,
): Response =>
  new Response(
    JSON.stringify({
      ok: false,
      error: { code, message },
      meta: { liveAttempted: false, rawProviderStored: false },
    }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );

const validatePosition = (p: unknown, index: number): string | null => {
  if (!p || typeof p !== 'object') return `positions[${index}]: must be an object`;
  const pos = p as Record<string, unknown>;
  if (typeof pos.symbol !== 'string' || !pos.symbol.trim())
    return `positions[${index}].symbol: required non-empty string`;
  if (pos.market !== 'KR' && pos.market !== 'US')
    return `positions[${index}].market: must be KR or US`;
  if (pos.assetType !== 'stock' && pos.assetType !== 'etf')
    return `positions[${index}].assetType: must be stock or etf`;
  if (typeof pos.buyPrice !== 'number' || !isFinite(pos.buyPrice) || pos.buyPrice < 0)
    return `positions[${index}].buyPrice: must be a finite number >= 0`;
  if (typeof pos.quantity !== 'number' || !isFinite(pos.quantity) || pos.quantity <= 0)
    return `positions[${index}].quantity: must be a finite number > 0`;
  if (pos.currency !== 'KRW' && pos.currency !== 'USD')
    return `positions[${index}].currency: must be KRW or USD`;
  return null;
};

// POST /api/portfolio/valuation
// Accepts a portfolio position list and returns fixture-backed valuation.
// No live KIS calls. No Supabase. No DB. Fixture quotes only.
export const POST: APIRoute = async ({ request }) => {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, 'VALIDATION_FAILED', 'Request body must be valid JSON.');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse(400, 'VALIDATION_FAILED', 'Request body must be a JSON object.');
    }

    const b = body as Record<string, unknown>;

    if (typeof b.portfolioId !== 'string' || !b.portfolioId.trim()) {
      return errorResponse(400, 'VALIDATION_FAILED', 'portfolioId: required non-empty string.');
    }

    if (b.baseCurrency !== 'KRW' && b.baseCurrency !== 'USD') {
      return errorResponse(400, 'VALIDATION_FAILED', 'baseCurrency: must be KRW or USD.');
    }

    const source = b.source ?? 'fixture';
    if (source !== 'fixture') {
      return errorResponse(
        400,
        'UNSUPPORTED_SOURCE',
        'Only source=fixture is supported. Live quote sources are not enabled.',
      );
    }

    if (!Array.isArray(b.positions)) {
      return errorResponse(400, 'VALIDATION_FAILED', 'positions: must be an array.');
    }
    if ((b.positions as unknown[]).length > 100) {
      return errorResponse(400, 'VALIDATION_FAILED', 'positions: maximum 100 positions per request.');
    }
    for (let i = 0; i < (b.positions as unknown[]).length; i++) {
      const err = validatePosition((b.positions as unknown[])[i], i);
      if (err) return errorResponse(400, 'VALIDATION_FAILED', err);
    }

    const portfolioId = (b.portfolioId as string).trim();
    const baseCurrency = b.baseCurrency as 'KRW' | 'USD';

    // Normalize positions: ensure required portfolioId on each position for the server helper.
    const positions = (b.positions as Array<Record<string, unknown>>).map(
      (p): PortfolioPositionInput & { id?: string } => ({
        portfolioId,
        market: p.market as 'KR' | 'US',
        symbol: (p.symbol as string).trim(),
        name: typeof p.name === 'string' ? p.name : null,
        assetType: p.assetType as 'stock' | 'etf',
        quantity: p.quantity as number,
        buyPrice: p.buyPrice as number,
        buyDate: typeof p.buyDate === 'string' ? p.buyDate : null,
        currency: p.currency as 'KRW' | 'USD',
        ...(typeof p.id === 'string' ? { id: p.id } : {}),
      }),
    );

    // Resolve fixture quotes — no live KIS, no fetch, no env reads.
    const symbols = [...new Set(positions.map((p) => p.symbol))];
    const quotesBySymbol = resolveFixtureQuotes(symbols);

    // Compute valuation using Phase 3BV server helper.
    // providerMeta is stripped at the helper layer; never appears in PortfolioValuationRow.
    const valuation = buildPortfolioValuationFromQuotes({
      portfolioId,
      baseCurrency,
      positions,
      quotesBySymbol,
    });

    const missingQuoteSymbols = symbols.filter((s) => quotesBySymbol[s] === null);
    const unsupportedSymbols = positions
      .filter((p) => p.market === 'US')
      .map((p) => p.symbol)
      .filter((s, i, arr) => arr.indexOf(s) === i);

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          portfolioId,
          baseCurrency,
          source: 'fixture',
          valuation,
          meta: {
            quoteSource: 'fixture',
            liveAttempted: false,
            rawProviderStored: false,
            generatedAt: new Date().toISOString(),
            unsupportedSymbols,
            missingQuoteSymbols,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'Portfolio valuation failed safely.');
  }
};

export const GET: APIRoute = () =>
  errorResponse(
    405,
    'METHOD_NOT_ALLOWED',
    'Use POST /api/portfolio/valuation with a JSON body.',
  );
