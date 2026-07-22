# Validation Commands

## Initial repository checks

```powershell
git status --short
git branch --show-current
git rev-parse --short HEAD
git log -1 --oneline
```

Expected:

- Branch `rebuild/phase-1-ia-shell`.
- Baseline HEAD `e6c7679`.

## Validation commands

```powershell
npm run check:phase-3fe-a-handoff-chart-ai-new-chat-package
npm run check:phase-3fe-a-kis-ohlc-provider-owner-local-integration
npm run smoke:phase-3fe-a-kis-ohlc-provider-owner-local-integration
npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation
npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation
npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off
npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off
npm run build
git diff --check
```

## Forbidden diff checks

```powershell
git diff --name-only e6c7679 -- src pages src/pages src/lib src/data supabase package-lock.json pnpm-lock.yaml yarn.lock .env .env.local
```

After implementation, use the starting commit for this phase if HEAD has changed.

## Sensitive identifier check guidance

- Search changed files only.
- Do not inspect `.env`, `.env.local`, or `.env.*`.
- Do not print sensitive values.
