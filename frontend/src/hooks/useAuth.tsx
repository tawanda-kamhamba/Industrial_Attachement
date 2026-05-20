import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { api, type LoginResponse, type AuthCheckResponse } from '@/services/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (role: User['role'], payload: { name?: string; staffId?: string; indexNumber?: string; password?: string }) => Promise<boolean>;
  applyLoggedInUser: (apiUser: NonNullable<LoginResponse['user']>) => void;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'iasms_user';

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function mapApiUserToUser(apiUser: NonNullable<LoginResponse['user']>): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    role: apiUser.role as User['role'],
    ...(apiUser.staffId && { staffId: apiUser.staffId }),
    ...(apiUser.indexNumber && { indexNumber: apiUser.indexNumber }),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (role: User['role'], payload: {
    name?: string;
    staffId?: string;
    indexNumber?: string;
    password?: string;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { role };
      if (role === 'student') {
        body.indexNumber = payload.indexNumber ?? '';
        body.password = payload.password ?? '';
      } else if (role === 'admin') {
        body.password = payload.password ?? '';
      } else if (role === 'supervisor') {
        body.staffId = payload.staffId ?? '';
        body.password = payload.password ?? '';
      }
      const res = await api.post<LoginResponse>('/auth/login', body);
      if (res.success && res.user) {
        const u = mapApiUserToUser(res.user);
        setUser(u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        return true;
      }
      setError(res.error ?? 'Login failed');
      return false;
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : 'Login failed';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setLoading(false);
  }, []);

  const applyLoggedInUser = useCallback((apiUser: NonNullable<LoginResponse['user']>) => {
    const u = mapApiUserToUser(apiUser);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<AuthCheckResponse>('/auth/check');
      if (res.authenticated && res.user) {
        const u: User = {
          id: res.user.id,
          name: res.user.name,
          role: res.user.role as User['role'],
          ...(res.user.staffId && { staffId: res.user.staffId }),
          ...(res.user.indexNumber && { indexNumber: res.user.indexNumber }),
        };
        setUser(u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    } catch {
      // keep current user
    }
  }, []);

  // Restore session from backend on load (if backend responds with authenticated)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<AuthCheckResponse>('/auth/check');
        if (cancelled) return;
        if (res.authenticated && res.user) {
          const u: User = {
            id: res.user.id,
            name: res.user.name,
            role: res.user.role as User['role'],
            ...(res.user.staffId && { staffId: res.user.staffId }),
            ...(res.user.indexNumber && { indexNumber: res.user.indexNumber }),
          };
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        }
      } catch {
        // Keep existing localStorage user if backend unreachable
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, applyLoggedInUser, logout, clearError, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
