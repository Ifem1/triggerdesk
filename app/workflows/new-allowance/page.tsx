'use client';

const P = { cream: '#FAE8B4', sand: '#CBBD93', olive: '#80775C', bark: '#574A24' };

export default function NewAllowancePage() {
  return (
    <div style={{ color: P.bark }} className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Recurring Allowance unavailable</h1>
        <p style={{ color: P.olive, fontSize: 13, marginTop: 4 }}>
          Recurring payments are intentionally hidden from the active DevNet demo.
        </p>
      </div>
      <div style={{ background: P.cream + '44', border: `1px solid ${P.sand}66`, borderRadius: 12, padding: 16, fontSize: 13, color: P.olive }}>
        <p style={{ fontWeight: 600, marginBottom: 8, color: P.bark }}>Why this is disabled</p>
        <p>
          The V2 recurring contract has not yet produced three autonomous installment transfers on DevNet. TriggerDesk does not expose a state-only or simulated recurring template as a payment product.
        </p>
      </div>
      <a href="/dashboard" className="block w-full py-4 rounded-xl font-semibold text-sm uppercase tracking-wider text-center" style={{ background: P.bark, color: P.cream }}>
        Back to Dashboard
      </a>
    </div>
  );
}
