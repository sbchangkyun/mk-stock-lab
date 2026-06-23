# Phase 3AQ Owner-Run Vercel Preview Deployment Plan — Disabled Market Quote Card v0.1

## 1. Title and Metadata

- **Phase**: 3AQ
- **Type**: Owner-run Vercel Preview deployment procedure
- **Status**: Planned
- **Decision basis**: Phase 3AP (`docs/planning/phase_3ap_preview_deployment_decision_v0.1.md`)
- **Target deployment**: Vercel Preview only
- **Feature mode**: `KIS_ENABLE_MARKET_QUOTE_CARD` absent or non-`"true"`
- **Market quote card active state**: disabled or neutral
- **Implementation changes in this phase**: none
- **Deployment by Claude Code**: not performed
- **Vercel CLI by Claude Code**: not used
- **Vercel env mutation by Claude Code**: not performed
- **HTTP requests by Claude Code**: not performed
- **Related deployment decision**: `docs/planning/phase_3ap_preview_deployment_decision_v0.1.md`
- **Related implementation**: `docs/planning/phase_3an_minimal_market_live_quote_card_result_v0.1.md`
- **Related owner browser review**: `docs/planning/phase_3ao_owner_browser_review_market_live_quote_card_result_v0.1.md`
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AQ defines the owner-run procedure for deploying the current branch (`rebuild/phase-1-ia-shell`, commit `99ddbcf` and subsequent documentation commits) to Vercel Preview, with `KIS_ENABLE_MARKET_QUOTE_CARD` absent or non-`"true"` so that the Market quote card renders only its compact disabled message. The goal is to validate Preview build stability, routing, and Market page layout without activating active quote lookup behavior. Claude Code does not perform the deployment and does not execute any Vercel, network, or CLI commands in this phase.

---

## 3. Deployment Mode Decision

- **Target**: Vercel Preview only. Production deployment is not approved.
- **Feature flag**: `KIS_ENABLE_MARKET_QUOTE_CARD` must remain absent or non-`"true"` in the Vercel Preview environment for the first deployment. The card will render only `시세 조회를 사용할 수 없습니다.` — no script runs, no quote network request is made.
- **Active quote lookup**: Not approved in Phase 3AQ. The first Preview deployment validates disabled-state stability only.
- **Goal**: Confirm the Phase 3AN code changes build, route, and render correctly on Vercel Preview infrastructure without any active quote lookup side effects.
- **Enabling the card in Preview**: Requires a separate explicit owner approval in a later phase (Phase 3AS or later), and only after Phase 3AQ disabled-state deployment is confirmed stable.

---

## 4. Owner Pre-Deployment Checklist

Before triggering Preview deployment, the owner should manually verify the following in the Vercel dashboard:

- [ ] `KIS_ENABLE_MARKET_QUOTE_CARD` is absent or not exactly `"true"` in the Vercel Preview environment scope. If it is set to `"true"`, remove or change it before deploying.
- [ ] `KIS_ACCOUNT_NO` remains absent from all Vercel environment scopes (Preview and Production). Do not add it.
- [ ] No Production deployment is being triggered — confirm the target environment is Preview only.
- [ ] Production KIS remains blocked by policy (no change to env vars that would affect the `getKisQuoteConfigReadiness()` production guard).
- [ ] No additional pages (Home, Chart AI, Portfolio, Lab) are being connected to live quote data as part of this deployment.
- [ ] Required Preview env vars from earlier phases (e.g., KIS app key, KIS app secret, KIS base URL, Supabase URL, Supabase anon key, KIS_ENABLE_PREVIEW_LIVE_QUOTES) remain present and unchanged in Preview scope, as previously verified in Phase 3AI.
- [ ] Deployment Protection settings (bypass secret, authentication) are understood by the owner and remain as configured. Do not copy bypass secrets into documents, chats, or clipboard history beyond what is needed to access the deployment.
- [ ] No secret values, Supabase URLs, Preview URLs, or tokens should be pasted into any document, chat session (including this session), or external tool.

---

## 5. Owner Deployment Trigger Options

The owner may use any of the following owner-run methods to trigger or confirm a Preview deployment. Claude Code must not run any of these commands.

### Option A: Push the existing branch (if not already at HEAD on remote)

If the branch has commits that have not yet been pushed to the remote, pushing the branch will trigger a Vercel Preview deployment automatically:

```powershell
# Owner runs manually in PowerShell — Claude Code must not run this
cd "C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab"
git status --short
git push origin rebuild/phase-1-ia-shell
```

### Option B: Owner-run empty commit (if a redeploy trigger is needed)

If the branch is already at HEAD on the remote and a new deployment is needed, the owner may create an empty commit to trigger a redeploy:

```powershell
# Owner runs manually in PowerShell — Claude Code must not run this
cd "C:\Users\kkama\OneDrive\문서\Project\mk-stock-lab"
git status --short
git commit --allow-empty -m "chore: trigger preview deploy for disabled quote card"
git push origin rebuild/phase-1-ia-shell
```

### Option C: Vercel dashboard redeploy

The owner may trigger a redeploy directly from the Vercel dashboard without any git operation, if Vercel already has the current branch at the desired commit.

### Notes on trigger options

- **Claude Code must not run Vercel CLI**, trigger deployment, call `vercel deploy`, run `vercel redeploy`, or push to the remote.
- **Claude Code must not create or push an empty commit** on the owner's behalf.
- The owner should select whichever trigger method is most appropriate given the current remote state.
- After deployment completes, the owner should report sanitized evidence using the format in section 7.

---

## 6. Preview Browser Validation Checklist

After the Preview deployment reaches Ready state, the owner should verify the following in the browser:

**Deployment status:**
- [ ] Preview deployment reached Ready state (no build error, no deployment error).

**Market page:**
- [ ] Market page loads without error.
- [ ] Market page layout is intact: page header, quote card area, market dashboard tab controls, treemap/scatter panels all present.
- [ ] Live Quote Snapshot card area shows the compact disabled message (`시세 조회를 사용할 수 없습니다.`) because `KIS_ENABLE_MARKET_QUOTE_CARD` is absent or non-`"true"`.
- [ ] No quote lookup form or input is visible (disabled-state card only).
- [ ] No quote network request occurs on page load (can be verified in browser DevTools Network tab).
- [ ] Market dashboard treemap and scatter controls remain functional.

**Other pages (unchanged check):**
- [ ] Home page loads and remains unchanged from prior deployment.
- [ ] Chart AI page loads and remains unchanged from prior deployment.
- [ ] Portfolio page loads and remains unchanged from prior deployment.
- [ ] Lab page loads and remains unchanged from prior deployment.

**Safety checks:**
- [ ] No raw KIS field names (`stck_prpr`, `rt_cd`, `prdy_vrss`, `acml_vol`, `msg_cd`, etc.) are visible in any page state.
- [ ] No token or secret-like text is visible in any page state.
- [ ] No raw error body is visible in any page state.
- [ ] No stack trace is visible in any page state.

**Optional responsive check:**
- [ ] At mobile width (375–390px): Market page has no new horizontal scroll.

---

## 7. Sanitized Evidence Format for Owner to Report

When the owner has completed the deployment and browser validation, they should report the result to Claude Code using the following format only. No actual URLs, symbols, prices, secrets, or raw values should be included.

```
Phase 3AQ owner-run Preview deployment result:

Deployment:
  Preview deployment triggered by owner: yes/no
  Preview deployment reached Ready: yes/no
  Deployment trigger method: git push / empty commit / Vercel dashboard / other sanitized

Feature flag state:
  KIS_ENABLE_MARKET_QUOTE_CARD in Preview: absent / non-true / unknown
  KIS_ACCOUNT_NO absent: yes / no / unknown

Browser review:
  Market page loads: yes/no
  Quote card disabled or neutral: yes/no
  No auto-fetch observed on page load: yes/no
  Market dashboard intact: yes/no
  Home unchanged: yes/no
  Chart AI unchanged: yes/no
  Portfolio unchanged: yes/no
  Lab unchanged: yes/no
  Raw KIS fields visible: no/yes
  Token/secret-like text visible: no/yes
  Raw error or stack trace visible: no/yes
  Mobile no horizontal scroll: yes/no/not checked

Decision:
  passed / needs adjustment / blocked

Notes:
  [free text — no URLs, no symbols, no prices, no secrets, no raw values]
```

The owner must not paste into this report:
- Actual Preview URL
- Actual stock symbol
- Price value
- Raw JSON response body
- Bypass secret
- KIS app key or app secret
- KIS OAuth token
- Supabase URL, project ref, service-role key, or anon key
- Raw KIS field values
- Raw upstream error body
- Stack trace
- Connection string, DB password, or JWT secret

---

## 8. Explicit Non-Approvals

The following are explicitly **not** approved in Phase 3AQ:

- Production deployment.
- Production KIS enablement.
- Enabling `KIS_ENABLE_MARKET_QUOTE_CARD` in Vercel Preview.
- Active quote lookup validation in Preview.
- Expansion to Home, Chart AI, Portfolio, or Lab pages.
- Any direct browser KIS call.
- Any direct browser Supabase quote call.
- Any new API contract or route.
- Any change to the KIS runtime guard.
- Account, order, trading, balance, holdings, or WebSocket features.
- AI analysis coupling with the quote card.
- Portfolio integration with the quote card.
- Any other UI expansion beyond the current Market page disabled-state implementation.

---

## 9. Future Result-Recording Plan

Phase 3AR should record the owner-run Preview deployment result when the owner provides sanitized evidence using the format in section 7.

Claude Code's role in Phase 3AR:
- Create a result document based on owner-provided sanitized evidence only.
- Prepend a changelog entry.
- Commit documentation-only changes.

Claude Code must not in Phase 3AR:
- Call the Preview URL.
- Run Vercel CLI.
- Mutate Vercel env vars.
- Deploy.
- Record actual Preview URLs, stock symbols, prices, bypass secrets, raw JSON, or raw errors.

If the owner reports a failure in Phase 3AQ, Phase 3AR should record the failure category and recommended next action without recording the raw error output.

---

## 10. Remaining Risks and Limitations

- **Preview deployment not yet performed**: Phase 3AQ defines the procedure; the actual deployment is owner-run and has not yet occurred.
- **Phase 3AQ validates disabled-state only**: Active Market quote lookup behavior in Preview remains unvalidated and blocked for this phase.
- **Active card Preview behavior unvalidated**: The enabled-state quote lookup UI has not been validated in a Preview environment in any prior phase.
- **Live KIS outage behavior unvalidated**: Provider error paths have been validated only under no-network mock conditions (Phase 3AK). Real live KIS outage has not been observed.
- **Live Supabase outage behavior unvalidated**: Supabase failure paths validated via mock only.
- **Vercel cold-start token cache behavior uncharacterized**: `accessTokenCache` resets on cold start; token fetch frequency under real Preview traffic is unknown.
- **Production KIS blocked and unvalidated**: `VERCEL_ENV=production` guard unchanged; production endpoint not tested.

---

## 11. Recommended Next Phase

**Phase 3AR**: Owner-run Vercel Preview deployment result recording with sanitized browser evidence.

- Owner performs the deployment and browser validation per this document's checklists (sections 4–6).
- Owner reports sanitized evidence using the format in section 7.
- Claude Code creates a result document and changelog entry based on owner-provided evidence only.

**Phase 3AS** (future, conditional): If Phase 3AR disabled-state deployment passes, Phase 3AS may decide whether to enable `KIS_ENABLE_MARKET_QUOTE_CARD` in Vercel Preview for owner-run active quote lookup validation. No active card enablement should occur without a separate explicit owner approval in Phase 3AS or later.

---

## 12. Confirmed Non-Actions for Phase 3AQ

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
- No active quote lookup validation performed.
- No Home, Chart AI, Portfolio, or Lab live quote wiring added.
- No account, order, trading, balance, holdings, or WebSocket feature implemented.
- No actual symbol, price, Preview URL, bypass secret, secret, token, raw KIS field, raw error, or stack trace recorded.
