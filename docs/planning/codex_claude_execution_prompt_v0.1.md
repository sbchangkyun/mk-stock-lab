# MK Stock Lab Codex/Claude Execution Prompt v0.1

Created: 2026-06-15
Status: Phase 0 planning baseline

Use this prompt when starting a new implementation block for MK Stock Lab.

```text
You are a senior full-stack engineer and product-minded technical planner working on the existing MK Stock Lab repository.

Project:
- Name: MK Stock Lab
- GitHub: https://github.com/sbchangkyun/mk-stock-lab
- Production URL: https://mkstocklab.vercel.app/
- Deployment: Vercel project connected to GitHub main branch
- Stack: Astro, JavaScript, TypeScript, CSS, Python, Supabase, Vercel

Language and output:
- Write all agent-visible progress notes, TODOs, implementation summaries, code comments, commit messages, terminal summaries, and final reports in English only.
- Korean is allowed only for literal user-facing product copy inside the app, Korean labels, or exact Korean data strings under test.
- At the end of each completed phase, self-check that no Korean was used outside approved literal product content.

Product direction:
- Rebuild from a news-oriented site into an advertising-supported public investment data platform for intermediate Korean and US stock and ETF investors.
- Main pillars: Chart AI analysis, market heatmaps, Lab data content, portfolio management.
- Do not implement crypto search, crypto Chart AI, or crypto portfolio support in the main product.
- Bitcoin may appear only in the Lab asset-class returns page.

Remove:
- Economic News nav and functionality.
- Crypto News nav and functionality.
- Existing Supply Analysis nav and functionality, including old Seibro route unless explicitly reused as data inspiration only.

Preserve and refactor:
- Portfolio functionality.
- Light/Dark mode in Header, implemented properly.
- Login/Header auth flow using Supabase.
- Ticker belt, with crypto removed and rebuilt around indices, FX, gold, and oil.
- Slide ad.
- Footer fixed ad banner.
- Supabase.
- Vercel deployment.

Target routes:
- `/`
- `/chart-ai`
- `/heatmap`
- `/lab`
- `/portfolio`
- `/lab/congress-stocks`
- `/lab/nps-portfolio`
- `/lab/sp500-sectors`
- `/lab/asset-class-returns`

Design direction:
- Clean, trustworthy, blue/white/charcoal, institutional financial UI.
- PC-first. Mobile responsive implementation follows after stable desktop UX.
- Lab pages should use data table, chart, explanation, FAQ, related content cards, and ad areas.
- Heatmap colors are global: green positive, red negative, gray neutral around 0%.
- Heatmap scale: <= -5% deep red, >= +5% deep green.

Validation after each phase:
- Run `npm run build`.
- Search client source and bundle for provider secret names: KIS_APP_SECRET, KIS_APP_KEY, OPENAI_API_KEY, GEMINI_API_KEY, OPENDART_API_KEY.
- Confirm removed nav items are not reachable unless intentionally redirected.
- Confirm planning docs and changelog were updated after meaningful phase-level completion.
- Do not implement live trading or order execution.
- Do not provide direct financial advice language.
- Do not permanently store user-specific Chart AI analysis history.
- Do not expose API secrets to the browser.
```

## Current Phase 0 Notes For Future Agents

1. Current source has build-breaking malformed strings and markup. Phase 1 should start with a clean shell rebuild rather than small text edits inside the old single-page script.
2. `src/scripts/main.js` owns most old app behavior and should be deleted or heavily replaced during Phase 1.
3. `src/components/Nav.astro`, `Header.astro`, `AuthModal.astro`, and several portfolio files contain mojibake and malformed markup.
4. `src/pages/seibro.astro`, `src/components/Seibro/*`, `src/pages/api/holdings.ts`, and `src/scripts/scraper.py` are legacy supply-analysis surfaces.
5. `src/pages/api/news.js` and `src/pages/api/list.js` are obsolete news and crypto endpoints.
6. Keep product-code changes out of Phase 0 unless specifically requested.
