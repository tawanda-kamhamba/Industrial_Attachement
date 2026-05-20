import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { ProfilePhotoLightbox } from '@/components/ui/ProfilePhotoLightbox';
import { SearchField } from '@/components/ui/SearchField';

interface TopBarProps {
  title?: string;
  displayName: string;
  logoUrl?: string;
  onLogout?: () => void;
  /** Keep header visible while scrolling (fixed to viewport top). */
  pinned?: boolean;
  searchPlaceholder?: string;
  /** Link for avatar/name (e.g. /student/profile). When set, avatar and name are clickable. */
  profileLink?: string;
  /** URL for profile photo. When set, avatar shows image with fallback to initial. */
  profilePhotoUrl?: string;
  /** Click avatar to view full-size photo (student portal). */
  profilePhotoEnlargeable?: boolean;
  /** Show hamburger for mobile sidebar (admin/supervisor). */
  showMenuButton?: boolean;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

type StudentNotification = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  week_number: number | null;
  supervisor_name: string | null;
  elogbook_entry_id: number | null;
  created_at: string | null;
  read_at: string | null;
};

type SupervisorNotification = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  student_index_number: string | null;
  student_name: string | null;
  contract_id: number | null;
  created_at: string | null;
  read_at: string | null;
};

type InboxNotification = StudentNotification | SupervisorNotification;

export function TopBar({
  displayName,
  logoUrl = '/img/header_log.png',
  onLogout,
  pinned = false,
  searchPlaceholder = 'Search logbook, forms, and more',
  profileLink,
  profilePhotoUrl,
  profilePhotoEnlargeable = false,
  showMenuButton = false,
  onMenuToggle,
  menuOpen = false,
}: TopBarProps) {
  const initial = displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : '?';
  const [profilePhotoLoaded, setProfilePhotoLoaded] = useState(false);

  useEffect(() => {
    setProfilePhotoLoaded(false);
  }, [profilePhotoUrl]);

  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isSupervisor = user?.role === 'supervisor';
  const hasNotifications = isStudent || isSupervisor;

  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifBoxRef = useRef<HTMLDivElement | null>(null);

  const unreadCountText = useMemo(() => {
    if (unreadCount <= 0) return null;
    if (unreadCount > 99) return '99+';
    return String(unreadCount);
  }, [unreadCount]);

  const loadNotifications = async () => {
    if (!hasNotifications) return;
    setLoadingNotifs(true);
    try {
      if (isStudent) {
        const res = await api.get<{ unread_count: number; notifications: StudentNotification[] }>(
          '/student/notifications'
        );
        setNotifications(res.notifications ?? []);
        setUnreadCount(res.unread_count ?? 0);
      } else if (isSupervisor) {
        const res = await api.get<{ unread_count: number; notifications: SupervisorNotification[] }>(
          '/supervisor/notifications'
        );
        setNotifications(res.notifications ?? []);
        setUnreadCount(res.unread_count ?? 0);
      }
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (!hasNotifications) {
      setNotifications([]);
      setUnreadCount(0);
      setNotifOpen(false);
      return;
    }
    loadNotifications().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNotifications, isStudent, isSupervisor, user?.indexNumber, user?.staffId]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const el = notifBoxRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [notifOpen]);

  const markNotificationRead = async (id: number) => {
    if (!hasNotifications) return;
    try {
      const path = isStudent
        ? '/student/notifications/mark-read'
        : '/supervisor/notifications/mark-read';
      await api.post(path, { notification_ids: [id] });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Best-effort; don't block UI.
    }
  };

  const isStudentNotification = (n: InboxNotification): n is StudentNotification =>
    !('student_index_number' in n);

  const notificationMeta = (n: InboxNotification) => {
    if (isStudentNotification(n)) {
      return (
        <>
          {n.week_number ? <span>Week {n.week_number}</span> : null}
          {n.supervisor_name ? <span>From {n.supervisor_name}</span> : null}
        </>
      );
    }
    const sn = n as SupervisorNotification;
    return (
      <>
        {sn.student_name ? <span>{sn.student_name}</span> : null}
        {sn.student_index_number ? <span>({sn.student_index_number})</span> : null}
      </>
    );
  };

  const avatarInner = (
    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
      {profilePhotoUrl ? (
        <img
          src={profilePhotoUrl}
          alt=""
          className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
          onLoad={() => setProfilePhotoLoaded(true)}
          onError={(e) => {
            setProfilePhotoLoaded(false);
            const el = e.currentTarget;
            el.style.display = 'none';
            const fallback = el.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white"
        style={profilePhotoLoaded ? { display: 'none' } : undefined}
      >
        {initial}
      </div>
    </div>
  );

  const avatarBlock =
    profilePhotoEnlargeable && profilePhotoLoaded && profilePhotoUrl ? (
      <ProfilePhotoLightbox
        src={profilePhotoUrl}
        className="shrink-0 cursor-zoom-in rounded-full border-0 bg-transparent p-0"
      >
        {avatarInner}
      </ProfilePhotoLightbox>
    ) : (
      avatarInner
    );

  const userBlock = (
    <>
      {avatarBlock}
      <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:inline md:max-w-[180px]">
        {displayName}
      </span>
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="hidden rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:inline"
        >
          Logout
        </button>
      )}
    </>
  );

  return (
    <header
      className={`${
        pinned ? 'fixed top-0 left-0 right-0 z-50' : 'sticky top-0 z-40'
      } flex min-h-14 min-w-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 shadow-card sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-0`}
    >
      {showMenuButton ? (
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={onMenuToggle}
        >
          <span className="text-lg leading-none" aria-hidden>
            {menuOpen ? '×' : '☰'}
          </span>
        </button>
      ) : null}
      <div className={`min-w-0 shrink-0 items-center ${showMenuButton ? 'hidden sm:flex' : 'flex'}`}>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-7 w-auto max-w-[100px] object-contain sm:h-8 sm:max-w-[120px]" />
        )}
      </div>
      <div className="w-full min-w-0 basis-full sm:basis-auto sm:flex-1 sm:px-1 md:px-2">
        <SearchField
          placeholder={searchPlaceholder}
          aria-label="Search"
          className="mx-auto w-full max-w-full sm:max-w-md"
        />
      </div>
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-2">
        <div className="relative" ref={notifBoxRef}>
          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Notifications"
            aria-label="Notifications"
            onClick={() => {
              if (!hasNotifications) return;
              setNotifOpen((o) => !o);
              if (!notifOpen) loadNotifications().catch(() => undefined);
            }}
          >
            &#128276;
            {hasNotifications && unreadCountText && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold leading-4 text-white">
                {unreadCountText}
              </span>
            )}
          </button>

          {hasNotifications && notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <div className="text-sm font-semibold text-slate-800">Notifications</div>
                {loadingNotifs ? (
                  <div className="text-xs text-slate-500">Loading…</div>
                ) : (
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-600 hover:underline"
                    onClick={() => loadNotifications().catch(() => undefined)}
                  >
                    Refresh
                  </button>
                )}
              </div>

              {loadingNotifs ? (
                <div className="px-3 py-4 text-sm text-slate-600">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-600">No notifications yet.</div>
              ) : (
                <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (!n.read_at) markNotificationRead(n.id).catch(() => undefined);
                      }}
                      className={`w-full rounded-md border px-3 py-2 text-left transition ${
                        n.read_at
                          ? 'border-slate-200 bg-white hover:bg-slate-50'
                          : 'border-primary-200 bg-primary-50/40 hover:bg-primary-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-slate-700">{n.title}</div>
                          <div className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700 max-h-24 overflow-y-auto">
                            {n.message ?? ''}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {notificationMeta(n)}
                            {n.created_at ? <span>· {new Date(n.created_at).toLocaleString()}</span> : null}
                          </div>
                        </div>
                        {!n.read_at ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600" /> : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:inline-flex"
          title="Help"
          aria-label="Help"
        >
          ?
        </button>
        <div className="flex min-w-0 items-center gap-1 pl-1 sm:gap-2 sm:pl-2">
          {profileLink ? (
            <Link
              to={profileLink}
              className="flex min-w-0 items-center gap-1 rounded-lg py-1 pr-1 transition hover:bg-slate-100 sm:gap-2"
              title="Edit profile"
            >
              {userBlock}
            </Link>
          ) : (
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">{userBlock}</div>
          )}
        </div>
      </div>
    </header>
  );
}
