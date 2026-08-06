'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { RialoClient } from '@rialo/ts-cdk';
import { KELVIN_PER_RLO } from '@rialo/ts-cdk';
import { getRialoClient } from './client';
import {
  generateEphemeralKeypair,
  loadKeypairFromSession,
  saveKeypairToSession,
  clearSessionKeypair,
} from './keypair';
import type { ConnectionStatus, WalletState, ScheduledTransferState } from './types';
import type { Keypair } from '@rialo/ts-cdk';

interface RialoContextValue {
  client: RialoClient;
  keypair: Keypair | null;
  connectionStatus: ConnectionStatus;
  wallet: WalletState;
  blockHeight: bigint | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  requestAirdrop: () => Promise<void>;
  airdropStatus: 'idle' | 'pending' | 'success' | 'error';
  airdropError: string | null;
}

const RialoContext = createContext<RialoContextValue | null>(null);

export function RialoProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => getRialoClient());
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: null,
    balanceKelvin: null,
    isDevnet: true,
  });
  const [blockHeight, setBlockHeight] = useState<bigint | null>(null);
  const [airdropStatus, setAirdropStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [airdropError, setAirdropError] = useState<string | null>(null);

  useEffect(() => {
    const restored = loadKeypairFromSession();
    if (restored) {
      setKeypair(restored);
      setWallet((w) => ({ ...w, publicKey: restored.publicKey.toString() }));
    }
  }, []);

  useEffect(() => {
    setConnectionStatus('connecting');
    client
      .getBlockHeight()
      .then((h) => {
        setBlockHeight(h);
        setConnectionStatus('connected');
      })
      .catch(() => setConnectionStatus('error'));

    const interval = setInterval(async () => {
      try {
        const h = await client.getBlockHeight();
        setBlockHeight(h);
        setConnectionStatus('connected');
      } catch {
        setConnectionStatus('error');
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [client]);

  const refreshBalance = useCallback(async () => {
    if (!keypair) return;
    try {
      const balance = await client.getBalance(keypair.publicKey);
      setWallet((w) => ({ ...w, balanceKelvin: balance }));
    } catch {
      // balance fetch failed silently
    }
  }, [client, keypair]);

  useEffect(() => {
    if (keypair) refreshBalance();
  }, [keypair, refreshBalance]);

  const connectWallet = useCallback(() => {
    const kp = generateEphemeralKeypair();
    saveKeypairToSession(kp);
    setKeypair(kp);
    setWallet({
      publicKey: kp.publicKey.toString(),
      balanceKelvin: null,
      isDevnet: true,
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    if (keypair) keypair.dispose();
    clearSessionKeypair();
    setKeypair(null);
    setWallet({ publicKey: null, balanceKelvin: null, isDevnet: true });
  }, [keypair]);

  const requestAirdrop = useCallback(async () => {
    if (!keypair) return;
    setAirdropStatus('pending');
    setAirdropError(null);
    try {
      await client.requestAirdropAndConfirm(
        keypair.publicKey,
        BigInt(KELVIN_PER_RLO),
      );
      await refreshBalance();
      setAirdropStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Airdrop failed';
      setAirdropError(
        msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('limit')
          ? 'DevNet airdrop is rate-limited — try again in a moment.'
          : `Airdrop failed: ${msg}`,
      );
      setAirdropStatus('error');
    }
  }, [client, keypair, refreshBalance]);

  return (
    <RialoContext.Provider
      value={{
        client,
        keypair,
        connectionStatus,
        wallet,
        blockHeight,
        connectWallet,
        disconnectWallet,
        refreshBalance,
        requestAirdrop,
        airdropStatus,
        airdropError,
      }}
    >
      {children}
    </RialoContext.Provider>
  );
}

export function useRialo(): RialoContextValue {
  const ctx = useContext(RialoContext);
  if (!ctx) throw new Error('useRialo must be used within RialoProvider');
  return ctx;
}
