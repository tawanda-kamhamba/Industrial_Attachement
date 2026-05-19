import { Outlet } from 'react-router-dom';
import { TopBar } from '@/components/ui/TopBar';
import { Sidebar, type SidebarItem } from '@/components/ui/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const supervisorSidebarItems: SidebarItem[] = [
  { to: 'dashboard', label: 'Dashboard' },
  { to: 'scores', label: 'Scores' },
  { to: 'final-grades', label: 'Final grades' },
  { to: 'passwords', label: 'Assessment passwords' },
  { to: 'orientation', label: 'Orientation checklists' },
  { to: 'elogbooks', label: 'E-logbooks' },
  { to: 'assumptions', label: 'Student assumptions' },
  { to: 'contracts', label: 'Contracts' },
  { to: 'reports', label: 'Reports' },
  { to: '/login', label: 'Logout', isLogout: true },
];

export function SupervisorLayout() {
  const { user, logout } = useAuth();
  const displayName = user?.staffId ? `${user.name} (${user.staffId})` : user?.name ?? 'Supervisor';

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar pinned displayName={displayName} onLogout={logout} />
      <Sidebar items={supervisorSidebarItems} basePath="/supervisor" onLogout={logout} />
      <main className="ml-56 min-h-screen pt-14">
        <div className="px-6 pb-6 pt-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
