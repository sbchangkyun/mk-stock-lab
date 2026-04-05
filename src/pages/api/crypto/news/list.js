// src/pages/api/crypto/news/list.js - 진단용 버전

export async function GET() {
    const TI_API_KEY = '5a12d5e7de7949b0841c584499f69f75';

    try {
        const response = await fetch('https://api.tokeninsight.com/api/v1/news/list', {
            headers: {
                'TI_API_KEY': TI_API_KEY
            }
        });

        // ✅ 응답 본문을 텍스트로 그대로 읽어서 콘솔에 출력
        const rawText = await response.text();
        console.log('=== TokenInsight 응답 상태 ===', response.status);
        console.log('=== TokenInsight 응답 내용 ===', rawText);

        return new Response(rawText, {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.log('=== fetch 자체 오류 ===', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}