# Phase 3FC-G Owner Approval Gate Checklist

## 1. Purpose

This checklist separates the distinct approvals the owner must grant before later phases proceed:

- Route scaffold approval.
- Real Supabase approval.
- Real database approval.
- Beta approval.
- Public approval.
- Live KIS approval.

Each approval is independent; granting one does not imply another.

## 2. Route Scaffold Approval

- [ ] Approve Phase 3FC-H route scaffold.
- [ ] Confirm all flags remain off.
- [ ] Confirm no live KIS.
- [ ] Confirm no real Supabase/DB.
- [ ] Confirm no public/beta activation.

## 3. Real Supabase Approval

- [ ] Approve package install.
- [ ] Approve environment variable key names, not values.
- [ ] Approve server-side auth runtime.
- [ ] Approve no token echo.
- [ ] Approve no client-side role trust.

## 4. Real DB Approval

- [ ] Approve SQL/migration design.
- [ ] Approve RLS policy.
- [ ] Approve role assignment table.
- [ ] Approve usage counters/events.
- [ ] Approve retention policy.
- [ ] Approve idempotency strategy.

## 5. Beta Approval

- [ ] Legal/disclaimer review.
- [ ] Abuse/rate-limit policy.
- [ ] Monitoring/logging policy.
- [ ] Manual QA.
- [ ] Redaction QA.
- [ ] Rollback plan.

## 6. Live KIS Approval

- [ ] Confirm network/TCP reachability.
- [ ] Approve a KIS-specific phase.
- [ ] Approve redacted owner-local KIS call.
- [ ] Confirm no raw KIS values in output.
- [ ] Confirm no public/beta KIS route.
- [ ] Confirm `LIVE_KIS_OHLC_ENABLED` remains false until separate activation approval.
