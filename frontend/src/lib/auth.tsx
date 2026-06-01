'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Role = 'GENERAL' | 'STAFF' | 'ADMIN';
export type User = { username: string; role: Role };

export const ROLE_LABEL: Record<Role, string> = { GENERAL: '일반', STAFF: '관계자', ADMIN: '관리자' };
const ROLE_RANK: Record<Role, number> = { GENERAL: 1, STAFF: 2, ADMIN: 3 };
export const hasRole = (user: User | null, min: Role) => !!user && ROLE_RANK[user.role] >= ROLE_RANK[min];

const TOKEN_KEY = 'sv_token';
export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  signup: (u: string, p: string) => Promise<void>;
  logout: () => void;
};
const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
};

async function readError(res: Response, fallback: string) {
  try {
    const e = await res.json();
    return e?.message || fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } });
        if (!res.ok) throw new Error();
        const d = await res.json();
        setUser({ username: d.username, role: d.role });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(u: string, p: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    });
    if (!res.ok) throw new Error(await readError(res, '로그인에 실패했습니다.'));
    const d = await res.json();
    localStorage.setItem(TOKEN_KEY, d.token);
    setUser({ username: d.username, role: d.role });
  }

  async function signup(u: string, p: string) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    });
    if (!res.ok) throw new Error(await readError(res, '회원가입에 실패했습니다.'));
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
}
