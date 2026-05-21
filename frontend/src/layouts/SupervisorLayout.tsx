import { AppShell } from '@/components/layout/AppShell';
import type { SidebarItem } from '@/components/ui/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileBarChart,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  UserCheck,
} from 'lucide-react';

const supervisorSidebarItems: SidebarItem[] = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'scores', label: 'Scores', icon: BarChart3 },
  { to: 'final-grades', label: 'Final grades', icon: GraduationCap },
  { to: 'passwords', label: 'Assessment passwords', icon: KeyRound },
  { to: 'orientation', label: 'Orientation checklists', icon: ClipboardCheck },
  { to: 'elogbooks', label: 'E-logbooks', icon: BookOpen },
  { to: 'assumptions', label: 'Student assumptions', icon: UserCheck },
  { to: 'contracts', label: 'Contracts', icon: FileText },
  { to: 'reports', label: 'Reports', icon: FileBarChart },
  { to: '/login', label: 'Logout', icon: LogOut, isLogout: true },
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
