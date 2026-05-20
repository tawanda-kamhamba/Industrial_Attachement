import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from '@/components/ui/TopBar';
import { Sidebar, type SidebarItem } from '@/components/ui/Sidebar';

type AppShellTopBarProps = {
  displayName: string;
  onLogout?: () => void;
  profileLink?: string;
  profilePhotoUrl?: string;
  profilePhotoEnlargeable?: boolean;
  searchPlaceholder?: string;
};

type AppShellProps = AppShellTopBarProps & {
  sidebarItems: SidebarItem[];
  basePath: string;
  /** Extra TopBar content (rare); most pages use Outlet only */
  children?: ReactNode;
};

export function AppShell({
  sidebarItems,
  basePath,
  onLogout,
  displayName,
  profileLink,
  profilePhotoUrl,
  profilePhotoEnlargeable,
  searchPlaceholder,
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="no-print">
        <TopBar
          pinned
          displayName={displayName}
          onLogout={onLogout}
          profileLink={profileLink}
          profilePhotoUrl={profilePhotoUrl}
          profilePhotoEnlargeable={profilePhotoEnlargeable}
          searchPlaceholder={searchPlaceholder}
          showMenuButton
          onMenuToggle={() => setMobileNavOpen((o) => !o)}
          menuOpen={mobileNavOpen}
        />
        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 top-14 z-20 bg-slate-900/50 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
        <Sidebar
          items={sidebarItems}
          basePath={basePath}
          onLogout={onLogout}
          mobileOpen={mobileNavOpen}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </div>
      <main className="min-h-screen w-full pt-14 lg:ml-56">
        <div className="mx-auto w-full max-w-[1600px] px-3 pb-6 pt-3 sm:px-4 md:px-6">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
