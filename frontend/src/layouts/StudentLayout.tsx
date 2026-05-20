import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from '@/components/ui/TopBar';
import { useAuth } from '@/hooks/useAuth';

const PROFILE_PHOTO_CACHE_KEY = 'iasms_profile_photo_updated';

export function StudentLayout() {
  const { user, logout } = useAuth();
  const [photoVersion, setPhotoVersion] = useState(() => Date.now());
  useEffect(() => {
    const handler = () => setPhotoVersion(Date.now());
    window.addEventListener('profilePhotoUpdated', handler);
    return () => window.removeEventListener('profilePhotoUpdated', handler);
  }, []);
  const profilePhotoUrl =
    user?.role === 'student'
      ? `/api/student/profile/photo?t=${photoVersion}${typeof localStorage !== 'undefined' ? `&v=${localStorage.getItem(PROFILE_PHOTO_CACHE_KEY) ?? ''}` : ''}`
      : undefined;

  return (
    <div className="fixed inset-0 z-0 flex min-w-0 flex-col overflow-hidden bg-surface">
      <TopBar
        pinned
        displayName={user?.name ?? 'Student'}
        onLogout={logout}
        profileLink="/student/profile"
        profilePhotoUrl={profilePhotoUrl}
        profilePhotoEnlargeable
      />
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-14">
        <div className="mx-auto w-full max-w-[1600px] px-3 pb-6 pt-3 sm:px-4 md:px-6 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
