const DEVNET_RPC = 'http://devnet.rialo.io:4100';

export async function POST(request: Request) {
  const body = await request.text();

  const resp = await fetch(DEVNET_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data = await resp.text();

  return new Response(data, {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
