export const config = { runtime: 'edge' };

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol') || 'EUR/USD';
  const interval = url.searchParams.get('interval') || '5min';
  const apiKey = process.env.TWELVEDATA_KEY;

  try {
    // Busca candles do timeframe principal
    const r1 = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=50&apikey=${apiKey}`
    );
    const d1 = await r1.json();

    // Busca candles do H1 para tendência maior
    const r2 = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=24&apikey=${apiKey}`
    );
    const d2 = await r2.json();

    // Busca H4 para macro tendência
    const r3 = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=4h&outputsize=10&apikey=${apiKey}`
    );
    const d3 = await r3.json();

    // Busca preço atual
    const r4 = await fetch(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`
    );
    const d4 = await r4.json();

    return new Response(JSON.stringify({
      symbol,
      interval,
      price: d4.price,
      candles: d1.values || [],
      h1: d2.values || [],
      h4: d3.values || [],
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
}
