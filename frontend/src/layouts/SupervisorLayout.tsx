import { Outlet } from 'react-router-dom';
import { TopBar } from '@/components/ui/TopBar';
import { Sidebar, type SidebarItem } from '@/components/ui/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const supervisorSidebarItems: SidebarItem[] = [
  { to: 'dashboard', label: 'Dashboard' },
  { to: 'scores', label: 'Scores' },
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
      <TopBar displayName={displayName} onLogout={logout} />
      <Sidebar items={supervisorSidebarItems} basePath="/supervisor" onLogout={logout} />
      <main className="pl-56 pt-14 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
