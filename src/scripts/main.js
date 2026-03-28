/* src/scripts/main.js - MK Stock Lab 최종 통합 버전 */

const stockMap = { "삼성전자": "KRX:005930", "하이닉스": "KRX:000660", "애플": "NASDAQ:AAPL", "테슬라": "NASDAQ:TSLA", "엔비디아": "NASDAQ:NVDA" };
const API_KEY = 'cf7769de37440b7ec7e6a4d9030f4e6a'; 
let currentSymbol = "NASDAQ:TSLA";
let countdownInterval;
let currentMenu = '차트';
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
const FETCH_INTERVAL = 30 * 60 * 1000;
let deferredPrompt;

const sunIconPath = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
const moonIconPath = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>`;

async function getNewsData() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem('mk_news_last_fetch') || '0');
    const cachedNews = localStorage.getItem('mk_news_cache');
    if (cachedNews && (now - lastFetch < FETCH_INTERVAL)) return JSON.parse(cachedNews);
    try {
        const response = await fetch(`https://gnews.io/api/v4/top-headlines?category=business&lang=ko&country=kr&max=100&apikey=${API_KEY}`);
        const data = await response.json();
        if (data.articles) {
            localStorage.setItem('mk_news_cache', JSON.stringify(data.articles));
            localStorage.setItem('mk_news_last_fetch', now.toString());
            return data.articles;
        }
    } catch (e) { return cachedNews ? JSON.parse(cachedNews) : []; }
}

async function fetchNews(page = 1) {
    currentPage = page;
    const chartContainer = document.getElementById('chart_container');
    if (!chartContainer) return;
    chartContainer.innerHTML = '<div style="padding:20px; text-align:center;">뉴스를 정렬 중입니다...</div>';
    const allNews = await getNewsData();
    chartContainer.innerHTML = ""; 
    const pagedNews = allNews.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    pagedNews.forEach(article => {
        const newsItem = document.createElement('a');
        newsItem.className = 'news-item';
        newsItem.href = article.url; newsItem.target = "_blank";
        newsItem.innerHTML = `<img src="${article.image || '/logo.svg'}" class="news-thumbnail" onerror="this.src='/logo.svg'"><div class="news-info"><div class="news-title">${article.title}</div><div class="news-source">${article.source.name}</div></div>`;
        chartContainer.appendChild(newsItem);
    });
    renderPagination(allNews.length);
}

function renderPagination(totalItems) {
    const chartContainer = document.getElementById('chart_container');
    const nav = document.createElement('div');
    nav.className = 'pagination-nav';
    for (let i = 1; i <= Math.min(10, Math.ceil(totalItems / 10)); i++) {
        const btn = document.createElement('button');
        btn.innerText = i; if (i === currentPage) btn.className = 'active';
        btn.onclick = () => { chartContainer.scrollTop = 0; fetchNews(i); };
        nav.appendChild(btn);
    }
    chartContainer.appendChild(nav);
}

function updateChart(symbol, theme) {
    currentSymbol = symbol;
    const currentTheme = theme || (document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    const container = document.getElementById('chart_container');
    if(container) container.innerHTML = `<iframe src="https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=D&theme=${currentTheme}&style=1&locale=kr" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
}

function changeMenu(element, menuName) {
    currentMenu = menuName;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if(element) element.classList.add('active');
    const chartContainer = document.getElementById('chart_container');
    const searchWrapper = document.getElementById('search_wrapper');
    if(chartContainer) {
        chartContainer.innerHTML = "";
        chartContainer.style.overflowY = (menuName === '뉴스') ? 'auto' : 'hidden';
    }
    if(menuName === '뉴스') { if(searchWrapper) searchWrapper.style.display = 'none'; fetchNews(1); }
    else if(menuName === '차트') { if(searchWrapper) searchWrapper.style.display = 'flex'; updateChart(currentSymbol); }
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choice => {
            if (choice.outcome === 'accepted') document.getElementById('install-banner').style.display = 'none';
            deferredPrompt = null;
        });
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme(isDark ? 'dark' : 'light');
}

function applyTheme(theme) {
    const icon = document.getElementById('themeIcon');
    if (theme === 'dark') { document.body.classList.add('dark-mode'); if(icon) icon.innerHTML = sunIconPath; }
    else { document.body.classList.remove('dark-mode'); if(icon) icon.innerHTML = moonIconPath; }
    updateChart(currentSymbol, theme);
}

if (typeof window !== 'undefined') {
    window.changeMenu = changeMenu; window.fetchNews = fetchNews; window.toggleTheme = toggleTheme;
    window.installPWA = installPWA; window.closeBottomAd = () => document.getElementById('bottomAdBanner').style.display='none';
    window.changeChart = () => { const val = document.getElementById('stockInput').value; if(val) updateChart(stockMap[val] || val.toUpperCase()); };
    window.addEventListener('load', () => { applyTheme(localStorage.getItem('theme') || 'light'); });
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; document.getElementById('install-banner').style.display = 'block'; });
}