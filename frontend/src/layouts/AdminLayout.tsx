import { AppShell } from '@/components/layout/AppShell';
import type { SidebarItem } from '@/components/ui/Sidebar';
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
    <AppShell
      sidebarItems={adminSidebarItems}
      basePath="/admin"
      onLogout={logout}
      displayName={user?.name ?? 'Admin'}
      searchPlaceholder="Search students, reports, contracts…"
    />
  );
}
