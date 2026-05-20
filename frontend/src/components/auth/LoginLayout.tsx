import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';

function LoginIllustration() {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="relative flex h-full min-h-[400px] w-full max-w-lg items-center justify-center">
      {!imgFailed ? (
        <img
          src="/img/header_log.png"
          alt="University logo"
          className="h-auto max-h-[420px] w-full max-w-md object-contain drop-shadow-lg animate-login-logo"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="flex max-h-[420px] max-w-md flex-1 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 p-8 shadow-xl"
          aria-hidden
        >
          <div className="flex h-48 w-48 flex-col items-center justify-center rounded-2xl bg-primary-500/90 shadow-inner">
            <div className="h-20 w-20 rounded-full border-4 border-primary-300 bg-primary-600 shadow-md" />
            <div className="mt-3 h-2 w-16 rounded-full bg-primary-300/80" />
          </div>
          <p className="mt-4 text-sm font-medium text-white/90">Industrial Attachment</p>
        </div>
      )}
    </div>
  );
}

interface LoginLayoutProps {
  children: React.ReactNode;
  /** Card title (e.g. "Student Login", "Administrator Login") */
  cardTitle: string;
  /** Card subtitle (e.g. "IASMS - Industrial Attachment Management") */
  cardSubtitle?: string;
}

export function LoginLayout({ children, cardTitle, cardSubtitle }: LoginLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] min-w-0 flex-col md:min-h-screen md:flex-row">
      {/* Left: original sign-in design – dark gradient, orbs, title, card */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 px-4 py-8 sm:py-10 md:min-h-screen">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary-500 blur-3xl mix-blend-screen animate-pulse" />
          <div className="absolute -right-40 bottom-0 h-72 w-72 rounded-full bg-emerald-500 blur-3xl mix-blend-screen animate-pulse delay-150" />
        </div>

        <div className="relative z-10 flex w-full max-w-md flex-col items-center">
          {/* Enlarged title like PHP */}
          <div className="mb-6 text-center">
            <h1
              className="text-base font-bold leading-tight text-[rgba(255,152,0,0.91)] sm:text-lg md:text-xl lg:text-2xl"
              style={{ fontFamily: 'sans-serif' }}
            >
              UNIVERSITY OF ZIMBABWE
              <br />
              <br />
              ATTACHMENT
              <br />
              <br />
              MANAGEMENT SYSTEM
            </h1>
          </div>

          <Card className="w-full" padding="lg">
            <h2 className="mb-2 text-xl font-display font-semibold text-slate-800">{cardTitle}</h2>
            {cardSubtitle && <p className="mb-6 text-sm text-slate-500">{cardSubtitle}</p>}
            {children}
          </Card>
        </div>
      </div>

      {/* Right: image side */}
      <div className="hidden min-h-[280px] flex-1 bg-gradient-to-b from-sky-100 to-white md:flex md:items-center md:justify-center md:p-8">
        <LoginIllustration />
      </div>
    </div>
  );
}
