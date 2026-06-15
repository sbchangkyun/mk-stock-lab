# MK Stock Lab Screen Specification v0.1

Created: 2026-06-15
Status: Phase 0 planning baseline

## Shared Layout

Every primary route should share:

1. Header with logo, theme toggle, login/logout state, and future search entry.
2. Ticker belt without crypto symbols.
3. Primary nav: Home, Chart AI, Heatmap, Lab, Portfolio.
4. Main content area optimized for desktop.
5. Preserved slide ad and footer fixed ad.
6. Footer with product and disclosure links.

## Header

| Element | Behavior |
|---|---|
| Logo | Navigates to `/` |
| Theme toggle | Persists light/dark preference and updates page variables |
| Login button | Opens Supabase auth modal |
| Logout button | Ends Supabase session and refreshes auth state |
| Auth state | No layout jump while session loads |

## Ticker Belt

Target instruments:

| Type | Examples |
|---|---|
| US index | S&P 500, Nasdaq 100, Dow Jones |
| Korean index | KOSPI, KOSDAQ |
| FX | USD/KRW, Dollar Index |
| Commodities | Gold, WTI crude oil |

Crypto tickers must not appear in the main ticker belt.

## Home `/`

Purpose: product entry and discovery hub.

Primary sections:

1. Market overview strip.
2. Chart AI entry card with stock and ETF search.
3. Heatmap preview.
4. Lab content cards.
5. Portfolio entry card.
6. Ad areas.

## Chart AI `/chart-ai`

Purpose: search Korean and US stocks and ETFs, inspect a chart, and run AI analysis when logged in.

Desktop layout:

| Area | Content |
|---|---|
| Left/main | Candlestick chart and timeframe controls |
| Right panel | Symbol info, timeframe selector, AI analysis button, usage state |
| Bottom/results | Analysis tabs |

Analysis result tabs:

1. Summary Briefing
2. Price Strategy
3. Pattern Analysis
4. Technical Indicators
5. Flow & Risk

Required states:

| State | UI |
|---|---|
| Logged out | Analysis blocked with login CTA |
| Free quota available | Analysis button enabled |
| Free quota exhausted | Coming soon paid-feature CTA |
| Loading | Main page remains in loading state after affiliate open/interstitial |
| Error | Retry option without losing selected symbol |

Required language substitutions:

| Avoid | Use |
|---|---|
| buy | entry review zone |
| target price | upper scenario |
| stop-loss | risk management line |
| sell | position reduction review zone |

## Heatmap `/heatmap`

Purpose: visualize daily market and portfolio performance.

Tabs:

1. KOSPI200
2. KOSDAQ150
3. S&P500
4. NASDAQ100
5. My Portfolio

Rules:

| Property | Rule |
|---|---|
| Index box size | Market cap |
| Portfolio box size | Evaluated value |
| Box color | Daily change rate |
| Deep red | <= -5% |
| Neutral | Near 0% |
| Deep green | >= +5% |
| Click action | Navigate to Chart AI stock detail page |
| My Portfolio tab | Requires login |

## Lab Hub `/lab`

Purpose: public data-content hub.

Cards:

1. Congress Stocks
2. NPS Portfolio
3. S&P 500 Sectors
4. Asset-Class Returns

Each card should include title, short description, data cadence, and route link.

## Lab Detail Pattern

All Lab pages should use:

1. Breadcrumb.
2. Top ad area.
3. Title, description, and data date.
4. Key visualization.
5. Summary table or cards.
6. Methodology.
7. FAQ.
8. Related content cards.
9. Footer and fixed ad.

## S&P 500 Sectors `/lab/sp500-sectors`

Must include:

1. S&P 500 Index.
2. S&P 500 Information Technology Index.
3. S&P 500 Consumer Discretionary Index.
4. S&P 500 Communication Services Index.
5. S&P 500 Industrials Index.
6. S&P 500 Energy Index.
7. S&P 500 Financials Index.
8. S&P 500 Materials Index.
9. S&P 500 Health Care Index.
10. S&P 500 Utilities Index.
11. S&P 500 Consumer Staples Index.
12. S&P 500 Real Estate Index.

## Asset-Class Returns `/lab/asset-class-returns`

Must include:

| Asset | Tracking index | Representative ETFs |
|---|---|---|
| S&P500 | S&P 500 Index | SPY, VOO, IVV |
| Bitcoin | Bitcoin BTC | IBIT, FBTC |
| NASDAQ100 | NASDAQ-100 Index | QQQ, QQQM |
| KOSPI | KOSPI Index | 226490 |
| Gold | LBMA Gold Price PM | GLD, IAU, GLDM |
| Global equities | FTSE Global All Cap Index | VT, ACWI |
| REITs | MSCI US REIT Index | VNQ, SCHH, IYR |
| Global ex-US | FTSE Global All Cap ex US Index | VXUS, IXUS |
| Emerging markets | FTSE Emerging Markets Index | VWO, IEMG, EEM |
| High yield bonds | Markit iBoxx USD Liquid High Yield | HYG, JNK |
| Aggregate bonds | Bloomberg US Aggregate Bond Index | AGG, BND |
| Short T-bills | ICE BofA 0-3M US Treasury Bill | BIL, SGOV, SHV |

Bitcoin is allowed only on this Lab page.

## Portfolio `/portfolio`

Purpose: logged-in multi-portfolio holdings management.

Inputs:

1. Symbol.
2. Market.
3. Asset type.
4. Buy price.
5. Quantity.
6. Buy date.
7. Memo.
8. Currency.

Analysis:

1. P/L.
2. Sector allocation.
3. Country allocation.
4. Risk score.
5. Rule-based rebalancing note.
6. Portfolio AI Agent - Coming soon.

Portfolio must not be directly connected to Chart AI in the MVP.
