import { Outlet } from 'react-router-dom';
import { TopBar } from '@/components/ui/TopBar';
import { Sidebar, type SidebarItem } from '@/components/ui/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const adminSidebarItems: SidebarItem[] = [
  { to: 'dashboard', label: 'Dashboard' },
  { to: 'students', label: 'Registered Students' },
  { to: 'orientation', label: 'Orientation Checklists' },
  { to: 'elogbooks', label: 'E-Logbooks' },
  { to: 'contracts', label: 'View Contracts' },
  { to: 'reports', label: 'View Submitted Reports' },
  { to: 'assumptions', label: 'Student Assumptions' },
  { to: 'assign-supervisors', label: 'Assign Supervisors' },
  { to: 'visiting-scores', label: 'Visiting Supervisors Score' },
  { to: 'company-scores', label: 'Company Supervisor Score' },
  { to: 'change-password', label: 'Change Password' },
  { to: '/login', label: 'Logout', isLogout: true },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="no-print">
        <TopBar
          pinned
          displayName={user?.name ?? 'Admin'}
          onLogout={logout}
        />
        <Sidebar items={adminSidebarItems} basePath="/admin" onLogout={logout} />
      </div>
      <main className="ml-56 min-h-screen pt-14">
        <div className="px-6 pb-6 pt-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
