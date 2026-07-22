# Phase 3EF - Portfolio Mixed-Currency Preview UI Implementation Result

## 1. Status

Implemented - local-only mixed-currency owner-preview UI ready; no deployment.

## 2. Background

Phase 3EB implemented the strictly gated mixed-currency owner-preview API with mocked FX. Phase 3EC prepared the owner-run smoke tooling, Phase 3ED recorded the owner smoke PASS, and Phase 3EE defined the Portfolio UI wiring contract implemented here.

## 3. Implemented Scope

- Local-only activation: requires an exact `localhost` or `127.0.0.1` hostname, `previewMode=owner`, and `fxPreview=mocked`.
- API request mapping: sends the existing normalized position array with `source=live`, `previewMode=owner`, `allowLiveQuotes=true`, `allowMockedFx=true`, `fxMode=mocked`, and `baseCurrency=KRW` only for the explicit mixed preview branch.
- UI state model: adds explicit `fixture`, `owner-kr-live-preview`, `owner-mixed-mocked-fx-preview`, `unavailable`, and `blocked` states.
- Mixed mocked-FX metadata validation: requires the owner live response envelope, `mixedCurrencyPreview=true`, mocked/sample FX, `fxSource=mocked`, `fxStaleState=sample`, and the provider-leakage guard while accepting unavailable rows and a null aggregate.
- Label policy: the mixed branch alone shows `오너 미리보기`, `Mocked FX`, `샘플 환율`, `미리보기 전용`, and `실제 시세 아님`.
- Row unavailable display: keeps each row visible, shows dashes for unavailable financial values, and distinguishes missing quotes from unsupported currencies when normalized metadata allows it.
- Aggregate null display: replaces the aggregate label with an unavailable state and withholds total market value, P&L, and return.
- Metadata/leakage safety: retains only normalized preview fields and does not render or log request bodies, response bodies, provider metadata, raw provider fields, headers, or identifiers.
- Mobile/layout safety: the preview notice is scoped, shrink-safe, wrapping, and adds no fixed desktop width; existing local horizontal-scroll owners remain unchanged.

## 4. Preserved Behavior

- Fixture default: unchanged and still used for public/default requests.
- KR-only owner preview: preserved with its existing eligibility and request shape when `fxPreview=mocked` is absent.
- Public production: remains fixture-only; the mixed activation cannot pass outside the exact local hostname gate.
- `source=auto`: remains deferred and is not added.
- Real FX provider: remains blocked; this phase uses only the existing mocked-FX API gate.
- US quote provider: not implemented; unavailable US rows remain visible.

## 5. Validation

- `npm run check:phase-3ef-mixed-currency-preview-ui`: PASS, 65/65.
- `npm run check:phase-3ee-mixed-currency-preview-ui-plan`: PASS, 135/135.
- `npm run check:phase-3ed-owner-mixed-currency-smoke-closeout`: PASS, 66/66.
- `npm run check:phase-3eb-mixed-currency-owner-preview-api`: PASS, 92/92.
- `npm run check:phase-3ea-real-fx-adapter-mocked-first`: PASS, 124/124.
- `npm run check:portfolio-live-preview-api`: PASS, 110/110.
- `npm run check:mobile-baseline`: PASS, 74/74.
- `npm run check:production-domain`: PASS, 33/33.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run guard:production-mobile-geometry`: `DRY_RUN`; no browser launch and no network request.
- Optional `npm run check:phase-3dx-ui-architecture-plan`: observational 93/94. Its 93 architecture assertions passed; the known historical `52fcfb7` runtime-change baseline assertion remained non-blocking and the checker was not changed.

The Phase 3EB, Phase 3ED, and Phase 3EE checkers initially rejected the authorized Phase 3EF Portfolio edit because their historical scope ran from an old baseline through the current working tree. Their assertions were not weakened: each checker was corrected to compare only its completed commit span, then passed in full.

## 6. Safety Confirmation

- No active owner smoke by Codex: confirmed.
- No live KIS call: confirmed.
- No live FX call: confirmed.
- No production geometry: confirmed; only the dry-run guard is authorized.
- No deployment: confirmed.
- No push: confirmed.
- No secrets: confirmed; no environment or secret file was read.
- No Supabase/SQL/migration: confirmed.
- No Vercel changes: confirmed.
- No new dependencies: confirmed.

## 7. Owner Review Scope

Recommended next phase: Phase 3EG - Owner Local Mixed-Currency Preview UI Review.

The owner should visually review only:

- local URL activation;
- owner-preview badge;
- mocked/sample FX label;
- unavailable USD row display;
- aggregate null display;
- no real-time/current wording;
- mobile 390px layout;
- fixture default unaffected;
- production preview blocked.

## 8. Next Phase Recommendation

Recommended next phase: Phase 3EG - Owner Local Mixed-Currency Preview UI Review.

Alternative: Phase 3EF-HF1 - UI Contract Fix, only if static validation identifies an implementation defect.
