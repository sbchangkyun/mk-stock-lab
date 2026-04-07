# src/scripts/scraper.py
import os
import time
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from supabase import create_client

# load_dotenv()
# supabase = create_client(os.environ.get("PUBLIC_SUPABASE_URL"), os.environ.get("PUBLIC_SUPABASE_ANON_KEY"))

# GitHub Actions의 env 환경변수를 우선적으로 가져옵니다.
url = os.environ.get("PUBLIC_SUPABASE_URL")
key = os.environ.get("PUBLIC_SUPABASE_ANON_KEY")

# 만약 환경변수가 없다면(로컬 실행 시) .env 파일을 읽어옵니다.
if not url or not key:
    from dotenv import load_dotenv
    load_dotenv()
    url = os.environ.get("PUBLIC_SUPABASE_URL")
    key = os.environ.get("PUBLIC_SUPABASE_ANON_KEY")

if not url:
    raise ValueError("PUBLIC_SUPABASE_URL이 설정되지 않았습니다.")

supabase = create_client(url, key)

def scrape_seibro():
    options = Options()
    options.add_argument('--headless') # 디버깅 완료 후 주석 해제하세요
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage') # 리눅스 환경 안정성 위해 추가 추천
    
    #options.add_argument('--window-size=1920,1080')
    #options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 30)

    try:
        # 1. 접속 및 초기 대기
        target_url = "https://seibro.or.kr/websquare/control.jsp?w2xPath=/IPORTAL/user/ovsSec/BIP_CNTS10013V.xml&menuNo=921"
        driver.get(target_url)
        time.sleep(8)

        # 2. 🌟 팝업 강제 제거 (더 강력한 버전)
        # 화면의 중앙에 떠 있는 모든 부유 레이어를 투명하게 만들거나 삭제합니다.
        driver.execute_script("""
            const popups = document.querySelectorAll('div[id*="window"], div[id*="pop"], .w2window, .w2modal');
            popups.forEach(p => p.style.display = 'none');
            const overlays = document.querySelectorAll('.w2modal_overlay');
            overlays.forEach(o => o.style.display = 'none');
        """)
        print("팝업 및 레이어를 비활성화했습니다.")

        # 3. 데이터 조회를 위한 클릭 액션 (JS 사용으로 팝업 간섭 무시)
        holding_label = wait.until(EC.presence_of_element_located((By.XPATH, "//label[contains(text(), '보관금액')]")))
        driver.execute_script("arguments[0].click();", holding_label)
        
        usa_label = wait.until(EC.presence_of_element_located((By.XPATH, "//label[contains(text(), '미국')]")))
        driver.execute_script("arguments[0].click();", usa_label)
        
        # 제공해주신 'image2' ID를 사용하여 조회 버튼 클릭
        search_btn = wait.until(EC.presence_of_element_located((By.ID, "image2")))
        driver.execute_script("arguments[0].click();", search_btn)
        print("조회 버튼 클릭 성공 - 데이터 로딩 대기")

        # 4. 🌟 [수정 포인트] 제공해주신 테이블 ID 'grid1_body_tbody' 대기
        # 테이블의 첫 번째 행이 나타날 때까지 기다립니다.
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "#grid1_body_tbody tr")))
        time.sleep(3) # 데이터가 완전히 뿌려질 시간을 줍니다.

        # 5. 데이터 추출 (행 분석)
        rows = driver.find_elements(By.CSS_SELECTOR, "#grid1_body_tbody tr")
        data_to_insert = []
        today = time.strftime('%Y-%m-%d')

        for row in rows:
            cols = row.find_elements(By.TAG_NAME, "td")
            if len(cols) >= 5:
                rank = cols[0].text.strip()      # 순위
                ticker = cols[2].text.strip()    # 종목코드 (ISIN)
                name = cols[3].text.strip()      # 종목명
                # 보관금액 (쉼표 제거)
                val_raw = cols[4].text.replace(',', '').split('.')[0]
                
                if ticker and val_raw.isdigit():
                    data_to_insert.append({
                        "recorded_at": today,
                        "ticker": ticker,
                        "stock_name": name,
                        "holding_value": int(val_raw),
                        "rank": int(rank) if rank.isdigit() else 999
                    })

        # 6. Supabase 저장
        if data_to_insert:
            # 50개 종목을 한 번에 업데이트
            for item in data_to_insert:
                supabase.table("seibro_holdings").upsert(item).execute()
            print(f"✅ {today} 서학개미 TOP {len(data_to_insert)} 수집 완료!")
        else:
            print("❌ 테이블 행은 찾았으나 데이터를 파싱하지 못했습니다.")

    except Exception as e:
        print(f"🚨 오류 발생: {e}")
    finally:
        time.sleep(5)
        driver.quit()

if __name__ == "__main__":
    scrape_seibro()