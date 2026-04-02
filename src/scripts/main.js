/* src/scripts/main.js - MK Stock Lab 통합 최종 수정 버전 */

// 1. 설정 (중복 없이 한 번만 선언)
const stockMap = { 
    "삼성전자": "KRX:005930", "하이닉스": "KRX:000660", 
    "애플": "NASDAQ:AAPL", "테슬라": "NASDAQ:TSLA", "엔비디아": "NASDAQ:NVDA" 
};

const TI_API_KEY = 'd213dca6ac0c40d791286caa227484d5'; // 크립토 키
const API_KEY = 'cf7769de37440b7ec7e6a4d9030f4e6a';    // 뉴스 키
const FETCH_INTERVAL = 30 * 60 * 1000;                // 뉴스 30분 캐싱
const CRYPTO_NEWS_INTERVAL = 30 * 60 * 1000;    // 30분 캐싱

let currentSymbol = "NASDAQ:TSLA";
let countdownInterval;
let currentMenu = '차트';
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
const MAX_PAGES = 10;
const MAX_ITEMS = 100;
let isNewsThrottled = false; // [추가] 쓰로틀링 상태 변수

const sunIconPath = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
const moonIconPath = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>`;

// [수정] 경제 뉴스 데이터 가져오기 (프록시 변경 및 날짜 형식 유지)
async function getNewsData() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem('mk_news_last_fetch') || '0');
    const cachedNews = localStorage.getItem('mk_news_cache');
    
    if (Math.floor(now / FETCH_INTERVAL) === Math.floor(lastFetch / FETCH_INTERVAL) && cachedNews) {
        return JSON.parse(cachedNews);
    }
    
    try {
        const targetUrl = `https://gnews.io/api/v4/top-headlines?category=business&lang=ko&country=kr&max=50&apikey=${API_KEY}`;
        // 프록시 서버를 codetabs로 교체하여 CORS 문제 해결
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
        const data = await response.json();
        
        const finalNews = (data.articles || []).slice(0, MAX_ITEMS);
        localStorage.setItem('mk_news_cache', JSON.stringify(finalNews));
        localStorage.setItem('mk_news_last_fetch', now.toString());
        return finalNews;
    } catch (e) { 
        console.error("News Fetch Error:", e);
        return cachedNews ? JSON.parse(cachedNews) : []; 
    }
}

async function getTICryptoNews() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem('mk_crypto_news_last_fetch') || '0');
    const cachedData = localStorage.getItem('mk_crypto_news_cache');
    
    if (now - lastFetch < CRYPTO_NEWS_INTERVAL && cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch(e) { localStorage.removeItem('mk_crypto_news_cache'); }
    }
    
    try {
        const targetUrl = `https://api.tokeninsight.com/api/v1/news/list`;

        // ✅ Fix 1: codetabs → corsproxy.io 변경
        // ✅ Fix 2: API 키를 쿼리 파라미터가 아닌 헤더로 전달
        const response = await fetch(`/api/crypto/news/list`, {
            headers: {
                'TI_API_KEY': TI_API_KEY
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const json = await response.json();

        // data가 배열인 경우 / data.list가 배열인 경우 둘 다 처리
        const rawList = Array.isArray(json.data) 
            ? json.data 
            : (json.data?.list || json.data?.items || json.data?.data || []);

console.log("TI 응답 구조 확인:", JSON.stringify(json).slice(0, 300)); // 디버그용

        if (rawList.length > 0) {
            const articles = rawList.map(item => ({ 
                title: item.title, 
                url: item.url || item.link || `https://tokeninsight.com/en/news/${item.id}`,
                source: { name: item.source_url || item.source || "TokenInsight" },
                publishedAt: new Date(item.timestamp || item.published_at || Date.now()).toISOString(),
                image: item.image_url || item.image || null
            }));
    
            localStorage.setItem('mk_crypto_news_cache', JSON.stringify(articles));
            localStorage.setItem('mk_crypto_news_last_fetch', now.toString());
            return articles;
        }

        console.warn("TokenInsight API returned empty or invalid data:", json);
        return [];

    } catch (e) {
        console.error("Crypto News Fetch Error:", e);
        return [];
    }
}

// [수정] 공통 뉴스 리스트 렌더러 - 빈 화면 방지 로직 추가
function renderNewsList(newsArray, page, menuType) {
    const container = document.getElementById('chart_container');
    if (!container) return;
    
    // 1. 기존 내용을 비웁니다.
    container.innerHTML = ""; 

    // 2. 데이터가 없거나 비어있는 경우 처리 (중요!)
    if (!newsArray || newsArray.length === 0) {
        container.innerHTML = `
            <div style="padding:100px 20px; text-align:center; color:#888;">
                <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
                <div style="font-size: 16px; font-weight: bold;">불러온 ${menuType}가 없습니다.</div>
                <div style="font-size: 14px; margin-top: 5px;">잠시 후 다시 시도해 주세요.</div>
                <button id="refresh-news-btn" onclick="handleRefresh()" style="margin-top:20px; padding:8px 16px; background:#304FFE; color:white; border:none; border-radius:4px; cursor:pointer;">새로고침</button>
            </div>`;
        return;
    }

    // 3. 데이터가 있을 경우 뉴스 리스트 생성
    const pagedNews = newsArray.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    
    pagedNews.forEach(article => {
        const dateObj = new Date(article.publishedAt);
        const dateStr = isNaN(dateObj.getTime()) ? "" : 
            `${dateObj.getFullYear()}.${String(dateObj.getMonth()+1).padStart(2,'0')}.${String(dateObj.getDate()).padStart(2,'0')}. ${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;

        const item = document.createElement('a');
        item.className = 'news-item';
        item.href = article.url; 
        item.target = "_blank";
        item.innerHTML = `
            <img src="${article.image || '/logo.svg'}" class="news-thumbnail" onerror="this.src='/logo.svg'">
            <div class="news-info">
                <div class="news-title">${article.title}</div>
                <div class="news-meta" style="font-size:12px; color:#888; margin-top:5px;">
                    <span>${article.source ? article.source.name : '뉴스'}</span> | <span>${dateStr}</span>
                </div>
            </div>`;
        container.appendChild(item);
    });
    
    renderPagination(newsArray.length, menuType);
}

// [삭제되었던 코드 복구] 경제 뉴스 실행부
async function fetchNews(page = 1) {
    currentPage = page;
    const container = document.getElementById('chart_container');
    if (!container || currentMenu !== '경제 뉴스') return;

    // 로딩 메시지 표시
    container.innerHTML = '<div style="padding:20px; text-align:center;">경제 뉴스를 불러오는 중...</div>';
    
    // 데이터 가져오기
    const allNews = await getNewsData();
    
    // 공통 리스트 렌더러로 화면 그리기
    renderNewsList(allNews, page, '경제 뉴스');
}

// [수정] 크립토 뉴스 실행부 (기존 drawCryptoUI 사용 안 함)
async function renderCryptoPage(page = 1) {
    currentPage = page;
    const container = document.getElementById('chart_container');
    if (!container || currentMenu !== '크립토 뉴스') return;
    container.innerHTML = '<div style="padding:20px; text-align:center;">크립토 뉴스를 불러오는 중...</div>';
    const news = await getTICryptoNews();
    renderNewsList(news, page, '크립토 뉴스');
}

// 5. 유틸리티
function changeMenu(element, menuName) {
    currentMenu = menuName;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    const sw = document.getElementById('search_wrapper');
    const cc = document.getElementById('chart_container');
    
    if(cc) { 
        cc.innerHTML = ""; 
        // '경제 뉴스' 또는 '크립토 뉴스'일 때 스크롤 허용
        cc.style.overflowY = (menuName === '경제 뉴스' || menuName === '크립토 뉴스') ? 'auto' : 'hidden'; 
    }
    
    if(menuName === '차트') { 
        if(sw) sw.style.display = 'flex'; 
        updateChart(currentSymbol); 
    }
    else if(menuName === '경제 뉴스') { // 명칭 변경
        if(sw) sw.style.display = 'none'; 
        fetchNews(1); 
    }
    else if(menuName === '크립토 뉴스') { // 명칭 변경
        if(sw) sw.style.display = 'none'; 
        renderCryptoPage(1);
    }
    else { 
        if(sw) sw.style.display = 'none'; 
        cc.innerHTML = `<div style="padding:100px; text-align:center;">[${menuName}] 준비 중</div>`; 
    }
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

// [추가] 제자리 새로고침 및 쓰로틀링 함수
async function handleRefresh() {
    const btn = document.getElementById('refresh-news-btn');

    // 1. 쿨타임 체크 (5초)
    if (isNewsThrottled) {
        alert("5초에 한 번만 새로고침할 수 있습니다.");
        return;
    }

    // 2. 쿨타임 시작 및 버튼 UI 제어
    isNewsThrottled = true;
    if(btn) {
        btn.disabled = true;
        btn.innerText = "불러오는 중...";
        btn.style.backgroundColor = "#888"; // 비활성화 느낌 주기
    }

    // 3. 현재 메뉴에 맞춰 데이터만 다시 호출
    if (currentMenu === '경제 뉴스') {
        localStorage.removeItem('mk_news_cache'); // 캐시 삭제 후 호출
        await fetchNews(1);
    } else if (currentMenu === '크립토 뉴스') {
        localStorage.removeItem('mk_crypto_news_cache'); // 캐시 삭제 후 호출
        await renderCryptoPage(1);
    }

    // 4. 5초 뒤에 다시 버튼 활성화
    setTimeout(() => {
        isNewsThrottled = false;
        if(btn) {
            btn.disabled = false;
            btn.innerText = "새로고침";
            btn.style.backgroundColor = "#304FFE";
        }
    }, 5000);
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
        showGotcha,
        handleRefresh // [추가] 이 줄을 넣어주세요
    });
    window.addEventListener('load', initApp);
}