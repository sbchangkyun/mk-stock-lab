# Validation Commands

Run validation from the repository root: `E:\개인 프로젝트\mk-stock-lab`.

Do not inspect `.env`, `.env.local`, or `.env.*`. Do not print credentials, tokens, cookies, sessions, raw user IDs, raw emails, or provider secrets.

## Initial Repository Checks

```powershell
git status --short
git branch --show-current
git rev-parse --short HEAD
```

Expected current baseline for this handoff package:

- Branch: `rebuild/phase-1-ia-shell`
- Latest completed commit: `6a7a51d`
- Known unrelated untracked paths may include `.agents/`, `.vscode/settings.json`, `docs/handoff/`, and `skills-lock.json`.

## Latest Phase Validation Commands

```powershell
npm run check:phase-3fd-j-similar-pattern-route-owner-local-activation
npm run smoke:phase-3fd-j-similar-pattern-route-owner-local-activation
npm run check:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off
npm run smoke:phase-3fd-i-real-auth-server-guard-foundation-all-gates-off
npm run check:phase-3fd-h-hf1-chart-ai-login-gate-visual-alignment
npm run check:phase-3fd-h-chart-ai-login-gate-master-cooldown-exemption-mocked-ui
npm run check:phase-3fd-e-guarded-route-runtime-composition-scaffold-all-gates-off
npm run smoke:phase-3fd-e-guarded-route-runtime-composition-scaffold-all-gates-off
```

## Build And Diff Commands

```powershell
npm run build
git diff --check
```

## Forbidden Path Diff Examples

For documentation-only handoff work, source/runtime files should not change:

```powershell
git diff --name-only <startingCommit> -- src pages src/pages src/lib src/data supabase package-lock.json pnpm-lock.yaml yarn.lock
```

For Phase 3FE-A, the future approved prompt must define a fresh forbidden-path diff based on its allowed file list.

## Sensitive Identifier Check Guidance

- Search changed files for email-like literals and UUID-like literals.
- Do not include raw owner identifiers in docs, prompts, checker scripts, examples, source comments, package metadata, or final reports.
- Use placeholders only: `MASTER_USER_ID`, `MASTER_EMAIL`, `isMasterUser`, `canBypassAnalysisCooldown`.
- Confirm no raw provider payload, raw OHLC row, token, cookie, session, stack trace, or environment value is added to UI-visible output.
