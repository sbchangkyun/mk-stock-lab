import type { APIRoute } from 'astro';
import { getQuoteSnapshot, isLivePreviewGateReady } from '../../../lib/server/marketData/quotes';
import { buildPortfolioValuationFromQuotes } from '../../../lib/server/portfolioValuation';
import { resolveFixtureQuotes } from '../../../lib/server/portfolioValuationFixture';
import type { PortfolioPositionInput, QuoteSnapshot } from '../../../lib/server/providers/types';

export const prerender = false;

const LIVE_PREVIEW_MAX_POSITIONS = 10;

type RouteErrorCode =
  | 'VALIDATION_FAILED'
  | 'METHOD_NOT_ALLOWED'
  | 'UNSUPPORTED_SOURCE'
  | 'LIVE_PREVIEW_GATE_FAILED'
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
// Default: fixture-backed valuation (source=fixture or omitted). No live KIS. No Supabase.
// Live preview: triple opt-in gate — source: "live" + previewMode: "owner" + allowLiveQuotes: true.
// Public "live" source without all three gates → 400 UNSUPPORTED_SOURCE.
// The "auto" source is deferred and not supported.
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

    // The "auto" source is deferred and not supported in this phase.
    if (source === 'auto') {
      return errorResponse(
        400,
        'UNSUPPORTED_SOURCE',
        'The "auto" source is not supported. Only source=fixture is available by default.',
      );
    }

    // Live preview path: requires all three gates before any provider call is attempted.
    // Public "live" source without the full gate is rejected immediately.
    if (source === 'live') {
      const previewMode = b.previewMode;
      const allowLiveQuotes = b.allowLiveQuotes;

      if (previewMode !== 'owner' || allowLiveQuotes !== true) {
        return errorResponse(
          400,
          'UNSUPPORTED_SOURCE',
          'The "live" source requires previewMode="owner" and allowLiveQuotes=true. Live quotes are not publicly available.',
        );
      }

      // Runtime and environment gate — checked before any KIS call.
      // isLivePreviewGateReady reads VERCEL_ENV, NODE_ENV, and KIS_ACCOUNT_NO
      // without exposing their values; returns a safe boolean result only.
      const gate = isLivePreviewGateReady();
      if (!gate.allowed) {
        return errorResponse(
          400,
          'LIVE_PREVIEW_GATE_FAILED',
          'Live portfolio preview is not allowed in the current runtime environment.',
        );
      }

      // Phase 3DP: KRW only. FX conversion is not implemented.
      if (b.baseCurrency !== 'KRW') {
        return errorResponse(
          400,
          'LIVE_PREVIEW_GATE_FAILED',
          'Live portfolio preview requires baseCurrency=KRW in this phase. Mixed-currency FX is not implemented.',
        );
      }

      if (!Array.isArray(b.positions)) {
        return errorResponse(400, 'VALIDATION_FAILED', 'positions: must be an array.');
      }

      const rawPositions = b.positions as unknown[];

      // Max 10 positions for the initial live preview scope.
      if (rawPositions.length > LIVE_PREVIEW_MAX_POSITIONS) {
        return errorResponse(
          400,
          'LIVE_PREVIEW_GATE_FAILED',
          `Live portfolio preview is limited to ${LIVE_PREVIEW_MAX_POSITIONS} positions per request.`,
        );
      }

      for (let i = 0; i < rawPositions.length; i++) {
        const err = validatePosition(rawPositions[i], i);
        if (err) return errorResponse(400, 'VALIDATION_FAILED', err);
      }

      // KR-only scope guard: reject any non-KR positions before calling the quote provider.
      // US symbol support is not implemented in this phase.
      const hasNonKr = (rawPositions as Array<Record<string, unknown>>).some(
        (p) => p.market !== 'KR',
      );
      if (hasNonKr) {
        return errorResponse(
          400,
          'UNSUPPORTED_SOURCE',
          'Live portfolio preview supports KR positions only. US positions are not supported in this phase.',
        );
      }

      const portfolioId = (b.portfolioId as string).trim();
      const baseCurrency = 'KRW' as const;

      const positions = (rawPositions as Array<Record<string, unknown>>).map(
        (p): PortfolioPositionInput & { id?: string } => ({
          portfolioId,
          market: 'KR',
          symbol: (p.symbol as string).trim(),
          name: typeof p.name === 'string' ? p.name : null,
          assetType: p.assetType as 'stock' | 'etf',
          quantity: p.quantity as number,
          buyPrice: p.buyPrice as number,
          buyDate: typeof p.buyDate === 'string' ? p.buyDate : null,
          currency: 'KRW',
          ...(typeof p.id === 'string' ? { id: p.id } : {}),
        }),
      );

      // Resolve live KR quotes via the existing quote orchestration layer.
      // getQuoteSnapshot handles in-memory caching, stale-but-usable fallback, and provider errors.
      // providerMeta is never forwarded — buildPortfolioValuationFromQuotes uses only
      // price, staleState, and asOf from each QuoteSnapshot; the meta field is stripped upstream.
      const symbols = [...new Set(positions.map((p) => p.symbol))];
      const quotesBySymbol: Record<string, QuoteSnapshot | null> = {};

      for (const symbol of symbols) {
        const result = await getQuoteSnapshot({ market: 'KR', symbol });
        quotesBySymbol[symbol] = result.ok ? result.data : null;
      }

      const valuation = buildPortfolioValuationFromQuotes({
        portfolioId,
        baseCurrency,
        positions,
        quotesBySymbol,
      });

      const missingQuoteSymbols = symbols.filter((s) => quotesBySymbol[s] === null);

      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            portfolioId,
            baseCurrency,
            source: 'live',
            previewMode: 'owner',
            valuation,
            meta: {
              quoteSource: 'live',
              liveAttempted: true,
              rawProviderStored: false,
              generatedAt: new Date().toISOString(),
              unsupportedSymbols: [],
              missingQuoteSymbols,
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Fixture path (default) ────────────────────────────────────────────────
    // Accepts source=fixture or omitted source. No live KIS calls. No Supabase. No DB.
    if (source !== 'fixture') {
      return errorResponse(
        400,
        'UNSUPPORTED_SOURCE',
        'Only source=fixture is supported. Live quote sources are not enabled for public use.',
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
