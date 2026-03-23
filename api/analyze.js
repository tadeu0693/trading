export const config = { runtime: 'edge' };

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({
        error: { message: 'ANTHROPIC_API_KEY não configurada no Vercel!' }
      }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 1500,
        system: `Você é um sistema de análise técnica profissional para Forex.
Analisa dados OHLCV reais e fornece sinais precisos baseados em price action e estrutura de mercado.
Seja extremamente criterioso. NEUTRO é sempre preferível a um sinal errado.
SEMPRE responda em português brasileiro, mesmo que a pergunta seja em outro idioma.
SEMPRE responda com o formato solicitado, nunca deixe a resposta em branco.`,
        messages: body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: { message: `Anthropic API erro ${response.status}: ${data.error?.message || JSON.stringify(data)}` }
      }), { status: response.status, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: err.message } }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
}
