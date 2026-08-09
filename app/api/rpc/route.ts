const DEFAULT_DEVNET_RPC = 'https://devnet.rialo.io:4101';
const MAX_BODY_BYTES = 128 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 120;

const ALLOWED_METHODS = new Set([
  'getAccountInfo',
  'getAccountsByOwner',
  'getBalance',
  'getBlockHeight',
  'getConfigHashPrefix',
  'getSignatureStatuses',
  'getTransaction',
  'requestAirdrop',
  'sendTransaction',
]);

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: unknown[];
};

type RateEntry = { count: number; resetAt: number };
const rateEntries = new Map<string, RateEntry>();

function jsonError(status: number, id: JsonRpcRequest['id'], code: number, message: string) {
  return Response.json(
    { jsonrpc: '2.0', id, error: { code, message } },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function getRpcUrl(): URL {
  const value = process.env.RIALO_RPC_URL ?? DEFAULT_DEVNET_RPC;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') {
    throw new Error('RIALO_RPC_URL must be an HTTPS origin without credentials or a path');
  }
  return url;
}

function requestIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const existing = rateEntries.get(key);
  if (!existing || existing.resetAt <= now) {
    rateEntries.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > RATE_LIMIT;
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<JsonRpcRequest>;
  return candidate.jsonrpc === '2.0'
    && (typeof candidate.id === 'string'
      || typeof candidate.id === 'number'
      || candidate.id === null)
    && typeof candidate.method === 'string'
    && (candidate.params === undefined || Array.isArray(candidate.params));
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_BODY_BYTES) {
    return jsonError(413, null, -32600, 'Request body too large');
  }

  if (isRateLimited(requestIp(request))) {
    return jsonError(429, null, -32005, 'Rate limit exceeded');
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return jsonError(400, null, -32700, 'Unable to read request body');
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return jsonError(413, null, -32600, 'Request body too large');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return jsonError(400, null, -32700, 'Malformed JSON');
  }
  if (!isJsonRpcRequest(payload)) {
    return jsonError(400, null, -32600, 'Invalid JSON-RPC request');
  }
  if (!ALLOWED_METHODS.has(payload.method)) {
    return jsonError(403, payload.id, -32601, 'RPC method is not allowed');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  let status = 502;
  try {
    const upstream = await fetch(getRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    });
    status = upstream.status;
    const data = await upstream.text();
    if (new TextEncoder().encode(data).byteLength > MAX_BODY_BYTES * 16) {
      return jsonError(502, payload.id, -32000, 'RPC response exceeded limit');
    }
    return new Response(data, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    status = timedOut ? 504 : 502;
    return jsonError(status, payload.id, -32000, timedOut ? 'RPC upstream timed out' : 'RPC upstream unavailable');
  } finally {
    clearTimeout(timeout);
    console.info(JSON.stringify({
      event: 'rpc_proxy_request',
      requestId,
      method: payload.method,
      status,
      latencyMs: Date.now() - startedAt,
    }));
  }
}
