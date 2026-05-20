import { NavLink, useNavigate } from 'react-router-dom';

export interface SidebarItem {
  to: string;
  label: string;
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
  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-600 text-white'
      : 'text-slate-300 hover:bg-surface-sidebarHover hover:text-white'
  }`;

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
      className={`fixed left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] w-56 max-w-[min(100vw,16rem)] flex-col border-r border-slate-700 bg-surface-sidebar transition-transform duration-200 ease-out lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      aria-hidden={!mobileOpen ? undefined : false}
    >
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 overscroll-contain" aria-label="Sidebar">
        {items.map((item) =>
          item.isLogout ? (
            <button
              key={item.to}
              type="button"
              onClick={handleLogoutClick}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-surface-sidebarHover hover:text-white"
            >
              {item.label}
            </button>
          ) : (
            <NavLink
              key={item.to}
              to={resolveTo(item)}
              end={item.end ?? (item.to === '' || item.to === 'dashboard')}
              className={navLinkClass}
              onClick={onNavigate}
            >
              {item.label}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
