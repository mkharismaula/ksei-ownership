/**
 * Cloudflare Pages Function: IDX API Proxy
 * Handles /api/idx/* requests in production by proxying to idx.co.id
 * 
 * Cloudflare Workers run on Cloudflare's edge network and use their own
 * fetch implementation, which may bypass Cloudflare protection on IDX
 * since it's Cloudflare-to-Cloudflare communication.
 */
export async function onRequest(context) {
    const url = new URL(context.request.url);

    // Extract the path after /api/idx
    const idxPath = url.pathname.replace(/^\/api\/idx/, '');
    const targetUrl = `https://www.idx.co.id${idxPath}${url.search}`;

    // Handle CORS preflight
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-GB,en;q=0.9,en-US;q=0.8',
                'Referer': 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
            },
        });

        const body = await response.text();

        return new Response(body, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
