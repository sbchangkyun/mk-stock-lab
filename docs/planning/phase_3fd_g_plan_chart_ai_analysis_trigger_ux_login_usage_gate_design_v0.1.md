# Phase 3FD-G-PLAN Chart AI Analysis Trigger UX and Login/Usage Gate Design

## 1. Purpose

This is a documentation-only UX and gate design. It makes no UI, route, or runtime source change;
connects to no database; creates no Supabase client; reads no environment value; executes no
migration; calls no live KIS or LLM/API; adds no payment or ad integration; and performs no
deployment or push.

## 2. Background

Owner browser QA confirmed that the current Chart AI analysis area and its overlapping,
post-it-style presentation work visually. The product problem is that Similar Pattern Analysis and
MK AI Analysis currently read like immediately available information. These results are core
product content and future monetization candidates, so explicit user intent must precede their
display. Future real API or LLM analysis may take time and therefore needs clear loading feedback.

## 3. Product Decisions

- Similar Pattern Analysis and MK AI Analysis each require a separate trigger button.
- Both functions may be free at initial launch, but both require login.
- Account-level daily usage limit structure is required.
- The next implementation phase must not apply actual usage limiting.
- Loading feedback and duplicate request prevention are required.
- The existing overlapping/post-it-style result presentation remains.
- Future usage-limit, permission, ad, and paid gate extension points are required.

## 4. Target UX Model

Each analysis tab initially shows its tab header, a brief explanation, a login-required notice, a
daily usage status placeholder, and its trigger button. The analysis result body remains hidden.
After a trigger, the flow checks login and usage policy, shows loading feedback, and reveals the
result only after completion.

Similar Pattern Analysis copy:

- Button: `유사 패턴 분석 시작`
- Idle: `현재 차트와 유사한 과거 패턴을 분석합니다.`
- Login: `로그인 후 유사 패턴 분석을 실행할 수 있습니다.`
- Usage: `오늘 사용 가능 횟수: 베타 기간 제한 없음`
- Loading: `유사 패턴 분석을 진행 중입니다. 잠시만 기다려주세요.`
- Loading subtext: `현재 차트 데이터를 기준으로 과거 유사 구간을 탐색하고 있습니다.`

MK AI Analysis copy:

- Button: `MK AI 분석 시작`
- Idle: `차트 흐름과 유사 패턴 결과를 바탕으로 AI 해석을 제공합니다.`
- Login: `로그인 후 MK AI 분석을 실행할 수 있습니다.`
- Usage: `오늘 사용 가능 횟수: 베타 기간 제한 없음`
- Loading: `MK AI 분석을 생성 중입니다. 잠시만 기다려주세요.`
- Loading subtext: `차트 흐름과 유사 패턴 결과를 바탕으로 해석을 구성하고 있습니다.`

## 5. State Model

| State | Visible content | Button | Result | Next action |
| --- | --- | --- | --- | --- |
| `idle` | Explanation and usage placeholder | Enabled | Hidden | Trigger analysis |
| `login_required` | Login prompt | Login-directed | Hidden | Authenticate later |
| `loading` | Waiting copy and spinner/skeleton | Disabled | Hidden or skeleton only | Wait |
| `success` | Existing result presentation | Available for a later rerun policy | Visible | Review result |
| `usage_limited` | Safe usage message | Disabled | Hidden | Wait for reset or future upgrade |
| `blocked` | Safe blocked message | Disabled | Hidden | Resolve policy gate |
| `error` | Safe error message | Retry enabled | Hidden | Retry |

## 6. Login Gate Design

Both functions require login even if initially free. Anonymous users must not run either analysis.
The next implementation may use only a mocked or client-side auth-state placeholder; real auth
runtime wiring requires separate approval. It must not create a Supabase client or parse a real
session. For an unauthenticated click, show the button, transition to `login_required`, reveal no
result, and call no analysis execution.

## 7. Daily Usage Limit Design

Account-level daily usage-limit structure is required, but the next implementation applies no
actual usage limiting and no database or Supabase persistence. The UI reserves a usage status area.

Future structural fields:

- `dailyLimitEnabled`
- `dailyLimit`
- `dailyUsed`
- `dailyRemaining`
- `usageWindow`
- `usageResetAt`

Initial mocked state:

- `dailyLimitEnabled: false`
- `usageDisplay: "오늘 사용 가능 횟수: 베타 기간 제한 없음"`

Future example only: Similar Pattern Analysis may allow 3/day and MK AI Analysis may allow 3/day.

## 8. Analysis Execution Order

1. Similar Pattern Analysis runs first.
2. MK AI Analysis becomes available after Similar Pattern Analysis succeeds.

This order lets MK AI interpret the pattern result, simplifies cost control and future LLM
workflow, and supports later paid or ad gating. The MK AI trigger may remain visible initially, but
an early click shows: `먼저 유사 패턴 분석을 실행하면 MK AI 분석을 사용할 수 있습니다.`

## 9. Loading and Duplicate Request Prevention

Disable the active trigger while loading, show a spinner or skeleton with the approved waiting
copy, and prevent duplicate clicks. The first mocked implementation must also prevent simultaneous
Similar Pattern and MK AI runs. Restore the applicable button after `success`, `error`, or
`blocked`.

## 10. Result Reveal Design

Preserve the existing overlapping/post-it-style cards, but hide each result body until `success`.
Existing sample or mocked content appears only after trigger completion. The reveal must expose no
raw provider, KIS, score, OHLC, account, trading, order, or balance data and must not imply live KIS
or investment advice.

## 11. Future Gate Extension Points

Future state extensions are `login_required`, `usage_limited`, `premium_required`, `ad_required`,
`beta_only`, `owner_only`, and `maintenance_disabled`. They are design-only. The next
implementation adds no payment, ad, real auth, or database integration.

## 12. Next Implementation Boundary

The next phase is mocked-only `/chart-ai` UI work. It may add separate trigger buttons; implement
`idle`, `loading`, `success`, `login_required`, `usage_limited`, `error`, and `blocked`; add a
mocked delay; hide results until trigger success; and preserve existing owner-local panels. Route
behavior remains unchanged. It makes no API, LLM, database, Supabase, or live KIS call, applies no
actual usage count limiting, enables no route success, and performs no deployment or push.

## 13. Recommended Next Phase

Recommended: **Phase 3FD-G — Chart AI Analysis Trigger UX Mocked-only Implementation**.

Alternative: **Phase 3FD-G-HF1 — Analysis Trigger UX Design Revisions, No Runtime Change**.

Hold: **Phase 3FD-B-HF1 — Real Supabase Client Factory Approval Package, No Runtime Change**.
