# Validation Commands

Current recommended validation chain (baseline `dcb6724`, from Phase 3FF-A-HOUSEKEEPING-A):

```
npm run check:phase-3ff-a-housekeeping-a
npm run check:phase-3fd-j-handoff-chart-ai-new-chat-package
npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation
npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation
npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off
npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off
npm run check:phase-3ff-a-ui-c-manual-qa
npm run smoke:phase-3ff-a-mk-c
npm run check:phase-3ff-a-mk-c
npm run smoke:phase-3ff-a-sp-b
npm run check:phase-3ff-a-sp-b
npm run smoke:phase-3ff-a-mk-b
npm run check:phase-3ff-a-mk-b
npm run check:phase-3ff-a-ui-b-manual-qa
npm run smoke:phase-3ff-a-ui-a
npm run check:phase-3ff-a-ui-a
npm run smoke:phase-3ff-a-mk-a
npm run check:phase-3ff-a-mk-a
npm run smoke:phase-3ff-a-sp-a
npm run check:phase-3ff-a-sp-a
npm run check:phase-3ff-a-plan
npm run build
git diff --check
```

## Forbidden diff check

```
git diff --name-only dcb6724 -- src/pages/chart-ai.astro src/lib/server/chart-ai/mk-agent.mjs src/lib/server/chart-ai/mk-agent.fixture.mjs src/lib/server/chart-ai/similar-pattern-agent.mjs src/lib/server/chart-ai/similar-pattern-agent.fixture.mjs pages/api src/pages/api components supabase src/data package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```

Expected output: empty.

## Notes

- All 21 commands above plus `npm run build` and `git diff --check` passed cleanly as of the `dcb6724` baseline (Phase 3FF-A-HOUSEKEEPING-A validation run).
- Any future phase that prepends a new entry above the current top of `docs/planning/planning_changelog.md` should check whether sibling checkers' `TOLERATED_HEADERS_ABOVE_*` allowlists and scope-tolerance file lists need extending — see [02_COMPLETED_PHASE_HISTORY.md](02_COMPLETED_PHASE_HISTORY.md) (HOUSEKEEPING-A entry) for the pattern and rationale.
