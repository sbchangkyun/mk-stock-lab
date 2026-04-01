/* src/scripts/main.js - MK Stock Lab 최적화 통합 버전 */

// 1. 설정 및 상태 관리
const stockMap = { 
    "삼성전자": "KRX:005930", "하이닉스": "KRX:000660", 
    "애플": "NASDAQ:AAPL", "테슬라": "NASDAQ:TSLA", "엔비디아": "NASDAQ:NVDA" 
};

const API_KEY = 'cf7769de37440b7ec7e6a4d9030f4e6a'; 
let currentSymbol = "NASDAQ:TSLA";
let countdownInterval;
let currentMenu = '차트';

// 뉴스 관리 변수
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
const MAX_PAGES = 10;
const MAX_ITEMS = 100;
const FETCH_INTERVAL = 30 * 60 * 1000; // 30분 (밀리초)

const sunIconPath = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
const moonIconPath = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>`;

// 2. 뉴스 데이터 최적화 로직 (캐싱 및 30분 단위 업데이트)
async function getNewsData() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem('mk_news_last_fetch') || '0');
    const cachedNews = localStorage.getItem('mk_news_cache');

    const currentSlot = Math.floor(now / FETCH_INTERVAL);
    const lastSlot = Math.floor(lastFetch / FETCH_INTERVAL);

    if (currentSlot === lastSlot && cachedNews) {
        return JSON.parse(cachedNews);
    }

    try {
        const targetUrl = `https://gnews.io/api/v4/top-headlines?category=business&lang=ko&country=kr&max=50&apikey=${API_KEY}`;
        // CORS 프록시를 경유하여 호출
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("API 호출 실패");
        
        const result = await response.json();
        // allorigins는 원본 데이터를 contents 필드에 문자열로 담아 보냅니다.
        const data = JSON.parse(result.contents); 
        
        if (!data.articles) throw new Error("데이터 형식이 올바르지 않습니다.");

        let oldNews = cachedNews ? JSON.parse(cachedNews) : [];
        const combined = [...data.articles, ...oldNews];
        const uniqueNews = Array.from(new Map(combined.map(item => [item.url, item])).values());
        const finalNews = uniqueNews.slice(0, MAX_ITEMS);
        
        localStorage.setItem('mk_news_cache', JSON.stringify(finalNews));
        localStorage.setItem('mk_news_last_fetch', now.toString());
        return finalNews;
    } catch (error) {
        console.error("뉴스 로드 실패:", error);
        return cachedNews ? JSON.parse(cachedNews) : [];
    }
}

// 3. 뉴스 렌더링 및 페이지네이션
async function fetchNews(page = 1) {
    currentPage = page;
    const chartContainer = document.getElementById('chart_container');
    if (!chartContainer) return;

    chartContainer.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-sub);">뉴스를 정렬 중입니다...</div>';
    const allNews = await getNewsData();
    chartContainer.innerHTML = ""; 

    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const pagedNews = allNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (pagedNews.length > 0) {
        pagedNews.forEach(article => {
            const newsItem = document.createElement('a');
            newsItem.className = 'news-item';
            newsItem.href = article.url;
            newsItem.target = "_blank";
            newsItem.innerHTML = `
                <img src="${article.image || '/logo.svg'}" class="news-thumbnail" onerror="this.src='/logo.svg'">
                <div class="news-info">
                    <div class="news-title">${article.title}</div>
                    <div class="news-source">${article.source.name} · ${new Date(article.publishedAt).toLocaleDateString()}</div>
                </div>
            `;
            chartContainer.appendChild(newsItem);
        });
        renderPagination(allNews.length);
    } else {
        chartContainer.innerHTML = '<div style="padding:100px 20px; text-align:center; color:var(--text-sub);">불러올 뉴스가 없습니다.</div>';
    }
}

// CSS 클래스를 사용하도록 수정한 페이지네이션 로직
function renderPagination(totalItems) {
    const chartContainer = document.getElementById('chart_container');
    const totalPages = Math.min(Math.ceil(totalItems / ITEMS_PER_PAGE), MAX_PAGES);
    
    const nav = document.createElement('div');
    nav.className = 'pagination-nav'; // style.css의 디자인 적용

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === currentPage) btn.classList.add('active'); // 활성화 스타일 적용
        
        btn.onclick = () => {
            chartContainer.scrollTop = 0;
            fetchNews(i);
        };
        nav.appendChild(btn);
    }
    chartContainer.appendChild(nav);
}

// 4. UI 제어 및 초기화
function closePopup() {
    const popup = document.getElementById('slidePopup');
    if(document.getElementById('noShowCheckbox')?.checked) {
        localStorage.setItem('adPopupExpire', new Date().getTime() + (24 * 60 * 60 * 1000));
    }
    if(popup) popup.classList.remove('active');
    clearInterval(countdownInterval);
}

function changeMenu(element, menuName) {
    currentMenu = menuName;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    const searchWrapper = document.getElementById('search_wrapper');
    const chartContainer = document.getElementById('chart_container');
    
    if(chartContainer) {
        chartContainer.innerHTML = "";
        chartContainer.style.overflowY = (menuName === '뉴스') ? 'auto' : 'hidden';
    }

    if(menuName === '차트') {
        if(searchWrapper) searchWrapper.style.display = 'flex';
        updateChart(currentSymbol);
    } else if(menuName === '뉴스') {
        if(searchWrapper) searchWrapper.style.display = 'none';
        fetchNews(1); 
    } else {
        if(searchWrapper) searchWrapper.style.display = 'none';
        chartContainer.innerHTML = `<div style="padding:100px 20px; text-align:center; color:var(--text-sub); font-weight:bold;">[${menuName}] 준비 중</div>`;
    }
}

function updateChart(symbol, theme) {
    currentSymbol = symbol;
    const currentTheme = theme || (document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    const container = document.getElementById('chart_container');
    if(container) {
        container.innerHTML = `<iframe src="https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=D&theme=${currentTheme}&style=1&timezone=Asia%2FSeoul&locale=kr" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    const icon = document.getElementById('themeIcon');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if(icon) icon.innerHTML = sunIconPath;
    } else {
        document.body.classList.remove('dark-mode');
        if(icon) icon.innerHTML = moonIconPath;
    }
    renderTicker(theme);
    if(currentMenu === '차트') updateChart(currentSymbol, theme);
}

function renderTicker(theme) {
    const tickerArea = document.getElementById('ticker_area');
    if(!tickerArea) return;
    tickerArea.innerHTML = "";
    const container = document.createElement('div');
    container.className = "tradingview-widget-container";
    
    // CSS에서 너비와 배율을 제어하므로 JS에서는 최소한의 레이아웃만 설정
    container.style.cssText = "height: 55px; width: 100%; display: block;"; 
    container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:55px; width:100%;"></div>`;
    
const script = document.createElement('script');
    script.type = "text/javascript";
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
        "colorTheme": theme, 
        "isTransparent": true, 
        "displayMode": "adaptive", 
        "locale": "kr"
    });
    container.appendChild(script);
    tickerArea.appendChild(container);
}

function changeChart() {
    const input = document.getElementById('stockInput');
    if(!input) return;
    const query = input.value.trim();
    if(!query) return;
    let symbol = stockMap[query] || ( /^\d{6}$/.test(query) ? "KRX:" + query : query.toUpperCase() );
    updateChart(symbol);
    input.value = "";
    input.blur();
}

function showGotcha() {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 500);
    }
}

function initApp() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    const expire = localStorage.getItem('adPopupExpire');
    if (!expire || new Date().getTime() > expire) {
        setTimeout(() => { 
            const popup = document.getElementById('slidePopup');
            if(popup) {
                popup.classList.add('active'); 
                startAdCountdown(); 
            }
        }, 500);
    }
}

function startAdCountdown() {
    let timeLeft = 10;
    const closeBtn = document.querySelector('.popup-close-btn'); // 닫기 버튼 찾기

    countdownInterval = setInterval(() => {
        timeLeft--;
        
        // 추가된 기믹: 1초가 지났을 때(남은 시간 9초) 버튼 위치 이동
        if (timeLeft === 9 && closeBtn) {
            closeBtn.classList.add('moved'); 
        }

        const timerEl = document.getElementById('timerText');
        if(timerEl) timerEl.innerText = timeLeft;
        if (timeLeft <= 0) closePopup();
    }, 1000);
}

// 하단 쿠팡 광고를 닫는 기능
function closeBottomAd() {
    const bottomAd = document.getElementById('bottomAdBanner');
    if (bottomAd) {
        bottomAd.style.display = 'none'; // 광고 영역을 화면에서 숨김
    }
}

// 모든 기능을 브라우저에 등록
if (typeof window !== 'undefined') {
    window.closePopup = closePopup;
    window.changeMenu = changeMenu;
    window.toggleTheme = toggleTheme;
    window.changeChart = changeChart;
    window.showGotcha = showGotcha;
    window.fetchNews = fetchNews;
    window.updateChart = updateChart;
    window.closeBottomAd = closeBottomAd; // 푸터 닫기 기능 등록
    window.addEventListener('load', initApp);
}