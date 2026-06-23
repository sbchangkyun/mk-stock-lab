# Phase 3AX — Notification Favorite Stock Shell + About Footer Link + Home Ad Slot Expansion v0.1

## 1. Title and Metadata

- **Phase**: 3AX
- **Type**: Notification favorite-stock shell, About footer link, Home ad slot expansion
- **Status**: Implemented
- **Scope**: UI shell only
- **Favorite-stock news alert persistence**: not implemented
- **Target-price alert persistence**: not implemented
- **Telegram integration**: not implemented
- **External ad integration**: not implemented
- **Backend changes**: none
- **Deployment**: not performed
- **Date**: 2026-06-23

---

## 2. Objective

Phase 3AX adds owner-requested UI shell improvements in four areas: a favorite-stock search/add/save shell for the 관심종목 뉴스 알림 notification row, an on/off toggle for the 관심종목 지정가 알림 block, an 운영자 소개 link added to the site footer before 개인정보처리방침 with a corresponding placeholder /about page, and a third static placeholder slot (Sample Banner 03) in the Home right-rail affiliate ad carousel to complete a three-slot structure. No real persistence, notification delivery, external ad scripts, or backend changes are introduced.

---

## 3. My Page Notification Changes

### 관심종목 뉴스 알림 — search/save shell

The previous simple toggle row for "관심종목 뉴스 알림" has been expanded to a `mp-notif-block` with:

- A toggle in the block header (unchanged UI behavior, not persisted).
- A description: "관심종목 뉴스 알림을 받을 종목을 추가하세요. 최대 5개까지 등록할 수 있습니다."
- A "관심종목 검색" label.
- An input field with placeholder "종목명 또는 종목코드를 입력하세요." (`maxlength="20"`, no autocomplete).
- A "관심종목 저장" button.
- An in-memory rendered list `id="mpWatchlistList"` of added stocks.
- A "저장된 관심종목" section heading (`id="mpWatchlistHeader"`, initially hidden).
- An empty state paragraph "등록된 관심종목이 없습니다." (`id="mpWatchlistEmpty"`, shown when empty).
- A notice "실제 뉴스 알림 저장 기능은 준비 중입니다." shown after first save.
- A 삭제 remove button per saved item.

**Behavior (in-memory only):**
- Maximum 5 items enforced silently in JS.
- No duplicates allowed.
- State resets on page reload (no persistence to backend, localStorage, or sessionStorage).
- No KIS, quote, or news API called.
- No Supabase mutation.
- No tracking.

### 관심종목 지정가 알림 — on/off toggle

An "알림 사용" toggle row (`id="mpPriceAlertToggle"`, label `lbl-price-alert-toggle`) has been added inside the existing 지정가 알림 block, between the block header and the form body.

- Toggle is unchecked by default.
- When unchecked, the form body (`id="mpPriceAlertBody"`) receives class `mp-notif-body--disabled` (opacity 0.45, pointer-events none) — visually disabled with no backend effect.
- When checked, the form body becomes active.
- The existing UI-only add form and "저장 기능은 준비 중입니다." notice are unchanged.
- The description text has been updated to "지정가 알림은 최대 5개까지 준비할 수 있습니다."

---

## 4. Footer/About Changes

### Footer — 운영자 소개 link added

`src/components/Footer.astro` updated: `<a href="/about">운영자 소개</a>` added as the first link in `<nav class="site-footer-links">`, before `<a href="/privacy">개인정보처리방침</a>`.

New footer link order:
1. 운영자 소개 (`/about`)
2. 개인정보처리방침 (`/privacy`)
3. 이용약관 (`/terms`)
4. 제휴문의 (external Google Form)

The Coupang ad, copyright, and link styling are unchanged. The existing sticky footer fix from Phase 3AW applies to /about page automatically.

### /about placeholder page

`src/pages/about.astro` created. Uses the same placeholder pattern as `/privacy` and `/terms`:
- Eyebrow: `ABOUT`
- Title: `운영자 소개`
- Body: `운영자 소개 내용은 준비 중입니다.`

No operator introduction content was fabricated. The benchmark URL `https://etfshopping.com/about` is recorded below as a planning reference only — it was not fetched, scraped, copied, summarized, or embedded.

**Benchmark reference (planning reference only, not fetched):** `https://etfshopping.com/about`

---

## 5. Home Ad Rail Changes

The Home right-side affiliate ad rail (`HomeRailAd.astro`) now rotates three static placeholder banners (up from two).

Changes:
- `src/data/homeAdBanners.json` — added third entry with `id: "home-rail-sample-03"`, `imageSrc: "/ads/home-rail/home-rail-sample-03.svg"`, `isActive: true`, `displayOrder: 3`.
- `public/ads/home-rail/home-rail-sample-03.svg` — created. Dark-blue 160×600 placeholder SVG, "Research Rail" header, "Sample Banner 03" center text, "160 x 600" footer. Same structure as banners 01 and 02.
- `HomeRailAd.astro` — unchanged (the carousel reads the JSON dynamically; no structural change was needed).

All three slots:

| ID | imageSrc | displayOrder | isActive |
|---|---|---|---|
| home-rail-sample-01 | /ads/home-rail/home-rail-sample-01.svg | 1 | true |
| home-rail-sample-02 | /ads/home-rail/home-rail-sample-02.svg | 2 | true |
| home-rail-sample-03 | /ads/home-rail/home-rail-sample-03.svg | 3 | true |

No external ad scripts, no ad network integration, no tracking scripts, no cookies, no fetch calls for ads.

---

## 6. Safety Boundaries

- No notification persistence (watchlist items reset on page reload).
- No Telegram integration.
- No subscription or billing integration.
- No Supabase mutation.
- No KIS call.
- No quote or news API call.
- No external ad network integration.
- No benchmark URL fetched, copied, or embedded.
- No deployment.
- No `.env*` content read.
- No account deletion backend.
- No database write.
- No tracking scripts added.

---

## 7. Static Validation Summary

| Script | Checks | Result |
|---|---|---|
| `check:mypage-shell` | 49 | All PASS |
| `check:header-footer-shell` | 35 | All PASS |
| `check:home-ad-slots` | 30 | All PASS |
| `check:market-quote-card` | 32 | All PASS |

---

## 8. Validation Results

```
npm run check:mypage-shell        →  49/49 PASS  Exit 0
npm run check:header-footer-shell →  35/35 PASS  Exit 0
npm run check:home-ad-slots       →  30/30 PASS  Exit 0
npm run check:market-quote-card   →  32/32 PASS  Exit 0
npm run build                     →  Complete! (6.99s)
git diff --check                  →  No errors (Windows CRLF warnings only)
git status --short                →  7 modified + 3 untracked (all expected Phase 3AX files)
```

---

## 9. Owner Browser Review Checklist

- [ ] /mypage 알림 설정 section shows the expanded 관심종목 뉴스 알림 block.
- [ ] A "관심종목 검색" label and input are visible.
- [ ] Typing a name/code and clicking "관심종목 저장" adds the item to the saved list.
- [ ] "저장된 관심종목" section heading appears after the first item is added.
- [ ] "등록된 관심종목이 없습니다." shows when the list is empty.
- [ ] "실제 뉴스 알림 저장 기능은 준비 중입니다." notice appears after save.
- [ ] Each saved item has a "삭제" button that removes the item from the in-memory list.
- [ ] After page reload, the saved list is empty (expected — no persistence).
- [ ] Adding 6 items is silently ignored (max 5 enforced).
- [ ] 관심종목 지정가 알림 block shows an "알림 사용" toggle row.
- [ ] Toggle unchecked → form body is dimmed and unclickable.
- [ ] Toggle checked → form body is active.
- [ ] The existing "+ 추가" form and "저장 기능은 준비 중입니다." notice work as before.
- [ ] Site footer now shows: 운영자 소개 / 개인정보처리방침 / 이용약관 / 제휴문의.
- [ ] 운영자 소개 appears before 개인정보처리방침 in the footer link row.
- [ ] /about page loads and shows "운영자 소개" heading and "준비 중" placeholder text.
- [ ] /about footer layout is stable (no abnormal gap below content).
- [ ] /privacy and /terms footer layout remains fixed (no regression).
- [ ] 제휴문의 still opens the Google Form correctly.
- [ ] Home right-side ad rail rotates through Sample Banner 01, 02, and 03.
- [ ] Home page layout is stable on desktop (no horizontal scroll, hero/cards not disrupted).
- [ ] All three banners carousel correctly (5 second interval, pauses on hover).
- [ ] No raw error or secret-like text appears anywhere.

---

## 10. Remaining Limitations

- Favorite-stock news alert watchlist is not persisted (resets on page reload).
- Target-price alert toggle is not persisted.
- Telegram linkage remains a placeholder (준비 중).
- Notification delivery is not implemented.
- Operator introduction content is pending owner input for /about.
- Privacy/Terms legal text remains pending owner input.
- Ad slots are static placeholders only — no ad network, no revenue, no tracking.

---

## 11. Recommended Next Steps

1. Owner browser review of /mypage notification section, /about, footer link order, and Home ad rail.
2. Return to Chart AI data contract and indicator engine work.
3. Implement notification persistence only after explicit data/storage policy approval from owner.
4. Provide operator introduction content for /about page when ready.

---

## 12. Confirmed Non-Actions

- No API route logic changed.
- No KIS provider logic changed.
- No KIS runtime guard changed.
- No Supabase backend logic changed.
- No Vercel config changed.
- No live KIS call.
- No live Supabase query or write by Claude Code.
- No SQL executed.
- No Vercel CLI command run.
- No Vercel env mutation.
- No deployment performed.
- No deployed URL called.
- No `.env*` content read.
- No notification backend implemented.
- No Telegram backend implemented.
- No subscription or billing backend implemented.
- No external ad script added.
- No ad tracking added.
- No benchmark URL fetched or content copied.
- No account deletion backend implemented.
- No database deletion implemented.
- No Production KIS enabled.
- No account, order, trading, balance, holdings, or WebSocket feature implemented.
- No actual symbol, price, Preview URL, bypass secret, token, raw KIS field, raw error, or stack trace recorded.
- Claude memory files not modified.
- Root README.md not modified.
