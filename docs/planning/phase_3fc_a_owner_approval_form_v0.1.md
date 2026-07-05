# Phase 3FC-A Owner Approval Form

This form is for the owner to fill in. No box on this form has been checked by Claude Code. No
implementation will begin until this form is completed and the corresponding sections in
[phase_3fc_a_real_auth_provider_selection_usage_storage_approval_v0.1.md](phase_3fc_a_real_auth_provider_selection_usage_storage_approval_v0.1.md)
and
[phase_3fc_a_auth_usage_decision_matrix_v0.1.md](phase_3fc_a_auth_usage_decision_matrix_v0.1.md)
are reviewed.

## 1. Auth Strategy Decision

- [ ] App-native auth
- [ ] Supabase Auth
- [ ] Auth.js/NextAuth-style adapter
- [ ] Managed identity provider
- [ ] Temporary invite-code beta gate
- [ ] Other: ___________________________

Selected option: ___________________________

Notes: ___________________________

## 2. Usage Storage Decision

- [ ] Postgres/Supabase-style table
- [ ] KV/Redis-style counter
- [ ] Existing app database
- [ ] Hybrid audit-log + counter
- [ ] Other: ___________________________

Selected option: ___________________________

Notes: ___________________________

## 3. Role/Limit Approval

| Role | Approved daily limit | Approved monthly limit | Can execute similarity? | Notes |
|---|---|---|---|---|
| anonymous | | | Yes / No | |
| authenticated | | | Yes / No | |
| beta | | | Yes / No | |
| owner | | | Yes / No | |
| admin | | | Yes / No | |

## 4. Data Persistence Approval

- [ ] Store usage counters
- [ ] Store usage events
- [ ] Store role assignments
- [ ] Store feature flag audit
- [ ] Do not store raw KIS payload
- [ ] Do not store trading/account data
- [ ] Do not store credentials/env/token material in app tables

## 5. Feature Flag Approval

- [ ] Approve `AUTH_RUNTIME_ENABLED` flag
- [ ] Approve `USAGE_STORAGE_ENABLED` flag
- [ ] Approve `CHART_AI_SIMILARITY_BETA_ENABLED` flag
- [ ] Approve `CHART_AI_SIMILARITY_PUBLIC_ENABLED` flag
- [ ] Confirm `LIVE_KIS_OHLC_ENABLED` remains separate from this approval

## 6. Next Phase Approval

- [ ] Approve Phase 3FC-B — Real Auth/Usage Runtime Design Finalization from Owner Decisions
- [ ] Request revisions to this decision package
- [ ] Run Phase 3FB-G — Owner Manual QA Findings Incorporation first
- [ ] Pause — no next phase yet

## 7. Owner Sign-off

Decision date: ___________________________

Approver: ___________________________

Notes: ___________________________
