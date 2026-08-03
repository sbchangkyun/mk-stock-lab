/**
 * Static contract check for Phase 4B — Market Production Completion.
 *
 * This is a truthfulness/accessibility/reliability completion pass over the existing live Market
 * dashboard (`LiveMarketDashboard.astro` + its `formatters.ts`/`marketTrackedUniverses.ts`
 * dependencies) — NOT a rewrite, NOT a new data source. This checker verifies, via static source
 * inspection only (no execution, no network), that:
 *   - Page copy & disclosure truthfulness (1-9): the eyebrow/H1/lead/4-bullet disclosure list use the
 *     exact required Korean strings, and no forbidden phrase (전체 편입 종목/전체 시장/공식 지수 비중/
 *     실시간 지수/실시간 시가총액) is ever asserted as a positive claim.
 *   - Top summary (10-14): the panel-metrics row is exactly the 5 required items.
 *   - ETF overview integrity (15-20): the overview grid names the real proxy, shows freshness/as-of,
 *     never fabricates a 0.00% return, and is fetched with a period-scoped cache key.
 *   - Treemap (21-27): truthful accessible SVG with a dynamic aria-label, a visible partial-data
 *     notice, no fabricated tile for a failed constituent, and the retained d3-hierarchy layout.
 *   - Momentum/Trend scatter (28-34): truthful accessible SVG with labeled axes and a deterministic
 *     client-derived text summary, never plotting a null value as zero.
 *   - Breadth/sector summary (35-41): honest coverage/advancers/weighted+median-return/sector labels
 *     with Korean sector display text and a safe unmapped-id fallback.
 *   - Freshness / request-state reliability / refresh UX (42-56): the 5-state freshness map, stale-
 *     response guards on both fetch paths, memory-only caching with in-flight dedup, last-good-data
 *     preservation on a failed refresh, the >=30s non-reentrant cooldown, and scoped single-universe
 *     refresh.
 *   - Tabs / modal / responsive / registry (57-70): full ARIA tabs + keyboard semantics, the modal's
 *     focus-trap/focus-restore contract, 44px touch targets and a viewport-bounded modal, the
 *     `/heatmap` permanent redirect, and the bounded 4-universe/<=12-constituent tracked registry.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const LIVE_MARKET_DASHBOARD = join(root, 'src', 'components', 'LiveMarketDashboard.astro');
const HEATMAP = join(root, 'src', 'pages', 'heatmap.astro');
const FORMATTERS = join(root, 'src', 'lib', 'market-dashboard', 'formatters.ts');
const NAV_ACTIVE_LINK = join(root, 'src', 'lib', 'shell', 'navActiveLink.ts');
const MARKET_UNIVERSES = join(root, 'src', 'data', 'marketTrackedUniverses.ts');
const STYLE_CSS_PATH = join(root, 'src', 'styles', 'style.css');
const PACKAGE_JSON = join(root, 'package.json');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;
const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};
const readOr = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
// Strips block/HTML comments so "does this file actually DO x" checks aren't tripped by prose in a
// doc comment that merely mentions x (e.g. a comment explaining why the client cache is memory-only).
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

log('=== Phase 4B Market Production Completion Static Contract ===');
log('');

// ---------------------------------------------------------------------------
// Group 0: File existence
// ---------------------------------------------------------------------------
log('--- Group 0: File existence ---');
for (const [name, path] of [
  ['LiveMarketDashboard.astro', LIVE_MARKET_DASHBOARD],
  ['heatmap.astro', HEATMAP],
  ['formatters.ts', FORMATTERS],
  ['navActiveLink.ts', NAV_ACTIVE_LINK],
  ['marketTrackedUniverses.ts', MARKET_UNIVERSES],
  ['style.css', STYLE_CSS_PATH],
]) {
  check(`${name} exists`, existsSync(path));
}

const liveDashboard = readOr(LIVE_MARKET_DASHBOARD);
const heatmap = readOr(HEATMAP);
const formatters = readOr(FORMATTERS);
const navActiveLink = readOr(NAV_ACTIVE_LINK);
const marketUniverses = readOr(MARKET_UNIVERSES);
const STYLE_CSS = readOr(STYLE_CSS_PATH);
let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}

const scriptStart = liveDashboard.indexOf('<script>');
const scriptBlock = scriptStart === -1 ? liveDashboard : liveDashboard.slice(scriptStart);

// ---------------------------------------------------------------------------
// Group 1: Page copy & disclosure truthfulness (1-9)
// ---------------------------------------------------------------------------
log('--- Group 1: Page copy & disclosure truthfulness (1-9) ---');
check('1. eyebrow is exactly "MARKET DASHBOARD"', liveDashboard.includes('<p class="eyebrow">MARKET DASHBOARD</p>'));
check('2. H1 is exactly "시장"', liveDashboard.includes('<h1>시장</h1>'));
check('3. lead discloses the 12-sample tracked basis and the proxy-ETF basis',
  liveDashboard.includes('12개 추적 종목 샘플') && liveDashboard.includes('대표 ETF(proxy)'));
check('4. lead discloses delayed-close (not real-time) data basis', liveDashboard.includes('실시간 시세가 아닌 지연된 종가 기준'));
check('5. the disclosure list has exactly the required 4 bullets', (() => {
  const m = liveDashboard.match(/<ul class="market-disclosure-list">([\s\S]*?)<\/ul>/);
  return !!m && (m[1].match(/<li>/g) || []).length === 4;
})());
check('6. disclosure bullet discloses proxy-ETF (not official index) return basis',
  liveDashboard.includes('시장 수익률은 공식 지수가 아닌') && liveDashboard.includes('대표 ETF(proxy)</strong> 기준으로 계산됩니다'));
check('7. disclosure bullet discloses sample-only tracking (not full constituent coverage)',
  liveDashboard.includes('12개 종목 샘플') && liveDashboard.includes('전체 편입 종목이 아닙니다'));
check('8. disclosure bullet discloses configured-weight (not market-cap/official-index-weight) tile sizing',
  liveDashboard.includes('구성 시 설정한 비중') && liveDashboard.includes('공식 지수 비중이 아닙니다'));
check('9. forbidden phrases never appear as a positive claim (either fully absent, or only ever used in a negated disclaimer)', (() => {
  const neverAppear = ['전체 시장', '실시간 지수'];
  const negatedOnly = ['전체 편입 종목', '공식 지수 비중', '실시간 시가총액'];
  if (!neverAppear.every((p) => !liveDashboard.includes(p))) return false;
  return negatedOnly.every((phrase) => {
    let pos = 0;
    for (;;) {
      const i = liveDashboard.indexOf(phrase, pos);
      if (i === -1) return true;
      const window = liveDashboard.slice(i, i + phrase.length + 20);
      if (!(window.includes('아닙니다') || window.includes('아닌'))) return false;
      pos = i + phrase.length;
    }
  });
})());

// ---------------------------------------------------------------------------
// Group 2: Top summary (10-14)
// ---------------------------------------------------------------------------
log('--- Group 2: Top summary (10-14) ---');
const panelMetricsMatch = liveDashboard.match(/panelMetrics\.innerHTML = `([\s\S]*?)`;/);
const panelMetricsTpl = panelMetricsMatch ? panelMetricsMatch[1] : '';
check('10. panel-metrics template renders exactly 5 top-level summary items', (panelMetricsTpl.match(/<span/g) || []).length === 5);
check('11. panel-metrics includes 선택 시장', panelMetricsTpl.includes('선택 시장'));
check('12. panel-metrics includes 선택 기간', panelMetricsTpl.includes('선택 기간'));
check('13. panel-metrics includes 추적 종목 상태', panelMetricsTpl.includes('추적 종목 상태'));
check('14. panel-metrics includes 기준 시각 and 데이터 상태', panelMetricsTpl.includes('기준 시각') && panelMetricsTpl.includes('데이터 상태'));

// ---------------------------------------------------------------------------
// Group 3: ETF overview integrity (15-20)
// ---------------------------------------------------------------------------
log('--- Group 3: ETF overview integrity (15-20) ---');
check('15. overview card names the real benchmark proxy label (never a raw index name)', liveDashboard.includes('${proxy.proxy.label}'));
check('16. overview card shows a freshness badge with its Korean label', liveDashboard.includes("market-freshness-badge--${proxy.freshness}") && liveDashboard.includes('${freshnessLabel(proxy.freshness)}'));
check('17. overview card shows the as-of date via formatAsOfDate (never a fabricated date)', liveDashboard.includes('${formatAsOfDate(proxy.asOf)}'));
check('18. an unavailable proxy renders the literal 이용 불가 state, not a formatted number', liveDashboard.includes("proxy.status !== 'ok'") && liveDashboard.includes('이용 불가'));
check('19. no hardcoded fabricated 0.00% literal anywhere in the component', !liveDashboard.includes('0.00%'));
check('20. overview requests use a single period-scoped cache key (not one fetch per universe)', liveDashboard.includes('`overview:${period}`'));

// ---------------------------------------------------------------------------
// Group 4: Treemap (21-27)
// ---------------------------------------------------------------------------
log('--- Group 4: Treemap (21-27) ---');
check('21. treemap svg has a real role/aria-label baseline', liveDashboard.includes('role="img" aria-label="추적 종목 Treemap"'));
check('22. treemap aria-label is re-set dynamically per universe/period at render time',
  /treemapSvg\.setAttribute\('aria-label', `\$\{universeLabel\} \$\{periodLabel\}/.test(liveDashboard));
check('23. a visible partial-data notice element exists and is populated when constituents fail',
  liveDashboard.includes('data-market-treemap-partial-notice') && liveDashboard.includes('treemapPartialNotice.textContent ='));
check('24. treemap never fabricates a tile for a constituent whose data failed to load',
  liveDashboard.includes("item.status === 'ok' && item.relativeWeight > 0"));
check('25. treemap layout still uses the retained d3-hierarchy dependency (no new charting library)',
  liveDashboard.includes("await import('d3-hierarchy')"));
check('26. treemap card copy discloses configured-weight tile sizing and sample-only coverage',
  liveDashboard.includes('설정 비중(타일 크기)') && liveDashboard.includes('전체 편입 종목이 아닙니다'));
check('27. treemap tiles expose an accessible native tooltip (not canvas-only, hover/focus-reachable)',
  (liveDashboard.match(/el\('title'\)/g) || []).length >= 2);

// ---------------------------------------------------------------------------
// Group 5: Momentum/Trend scatter (28-34)
// ---------------------------------------------------------------------------
log('--- Group 5: Momentum/Trend scatter (28-34) ---');
check('28. scatter svg has a real role/aria-label baseline', liveDashboard.includes('role="img" aria-label="모멘텀 트렌드 산점도"'));
check('29. scatter aria-label is re-set dynamically per universe/period at render time',
  /scatterSvg\.setAttribute\('aria-label', `\$\{universeLabel\} \$\{periodLabel\}/.test(liveDashboard));
check('30. scatter axes carry real labeled text (20일 모멘텀 / 60일 트렌드), not unlabeled axes',
  liveDashboard.includes("momentumLabel.textContent = '20일 모멘텀'") && liveDashboard.includes("trendLabel.textContent = '60일 트렌드'"));
check('31. scatter summary reports the exact plotted count', liveDashboard.includes('${plotted.length}개 종목 표시'));
check('32. scatter summary reports the strongest and weakest momentum', liveDashboard.includes('최고 모멘텀') && liveDashboard.includes('최저 모멘텀'));
check('33. scatter summary reports above/below-60d trend counts', liveDashboard.includes('60일 평균 상회') && liveDashboard.includes('60일 평균 하회'));
check('34. scatter never plots a null momentum/trend value as zero (both must be non-null to be plotted)',
  liveDashboard.includes('item.momentum20dPct !== null && item.trendVsSma60Pct !== null'));

// ---------------------------------------------------------------------------
// Group 6: Breadth/sector summary (35-41)
// ---------------------------------------------------------------------------
log('--- Group 6: Breadth/sector summary (35-41) ---');
check('35. breadth shows requested/successful coverage plus a distinct failed-count callout',
  liveDashboard.includes('커버리지 ${coverage}') && liveDashboard.includes('실패 ${b.failedCount}'));
check('36. breadth shows advancers/decliners/unchanged', liveDashboard.includes('상승 ${b.advancers}') && liveDashboard.includes('하락 ${b.decliners}') && liveDashboard.includes('보합 ${b.unchanged}'));
check('37. weighted-return figure is honestly labeled as a tracked-sample figure, not an official index return',
  liveDashboard.includes('추적 샘플 가중 수익률') && liveDashboard.includes('공식 지수 수익률이 아닙니다'));
check('38. breadth also shows the median return (not only the weighted mean)', liveDashboard.includes('중간값 수익률'));
check('39. strongest/weakest sector display text resolves through sectorLabel() (Korean display, internal id untouched)',
  liveDashboard.includes('sectorLabel(b.strongestSector)') && liveDashboard.includes('sectorLabel(b.weakestSector)'));
check('40. breadth shows the common as-of date via formatAsOfDate', liveDashboard.includes('formatAsOfDate(b.commonAsOf)'));
check('41. sectorLabel() falls back to the raw sector id when unmapped (no silent disappearance)',
  formatters.includes('SECTOR_LABELS[sector] ?? sector'));

// ---------------------------------------------------------------------------
// Group 7: Freshness / request-state reliability / refresh UX (42-56)
// ---------------------------------------------------------------------------
log('--- Group 7: Freshness / request-state reliability / refresh UX (42-56) ---');
check('42. FRESHNESS_LABELS covers exactly the 5 required states with the exact Korean labels',
  formatters.includes("fresh: '최신'") && formatters.includes("cached: '캐시'") && formatters.includes("'stale-but-usable': '지연 데이터'") &&
    formatters.includes("partial: '일부 제공'") && formatters.includes("unavailable: '이용 불가'"));
check('43. every freshness badge pairs the state-keyed class with the actual Korean text (never color-only)',
  (liveDashboard.match(/freshnessLabel\(/g) || []).length >= 3);
check('44. loadDashboard guards against a stale/superseded response via requestToken',
  liveDashboard.includes('let requestToken = 0;') && liveDashboard.includes('const token = ++requestToken;') && liveDashboard.includes('if (token !== requestToken) return;'));
check('45. loadOverview guards against a stale/superseded response via its own overviewRequestToken',
  liveDashboard.includes('let overviewRequestToken = 0;') && liveDashboard.includes('const token = ++overviewRequestToken;') && liveDashboard.includes('if (token !== overviewRequestToken) return;'));
check('46. dashboard requests use a stable cache key scoped to the exact universe+period pair',
  liveDashboard.includes('`dashboard:${universeId}:${period}`'));
check('47. concurrent requests for the same key are deduplicated via a shared in-flight promise',
  liveDashboard.includes('inFlightRequests.get(key)') && liveDashboard.includes('inFlightRequests.set(key, request)'));
check('48. the client cache is memory-only (no localStorage/sessionStorage persistence)',
  !/localStorage\s*\.\s*(setItem|getItem|removeItem)/.test(liveDashboard) && !/sessionStorage\s*\.\s*(setItem|getItem|removeItem)/.test(liveDashboard));
check('49. a same-key refresh failure preserves the last-good panel via a stale notice instead of blanking it',
  (liveDashboard.match(/if \(isRefreshOfCurrent\)/g) || []).length >= 2);
check('50. a genuinely new selection (not a refresh of the current panel) shows the loading/blank state first',
  liveDashboard.includes('if (!isRefreshOfCurrent) {') && liveDashboard.includes("panel?.classList.add('hidden')"));
check('51. the refresh cooldown is at least 30 seconds', liveDashboard.includes('REFRESH_COOLDOWN_MS = 30_000'));
check('52. the refresh handler is non-reentrant (guarded against a second concurrent click)',
  liveDashboard.includes('if (isRefreshing || Date.now() - lastRefreshAt < REFRESH_COOLDOWN_MS) return;'));
check('53. the refresh button shows a transient in-progress label distinct from its idle/cooldown labels',
  liveDashboard.includes("refreshButton.textContent = '갱신 중...'"));
check('54. the refresh status is announced via an aria-live region, not conveyed by button text alone',
  liveDashboard.includes('data-market-refresh-status role="status" aria-live="polite">'));
check('55. refresh re-requests the existing endpoints via the client forceRefresh flag, never a server cache-busting query param',
  liveDashboard.includes('loadOverview(period, true)') && liveDashboard.includes('loadDashboard(universeId, period, true)') &&
    !/[?&](forceRefresh|bypassCache|nocache)=/i.test(liveDashboard));
check('56. refreshing calls only the active universe/period pair (no loop over the full tracked-universe registry)',
  !scriptBlock.includes('MARKET_TRACKED_UNIVERSES'));

// ---------------------------------------------------------------------------
// Group 8: Tabs / modal / responsive / registry (57-70)
// ---------------------------------------------------------------------------
log('--- Group 8: Tabs / modal / responsive / registry (57-70) ---');
check('57. both tab groups use a real ARIA tablist with an associated visible label',
  liveDashboard.includes('role="tablist" aria-labelledby="marketUniverseTabListLabel"') && liveDashboard.includes('role="tablist" aria-labelledby="marketPeriodTabListLabel"'));
check('58. every tab button carries the full role/aria-selected/aria-controls/tabindex contract',
  liveDashboard.includes('role="tab"') && liveDashboard.includes('aria-controls="marketDashboardStage"') &&
    liveDashboard.includes('data-market-universe-tab=') && liveDashboard.includes('tabindex={index === 0'));
check('59. keyboard nav supports Arrow/Home/End and moves focus to the target tab',
  liveDashboard.includes("event.key === 'ArrowRight'") && liveDashboard.includes("event.key === 'Home'") &&
    liveDashboard.includes("event.key === 'End'") && liveDashboard.includes('target.focus();'));
check('60. keyboard nav also activates the newly focused tab (ARIA APG automatic activation)',
  liveDashboard.includes('onActivate(target);'));
check('61. Enter/Space are not separately intercepted in the tab keyboard handler (native button activation relied on)',
  !liveDashboard.includes("event.key === 'Enter'") && !liveDashboard.includes("event.key === ' '"));
check('62. activating a tab updates aria-selected and the roving tabindex on every tab in its group',
  (liveDashboard.match(/t\.setAttribute\('aria-selected', active \? 'true' : 'false'\)/g) || []).length === 2 &&
    (liveDashboard.match(/t\.tabIndex = active \? 0 : -1/g) || []).length === 2);
check('63. the expanded-card modal exposes a real dialog role with aria-modal and starts hidden',
  liveDashboard.includes('role="dialog" aria-modal="true"') && liveDashboard.includes('class="market-card-modal hidden"'));
check('64. opening the modal records the triggering element and moves focus into the modal panel',
  liveDashboard.includes('lastFocusedElement = opener;') && liveDashboard.includes('modalPanel.focus();'));
check('65. closing the modal restores focus to the element that opened it', liveDashboard.includes('lastFocusedElement?.focus();'));
check('66. the modal traps Tab/Shift+Tab focus inside its own focusable-elements list',
  liveDashboard.includes('getFocusableElements') && liveDashboard.includes("event.key !== 'Tab') return;") &&
    liveDashboard.includes('event.shiftKey && document.activeElement === first'));
check('67. tab/refresh buttons meet the 44px touch-target minimum, and the modal panel is viewport-bounded',
  /\.market-tab-button\s*\{[^}]*min-height:\s*44px/.test(STYLE_CSS) &&
    /\.market-refresh-button\s*\{[^}]*min-height:\s*44px/.test(STYLE_CSS) &&
    /\.market-card-modal-panel\s*\{[^}]*calc\(100vw - 48px\)/.test(STYLE_CSS));
check('68. /heatmap issues a real permanent redirect to /market instead of duplicating the dashboard render',
  heatmap.includes("Astro.redirect('/market', 301)") && !heatmap.includes('LiveMarketDashboard') && !heatmap.includes('<Layout'));
check('69. the shared nav registry keeps /heatmap only as a legacy alias of 시장 (no separate nav entry)',
  navActiveLink.includes("aliases: ['/heatmap']") && !/label:\s*['"]\s*Heatmap/i.test(navActiveLink) &&
    navActiveLink.includes("label: '시장', href: '/market'"));
check('70. the tracked-universe registry stays bounded to exactly 4 universes with <=12 constituents each and the 4 real benchmark-proxy symbols', (() => {
  const idxKospi = marketUniverses.indexOf("id: 'kospi200'");
  const idxKosdaq = marketUniverses.indexOf("id: 'kosdaq150'");
  const idxSp500 = marketUniverses.indexOf("id: 'sp500'");
  const idxNasdaq = marketUniverses.indexOf("id: 'nasdaq100'");
  if ([idxKospi, idxKosdaq, idxSp500, idxNasdaq].some((i) => i === -1)) return false;
  const countBetween = (start, end) => (marketUniverses.slice(start, end === -1 ? undefined : end).match(/relativeWeight: \d+/g) || []).length;
  const counts = [countBetween(idxKospi, idxKosdaq), countBetween(idxKosdaq, idxSp500), countBetween(idxSp500, idxNasdaq), countBetween(idxNasdaq, -1)];
  const bounded = counts.every((c) => c > 0 && c <= 12);
  const proxies = ["symbol: '069500'", "symbol: '229200'", "symbol: 'SPY'", "symbol: 'QQQ'"].every((s) => marketUniverses.includes(s));
  return bounded && proxies;
})());

// ---------------------------------------------------------------------------
// Group 9: package.json wiring
// ---------------------------------------------------------------------------
log('--- Group 9: package.json wiring ---');
check('package.json has smoke:phase-4b-market-production-completion script', typeof pkg.scripts?.['smoke:phase-4b-market-production-completion'] === 'string');
check('package.json has check:phase-4b-market-production-completion script', typeof pkg.scripts?.['check:phase-4b-market-production-completion'] === 'string');
check('both new scripts run local node scripts only (no remote/network commands)',
  /^node scripts\//.test(pkg.scripts?.['smoke:phase-4b-market-production-completion'] || '') &&
    /^node scripts\//.test(pkg.scripts?.['check:phase-4b-market-production-completion'] || ''));

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('');
log(`Total: ${passes + failures} | Passed: ${passes} | Failed: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
