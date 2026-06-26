'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Role = 'GENERAL' | 'STAFF' | 'ADMIN' | 'GUEST';
export type User = { username: string; role: Role };

export const ROLE_LABEL: Record<Role, string> = { GENERAL: '일반', STAFF: '관계자', ADMIN: '관리자', GUEST: '게스트' };
// GUEST는 메뉴/권한 게이트상 관계자(STAFF)와 같은 등급 — 조회는 가능, 관리자(ADMIN) 기능만 차단.
const ROLE_RANK: Record<Role, number> = { GENERAL: 1, STAFF: 2, ADMIN: 3, GUEST: 2 };
export const hasRole = (user: User | null, min: Role) => !!user && ROLE_RANK[user.role] >= ROLE_RANK[min];

const TOKEN_KEY = 'sv_token';
const USER_KEY = 'sv_user';
export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);

// 마지막 로그인 사용자 캐시 — 재방문 시 서버 응답을 기다리지 않고 즉시 렌더(곧 서버 검증으로 보정).
function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
function writeUser(u: User | null) {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  loginGuest: () => Promise<void>;
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
    // 1) 캐시된 사용자가 있으면 즉시 렌더(들어가자마자 화면 표시) — 서버 응답을 기다리지 않음
    const cached = readUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }
    // 2) 백그라운드로 토큰 검증·사용자 정보 갱신
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } });
        if (!res.ok) throw new Error();
        const d = await res.json();
        const u: User = { username: d.username, role: d.role };
        setUser(u);
        writeUser(u);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        writeUser(null);
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
    const me: User = { username: d.username, role: d.role };
    writeUser(me);
    setUser(me);
  }

  // 게스트(시연) 모드 — 비번 없이 진입. 서버가 차단/만료 시 다음 요청부터 막힘.
  async function loginGuest() {
    const res = await fetch('/api/auth/guest', { method: 'POST' });
    if (!res.ok) throw new Error(await readError(res, '게스트 모드를 사용할 수 없습니다.'));
    const d = await res.json();
    localStorage.setItem(TOKEN_KEY, d.token);
    const me: User = { username: d.username, role: d.role };
    writeUser(me);
    setUser(me);
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
    writeUser(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, loginGuest, signup, logout }}>{children}</Ctx.Provider>;
}
