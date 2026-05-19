import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

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
}: TopBarProps) {
  const initial = displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : '?';

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

  const avatarContent = profilePhotoUrl ? (
    <img
      src={profilePhotoUrl}
      alt=""
      className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
      onError={(e) => {
        const el = e.currentTarget;
        el.style.display = 'none';
        const fallback = el.nextElementSibling as HTMLElement;
        if (fallback) fallback.style.display = 'flex';
      }}
    />
  ) : null;
  const avatarFallback = (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white"
      style={profilePhotoUrl ? { display: 'none' } : undefined}
    >
      {initial}
    </div>
  );

  const userBlock = (
    <>
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
        {avatarContent}
        {avatarFallback}
      </div>
      <span className="max-w-[120px] truncate text-sm font-medium text-slate-700">
        {displayName}
      </span>
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
      } flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-card`}
    >
      <div className="flex shrink-0 items-center">
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
        )}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
            &#8981;
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
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
            <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
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
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="Help"
          aria-label="Help"
        >
          ?
        </button>
        <div className="flex items-center gap-2 pl-2">
          {profileLink ? (
            <Link
              to={profileLink}
              className="flex items-center gap-2 rounded-lg py-1 pr-1 transition hover:bg-slate-100"
              title="Edit profile"
            >
              {userBlock}
            </Link>
          ) : (
            <div className="flex items-center gap-2">{userBlock}</div>
          )}
        </div>
      </div>
    </header>
  );
}
