import { useEffect, useState, type ReactNode } from 'react';

type ProfilePhotoLightboxProps = {
  src: string | null | undefined;
  alt?: string;
  children: ReactNode;
  /** Applied to the clickable trigger wrapper */
  className?: string;
};

export function ProfilePhotoLightbox({
  src,
  alt = 'Profile photo',
  children,
  className = 'cursor-zoom-in border-0 bg-transparent p-0',
}: ProfilePhotoLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!src) {
    return <>{children}</>;
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label="View full profile photo"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-[101] rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[min(90vh,960px)] max-w-[min(95vw,960px)] rounded-lg object-contain shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
