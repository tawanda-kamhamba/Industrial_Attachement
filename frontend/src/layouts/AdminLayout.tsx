import { AppShell } from '@/components/layout/AppShell';
import type { SidebarItem } from '@/components/ui/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileBarChart,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

const adminSidebarItems: SidebarItem[] = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'students', label: 'Registered Students', icon: Users },
  { to: 'orientation', label: 'Orientation Checklists', icon: ClipboardCheck },
  { to: 'elogbooks', label: 'E-Logbooks', icon: BookOpen },
  { to: 'contracts', label: 'View Contracts', icon: FileText },
  { to: 'reports', label: 'View Submitted Reports', icon: FileBarChart },
  { to: 'assumptions', label: 'Student Assumptions', icon: UserCheck },
  { to: 'assign-supervisors', label: 'Assign Supervisors', icon: UserPlus },
  { to: 'visiting-scores', label: 'Visiting Supervisors Score', icon: MapPin },
  { to: 'company-scores', label: 'Company Supervisor Score', icon: Building2 },
  { to: 'change-password', label: 'Change Password', icon: KeyRound },
  { to: '/login', label: 'Logout', icon: LogOut, isLogout: true },
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
