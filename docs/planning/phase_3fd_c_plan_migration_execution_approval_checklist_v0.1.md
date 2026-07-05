# Phase 3FD-C-PLAN Migration Execution Approval Checklist

## 1. Purpose

This checklist gates a future migration phase. No migration is created or executed here, and no
SQL file is created here.

## 2. Preconditions Before Migration Creation

- [ ] Owner approves the role assignment table design.
- [ ] Owner approves the usage counter table design.
- [ ] Owner approves the usage event table design.
- [ ] Owner approves the RLS strategy.
- [ ] Owner approves the retention policy.
- [ ] Owner approves the idempotency policy.
- [ ] Owner approves the rollback and backup plan.
- [ ] Owner approves the target environment.
- [ ] Owner approves keeping route success disabled during migration work.

## 3. Preconditions Before Migration Execution

- [ ] Migration file is reviewed.
- [ ] Rollback procedure is reviewed.
- [ ] Backup or snapshot decision is completed.
- [ ] Target environment is confirmed.
- [ ] Service-role handling is explicitly approved, if required.
- [ ] Migration contains no secrets.
- [ ] Schema contains no raw user, session, or token fields.
- [ ] Schema contains no KIS, account, trading, order, or balance fields.
- [ ] Route success remains disabled.
- [ ] Beta and public execution remain disabled.

## 4. Post-Migration Validation Plan

- [ ] Confirm expected table existence.
- [ ] Confirm approved constraints.
- [ ] Confirm approved indexes.
- [ ] Confirm RLS is enabled if approved.
- [ ] Confirm client writes are blocked.
- [ ] Confirm the later server-only write path, when separately implemented.
- [ ] Confirm route success remains disabled.
- [ ] Confirm no public exposure exists.

## 5. Explicit Non-Approvals

This checklist does not approve migration creation. It does not approve migration execution,
real database runtime, route integration, beta activation, public activation, or live KIS access.
