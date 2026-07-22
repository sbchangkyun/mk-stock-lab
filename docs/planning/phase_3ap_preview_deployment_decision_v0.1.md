# Phase 3AP Vercel Preview Deployment Decision v0.1

## 1. Title and Metadata

- **Phase**: 3AP
- **Type**: Vercel Preview deployment decision
- **Status**: Decided
- **Decision**: Proceed to owner-run Vercel Preview deployment in the next phase with the Market quote card disabled by default
- **Execution mode**: Documentation-only decision
- **Implementation changes in this phase**: none
- **Deployment in this phase**: not performed
- **Vercel CLI in this phase**: not used
- **Vercel env mutation in this phase**: not performed
- **HTTP requests in this phase**: not performed
- **Related implementation**: `docs/planning/phase_3an_minimal_market_live_quote_card_result_v0.1.md`
- **Related owner browser review**: `docs/planning/phase_3ao_owner_browser_review_market_live_quote_card_result_v0.1.md`
- **Related implementation commit**: 99ddbcf
- **Related review commit**: ee10f28
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AP decides whether the Market page Live Quote Snapshot card — implemented in Phase 3AN and approved by the owner in Phase 3AO — should proceed from local owner-approved review to Vercel Preview deployment. This document records the deployment decision and its conditions. No deployment, Vercel CLI operation, or environment mutation is performed in this phase.

---

## 3. Evidence Reviewed

The following prior evidence informs this decision:

| Phase | Evidence | Outcome |
|---|---|---|
| 3AN | Static check `check:market-quote-card` | 25/25 passed |
| 3AN | Fallback harness `check:kis-error-fallback` | 40/40 passed |
| 3AN | `npm run build` | Clean, no errors |
| 3AN | `git diff --check` | Passed |
| 3AN | Feature flag default | `KIS_ENABLE_MARKET_QUOTE_CARD` disabled unless exactly `'true'` |
| 3AN | Auto-fetch | None — user action required |
| 3AN | Surface scope | Market page only |
| 3AO | Owner browser review | No blocking issues reported |

Additional implementation properties confirmed in Phase 3AN:

- The card renders a compact disabled message (`시세 조회를 사용할 수 없습니다.`) when `KIS_ENABLE_MARKET_QUOTE_CARD` is absent or non-`'true'`. No script runs, no network request is made.
- No raw KIS fields, secrets, tokens, or hardcoded actual symbols/prices are present in the component.
- No API route logic, KIS guard, Supabase logic, or Vercel configuration was changed in Phase 3AN.
- Home, Chart AI, Portfolio, Lab, and Heatmap remain disconnected from live quote data.

---

## 4. Deployment Decision

**Decision: Proceed to Vercel Preview deployment in the next owner-run phase.**

Conditions:

- **Initial Preview deployment mode**: Feature disabled by default.
- **`KIS_ENABLE_MARKET_QUOTE_CARD`**: Must remain absent or non-`'true'` in Vercel Preview environment variables for the first deployment. The card renders as the compact disabled message in this configuration — no quote network activity occurs.
- **First Preview deployment goal**: Validate build and render stability, routing, and Market page layout with the card in its disabled state.
- **Enabling the card in Preview**: Requires a separate explicit owner decision after the disabled Preview deployment is confirmed stable. It is not approved by this decision.
- **Production deployment**: Not approved by this decision.
- **Production KIS**: Remains blocked by the `VERCEL_ENV=production` guard in `getKisQuoteConfigReadiness()`.
- **UI expansion**: No additional pages approved for live quote wiring.

---

## 5. Why Disabled-by-Default Preview Deployment Is Recommended

Deploying to Preview with `KIS_ENABLE_MARKET_QUOTE_CARD` absent or non-`'true'` is the correct first step for the following reasons:

- **Deployment compatibility verification**: It confirms the Phase 3AN code changes build and render correctly on Vercel infrastructure without requiring active quote lookup behavior.
- **Safe rollout model**: The feature flag boundary established in Phase 3AN is respected. Deployment and feature activation remain separate gates.
- **Avoids uncontrolled live quote requests**: With the card disabled, no quote fetch is triggered by any page visitor or Vercel crawler during the verification window.
- **Separates deployment verification from live UI activation**: Two distinct owner approvals — one for deployment, one for enabling — prevent conflating infrastructure validation with UX validation.
- **Simpler rollback**: If the disabled-state deployment reveals an unexpected issue (layout breakage, routing regression), it can be addressed without also debugging quote fetch behavior.
- **Consistent with Phase 3AN design intent**: The feature flag was introduced specifically to allow the implementation to be deployed without being activated. Using it in Preview is the intended pattern.

---

## 6. Required Owner-Run Deployment Boundary for the Next Phase

The next phase (Phase 3AQ) must operate within the following boundary:

**Owner may:**
- Trigger Vercel Preview deployment.
- Keep `KIS_ENABLE_MARKET_QUOTE_CARD` absent or non-`'true'` in the Vercel Preview environment.
- Verify the Preview deployment reaches Ready state.
- Visit the Market page in the browser to confirm layout and disabled-card state.
- Provide sanitized evidence to Claude Code for recording.

**Claude Code must not:**
- Run any Vercel CLI command.
- Trigger or initiate any deployment.
- Mutate any Vercel environment variable.
- Call any deployed Preview URL.
- Read any `.env*` file content.
- Record any non-sanitized evidence.

**Claude Code may:**
- Record sanitized owner-provided evidence (boolean checks, status labels, pass/fail results).
- Update documentation and changelog.
- Commit documentation-only changes.

---

## 7. Preview Validation Checklist for the Next Owner-Run Phase

The following checklist should be completed by the owner after the disabled-state Preview deployment:

- [ ] Preview deployment reaches Ready state.
- [ ] Market page loads without error.
- [ ] Market page layout is intact (header, quote card area, market dashboard, treemap/scatter tabs all present).
- [ ] Live Quote Snapshot card displays the compact disabled message when `KIS_ENABLE_MARKET_QUOTE_CARD` is absent or non-`'true'`.
- [ ] No quote network request occurs on page load.
- [ ] No quote network request occurs without explicit user input.
- [ ] Home page is unchanged from prior deployment.
- [ ] Chart AI page is unchanged from prior deployment.
- [ ] Portfolio page is unchanged from prior deployment.
- [ ] Lab page is unchanged from prior deployment.
- [ ] No raw KIS field names are visible in any page state.
- [ ] No token or secret-like text is visible in any page state.
- [ ] No raw error body or stack trace is visible in any page state.
- [ ] Production KIS remains blocked by policy (no production quote calls occur).

---

## 8. Explicit Non-Approvals

The following are explicitly **not** approved by this decision:

- Production deployment.
- Production KIS enablement.
- Enabling `KIS_ENABLE_MARKET_QUOTE_CARD` in Vercel Preview at this stage.
- Expansion to Home, Chart AI, Portfolio, or Lab pages.
- Any direct browser KIS call.
- Any direct browser Supabase quote call.
- Any new API contract or route.
- Any change to the KIS runtime guard.
- Account, order, trading, balance, holdings, or WebSocket features.
- AI analysis coupling with the quote card.
- Portfolio integration with the quote card.
- Any other UI expansion beyond the current Market page implementation.

---

## 9. Sanitization Requirements for the Next Phase

Owner-provided evidence for Phase 3AQ must not include:

- Actual Preview URL (unless explicitly needed and separately approved for recording)
- Actual stock symbol
- Price value
- Raw JSON response body
- Bypass secret
- KIS app key or app secret
- KIS OAuth token
- Supabase URL, project ref, service-role key, or anon key
- Raw KIS field values (`stck_prpr`, `rt_cd`, `prdy_vrss`, `acml_vol`, `msg_cd`, etc.)
- Raw upstream error body
- Stack trace
- Connection string or DB password
- JWT secret

Acceptable evidence formats:

- Boolean check results (e.g., "Market page loaded: true")
- Sanitized deployment status (e.g., "Preview build status: Ready")
- Sanitized page state description (e.g., "Quote card shows disabled message")
- Pass/fail per checklist item
- Reason category if a check fails (e.g., "build failed: type error in X")

---

## 10. Confirmed Non-Actions for Phase 3AP

- No source code changed.
- No scripts changed.
- No `package.json` changed.
- No styles changed.
- No API logic changed.
- No KIS guard changed.
- No Supabase logic changed.
- No Vercel configuration changed.
- No live KIS call by Claude Code.
- No live Supabase query or write by Claude Code.
- No SQL executed.
- No Vercel CLI command run.
- No Vercel environment variable mutated.
- No deployment performed.
- No deployed URL HTTP request by Claude Code.
- No `.env*` file content read.
- No Production KIS enabled.
- `KIS_ENABLE_MARKET_QUOTE_CARD` not enabled.
- No Home, Chart AI, Portfolio, or Lab live quote wiring added.
- No account, order, trading, balance, holdings, or WebSocket feature implemented.
- No actual symbol, price, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace recorded.

---

## 11. Remaining Risks and Limitations

- **Preview deployment not yet performed**: The Phase 3AN code changes have not been deployed to Vercel Preview in any phase from 3AN onward. Preview runtime behavior after these UI changes is unknown.
- **Disabled-state Preview render unvalidated**: The compact disabled card has been confirmed correct by the local browser review (Phase 3AO) but not yet validated on Vercel Preview infrastructure.
- **Active card in Preview unvalidated**: The enabled-state quote lookup UI has not been validated in a Preview environment.
- **Live KIS outage unvalidated**: Provider error paths validated only under no-network mock conditions (Phase 3AK). Real live provider outage behavior remains unobserved.
- **Live Supabase outage unvalidated**: Supabase failure paths validated via mock only.
- **Vercel cold-start token cache behavior uncharacterized**: `accessTokenCache` resets on cold start; token fetch frequency under real Preview traffic is unknown.
- **Production KIS blocked and unvalidated**: `VERCEL_ENV=production` guard unchanged and production endpoint not tested.

---

## 12. Recommended Next Phase

**Phase 3AQ**: Owner-run Vercel Preview deployment with `KIS_ENABLE_MARKET_QUOTE_CARD` absent or non-`'true'`, followed by sanitized browser evidence recording.

Scope of Phase 3AQ:
- Owner deploys to Vercel Preview.
- Owner verifies the Market page in browser using the disabled-state checklist from section 7.
- Owner provides sanitized evidence only.
- Claude Code records the result in a documentation-only phase.

Phase 3AQ must not:
- Enable `KIS_ENABLE_MARKET_QUOTE_CARD` in Preview.
- Validate the active quote lookup flow in Preview.

**Phase 3AR** (future): May separately decide whether to enable `KIS_ENABLE_MARKET_QUOTE_CARD` in Vercel Preview for owner-run active UI validation, if and only if Phase 3AQ disabled-state deployment is confirmed stable and a separate explicit owner approval is given.
