import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackToDashboardLink } from '@/components/student/BackToDashboardLink';

const CARD_WIDTH = 300;
const CARD_GAP = 20;
const SLIDE_STEP = CARD_WIDTH + CARD_GAP;

const INSTRUCTIONS = [
  {
    id: 'register',
    title: 'Registration',
    description: 'Register for industrial attachment with your programme, level, session and faculty.',
    cta: 'Start registration',
    to: '/student/register',
    icon: (
      <svg className="h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    ),
  },
  {
    id: 'assumptions',
    title: 'Submit assumptions',
    description: 'Submit your company and supervisor details for the assumption of duty form.',
    cta: 'Go to assumptions',
    to: '/student/assumption',
    icon: (
      <svg className="h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108v8.586a2.25 2.25 0 002.25 2.25h.96a2.25 2.25 0 01-.75-4.32 2.25 2.25 0 01.75-4.32h.96a2.25 2.25 0 002.25 2.25h.96a2.25 2.25 0 00-.75-4.32 2.25 2.25 0 00.75-4.32" />
      </svg>
    ),
  },
  {
    id: 'contract-report',
    title: 'Submit contract & report',
    description: 'Upload your signed contract and submit your final industrial attachment report.',
    cta: 'Submit contract',
    to: '/student/contract',
    secondaryCta: 'Submit report',
    secondaryTo: '/student/report',
    icon: (
      <svg className="h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: 'checklist',
    title: 'Orientation checklist',
    description: 'Complete the orientation checklist before starting your attachment.',
    cta: 'Fill checklist',
    to: '/student/orientation',
    icon: (
      <svg className="h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function InstructionsPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const goTo = useCallback((index: number) => {
    setSlideIndex(Math.max(0, Math.min(index, INSTRUCTIONS.length - 1)));
  }, []);

  const next = useCallback(() => goTo(slideIndex + 1), [slideIndex, goTo]);
  const prev = useCallback(() => goTo(slideIndex - 1), [slideIndex, goTo]);

  // Keyboard and touch for accessibility
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [prev, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].pageX;
    scrollLeftStart.current = slideIndex * SLIDE_STEP;
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX;
    const diff = startX.current - x;
    const maxSlide = INSTRUCTIONS.length - 1;
    const raw = (diff / SLIDE_STEP) + slideIndex;
    const nextIdx = Math.max(0, Math.min(maxSlide, Math.round(raw)));
    if (Math.abs(diff) > 30) setSlideIndex(nextIdx);
  };
  const handleTouchEnd = () => setIsDragging(false);

  const translateX = -slideIndex * SLIDE_STEP;

  return (
    <div className="-mx-6 -mb-6 -mt-3 min-h-screen bg-surface text-slate-800" ref={containerRef} tabIndex={0}>
      {/* Hero / banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-slate-50 px-6 pt-8 pb-12 border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,112,196,0.08),transparent)]" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 md:text-3xl">
              Instructions
            </h1>
            <p className="mt-1 text-slate-600">
              Complete these steps for your industrial attachment
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={slideIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Previous"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              disabled={slideIndex === INSTRUCTIONS.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Next"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="relative mt-6 flex justify-center gap-1.5">
          {INSTRUCTIONS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2 w-2 rounded-full transition-all duration-200 ${
                i === slideIndex ? 'w-6 bg-primary-500' : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-8 bg-surface">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Steps to complete
          </h2>
          <Link
            to="/student"
            className="text-sm font-medium text-primary-600 transition hover:text-primary-700"
          >
            More &gt;
          </Link>
        </div>

        {/* Carousel */}
        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out will-change-transform"
            style={{
              width: INSTRUCTIONS.length * SLIDE_STEP,
              transform: `translateX(${translateX}px)`,
            }}
          >
            {INSTRUCTIONS.map((item, i) => (
              <div
                key={item.id}
                className="flex flex-shrink-0 origin-center justify-center transition-transform duration-300 ease-out hover:scale-105"
                style={{ width: CARD_WIDTH, marginRight: i < INSTRUCTIONS.length - 1 ? CARD_GAP : 0 }}
              >
                <div
                  className={`group relative flex h-full w-full flex-col rounded-xl border bg-white p-5 shadow-card transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 ${
                    i === slideIndex ? 'border-primary-400 ring-2 ring-primary-200' : 'border-slate-200'
                  }`}
                >
                  <div className="absolute right-3 top-3 opacity-60 group-hover:opacity-100">
                    <span className="text-slate-500">⋯</span>
                  </div>
                  <div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-slate-50">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                  <div className="mt-5 space-y-2">
                    <Link
                      to={item.to}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white"
                    >
                      {item.cta}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </Link>
                    {'secondaryTo' in item && item.secondaryTo && (
                      <Link
                        to={item.secondaryTo}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        {item.secondaryCta}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination dots (below cards) */}
        <div className="mt-8 flex justify-center gap-2">
          {INSTRUCTIONS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === slideIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <BackToDashboardLink className="text-slate-600 decoration-slate-300 hover:text-slate-800" />
        </div>
      </div>
    </div>
  );
}
