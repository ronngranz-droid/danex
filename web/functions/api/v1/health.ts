export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      app: 'DaneX Cloudflare Edge Gateway',
      version: '1.0.0',
      activeProvider: {
        id: 'cloudflare-edge-gemini',
        name: 'DaneX Global Edge Solver (Cloudflare Pages)',
      },
      edge: true,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
