import { ACTIVE_NETWORK } from '@/lib/rialo/network';

export const dynamic = 'force-dynamic';

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(process.env.RIALO_RPC_URL ?? ACTIVE_NETWORK.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBlockHeight', params: [] }),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('upstream status');
    const payload: unknown = await response.json();
    const healthy = !!payload && typeof payload === 'object' && 'result' in payload;
    return Response.json({
      status: healthy ? 'ok' : 'degraded',
      network: ACTIVE_NETWORK.chainId,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
      programs: {
        scheduledTransfer: ACTIVE_NETWORK.scheduledTransfer.programId,
        recurringAllowance: ACTIVE_NETWORK.recurringAllowance.programId,
      },
    }, { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ status: 'degraded', network: ACTIVE_NETWORK.chainId }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  } finally {
    clearTimeout(timeout);
  }
}
