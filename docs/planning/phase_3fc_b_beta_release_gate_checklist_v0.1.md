# Phase 3FC-B Beta Release Gate Checklist

## 1. Purpose

This is a checklist for a future beta release. It is not a current approval to enable beta and it
grants no runtime capability by itself. No checkbox on this list has been checked in this phase.

## 2. Required Before Beta

- [ ] Real auth implemented (Supabase Auth subject resolver wired into the route)
- [ ] Usage storage implemented (real `usage_counters`/`usage_events` tables, not mock values)
- [ ] Role assignment implemented (`role_assignments` populated and enforced)
- [ ] Feature flags implemented (`AUTH_RUNTIME_ENABLED`, `USAGE_STORAGE_ENABLED`,
      `CHART_AI_SIMILARITY_BETA_ENABLED` readable and enforced with their dependency rules)
- [ ] Route default remains disabled until the beta flag is explicitly enabled
- [ ] Legal/disclaimer review completed for beta-facing copy
- [ ] Abuse/rate-limit policy defined and enforced beyond the per-role daily/monthly limits
- [ ] Manual QA completed for the real auth/usage runtime (mirroring the Phase 3FB-F manual QA
      pattern)
- [ ] Redaction QA completed — no raw KIS payload, token, or account/trading field appears in any
      beta response
- [ ] No live KIS enabled unless separately approved (`LIVE_KIS_OHLC_ENABLED` remains false unless
      that separate approval has occurred)

## 3. Required Before Public

- [ ] Beta feedback incorporated
- [ ] Public feature flag (`CHART_AI_SIMILARITY_PUBLIC_ENABLED`) approval obtained from the owner
- [ ] Production monitoring/observability decision made (what is logged, where, and for how long)
- [ ] Legal/disclaimer approval finalized for public-facing copy
- [ ] Abuse policy active in production (not just designed)
- [ ] Data retention policy defined for `usage_events` and any other stored history
- [ ] Incident rollback plan defined (how to disable the public flag quickly if a problem is found)
- [ ] Live KIS enabled only if separately resolved and approved (independent of the public flag)

## 4. Explicitly Not Approved Yet

- Public execution of the similarity feature.
- Live KIS connectivity of any kind.
- Storing raw market payloads (OHLC/volume/timestamps) beyond what a future, separately approved
  phase explicitly authorizes.
- Storing any rejected persistence category from the Phase 3FC-A/3FC-B approval package
  (credentials/env/token material in app tables, raw KIS provider payload, trading/account data).
- Anonymous execution of the similarity feature.
