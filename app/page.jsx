'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Header from './components/Header';

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

function Card({ className = '', children }) {
  return (
    <div
      className={classNames(
        'rounded-3xl border border-black/10 bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)]',
        className
      )}
    >
      {children}
    </div>
  );
}

// Animated Fractal Logo Component
function AnimatedLogo({ size = 140, className = '' }) {
  const rings = [
    { r: 58, dash: '8 12', duration: 25, reverse: false },
    { r: 50, dash: '12 8', duration: 20, reverse: true },
    { r: 42, dash: '6 14', duration: 30, reverse: false },
    { r: 34, dash: '10 10', duration: 18, reverse: true },
    { r: 26, dash: '4 16', duration: 22, reverse: false },
  ];

  return (
    <div className={classNames('relative', className)} style={{ width: size, height: size }}>
      {/* Animated rings */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        fill="none"
        className="absolute inset-0"
      >
        {rings.map((ring, i) => (
          <circle
            key={i}
            cx="70"
            cy="70"
            r={ring.r}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={ring.dash}
            strokeLinecap="round"
            fill="none"
            className="text-black/20"
            style={{
              transformOrigin: 'center',
              animation: `spin ${ring.duration}s linear infinite ${ring.reverse ? 'reverse' : ''}`,
            }}
          />
        ))}
        
        {/* Decorative dots on orbits */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <circle
            key={`dot-${i}`}
            cx={70 + 54 * Math.cos((angle * Math.PI) / 180)}
            cy={70 + 54 * Math.sin((angle * Math.PI) / 180)}
            r="3"
            fill="currentColor"
            className="text-black/30"
            style={{
              transformOrigin: '70px 70px',
              animation: `spin 15s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </svg>

      {/* Center logo with pulse */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'pulse-logo 4s ease-in-out infinite' }}
      >
        <div className="h-16 w-16 rounded-2xl border border-black/10 bg-white shadow-xl flex items-center justify-center overflow-hidden">
          <Image
            src="/logo.png"
            alt="Cryphos"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
        </div>
      </div>
    </div>
  );
}

// Icons
const CheckCircle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Layers = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Users = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21v-2a3 3 0 00-3-3h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Zap = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const Shield = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l8 4v6c0 5.5-3.84 10.74-8 12-4.16-1.26-8-6.5-8-12V6l8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BarChart = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function ChecklistPreview() {
  const [items, setItems] = useState([
    { id: 1, text: 'Projekt erstellen', checked: true },
    { id: 2, text: 'Team einladen', checked: true },
    { id: 3, text: 'Aufgaben definieren', checked: false },
    { id: 4, text: 'Fortschritt tracken', checked: false },
  ]);

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const completed = items.filter((i) => i.checked).length;
  const progress = Math.round((completed / items.length) * 100);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-black">Mein Projekt</div>
          <div className="text-xs text-black/60">
            {completed}/{items.length} erledigt
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-semibold text-black">{progress}%</div>
            <div className="text-[11px] text-black/50">Fortschritt</div>
          </div>
          {/* Animated progress ring */}
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-black/10"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-black transition-all duration-500"
                strokeDasharray={`${progress * 0.94} 100`}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={classNames(
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
              item.checked
                ? 'border-black/5 bg-black/[0.02]'
                : 'border-black/10 bg-white hover:border-black/20 hover:shadow-sm'
            )}
          >
            <span
              className={classNames(
                'grid h-6 w-6 place-items-center rounded-lg border transition-all duration-200',
                item.checked
                  ? 'border-black bg-black text-white'
                  : 'border-black/20 bg-white'
              )}
            >
              {item.checked && (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span
              className={classNames(
                'text-sm transition-all duration-200',
                item.checked ? 'text-black/50 line-through' : 'text-black'
              )}
            >
              {item.text}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="h-7 w-7 rounded-full border-2 border-white bg-blue-500" />
            <div className="h-7 w-7 rounded-full border-2 border-white bg-emerald-500" />
            <div className="h-7 w-7 rounded-full border-2 border-white bg-amber-500" />
          </div>
          <div className="text-xs text-black/60">3 Mitglieder</div>
        </div>
        <span className="rounded-full bg-black px-3 py-1 text-[11px] font-medium text-white">
          Aktiv
        </span>
      </div>
    </Card>
  );
}

export default function Page() {
  // Modal state lifted to page level
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const openLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const openRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const closeModals = () => {
    setLoginOpen(false);
    setRegisterOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Global CSS Animations */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-logo {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-bg {
          0%, 100% { opacity: 0.03; transform: scale(1); }
          50% { opacity: 0.06; transform: scale(1.1); }
        }
      `}</style>

      {/* Animated background shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-32 top-32 h-96 w-96 rounded-full bg-black blur-3xl"
          style={{ animation: 'pulse-bg 8s ease-in-out infinite', opacity: 0.03 }}
        />
        <div
          className="absolute -right-32 top-0 h-[500px] w-[500px] rounded-full bg-black blur-3xl"
          style={{ animation: 'pulse-bg 10s ease-in-out infinite 1s', opacity: 0.03 }}
        />
        <div
          className="absolute -bottom-48 left-1/4 h-[600px] w-[600px] rounded-full bg-black blur-3xl"
          style={{ animation: 'pulse-bg 12s ease-in-out infinite 2s', opacity: 0.03 }}
        />
      </div>

      {/* Header Component with external modal control */}
      <Header 
        user={null}
        loginOpen={loginOpen}
        registerOpen={registerOpen}
        onOpenLogin={openLogin}
        onOpenRegister={openRegister}
        onCloseModals={closeModals}
      />

      {/* Main Content */}
      <main className="relative mx-auto max-w-6xl px-6 pb-16">
        <section className="grid gap-8 pt-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              Checklisten.
              <br />
              <span className="text-black/40">Einfach. Organisiert.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-black/70">
              Erstellen Sie Checklisten, arbeiten Sie im Team und behalten Sie
              den Überblick über alle Ihre Projekte — alles an einem Ort.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={openRegister}
                className="group rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                Kostenlos starten
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
              </button>
              <button
                onClick={openLogin}
                className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black/80 shadow-sm transition hover:border-black/20"
              >
                Anmelden
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-black/50">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Keine Kreditkarte
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Kostenloser Start
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                DSGVO-konform
              </span>
            </div>

            {/* Features Grid */}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Layers, title: 'Projekte', desc: 'Alles organisiert' },
                { icon: Users, title: 'Team', desc: 'Zusammen arbeiten' },
                { icon: Zap, title: 'Schnell', desc: 'Sofort loslegen' },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_-28px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.2)]"
                >
                  <f.icon className="h-6 w-6 text-black/70 transition-transform duration-300 group-hover:scale-110" />
                  <div className="mt-3 text-sm font-semibold">{f.title}</div>
                  <div className="mt-1 text-sm text-black/65">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Card with float animation */}
          <div style={{ animation: 'float 6s ease-in-out infinite' }}>
            <ChecklistPreview />
          </div>
        </section>

        {/* Animated Logo Section */}
        <section className="mt-20 flex flex-col items-center justify-center py-8">
          <AnimatedLogo size={160} />
          <p className="mt-6 text-center text-sm text-black/50">
            Ein neuer Ansatz
          </p>
        </section>

        {/* Features Section */}
        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: Layers,
              title: 'Projekte verwalten',
              body: 'Organisieren Sie Ihre Arbeit in übersichtlichen Projekten mit eigenen Checklisten und Teammitgliedern.',
            },
            {
              icon: BarChart,
              title: 'Fortschritt verfolgen',
              body: 'Sehen Sie auf einen Blick, welche Aufgaben erledigt sind und behalten Sie den Überblick.',
            },
            {
              icon: Shield,
              title: 'Sicher & Privat',
              body: 'Ihre Daten sind verschlüsselt, DSGVO-konform und sicher in Deutschland gehostet.',
            },
          ].map((x) => (
            <Card
              key={x.title}
              className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)]"
            >
              <x.icon className="h-6 w-6 text-black/70" />
              <div className="mt-3 text-base font-semibold tracking-tight">{x.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-black/70">{x.body}</div>
            </Card>
          ))}
        </section>

        {/* CTA Section */}
        <section className="mt-16">
          <Card className="overflow-hidden p-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Bereit loszulegen?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-black/70">
              Erstellen Sie Ihr erstes Projekt in wenigen Sekunden. Kostenlos.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={openRegister}
                className="group rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                Jetzt starten
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
              </button>
              <button
                onClick={openLogin}
                className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-black/80 shadow-sm transition hover:border-black/20"
              >
                Anmelden
              </button>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-black/10 pt-8 text-sm text-black/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Cryphos"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              </div>
              <div>
                <span className="font-semibold text-black">Cryphos</span>
                <span className="ml-2 text-black/40">© {new Date().getFullYear()}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <a className="transition hover:text-black" href="#">Datenschutz</a>
              <a className="transition hover:text-black" href="#">Impressum</a>
              <a className="transition hover:text-black" href="#">Kontakt</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}