/* src/scripts/main.js - MK Stock Lab 통합 최종 수정 버전 */

// 1. 설정 (중복 없이 한 번만 선언)
const stockMap = { 
    "삼성전자": "KRX:005930", "하이닉스": "KRX:000660", 
    "애플": "NASDAQ:AAPL", "테슬라": "NASDAQ:TSLA", "엔비디아": "NASDAQ:NVDA" 
};

const TI_API_KEY = import.meta.env.PUBLIC_TI_API_KEY; // 토큰인사이트
const API_KEY = import.meta.env.PUBLIC_GNEWS_API_KEY; // G뉴스

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
    
    // 캐싱 로직 (30분 이내면 캐시 반환)
    if (Math.floor(now / FETCH_INTERVAL) === Math.floor(lastFetch / FETCH_INTERVAL) && cachedNews) {
        return JSON.parse(cachedNews);
    }
    
    try {
        // ✅ GNews 무료플랜은 1회에 10개 제한 → 10페이지 × 10개 = 100개를 위해 순차 호출
        const allArticles = [];

        for (let page = 1; page <= 10; page++) {
            const apiUrl = `/api/news?page=${page}`; // 내부 API 경로로 변경
            
            try {
                const res = await fetch(apiUrl); // 일반 fetch 사용
                const json = await res.json();
                
                // GNews API의 응답 데이터는 json.articles에 들어있습니다.
                const articles = json.articles || [];

                if (articles.length === 0) break; // 더 이상 기사가 없으면 중단
                
                allArticles.push(...articles);
                console.log(`경제 뉴스 ${page}페이지 로드: ${articles.length}개 (누적 ${allArticles.length}개)`);

            } catch (e) {
                console.warn(`경제 뉴스 ${page}페이지 로드 실패, 중단`);
                break;
            }
        }

        const finalNews = allArticles.slice(0, MAX_ITEMS);
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
        // 1. 외부 API 주소 설정
        const response = await fetch(`/api/list`, {
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();   // ← 변수명도 json으로 복원

        // 2. 데이터 구조 파싱
        const rawList = Array.isArray(json.data)
            ? json.data
            : (json.data?.list || json.data?.items || json.data?.data || []);
        console.log("TI 응답 구조 확인:", JSON.stringify(json).slice(0, 300));
        
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
                <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
                <div style="font-size: 16px; font-weight: bold; color: #333;">뉴스를 불러오지 못했습니다.</div>
                <div style="font-size: 13px; margin-top: 5px;">프록시 서버 응답 지연 또는 API 할당량 초과일 수 있습니다.</div>
                <button onclick="handleRefresh()" style="margin-top:20px; padding:10px 20px; background:#304FFE; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">뉴스 다시 불러오기</button>
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

// [추가] 뉴스 페이지네이션 렌더러
function renderPagination(totalItems, menuType) {
    const container = document.getElementById('chart_container');
    if (!container || totalItems === 0) return;

    const totalPages = Math.min(Math.ceil(totalItems / ITEMS_PER_PAGE), MAX_PAGES);
    // ✅ 데이터가 적어도 페이지 번호 1은 보이게 하려면 totalItems < 1 조건으로 변경 가능
    if (totalPages < 1) return;

    const nav = document.createElement('div');
    nav.className = 'pagination';
    // [수정] flex-wrap: wrap 추가하여 버튼이 잘리지 않고 다음 줄로 넘어가게 함
    nav.style.cssText = `
        display: flex; 
        justify-content: center; 
        flex-wrap: wrap; 
        gap: 8px; 
        margin: 20px 0; 
        padding: 0 10px 40px 10px;
    `;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.style.cssText = `
            padding: 6px 12px; 
            border: 1px solid #ddd; 
            background: ${currentPage === i ? '#304FFE' : '#fff'}; 
            color: ${currentPage === i ? '#fff' : '#333'}; 
            cursor: pointer; 
            border-radius: 4px;
            font-size: 13px;
        `;
        btn.onclick = () => {
            if (menuType === '경제 뉴스') fetchNews(i);
            else if (menuType === '크립토 뉴스') renderCryptoPage(i);
            container.scrollTo(0, 0); // 페이지 이동 시 상단으로 스크롤
        };
        nav.appendChild(btn);
    }
    container.appendChild(nav);
}

// 5. 유틸리티 및 메뉴 제어 (중복 및 문법 오류 교정본)
function changeMenu(element, menuName) {
    currentMenu = menuName;
    currentPage = 1; // 메뉴를 바꿀 때 무조건 1페이지로 초기화

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    const sw = document.getElementById('search_wrapper');
    const cc = document.getElementById('chart_container');
    
    if(cc) { 
        cc.innerHTML = ""; // 기존 뉴스 로딩 메시지나 내용을 즉시 삭제
        cc.style.overflowY = menuName.includes('뉴스') ? 'auto' : 'hidden'; 
    }
    
    if(menuName === '차트') { 
        if(sw) sw.style.display = 'flex'; 
        updateChart(currentSymbol); 
    }
    else if(menuName === '경제 뉴스') {
        if(sw) sw.style.display = 'none'; 
        fetchNews(1); 
    }
    else if(menuName === '크립토 뉴스') {
        if(sw) sw.style.display = 'none'; 
        renderCryptoPage(1);
    }
    else if(menuName === '실시간검색어') {
        if(sw) sw.style.display = 'none';
        // 뉴스 로딩 로직이 화면을 덮어쓰지 않도록 50ms 지연 후 실행
        setTimeout(() => {
            if(currentMenu === '실시간검색어') renderWordCloud();
        }, 50);
    } 
    else { 
        if(sw) sw.style.display = 'none';
        cc.innerHTML = `<div style="padding:100px; text-align:center;">[${menuName}] 준비 중</div>`; 
    }
}

// [수정] 크립토 뉴스 실행부
async function renderCryptoPage(page = 1) {
    currentPage = page;
    const container = document.getElementById('chart_container');
    if (!container || currentMenu !== '크립토 뉴스') return;
    container.innerHTML = '<div style="padding:20px; text-align:center;">크립토 뉴스를 불러오는 중...</div>';
    const news = await getTICryptoNews();
    renderNewsList(news, page, '크립토 뉴스');
}

// [추가] 경제 뉴스 실행부
async function fetchNews(page = 1) {
    currentPage = page;
    const cc = document.getElementById('chart_container');
    if (!cc || currentMenu !== '경제 뉴스') return;
    
    cc.innerHTML = '<div style="padding:20px; text-align:center;">경제 뉴스를 불러오는 중...</div>';
    
    const allNews = await getNewsData();
    renderNewsList(allNews, page, '경제 뉴스');
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

/* [신규] 1시간 주기(매시 10분) 갱신 체크 로직 */
function shouldRefreshCloud(lastTime) {
    if (!lastTime) return true;
    const now = new Date();
    const last = new Date(parseInt(lastTime));
    
    // 현재 시간 기준의 '최근 10분 분기점' 계산 (예: 20:10, 21:10 등)
    let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 10, 0);
    if (now.getMinutes() < 10) target.setHours(target.getHours() - 1);
    
    return last.getTime() < target.getTime();
}

async function getCloudData(type = 'stock') {
    const cacheKey = `mk_cloud_${type}_cache`;
    const timeKey  = `mk_cloud_${type}_last`;
    const cached   = localStorage.getItem(cacheKey);
    const last     = localStorage.getItem(timeKey);

    if (!shouldRefreshCloud(last) && cached) return JSON.parse(cached);

    try {
        let data = [];

        if (type === 'etf') {
            // ETF API 호출
            const response = await (await fetch('/api/etf')).json();
            // 네이버 API 특유의 경로(result -> etfItemList)를 찾아 들어감
            const list = response?.result?.etfItemList || response?.etfItemList || [];

            if (list.length === 0) throw new Error('ETF 데이터를 찾을 수 없습니다.');

            data = list
                .filter(item => item.itemname) // 이름이 있는 것만 필터링
                .sort((a, b) => (b.accTrvol || 0) - (a.accTrvol || 0))
                .slice(0, 30)
                .map((item, i) => {
                    // 한글, 영문, 숫자, 괄호 외의 깨진 특수문자는 모두 제거합니다.
                    let name = String(item.itemname).replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ()\[\]]/gi, '').trim();
                    if(!name) name = "종목명 오류"; 
                    return [name, 40 - i, String(item.itemcode || '')];
                });

        } else {
            // Stock API 호출 (서버에서 이미 EUC-KR 디코딩을 해서 보내줌)
            const htmlResponse = await fetch('/api/stock');
            const html = await htmlResponse.text();
            const doc  = new DOMParser().parseFromString(html, 'text/html');
            const els  = doc.querySelectorAll('a.tltle');

            data = Array.from(els).slice(0, 30).map((el, i) => {
                const name      = el.textContent.trim();
                const href      = el.getAttribute('href') || '';
                const codeMatch = href.match(/code=(\d+)/);
                const code      = codeMatch ? codeMatch[1] : '';
                return [name, 40 - i, code];
            }).filter(item => item[0] !== '');

            if (data.length === 0) throw new Error('인기종목 데이터 없음');
        }

        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(timeKey,  Date.now().toString());
        console.log(`[${type}] 클라우드 데이터 로드 성공: ${data.length}개`);
        return data;

    } catch (e) {
        console.error(`${type} 로드 실패:`, e);
        return cached ? JSON.parse(cached) : [];
    }
}

let currentCloudType = 'stock'; // [추가] 탭 전환 시 데이터 섞임 방지용

/* [수정] 클라우드 렌더링 (PC/모바일 레이아웃 최적화) */
async function renderWordCloud(type = 'stock') {
    currentCloudType = type; // 현재 요청 타입 저장
    const container = document.getElementById('chart_container');
    if (!container) return;

    const now = new Date();
    container.innerHTML = `
        <div class="cloud-header">
            <div class="cloud-info-top">
                <span class="cloud-title">📊 ${type === 'stock' ? '실시간 인기종목' : '국내 인기 ETF'} TOP 30<br></span>
                <span class="cloud-meta">🕒 ${now.getHours()}시 10분 기준 업데이트</span>
            </div>
            <div class="cloud-info-top">
                <div class="cloud-tabs">
                    <button class="cloud-tab-btn ${type === 'stock' ? 'active' : ''}" onclick="renderWordCloud('stock')">인기 종목</button>
                    <button class="cloud-tab-btn ${type === 'etf' ? 'active' : ''}" onclick="renderWordCloud('etf')">인기 ETF</button>
                </div>
                <span class="cloud-meta">출처: <a href="https://finance.naver.com/sise/" target="_blank" class="cloud-source-link">네이버 금융 ↗</a></span>
            </div>
        </div>
        <div id="cloud-canvas-wrapper"><canvas id="word-cloud-canvas"></canvas></div>
    `;

    const data = await getCloudData(type);
    
    // 데이터 수신 후 탭이 바뀌었다면 무시 (인기종목-ETF 섞임 방지)
    if (currentCloudType !== type) return;

    const canvas = document.getElementById('word-cloud-canvas');
    const wrapper = document.getElementById('cloud-canvas-wrapper');

    if (data.length > 0 && typeof WordCloud !== 'undefined') {
        // 캔버스 크기를 래퍼 크기에 강제로 맞춤 (지연 로딩 대비)
        const isMobile = window.innerWidth < 768;
        // 해상도 조절: wrapper 크기에 맞춤
        canvas.width = wrapper.offsetWidth;
        canvas.height = wrapper.offsetHeight;

/* [최종 보정] 밀도 및 간격 최적화 */
        WordCloud(canvas, {
            list: data,
            // [수정] gridSize를 낮춰 종목 간격을 촘촘하게 (레퍼런스 스타일)
            gridSize: isMobile ? 3 : 8, 
            weightFactor: (size) => {
                const base = canvas.width / (isMobile ? 350 : 850);
                return size * base * (isMobile ? 1.6 : 1.1); // 모바일에서 글씨를 조금 더 크게
            },
            fontFamily: 'Pretendard, sans-serif',
            color: () => document.body.classList.contains('dark-mode') ? 
                ['#8C9EFF', '#B2FF59', '#80D8FF'][Math.floor(Math.random()*3)] : 
                ['#1A237E', '#7d907e', '#C62828'][Math.floor(Math.random()*3)],
            rotateRatio: 0,
            backgroundColor: 'transparent',
            drawOutOfBound: false,
            // [추가] 배치 모양을 타원형으로 설정하여 더 균형 있게 배치
            shrinkToFit: true,     // ✅ 캔버스에 맞춰 크기 자동 조절
            shape: 'circle',       // 중앙 집중형 배치
            click: (item, dim, event) => showActionMenu(item, event.pageX, event.pageY)
        });
    }
}

/* [수정] 팝업 메뉴 명칭 및 네이버 파이낸셜 랜딩 */
function showActionMenu(item, x, y) {
    const [name, weight, code] = item;
    document.querySelector('.cloud-action-menu')?.remove();
    
    // 1. 모바일 접속 여부 확인
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // 2. 환경에 따른 베이스 URL 설정
    const searchBase = isMobile ? 'https://m.search.naver.com' : 'https://search.naver.com';
    // 네이버 주식 모바일 주소는 m.stock.naver.com 을 사용합니다.
    const stockBase  = isMobile ? 'https://m.stock.naver.com/domestic/stock' : 'https://finance.naver.com/item/main.naver';

    // 3. 종목 상세 페이지 파라미터 구성 (모바일은 경로 방식, PC는 쿼리 방식)
    const stockLink = isMobile ? `${stockBase}/${code}/total` : `${stockBase}?code=${code}`;
    const searchLink = `${searchBase}/search.naver?query=${encodeURIComponent(name)}`;

    const menu = document.createElement('div');
    menu.className = 'cloud-action-menu';

    // 화면 끝부분 클릭 시 팝업 위치 보정
    const posX = x + 160 > window.innerWidth ? x - 160 : x;
    const posY = y + 120 > window.innerHeight ? y - 120 : y;
    
    menu.style.left = `${posX}px`; 
    menu.style.top = `${posY}px`;

    menu.innerHTML = `
        <div class="cloud-action-item" onclick="window.open('${searchLink}', '_blank')">검색결과</div>
        <div class="cloud-action-item" onclick="window.open('${stockLink}', '_blank')">차트 이동</div>
    `;
    
    document.body.appendChild(menu);
    // 다른 영역 클릭 시 닫기
    setTimeout(() => {
        window.onclick = () => { menu.remove(); window.onclick = null; };
    }, 100);
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
        handleRefresh,
        renderWordCloud,
    });
    window.addEventListener('load', initApp);
}