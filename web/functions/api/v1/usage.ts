export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      totalTokens: 14200,
      budgetTokens: 1000000,
      remainingTokens: 985800,
      warning80Exceeded: false,
      budgetExhausted: false,
      activeModel: 'DaneX Cloudflare Edge AI Engine',
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
