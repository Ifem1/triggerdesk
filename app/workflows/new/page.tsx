'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRialo } from '@/lib/rialo/provider';
import { createScheduledTransfer } from '@/lib/rialo/scheduled-transfer';

const P = { lightest: '#FEFCF3', cream: '#FAE8B4', sand: '#CBBD93', olive: '#80775C', bark: '#574A24' };

export default function NewWorkflowPage() {
  const router = useRouter();
  const { client, keypair, wallet } = useRialo();

  const [recipient, setRecipient] = useState('');
  const [amountRlo, setAmountRlo] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keypair) {
      setError('Connect a wallet first.');
      return;
    }

    const amount = parseFloat(amountRlo);
    const delay = parseInt(delayMinutes, 10);

    if (!recipient || recipient.length < 32) {
      setError('Enter a valid Rialo address.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (isNaN(delay) || delay < 1) {
      setError('Enter at least 1 minute delay.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result = await createScheduledTransfer(client, keypair, {
        recipientAddress: recipient,
        amountRlo: amount,
        delaySeconds: delay * 60,
      });
      router.push(`/workflows/${result.workflowPda}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div style={{ color: P.bark }} className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Create Scheduled Transfer</h1>
        <p style={{ color: P.olive, fontSize: 13, marginTop: 4 }}>
          Send RLO to a recipient at a future time. The transfer is scheduled on-chain using a
          Venus AFTER callback — no keeper or cron job required.
        </p>
      </div>

      {!wallet.publicKey && (
        <div
          style={{
            background: '#FEF9E7',
            border: '1px solid #F9E79F',
            borderRadius: 12,
            padding: 16,
            fontSize: 14,
            color: '#B7950B',
          }}
        >
          Connect a wallet to create workflows.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="recipient"
            style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Recipient Address
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. BJEbqxj2r8LyNHAwdkGEN9jLA4E9NUFu25x9uju9oZ8g"
            className="w-full mt-2 px-4 py-3 rounded-xl text-sm font-mono"
            style={{
              background: P.lightest,
              border: `1px solid ${P.sand}`,
              color: P.bark,
              outline: 'none',
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="amount"
              style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Amount (RLO)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amountRlo}
              onChange={(e) => setAmountRlo(e.target.value)}
              placeholder="0.5"
              className="w-full mt-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: P.lightest,
                border: `1px solid ${P.sand}`,
                color: P.bark,
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label
              htmlFor="delay"
              style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Delay (minutes)
            </label>
            <input
              id="delay"
              type="number"
              min="1"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(e.target.value)}
              placeholder="5"
              className="w-full mt-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: P.lightest,
                border: `1px solid ${P.sand}`,
                color: P.bark,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              background: '#FDEDEC',
              border: '1px solid #F5B7B1',
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              color: '#C0392B',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: P.cream + '44',
            border: `1px solid ${P.sand}66`,
            borderRadius: 12,
            padding: 16,
            fontSize: 13,
            color: P.olive,
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: 8, color: P.bark }}>How it works</p>
          <ol className="space-y-1" style={{ paddingLeft: 16, listStyleType: 'decimal' }}>
            <li>Your transaction creates a workflow PDA and an AFTER subscription on DevNet</li>
            <li>The Rialo network fires the callback at the scheduled time — no keeper needed</li>
            <li>The workflow status changes from Pending to Claimable automatically</li>
          </ol>
        </div>

        <button
          type="submit"
          disabled={submitting || !wallet.publicKey}
          className="w-full py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: P.bark, color: P.cream }}
        >
          {submitting ? 'Submitting to DevNet...' : 'Create Scheduled Transfer'}
        </button>
      </form>
    </div>
  );
}
