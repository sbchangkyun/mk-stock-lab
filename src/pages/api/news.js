export async function GET({ url }) {
    const page = url.searchParams.get('page') || 1;
    const API_KEY = import.meta.env.PUBLIC_GNEWS_API_KEY;
    const apiUrl = `https://gnews.io/api/v4/top-headlines?category=business&lang=ko&country=kr&max=10&page=${page}&apikey=${API_KEY}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}