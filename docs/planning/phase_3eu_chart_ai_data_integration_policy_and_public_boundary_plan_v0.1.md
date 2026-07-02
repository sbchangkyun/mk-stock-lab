# Phase 3EU — Chart AI Data Integration Policy and Public Boundary Plan

## 1. Status

Completed — policy and public boundary plan ready.

## 2. Background

- Phase 3EP-OWNER-REVIEW-CLOSEOUT closed the Chart AI owner-local quote preview as owner review PASS.
- Phase 3ES-OWNER-SMOKE-CLOSEOUT closed the owner-local KIS OHLC smoke as `PASS_WITH_OWNER_LOCAL_RUN`.
- Phase 3ET-OWNER-REVIEW-CLOSEOUT closed the Chart AI owner-local OHLC preview as owner review PASS
  after the Phase 3ET-HF1 UX simplification.
- Phase 3EN-HF1 completed legacy KIS checker cleanup, restoring full validation reliability with no
  known checker failures remaining.
- Public/default `/chart-ai` still renders the mocked/sample candlestick chart only. No public live
  quote or OHLC exposure has been authorized by any prior phase.
- Carried-forward owner context: public live OHLC is not authorized. Public live quote is not
  authorized. `source=live` is not authorized for public/default use. `source=auto` is not
  authorized. Production deployment is not authorized by the previous phases.

## 3. Current Accepted State

- **`/chart-ai` (default)**: mocked/sample data only. No auto KIS fetch on load, on symbol selection,
  or on period change. No public live data. No `source=auto`.
- **`/chart-ai?source=owner-local`**: owner-local quote and OHLC preview are allowed only behind the
  full owner-local gate — explicit query flags, an explicit button click, localhost-only request,
  the three explicit server env flags, and the owner-local provider gate. No raw response or secrets
  are ever exposed.
- **Public production**: sample/mocked only. No public KIS quote or OHLC call. No public
  `source=live` or `source=auto`. This phase does not authorize deployment.

## 4. Data Source Modes Policy

- **`fixture`**: allowed for public/default use. Deterministic, no live provider call.
- **`mocked`**: allowed for public/default use. Deterministic, safe sample data; must be clearly
  labeled as sample/non-investment data.
- **`owner-local`**: allowed only for local owner review. Requires the explicit query flags, the
  localhost-only request, the three server env flags, and the provider gate together. Must never
  appear in public production.
- **`live`**: not authorized. Must not be public, must not be the default mode, and must not be
  exposed via a public query parameter. Future use requires separate legal, commercial, and API
  approval and a dedicated new phase.
- **`auto`**: deferred. Must not be implemented yet. Requires a defined policy for source selection,
  fallback behavior, caching, labeling, and licensing, plus a kill switch, before implementation can
  begin.

## 5. Public Production Boundary

**May:**
- Show mocked/sample chart data.
- Show sample/fallback company info.
- Show clear sample/non-investment labels.
- Use deterministic fixtures.
- Use server-safe static data, if separately approved in a later phase.

**Must not:**
- Call the KIS quote or OHLC API.
- Call owner-local preview routes.
- Expose `source=live` or `source=auto`.
- Expose raw provider data or secrets.
- Imply real-time, current, or delayed provider-backed data unless formally approved in a later
  phase.

## 6. Owner-Local Boundary

- Localhost only.
- Explicit `source=owner-local` query flag.
- Explicit preview action (button click) — never automatic.
- For OHLC, an additional explicit `preview=ohlc` flag; for quote, `preview=quote`.
- Required server env flags: `KIS_OWNER_LOCAL_SMOKE=1`, `KIS_ALLOW_LIVE_QUOTE=1`,
  `KIS_ENABLE_LIVE_QUOTES=true`.
- Required provider context: `mode='owner-local'`, `allowNetwork=true`, `allowKisLive=true`.
- Verified endpoint only (KR domestic quote and KR domestic daily OHLC).
- KR-only unless a US endpoint is separately verified in a later phase.
- No account, trading, order, or balance API usage.
- No raw response or secret exposure in any response.

## 7. KIS Data Use and Approval Gates

1. Official KIS API terms and redistribution policy review.
2. Data licensing and commercial approval.
3. Confirmation that delayed data can be displayed publicly.
4. Confirmation that charts derived from KIS OHLC can be displayed publicly.
5. Cache policy approval.
6. Rate limit and quota policy.
7. Server-side secret handling and token refresh policy.
8. Public route authorization model.
9. Abuse and rate-limiting policy.
10. Observability, logging, and redaction policy.
11. Emergency kill switch.
12. UI labeling policy (sample, delayed, owner-local, not investment advice).
13. Legal and compliance approval before production exposure.
14. Deployment approval.

Until all gates are complete, public/default Chart AI remains sample/mocked.

## 8. Chart AI UI Labeling Policy

**Sample/mocked labels (current, public/default):**
- "샘플 OHLC·거래량 데이터"
- "실제 시세 아님"
- "투자 판단용 정보가 아닙니다."

**Owner-local delayed labels (current, owner-local only):**
- "지연 시세 · 오너 로컬 전용 · KRW"
- "지연 시세 · KIS OHLC · KRW"
- "오너 로컬 전용"
- "실제 투자 판단용 아님"

**Future public delayed labels (only if formally approved in a later phase):**
- "지연 시세"
- Provider and delay-basis disclosure required.
- "투자 판단용 정보가 아닙니다."
- Provider/source disclosure required alongside any delayed data.

Must not introduce "실시간" or "현재가" as public current/live wording unless data rights and delay
policy are approved, and must not introduce any trading-advice-implying copy.

## 9. Route and API Boundary Policy

- Existing owner-local routes (`/api/chart-ai/owner-local-quote-preview`,
  `/api/chart-ai/owner-local-ohlc-preview`) remain owner-local only, `Cache-Control: no-store`, safe
  JSON only, no raw response or secrets, and no public production use.
- Any future public route must be designed in a separate phase, must not reuse the owner-local
  routes, and must include rate limiting, caching, redaction, logging, a kill switch, and legal
  approval.
- The portfolio valuation route (`/api/portfolio/valuation`) remains fixture-only/safe-blocked for
  public/default use. It must not expose public live source behavior; any live preview path stays
  gated behind the existing triple opt-in (`source: 'live'`, `previewMode: 'owner'`,
  `allowLiveQuotes: true`) and the runtime gate, and stays non-default.

## 10. Fallback and Degradation Policy

1. Valid owner-local KIS data is used only under the full owner-local gate.
2. If blocked, unavailable, malformed, or insufficient — keep the sample chart, show a safe Korean
   fallback message, never expose a raw error, and never auto-retry aggressively.
3. Public/default always remains sample/mocked until a later policy phase approves otherwise.
4. On provider outage, show a safe unavailable state — no stack traces, no raw provider payload.

## 11. Security and Compliance Policy

- No secrets in client code or client-visible responses.
- No raw provider response committed to the repository or shown in the UI.
- No account, trading, order, or balance API usage for Chart AI.
- No `KIS_ACCOUNT_NO` usage for Chart AI quote or OHLC.
- No secrets stored in browser storage.
- No public route may reuse owner-local env flags.
- No live market values recorded in documentation or checkers.
- No screenshots with sensitive data committed.
- Logs must be redacted; no raw response or secret values logged.

## 12. Production Deployment Policy

Deployment is not authorized until all of the following are true:

- A public data mode is explicitly chosen.
- Legal and commercial data approval is complete.
- A `source=auto` policy is defined, or explicitly deferred with owner sign-off.
- Route boundary design is approved.
- Production environment policy is approved.
- A rollback/kill switch is defined.
- The full validation suite is green.
- The owner explicitly approves deployment.

Vercel environment variable presence alone does not authorize public live data.

## 13. Recommended Implementation Sequence

1. **Phase 3EU-OWNER-REVIEW** — Owner Review of Chart AI Data Integration Policy and Public Boundary
   Plan.
2. If accepted, choose one of:
   - **Phase 3EV-A** — Public Sample/Fallback Hardening.
   - **Phase 3EV-B** — Owner-Auth Gated Preview Plan.
   - **Phase 3EV-C** — Public Delayed Data Feasibility Review.
3. Only after approval: a `source=auto` design phase, a production route design phase, and a
   deployment readiness phase.

Public live quote or OHLC must not be implemented until the approval gates in §7 are complete. The
owner-local preview remains the only KIS-backed runtime path for now.

## 14. Decision Matrix

| Option | User value | Risk | Prerequisite | Implementation complexity | Recommendation |
| --- | --- | --- | --- | --- | --- |
| A. Keep public Chart AI sample/mocked only | Low-medium; safe, consistent UX | Low | None | Low | Near-term recommended |
| B. Add owner-auth gated preview beyond localhost | Medium; enables broader owner review | Medium; needs auth/security design | Auth and security plan | Medium | Controlled next step only after §7 gates for auth |
| C. Add public delayed KIS data after approvals | High; real product value | High; legal/licensing/compliance exposure | Legal, commercial, and API approval | High | Requires full approval before scoping |
| D. Add `source=auto` | Medium-high; simplifies UX | Medium; masks failure modes if untested | Options B/C policy plus fallback/caching/kill-switch design | High | Deferred |

## 15. Open Questions

1. Are KIS terms compatible with public redistribution of quote/OHLC data?
2. Is delayed quote/OHLC display permitted under current KIS terms?
3. What delay interval and labeling are required for any public delayed display?
4. Who approves data licensing on the owner/business side?
5. Should Chart AI remain analysis/demo-only until data rights are resolved?
6. Is user authentication required before any provider-backed data is shown, even delayed?
7. What rate limits and provider costs would apply to a public route?
8. What kill-switch mechanism is acceptable for a public data path?
9. Should US stocks/ETFs remain deferred until their endpoints are separately verified?

## 16. Validation

- `npm run check:phase-3eu-chart-ai-data-integration-policy-public-boundary-plan`: PASS (48/48).
- `npm run check:phase-3en-hf1-legacy-kis-checker-cleanup`: PASS (42/42).
- `npm run check:kis-quote-adapter-mocked`: PASS (101/101).
- `npm run check:phase-3et-owner-review-closeout-chart-ai-ohlc-preview`: PASS (41/41).
- `npm run check:phase-3et-owner-review-retry-after-ohlc-preview-ux-simplification`: PASS (44/44).
- `npm run check:phase-3et-hf1-owner-local-ohlc-preview-control-ux-simplification`: PASS (46/46).
- `npm run check:phase-3et-chart-ai-owner-local-ohlc-preview-wiring`: PASS (62/62).
- `npm run check:phase-3et-owner-review-chart-ai-ohlc-preview`: PASS (38/38).
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke-closeout`: PASS (38/38).
- `npm run check:phase-3es-owner-local-kis-ohlc-smoke`: PASS (70/70).
- `npm run check:phase-3ep-owner-review-closeout`: PASS (32/32).
- `npm run check:phase-3eq-kis-chart-ohlc-feasibility-plan`: PASS (66/66).
- `npm run check:phase-3ep-chart-ai-owner-local-quote-preview-wiring`: PASS (49/49).
- `npm run check:phase-3eo-owner-local-kis-quote-smoke`: PASS (58/58).
- `npm run check:phase-3en-kis-quote-adapter-owner-local-gate`: PASS (87/87).
- `npm run check:provider-boundaries`: PASS.
- `npm run check:kis-runtime-guard`: PASS (7/7).
- `npm run check:kis-error-fallback`: PASS (48/48).
- `npm run check:chart-ai-ux-skeleton`: PASS (82/82).
- `npm run check:mobile-baseline`: PASS (74/74).
- `npm run check:production-domain`: PASS (33/33).
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: DRY_RUN; no browser and no network.

No known checker failures remain.

## 17. Safety

Confirmed for this phase:

- No runtime source changes.
- No live KIS call by Codex.
- No dev server or browser launched by Codex.
- No `.env` read.
- No actual market values recorded.
- No raw response recorded.
- No secrets recorded.
- No account/trading APIs used or added.
- No screenshot committed.
- No Supabase/SQL/migration changes.
- No Vercel environment changes.
- No dependency changes.
- No deployment.
- No push.

## 18. Recommended Next Phase

Recommended: Phase 3EU-OWNER-REVIEW — Owner Review of Chart AI Data Integration Policy and Public
Boundary Plan.

Alternative: Phase 3EV-A — Public Sample/Fallback Hardening, only if the owner wants to continue
implementation without public data expansion.
