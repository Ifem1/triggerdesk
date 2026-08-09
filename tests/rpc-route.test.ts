import { POST } from '../app/api/rpc/route';

function rpcRequest(body: string, ip: string = crypto.randomUUID()): Request {
  return new Request('http://localhost/api/rpc', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': ip },
    body,
  });
}

describe('RPC proxy boundary', () => {
  afterEach(() => jest.restoreAllMocks());

  test('rejects malformed JSON', async () => {
    const response = await POST(rpcRequest('{'));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: -32700 } });
  });

  test('rejects batch and malformed JSON-RPC shapes', async () => {
    const batch = await POST(rpcRequest('[]'));
    expect(batch.status).toBe(400);
    const malformed = await POST(rpcRequest(JSON.stringify({ jsonrpc: '1.0', id: 1, method: 'getBalance' })));
    expect(malformed.status).toBe(400);
  });

  test('denies methods outside the allowlist without contacting upstream', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const response = await POST(rpcRequest(JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'unknownMethod' })));
    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('forwards an allowed request to the fixed upstream', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { value: 5 } }), { status: 200 }),
    );
    const response = await POST(rpcRequest(JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'getBalance', params: [{ address: 'abc' }],
    })));
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toBe('https://devnet.rialo.io:4101/');
    expect(fetchSpy.mock.calls[0][1]).toMatchObject({ method: 'POST', cache: 'no-store' });
  });

  test('sanitizes upstream network failures', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('secret upstream detail'));
    const response = await POST(rpcRequest(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'getBlockHeight' })));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain('secret upstream detail');
  });
});
