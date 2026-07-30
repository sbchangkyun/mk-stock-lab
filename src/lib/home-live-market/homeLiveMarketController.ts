/**
 * Phase 3GL-HF1 §5 — the ONE Home market request controller.
 *
 * Layout.astro is rendered on every page (Ticker.astro lives there site-wide), so this module owns
 * the single fetch to GET /api/home/live-market.json, the single 60s recursive-timeout refresh timer,
 * the single visibilitychange listener, and the single in-flight guard for the whole page. Every
 * fetch attempt (success or failure) is broadcast as one `mk-home-live-market` CustomEvent on
 * `window`; Ticker.astro and HomeLiveMarketSnapshot.astro are pure consumers of that event and of
 * `getLatestHomeLiveMarketPayload()` (for a component that mounts after the first fetch already
 * resolved). Neither consumer may open its own fetch/timer/listener/in-flight state.
 */

export type HomeLiveMarketItem = {
  id: string;
  label: string;
  status: 'ok' | 'unavailable';
  price: number | null;
  changeAmount: number | null;
  changePct: number | null;
  asOf: string | null;
  currency: 'KRW' | 'USD';
  basisLabel: string;
  periodLabel: string;
  dataBasis: 'current_quote' | 'latest_close' | 'reference_fx' | 'unavailable';
  freshness: 'fresh' | 'cached' | 'stale' | 'unavailable';
};

export type HomeLiveMarketPayload =
  | { ok: true; ticker: HomeLiveMarketItem[]; snapshot: HomeLiveMarketItem[] }
  | { ok: false };

export const HOME_LIVE_MARKET_EVENT = 'mk-home-live-market';

const REFRESH_MS = 60_000;

let inFlight = false;
let timerId: number | null = null;
let started = false;
let latestPayload: HomeLiveMarketPayload | null = null;

const dispatch = (payload: HomeLiveMarketPayload) => {
  latestPayload = payload;
  window.dispatchEvent(new CustomEvent<HomeLiveMarketPayload>(HOME_LIVE_MARKET_EVENT, { detail: payload }));
};

const load = () => {
  if (inFlight || document.hidden) return;
  inFlight = true;

  fetch('/api/home/live-market.json')
    .then(async (res) => ({ ok: res.ok, body: await res.json() }))
    .then(({ ok, body }) => {
      if (!ok || body?.ok !== true || !Array.isArray(body?.ticker) || !Array.isArray(body?.snapshot)) {
        dispatch({ ok: false });
        return;
      }
      dispatch({ ok: true, ticker: body.ticker as HomeLiveMarketItem[], snapshot: body.snapshot as HomeLiveMarketItem[] });
    })
    .catch(() => dispatch({ ok: false }))
    .finally(() => {
      inFlight = false;
    });
};

const scheduleNext = () => {
  if (timerId !== null) window.clearTimeout(timerId);
  timerId = window.setTimeout(() => {
    load();
    scheduleNext();
  }, REFRESH_MS);
};

/** Idempotent per page-load: safe to call from both `astro:page-load` and an immediate direct call. */
export const startHomeLiveMarketController = () => {
  if (started) return;
  started = true;

  load();
  scheduleNext();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) load();
  });
};

/** Lets a consumer that mounts after the first fetch already resolved render immediately. */
export const getLatestHomeLiveMarketPayload = (): HomeLiveMarketPayload | null => latestPayload;
