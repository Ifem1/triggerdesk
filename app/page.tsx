'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/* ── palette shortcuts ── */
const P = {
  lightest: '#FEFCF3',
  cream:    '#FAE8B4',
  sand:     '#CBBD93',
  olive:    '#80775C',
  bark:     '#574A24',
};

/* ═══════════════════════════════════════════
   SPARKLES
═══════════════════════════════════════════ */
const SPARKLE_DATA = [
  { top:'8%',  left:'6%',  size:14, delay:'0s',   dur:'3.2s' },
  { top:'14%', left:'88%', size:10, delay:'0.8s',  dur:'2.8s' },
  { top:'22%', left:'18%', size:8,  delay:'1.4s',  dur:'3.6s' },
  { top:'35%', left:'92%', size:12, delay:'0.3s',  dur:'2.5s' },
  { top:'50%', left:'4%',  size:9,  delay:'2.1s',  dur:'3.1s' },
  { top:'60%', left:'80%', size:11, delay:'0.6s',  dur:'2.9s' },
  { top:'72%', left:'12%', size:7,  delay:'1.8s',  dur:'3.4s' },
  { top:'80%', left:'70%', size:13, delay:'0.9s',  dur:'2.6s' },
  { top:'28%', left:'50%', size:6,  delay:'2.5s',  dur:'3.8s' },
  { top:'45%', left:'38%', size:10, delay:'1.2s',  dur:'2.7s' },
  { top:'18%', left:'62%', size:8,  delay:'3.0s',  dur:'3.0s' },
  { top:'88%', left:'44%', size:9,  delay:'1.6s',  dur:'2.4s' },
];

function Sparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {SPARKLE_DATA.map((s, i) => (
        <span
          key={i}
          className="sparkle absolute select-none"
          style={{
            top: s.top, left: s.left,
            fontSize: s.size,
            color: i % 3 === 0 ? P.bark : i % 3 === 1 ? P.sand : P.olive,
            animationDelay: s.delay,
            animationDuration: s.dur,
            opacity: 0,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   FLOATING DOTS
═══════════════════════════════════════════ */
const DOT_DATA = Array.from({ length: 18 }, (_, i) => ({
  top:  `${8 + Math.floor((i * 37 + 11) % 85)}%`,
  left: `${5 + Math.floor((i * 53 + 7)  % 90)}%`,
  size: 3 + (i % 4),
  delay: `${(i * 0.4).toFixed(1)}s`,
  dur:   `${4 + (i % 5)}s`,
}));

function FloatingDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {DOT_DATA.map((d, i) => (
        <div
          key={i}
          className="dot-float absolute rounded-full"
          style={{
            top: d.top, left: d.left,
            width: d.size, height: d.size,
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

/* ═══════════════════════════════════════════
   SVG SWIRL
═══════════════════════════════════════════ */
function Swirl() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <svg
        className="swirl-drift"
        width="820" height="820" viewBox="0 0 820 820"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.13 }}
      >
        <path
          d="M410 410
             C410 220 560 120 680 200
             C800 280 820 460 720 580
             C620 700 420 740 280 680
             C140 620 60 460 100 320
             C140 180 280 80 410 100
             C540 120 660 220 700 360
             C740 500 680 640 580 720
             C480 800 340 820 240 780
             C140 740 60 640 60 520
             C60 400 120 280 210 210
             C300 140 420 140 510 190
             C600 240 660 340 660 440
             C660 540 620 630 550 690
             C480 750 390 770 310 750
             C230 730 160 680 120 610
             C80 540 70 450 90 370
             C110 290 160 220 230 180
             C300 140 390 130 470 150
             C550 170 620 220 660 290
             C700 360 710 450 690 530
             C670 610 620 680 550 720
             C480 760 400 770 330 750"
          stroke={P.bark}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M410 410
             C340 360 290 280 310 200
             C330 120 420 80 510 110
             C600 140 650 230 640 320
             C630 410 570 490 490 530
             C410 570 310 560 250 500
             C190 440 180 340 220 270
             C260 200 350 170 430 190
             C510 210 570 270 580 350
             C590 430 550 510 490 560
             C430 610 350 620 290 590
             C230 560 200 490 210 420
             C220 350 270 290 340 270
             C410 250 490 280 530 340"
          stroke={P.olive}
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO — TYPING PHRASES
═══════════════════════════════════════════ */
const PHRASES = [
  'If ETH drops below $3,000 → reduce exposure',
  'If invoice due date arrives → mark payable',
  'If collateral ratio < 130% → trigger warning',
  'If delivery is confirmed → unlock escrow',
  'If BTC rises above $80,000 → emit alert',
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
        <span style={{ color: P.sand }}>→ </span>
        {PHRASES[idx]}
      </span>
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: `linear-gradient(160deg, ${P.cream} 0%, #FEFCF3 55%, #F5EDD0 100%)` }}
    >
      <Swirl />
      <FloatingDots />
      <Sparkles />

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-20">
        <Link href="/" className="font-bold tracking-widest text-sm uppercase" style={{ color: P.bark }}>
          TriggerDesk
        </Link>
        <div className="flex items-center gap-6 text-xs uppercase tracking-wider" style={{ color: P.olive }}>
          <Link href="/dashboard" className="hover:opacity-70 transition-opacity">Dashboard</Link>
          <Link href="/replay"    className="hover:opacity-70 transition-opacity">Replay</Link>
          <Link href="/architecture" className="hover:opacity-70 transition-opacity">Architecture</Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all warm-pulse"
            style={{ background: P.bark, color: P.cream }}
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">

        {/* Pill */}
        <div
          className="fadein-up-1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-widest border"
          style={{ borderColor: P.sand, background: 'rgba(250,232,180,0.4)', color: P.olive }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: P.bark }} />
          Rialo Execution Engine · Simulation Mode
        </div>

        {/* Headline */}
        <h1 className="fadein-up-2 text-5xl md:text-7xl font-bold leading-tight tracking-tight" style={{ color: P.bark }}>
          Conditional rules
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
            that run themselves.
          </span>
        </h1>

        {/* Sub */}
        <p className="fadein-up-3 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: P.olive }}>
          Define a condition once. TriggerDesk watches the feed, evaluates the rule,
          and fires the action the moment it becomes true. No manual checking required.
        </p>

        {/* Cycling phrase */}
        <div
          className="fadein-up-4 inline-block border rounded-xl px-6 py-3"
          style={{ borderColor: P.sand, background: 'rgba(203,189,147,0.15)' }}
        >
          <TypingPhrase />
        </div>

        {/* CTAs */}
        <div className="fadein-up-5 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all hover:opacity-90 shadow-lg"
            style={{ background: P.bark, color: P.cream }}
          >
            Open Dashboard →
          </Link>
          <Link
            href="/replay"
            className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border transition-all hover:opacity-80"
            style={{ borderColor: P.sand, color: P.bark, background: 'rgba(250,232,180,0.3)' }}
          >
            Watch a Replay
          </Link>
        </div>

        {/* Mini stats */}
        <div className="fadein-up-5 flex items-center justify-center gap-10 pt-4">
          {[['4', 'Rule types'], ['5', 'Rule states'], ['0', 'Real funds needed']].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="text-3xl font-bold" style={{ color: P.bark }}>{n}</p>
              <p className="text-xs mt-0.5" style={{ color: P.olive }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
        <span className="text-xs uppercase tracking-widest" style={{ color: P.sand }}>Scroll</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={P.sand}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════ */
const STATES = [
  { s: 'WAITING',   desc: 'Rule is active, watching the feed',        bg: '#EBF5FB', text: '#2E86C1', border: '#AED6F1' },
  { s: 'ELIGIBLE',  desc: 'Condition met — ready to fire',            bg: '#FEF9E7', text: '#B7950B', border: '#F9E79F' },
  { s: 'TRIGGERED', desc: 'Engine accepted — executing action',       bg: '#FEF5E7', text: '#CA6F1E', border: '#FAD7A0' },
  { s: 'EXECUTED',  desc: 'Complete — receipt logged',                bg: '#EAFAF1', text: '#1E8449', border: '#A9DFBF' },
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
          <p className="text-xs uppercase tracking-widest" style={{ color: P.sand }}>How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: P.bark }}>Rules run themselves</h2>
          <p className="max-w-xl mx-auto" style={{ color: P.olive }}>
            Set the condition once. The engine watches every feed event, evaluates your rule,
            and transitions it through a clean state machine to execution.
          </p>
        </div>

        {/* Animated state machine */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0">
          {STATES.map((s, i) => (
            <div key={s.s} className="flex items-center gap-2 md:gap-0">
              <div
                className="card-lift flex flex-col items-center gap-2 px-6 py-5 rounded-2xl border transition-all duration-500 relative"
                style={{
                  minWidth: 150,
                  background:   active === i ? s.bg     : '#FEFCF3',
                  borderColor:  active === i ? s.border : P.sand,
                  opacity:      active === i ? 1 : 0.5,
                  transform:    active === i ? 'scale(1.05)' : 'scale(0.95)',
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
                  style={{ color: active === i ? s.text : P.olive, borderColor: active === i ? s.border : P.sand, background: active === i ? s.bg : 'transparent' }}
                >
                  {s.s}
                </span>
                <p className="text-xs text-center" style={{ color: active === i ? P.bark : P.sand }}>
                  {s.desc}
                </p>
              </div>
              {i < STATES.length - 1 && (
                <div className="mx-3 text-lg font-light transition-colors duration-500" style={{ color: active > i ? P.bark : P.sand }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { n: '01', title: 'Create Rule',    desc: 'Pick condition, threshold and action. No code needed.',   icon: '⚙️' },
            { n: '02', title: 'Load Replay',    desc: 'Choose a demo feed or step through events manually.',     icon: '📡' },
            { n: '03', title: 'Engine Watches', desc: 'Every feed event is evaluated against all active rules.', icon: '👁' },
            { n: '04', title: 'Action Fires',   desc: 'Condition met → action executes → receipt recorded.',    icon: '⚡' },
          ].map((s, i) => (
            <div
              key={s.n}
              className={`card-lift rounded-2xl p-6 space-y-3 border reveal-${i + 1}`}
              style={{ background: P.cream + '55', borderColor: P.sand }}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{s.icon}</span>
                <span className="text-xs font-mono" style={{ color: P.sand }}>{s.n}</span>
              </div>
              <h3 className="font-bold" style={{ color: P.bark }}>{s.title}</h3>
              <p className="text-sm" style={{ color: P.olive }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   USE CASES — Unsplash cards
═══════════════════════════════════════════ */
const USE_CASES = [
  {
    title: 'Price Protection',
    rule:  'IF ETH/USD < 3000 → Reduce Exposure 20%',
    desc:  'Protect your portfolio automatically when asset prices hit critical levels.',
    photo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    tag:   'PRICE',
  },
  {
    title: 'Invoice Due Date',
    rule:  'IF Due Date Reached → Mark Payable',
    desc:  'Automate invoice workflows — never manually check payment deadlines again.',
    photo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    tag:   'INVOICE',
  },
  {
    title: 'Collateral Warning',
    rule:  'IF Ratio < 130% → Trigger Warning',
    desc:  'Monitor collateral health in real time. Catch risk before it becomes a crisis.',
    photo: 'https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=800&q=80',
    tag:   'COLLATERAL',
  },
  {
    title: 'Escrow Release',
    rule:  'IF Delivery = Confirmed → Unlock Escrow',
    desc:  'Release funds the moment delivery conditions are verified. No middleman.',
    photo: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
    tag:   'ESCROW',
  },
];

function UseCases() {
  return (
    <section className="py-32 px-6" style={{ background: P.cream + '44' }}>
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: P.sand }}>Use Cases</p>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: P.bark }}>Four demos. One engine.</h2>
          <p className="max-w-xl mx-auto" style={{ color: P.olive }}>
            Every scenario runs on the same predicate engine and state machine.
            Different inputs — same reliability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {USE_CASES.map((uc) => (
            <div key={uc.title} className="card-lift relative rounded-2xl overflow-hidden border group cursor-default" style={{ minHeight: 300, borderColor: P.sand }}>
              <img
                src={uc.photo}
                alt={uc.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(87,74,36,0.92) 0%, rgba(87,74,36,0.3) 60%, transparent 100%)' }} />

              <div className="relative z-10 flex flex-col justify-end h-full p-6 space-y-3" style={{ minHeight: 300 }}>
                <span
                  className="text-xs px-2 py-0.5 rounded-lg w-fit uppercase tracking-widest font-mono border"
                  style={{ color: P.cream, borderColor: P.sand + '80', background: 'rgba(87,74,36,0.5)' }}
                >
                  {uc.tag}
                </span>
                <h3 className="text-xl font-bold" style={{ color: P.cream }}>{uc.title}</h3>
                <p className="text-sm" style={{ color: P.sand }}>{uc.desc}</p>
                <code
                  className="text-xs font-mono rounded-lg px-3 py-2 block"
                  style={{ background: 'rgba(87,74,36,0.6)', color: P.cream, border: `1px solid ${P.sand}40` }}
                >
                  {uc.rule}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   LIVE DEMO TEASER
═══════════════════════════════════════════ */
const DEMO_STEPS = [
  { value: 3200, status: 'WAITING',   statusColor: '#2E86C1', bg: '#EBF5FB', border: '#AED6F1' },
  { value: 3100, status: 'WAITING',   statusColor: '#2E86C1', bg: '#EBF5FB', border: '#AED6F1' },
  { value: 2990, status: 'ELIGIBLE',  statusColor: '#B7950B', bg: '#FEF9E7', border: '#F9E79F' },
  { value: 2990, status: 'TRIGGERED', statusColor: '#CA6F1E', bg: '#FEF5E7', border: '#FAD7A0' },
  { value: 2990, status: 'EXECUTED',  statusColor: '#1E8449', bg: '#EAFAF1', border: '#A9DFBF' },
];

function DemoTeaser() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep((s) => (s + 1) % DEMO_STEPS.length), 1500);
    return () => clearInterval(iv);
  }, []);
  const cur = DEMO_STEPS[step];

  return (
    <section className="py-32 px-6" style={{ background: P.lightest }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-widest" style={{ color: P.sand }}>Live Demo</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: P.bark }}>
              Watch a rule fire in real time
            </h2>
            <p style={{ color: P.olive }}>
              Load the ETH price replay and hit play. Watch the engine evaluate every price tick
              and transition your rule from WAITING all the way to EXECUTED.
            </p>
            <ul className="space-y-3 text-sm" style={{ color: P.olive }}>
              {['Play · Pause · Step controls', 'Speed 1x, 2x, 5x', 'Every event logged with reason', 'Simulated receipt on execution'].map((t) => (
                <li key={t} className="flex gap-2 items-center">
                  <span style={{ color: P.bark }}>✓</span> {t}
                </li>
              ))}
            </ul>
            <Link
              href="/replay"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: P.bark, color: P.cream }}
            >
              Open Replay Engine →
            </Link>
          </div>

          {/* Right — animated card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl blur-3xl" style={{ background: P.cream, opacity: 0.6 }} />
            <div
              className="relative rounded-2xl p-6 space-y-5 border"
              style={{ background: P.cream + 'CC', borderColor: P.sand, backdropFilter: 'blur(8px)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold" style={{ color: P.bark }}>ETH Price Protection</p>
                  <p className="text-xs mt-0.5" style={{ color: P.olive }}>PRICE · demo-user</p>
                </div>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-lg border uppercase tracking-widest transition-all duration-500"
                  style={{ color: cur.statusColor, borderColor: cur.border, background: cur.bg }}
                >
                  {cur.status}
                </span>
              </div>

              {/* Rule */}
              <div
                className="font-mono text-xs rounded-xl p-3 space-y-1 border"
                style={{ background: P.lightest, borderColor: P.sand }}
              >
                <span style={{ color: P.sand }}>IF </span>
                <span style={{ color: '#2E86C1' }}>ETH_USD </span>
                <span style={{ color: '#B7950B' }}>LESS THAN </span>
                <span style={{ color: '#1E8449' }}>3000</span>
                <br />
                <span style={{ color: P.sand }}>→ </span>
                <span style={{ color: '#6C3483' }}>REDUCE_EXPOSURE (20%)</span>
              </div>

              {/* Feed value */}
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3 border transition-colors duration-500"
                style={{ borderColor: P.sand, background: cur.value < 3000 ? '#FDEDEC' : P.lightest }}
              >
                <span className="text-xs" style={{ color: P.olive }}>ETH / USD</span>
                <span
                  className="text-2xl font-bold transition-colors duration-300"
                  style={{ color: cur.value < 3000 ? '#C0392B' : P.bark }}
                >
                  ${cur.value.toLocaleString()}
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs" style={{ color: P.olive }}>
                  <span>Progress</span><span>{step + 1} / {DEMO_STEPS.length}</span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: P.sand + '55' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${((step + 1) / DEMO_STEPS.length) * 100}%`, background: P.bark }}
                  />
                </div>
              </div>

              {step === 4 && (
                <div
                  className="rounded-xl px-4 py-2 text-xs border fadein-up"
                  style={{ background: '#EAFAF1', borderColor: '#A9DFBF', color: '#1E8449' }}
                >
                  ✓ Exposure reduced — 10 ETH → 8 ETH · 2 ETH protected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   ARCHITECTURE BANNER
═══════════════════════════════════════════ */
function ArchBanner() {
  return (
    <section className="relative py-32 px-6 overflow-hidden" style={{ background: P.bark }}>
      {/* Subtle sparkles on dark bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {SPARKLE_DATA.slice(0, 6).map((s, i) => (
          <span
            key={i}
            className="sparkle absolute select-none"
            style={{ top: s.top, left: s.left, fontSize: s.size - 2, color: P.sand, animationDelay: s.delay, animationDuration: s.dur, opacity: 0 }}
          >
            ✦
          </span>
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        <span
          className="inline-block text-xs px-4 py-1.5 rounded-full uppercase tracking-widest border"
          style={{ borderColor: P.sand + '60', color: P.sand, background: 'rgba(203,189,147,0.1)' }}
        >
          Simulation Mode Only
        </span>

        <h2 className="text-3xl md:text-4xl font-bold" style={{ color: P.cream }}>
          Pure simulation of{' '}
          <span style={{
            background: `linear-gradient(90deg, ${P.cream}, ${P.sand})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Rialo-native
          </span>{' '}
          conditional execution
        </h2>

        <p className="text-lg max-w-2xl mx-auto" style={{ color: P.sand }}>
          No contracts. No RPC. No private keys. No real funds. This build proves the product logic
          locally — the onchain execution layer is a separate future build.
        </p>

        <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          {[
            { label: 'This Build',         items: ['Local predicate engine', 'JSON replay feeds', 'localStorage state', 'Simulated receipts'], light: true },
            { label: 'Future Rialo-Native', items: ['Onchain keeper network', 'Chainlink / Pyth feeds', 'Smart contract registry', 'Real tx receipts'], light: false },
          ].map((col) => (
            <div
              key={col.label}
              className="rounded-xl p-5 space-y-3"
              style={{ border: `1px solid ${P.sand}40`, background: col.light ? 'rgba(250,232,180,0.08)' : 'rgba(203,189,147,0.05)' }}
            >
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: col.light ? P.cream : P.sand }}>
                {col.label}
              </p>
              <ul className="space-y-1.5">
                {col.items.map((it) => (
                  <li key={it} className="text-sm flex gap-2" style={{ color: P.sand }}>
                    <span style={{ color: P.olive }}>▸</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Link
          href="/architecture"
          className="inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
          style={{ color: P.cream }}
        >
          Full architecture breakdown →
        </Link>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   METRICS
═══════════════════════════════════════════ */
function Metrics() {
  return (
    <section className="py-20 px-6 border-y" style={{ borderColor: P.sand + '55', background: P.cream + '33' }}>
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { value: '4',  label: 'Rule Types',  sub: 'Price, Invoice, Collateral, Escrow' },
          { value: '5',  label: 'Rule States', sub: 'Full FSM lifecycle' },
          { value: '33', label: 'Tests Pass',  sub: 'Engine + State Machine' },
          { value: '0',  label: 'Dependencies',sub: 'No blockchain required' },
        ].map((m) => (
          <div key={m.label} className="space-y-1">
            <p className="text-4xl font-bold" style={{ color: P.bark }}>{m.value}</p>
            <p className="text-sm font-semibold" style={{ color: P.bark }}>{m.label}</p>
            <p className="text-xs" style={{ color: P.olive }}>{m.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FINAL CTA
═══════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="relative py-32 px-6 overflow-hidden" style={{ background: `linear-gradient(160deg, ${P.cream} 0%, #FEFCF3 100%)` }}>
      <Sparkles />
      <div className="relative text-center max-w-2xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-5xl font-bold" style={{ color: P.bark }}>
          Ready to define your first rule?
        </h2>
        <p className="text-lg" style={{ color: P.olive }}>
          Open the dashboard, create a rule, run a replay, and watch the engine work.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all hover:opacity-90 shadow-md"
            style={{ background: P.bark, color: P.cream }}
          >
            Open Dashboard →
          </Link>
          <Link
            href="/rules/new"
            className="px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border transition-all hover:opacity-80"
            style={{ borderColor: P.sand, color: P.bark, background: 'rgba(203,189,147,0.2)' }}
          >
            Create First Rule
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t py-10 px-6" style={{ borderColor: P.sand + '55', background: P.bark }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-bold tracking-widest text-sm uppercase" style={{ color: P.cream }}>TriggerDesk</p>
          <p className="text-xs mt-1" style={{ color: P.olive }}>Pure Simulation · No real funds · No onchain execution</p>
        </div>
        <nav className="flex gap-6 text-xs" style={{ color: P.sand }}>
          {[['/dashboard','Dashboard'],['/replay','Replay'],['/history','History'],['/architecture','Architecture'],['/settings','Settings']].map(([href,label]) => (
            <Link key={href} href={href} className="hover:opacity-70 transition-opacity">{label}</Link>
          ))}
        </nav>
        <p className="text-xs" style={{ color: P.olive }}>Simulates Rialo Execution Engine · 2026</p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   ROOT
═══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Metrics />
      <HowItWorks />
      <UseCases />
      <DemoTeaser />
      <ArchBanner />
      <FinalCTA />
      <Footer />
    </>
  );
}
