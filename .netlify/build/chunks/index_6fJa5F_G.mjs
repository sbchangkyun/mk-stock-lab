import { c as createComponent } from './astro-component_BfgB0LKK.mjs';
import 'piccolore';
import { g as createRenderInstruction, r as renderTemplate, h as renderSlot, i as renderHead, m as maybeRenderHead, j as renderComponent } from './ssr-function_tIN4Wg4C.mjs';
import 'clsx';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

var __freeze$3 = Object.freeze;
var __defProp$3 = Object.defineProperty;
var __template$3 = (cooked, raw) => __freeze$3(__defProp$3(cooked, "raw", { value: __freeze$3(cooked.slice()) }));
var _a$3;
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate(_a$3 || (_a$3 = __template$3(['<html lang="ko"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>', '</title><link rel="icon" type="image/svg+xml" href="/logo.svg"><link rel="manifest" href="/manifest.json"><link rel="apple-touch-icon" href="/icon-192.png"><meta name="theme-color" content="#1A237E"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8654345483667820" crossorigin="anonymous"><\/script>', "</head> <body> ", " ", " </body> </html>"])), title, renderHead(), renderSlot($$result, $$slots["default"]), renderScript($$result, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"));
}, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/layouts/Layout.astro", void 0);

var __freeze$2 = Object.freeze;
var __defProp$2 = Object.defineProperty;
var __template$2 = (cooked, raw) => __freeze$2(__defProp$2(cooked, "raw", { value: __freeze$2(cooked.slice()) }));
var _a$2;
const $$SlideAd = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$2 || (_a$2 = __template$2(["", '<div id="slidePopup" data-astro-cid-rizqh274> <div class="ad-content" data-astro-cid-rizqh274> <div class="ad-wrapper" data-astro-cid-rizqh274> <script src="https://ads-partners.coupang.com/g.js"><\/script> <script>\n                new PartnersCoupang.G({\n                    "id": 977521,\n                    "template": "carousel",\n                    "trackingCode": "AF7826180",\n                    "width": "320",\n                    "height": "140",\n                    "tsource": ""\n                });\n            <\/script> </div> <div class="popup-close-btn" onclick="closePopup()" data-astro-cid-rizqh274>×</div> <p class="ad-disclaimer" data-astro-cid-rizqh274>이 포스팅은 쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다.</p> </div> <div class="close-bar" data-astro-cid-rizqh274> <div class="timer-info" data-astro-cid-rizqh274><span id="timerText" data-astro-cid-rizqh274>10</span>초 후 자동 종료</div> <div class="no-show-area" data-astro-cid-rizqh274> <label style="font-size:11px; font-weight:normal;" data-astro-cid-rizqh274> <input type="checkbox" id="noShowCheckbox" data-astro-cid-rizqh274> 오늘 하루 보지 않기\n</label> </div> </div> </div>'])), maybeRenderHead());
}, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/components/SlideAd.astro", void 0);

const $$Header = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<header class="header-container"> <div class="logo-area" onclick="location.reload()"> <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M10 45V15L20 30L30 15L40 45" stroke="#1A237E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M30 15L45 5L45 15M45 5L35 5" stroke="#FF1744" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="10" cy="45" r="3" fill="#1A237E"></circle><circle cx="20" cy="30" r="3" fill="#1A237E"></circle><circle cx="30" cy="15" r="3" fill="#FF1744"></circle><text x="55" y="32" font-family="Arial, sans-serif" font-weight="900" font-size="28">MK</text><text x="55" y="52" font-family="Arial, sans-serif" font-weight="bold" font-size="14" letter-spacing="1">STOCK LAB</text> </svg> </div> <div class="header-actions"> <div id="themeToggle" onclick="toggleTheme()"><svg id="themeIcon" viewBox="0 0 24 24"></svg></div> <button id="loginBtn" onclick="showGotcha()">Login</button> </div> </header>`;
}, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/components/Header.astro", void 0);

const $$Ticker = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="independent-ticker" id="ticker_area"></div>`;
}, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/components/Ticker.astro", void 0);

const $$Nav = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<nav class="nav-menu-wrapper"> <ul class="nav-menu"> <li class="nav-item active" onclick="changeMenu(this, '차트')">차트</li> <li class="nav-item" onclick="changeMenu(this, '경제 뉴스')">경제 뉴스</li> <li class="nav-item" onclick="changeMenu(this, '크립토 뉴스')">크립토 뉴스</li> <li class="nav-item" onclick="changeMenu(this, '실시간검색어')">실시간</li> </ul> </nav>`;
}, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/components/Nav.astro", void 0);

const $$ChartArea = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<main class="main-wrapper"> <div class="search-area" id="search_wrapper"> <input type="text" id="stockInput" placeholder="미국 종목명 또는 티커(AAPL) 입력" onkeypress="if(event.keyCode==13) changeChart()"> <button id="searchBtn" onclick="changeChart()">조회</button> </div> <div id="chart_container"></div> </main>`;
}, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/components/ChartArea.astro", void 0);

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1;
const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", '<div class="fixed-bottom-area" id="fixedBottomArea" data-astro-cid-sz7xmlte> <div class="bottom-ad-banner" id="bottomAdBanner" data-astro-cid-sz7xmlte> <div class="close-ad-btn" onclick="closeBottomAd()" data-astro-cid-sz7xmlte>×</div> <div class="footer-ad-wrapper" data-astro-cid-sz7xmlte> <script src="https://ads-partners.coupang.com/g.js"><\/script> <script>\n                new PartnersCoupang.G({\n                    "id": 977521,\n                    "template": "carousel",\n                    "trackingCode": "AF7826180",\n                    "width": "728",\n                    "height": "70",\n                    "tsource": ""\n                });\n            <\/script> </div> </div> <footer class="fixed-footer" data-astro-cid-sz7xmlte> <div class="footer-content" data-astro-cid-sz7xmlte> <span data-astro-cid-sz7xmlte>© 2026 MK Stock Lab</span> <a href="https://www.youtube.com/@MaunjaroKIM" target="_blank" class="footer-link" data-astro-cid-sz7xmlte> <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000" data-astro-cid-sz7xmlte><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" data-astro-cid-sz7xmlte></path></svg>\n유튜브 채널 구독하기\n</a> </div> </footer> </div>'])), maybeRenderHead());
}, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/components/Footer.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(["", ' <script src="https://cdn.jsdelivr.net/gh/timdream/wordcloud2.js@gh-pages/src/wordcloud2.js"><\/script>'])), renderComponent($$result, "Layout", $$Layout, { "title": "MK Stock Lab - 실시간 투자·경제 뉴스" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "SlideAd", $$SlideAd, {})} ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "Ticker", $$Ticker, {})} ${renderComponent($$result2, "Nav", $$Nav, {})} ${maybeRenderHead()}<div id="toast">힝 속았지?</div> ${renderComponent($$result2, "ChartArea", $$ChartArea, {})} ${renderComponent($$result2, "Footer", $$Footer, {})} ` }));
}, "C:/Users/kkama/Documents/Project/mk-stock-lab/src/pages/index.astro", void 0);

const $$file = "C:/Users/kkama/Documents/Project/mk-stock-lab/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
