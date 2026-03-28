/* script.js - MK Stock Lab 핵심 로직 */

// 1. 전역 설정 및 상태 관리
const stockMap = { 
    "삼성전자": "KRX:005930", "하이닉스": "KRX:000660", 
    "애플": "NASDAQ:AAPL", "테슬라": "NASDAQ:TSLA", "엔비디아": "NASDAQ:NVDA" 
};
const API_KEY = 'c646d344851649e5b79aff63f468902a'; // 뉴스 API 키
let currentSymbol = "NASDAQ:TSLA";
let countdownInterval;
let newsPage = 1;
let isNewsLoading = false;
let currentMenu = '차트';

// 아이콘 경로 정의
const sunIconPath = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
const moonIconPath = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>`;

/**
 * 팝업 및 광고 제어 로직
 */
function closePopup() {
    const popup = document.getElementById('slidePopup');
    if(document.getElementById('noShowCheckbox').checked) {
        localStorage.setItem('adPopupExpire', new Date().getTime() + (24 * 60 * 60 * 1000));
    }
    if(popup) popup.classList.remove('active');
    clearInterval(countdownInterval);
}

function closeBottomAd() {
    const banner = document.getElementById('bottomAdBanner');
    if(banner) banner.style.display = 'none';
    document.body.style.paddingBottom = '60px'; 
}

function startAdCountdown() {
    let timeLeft = 10;
    setTimeout(() => {
        const closeBtn = document.querySelector('.popup-close-btn');
        if (closeBtn) closeBtn.style.bottom = '15px'; 
    }, 1800);

    countdownInterval = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('timerText');
        if(timerEl) timerEl.innerText = timeLeft;
        if (timeLeft <= 0) closePopup();
    }, 1000);
}

/**
 * 메뉴 및 콘텐츠 전환 로직
 */
function changeMenu(element, menuName) {
    currentMenu = menuName;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    const searchWrapper = document.getElementById('search_wrapper');
    const chartContainer = document.getElementById('chart_container');
    const stockInput = document.getElementById('stockInput');
    
    if(stockInput) stockInput.value = "";
    if(chartContainer) chartContainer.scrollTop = 0;

    if(menuName === '차트') {
        if(searchWrapper) searchWrapper.style.display = 'flex';
        updateChart(currentSymbol);
    } else if(menuName === '뉴스') {
        if(searchWrapper) searchWrapper.style.display = 'none';
        newsPage = 1;
        if(chartContainer) {
            chartContainer.innerHTML = "";
            fetchNews(5); 
        }
    } else {
        if(searchWrapper) searchWrapper.style.display = 'none';
        if(chartContainer) chartContainer.innerHTML = `<div style="padding:100px 20px; text-align:center; color:var(--text-sub); font-weight:bold;">[${menuName}] 서비스 준비 중입니다.</div>`;
    }
}

/**
 * 데이터 통신 (뉴스 API 및 차트)
 */
async function fetchNews(pageSize) {
    if (isNewsLoading) return;
    isNewsLoading = true;
    
    const chartContainer = document.getElementById('chart_container');
    const loadingMsg = document.createElement('div');
    loadingMsg.id = "news-loading";
    loadingMsg.style.cssText = "padding:20px; text-align:center; color:var(--text-sub); font-size:13px;";
    loadingMsg.innerText = "뉴스를 불러오는 중...";
    if(chartContainer) chartContainer.appendChild(loadingMsg);

    try {
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=kr&category=business&pageSize=${pageSize}&page=${newsPage}&apiKey=${API_KEY}`);
        const data = await response.json();
        
        const existingLoading = document.getElementById('news-loading');
        if (existingLoading && chartContainer) chartContainer.removeChild(existingLoading);

        if (data.status === "ok" && data.articles && data.articles.length > 0) {
            data.articles.forEach(article => {
                const newsItem = document.createElement('a');
                newsItem.className = 'news-item';
                newsItem.href = article.url;
                newsItem.target = "_blank";
                const imgUrl = article.urlToImage || 'https://via.placeholder.com/100x70?text=MK+STOCK';
                newsItem.innerHTML = `
                    <img src="${imgUrl}" class="news-thumbnail" onerror="this.src='https://via.placeholder.com/100x70?text=MK+STOCK'">
                    <div class="news-info">
                        <div class="news-title">${article.title}</div>
                        <div class="news-source">${article.source.name} · ${new Date(article.publishedAt).toLocaleDateString()}</div>
                    </div>
                `;
                if(chartContainer) chartContainer.appendChild(newsItem);
            });
            newsPage++;
        }
    } catch (error) {
        console.error("News load failed:", error);
    } finally {
        isNewsLoading = false;
    }
}

// 스크롤 감지 이벤트 리스너
const chartContainerEl = document.getElementById('chart_container');
if(chartContainerEl) {
    chartContainerEl.addEventListener('scroll', function() {
        if (currentMenu !== '뉴스') return;
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 50) {
            fetchNews(2); 
        }
    });
}

/**
 * 테마 및 위젯 렌더링
 */
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
    container.style.cssText = "height: 100%; width: 100%; display: flex; align-items: center;";
    container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:100%; width:100%;"></div>`;
    const script = document.createElement('script');
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.text = JSON.stringify({
        "symbols": [{ "proName": "NASDAQ:NDAQ", "title": "나스닥" }, { "proName": "FRED:SP500", "title": "S&P 500" }, { "proName": "UPBIT:BTCKRW", "title": "비트코인" }, { "proName": "FX_IDC:USDKRW", "title": "원/달러" }],
        "showSymbolLogo": true, "colorTheme": theme, "isTransparent": true, "displayMode": "adaptive", "locale": "kr"
    });
    container.appendChild(script);
    tickerArea.appendChild(container);
}

function updateChart(symbol, theme) {
    currentSymbol = symbol;
    const currentTheme = theme || (document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    const container = document.getElementById('chart_container');
    if(container) {
        container.style.overflowY = 'hidden';
        container.innerHTML = `<iframe src="https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=D&theme=${currentTheme}&style=1&timezone=Asia%2FSeoul&locale=kr" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
    }
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

// 초기화 실행
window.onload = function() {
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
};

// 서비스 워커 등록 (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => console.log('SW 등록 성공'))
            .catch((err) => console.log('SW 등록 실패', err));
    });
}

/* src/scripts/main.js 맨 아래에 추가 */

if (typeof window !== 'undefined') {
    // 1. 버튼 클릭 함수들을 전역(window)에 등록
    window.closePopup = closePopup;
    window.closeBottomAd = closeBottomAd;
    window.changeMenu = changeMenu;
    window.toggleTheme = toggleTheme;
    window.changeChart = changeChart;
    window.showGotcha = showGotcha;

    // 2. 초기 로딩 시 테마와 팝업 체크 실행
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (typeof applyTheme === 'function') applyTheme(savedTheme);

    const expire = localStorage.getItem('adPopupExpire');
    if (!expire || new Date().getTime() > expire) {
        setTimeout(() => { 
            const popup = document.getElementById('slidePopup');
            if(popup) {
                popup.classList.add('active'); 
                if (typeof startAdCountdown === 'function') startAdCountdown(); 
            }
        }, 500);
    }
}