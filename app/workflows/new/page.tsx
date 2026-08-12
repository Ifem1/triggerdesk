'use client';

const P = { cream: '#FAE8B4', sand: '#CBBD93', olive: '#80775C', bark: '#574A24' };

export default function NewWorkflowPage() {
  return (
    <div style={{ color: P.bark }} className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Scheduled Transfer unavailable</h1>
        <p style={{ color: P.olive, fontSize: 13, marginTop: 4 }}>
          This DevNet demo will not create a payment that the stable toolchain cannot prove will execute.
        </p>
      </div>
      <div
        style={{ background: P.cream + '44', border: `1px solid ${P.sand}66`, borderRadius: 12, padding: 16, fontSize: 13, color: P.olive }}
      >
        <p style={{ fontWeight: 600, marginBottom: 8, color: P.bark }}>Current Rialo/Venus constraint</p>
        <p>
          Rialo subscriptions accept longer active-commit ranges, but stable Venus 0.12.2 generates a fixed 100-commit timer lease. The live timing matrix did not establish a safe user-facing delay. Existing V2 escrow and surplus-hardening transactions are real DevNet evidence; this page does not simulate a payment.
        </p>
      </div>
      <a href="/dashboard" className="block w-full py-4 rounded-xl font-semibold text-sm uppercase tracking-wider text-center" style={{ background: P.bark, color: P.cream }}>
        Back to Dashboard
      </a>
    </div>
  );
}
