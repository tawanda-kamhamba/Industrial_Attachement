import { AppShell } from '@/components/layout/AppShell';
import type { SidebarItem } from '@/components/ui/Sidebar';
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
    <AppShell
      sidebarItems={supervisorSidebarItems}
      basePath="/supervisor"
      onLogout={logout}
      displayName={displayName}
      searchPlaceholder="Search students, logbooks, reports…"
    />
  );
}
