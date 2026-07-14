# Instrument-Master Refresh — Owner Input Checklist — v0.1

Inputs the owner must decide before / during implementation of
**Phase 3GG-T-HF3B-HF2-INSTRUMENT-MASTER-AUTOMATION**. Discovery-only doc — no secrets requested here,
no action taken. Provide values in the implementation phase, not in this repo.

## A. REQUIRED BEFORE IMPLEMENTATION

1. **Authoritative KR ETF source decision** — choose one:
   - (a) Owner downloads the KRX ETF list in a browser (credential-free) → run the committed discovery
     parsers; **or**
   - (b) Obtain a **data.go.kr** API key for `금융위원회_KRX상장종목정보` (cleaner open-data terms); **or**
   - (c) Apply for a **KRX Open API** AUTH_KEY + service approval (note: ToS restricts re-providing data).
2. **Data-use / terms confirmation** — owner/legal review that committing normalized KR codes/names and
   serving client-safe search metadata is permitted for the chosen source (KRX API channel is CLEARLY
   RESTRICTED for third-party provision; data.go.kr is the most promising).
3. **KR symbol-shape widening approval** — allow `^[0-9A-Z]{6}$` (admits the 283 alphanumeric ETF codes);
   confirms a schema change to `instrument.ts`, the generator, and the search module.
4. **KR ETF exchange label** — confirm ETFs carry `exchange: "KOSPI"` (consistent with the 7 anchors) or a
   dedicated label.

## B. REQUIRED BEFORE REMOTE SCHEDULE ACTIVATION

5. **GitHub default-branch / push decision** — authorize pushing/merging the refresh workflow to **`main`**
   (a scheduled Action only runs from the default branch). Confirms lifting the current no-push policy for
   the workflow + master.
6. **Workflow permissions** — grant `contents: write` and/or `pull-requests: write` (or decide a bot/PAT is
   needed) for the refresh job to commit or open a PR.
7. **Automatic-PR authorization** — approve Mode 1 (report-only) then Mode 2 (auto-PR); confirm **no
   auto-deploy**.
8. **Refresh schedule sign-off** — accept the proposed cron times (or adjust) in the operating policy.
9. **Threshold sign-off** — accept the per-axis blocking thresholds (total drop 5% / growth 25% / removals
   50 / mapping rate 95% / anchor set) or provide alternatives.
10. **Master-update review owner** — who reviews/merges refresh PRs.
11. **Branch-protection rules** — whether `main` requires PR review / status checks before merge.

## C. OPTIONAL / FOR FUTURE AUTOMATION

12. **Inactive-archive retention** — confirm "preserve indefinitely" (recommended) vs a retention window.
13. **data.go.kr attribution** — attribution string if that source is adopted.
14. **Mode 3 (low-risk auto-merge)** — whether/when to enable after an observation period.
15. **Alerting** — where refresh failures should notify (e.g. existing Supabase/Slack).

## D. NOT REQUESTED HERE

- No API keys, tokens, passwords, or secrets should be placed in this repository or in these docs. Provide
  them via GitHub Actions **Secrets** during the implementation phase only.
