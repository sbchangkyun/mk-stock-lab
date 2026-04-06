export async function GET() {
    try {
        const response = await fetch('https://finance.naver.com/api/sise/etfItemList.nhn');
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response("Error", { status: 500 });
    }
}