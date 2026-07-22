# Phase 3I KIS Quote Read Result v0.1

## Status And Scope

Phase 3I implemented a narrow KIS domestic stock current quote read path behind a server API route for local/dev use. The integration is server-only, feature-gated, production-disabled, and disconnected from Market, Portfolio, Chart AI, Home, and Lab UI.

No live KIS smoke was run by Codex. No secret values were requested, read from ignored env files, printed, stored, or recorded.

## Phase 3H Owner Approval Summary

Phase 3H completed server-only provider scaffolding and the owner approved starting Phase 3I. The approved Phase 3I scope is limited to KIS domestic stock quote read integration behind a server route in local/dev mode.

## Official KIS Source Verification Summary

Official sources checked before implementation:

- KIS Developers API page for `[국내주식] 기본시세 > 주식현재가 시세`.
- Korea Investment official Open API GitHub repository.
- Official sample file `examples_llm/domestic_stock/inquire_price/inquire_price.py`.
- Official sample file `examples_llm/auth/auth_token/auth_token.py`.
- Official common helper file `examples_llm/kis_auth.py`.

Verified implementation details:

- Domestic current quote endpoint path: `/uapi/domestic-stock/v1/quotations/inquire-price`.
- Token endpoint path: `/oauth2/tokenP`.
- Token method: `POST`.
- Quote method: `GET`.
- Quote TR ID for real and demo examples: `FHKST01010100`.
- Quote params: `FID_COND_MRKT_DIV_CODE` and `FID_INPUT_ISCD`.
- Phase 3I uses `FID_COND_MRKT_DIV_CODE=J` for KRX and six-digit KR symbols.
- Token body uses `grant_type=client_credentials`, `appkey`, and `appsecret`.
- Quote headers include bearer authorization, app key, app secret, `tr_id`, `custtype=P`, and `tr_cont`.

Only verified quote fields are mapped:

- `stck_prpr` to `price`.
- `prdy_vrss` to `change`.
- `prdy_ctrt` to `changePct`.
- `acml_vol` to `volume`.

## Files Changed

- `src/lib/server/providers/types.ts`
- `src/lib/server/providers/providerEnv.ts`
- `src/lib/server/providers/kisClient.ts`
- `src/lib/server/marketData/quotes.ts`
- `src/pages/api/market/quote.ts`
- `scripts/check_server_only_provider_boundaries.mjs`
- `scripts/smoke_market_quote_route_disabled.mjs`
- `docs/planning/phase_3i_kis_quote_read_result_v0.1.md`
- `docs/planning/planning_changelog.md`
- `docs/planning/phase_3c1_portfolio_manual_smoke_checklist_v0.1.md`

## Feature Gate Summary

The route refuses provider execution unless all conditions are true:

- Runtime is server-side.
- Runtime is not production.
- `KIS_ENABLE_LIVE_QUOTES` is exactly `true`.
- `KIS_APP_KEY`, `KIS_APP_SECRET`, and `KIS_BASE_URL` are present in server runtime env.

Production runtime returns a sanitized disabled/config response. Future production enablement requires a separate owner approval phase.

## Env Names Summary

Names only:

- `KIS_APP_KEY`
- `KIS_APP_SECRET`
- `KIS_BASE_URL`
- `KIS_ENABLE_LIVE_QUOTES`
- `KIS_ACCOUNT_NO` remains optional metadata only for future account-context phases.

No env values were read from ignored env files, printed, summarized, or recorded.

## KIS Token Lifecycle Summary

`kisClient.ts` implements module-local in-memory access token caching only. The token is never written to localStorage, sessionStorage, files, docs, DB, Supabase, generated output, or logs. Token request errors return sanitized provider envelopes.

## KIS Domestic Quote Function Summary

`getKisDomesticQuoteSnapshot(input)` supports only:

- `market: "KR"`
- six-digit symbol strings, for example `005930`.

It does not support US quotes, orders, account APIs, balance APIs, holdings APIs, trading APIs, WebSocket, cache writes, or DB writes.

## Market Quote Service Summary

`getQuoteSnapshot(input)` delegates KR domestic quote reads to the KIS adapter. Unsupported markets return a sanitized unsupported response.

## API Route Summary

Added:

- `GET /api/market/quote?market=KR&symbol=005930`

Route properties:

- GET only.
- `Cache-Control: no-store`.
- Public local/dev route, but provider execution is feature-gated.
- No user token required.
- No raw KIS payload passthrough.
- No stack trace passthrough.

## Response Shape Summary

Success shape:

```json
{
  "ok": true,
  "data": {
    "market": "KR",
    "symbol": "005930",
    "price": 0,
    "currency": "KRW",
    "change": null,
    "changePct": null,
    "volume": 0,
    "marketState": "unknown",
    "asOf": "server timestamp",
    "staleState": "fresh",
    "providerMeta": {
      "provider": "kis",
      "source": "kis-domestic-quote"
    }
  },
  "fallback": {
    "state": "fresh"
  }
}
```

Failure shape uses the sanitized provider error envelope.

## Sanitized Error Behavior Summary

Disabled, missing config, production-disabled, invalid input, unsupported market, token failure, provider failure, and rate-limit paths return generic sanitized responses. They do not include secrets, tokens, raw provider payloads, raw headers, raw DB errors, or stack traces.

## UI Disconnection Confirmation

No UI calls were added. Market, Portfolio, Chart AI, Home, and Lab remain disconnected from `/api/market/quote`.

## Provider-Boundary Validation Summary

The boundary script now permits network `fetch` only in `src/lib/server/providers/kisClient.ts`. It still fails on:

- provider fetches outside the approved KIS adapter.
- raw external URLs in provider adapters.
- axios usage.
- OpenAI/Gemini SDK client construction.
- provider module imports outside `src/lib/server/` or `src/pages/api/`.
- KIS provider console logging.
- KIS provider browser storage usage.

## Automated Validation Results

- `npm run check:provider-boundaries`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `node scripts/smoke_market_quote_route_disabled.mjs`: passed.

Disabled/config and invalid-input route smoke results:

- `/api/market/quote?market=KR&symbol=005930`: `503 CONFIG_MISSING`, no unsafe marker.
- `/api/market/quote?market=KR&symbol=ABC`: `400 VALIDATION_FAILED`, no unsafe marker.
- `/api/market/quote?market=US&symbol=AAPL`: `404 SYMBOL_UNSUPPORTED`, no unsafe marker.

Live KIS smoke was not run by Codex.

## Optional Owner Live Smoke Instructions

The owner may run this only in a private local/dev environment. Do not paste env values into chat or docs.

1. Configure local server env privately with `KIS_ENABLE_LIVE_QUOTES=true`, `KIS_APP_KEY`, `KIS_APP_SECRET`, and `KIS_BASE_URL`.
2. Start the local dev server.
3. Request `/api/market/quote?market=KR&symbol=005930`.
4. Confirm the response is normalized and does not include tokens, app key values, app secret values, raw provider payload, raw headers, or stack traces.
5. Confirm browser source/static assets do not expose KIS env values.

## Explicit Non-Goals Confirmed

- No order API.
- No account API.
- No trading API.
- No balance API.
- No holdings API.
- No WebSocket.
- No DB migration.
- No SQL.
- No Supabase CLI.
- No psql.
- No Supabase write.
- No cache write.
- No Vercel env mutation.
- No deployment.
- No OpenDART call.
- No OpenAI call.
- No Gemini call.
- No real AI analysis.
- No Market UI live-data activation.
- No Portfolio valuation activation.
- No Chart AI live provider execution.
- No visitor count.
- No ad-event tracking.
- No scraping, remote discovery, or external asset download.

## Security Notes

- KIS credentials and access tokens are server-only.
- Access tokens are cached in memory only.
- Provider errors are sanitized.
- Raw KIS responses are not returned to the browser.
- No secret values were requested or recorded.
- Ignored `.env*` contents were not read.

## Remaining Risks

- Owner live KIS smoke remains required because Codex did not run a real provider call.
- KIS response field availability should be confirmed with owner local live smoke before any UI wiring phase.
- Production enablement remains intentionally blocked until a future explicit approval phase.

## Recommended Next Action

Owner local live smoke for the read-only quote route, then decide whether Phase 3J should add safe server-side cache policy planning or limited UI read integration.

## Owner Review Checklist

```text
Phase 3I KIS Quote Read 연동 검토 결과:

* KIS 국내주식 현재가 read-only 범위로 제한됨: 통과/실패
* server route 안에서만 KIS 호출 가능함: 통과/실패
* local/dev feature flag 없이 KIS 호출이 차단됨: 통과/실패
* browser/client 코드에 KIS key/token이 노출되지 않음: 통과/실패
* env var는 이름만 있고 실제 값이 기록되지 않음: 통과/실패
* 주문/매매/계좌/잔고 API가 구현되지 않음: 통과/실패
* DB migration/cache write/Supabase write가 구현되지 않음: 통과/실패
* Market/Portfolio/Chart AI UI에 live quote가 아직 연결되지 않음: 통과/실패
* disabled/config 상태에서 sanitized error만 반환됨: 통과/실패
* 잘못된 symbol 입력이 sanitized validation error로 처리됨: 통과/실패
* 실제 local KIS quote smoke를 수행함: 통과/실패/미실행
* 실제 local KIS quote smoke 응답에 token/key/raw provider payload가 없음: 통과/실패/미실행
* 브라우저 콘솔과 generated browser/static output에 KIS secret marker가 없음: 통과/실패
* provider call, Vercel env mutation, deployment가 승인 범위 밖에서 수행되지 않음: 통과/실패
* 비밀 정보 없는 메모:
```
