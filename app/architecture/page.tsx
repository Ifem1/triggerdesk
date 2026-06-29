const P = { lightest:'#FEFCF3', cream:'#FAE8B4', sand:'#CBBD93', olive:'#80775C', bark:'#574A24' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 style={{ fontSize: 13, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${P.sand}55`, paddingBottom: 8 }}>{title}</h2>
      {children}
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', color: P.bark }} className="space-y-12">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: P.bark }}>Architecture</h1>
        <p style={{ color: P.olive, fontSize: 14, marginTop: 4 }}>Simulation Mode vs Rialo-native execution</p>
      </div>

      <div style={{ border: `1px solid #FAD7A0`, background: '#FEF9E7', borderRadius: 14, padding: 16, color: '#B7950B', fontSize: 14 }}>
        This is <strong>Simulation Mode only</strong>. No contracts are deployed. No real funds move.
        No RPC connections are made. Everything runs locally in your browser.
      </div>

      <Section title="What This Build Does">
        <ul style={{ color: P.bark, fontSize: 14 }} className="space-y-3">
          {[
            'Rule Builder — converts no-code user input into structured JSON rule objects',
            'Predicate Engine — evaluates rule conditions against mock feed data deterministically',
            'State Machine — transitions rules through DRAFT → WAITING → ELIGIBLE → TRIGGERED → EXECUTED',
            'Action Simulator — updates simulated portfolio, invoice, collateral and escrow state',
            'Replay Runner — plays deterministic JSON event sequences to trigger rules cleanly',
            'Execution History — stores and displays simulated receipts with full context',
            'Local Storage — persists all state in browser localStorage, no backend required',
          ].map((item) => (
            <li key={item} style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: P.sand, marginTop: 1, flexShrink: 0 }}>▸</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Data Flow">
        <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2.2, background: P.cream + '44', borderRadius: 14, padding: 20, border: `1px solid ${P.sand}` }}>
          {[
            ['User creates rule',                                     P.bark],
            ['→ rule saved as JSON in localStorage',                  P.olive],
            ['→ mock feed replay emits timestamped events',           '#2E86C1'],
            ['→ predicate engine checks rule against each event',     '#B7950B'],
            ['→ state machine transitions rule status',               '#CA6F1E'],
            ['→ action simulator updates simulated state',            '#6C3483'],
            ['→ execution receipt logged to history',                 '#1E8449'],
            ['→ UI reflects: WAITING → ELIGIBLE → TRIGGERED → EXECUTED', P.bark],
          ].map(([text, color]) => (
            <p key={text} style={{ color, margin: 0 }}>{text}</p>
          ))}
        </div>
      </Section>

      <Section title="Simulation Mode vs Rialo-Native Execution">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.sand}55` }}>
                {['Capability', 'This Build (Simulation)', 'Future Rialo-Native'].map((h, i) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px 12px 0', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: i === 0 ? P.olive : i === 1 ? '#B7950B' : '#2E86C1', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Predicate evaluation', 'Local TypeScript function',      'Onchain / keeper network'],
                ['Feed data',           'Deterministic JSON replay',       'Chainlink / Pyth live feeds'],
                ['Action execution',    'Updates local JS state',          'Signs + broadcasts tx'],
                ['Rule storage',        'localStorage',                    'TriggerDeskRegistry.sol'],
                ['Funds moved',         'None — simulated only',           'Real assets via smart contract'],
                ['Keeper / automation', 'setInterval loop',                'Gelato / Chainlink Automation'],
                ['Receipts',            'Simulated JSON objects',          'Onchain transaction receipts'],
                ['Private keys',        'None required',                   'Backend keeper vault'],
              ].map(([cap, sim, native]) => (
                <tr key={cap} style={{ borderBottom: `1px solid ${P.sand}33` }}>
                  <td style={{ padding: '12px 12px 12px 0', color: P.olive }}>{cap}</td>
                  <td style={{ padding: '12px 12px 12px 0', color: '#B7950B' }}>{sim}</td>
                  <td style={{ padding: '12px 0',           color: '#2E86C1' }}>{native}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Core Modules">
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { file: 'lib/simulation/predicate-engine.ts', desc: 'Pure function. evaluatePredicate(rule, feedState) → PredicateResult' },
            { file: 'lib/simulation/state-machine.ts',   desc: 'transition(rule, event) → TriggerRule. Deterministic FSM.' },
            { file: 'lib/simulation/action-simulator.ts',desc: 'simulateAction(rule, appState) → { newState, result }' },
            { file: 'lib/simulation/sim-store.tsx',       desc: 'React context wiring all modules with live replay state' },
            { file: 'lib/storage/local-store.ts',         desc: 'localStorage adapter for rules, receipts, and app state' },
            { file: 'data/replays/*.json',                desc: 'Deterministic timestamped event sequences for each demo' },
          ].map(({ file, desc }) => (
            <div key={file} style={{ border: `1px solid ${P.sand}`, borderRadius: 12, padding: 14, background: '#FFFEF8' }}>
              <p style={{ fontSize: 12, color: '#2E86C1', fontFamily: 'monospace', marginBottom: 6 }}>{file}</p>
              <p style={{ fontSize: 13, color: P.olive }}>{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Future Testnet Expansion (Separate Build)">
        <p style={{ color: P.olive, fontSize: 14, marginBottom: 16 }}>
          The testnet path is a separate build. It replaces simulation components with real onchain infrastructure:
        </p>
        <ul className="space-y-2" style={{ fontSize: 14 }}>
          {[
            'TriggerDeskRegistry.sol — stores rules onchain',
            'MockActionVault.sol — executes actions as real transactions',
            'MockPriceFeed.sol — Chainlink-compatible feed on Sepolia',
            'Backend keeper — monitors rules via private key vault',
            'Gelato / Chainlink Automation — decentralised keeper',
            'Real transaction receipts — txHash, block, gas used',
          ].map((item) => (
            <li key={item} style={{ display: 'flex', gap: 10, color: P.olive }}>
              <span style={{ color: P.sand }}>▸</span>{item}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
