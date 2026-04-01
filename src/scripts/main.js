/* src/scripts/main.js - MK Stock Lab 통합 최종 수정 버전 */

// 1. 설정 (중복 없이 한 번만 선언)
const stockMap = { 
    "삼성전자": "KRX:005930", "하이닉스": "KRX:000660", 
    "애플": "NASDAQ:AAPL", "테슬라": "NASDAQ:TSLA", "엔비디아": "NASDAQ:NVDA" 
};

const TI_API_KEY = 'd213dca6ac0c40d791286caa227484d5'; // 크립토 키
const API_KEY = 'cf7769de37440b7ec7e6a4d9030f4e6a';    // 뉴스 키
const CRYPTO_FETCH_INTERVAL = 60 * 60 * 1000;         // 1시간 캐싱
const FETCH_INTERVAL = 30 * 60 * 1000;                // 뉴스 30분 캐싱
const CRYPTO_NEWS_INTERVAL = 30 * 60 * 1000;    // 30분 캐싱

let currentSymbol = "NASDAQ:TSLA";
let countdownInterval;
let currentMenu = '차트';
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
const MAX_PAGES = 10;
const MAX_ITEMS = 100;

const sunIconPath = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
const moonIconPath = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>`;

// 2. 뉴스 데이터 로직
async function getNewsData() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem('mk_news_last_fetch') || '0');
    const cachedNews = localStorage.getItem('mk_news_cache');
    if (Math.floor(now / FETCH_INTERVAL) === Math.floor(lastFetch / FETCH_INTERVAL) && cachedNews) {
        return JSON.parse(cachedNews);
    }
    try {
        const targetUrl = `https://gnews.io/api/v4/top-headlines?category=business&lang=ko&country=kr&max=50&apikey=${API_KEY}`;
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
        const result = await response.json();
        const data = JSON.parse(result.contents); 
        let oldNews = cachedNews ? JSON.parse(cachedNews) : [];
        const combined = [...(data.articles || []), ...oldNews];
        const uniqueNews = Array.from(new Map(combined.map(item => [item.url, item])).values());
        const finalNews = uniqueNews.slice(0, MAX_ITEMS);
        localStorage.setItem('mk_news_cache', JSON.stringify(finalNews));
        localStorage.setItem('mk_news_last_fetch', now.toString());
        return finalNews;
    } catch (e) { return cachedNews ? JSON.parse(cachedNews) : []; }
}

async function getCryptoData() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem('mk_crypto_last_fetch') || '0');
    const cachedData = localStorage.getItem('mk_crypto_cache');

    if (now - lastFetch < CRYPTO_FETCH_INTERVAL && cachedData) {
        return JSON.parse(cachedData);
    }

    try {
        // CoinGecko는 인증 없이 CORS 직접 지원 → 프록시 불필요
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const json = await response.json();
        const raw = json.data;

        // 기존 코드와 호환되도록 필드명 맞추기
        const data = {
            total_market_cap: raw.total_market_cap.usd,
            btc_dominance: raw.market_cap_percentage.btc,
        };

        localStorage.setItem('mk_crypto_cache', JSON.stringify(data));
        localStorage.setItem('mk_crypto_last_fetch', now.toString());
        return data;

    } catch (e) {
        console.error("Crypto Fetch Error:", e);
        return cachedData ? JSON.parse(cachedData) : null;
    }
}

// 탐욕 지수 가져오기
async function getFearAndGreed() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem('fng_last_fetch') || '0');
    const cached = localStorage.getItem('fng_cache');

    if (now - lastFetch < CRYPTO_FETCH_INTERVAL && cached) return JSON.parse(cached);

    try {
        const res = await fetch('https://api.alternative.me/fng/');
        const json = await res.json();
        const data = json.data[0];
        localStorage.setItem('fng_cache', JSON.stringify(data));
        localStorage.setItem('fng_last_fetch', now.toString());
        return data;
    } catch (e) { return cached ? JSON.parse(cached) : { value: "50", value_classification: "Neutral" }; }
}

// [수정] TokenInsight 글로벌 뉴스 가져오기 (CryptoCompare 제거 및 TokenInsight 전용)
async function getTICryptoNews() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem('mk_crypto_news_last_fetch') || '0');
    const cachedData = localStorage.getItem('mk_crypto_news_cache');
    if (now - lastFetch < CRYPTO_NEWS_INTERVAL && cachedData) return JSON.parse(cachedData);
    try {
        const targetUrl = `https://api.tokeninsight.com/api/v1/news/list?TI_API_KEY=${TI_API_KEY}`;
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
        const result = await response.json();
        const json = JSON.parse(result.contents);
        if (json && json.data && json.data.list) {
            const articles = json.data.list.slice(0, 10).map(item => ({ 
                title: item.title, 
                url: `https://tokeninsight.com/en/news/${item.id}` 
            }));
            localStorage.setItem('mk_crypto_news_cache', JSON.stringify(articles));
            localStorage.setItem('mk_crypto_news_last_fetch', now.toString());
            return articles;
        }
        return cachedData ? JSON.parse(cachedData) : [];
    } catch (e) { return cachedData ? JSON.parse(cachedData) : []; }
}

// 4. 화면 그리기 기능들
async function fetchNews(page = 1) {
    currentPage = page;
    const container = document.getElementById('chart_container');
    if (!container) return;
    container.innerHTML = '<div style="padding:20px; text-align:center;">뉴스를 불러오는 중...</div>';
    const allNews = await getNewsData();
    if (currentMenu !== '뉴스') return;
    container.innerHTML = ""; 
    const pagedNews = allNews.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    pagedNews.forEach(article => {
        const item = document.createElement('a');
        item.className = 'news-item';
        item.href = article.url; item.target = "_blank";
        item.innerHTML = `<img src="${article.image || '/logo.svg'}" class="news-thumbnail" onerror="this.src='/logo.svg'"><div class="news-info"><div class="news-title">${article.title}</div><div class="news-source">${article.source ? article.source.name : '뉴스'}</div></div>`;
        container.appendChild(item);
    });
    renderPagination(allNews.length);
}

function renderPagination(totalItems) {
    const container = document.getElementById('chart_container');
    const nav = document.createElement('div');
    nav.className = 'pagination-nav';
    for (let i = 1; i <= Math.min(Math.ceil(totalItems / ITEMS_PER_PAGE), MAX_PAGES); i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === currentPage) btn.classList.add('active');
        btn.onclick = () => { container.scrollTop = 0; fetchNews(i); };
        nav.appendChild(btn);
    }
    container.appendChild(nav);
}

// [수정] UI 그리기 함수 (ratings 매개변수 제거 및 레이아웃 조정)
function drawCryptoUI(crypto, fng, news) {
    const container = document.getElementById('chart_container');
    if (!container || currentMenu !== '크립토') return;
    const marketCap = crypto ? (crypto.total_market_cap / 1e12).toFixed(2) : '--';
    const dominance = crypto ? crypto.btc_dominance.toFixed(1) : '--';
    const fngValue = parseInt(fng?.value || 50);
    const fngColor = fngValue > 70 ? '#4caf50' : fngValue < 30 ? '#f44336' : '#ff9800';
    container.innerHTML = `
        <div style="padding:20px; overflow-y:auto; height:100%;">
            <div class="crypto-hero-area">
                <div class="stat-card"><span class="stat-label">글로벌 시총</span><span class="stat-value">$${marketCap}T</span></div>
                <div class="stat-card">
                    <span class="stat-label">비트코인 점유율</span><span class="stat-value">${dominance}%</span>
                    <div class="dominance-container"><div class="dominance-bar" style="width:${dominance}%"></div></div>
                </div>
                <div class="stat-card">
                    <span class="stat-label">공포 & 탐욕 지수</span><span class="stat-value" style="color:${fngColor}">${fngValue}</span>
                    <div class="fng-gauge-container"><div class="fng-gauge-bar" style="width:${fngValue}%; background:${fngColor}"></div></div>
                    <span class="fng-label">${fng?.value_classification || 'Neutral'}</span>
                </div>
            </div>
            <div class="crypto-grid" style="display: block;">
                <div class="crypto-card">
                    <h3>글로벌 크립토 뉴스 (30m)</h3>
                    <div class="crypto-news-list">
                        ${(news || []).slice(0, 10).map(n => `<div class="crypto-news-item"><a href="${n.url}" target="_blank" class="crypto-news-link"><span class="news-tag">LIVE</span><span>${n.title}</span></a></div>`).join('')}
                    </div>
                </div>
            </div>
        </div>`;
}

// [수정] 메인 실행 함수 (ratings 호출 제거)
async function renderCryptoPage() {
    const container = document.getElementById('chart_container');
    if (!container) return;

    const cachedCrypto = JSON.parse(localStorage.getItem('mk_crypto_cache'));
    const cachedFng = JSON.parse(localStorage.getItem('fng_cache'));
    const cachedNews = JSON.parse(localStorage.getItem('mk_crypto_news_cache'));

    if (cachedCrypto || cachedFng || cachedNews) {
        drawCryptoUI(cachedCrypto, cachedFng, cachedNews);
    } else {
        container.innerHTML = '<div style="padding:50px; text-align:center;">데이터를 분석 중입니다...</div>';
    }
    
    // ratings를 제외하고 3개만 호출
    const [crypto, fng, news] = await Promise.all([
        getCryptoData(), getFearAndGreed(), getTICryptoNews()
    ]);
    
    drawCryptoUI(crypto, fng, news);
}

// 5. 유틸리티
function changeMenu(element, menuName) {
    currentMenu = menuName;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    const sw = document.getElementById('search_wrapper');
    const cc = document.getElementById('chart_container');
    if(cc) { cc.innerHTML = ""; cc.style.overflowY = (menuName === '뉴스' || menuName === '크립토') ? 'auto' : 'hidden'; }
    if(menuName === '차트') { if(sw) sw.style.display = 'flex'; updateChart(currentSymbol); }
    else if(menuName === '뉴스') { if(sw) sw.style.display = 'none'; fetchNews(1); }
    else if(menuName === '크립토') { if(sw) sw.style.display = 'none'; renderCryptoPage(); }
    else { if(sw) sw.style.display = 'none'; cc.innerHTML = `<div style="padding:100px; text-align:center;">[${menuName}] 준비 중</div>`; }
}

function updateChart(symbol, theme) {
    currentSymbol = symbol;
    const t = theme || (document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    const c = document.getElementById('chart_container');
    if(c) c.innerHTML = `<iframe src="https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=D&theme=${t}&style=1&timezone=Asia%2FSeoul&locale=kr" width="100%" height="100%" frameborder="0"></iframe>`;
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    const t = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', t);
    applyTheme(t);
}

function applyTheme(t) {
    const icon = document.getElementById('themeIcon');
    if (t === 'dark') { document.body.classList.add('dark-mode'); if(icon) icon.innerHTML = sunIconPath; }
    else { document.body.classList.remove('dark-mode'); if(icon) icon.innerHTML = moonIconPath; }
    renderTicker(t);
    if(currentMenu === '차트') updateChart(currentSymbol, t);
}

function renderTicker(t) {
    const area = document.getElementById('ticker_area');
    if(!area) return;
    area.innerHTML = "";
    const container = document.createElement('div');
    container.style.cssText = "height:55px; width:100%;";
    const script = document.createElement('script');
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.text = JSON.stringify({
        "symbols": [
            { "proName": "CAPITALCOM:DXY", "title": "달러인덱스" }, 
            { "proName": "NASDAQ:NDAQ", "title": "나스닥" }, 
            { "proName": "FRED:SP500", "title": "S&P 500" }, 
            { "proName": "UPBIT:BTCKRW", "title": "비트코인" },
            { "proName": "UPBIT:ETHKRW", "title": "이더리움" }, 
            { "proName": "UPBIT:SOLKRW", "title": "솔라나" }, 
            { "proName": "TVC:GOLD", "title": "골드" }, 
            { "proName": "TVC:SILVER", "title": "실버" }, 
            { "proName": "FX_IDC:USDKRW", "title": "원/달러" }
        ],
        "showSymbolLogo": true, 
        "colorTheme": t, // 수정됨
        "isTransparent": true, 
        "displayMode": "adaptive", 
        "locale": "kr"
    });
    container.appendChild(script);
    area.appendChild(container); // 수정됨
}

function changeChart() {
    const input = document.getElementById('stockInput');
    const q = input?.value.trim();
    if(!q) return;
    let s = stockMap[q] || ( /^\d{6}$/.test(q) ? "KRX:" + q : q.toUpperCase() );
    updateChart(s);
    input.value = "";
}

function initApp() {
    applyTheme(localStorage.getItem('theme') || 'light');
    const expire = localStorage.getItem('adPopupExpire');
    if (!expire || new Date().getTime() > expire) {
        setTimeout(() => { 
            const p = document.getElementById('slidePopup');
            if(p) { p.classList.add('active'); startAdCountdown(); }
        }, 500);
    }
}

function startAdCountdown() {
    let t = 10;
    const btn = document.querySelector('.popup-close-btn');
    countdownInterval = setInterval(() => {
        t--;
        if (t === 9 && btn) btn.classList.add('moved');
        const el = document.getElementById('timerText');
        if(el) el.innerText = t;
        if (t <= 0) closePopup();
    }, 1000);
}

function closePopup() {
    const p = document.getElementById('slidePopup');
    if(document.getElementById('noShowCheckbox')?.checked) localStorage.setItem('adPopupExpire', new Date().getTime() + 86400000);
    if(p) p.classList.remove('active');
    clearInterval(countdownInterval);
}

function closeBottomAd() {
    const ad = document.getElementById('bottomAdBanner');
    if (ad) ad.style.display = 'none';
}

function showGotcha() {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.innerText = "아직 안됨 😜;;";
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 2000);
    }
}

// 앱 초기화 실행
if (typeof window !== 'undefined') {
    // [중요] 모든 기능을 브라우저 전역 객체에 등록합니다. 
    Object.assign(window, { 
        closePopup, 
        changeMenu, 
        toggleTheme, 
        changeChart, 
        fetchNews, 
        updateChart, 
        closeBottomAd, 
        renderCryptoPage, 
        showGotcha 
    });
    window.addEventListener('load', initApp);
}