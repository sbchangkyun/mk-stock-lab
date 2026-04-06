export async function GET() {
    try {
        const response = await fetch('https://finance.naver.com/sise/lastsearch2.naver');
        const buffer = await response.arrayBuffer();
        const html = new TextDecoder('euc-kr').decode(buffer); // 서버에서 디코딩
        return new Response(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=euc-kr' }
        });
    } catch (error) {
        return new Response("Error", { status: 500 });
    }
}