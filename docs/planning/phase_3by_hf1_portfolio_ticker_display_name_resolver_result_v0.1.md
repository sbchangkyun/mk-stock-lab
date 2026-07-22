# Phase 3BY-HF1 Portfolio Ticker Display Name Resolver Hotfix — Result v0.1

## 1. Title and Metadata

- **Phase**: 3BY-HF1
- **Type**: Portfolio Ticker Display Name Resolver Hotfix
- **Status**: Implemented
- **Latest prior commit**: e6fbde1 docs: prepare portfolio valuation owner review
- **Runtime UI changes**: yes — Portfolio display-name resolution only (no API, no server, no DB)
- **API route changes**: none
- **DB / Supabase changes**: none
- **Live KIS calls**: none
- **Live GNews calls**: none
- **External HTTP**: none
- **Deployment**: not performed

## 2. Owner Issue Found in Phase 3BY Visual Review

Phase 3BY visual review mostly passed:
- Fixture valuation values displayed correctly for supported KR symbols.
- Unsupported symbol fallback (연동 예정) worked correctly.
- Dividend placeholders (데이터 대기) were unchanged.
- Sort by 평가금/수익률/수익금 worked plausibly.
- Refresh worked without misleading live wording.
- Tab order persistence still worked after refresh.

**Issue found:** When entering known KR ticker codes (005930, 000660, 035420, 069500), the position was registered correctly, but the visible primary name remained the ticker/code string rather than a human-readable company or ETF display name.

- Example: entering `005930` showed `005930` as primary label.
- Expected: known ticker entries should display the company/ETF name from local metadata — e.g., `005930` → `Samsung Electronics` (from securityLogos.json).
- Secondary label showed `티커 직접 입력`, which is correct for an unknown ticker but misleading when local metadata is available.

## 3. Root Cause

- `toPositionIdentity(value)` previously returned `name: ''` for all ticker-like input (alphanumeric ≤16 chars and 6-digit KR codes), regardless of whether local metadata existed for that ticker.
- `getPositionPrimaryLabel(position)` fell back to `position.symbol` when `position.name` was empty — so the ticker string appeared as the primary label.
- `getPositionSecondaryLabel(position)` showed `티커 직접 입력` whenever `position.name` was empty and `position.symbol` existed — even for tickers that have local metadata.
- Existing saved positions in the database that were created before the hotfix also had `name: ''`, meaning they were also affected unless the display fallback was corrected.

## 4. Fix Summary

### New helpers added to portfolio.astro

```typescript
const resolveSecurityMetadata = (input: string | null | undefined) => {
  const key = normalizeLogoKey(input);
  return key ? (logoMappings[key] ?? null) : null;
};
const resolveDisplayNameForSymbol = (symbol: string, fallbackName?: string | null) =>
  resolveSecurityMetadata(symbol)?.name || fallbackName || '';
```

These helpers use the already-imported `securityLogoMap` via `logoMappings`. No external API, no server call, no async lookup.

### `toPositionIdentity` updated (creation behavior)

When a user enters a known ticker at position creation time:
- `resolveSecurityMetadata(symbol)` looks up the ticker in `logoMappings`.
- If a mapping exists: `name = mapped.name`, `symbol = mapped.symbol || symbol`.
- If no mapping: `name = ''` (ticker-like) or `name = normalized` (free text) — unchanged from before.

### `getPositionPrimaryLabel` updated (display behavior for existing saved rows)

Priority order:
1. `position.name` (if saved)
2. `resolveSecurityMetadata(position.symbol)?.name` (local metadata lookup)
3. `position.symbol`
4. `'종목명 미입력'`

This ensures existing rows saved with `name: ''` are displayed with the resolved name without requiring a DB migration.

### `getPositionSecondaryLabel` updated

- If `position.name` exists and differs from `symbol`: show `symbol` (unchanged).
- If no `position.name` but local mapping has a name: show `symbol` (ticker code as secondary).
- If no `position.name` and no mapping: show `'티커 직접 입력'` (unchanged for unknown tickers).
- Otherwise: `'티커 미확인'`.

### `getChartAiHref` unchanged

Already uses `getPositionPrimaryLabel(position)` for the `name` parameter, which now returns the resolved display name automatically.

### `getLogoMapping` unchanged

Continues to check `position.symbol` and `position.name` against `logoMappings`. No change needed.

## 5. Scope Boundaries

| Boundary | Status |
|---|---|
| Live KIS | Not introduced |
| Live GNews | Not introduced |
| External HTTP | Not introduced |
| Server-side API route | Not added |
| DB migration | Not added |
| Supabase schema | Not changed |
| Search/autocomplete | Not added |
| Quote/valuation logic | Not changed |
| Fixture prices | Not changed |
| Tab order persistence | Not changed |
| Home page | Not changed |
| Chart AI page | Not changed |
| Lab page | Not changed |
| My Page | Not changed |
| Deployment | Not performed |

## 6. Known Ticker Resolution Results

Based on current `securityLogos.json` content:

| Input | Resolved Name | Symbol Preserved | Secondary Label |
|---|---|---|---|
| `005930` | Samsung Electronics | `005930` | `005930` |
| `KO` | Coca-Cola | `KO` | `KO` |
| `000660` | (no mapping — 티커 직접 입력) | `000660` | `티커 직접 입력` |
| `069500` | (no mapping — 티커 직접 입력) | `069500` | `티커 직접 입력` |
| `AAPL` | (no mapping — 티커 직접 입력) | `AAPL` | `티커 직접 입력` |
| `Samsung Electronics` | (free text, used as-is) | `Samsung Electronics` | `Samsung Electronics` |

Resolution scope depends entirely on the content of `src/data/securityLogos.json`. The file currently contains 2 entries. Adding more entries extends the coverage without code changes.

## 7. Validation Results

| Check | Result |
|---|---|
| `npm run check:portfolio-ticker-display-name` | 63/63 PASS |
| `npm run check:portfolio-owner-review-prep` | 50/50 PASS |
| `npm run check:portfolio-ui-valuation-fixture` | 71/71 PASS |
| `npm run check:portfolio-tab-order-persistence` | 61/61 PASS |
| `npm run check:portfolio-valuation-api` | 124/124 PASS |
| `npm run build` | PASS |
| `git diff --check` | clean |
| `git status --short` | clean |

**Intentionally not run** (not applicable to this phase): GNews suite, KIS suite, Home/Lab/MyPage suite.

## 8. Owner Manual Checklist

1. Open `/portfolio` and add a position with ticker `005930` (Samsung Electronics).
2. Confirm primary label shows `Samsung Electronics` (not `005930`).
3. Confirm secondary label shows `005930`.
4. Add a position with ticker `KO` (Coca-Cola).
5. Confirm primary label shows `Coca-Cola`; secondary label shows `KO`.
6. Add an unsupported ticker (e.g., `AAPL` or `069500`).
7. Confirm primary label shows the ticker itself (`AAPL` or `069500`).
8. Confirm secondary label shows `티커 직접 입력`.
9. Confirm valuation fields (현재가/평가금/수익률/수익금) still populate for supported fixture symbols.
10. Confirm tab order persistence still works after refresh.

## 9. Remaining Limitations

- **Local metadata only**: display name resolution is limited to entries in `src/data/securityLogos.json`. Currently 2 entries (005930, KO). Adding entries extends coverage without code changes.
- **No live symbol search**: no network-based name resolution. Expanding coverage requires adding entries to the JSON file.
- **Existing DB records not migrated**: rows saved before this hotfix have `name: ''`. The display fallback (`getPositionPrimaryLabel`) now handles them correctly without a DB migration.
- **000660, 035420, 069500 not yet mapped**: these symbols are used in fixture valuation but have no local metadata entry yet. Their primary labels will remain the ticker string.
- **No search/autocomplete**: future enhancement; out of scope for this phase.
- All other limitations from Phase 3BX/3BY remain (no live KIS, no FX, no dividend data, etc.).

## 10. Recommended Next Phase

If owner review passes:
- **Phase 3BZ** — Fast Roadmap Reprioritization and Lightweight Execution Plan. Update the project roadmap before starting heavy live integrations.
- Optionally: expand `securityLogos.json` with additional KR ETF/stock entries as a lightweight follow-up (no code change needed, just data).
