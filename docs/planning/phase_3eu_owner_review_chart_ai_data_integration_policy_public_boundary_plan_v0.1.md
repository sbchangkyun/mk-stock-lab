# Phase 3EU-OWNER-REVIEW — Owner Review of Chart AI Data Integration Policy and Public Boundary Plan

## 1. Status

Prepared — owner policy review pending.

## 2. Background

- Phase 3EU created the Chart AI data integration policy and public boundary plan.
- Phase 3EP owner-local quote preview was accepted.
- Phase 3ES owner-local KIS OHLC smoke passed.
- Phase 3ET owner-local OHLC preview was accepted after HF1 UX simplification.
- Phase 3EN-HF1 restored validation reliability and no known checker failures remain.
- This owner review is required before any 3EV implementation or public data boundary change.

## 3. Review Objective

The owner must review and either accept or revise the Phase 3EU policy decisions before implementation continues.

The review should confirm:
- whether public/default `/chart-ai` should remain sample/mocked for now;
- whether owner-local preview should remain the only approved KIS-backed runtime path;
- whether public live/delayed KIS quote/OHLC remains unauthorized;
- whether `source=live` and `source=auto` should remain blocked/deferred;
- whether the approval gates are sufficient;
- whether the recommended implementation sequence is acceptable.

## 4. Policy Decisions to Review

The owner should review the following key decisions:

1. Public/default `/chart-ai`
   - Remains sample/mocked.
   - Performs no public KIS quote fetch.
   - Performs no public KIS OHLC fetch.
   - Does not use `source=auto`.
   - Does not imply live/current/delayed provider-backed data.

2. Owner-local preview
   - Remains the only approved KIS-backed runtime path.
   - Requires localhost, explicit `source=owner-local`, explicit button click, env flags, and provider gate.
   - Remains no-store and safe-response only.
   - Does not expose raw response, headers, or secrets.

3. Source mode policy
   - `fixture`: allowed for public/default.
   - `mocked`: allowed for public/default.
   - `owner-local`: allowed only for local owner review.
   - `live`: not authorized for public/default use.
   - `auto`: deferred and not implemented.

4. Public production boundary
   - Public production may show sample/mocked/fallback data.
   - Public production must not call KIS quote/OHLC APIs.
   - Public production must not expose `source=live` or `source=auto`.
   - Public production must not reuse owner-local routes.
   - Public production must not imply real-time/current market data.

5. KIS approval gates
   Owner should review whether these gates are sufficient before any public KIS-backed data:
   - KIS API terms and redistribution policy review.
   - Data licensing/commercial approval.
   - Delayed data display approval.
   - OHLC-derived chart display approval.
   - Cache policy approval.
   - Rate limit and quota policy.
   - Secret handling and token refresh policy.
   - Public route authorization model.
   - Abuse/rate limiting policy.
   - Observability/logging/redaction policy.
   - Emergency kill switch.
   - UI labeling policy.
   - Legal/compliance approval.
   - Deployment approval.

6. UI labeling policy
   Owner should review whether the Korean labels are acceptable:

   Sample/mocked:
   - "샘플 OHLC·거래량 데이터"
   - "실제 시세 아님"
   - "투자 판단용 정보가 아닙니다."

   Owner-local:
   - "지연 시세 · 오너 로컬 전용 · KRW"
   - "지연 시세 · KIS OHLC · KRW"
   - "오너 로컬 전용"
   - "실제 투자 판단용 아님"

   Future public delayed data, if ever approved:
   - "지연 시세"
   - provider and delay-basis disclosure required
   - "투자 판단용 정보가 아닙니다."

7. Route/API boundary
   - Existing owner-local routes remain owner-local only.
   - Future public routes must be designed separately.
   - Future public routes must include caching, rate limits, redaction, logging, kill switch, and legal approval.
   - Portfolio valuation route remains fixture-default and safe-gated.

8. Production deployment policy
   Deployment remains unauthorized until:
   - public data mode is chosen;
   - legal/commercial approval is complete;
   - `source=auto` policy is defined or explicitly deferred;
   - route boundary is approved;
   - production env policy is approved;
   - rollback/kill switch is defined;
   - validation suite is green;
   - owner explicitly approves deployment.

9. Decision matrix
   Owner should choose or acknowledge:

   A. Keep public Chart AI sample/mocked only
      - Near-term recommended.
      - Lowest risk.

   B. Add owner-auth gated preview beyond localhost
      - Controlled next step only after auth/security plan.

   C. Add public delayed KIS data after approvals
      - Requires legal/commercial/API approval.

   D. Add `source=auto`
      - Deferred.

## 5. Recommended Owner Decision

Recommended decision:
`PASS_WITH_POLICY_BOUNDARY`

Meaning:
- Accept the Phase 3EU policy boundary as the working baseline.
- Keep public/default `/chart-ai` sample/mocked.
- Keep owner-local preview as the only approved KIS-backed runtime path.
- Keep public live quote/OHLC unauthorized.
- Keep `source=live` unauthorized for public/default use.
- Keep `source=auto` deferred.
- Do not authorize production deployment yet.
- Proceed to either:
  - Phase 3EV-A — Public Sample/Fallback Hardening; or
  - a targeted owner-approved planning phase for auth-gated preview or public delayed data feasibility.

## 6. PASS Criteria

PASS only if the owner accepts all of the following:

- Public/default `/chart-ai` remains sample/mocked for now.
- Owner-local preview remains the only approved KIS-backed runtime path.
- Public live quote remains unauthorized.
- Public live OHLC remains unauthorized.
- `source=live` remains unauthorized for public/default use.
- `source=auto` remains deferred.
- Production deployment remains unauthorized.
- KIS approval gates are sufficient as a baseline.
- UI labeling policy is acceptable as a baseline.
- Route/API boundary is acceptable.
- Fallback/degradation policy is acceptable.
- Security/compliance policy is acceptable.
- Decision matrix is acceptable.
- Recommended implementation sequence is acceptable.

## 7. Revision Routing

If the owner does not accept the policy as-is, route as follows:

- If the owner wants to revise source mode definitions:
  Phase 3EU-HF1 — Source Mode Policy Revision

- If the owner wants public/default behavior changed:
  Phase 3EU-HF2 — Public Default Boundary Revision

- If the owner wants owner-local/auth-gated preview changed:
  Phase 3EU-HF3 — Owner-Local and Owner-Auth Boundary Revision

- If the owner wants KIS approval gates expanded or reduced:
  Phase 3EU-HF4 — KIS Approval Gate Revision

- If the owner wants UI labeling copy revised:
  Phase 3EU-HF5 — Chart AI Data Labeling Policy Revision

- If the owner wants route/API policy revised:
  Phase 3EU-HF6 — Route and API Boundary Revision

- If the owner wants deployment policy revised:
  Phase 3EU-HF7 — Production Deployment Policy Revision

- If the owner accepts the policy:
  Phase 3EU-OWNER-REVIEW-CLOSEOUT — Close out policy review as PASS

## 8. Owner Response Template

Ask the owner to return only this template after policy review:

```
Phase 3EU Owner Review Result

Decision:
PASS / PASS_WITH_NOTES / FAIL / INCONCLUSIVE

Policy decisions:
1. Public/default /chart-ai remains sample/mocked: ACCEPT / REVISE / N/A
2. Owner-local preview remains only approved KIS-backed runtime path: ACCEPT / REVISE / N/A
3. Public live quote remains unauthorized: ACCEPT / REVISE / N/A
4. Public live OHLC remains unauthorized: ACCEPT / REVISE / N/A
5. source=live remains unauthorized for public/default: ACCEPT / REVISE / N/A
6. source=auto remains deferred: ACCEPT / REVISE / N/A
7. Production deployment remains unauthorized: ACCEPT / REVISE / N/A
8. KIS approval gates: ACCEPT / REVISE / N/A
9. UI labeling policy: ACCEPT / REVISE / N/A
10. Route/API boundary: ACCEPT / REVISE / N/A
11. Fallback/degradation policy: ACCEPT / REVISE / N/A
12. Security/compliance policy: ACCEPT / REVISE / N/A
13. Decision matrix: ACCEPT / REVISE / N/A
14. Recommended implementation sequence: ACCEPT / REVISE / N/A

Preferred next step:
A. Phase 3EU-OWNER-REVIEW-CLOSEOUT
B. Phase 3EU-HF*
C. Phase 3EV-A — Public Sample/Fallback Hardening
D. Phase 3EV-B — Owner-Auth Gated Preview Plan
E. Phase 3EV-C — Public Delayed Data Feasibility Review
F. Other: describe

Sanitized notes:
- Do not include secrets.
- Do not include raw KIS responses.
- Do not include actual quote/OHLC/price/volume/timestamp values.
- Do not include screenshots unless specifically requested later.

Revision notes:
- If FAIL or REVISE, describe the policy issue only.
```

## 9. Safety

Confirm:
- no runtime source change in this phase;
- no Chart AI UI change in this phase;
- no API route change in this phase;
- no KIS provider/adapter change in this phase;
- no live KIS call by Codex;
- no dev server launched by Codex;
- no browser opened by Codex;
- no Playwright or Puppeteer used;
- no `.env` read;
- no actual market values recorded;
- no raw response;
- no secrets;
- no account/trading APIs;
- no screenshot committed;
- no public KIS quote/OHLC authorization;
- no `source=live` authorization;
- no `source=auto` authorization;
- no production deployment authorization;
- no Supabase/SQL/migration;
- no Vercel changes;
- no dependency changes;
- no deployment;
- no push.

## 10. Validation

- `npm run check:phase-3eu-owner-review-chart-ai-data-integration-policy`: PASS (47/47).
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

## 11. Recommended Next Step

Recommended:
Owner reviews the Phase 3EU policy and returns the owner response template.

If PASS:
Phase 3EU-OWNER-REVIEW-CLOSEOUT — Close out policy review as PASS

If PASS and owner wants implementation next:
Phase 3EV-A — Public Sample/Fallback Hardening is the safest implementation track.

If REVISE/FAIL:
Route to the relevant Phase 3EU-HF* policy revision listed above.
