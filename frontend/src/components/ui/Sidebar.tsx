import type { LucideIcon } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

export interface SidebarItem {
  to: string;
  label: string;
  icon?: LucideIcon;
  end?: boolean;
  isLogout?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  basePath: string;
  onLogout?: () => void;
  /** Mobile drawer open state (lg+ sidebar is always visible). */
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-600 text-white shadow-sm shadow-primary-900/20'
      : 'text-slate-300 hover:bg-surface-sidebarHover hover:text-white'
  }`;

const logoutButtonClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-surface-sidebarHover hover:text-white';

function SidebarNavContent({ icon: Icon, label }: { icon?: LucideIcon; label: string }) {
  return (
    <>
      {Icon ? (
        <Icon
          className="h-[18px] w-[18px] shrink-0 opacity-90"
          strokeWidth={1.75}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{label}</span>
    </>
  );
}

export function Sidebar({ items, basePath, onLogout, mobileOpen = false, onNavigate }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout?.();
    onNavigate?.();
    navigate('/login');
  };

  const resolveTo = (item: SidebarItem) =>
    item.to.startsWith('/') ? item.to : `${basePath}/${item.to}`;

  return (
    <aside
      className={`no-print fixed bottom-0 left-0 top-14 z-30 flex w-[min(100vw,14rem)] flex-col border-r border-slate-700 bg-surface-sidebar shadow-xl transition-transform duration-200 ease-out lg:w-56 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      aria-hidden={!mobileOpen ? undefined : false}
    >
      <nav
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-3"
        aria-label="Sidebar"
      >
        <div className="flex flex-col gap-1">
          {items
            .filter((item) => !item.isLogout)
            .map((item) => (
              <NavLink
                key={item.to}
                to={resolveTo(item)}
                end={item.end ?? (item.to === '' || item.to === 'dashboard')}
                className={navLinkClass}
                onClick={onNavigate}
              >
                <SidebarNavContent icon={item.icon} label={item.label} />
              </NavLink>
            ))}
        </div>
        {items.some((item) => item.isLogout) ? (
          <div className="mt-auto flex flex-col gap-1 border-t border-slate-600/60 pt-3">
            {items
              .filter((item) => item.isLogout)
              .map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={handleLogoutClick}
                  className={logoutButtonClass}
                >
                  <SidebarNavContent icon={item.icon} label={item.label} />
                </button>
              ))}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
