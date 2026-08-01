'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const P = {
  lightest: '#FEFCF3',
  cream: '#FAE8B4',
  sand: '#CBBD93',
  olive: '#80775C',
  bark: '#574A24',
};

/* ── sparkles ── */
const SPARKLE_DATA = [
  { top: '8%', left: '6%', size: 14, delay: '0s', dur: '3.2s' },
  { top: '14%', left: '88%', size: 10, delay: '0.8s', dur: '2.8s' },
  { top: '22%', left: '18%', size: 8, delay: '1.4s', dur: '3.6s' },
  { top: '35%', left: '92%', size: 12, delay: '0.3s', dur: '2.5s' },
  { top: '50%', left: '4%', size: 9, delay: '2.1s', dur: '3.1s' },
  { top: '60%', left: '80%', size: 11, delay: '0.6s', dur: '2.9s' },
  { top: '72%', left: '12%', size: 7, delay: '1.8s', dur: '3.4s' },
  { top: '80%', left: '70%', size: 13, delay: '0.9s', dur: '2.6s' },
  { top: '28%', left: '50%', size: 6, delay: '2.5s', dur: '3.8s' },
  { top: '45%', left: '38%', size: 10, delay: '1.2s', dur: '2.7s' },
  { top: '18%', left: '62%', size: 8, delay: '3.0s', dur: '3.0s' },
  { top: '88%', left: '44%', size: 9, delay: '1.6s', dur: '2.4s' },
];

function Sparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {SPARKLE_DATA.map((s, i) => (
        <span
          key={i}
          className="sparkle absolute select-none"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            color: i % 3 === 0 ? P.bark : i % 3 === 1 ? P.sand : P.olive,
            animationDelay: s.delay,
            animationDuration: s.dur,
            opacity: 0,
          }}
        >
          &#10022;
        </span>
      ))}
    </div>
  );
}

/* ── floating dots ── */
const DOT_DATA = Array.from({ length: 18 }, (_, i) => ({
  top: `${8 + Math.floor(((i * 37 + 11) % 85))}%`,
  left: `${5 + Math.floor(((i * 53 + 7) % 90))}%`,
  size: 3 + (i % 4),
  delay: `${(i * 0.4).toFixed(1)}s`,
  dur: `${4 + (i % 5)}s`,
}));

function FloatingDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {DOT_DATA.map((d, i) => (
        <div
          key={i}
          className="dot-float absolute rounded-full"
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            background: i % 2 === 0 ? P.sand : P.olive,
            opacity: 0.35,
            animationDelay: d.delay,
            animationDuration: d.dur,
          }}
        />
      ))}
    </div>
  );
}

/* ── SVG swirl ── */
function Swirl() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <svg
        className="swirl-drift"
        width="820"
        height="820"
        viewBox="0 0 820 820"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.13 }}
      >
        <path
          d="M410 410 C410 220 560 120 680 200 C800 280 820 460 720 580 C620 700 420 740 280 680 C140 620 60 460 100 320 C140 180 280 80 410 100 C540 120 660 220 700 360 C740 500 680 640 580 720 C480 800 340 820 240 780 C140 740 60 640 60 520 C60 400 120 280 210 210 C300 140 420 140 510 190 C600 240 660 340 660 440 C660 540 620 630 550 690 C480 750 390 770 310 750 C230 730 160 680 120 610 C80 540 70 450 90 370 C110 290 160 220 230 180 C300 140 390 130 470 150 C550 170 620 220 660 290 C700 360 710 450 690 530 C670 610 620 680 550 720 C480 760 400 770 330 750"
          stroke={P.bark}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M410 410 C340 360 290 280 310 200 C330 120 420 80 510 110 C600 140 650 230 640 320 C630 410 570 490 490 530 C410 570 310 560 250 500 C190 440 180 340 220 270 C260 200 350 170 430 190 C510 210 570 270 580 350 C590 430 550 510 490 560 C430 610 350 620 290 590 C230 560 200 490 210 420 C220 350 270 290 340 270 C410 250 490 280 530 340"
          stroke={P.olive}
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/* ── typing phrases ── */
const PHRASES = [
  'AFTER 5 minutes -> send 0.5 RLO to Alice',
  'EVERY 24 hours -> distribute treasury',
  'ON price_feed(ETH < 3000) -> reduce exposure',
  'AFTER invoice_due -> release escrow',
  'EVERY epoch -> compound yield',
];

function TypingPhrase() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, 450);
    }, 3200);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center overflow-hidden">
      <span
        className={`text-sm font-mono transition-all duration-400 ${visible ? 'phrase-in' : 'phrase-out'}`}
        style={{ color: P.olive }}
      >
        <span style={{ color: P.sand }}>venus! </span>
        {PHRASES[idx]}
      </span>
    </div>
  );
}

/* ── Hero ── */
function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: `linear-gradient(160deg, ${P.cream} 0%, #FEFCF3 55%, #F5EDD0 100%)` }}
    >
      <Swirl />
      <FloatingDots />
      <Sparkles />

      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-20">
        <Link
          href="/"
          className="font-bold tracking-widest text-sm uppercase"
          style={{ color: P.bark }}
        >
          TriggerDesk
        </Link>
        <div
          className="flex items-center gap-6 text-xs uppercase tracking-wider"
          style={{ color: P.olive }}
        >
          <Link href="/dashboard" className="hover:opacity-70 transition-opacity">
            Dashboard
          </Link>
          <Link href="/workflows/new" className="hover:opacity-70 transition-opacity">
            New Workflow
          </Link>
          <Link href="/history" className="hover:opacity-70 transition-opacity">
            History
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all warm-pulse"
            style={{ background: P.bark, color: P.cream }}
          >
            Launch App
          </Link>
        </div>
      </nav>

      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
        <div
          className="fadein-up-1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-widest border"
          style={{ borderColor: P.sand, background: 'rgba(250,232,180,0.4)', color: P.olive }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#1E8449' }} />
          Rialo DevNet - Live On-Chain
        </div>

        <h1
          className="fadein-up-2 text-5xl md:text-7xl font-bold leading-tight tracking-tight"
          style={{ color: P.bark }}
        >
          Automated workflows
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${P.bark}, ${P.olive}, ${P.sand}, ${P.bark})`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            that run on-chain.
          </span>
        </h1>

        <p
          className="fadein-up-3 text-lg md:text-xl max-w-2xl mx-auto"
          style={{ color: P.olive }}
        >
          Define a workflow once. Rialo's native subscription engine watches the clock, evaluates
          your trigger, and fires the transaction automatically. No keepers. No cron. No
          off-chain infrastructure.
        </p>

        <div
          className="fadein-up-4 inline-block border rounded-xl px-6 py-3"
          style={{ borderColor: P.sand, background: 'rgba(203,189,147,0.15)' }}
        >
          <TypingPhrase />
        </div>

        <div className="fadein-up-5 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all hover:opacity-90 shadow-lg"
            style={{ background: P.bark, color: P.cream }}
          >
            Open Dashboard
          </Link>
          <Link
            href="/workflows/new"
            className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border transition-all hover:opacity-80"
            style={{ borderColor: P.sand, color: P.bark, background: 'rgba(250,232,180,0.3)' }}
          >
            Create Workflow
          </Link>
        </div>

        <div className="fadein-up-5 flex items-center justify-center gap-10 pt-4">
          {[
            ['6', 'Template types'],
            ['100%', 'On-chain'],
            ['0', 'Off-chain deps'],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="text-3xl font-bold" style={{ color: P.bark }}>
                {n}
              </p>
              <p className="text-xs mt-0.5" style={{ color: P.olive }}>
                {l}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
        <span className="text-xs uppercase tracking-widest" style={{ color: P.sand }}>
          Scroll
        </span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={P.sand}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

/* ── How it works ── */
const STATES = [
  { s: 'SCHEDULE', desc: 'Create workflow on-chain with AFTER/EVERY', bg: '#EBF5FB', text: '#2E86C1', border: '#AED6F1' },
  { s: 'PENDING', desc: 'Subscription active on Rialo network', bg: '#FEF9E7', text: '#B7950B', border: '#F9E79F' },
  { s: 'TRIGGERED', desc: 'Native callback fires automatically', bg: '#FEF5E7', text: '#CA6F1E', border: '#FAD7A0' },
  { s: 'EXECUTED', desc: 'Transaction complete - on-chain receipt', bg: '#EAFAF1', text: '#1E8449', border: '#A9DFBF' },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setActive((a) => (a + 1) % STATES.length), 1900);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="py-32 px-6" style={{ background: P.lightest }}>
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: P.sand }}>
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: P.bark }}>
            Native triggers, not keepers
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: P.olive }}>
            Venus programs define workflows with AFTER, EVERY, and ON constructs. The Rialo
            network evaluates subscriptions and fires callbacks natively — no off-chain
            infrastructure required.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0">
          {STATES.map((s, i) => (
            <div key={s.s} className="flex items-center gap-2 md:gap-0">
              <div
                className="card-lift flex flex-col items-center gap-2 px-6 py-5 rounded-2xl border transition-all duration-500 relative"
                style={{
                  minWidth: 150,
                  background: active === i ? s.bg : '#FEFCF3',
                  borderColor: active === i ? s.border : P.sand,
                  opacity: active === i ? 1 : 0.5,
                  transform: active === i ? 'scale(1.05)' : 'scale(0.95)',
                }}
              >
                {active === i && (
                  <span
                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-ping"
                    style={{ background: s.border }}
                  />
                )}
                <span
                  className="text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded-lg border"
                  style={{
                    color: active === i ? s.text : P.olive,
                    borderColor: active === i ? s.border : P.sand,
                    background: active === i ? s.bg : 'transparent',
                  }}
                >
                  {s.s}
                </span>
                <p className="text-xs text-center" style={{ color: active === i ? P.bark : P.sand }}>
                  {s.desc}
                </p>
              </div>
              {i < STATES.length - 1 && (
                <div
                  className="mx-3 text-lg font-light transition-colors duration-500"
                  style={{ color: active > i ? P.bark : P.sand }}
                >
                  {'->'}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              n: '01',
              title: 'Write Venus',
              desc: 'Define your workflow in the Venus DSL with AFTER, EVERY, or ON triggers.',
              icon: '⚙',
            },
            {
              n: '02',
              title: 'Deploy to DevNet',
              desc: 'Compile to PolkaVM and deploy your program to Rialo DevNet.',
              icon: '\u{1F4E1}',
            },
            {
              n: '03',
              title: 'Create Workflow',
              desc: 'Submit a transaction to create a workflow PDA and register subscriptions.',
              icon: '\u{1F441}',
            },
            {
              n: '04',
              title: 'Auto-Execute',
              desc: 'Rialo fires the callback at the right time. On-chain receipt recorded.',
              icon: '⚡',
            },
          ].map((s, i) => (
            <div
              key={s.n}
              className={`card-lift rounded-2xl p-6 space-y-3 border reveal-${i + 1}`}
              style={{ background: P.cream + '55', borderColor: P.sand }}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{s.icon}</span>
                <span className="text-xs font-mono" style={{ color: P.sand }}>
                  {s.n}
                </span>
              </div>
              <h3 className="font-bold" style={{ color: P.bark }}>
                {s.title}
              </h3>
              <p className="text-sm" style={{ color: P.olive }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Templates ── */
const TEMPLATES = [
  {
    title: 'Scheduled Transfer',
    rule: 'AFTER 5min -> SEND 0.5 RLO to recipient',
    desc: 'Send RLO to any address at a future time. The AFTER callback fires automatically.',
    tag: 'TRANSFER',
    ready: true,
  },
  {
    title: 'Recurring Allowance',
    rule: 'EVERY 24h -> SEND allowance to recipient',
    desc: 'Distribute a fixed amount on a recurring schedule. No cron job needed.',
    tag: 'RECURRING',
    ready: false,
  },
  {
    title: 'Conditional Swap',
    rule: 'ON price_feed(ETH < 3000) -> SWAP 1 ETH to stablecoin',
    desc: 'Execute a token swap when a price condition is met. Fully on-chain trigger.',
    tag: 'SWAP',
    ready: false,
  },
  {
    title: 'Escrow Release',
    rule: 'ON delivery_confirmed -> RELEASE escrow funds',
    desc: 'Release escrowed funds when a condition is verified on-chain.',
    tag: 'ESCROW',
    ready: false,
  },
];

function Templates() {
  return (
    <section className="py-32 px-6" style={{ background: P.cream + '44' }}>
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: P.sand }}>
            Templates
          </p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: P.bark }}>
            Six templates. One engine.
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: P.olive }}>
            Every template compiles to a Venus program deployed on-chain. Different triggers,
            same native execution.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TEMPLATES.map((t) => (
            <div
              key={t.title}
              className="card-lift rounded-2xl overflow-hidden border"
              style={{
                borderColor: P.sand,
                background: '#FFFEF8',
                opacity: t.ready ? 1 : 0.6,
              }}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs px-2 py-0.5 rounded-lg uppercase tracking-widest font-mono border"
                    style={{ color: P.olive, borderColor: P.sand, background: P.cream + '44' }}
                  >
                    {t.tag}
                  </span>
                  {t.ready ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded-lg font-mono"
                      style={{ background: '#EAFAF1', color: '#1E8449', border: '1px solid #A9DFBF' }}
                    >
                      LIVE
                    </span>
                  ) : (
                    <span
                      className="text-xs px-2 py-0.5 rounded-lg font-mono"
                      style={{ background: '#f3f4f6', color: '#9ca3af', border: '1px solid #d1d5db' }}
                    >
                      COMING
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold" style={{ color: P.bark }}>
                  {t.title}
                </h3>
                <p className="text-sm" style={{ color: P.olive }}>
                  {t.desc}
                </p>
                <code
                  className="text-xs font-mono rounded-lg px-3 py-2 block"
                  style={{
                    background: P.cream + '44',
                    color: P.bark,
                    border: `1px solid ${P.sand}66`,
                  }}
                >
                  {t.rule}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Architecture banner ── */
function ArchBanner() {
  return (
    <section className="relative py-32 px-6 overflow-hidden" style={{ background: P.bark }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {SPARKLE_DATA.slice(0, 6).map((s, i) => (
          <span
            key={i}
            className="sparkle absolute select-none"
            style={{
              top: s.top,
              left: s.left,
              fontSize: s.size - 2,
              color: P.sand,
              animationDelay: s.delay,
              animationDuration: s.dur,
              opacity: 0,
            }}
          >
            &#10022;
          </span>
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        <span
          className="inline-block text-xs px-4 py-1.5 rounded-full uppercase tracking-widest border"
          style={{ borderColor: P.sand + '60', color: P.sand, background: 'rgba(203,189,147,0.1)' }}
        >
          Rialo-Native Architecture
        </span>

        <h2 className="text-3xl md:text-4xl font-bold" style={{ color: P.cream }}>
          Built on{' '}
          <span
            style={{
              background: `linear-gradient(90deg, ${P.cream}, ${P.sand})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Venus programs
          </span>{' '}
          and native subscriptions
        </h2>

        <p className="text-lg max-w-2xl mx-auto" style={{ color: P.sand }}>
          Real PolkaVM programs. Real on-chain state. Real triggered transactions.
          No simulation. No keepers. No off-chain workers.
        </p>

        <div className="grid md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
          {[
            {
              label: 'Venus DSL',
              items: ['AFTER / EVERY / ON constructs', 'Compiles to PolkaVM RISC-V', 'Auto-generated manifest'],
            },
            {
              label: 'Native Subscriptions',
              items: ['OneShot (AFTER) and Recurring (EVERY)', 'Network evaluates conditions', 'Fires callback automatically'],
            },
            {
              label: 'TypeScript CDK',
              items: ['Build transactions in the browser', 'Read on-chain state directly', 'PDA derivation and bincode encoding'],
            },
          ].map((col) => (
            <div
              key={col.label}
              className="rounded-xl p-5 space-y-3"
              style={{ border: `1px solid ${P.sand}40`, background: 'rgba(250,232,180,0.08)' }}
            >
              <p
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: P.cream }}
              >
                {col.label}
              </p>
              <ul className="space-y-1.5">
                {col.items.map((it) => (
                  <li key={it} className="text-sm flex gap-2" style={{ color: P.sand }}>
                    <span style={{ color: P.olive }}>&#9656;</span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Metrics ── */
function Metrics() {
  return (
    <section
      className="py-20 px-6 border-y"
      style={{ borderColor: P.sand + '55', background: P.cream + '33' }}
    >
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { value: '6', label: 'Templates', sub: 'Transfer, Allowance, Swap, ...' },
          { value: 'PolkaVM', label: 'Runtime', sub: 'RISC-V programs on Rialo' },
          { value: '0', label: 'Off-chain Deps', sub: 'No keepers or cron' },
          { value: 'Native', label: 'Triggers', sub: 'AFTER / EVERY / ON' },
        ].map((m) => (
          <div key={m.label} className="space-y-1">
            <p className="text-4xl font-bold" style={{ color: P.bark }}>
              {m.value}
            </p>
            <p className="text-sm font-semibold" style={{ color: P.bark }}>
              {m.label}
            </p>
            <p className="text-xs" style={{ color: P.olive }}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Final CTA ── */
function FinalCTA() {
  return (
    <section
      className="relative py-32 px-6 overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${P.cream} 0%, #FEFCF3 100%)` }}
    >
      <Sparkles />
      <div className="relative text-center max-w-2xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold" style={{ color: P.bark }}>
          Ready to create your first workflow?
        </h2>
        <p className="text-lg" style={{ color: P.olive }}>
          Connect a DevNet wallet, schedule a transfer, and watch the native trigger fire
          automatically on-chain.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all hover:opacity-90 shadow-md"
            style={{ background: P.bark, color: P.cream }}
          >
            Open Dashboard
          </Link>
          <Link
            href="/workflows/new"
            className="px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border transition-all hover:opacity-80"
            style={{ borderColor: P.sand, color: P.bark, background: 'rgba(203,189,147,0.2)' }}
          >
            Create Workflow
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function LandingFooter() {
  return (
    <footer className="border-t py-10 px-6" style={{ borderColor: P.sand + '55', background: P.bark }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-bold tracking-widest text-sm uppercase" style={{ color: P.cream }}>
            TriggerDesk
          </p>
          <p className="text-xs mt-1" style={{ color: P.olive }}>
            Real on-chain workflows on Rialo DevNet
          </p>
        </div>
        <nav className="flex gap-6 text-xs" style={{ color: P.sand }}>
          {[
            ['/dashboard', 'Dashboard'],
            ['/workflows/new', 'New Workflow'],
            ['/history', 'History'],
            ['/settings', 'Settings'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="hover:opacity-70 transition-opacity">
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs" style={{ color: P.olive }}>
          Rialo DevNet - 2026
        </p>
      </div>
    </footer>
  );
}

/* ── Root ── */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Metrics />
      <HowItWorks />
      <Templates />
      <ArchBanner />
      <FinalCTA />
      <LandingFooter />
    </>
  );
}
