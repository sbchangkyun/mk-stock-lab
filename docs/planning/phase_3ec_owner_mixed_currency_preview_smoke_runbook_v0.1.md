# Phase 3EC - Owner Mixed-Currency Preview Smoke Runbook

## 1. Purpose

This runbook prepares the owner to validate the Phase 3EB mixed-currency Portfolio preview through the local API. The smoke confirms the explicit owner gate, mocked FX metadata, unavailable US row behavior, aggregate availability state, and provider-leakage boundary without printing financial values or response contents.

## 2. Safety Boundary

- Owner execution only. Codex must not run active mode.
- Local non-production server only.
- The script defaults to a no-network dry-run.
- Active mode requires all five Phase 3EC guards to equal `YES`.
- The script never prints its target URL, request body, response body, prices, quantities, totals, P&L, headers, account data, credentials, or stack traces.
- Public production, `source=auto`, US quote-provider work, and live FX remain blocked.

## 3. Preconditions

- Branch is `rebuild/phase-1-ia-shell` at the Phase 3EC preparation commit.
- The tracked tree is clean.
- Node and project dependencies are already installed.
- Port 4321 is available for the local Astro server.
- The owner understands that the KR position uses the existing owner-gated quote path; the USD position remains unavailable because no US quote endpoint exists.
- Share only the sanitized output fields described below.

## 4. Start Local Dev Server

In a separate PowerShell terminal:

```powershell
npm run dev
```

Confirm locally that the server is listening on the default Astro port. Do not share terminal environment values or configuration output.

## 5. Dry-Run Command

Run without any Phase 3EC guards:

```powershell
npm run smoke:portfolio-mixed-currency-preview-api:owner
```

Expected behavior: exit without an API call and print only a sanitized dry-run, preflight label, and PASS result.

## 6. Active Owner Smoke Command

Run only after the local server is ready:

```powershell
$env:PHASE_3EC_OWNER_SMOKE="YES"; $env:PHASE_3EC_ALLOW_LOCAL_API="YES"; $env:PHASE_3EC_ALLOW_MOCKED_FX="YES"; $env:PHASE_3EC_ALLOW_MIXED_CURRENCY="YES"; $env:PHASE_3EC_SANITIZED_OUTPUT_ONLY="YES"; npm run smoke:portfolio-mixed-currency-preview-api:owner; Remove-Item Env:\PHASE_3EC_OWNER_SMOKE; Remove-Item Env:\PHASE_3EC_ALLOW_LOCAL_API; Remove-Item Env:\PHASE_3EC_ALLOW_MOCKED_FX; Remove-Item Env:\PHASE_3EC_ALLOW_MIXED_CURRENCY; Remove-Item Env:\PHASE_3EC_SANITIZED_OUTPUT_ONLY
```

Do not change the target or add production configuration. Always remove the guards after the command completes.

## 7. Expected Sanitized Output

Expected successful active output consists only of lines shaped like:

```text
phase3ec step=preflight status=pass target=local-api sanitized=true
phase3ec step=api-call status=pass httpStatus=200 sanitized=true
phase3ec step=contract status=pass source=live previewMode=owner mixedCurrencyPreview=true mockedFx=true sanitized=true
phase3ec step=rows status=pass rowCount=<count> unavailableRows=<count> unsupportedCurrencyRows=<count> missingQuoteRows=<count> sanitized=true
phase3ec step=fx status=pass fxSource=mocked fxStaleState=sample rateValuePrinted=false sanitized=true
phase3ec step=aggregate status=pass aggregateState=<null-or-available> valuesPrinted=false sanitized=true
phase3ec step=provider-leakage status=pass sanitized=true
phase3ec result=PASS sanitized=true
```

Counts, booleans, contract labels, and the HTTP status are safe to share. Do not supplement this output with copied API or server data.

## 8. What Not to Share

Do not share:

- request or response contents;
- prices, quantities, cost basis, totals, market values, or P&L;
- provider fields or payloads;
- headers, URLs, account identifiers, tokens, credentials, environment values, or stack traces;
- local server logs, screenshots, browser storage, or production page text.

## 9. Pass / Fail Decision Rules

PASS requires:

- `httpStatus=200`;
- `source=live` and `previewMode=owner`;
- `mixedCurrencyPreview=true` and `mockedFx=true`;
- `fxSource=mocked` and `fxStaleState=sample`;
- safe row counts and aggregate state;
- provider-leakage check PASS;
- final `result=PASS`.

Any safe failure code is FAIL. Do not retry active mode or share additional output. Record only the safe code in the result template.

## 10. Next Phase Routing

- PASS: Phase 3ED - Owner Mixed-Currency Preview Smoke Closeout.
- FAIL: Phase 3EC-HF1 - Sanitized Mixed-Currency Smoke Diagnosis. Keep active retry blocked until the failure is reviewed.
