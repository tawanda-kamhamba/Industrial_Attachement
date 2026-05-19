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
    <div className="min-h-screen bg-surface">
      <TopBar
        pinned
        displayName={user?.name ?? 'Student'}
        onLogout={logout}
        profileLink="/student/profile"
        profilePhotoUrl={profilePhotoUrl}
      />
      <main className="min-h-screen pt-14">
        <div className="px-6 pb-6 pt-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
