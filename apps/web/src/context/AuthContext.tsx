import type { UserRole } from '@soporteqr/shared';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { api, ApiError, setAccessToken } from '../lib/api';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  organizationId: string;
  locationId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .post<{ accessToken: string }>('/api/auth/refresh')
      .then(async (data) => {
        setAccessToken(data.accessToken);
        const me = await api.get<{ user: AuthUser }>('/api/auth/me');
        setUser(me.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string; user: AuthUser }>('/api/auth/login', {
      email,
      password,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, cargando, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
